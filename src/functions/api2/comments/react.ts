import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { comment_id, reaction_type } = body;
    
    if (!comment_id || !reaction_type) {
      return new Response(JSON.stringify({ error: 'Comment ID and reaction type are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validReactions = ['helpful', 'insightful', 'great', 'love', 'thinking'];
    if (!validReactions.includes(reaction_type)) {
      return new Response(JSON.stringify({ error: 'Invalid reaction type' }), {
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

    // Check if user already reacted with this type
    const { data: existingReaction } = await supabase
      .from('comment_reactions')
      .select('id')
      .eq('comment_id', comment_id)
      .eq('user_id', user.id)
      .eq('reaction_type', reaction_type)
      .single();

    let added = false;
    
    if (existingReaction) {
      // Remove existing reaction
      await supabase
        .from('comment_reactions')
        .delete()
        .eq('id', existingReaction.id);
    } else {
      // Add new reaction
      await supabase
        .from('comment_reactions')
        .insert({
          comment_id,
          user_id: user.id,
          reaction_type
        });
      added = true;
    }

    // Update reaction counts in comments table
    const { data: reactionCounts } = await supabase
      .from('comment_reactions')
      .select('reaction_type')
      .eq('comment_id', comment_id);

    const counts = {};
    reactionCounts?.forEach(reaction => {
      counts[reaction.reaction_type] = (counts[reaction.reaction_type] || 0) + 1;
    });

    await supabase
      .from('comments')
      .update({ reaction_counts: counts })
      .eq('id', comment_id);

    // Create notification for comment author
    if (added) {
      const { data: comment } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', comment_id)
        .single();

      if (comment && comment.user_id !== user.id) {
        await supabase.from('comment_notifications').insert({
          user_id: comment.user_id,
          comment_id: comment_id,
          notification_type: 'reaction'
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      added,
      count: counts[reaction_type] || 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('React to comment error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};