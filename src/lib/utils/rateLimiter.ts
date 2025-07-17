// src/lib/utils/rateLimiter.ts - Complete corrected version
import { supabase } from '../supabase';

interface RateLimitConfig {
  comment: number;
  reaction: number;
  like: number;
  report: number;
  bookmark: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  remaining?: number;
  resetTime?: Date;
}

interface UserTier {
  free: RateLimitConfig;
  premium: RateLimitConfig;
  admin: RateLimitConfig;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private attempts: Map<string, number[]> = new Map();
  private userTierCache: Map<string, string> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Rate limits based on user tier
  private readonly limits: UserTier = {
    free: {
      comment: 5,    // 5 comments per minute
      reaction: 20,  // 20 reactions per minute
      like: 15,      // 15 likes per minute
      report: 3,     // 3 reports per minute
      bookmark: 10   // 10 bookmarks per minute
    },
    premium: {
      comment: 15,   // 15 comments per minute
      reaction: 50,  // 50 reactions per minute
      like: 30,      // 30 likes per minute
      report: 10,    // 10 reports per minute
      bookmark: 25   // 25 bookmarks per minute
    },
    admin: {
      comment: 100,  // 100 comments per minute
      reaction: 200, // 200 reactions per minute
      like: 100,     // 100 likes per minute
      report: 50,    // 50 reports per minute
      bookmark: 100  // 100 bookmarks per minute
    }
  };

