// src/lib/data-cache.ts
import { supabase } from './supabase.js';

class DataCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

export const dataCache = new DataCache();

// Cached data fetchers
export async function getCachedTopics() {
  const cacheKey = 'topics';
  
  // Check cache first
  let topics = dataCache.get(cacheKey);
  if (topics) return topics;
  
  // Fetch from database
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');
  
  topics = data || [];
  
  // Cache for 30 minutes (topics don't change often)
  dataCache.set(cacheKey, topics, 30);
  
  return topics;
}

export async function getCachedNewsletters() {
  const cacheKey = 'newsletters';
  
  let newsletters = dataCache.get(cacheKey);
  if (newsletters) return newsletters;
  
  const { data } = await supabase
    .from('newsletters')
    .select('*')
    .eq('is_active', true)
    .order('created_at');
  
  newsletters = data || [];
  dataCache.set(cacheKey, newsletters, 30);
  
  return newsletters;
}

export async function getCachedUserStats(userId: string) {
  const cacheKey = `user-stats-${userId}`;
  
  let stats = dataCache.get(cacheKey);
  if (stats) return stats;
  
  try {
    const [
      topicsResult,
      followingUsersResult,
      followedArticlesResult,
      followersResult,
      articlesReadResult,
      commentsResult,
    ] = await Promise.allSettled([
      supabase
        .from('user_category_follows')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId),
      supabase
        .from('article_follows')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('article_reads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_deleted', false),
    ]);

    stats = {
      followers: followersResult.status === 'fulfilled' ? followersResult.value.count || 0 : 0,
      following_topics: topicsResult.status === 'fulfilled' ? topicsResult.value.count || 0 : 0,
      following_users: followingUsersResult.status === 'fulfilled' ? followingUsersResult.value.count || 0 : 0,
      followed_articles: followedArticlesResult.status === 'fulfilled' ? followedArticlesResult.value.count || 0 : 0,
      articles_read: articlesReadResult.status === 'fulfilled' ? articlesReadResult.value.count || 0 : 0,
      comments_posted: commentsResult.status === 'fulfilled' ? commentsResult.value.count || 0 : 0,
    };

    // Cache for 5 minutes
    dataCache.set(cacheKey, stats, 5);
    return stats;
  } catch (error) {
    console.error('Error loading stats:', error);
    return {
      followers: 0,
      following_topics: 0,
      following_users: 0,
      followed_articles: 0,
      articles_read: 0,
      comments_posted: 0,
    };
  }
}