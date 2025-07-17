// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = (import.meta as any).env.PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Add these exports before the default export
export const db = {
  profiles: () => supabase.from('profiles'),
  comments: () => supabase.from('comments'),
  commentLikes: () => supabase.from('comment_likes'),
  commentModeration: () => supabase.from('comment_moderation'),
  articles: () => supabase.from('articles'),
  articleLikes: () => supabase.from('article_likes'),
  userRateLimits: () => supabase.from('user_rate_limits'),
  moderationRules: () => supabase.from('moderation_rules'),
  commentReactions: () => supabase.from('comment_reactions'),
  commentBookmarks: () => supabase.from('comment_bookmarks'),
  commentReports: () => supabase.from('comment_reports'),
  commentDrafts: () => supabase.from('comment_drafts'),
  commentEditHistory: () => supabase.from('comment_edit_history'),
  commentNotifications: () => supabase.from('comment_notifications'),
};

// Utility for RPC calls
export const rpc = (fn: string, params: object) => 
  supabase.rpc(fn, params);

// Add this type for better type safety
export type TableName = keyof typeof db;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'tinkbyte-auth-token',
    debug: false
  }
});

// Type definitions
export interface User {
  id: string;
  email?: string;
  created_at: string;
  user_metadata?: {
    display_name?: string;
    full_name?: string;
    given_name?: string;
    family_name?: string;
    avatar_url?: string;
    picture?: string;
    name?: string;
    provider?: string;
  };
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };
}

export interface Profile {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  avatar_type: 'preset' | 'uploaded' | 'google'; 
  avatar_preset_id: number | null;
  avatar_url: string | null;
  website?: string | null;
  twitter_handle?: string | null;
  linkedin_url?: string | null;
  github_username?: string | null;
  location?: string | null;
  job_title?: string | null;
  company?: string | null;
  total_reads: number;
  total_comments: number;
  total_articles: number;
  reputation_score: number;
  following_count: number;
  followers_count: number;
  is_public: boolean;
  membership_type: 'free' | 'premium' | 'enterprise';
  is_admin: boolean;
  email?: string;
  created_at: string;
  updated_at: string;
}

// Additional types for your TinkByte site
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_id: string;
  category_id: string;
  tags: string[];
  featured_image?: string;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  reading_time: number;
  seo_title?: string;
  seo_description?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  // Relations
  author?: Profile;
  category?: Category;
  comments?: Comment[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  parent_id?: string;
  sort_order: number;
  article_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  content: string;
  author_id: string;
  article_id: string;
  parent_id?: string;
  is_approved: boolean;
  is_flagged: boolean;
  like_count: number;
  created_at: string;
  updated_at: string;
  // Relations
  author?: Profile;
  replies?: Comment[];
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  follow_type: 'user' | 'category';
  created_at: string;
}

export interface ArticleFollow {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}

export interface ArticleLike {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}

export interface CommentLike {
  id: string;
  user_id: string;
  comment_id: string;
  created_at: string;
}

export interface ReadingHistory {
  id: string;
  user_id: string;
  article_id: string;
  read_percentage: number;
  time_spent: number;
  last_read_at: string;
  created_at: string;
}

export interface Newsletter {
  id: string;
  email: string;
  name?: string;
  is_subscribed: boolean;
  subscription_source: string;
  preferences: {
    weekly_digest: boolean;
    new_articles: boolean;
    featured_content: boolean;
  };
  created_at: string;
  updated_at: string;
}

// Auth state management
export class AuthState {
  private static instance: AuthState;
  private user: User | null = null;
  private profile: Profile | null = null;
  private listeners: Array<(user: User | null, profile: Profile | null) => void> = [];
  private initialized = false;

  static getInstance(): AuthState {
    if (!AuthState.instance) {
      AuthState.instance = new AuthState();
    }
    return AuthState.instance;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      console.log('🔄 Initializing auth state...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        this.user = session.user as User;
        await this.loadProfile();
        console.log('✅ User session found:', this.user.email);
      } else {
        console.log('❌ No user session found');
      }

      this.notifyListeners();
      this.initialized = true;

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          this.user = session.user as User;
          await this.loadProfile();
          this.notifyListeners();
        } else if (event === 'SIGNED_OUT') {
          this.user = null;
          this.profile = null;
          this.notifyListeners();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          this.user = session.user as User;
          this.notifyListeners();
        }
      });
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      this.initialized = true;
    }
  }

  private async loadProfile() {
    if (!this.user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        console.log('📝 Creating new profile...');
        await this.createProfile();
      } else if (error) {
        console.error('❌ Profile load error:', error);
      } else {
        this.profile = profile as Profile;
        console.log('✅ Profile loaded:', this.profile.display_name);
      }
    } catch (error) {
      console.error('❌ Profile load error:', error);
    }
  }

