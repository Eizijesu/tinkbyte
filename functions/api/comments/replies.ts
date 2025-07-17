// functions/api/comments/replies.ts
import { supabase } from '../../../src/lib/supabase.js';

export async function onRequestGet(context: any) {
  const { request } = context;
  
  try {
    const url = new URL(request.url);
    const commentId = url.searchParams.get('comment_id');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    if (!commentId) {
      return new Response(JSON.stringify({ error: 'Comment ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const offset = (page - 1) * limit;

    const { data: replies, error, count } = await supabase
      .from('comments')
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
      `, { count: 'exact' })
      .eq('parent_id', commentId)
      .eq('is_deleted', false)
      .in('moderation_status', ['approved', 'auto_approved'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Fetch replies error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch replies' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: replies || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: count ? offset + limit < count : false
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Replies API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
