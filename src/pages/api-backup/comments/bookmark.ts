import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { comment_id } = body;
    
    if (!comment_id) {
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

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from('comment_bookmarks')
      .select('id')
      .eq('comment_id', comment_id)
      .eq('user_id', user.id)
      .single();

    let bookmarked = false;
    
    if (existingBookmark) {
      // Remove bookmark
      await supabase
        .from('comment_bookmarks')
        .delete()
        .eq('id', existingBookmark.id);
    } else {
      // Add bookmark
      await supabase
        .from('comment_bookmarks')
        .insert({
          comment_id,
          user_id: user.id
        });
      bookmarked = true;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      bookmarked
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Bookmark comment error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};