// src/lib/helpers/commentHelpers.ts - SSR/ISR optimized
import { COMMENT_CONFIG, THREAD_COLORS, REACTION_TYPES } from '../config/comments';
import type { CommentWithProfile } from '../types/comments';
import { supabase } from '../supabase';
import { checkRateLimit } from '../utils/rateLimiter';

/**
 * Build nested comment tree from flat comment array
 * Optimized for SSR with proper error handling
 */
export function buildCommentTree(comments: CommentWithProfile[]): CommentWithProfile[] {
  if (!comments || comments.length === 0) return [];

  const map = new Map<string, CommentWithProfile>();
  const roots: CommentWithProfile[] = [];

  // Initialize all comments with normalized structure
  comments.forEach(comment => {
    const normalized: CommentWithProfile = {
      ...comment,
      // Ensure required fields
      thread_level: comment.thread_level ?? 0,
      status: comment.status || comment.moderation_status || 'approved',
      moderation_status: comment.moderation_status || comment.status || 'approved',
      like_count: comment.like_count || 0,
      is_edited: comment.is_edited || false,
      is_deleted: comment.is_deleted || false,
      
      // Initialize arrays
      replies: [],
      comment_reactions: comment.comment_reactions || [],
      comment_likes: comment.comment_likes || [],
      comment_bookmarks: comment.comment_bookmarks || [],
      
      // Ensure profile data is properly structured
      profiles: comment.profiles || null,
      user_profile: comment.user_profile || comment.profiles || null,
      
      // Initialize computed fields
      reaction_counts: comment.reaction_counts || {},
      reply_count: comment.reply_count || 0,
      
      // User interaction states (will be updated client-side)
      is_comment_liked: comment.is_comment_liked || false,
      is_comment_saved: comment.is_comment_saved || false,
      is_comment_bookmarked: comment.is_comment_bookmarked || false,
      is_liked: comment.is_liked || false,
      is_saved: comment.is_saved || false,
      is_bookmarked: comment.is_bookmarked || false,
      
      // Permission flags (will be computed client-side based on auth)
      can_edit: comment.can_edit || false,
      can_delete: comment.can_delete || false,
      can_reply: comment.can_reply !== false, // Default to true unless explicitly false
    };
    
    map.set(comment.id, normalized);
  });

  // Build tree structure
  comments.forEach(comment => {
    const commentWithReplies = map.get(comment.id);
    if (!commentWithReplies) return;

    if (comment.parent_id && map.has(comment.parent_id)) {
      const parent = map.get(comment.parent_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(commentWithReplies);
        parent.reply_count = parent.replies.length;
      }
    } else {
      roots.push(commentWithReplies);
    }
  });

  // Sort root comments: pinned first, then newest
  roots.sort((a, b) => {
    // Pinned comments first
    if (a.is_pinned !== b.is_pinned) {
      return a.is_pinned ? -1 : 1;
    }
    // Then by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Sort replies recursively (oldest first for conversation flow)
  function sortReplies(node: CommentWithProfile) {
    if (node.replies?.length) {
      node.replies.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      node.replies.forEach(sortReplies);
    }
  }
  
  roots.forEach(sortReplies);
  return roots;
}

/**
 * Format date for display - SSR safe
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'unknown';
  }
}

/**
 * Format comment content with markdown-like syntax
 */
export function formatContent(content: string): string {
  if (!content) return '';
  
  const mentionPattern = /@(\w+)/g;
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(mentionPattern, '<span class="mention">@$1</span>')
    .replace(/\n/g, "<br>");
}

/**
 * Get user avatar URL - SSR safe
 */
export function getUserAvatar(input: any): string {
  const profile = input?.profiles || input?.user_profile || input;

  if (profile?.avatar_type === "uploaded" && profile.avatar_url) {
    return profile.avatar_url;
  }
  
  if (profile?.avatar_type === "google" && profile.avatar_url) {
    return profile.avatar_url;
  }

  // Fallback to preset avatar
  const presetId = profile?.avatar_preset_id || 1;
  return `/images/avatars/preset-${presetId}.svg`;
}

/**
 * Get user display name - SSR safe
 */
export function getUserDisplayName(comment: CommentWithProfile): string {
  const profile = comment.profiles || comment.user_profile;
  
  return profile?.display_name || 
         comment.display_name || 
         comment.guest_name || 
         'Anonymous User';
}

/**
 * Get reaction icon from type
 */
export function getReactionIcon(type: string): string {
  return REACTION_TYPES[type as keyof typeof REACTION_TYPES]?.emoji || "👍";
}

/**
 * Get reaction label from type
 */
export function getReactionLabel(type: string): string {
  return REACTION_TYPES[type as keyof typeof REACTION_TYPES]?.label || type;
}

/**
 * Check if user can reply to comment
 */
export function canReply(comment: CommentWithProfile): boolean {
  if (comment.is_deleted) return false;
  return (comment.thread_level || 0) < COMMENT_CONFIG.maxThreadDepth;
}

/**
 * Check if comment should be collapsed by default
 */
export function shouldCollapse(comment: CommentWithProfile): boolean {
  return (comment.thread_level || 0) >= COMMENT_CONFIG.collapseAfter;
}

/**
 * Check if user can edit comment - will be enhanced client-side
 */
export function canUserEdit(comment: CommentWithProfile, currentUserId?: string): boolean {
  if (!COMMENT_CONFIG.allowEdit) return false;
  if (!currentUserId || !comment.user_id) return false;
  if (comment.user_id !== currentUserId) return false;
  if (comment.is_deleted) return false;
  
  try {
    const commentDate = new Date(comment.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - commentDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff <= COMMENT_CONFIG.editWindowHours;
  } catch (error) {
    console.error('Error checking edit permissions:', error);
    return false;
  }
}

/**
 * Check if user can delete comment
 */
export function canUserDelete(comment: CommentWithProfile, currentUserId?: string): boolean {
  if (!COMMENT_CONFIG.allowDelete) return false;
  return canUserEdit(comment, currentUserId);
}

/**
 * Extract mentions from comment content
 */
export function extractMentions(content: string): string[] {
  if (!content) return [];
  
  const mentionPattern = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionPattern.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)].slice(0, COMMENT_CONFIG.MENTIONS?.MAX_MENTIONS_PER_COMMENT || 5);
}

/**
 * Validate comment content
 */
export function validateComment(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!content || !content.trim()) {
    errors.push('Comment cannot be empty');
    return { isValid: false, errors };
  }
  
  const trimmedContent = content.trim();
  
  if (trimmedContent.length < COMMENT_CONFIG.characterLimits.min) {
    errors.push(`Comment must be at least ${COMMENT_CONFIG.characterLimits.min} characters`);
  }
  
  if (trimmedContent.length > COMMENT_CONFIG.characterLimits.max) {
    errors.push(`Comment cannot exceed ${COMMENT_CONFIG.characterLimits.max} characters`);
  }
  
  // Check caps percentage
  if (COMMENT_CONFIG.VALIDATION?.MAX_CAPS_PERCENTAGE) {
    const upperCaseCount = (trimmedContent.match(/[A-Z]/g) || []).length;
    const letterCount = (trimmedContent.match(/[A-Za-z]/g) || []).length;
    const capsPercentage = letterCount > 0 ? upperCaseCount / letterCount : 0;
    
    if (capsPercentage > COMMENT_CONFIG.VALIDATION.MAX_CAPS_PERCENTAGE) {
      errors.push('Please reduce the amount of capital letters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get thread color based on level
 */
export function getThreadColor(level: number, theme: 'light' | 'dark' = 'dark'): string {
  const colors = THREAD_COLORS[theme] || THREAD_COLORS.dark;
  return colors[Math.min(level, colors.length - 1)] || colors[0];
}

/**
 * Check if on mobile device - SSR safe
 */
export function isMobileDevice(): boolean {
  // SSR safe check
  if (typeof window === 'undefined') return false;
  
  try {
    return window.innerWidth <= 768;
  } catch (error) {
    return false;
  }
}

/**
 * Get device-appropriate configuration
 */
export function getDeviceConfig() {
  const mobile = isMobileDevice();
  
  return {
    maxDepth: mobile ? (COMMENT_CONFIG.mobile?.maxThreadDepth || 2) : COMMENT_CONFIG.maxThreadDepth,
    pageSize: mobile ? (COMMENT_CONFIG.mobile?.pageSize || 8) : COMMENT_CONFIG.pageSize,
    initialLoad: mobile ? (COMMENT_CONFIG.mobile?.initialLoad || 15) : COMMENT_CONFIG.initialLoad,
    hideDeepThreads: mobile && COMMENT_CONFIG.mobile?.hideDeepThreads
  };
}

/**
 * Get contextual page size based on device and context
 */
export function getContextualPageSize(isMobile: boolean, isDeepThread: boolean = false): number {
  if (isMobile) {
    return isDeepThread ? 
      (COMMENT_CONFIG.mobile?.repliesPageSize || 5) : 
      (COMMENT_CONFIG.mobile?.pageSize || 8);
  }
  
  return isDeepThread ? 
    COMMENT_CONFIG.repliesPageSize : 
    COMMENT_CONFIG.pageSize;
}

/**
 * Get comment depth styling
 */
export function getCommentDepthStyle(level: number): { marginLeft: string; borderLeft?: string } {
  const maxVisualDepth = 5;
  const effectiveLevel = Math.min(level, maxVisualDepth);
  const marginLeft = `${effectiveLevel * 20}px`;
  
  if (level > 0) {
    return {
      marginLeft,
      borderLeft: `2px solid ${getThreadColor(level - 1)}`
    };
  }
  
  return { marginLeft };
}

/**
 * Check if comment should be auto-collapsed
 */
export function shouldAutoCollapse(comment: CommentWithProfile): boolean {
  return (comment.thread_level || 0) >= COMMENT_CONFIG.collapseAfter;
}

/**
 * Get moderation status based on user reputation
 */
export function getModerationStatus(userReputation: number, isGuest: boolean = false): string {
  if (isGuest) return 'pending';
  
  if (userReputation >= 1000) return 'auto_approved';
  if (userReputation >= 100) return 'approved';
  return 'pending';
}

/**
 * Check if comment should be auto-approved
 */
export function shouldAutoApprove(userReputation: number = 0): boolean {
  if (!COMMENT_CONFIG.autoApprove) return false;
  
  const highRepThreshold = COMMENT_CONFIG.MODERATION?.AUTO_APPROVE_HIGH_REP || 1000;
  const normalThreshold = COMMENT_CONFIG.MODERATION?.AUTO_APPROVE_THRESHOLD || 100;
  
  return userReputation >= normalThreshold;
}

/**
 * Get edit reasons from config
 */
export function getEditReasons(): string[] {
  return COMMENT_CONFIG.editReasons || [
    'Fix typo',
    'Clarify meaning', 
    'Add information',
    'Remove sensitive info',
    'Other'
  ];
}

/**
 * Rate limiting check - SSR safe
 */
export async function checkCommentRateLimit(
  userId: string
): Promise<{ allowed: boolean; retryAfter?: number; remaining?: number }> {
  try {
    const result = await checkRateLimit(userId, 'comment');
    return {
      allowed: result.allowed,
      retryAfter: result.retryAfter,
      remaining: result.remaining
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Default to allowing if rate limiter fails (graceful degradation)
    return { allowed: true };
  }
}

/**
 * Get user tier for moderation - SSR safe
 */
export async function getUserTierForModeration(userId: string): Promise<'free' | 'premium' | 'admin'> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('membership_type, is_admin, reputation_score')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    if (profile?.is_admin) return 'admin';
    if (profile?.membership_type === 'premium') return 'premium';
    return 'free';
  } catch (error) {
    console.error('Failed to get user tier:', error);
    return 'free';
  }
}

/**
 * Safe window access utility for SSR
 */
export function safeWindowAccess<T>(callback: () => T, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  
  try {
    return callback();
  } catch (error) {
    console.warn('Window access failed:', error);
    return fallback;
  }
}

/**
 * Process reaction counts from raw reaction data
 */
export function processReactionCounts(reactions: Array<{ reaction_type: string; user_id: string }>): Record<string, number> {
  const counts: Record<string, number> = {};
  reactions.forEach(reaction => {
    counts[reaction.reaction_type] = (counts[reaction.reaction_type] || 0) + 1;
  });
  return counts;
}

/**
 * Sort comments with proper ordering
 */
export function sortComments(comments: CommentWithProfile[], sortBy: 'newest' | 'oldest' | 'popular' = 'newest'): CommentWithProfile[] {
  return comments.sort((a, b) => {
    // Pinned comments always come first
    if (a.is_pinned !== b.is_pinned) {
      return a.is_pinned ? -1 : 1;
    }
    
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'popular':
        return (b.like_count || 0) - (a.like_count || 0);
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
}

/**
 * Get initial load count based on device
 */
export function getInitialLoadCount(isMobile: boolean = false): number {
  if (isMobile && COMMENT_CONFIG.mobile?.initialLoad) {
    return COMMENT_CONFIG.mobile.initialLoad;
  }
  return COMMENT_CONFIG.initialLoad;
}

/**
 * Get page size based on device
 */
export function getPageSize(isMobile: boolean = false): number {
  if (isMobile && COMMENT_CONFIG.mobile?.pageSize) {
    return COMMENT_CONFIG.mobile.pageSize;
  }
  return COMMENT_CONFIG.pageSize;
}

/**
 * Initialize comment helpers - client-side only
 */
export function initializeCommentHelpers() {
  // Only run on client-side
  if (typeof window === 'undefined') return;
  
  // Initialize any client-side only features
  console.log('Comment helpers initialized for client-side');
}