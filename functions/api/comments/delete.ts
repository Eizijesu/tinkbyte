// functions/api/comments/delete.ts
import { supabase } from '../../../src/lib/supabase.js';

export async function onRequestDelete(context: any) {
  const { request } = context;
  
  try {
    // Get comment ID from URL params
    const url = new URL(request.url);
    const commentId = url.searchParams.get('id');
    
    if (!commentId) {
      return new Response(JSON.stringify({ error: 'Comment ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    
    // Verify the user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user owns the comment
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (comment.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized to delete this comment' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Soft delete the comment
    const { error: deleteError } = await supabase
      .from('comments')
      .update({ 
        is_deleted: true, 
        content: '[deleted]',
        updated_at: new Date().toISOString(),
        deleted_by: user.id,
        deleted_at: new Date().toISOString()
      })
      .eq('id', commentId);

    if (deleteError) {
      return new Response(JSON.stringify({ error: 'Failed to delete comment' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}