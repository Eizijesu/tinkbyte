// functions/api/comments/vote.ts - MISSING
import { supabase } from '../../../src/lib/supabase';

export async function onRequestPost(context: any) {
  const { request } = context;
  try {
    const body = await request.json();
    const { comment_id, vote_type } = body;
    
    if (!comment_id || !vote_type) {
      return new Response(JSON.stringify({ error: 'Comment ID and vote type are required' }), {
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

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', comment_id)
      .eq('user_id', user.id)
      .single();

    let voted = false;
    let newLikeCount = 0;

    if (vote_type === 'up') {
      if (existingVote) {
        // Remove existing upvote
        await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingVote.id);
      } else {
        // Add upvote
        await supabase
          .from('comment_likes')
          .insert({
            comment_id,
            user_id: user.id
          });
        voted = true;
      }
    }

    // Get updated like count
    const { data: likeCount } = await supabase
      .from('comment_likes')
      .select('id', { count: 'exact' })
      .eq('comment_id', comment_id);

    newLikeCount = likeCount?.length || 0;

    // Update comment like count
    await supabase
      .from('comments')
      .update({ like_count: newLikeCount })
      .eq('id', comment_id);

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        like_count: newLikeCount,
        user_vote: voted ? 'up' : null
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Vote error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}