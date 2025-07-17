// functions/api/comments/list.ts
import { supabase } from '../../../src/lib/supabase.js';
import { buildCommentTree } from '../../../src/lib/helpers/commentHelpers.js';
import type { CommentsListResponse, CommentWithProfile } from '../../../src/lib/types/comments.js';

export async function onRequestGet(context: any) {
  const { request } = context;
  
  try {
    const url = new URL(request.url);
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
    
    let query = supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id(
          id,
          display_name,
          avatar_type,
          avatar_preset_id,
          avatar_url,
          reputation_score,
          is_admin,
          membership_type
        ),
        comment_reactions(
          reaction_type,
          user_id
        ),
        comment_likes(
          user_id
        ),
        comment_bookmarks(
          user_id
        )
      `)
      .eq('article_id', articleId)
      .eq('is_deleted', false)
      .in('moderation_status', ['approved', 'auto_approved']);

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
    const commentsWithProfile: CommentWithProfile[] = comments?.map((comment: any) => ({
      id: comment.id,
      article_id: comment.article_id,
      user_id: comment.user_id,
      parent_id: comment.parent_id,
      content: comment.content,
      guest_name: comment.guest_name,
      guest_email: comment.guest_email,
      is_edited: comment.is_edited,
      is_deleted: comment.is_deleted,
      like_count: comment.like_count,
      comment_count: comment.reply_count,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      thread_level: comment.thread_level,
      status: comment.moderation_status, // Map moderation_status to status
      moderation_status: comment.moderation_status,
      moderation_reason: comment.moderation_reason,
      edit_reason: comment.edit_reason,
      reply_to_author: comment.reply_to_author,
      reply_to_content: comment.reply_to_content,
      reply_to_user: comment.reply_to_user,
      reply_to_user_id: comment.reply_to_user_id,
      deleted_at: comment.deleted_at,
      deleted_by: comment.deleted_by,
      
      // Profile data
      profiles: comment.profiles ? {
        id: comment.profiles.id,
        display_name: comment.profiles.display_name,
        avatar_type: comment.profiles.avatar_type,
        avatar_preset_id: comment.profiles.avatar_preset_id,
        avatar_url: comment.profiles.avatar_url,
        reputation_score: comment.profiles.reputation_score,
        is_admin: comment.profiles.is_admin || false
      } : undefined,
      
      // Alternative profile field names for compatibility
      user_profile: comment.profiles ? {
        id: comment.profiles.id,
        display_name: comment.profiles.display_name,
        avatar_type: comment.profiles.avatar_type,
        avatar_preset_id: comment.profiles.avatar_preset_id,
        avatar_url: comment.profiles.avatar_url,
        reputation_score: comment.profiles.reputation_score,
        is_admin: comment.profiles.is_admin || false
      } : undefined,

      // Reaction data
      user_reaction: null, // Would need to be calculated based on current user
      comment_reactions: comment.comment_reactions || [],
      
      // User interaction states
      comment_likes: comment.comment_likes || [],
      reaction_counts: comment.reaction_counts || {},
      comment_saves: [],
      comment_bookmarks: comment.comment_bookmarks || [],

      // User interaction flags
      is_comment_liked: false, // Would need to be calculated based on current user
      is_comment_saved: false,
      is_comment_bookmarked: false,
      is_liked: false,
      is_saved: false,
      is_bookmarked: false,
      
      // Threading
      replies: [], // Will be populated by buildCommentTree
      reply_count: comment.reply_count || 0,
      has_more_replies: false,
      is_collapsed: false,
      
      // Display fields (for backward compatibility)
      display_name: comment.profiles?.display_name || comment.guest_name,
      avatar_type: comment.profiles?.avatar_type,
      avatar_preset_id: comment.profiles?.avatar_preset_id,
      avatar_url: comment.profiles?.avatar_url,
      reputation_score: comment.profiles?.reputation_score || 0,
      is_admin: comment.profiles?.is_admin || false,
      
      // Moderation
      auto_approved_reason: comment.auto_approved_reason,
      is_pinned: comment.is_pinned || false,
      quality_score: comment.quality_score || 0,
      mention_users: comment.mention_users || [],
      
      // Helper fields
      user_tier: comment.profiles?.membership_type || 'free',
      can_edit: false, // Would need to be calculated based on current user
      can_delete: false, // Would need to be calculated based on current user
      can_reply: (comment.thread_level || 0) < 4,
      depth: comment.thread_level || 0,
      path: comment.path || []
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
}