private async createProfile() {
  if (!this.user) return;

  try {
    const displayName = this.user.user_metadata?.display_name || 
                       this.user.user_metadata?.full_name || 
                       this.user.user_metadata?.name ||
                       this.user.email?.split('@')[0] || 
                       'TBMember';

    // Enhanced Google profile detection
    const googleAvatar = this.user.user_metadata?.avatar_url || this.user.user_metadata?.picture;
    const isGoogleProvider = this.user.app_metadata?.provider === 'google' || 
                            this.user.app_metadata?.providers?.includes('google');
    
    // More robust Google avatar detection
    const isGoogleAvatar = googleAvatar && (
      googleAvatar.includes('googleusercontent.com') || 
      googleAvatar.includes('lh3.googleusercontent.com') ||
      googleAvatar.includes('lh4.googleusercontent.com') ||
      googleAvatar.includes('lh5.googleusercontent.com') ||
      googleAvatar.includes('lh6.googleusercontent.com') ||
      (isGoogleProvider && googleAvatar.startsWith('https://'))
    );

    console.log('🔍 Profile Creation Debug:', {
      googleAvatar,
      isGoogleProvider,
      isGoogleAvatar,
      userMetadata: this.user.user_metadata,
      appMetadata: this.user.app_metadata
    });

    // Prepare profile data
    const profileData = {
      id: this.user.id,
      display_name: displayName,
      first_name: this.user.user_metadata?.given_name || null,
      last_name: this.user.user_metadata?.family_name || null,
      avatar_url: googleAvatar || null,
      avatar_type: isGoogleAvatar ? 'google' : 
                  googleAvatar ? 'uploaded' : 'preset',
      avatar_preset_id: isGoogleAvatar || googleAvatar ? null : 1, // FIXED: null for any avatar URL
      bio: null,
      website: null,
      twitter_handle: null,
      linkedin_url: null,
      github_username: null,
      location: null,
      job_title: null,
      company: null,
      total_reads: 0,
      total_comments: 0,
      total_articles: 0,
      reputation_score: 0,
      following_count: 0,
      followers_count: 0,
      is_public: true,
      membership_type: 'free',
      is_admin: this.user.email === 'tinkbytehq@gmail.com',
      email: this.user.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Creating profile with data:', profileData);

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error('❌ Profile creation error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // If it's a constraint error, try with preset avatar as fallback
      if (error.code === '23514' || error.message.includes('constraint')) {
        console.log('🔄 Retrying with preset avatar...');
        
        const fallbackData = {
          ...profileData,
          avatar_type: 'preset',
          avatar_preset_id: 1,
          avatar_url: null
        };
        
        const { data: fallbackResult, error: fallbackError } = await supabase
          .from('profiles')
          .insert(fallbackData)
          .select()
          .single();
          
        if (fallbackError) {
          console.error('❌ Fallback profile creation also failed:', fallbackError);
          throw fallbackError;
        } else {
          this.profile = fallbackResult as Profile;
          console.log('✅ Profile created with fallback data:', this.profile.display_name);
        }
      } else {
        throw error;
      }
    } else {
      this.profile = data as Profile;
      console.log('✅ Profile created with Google data:', {
        displayName: this.profile.display_name,
        avatarType: this.profile.avatar_type,
        avatarUrl: this.profile.avatar_url
      });
    }
  } catch (error) {
    console.error('❌ Profile creation error:', error);
    
    // Last resort: create minimal profile
    try {
      console.log('🔄 Creating minimal profile as last resort...');
      
      const minimalData = {
        id: this.user.id,
        display_name: this.user.email?.split('@')[0] || 'TBMember',
        first_name: null,
        last_name: null,
        avatar_type: 'preset',
        avatar_preset_id: 1,
        avatar_url: null,
        bio: null,
        website: null,
        twitter_handle: null,
        linkedin_url: null,
        github_username: null,
        location: null,
        job_title: null,
        company: null,
        total_reads: 0,
        total_comments: 0,
        total_articles: 0,
        reputation_score: 0,
        following_count: 0,
        followers_count: 0,
        is_public: true,
        membership_type: 'free',
        is_admin: false,
        email: this.user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: minimalResult, error: minimalError } = await supabase
        .from('profiles')
        .insert(minimalData)
        .select()
        .single();
        
      if (minimalError) {
        console.error('❌ Even minimal profile creation failed:', minimalError);
      } else {
        this.profile = minimalResult as Profile;
        console.log('✅ Minimal profile created successfully');
      }
    } catch (finalError) {
      console.error('❌ Final profile creation attempt failed:', finalError);
    }
  }
}

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }

      this.user = null;
      this.profile = null;
      this.notifyListeners();
      
      console.log('✅ User signed out successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  onAuthChange(callback: (user: User | null, profile: Profile | null) => void) {
    this.listeners.push(callback);
    callback(this.user, this.profile);
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.user, this.profile));
  }

  getUser(): User | null {
    return this.user;
  }

  getProfile(): Profile | null {
    return this.profile;
  }

  async refreshProfile() {
    await this.loadProfile();
    this.notifyListeners();
  }

  async updateProfile(updates: Partial<Profile>) {
    if (!this.user) {
      return { success: false, error: 'No authenticated user' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Profile update error:', error);
        return { success: false, error: error.message };
      }

      this.profile = data as Profile;
      this.notifyListeners();
      
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Helper function for retry logic
export async function withRetry(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

// Database query helpers with retry
export const dbWithRetry = {
  async getProfile(userId) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      return data;
    });
  },

  async updateProfile(userId, updates) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    });
  }
};

