//src/pages/api/comments/history.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const commentId = url.searchParams.get('commentId');

    if (!commentId) {
      return new Response(JSON.stringify({ 
        error: 'Comment ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(commentId)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid comment ID format' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user from session
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the user owns this comment or is admin
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('user_id, created_at')
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single();

    if (commentError || !comment) {
      console.error('Comment verification error:', commentError);
      return new Response(JSON.stringify({ 
        error: 'Comment not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin
    let isAdmin = false;
    if (user.id !== comment.user_id) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      isAdmin = userProfile?.is_admin || false;
    }

    const isOwner = comment.user_id === user.id;

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ 
        error: 'You can only view edit history for your own comments' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get edit history with separate profile queries
    const { data: history, error: historyError } = await supabase
      .from('comment_edit_history')
      .select(`
        id,
        comment_id,
        user_id,
        original_content,
        new_content,
        edit_reason,
        created_at
      `)
      .eq('comment_id', commentId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (historyError) {
      console.error('History fetch error:', historyError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch edit history',
        details: historyError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get profile data for each edit
    const transformedHistory = await Promise.all(
      (history || []).map(async (entry: any, index: number) => {
        // Get profile for this edit
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_type, avatar_preset_id, avatar_url, is_admin')
          .eq('id', entry.user_id)
          .single();
        
        return {
          id: entry.id,
          comment_id: entry.comment_id,
          original_content: entry.original_content,
          new_content: entry.new_content,
          edit_reason: entry.edit_reason || 'No reason provided',
          created_at: entry.created_at,
          editor: {
            id: profile?.id || '',
            display_name: profile?.display_name || 'Unknown User',
            avatar_type: profile?.avatar_type || 'preset',
            avatar_preset_id: profile?.avatar_preset_id || 1,
            avatar_url: profile?.avatar_url || null,
            is_admin: profile?.is_admin || false
          },
          edit_number: (history?.length || 0) - index,
          content_length_change: entry.new_content.length - entry.original_content.length,
          is_recent: new Date(entry.created_at).getTime() > Date.now() - (24 * 60 * 60 * 1000)
        };
      })
    );

    const canEdit = isOwner && new Date(comment.created_at).getTime() > Date.now() - (24 * 60 * 60 * 1000);

    return new Response(JSON.stringify({
      success: true,
      data: transformedHistory,
      meta: {
        total_edits: transformedHistory.length,
        comment_id: commentId,
        can_edit: canEdit
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-cache'
      }
    });

  } catch (error) {
    console.error('Edit history error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};