  private constructor() {
    // Cleanup expired cache entries every 10 minutes
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.cleanupCache();
      }, 10 * 60 * 1000);
    }
  }
  
  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  async canMakeRequest(
    userId: string, 
    action: keyof RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const window = 60000; // 1 minute window
    
    try {
      // Get user tier (with caching)
      const userTier = await this.getUserTier(userId);
      const limit = this.limits[userTier][action];
      
      // Client-side rate limiting (primary for static sites)
      if (!this.attempts.has(key)) {
        this.attempts.set(key, []);
      }
      
      const userAttempts = this.attempts.get(key)!;
      const recentAttempts = userAttempts.filter(time => now - time < window);
      
      if (recentAttempts.length >= limit) {
        const oldestAttempt = recentAttempts[0];
        const retryAfter = Math.ceil((window - (now - oldestAttempt)) / 1000);
        const resetTime = new Date(oldestAttempt + window);
        
        return { 
          allowed: false, 
          retryAfter, 
          remaining: 0,
          resetTime
        };
      }
      
      // Add current attempt
      recentAttempts.push(now);
      this.attempts.set(key, recentAttempts);
      
      // Database verification for additional security
      const dbCheck = await this.verifyWithDatabase(userId, action, limit, window);
      
      if (!dbCheck.allowed) {
        return dbCheck;
      }
      
      const remaining = limit - recentAttempts.length;
      const resetTime = new Date(now + window);
      
      return { 
        allowed: true, 
        remaining,
        resetTime
      };
      
    } catch (error) {
      console.error('Rate limit check failed:', error);
      
      // Fallback to basic client-side limiting for free tier
      const fallbackLimit = this.limits.free[action];
      const userAttempts = this.attempts.get(key) || [];
      const recentAttempts = userAttempts.filter(time => now - time < window);
      
      if (recentAttempts.length >= fallbackLimit) {
        const oldestAttempt = recentAttempts[0];
        const retryAfter = Math.ceil((window - (now - oldestAttempt)) / 1000);
        return { allowed: false, retryAfter };
      }
      
      return { allowed: true };
    }
  }

  private async getUserTier(userId: string): Promise<keyof UserTier> {
    // Check cache first
    const cached = this.userTierCache.get(userId);
    const cacheTime = this.cacheExpiry.get(userId);
    
    if (cached && cacheTime && Date.now() < cacheTime) {
      return cached as keyof UserTier;
    }
    
    try {
      // Fetch user profile to determine tier
      const { data: profile } = await supabase
        .from('profiles')
        .select('membership_type, is_admin')
        .eq('id', userId)
        .single();
      
      let tier: keyof UserTier = 'free';
      
      if (profile?.is_admin) {
        tier = 'admin';
      } else if (profile?.membership_type === 'premium') {
        tier = 'premium';
      }
      
      // Cache the result
      this.userTierCache.set(userId, tier);
      this.cacheExpiry.set(userId, Date.now() + this.CACHE_TTL);
      
      return tier;
      
    } catch (error) {
      console.error('Failed to get user tier:', error);
      return 'free'; // Default to most restrictive
    }
  }

  private async verifyWithDatabase(
    userId: string, 
    action: string, 
    limit: number, 
    window: number
  ): Promise<RateLimitResult> {
    try {
      const windowStart = new Date(Date.now() - window).toISOString();
      
      // Check user-based rate limit
      const { data: userAttempts } = await supabase
        .from('user_rate_limits')
        .select('created_at')
        .eq('user_id', userId)
        .eq('action_type', action)
        .gte('created_at', windowStart);
      
      if (userAttempts && userAttempts.length >= limit) {
        return { allowed: false, retryAfter: 60 };
      }
      
      // Log the attempt (without IP for static sites)
      await this.logAttempt(userId, action);
      
      const remaining = limit - (userAttempts?.length || 0) - 1;
      return { 
        allowed: true, 
        remaining: Math.max(0, remaining)
      };
      
    } catch (error) {
      console.error('Database rate limit verification failed:', error);
      // Allow the request if DB check fails
      return { allowed: true };
    }
  }
  
  async logAttempt(userId: string, action: string): Promise<void> {
    try {
      await supabase
        .from('user_rate_limits')
        .insert({
          user_id: userId,
          action_type: action,
          ip_address: 'static-site', // Static identifier for static sites
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log rate limit attempt:', error);
      // Don't throw - logging failure shouldn't block the action
    }
  }

  async getRemainingRequests(
    userId: string, 
    action: keyof RateLimitConfig
  ): Promise<{ remaining: number; resetTime: Date; limit: number }> {
    const now = Date.now();
    const window = 60000;
    const key = `${userId}:${action}`;
    
    try {
      const userTier = await this.getUserTier(userId);
      const limit = this.limits[userTier][action];
      
      const userAttempts = this.attempts.get(key) || [];
      const recentAttempts = userAttempts.filter(time => now - time < window);
      
      const remaining = Math.max(0, limit - recentAttempts.length);
      const resetTime = new Date(now + window);
      
      return { remaining, resetTime, limit };
      
    } catch (error) {
      console.error('Failed to get remaining requests:', error);
      const fallbackLimit = this.limits.free[action];
      return { 
        remaining: fallbackLimit, 
        resetTime: new Date(now + window),
        limit: fallbackLimit
      };
    }
  }

  async isUserBlocked(userId: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_blocked, blocked_until')
        .eq('id', userId)
        .single();
      
      if (!profile?.is_blocked) {
        return false;
      }
      
      // Check if temporary block has expired
      if (profile.blocked_until && new Date(profile.blocked_until) < new Date()) {
        // Unblock the user
        await supabase
          .from('profiles')
          .update({ 
            is_blocked: false, 
            blocked_until: null 
          })
          .eq('id', userId);
        
        return false;
      }
      
      return profile.is_blocked;
      
    } catch (error) {
      console.error('Failed to check if user is blocked:', error);
      return false; // Default to not blocked if check fails
    }
  }

  async blockUser(userId: string, duration?: number): Promise<void> {
    try {
      const updates: any = { is_blocked: true };
      
      if (duration) {
        updates.blocked_until = new Date(Date.now() + duration).toISOString();
      }
      
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      
      // Clear user's rate limit cache
      this.userTierCache.delete(userId);
      this.cacheExpiry.delete(userId);
      
      // Clear user's attempts
      for (const [key] of this.attempts) {
        if (key.startsWith(`${userId}:`)) {
          this.attempts.delete(key);
        }
      }
      
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }

  async unblockUser(userId: string): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({ 
          is_blocked: false, 
          blocked_until: null 
        })
        .eq('id', userId);
      
      // Clear user's cache
      this.userTierCache.delete(userId);
      this.cacheExpiry.delete(userId);
      
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  }

  // Clean up old attempts from memory
  cleanup(): void {
    const now = Date.now();
    const window = 60000; // 1 minute
    
    for (const [key, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter(time => now - time < window);
      if (recentAttempts.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, recentAttempts);
      }
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    
    for (const [userId, expiry] of this.cacheExpiry.entries()) {
      if (now >= expiry) {
        this.userTierCache.delete(userId);
        this.cacheExpiry.delete(userId);
      }
    }
  }

  // Get rate limit status for multiple actions
  async getStatus(userId: string): Promise<Record<keyof RateLimitConfig, { remaining: number; resetTime: Date; limit: number }>> {
    const actions: (keyof RateLimitConfig)[] = ['comment', 'reaction', 'like', 'report', 'bookmark'];
    const status: any = {};
    
    for (const action of actions) {
      status[action] = await this.getRemainingRequests(userId, action);
    }
    
    return status;
  }

  // Reset rate limits for a user (admin function)
  async resetUserLimits(userId: string): Promise<void> {
    try {
      // Clear memory cache
      for (const [key] of this.attempts) {
        if (key.startsWith(`${userId}:`)) {
          this.attempts.delete(key);
        }
      }
      
      // Clear user tier cache
      this.userTierCache.delete(userId);
      this.cacheExpiry.delete(userId);
      
      // Optionally clear recent database entries
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      await supabase
        .from('user_rate_limits')
        .delete()
        .eq('user_id', userId)
        .gte('created_at', oneHourAgo);
      
    } catch (error) {
      console.error('Failed to reset user limits:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance();

// Clean up every 5 minutes (only in browser)
if (typeof window !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

// Helper function for static sites
export async function checkRateLimit(
  userId: string,
  action: keyof RateLimitConfig
): Promise<RateLimitResult> {
  // Check if user is blocked first
  const isBlocked = await rateLimiter.isUserBlocked(userId);
  if (isBlocked) {
    return { 
      allowed: false, 
      retryAfter: 3600 // 1 hour default
    };
  }
  
  return rateLimiter.canMakeRequest(userId, action);
}

// Export types for use in other files
export type { RateLimitResult, RateLimitConfig };