// Utility functions for your TinkByte site
export class TinkByteAPI {
  // Article operations
  static async getArticles(options: {
    limit?: number;
    offset?: number;
    category?: string;
    author?: string;
    featured?: boolean;
    published?: boolean;
    search?: string;
  } = {}) {
    try {
      let query = supabase
        .from('articles')
        .select(`
          *,
          author:profiles(*),
          category:categories(*),
          comments:comments(count)
        `)
        .order('published_at', { ascending: false });

      if (options.published !== false) {
        query = query.eq('is_published', true);
      }

      if (options.featured) {
        query = query.eq('is_featured', true);
      }

      if (options.category) {
        query = query.eq('category_id', options.category);
      }

      if (options.author) {
        query = query.eq('author_id', options.author);
      }

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data as Article[] };
    } catch (error: any) {
      console.error('Error fetching articles:', error);
      return { success: false, error: error.message };
    }
  }

  static async getArticle(slug: string) {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          author:profiles(*),
          category:categories(*),
          comments:comments(
            *,
            author:profiles(*)
          )
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;

      // Increment view count
      await supabase
        .from('articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

      return { success: true, data: data as Article };
    } catch (error: any) {
      console.error('Error fetching article:', error);
      return { success: false, error: error.message };
    }
  }

  // Category operations
  static async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      return { success: true, data: data as Category[] };
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      return { success: false, error: error.message };
    }
  }

  // Comment operations
  static async addComment(articleId: string, content: string, parentId?: string) {
    try {
      const authState = AuthState.getInstance();
      const user = authState.getUser();

      if (!user) {
        throw new Error('Must be logged in to comment');
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          content,
          author_id: user.id,
          article_id: articleId,
          parent_id: parentId || null,
          is_approved: true, // Auto-approve for now
          is_flagged: false,
          like_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          author:profiles(*)
        `)
        .single();

      if (error) throw error;

      return { success: true, data: data as Comment };
    } catch (error: any) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message };
    }
  }

  // User interactions
  static async toggleArticleLike(articleId: string) {
    try {
      const authState = AuthState.getInstance();
      const user = authState.getUser();

      if (!user) {
        throw new Error('Must be logged in to like articles');
      }

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('article_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', articleId)
        .single();

      if (existingLike) {
        // Remove like
        await supabase
          .from('article_likes')
          .delete()
          .eq('id', existingLike.id);

        // Decrement like count
        await supabase.rpc('decrement_article_likes', { article_id: articleId });

        return { success: true, liked: false };
      } else {
        // Add like
        await supabase
          .from('article_likes')
          .insert({
            user_id: user.id,
            article_id: articleId,
            created_at: new Date().toISOString()
          });

        // Increment like count
        await supabase.rpc('increment_article_likes', { article_id: articleId });

        return { success: true, liked: true };
      }
    } catch (error: any) {
      console.error('Error toggling article like:', error);
      return { success: false, error: error.message };
    }
  }

  static async followUser(userId: string) {
    try {
      const authState = AuthState.getInstance();
      const user = authState.getUser();

      if (!user) {
        throw new Error('Must be logged in to follow users');
      }

      if (user.id === userId) {
        throw new Error('Cannot follow yourself');
      }

      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: userId,
          follow_type: 'user',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error following user:', error);
      return { success: false, error: error.message };
    }
  }

  static async unfollowUser(userId: string) {
    try {
      const authState = AuthState.getInstance();
      const user = authState.getUser();

      if (!user) {
        throw new Error('Must be logged in to unfollow users');
      }

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .eq('follow_type', 'user');

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      return { success: false, error: error.message };
    }
  }

  // Newsletter operations
  static async subscribeToNewsletter(email: string, name?: string) {
    try {
      const { data, error } = await supabase
        .from('newsletter')
        .upsert({
          email,
          name: name || null,
          is_subscribed: true,
          subscription_source: 'website',
          preferences: {
            weekly_digest: true,
            new_articles: true,
            featured_content: true
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('Error subscribing to newsletter:', error);
      return { success: false, error: error.message };
    }
  }

  // Search operations
  static async searchContent(query: string, type: 'articles' | 'users' | 'all' = 'all') {
    try {
      const results: any = {};

      if (type === 'articles' || type === 'all') {
        const { data: articles } = await supabase
          .from('articles')
          .select(`
            *,
            author:profiles(*),
            category:categories(*)
          `)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
          .eq('is_published', true)
          .limit(10);

        results.articles = articles || [];
      }

      if (type === 'users' || type === 'all') {
        const { data: users } = await supabase
          .from('profiles')
          .select('*')
          .or(`display_name.ilike.%${query}%,bio.ilike.%${query}%`)
          .eq('is_public', true)
          .limit(10);

        results.users = users || [];
      }

      return { success: true, data: results };
    } catch (error: any) {
      console.error('Error searching content:', error);
      return { success: false, error: error.message };
    }
  }
}

export default supabase;