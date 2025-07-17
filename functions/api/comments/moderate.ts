// functions/api/comments/moderate.ts
import { supabase } from '../../../src/lib/supabase.js';

// Define proper types
interface ModerationRequest {
  commentId?: string;
  commentIds?: string[];
  action: string;
  reason?: string;
}

export async function onRequestPost(context: any) {
  const { request } = context;
  try {
    const { commentId, commentIds, action, reason } = await request.json() as ModerationRequest;

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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle bulk or single comment moderation - FIX THE UNDEFINED ISSUE
    const idsToProcess: string[] = commentIds || (commentId ? [commentId] : []);
    
    if (idsToProcess.length === 0) {
      return new Response(JSON.stringify({ error: 'No comment IDs provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate action
    const validActions = ['approve', 'reject', 'flag', 'unflag', 'hide', 'delete', 'restore'];
    if (!validActions.includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid moderation action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process moderation action
    const updateData = getUpdateDataForAction(action);
    if (!updateData) {
      return new Response(JSON.stringify({ error: 'Invalid moderation action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update comments
    const { data: updatedComments, error: updateError } = await supabase
      .from('comments')
      .update(updateData)
      .in('id', idsToProcess)
      .select(`
        *,
        profiles!user_id(display_name, avatar_type, avatar_preset_id, avatar_url)
      `);

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update comments' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log moderation actions - FIX THE MAP FUNCTION
    const moderationLogs = idsToProcess.map((commentId: string) => ({
      comment_id: commentId,
      moderator_id: user.id,
      action: action,
      reason: reason || `${action} action`,
      created_at: new Date().toISOString()
    }));

    await supabase.from('comment_moderation').insert(moderationLogs);

    // Send notifications if approved
    if (action === 'approve' && updatedComments) {
      await queueApprovalNotifications(updatedComments);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `${idsToProcess.length} comment(s) ${action}d successfully`,
      data: updatedComments,
      action: action
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Moderation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestGet(context: any) {
  const { request } = context;
  
  try {
    // Parse URL for query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get comments for moderation
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!user_id(
          display_name,
          avatar_type,
          avatar_preset_id,
          avatar_url,
          reputation_score
        ),
        articles!article_id(title, slug)
      `)
      .eq('moderation_status', status)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Moderation queue fetch error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch moderation queue', 
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('comments')
      .select('id', { count: 'exact' })
      .eq('moderation_status', status)
      .eq('is_deleted', false);

    if (countError) {
      console.warn('Count query failed:', countError);
    }

    // Transform data
    const transformedComments = comments?.map(comment => ({
      ...comment,
      user_profile: comment.profiles,
      article: comment.articles
    })) || [];

    return new Response(JSON.stringify({
      success: true,
      data: transformedComments,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper functions
function getUpdateDataForAction(action: string): any | null {
  const actionMap: Record<string, any> = {
    'approve': { moderation_status: 'approved', is_deleted: false },
    'reject': { moderation_status: 'rejected', is_deleted: false },
    'flag': { moderation_status: 'flagged', is_deleted: false },
    'unflag': { moderation_status: 'approved', is_deleted: false },
    'hide': { moderation_status: 'hidden', is_deleted: false },
    'delete': { is_deleted: true, moderation_status: 'deleted' },
    'restore': { is_deleted: false, moderation_status: 'approved' }
  };

  return actionMap[action] || null;
}

async function queueApprovalNotifications(comments: any[]) {
  try {
    const notifications = comments
      .filter(comment => comment.user_id)
      .map(comment => ({
        user_id: comment.user_id,
        comment_id: comment.id,
        notification_type: 'approval',
        is_read: false,
        metadata: {
          message: 'Your comment has been approved and is now visible.',
          timestamp: new Date().toISOString()
        }
      }));

    if (notifications.length > 0) {
      await supabase.from('comment_notifications').insert(notifications);
    }
  } catch (error) {
    console.error('Failed to queue approval notifications:', error);
  }
}