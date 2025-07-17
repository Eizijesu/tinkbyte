// src/lib/utils/commentHelpers.ts
import { supabase, db, rpc } from '../supabase';
import type { 
  Comment, 
  CommentWithProfile, 
  CommentFormData, 
  CommentValidationResult,
  CommentResponse 
} from '../types/comments';

// Comment validation
export function validateComment(data: CommentFormData): CommentValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];
  
  // Content validation
  if (!data.content || data.content.trim().length === 0) {
    errors.content = 'Comment content is required';
  } else if (data.content.length > 2000) {
    errors.content = 'Comment must be less than 2000 characters';
  } else if (data.content.length < 10) {
    warnings.push('Very short comments may not be helpful to the community');
  }
  
  // Check for potential spam
  const spamKeywords = ['click here', 'buy now', 'limited time', 'urgent', 'act now'];
  const hasSpamKeywords = spamKeywords.some(keyword => 
    data.content.toLowerCase().includes(keyword)
  );
  
  if (hasSpamKeywords) {
    warnings.push('Your comment may be flagged for review due to promotional content');
  }
  
  // Check for excessive mentions
  if (data.mentions && data.mentions.length > 5) {
    errors.mentions = 'Maximum 5 mentions per comment';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

// Content sanitization
export function sanitizeContent(content: string): string {
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/https?:\/\/[^\s]+/gi, '[link removed]') // Remove URLs
    .trim();
}

// Extract mentions from content
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
}

// Calculate thread level
export function calculateThreadLevel(parentId: string | null, comments: Comment[]): number {
  if (!parentId) return 0;
  
  const parent = comments.find(c => c.id === parentId);
  if (!parent) return 0;
  
  const parentLevel = (parent as any).thread_level || 0;
  return Math.min(parentLevel + 1, 4); // Max 4 levels (0-4)
}

// Format comment for display
export function formatCommentContent(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
    .replace(/`(.*?)`/g, '<code>$1</code>') // Code
    .replace(/@(\w+)/g, '<span class="mention">@$1</span>'); // Mentions
}

// Get comment tree structure
export function buildCommentTree(comments: CommentWithProfile[]): CommentWithProfile[] {
  const commentMap = new Map<string, CommentWithProfile & { replies: CommentWithProfile[] }>();
  const rootComments: CommentWithProfile[] = [];
  
  // First pass: create map of all comments
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });
  
  // Second pass: build tree structure
  comments.forEach(comment => {
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(commentMap.get(comment.id)!);
      }
    } else {
      rootComments.push(commentMap.get(comment.id)!);
    }
  });
  
  return rootComments;
}

// Rate limiting check - Updated to work with your current setup
export async function checkRateLimit(
  userId: string, 
  actionType: 'comment' | 'reaction' | 'like' | 'report',
  windowMinutes: number = 60
): Promise<boolean> {
  try {
    // Simple rate limiting using database query
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    
    const { data, error } = await db.userRateLimits()
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('action_type', actionType)
      .gte('created_at', windowStart);
    
    if (error) {
      console.error('Rate limit check error:', error);
      return false; // Fail closed
    }
    
    const limit = actionType === 'comment' ? 5 : 20;
    return (data?.length || 0) < limit;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return false; // Fail closed
  }
}

// Record rate limit action
export async function recordRateLimitAction(
  userId: string,
  actionType: 'comment' | 'reaction' | 'like' | 'report',
  ipAddress?: string
): Promise<void> {
  try {
    await db.userRateLimits()
      .insert({
        user_id: userId,
        action_type: actionType,
        ip_address: ipAddress || 'unknown',
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to record rate limit action:', error);
  }
}

// Auto-moderation - Simplified version
export async function autoModerateComment(
  userId: string,
  content: string
): Promise<string> {
  try {
    // Simple content-based moderation
    const flaggedWords = ['spam', 'scam', 'fake', 'click here'];
    const lowerContent = content.toLowerCase();
    
    const hasSpam = flaggedWords.some(word => lowerContent.includes(word));
    
    if (hasSpam) {
      return 'flagged';
    }
    
    // Check user reputation
    const { data: profile } = await db.profiles()
      .select('reputation_score')
      .eq('id', userId)
      .single();
    
    const reputation = profile?.reputation_score || 0;
    
    if (reputation >= 100) {
      return 'auto_approved';
    } else if (reputation >= 25) {
      return 'approved';
    } else {
      return 'pending';
    }
  } catch (error) {
    console.error('Auto-moderation failed:', error);
    return 'pending';
  }
}

// Get user's comment stats
export async function getUserCommentStats(userId: string): Promise<{
  total_comments: number;
  total_likes: number;
  reputation_score: number;
}> {
  try {
    const { data: profile } = await db.profiles()
      .select('total_comments, reputation_score')
      .eq('id', userId)
      .single();
    
    const { count } = await db.commentLikes()
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
    
    return {
      total_comments: profile?.total_comments || 0,
      total_likes: count || 0,
      reputation_score: profile?.reputation_score || 0
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      total_comments: 0,
      total_likes: 0,
      reputation_score: 0
    };
  }
}

// Client-side rate limiter
export class ClientRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly limits = {
    comment: { count: 3, window: 60000 }, // 3 per minute
    reaction: { count: 10, window: 60000 }, // 10 per minute
    like: { count: 20, window: 60000 } // 20 per minute
  };
  
  canMakeRequest(userId: string, actionType: keyof typeof this.limits): boolean {
    const key = `${userId}:${actionType}`;
    const now = Date.now();
    const limit = this.limits[actionType];
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }
    
    const userAttempts = this.attempts.get(key)!;
    const recentAttempts = userAttempts.filter(time => now - time < limit.window);
    
    if (recentAttempts.length >= limit.count) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }
  
  getRetryAfter(userId: string, actionType: keyof typeof this.limits): number {
    const key = `${userId}:${actionType}`;
    const attempts = this.attempts.get(key);
    
    if (!attempts || attempts.length === 0) return 0;
    
    const oldest = Math.min(...attempts);
    const limit = this.limits[actionType];
    
    return Math.max(0, limit.window - (Date.now() - oldest));
  }
}

export const clientRateLimiter = new ClientRateLimiter();