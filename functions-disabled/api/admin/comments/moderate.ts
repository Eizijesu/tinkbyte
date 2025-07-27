// functions/api/admin/comments/moderate.ts
import { supabase } from '../../../../src/lib/supabase.js';

interface ModerationData {
  comment_id: string;
  action: string;
  reason?: string;
}

export async function onRequestPost(context: any) {
  const { request } = context;
  
  try { // <-- ADD THIS TRY BLOCK
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify admin session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { comment_id, action, reason } = await request.json() as ModerationData;

    if (!comment_id || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Map actions to moderation statuses
    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'hidden',
      flag: 'flagged'
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update comment status
    const { error: updateError } = await supabase
      .from('comments')
      .update({
        moderation_status: newStatus,
        moderation_reason: reason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', comment_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log moderation action
    await supabase
      .from('comment_moderation')
      .insert({
        comment_id,
        moderator_id: user.id,
        action,
        reason,
        created_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({
      success: true,
      message: `Comment ${action}ed successfully`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error moderating comment:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}