// src/pages/api/comments/create.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { COMMENT_CONFIG } from '../../../lib/config/comments';

export const prerender = false;

// Enhanced content moderation function
function moderateContent(content: string, isAuthenticated: boolean): {
  status: 'approved' | 'pending' | 'flagged';
  reason?: string;
} {
  const flaggedWords = ['spam', 'scam', 'fake'];
  const lowerContent = content.toLowerCase();
  
  // Check for flagged words
  for (const word of flaggedWords) {
    if (lowerContent.includes(word)) {
      return { status: 'flagged', reason: 'Contains flagged content' };
    }
  }
  
  // Auto-approve common short responses
  const commonShortResponses = ['hi', 'hello', 'thanks', 'thank you', 'ok', 'yes', 'no', 'cool', 'nice', 'wow'];
  if (commonShortResponses.includes(lowerContent)) {
    return { status: 'approved' };
  }
  
  // Auto-approve any short comment ≤ 5 characters
  if (content.length <= 5) {
    return { status: 'approved' };
  }
  
  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 50) {
    return { status: 'pending', reason: 'Excessive capitalization' };
  }
  
  // Check for excessive punctuation
  const punctuationRatio = (content.match(/[!?]{2,}/g) || []).length;
  if (punctuationRatio > 3) {
    return { status: 'pending', reason: 'Excessive punctuation' };
  }
  
  // Auto-approve authenticated users, pending for guests
  return { status: isAuthenticated ? 'approved' : 'pending' };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { content, article_id, parent_id, guest_name, guest_email } = body;
    
    console.log('Received comment data:', { content, article_id, parent_id, guest_name, guest_email });
    
    // Validate required fields
    if (!content?.trim() || !article_id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Content and article ID are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate content length
    const trimmedContent = content.trim();
    if (trimmedContent.length < COMMENT_CONFIG.characterLimits.min) {
      return new Response(JSON.stringify({ 
        success: false,
        error: `Comment must be at least ${COMMENT_CONFIG.characterLimits.min} characters` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (trimmedContent.length > COMMENT_CONFIG.characterLimits.max) {
      return new Response(JSON.stringify({ 
        success: false,
        error: `Comment must be less than ${COMMENT_CONFIG.characterLimits.max} characters` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get auth token and user
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    let user: any = null;
    let userProfile: any = null;
    let isAuthenticated = false;

    if (token) {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
        
        if (!authError && authUser) {
          user = authUser;
          isAuthenticated = true;
          
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          userProfile = profile;
        }
      } catch (authError) {
        console.error("Auth error:", authError);
      }
    }

    // For guests, require name
    if (!isAuthenticated) {
      if (!guest_name || guest_name.trim() === '') {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Name is required for guest comments' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (guest_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest_email)) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Invalid email format' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Calculate thread level if replying - Let the database trigger handle this
    let threadLevel = 0;
    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('thread_level, is_deleted, moderation_status')
        .eq('id', parent_id)
        .single();

      if (parentError || !parentComment) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Parent comment not found' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (parentComment.is_deleted || !['approved', 'auto_approved'].includes(parentComment.moderation_status)) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Cannot reply to this comment' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Calculate thread level (the trigger will also set this, but we calculate for validation)
      threadLevel = Math.min((parentComment.thread_level || 0) + 1, COMMENT_CONFIG.maxThreadDepth);
      
      if (threadLevel > COMMENT_CONFIG.maxThreadDepth) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Maximum thread depth reached' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Apply content moderation
    const moderation = moderateContent(trimmedContent, isAuthenticated);
    console.log('Moderation result:', moderation);

    // Prepare insert data - simplified for static site
    const insertData = {
      content: trimmedContent,
      article_id: article_id,
      parent_id: parent_id || null,
      // Don't set thread_level here - let the database trigger handle it
      moderation_status: moderation.status === 'approved' ? 'auto_approved' : moderation.status,
      auto_approved_reason: moderation.status === 'approved' ? 'Auto-approved by content filter' : null,
      moderation_reason: moderation.reason || null,
      is_deleted: false,
      is_edited: false,
      like_count: 0,
      is_pinned: false,
      quality_score: isAuthenticated ? 50 : 25,
      reaction_counts: {},
      mention_users: [],
      user_id: isAuthenticated ? user.id : null,
      guest_name: isAuthenticated ? null : guest_name?.trim(),
      guest_email: isAuthenticated ? null : guest_email?.trim(),
      status: moderation.status === 'approved' ? 'approved' : moderation.status,
      reply_count: 0
    };

    console.log('Inserting comment:', insertData);

    // Insert comment
    const { data: comment, error: insertError } = await supabase
      .from('comments')
      .insert(insertData)
      .select(`
        *,
        profiles:user_id(
          id,
          display_name,
          avatar_type,
          avatar_preset_id,
          avatar_url,
          is_admin,
          reputation_score
        )
      `)
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to create comment',
        details: insertError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update parent comment reply count if this is a reply
    if (parent_id) {
      try {
        await supabase.rpc('increment_reply_count', {
          comment_id: parent_id
        });
      } catch (error) {
        console.error('Failed to update reply count:', error);
        // Don't fail the request if this fails
      }
    }

    // Handle profiles array properly in response
    const profiles = Array.isArray(comment.profiles) 
      ? comment.profiles[0] 
      : comment.profiles;

    // Prepare response data
    const responseData = {
      ...comment,
      user_profile: profiles || null
    };

    // Remove the profiles array from response
    delete responseData.profiles;

    // Dynamic message based on moderation status
    let message = '';
    let statusCode = 201;

    switch (moderation.status) {
      case 'approved':
        message = 'Comment posted successfully!';
        statusCode = 201;
        break;
      case 'pending':
        message = 'Comment submitted for review!';
        statusCode = 202;
        break;
      case 'flagged':
        message = 'Comment flagged for review.';
        statusCode = 202;
        break;
      default:
        message = isAuthenticated 
          ? 'Comment posted successfully!' 
          : 'Comment submitted for review!';
    }

    return new Response(JSON.stringify({
      success: true,
      data: responseData,
      message,
      moderation: {
        status: moderation.status,
        reason: moderation.reason
      }
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Comment creation error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};