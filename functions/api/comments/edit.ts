// functions/api/comments/edit.ts
import { supabase } from '../../../src/lib/supabase.js';

interface EditCommentData {
  content: string;
  edit_reason?: string;
}

export async function onRequestPut(context: any) {
  const { request } = context;
  
  try {
    // Get comment ID from URL params
    const url = new URL(request.url);
    const commentId = url.searchParams.get('id');
    const body = await request.json() as EditCommentData;
    const { content, edit_reason } = body;
    
    if (!commentId || !content?.trim()) {
      return new Response(JSON.stringify({ error: 'Comment ID and content are required' }), {
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
      .select('user_id, content')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (comment.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized to edit this comment' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Store edit history
    const { error: historyError } = await supabase
      .from('comment_edit_history')
      .insert({
        comment_id: commentId,
        user_id: user.id,
        original_content: comment.content,
        new_content: content.trim(),
        edit_reason: edit_reason || null
      });

    if (historyError) {
      console.error('Failed to save edit history:', historyError);
    }

    // Update the comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({ 
        content: content.trim(),
        is_edited: true,
        edit_reason: edit_reason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to update comment' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: updatedComment 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Edit comment error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}