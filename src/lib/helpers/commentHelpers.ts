// src/lib/helpers/commentHelpers.ts - Fixed for static sites
import { COMMENT_CONFIG, THREAD_COLORS, REACTION_TYPES } from '../config/comments';
import type { CommentWithProfile } from '../types/comments';
import { supabase } from '../supabase';
import { checkRateLimit } from '../utils/rateLimiter';

export function buildCommentTree(comments: CommentWithProfile[]): CommentWithProfile[] {
  const commentMap = new Map<string, CommentWithProfile>();
  const rootComments: CommentWithProfile[] = [];
  
  // Get current max depth based on device
  const maxDepth = 4; // You can make this dynamic later
  
  // First pass: create map
  comments.forEach(comment => {
    const processedComment: CommentWithProfile = {
      ...comment,
      replies: [],
      thread_level: comment.thread_level || 0,
      is_collapsed: shouldAutoCollapse(comment),
      profiles: normalizeProfile(comment),
      reaction_counts: processReactionCounts(comment.comment_reactions || [])
    };
    commentMap.set(comment.id, processedComment);
  });

  // Second pass: build tree respecting max depth
  comments.forEach(comment => {
    const processedComment = commentMap.get(comment.id);
    if (!processedComment) return;

    if (comment.parent_id && (comment.thread_level || 0) < maxDepth) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(processedComment);
      } else {
        rootComments.push(processedComment);
      }
    } else {
      rootComments.push(processedComment);
    }
  });

  return sortComments(rootComments);
}

// Helper function to normalize profile data - FIXED: Single function with correct type
function normalizeProfile(comment: CommentWithProfile): {
  id: string;
  display_name: string;
  avatar_type: 'preset' | 'uploaded' | 'google';
  avatar_preset_id: number;
  avatar_url?: string;
  reputation_score: number;
  is_admin: boolean;
} {
  const profile = comment.profiles || comment.user_profile;
  
  if (profile && profile.display_name) {
    return {
      id: profile.id,
      display_name: profile.display_name,
      avatar_type: profile.avatar_type || 'preset',
      avatar_preset_id: profile.avatar_preset_id || 1,
      avatar_url: profile.avatar_url,
      reputation_score: profile.reputation_score || 0,
      is_admin: profile.is_admin || false
    };
  }
  
  return {
    id: comment.user_id || 'guest',
    display_name: comment.display_name || comment.guest_name || 'Anonymous',
    avatar_type: (comment.avatar_type as 'preset' | 'uploaded' | 'google') || 'preset',
    avatar_preset_id: comment.avatar_preset_id || 1,
    avatar_url: comment.avatar_url,
    reputation_score: comment.reputation_score || 0,
    is_admin: comment.is_admin || false
  };
}

function processReactionCounts(reactions: Array<{ reaction_type: string; user_id: string }>): Record<string, number> {
  const counts: Record<string, number> = {};
  reactions.forEach(reaction => {
    counts[reaction.reaction_type] = (counts[reaction.reaction_type] || 0) + 1;
  });
  return counts;
}

function sortComments(comments: CommentWithProfile[]): CommentWithProfile[] {
  // Sort root comments by pinned status, then by creation date
  comments.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) {
      return a.is_pinned ? -1 : 1;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Sort replies within each thread (oldest first for better conversation flow)
  comments.forEach(comment => {
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      // Recursively sort nested replies
      comment.replies = sortComments(comment.replies);
    }
  });

  return comments;
}

export function formatDate(dateString: string): string {
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
}

export function formatContent(content: string): string {
  const mentionPattern = /@(\w+)/g;
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(mentionPattern, '<span class="mention">@$1</span>')
    .replace(/\n/g, "<br>");
}

export function getUserAvatar(profile: any): string {
  if (!profile) return "/images/avatars/preset-1.svg";
  
  if (profile.avatar_type === "uploaded" && profile.avatar_url) {
    return profile.avatar_url;
  }
  
  if (profile.avatar_type === "google" && profile.avatar_url) {
    return profile.avatar_url;
  }
  
  const presetId = profile.avatar_preset_id || 1;
  return `/images/avatars/preset-${presetId}.svg`;
}

export function getReactionIcon(type: string): string {
  return REACTION_TYPES[type as keyof typeof REACTION_TYPES]?.emoji || "👍";
}

export function getReactionLabel(type: string): string {
  return REACTION_TYPES[type as keyof typeof REACTION_TYPES]?.label || type;
}

export function canReply(comment: CommentWithProfile): boolean {
  return (comment.thread_level || 0) < COMMENT_CONFIG.maxThreadDepth;
}

export function shouldCollapse(comment: CommentWithProfile): boolean {
  return (comment.thread_level || 0) >= COMMENT_CONFIG.collapseAfter;
}

export function canUserEdit(comment: CommentWithProfile, currentUserId?: string): boolean {
  if (!COMMENT_CONFIG.allowEdit) return false;
  if (!currentUserId || !comment.user_id) return false;
  if (comment.user_id !== currentUserId) return false;
  if (comment.is_deleted) return false;
  
  const commentDate = new Date(comment.created_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - commentDate.getTime()) / (1000 * 60 * 60);
  
  return hoursDiff <= COMMENT_CONFIG.editWindowHours;
}

export function canUserDelete(comment: CommentWithProfile, currentUserId?: string): boolean {
  if (!COMMENT_CONFIG.allowDelete) return false;
  return canUserEdit(comment, currentUserId);
}

// Add mention helper function
export function extractMentions(content: string): string[] {
  const mentionPattern = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionPattern.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)].slice(0, COMMENT_CONFIG.MENTIONS?.MAX_MENTIONS_PER_COMMENT || 5);
}

