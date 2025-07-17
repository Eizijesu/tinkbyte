// src/pages/api/comments/list.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { buildCommentTree } from '../../../lib/helpers/commentHelpers';
import type { CommentsListResponse, CommentWithProfile } from '../../../lib/types/comments';

export const GET: APIRoute = async ({ url }) => {
  try {
    const articleId = url.searchParams.get('articleId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const sort = url.searchParams.get('sort') || 'newest';
    
    console.log('Article ID received:', articleId);
    
    if (!articleId) {
      return new Response(JSON.stringify({ error: 'Article ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    let query = supabase.rpc('get_comments_with_stats', { article_slug: articleId });
    
    // Apply sorting
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'most_liked':
        query = query.order('like_count', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    const { data: comments, error, count } = await query;
    
    if (error) {
      console.error('Comments fetch error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch comments' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Transform data to include profile information
    const commentsWithProfile: CommentWithProfile[] = comments?.map(comment => ({
      id: comment.id,
      article_id: comment.article_id,
      user_id: comment.user_id,
      parent_id: comment.parent_id,
      content: comment.content,
      is_edited: comment.is_edited,
      like_count: comment.like_count,
      reaction_counts: comment.reaction_counts || {},
      thread_level: comment.thread_level,
      moderation_status: comment.moderation_status,
      auto_approved_reason: comment.auto_approved_reason,
      mention_users: comment.mention_users || [],
      is_pinned: comment.is_pinned,
      quality_score: comment.quality_score,
      reply_to_user_id: comment.reply_to_user_id,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      is_deleted: comment.is_deleted,
      profiles: {
        display_name: comment.display_name,
        avatar_type: comment.avatar_type,
        avatar_preset_id: comment.avatar_preset_id,
        avatar_url: comment.avatar_url,
        reputation_score: comment.reputation_score,
        membership_type: comment.membership_type,
        is_admin: comment.is_admin || false
      }
    })) || [];
    
    // Build comment tree for threaded display
    const commentTree = buildCommentTree(commentsWithProfile);
    
    const response: CommentsListResponse = {
      success: true,
      data: commentTree,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: count ? offset + limit < count : false
      }
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Comments API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};