// Updated comment validation using your config
export function validateComment(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!content.trim()) {
    errors.push('Comment cannot be empty');
  }
  
  if (content.length < COMMENT_CONFIG.characterLimits.min) {
    errors.push(`Comment must be at least ${COMMENT_CONFIG.characterLimits.min} characters`);
  }
  
  if (content.length > COMMENT_CONFIG.characterLimits.max) {
    errors.push(`Comment cannot exceed ${COMMENT_CONFIG.characterLimits.max} characters`);
  }
  
  // Check caps percentage
  if (COMMENT_CONFIG.VALIDATION?.MAX_CAPS_PERCENTAGE) {
    const upperCaseCount = (content.match(/[A-Z]/g) || []).length;
    const letterCount = (content.match(/[A-Za-z]/g) || []).length;
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

// Helper to get thread color based on level
export function getThreadColor(level: number, theme: 'light' | 'dark' = 'dark'): string {
  const colors = THREAD_COLORS[theme] || THREAD_COLORS.dark;
  return colors[Math.min(level, colors.length - 1)] || colors[0];
}

// Mobile optimizations - Fixed for static sites
export function shouldHideDeepThreads(): boolean {
  if (typeof window === 'undefined') return false; // Handle SSR
  return window.innerWidth <= 768 && COMMENT_CONFIG.mobile?.hideDeepThreads;
}

export function getMobileMaxDepth(): number {
  if (typeof window === 'undefined') return COMMENT_CONFIG.maxThreadDepth;
  
  // For static sites, we need to be more careful about window access
  try {
    return window.innerWidth <= 768 ? 
      (COMMENT_CONFIG.mobile?.maxThreadDepth || 2) : 
      COMMENT_CONFIG.maxThreadDepth;
  } catch (error) {
    // Fallback if window is not available
    return COMMENT_CONFIG.maxThreadDepth;
  }
}

// Additional utility functions for your config
export function getEditReasons(): string[] {
  return COMMENT_CONFIG.editReasons || [
    'Fix typo',
    'Clarify meaning', 
    'Add information',
    'Remove sensitive info',
    'Other'
  ];
}

export function shouldAutoApprove(userReputation: number = 0): boolean {
  if (!COMMENT_CONFIG.autoApprove) return false;
  
  const highRepThreshold = COMMENT_CONFIG.MODERATION?.AUTO_APPROVE_HIGH_REP || 1000;
  const normalThreshold = COMMENT_CONFIG.MODERATION?.AUTO_APPROVE_THRESHOLD || 100;
  
  return userReputation >= normalThreshold;
}

export function getInitialLoadCount(isMobile: boolean = false): number {
  if (isMobile && COMMENT_CONFIG.mobile?.initialLoad) {
    return COMMENT_CONFIG.mobile.initialLoad;
  }
  return COMMENT_CONFIG.initialLoad;
}

export function getPageSize(isMobile: boolean = false): number {
  if (isMobile && COMMENT_CONFIG.mobile?.pageSize) {
    return COMMENT_CONFIG.mobile.pageSize;
  }
  return COMMENT_CONFIG.pageSize;
}

// Helper functions for your implementation
export function getUserType(reputation: number): 'free' | 'premium' | 'admin' {
  if (reputation >= 1000) return 'admin';
  if (reputation >= 100) return 'premium';
  return 'free';
}

export function getModerationStatus(userReputation: number, isGuest: boolean = false): string {
  if (isGuest) return 'pending';
  
  if (userReputation >= 1000) return 'auto_approved';
  if (userReputation >= 100) return 'approved';
  return 'pending';
}

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

// Rate limiting helper for static sites
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
    // For static sites, default to allowing if rate limiter fails
    return { allowed: true };
  }
}

// Helper to get user tier for moderation - Fixed for static sites
export async function getUserTierForModeration(userId: string): Promise<'free' | 'premium' | 'admin'> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('membership_type, is_admin')
      .eq('id', userId)
      .single();
    
    if (profile?.is_admin) return 'admin';
    if (profile?.membership_type === 'premium') return 'premium';
    return 'free';
  } catch (error) {
    console.error('Failed to get user tier:', error);
    return 'free';
  }
}

// Helper to check if comment should be auto-collapsed
export function shouldAutoCollapse(comment: CommentWithProfile): boolean {
  return (comment.thread_level || 0) >= COMMENT_CONFIG.collapseAfter;
}

// Helper to get appropriate page size based on context
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

// Helper to detect if we're on mobile - Safe for static sites
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    return window.innerWidth <= 768;
  } catch (error) {
    return false;
  }
}

// Helper to get device-appropriate config
export function getDeviceConfig() {
  const mobile = isMobileDevice();
  
  return {
    maxDepth: mobile ? (COMMENT_CONFIG.mobile?.maxThreadDepth || 2) : COMMENT_CONFIG.maxThreadDepth,
    pageSize: mobile ? (COMMENT_CONFIG.mobile?.pageSize || 8) : COMMENT_CONFIG.pageSize,
    initialLoad: mobile ? (COMMENT_CONFIG.mobile?.initialLoad || 15) : COMMENT_CONFIG.initialLoad,
    hideDeepThreads: mobile && COMMENT_CONFIG.mobile?.hideDeepThreads
  };
}

// Client-side only functions - Safe for static sites
export function initializeCommentHelpers() {
  // Only run on client-side
  if (typeof window === 'undefined') return;
  
  // Initialize any client-side only features
  console.log('Comment helpers initialized for static site');
}

// Utility to safely access window properties
export function safeWindowAccess<T>(callback: () => T, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  
  try {
    return callback();
  } catch (error) {
    console.warn('Window access failed:', error);
    return fallback;
  }
}