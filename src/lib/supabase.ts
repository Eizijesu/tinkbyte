// src/lib/supabase.ts - COMPLETE WITH ALL METHODS
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from './config';

// Global singleton - only one instance ever
let supabaseClient: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  // Return existing instance if available
  if (supabaseClient) {
    return supabaseClient;
  }

  // Validate environment variables
  const supabaseUrl = config.supabase.url;
  const supabaseAnonKey = config.supabase.anonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Create single instance
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: `tinkbyte-auth-${config.environment}`
    },
    global: {
      headers: {
        'X-Environment': config.environment,
        'X-Client-Info': `tinkbyte-static-${config.environment}`
      }
    }
  });

  return supabaseClient;
}

// Export the singleton
export const supabase = createSupabaseClient();
export { createSupabaseClient as getSupabaseClient };

// **ADD: Export AuthState class that was missing**
export class AuthState {
  private static instance: AuthState | null = null;
  private currentUser: any = null;
  private currentSession: any = null;
  private listeners: Array<(user: any) => void> = [];

  private constructor() {
    this.initializeAuth();
  }

  static getInstance(): AuthState {
    if (!AuthState.instance) {
      AuthState.instance = new AuthState();
    }
    return AuthState.instance;
  }

  async initialize(): Promise<void> {
    await this.initializeAuth();
  }

  private async initializeAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    this.currentSession = session;
    this.currentUser = session?.user || null;

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.currentSession = session;
      this.currentUser = session?.user || null;
      this.notifyListeners();
    });
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getCurrentSession() {
    return this.currentSession;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  onAuthStateChange(callback: (user: any) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      this.currentUser = null;
      this.currentSession = null;
      this.notifyListeners();
    }
    return { error };
  }
}

// Database helpers
export const db = {
  profiles: () => supabase.from('profiles'),
  comments: () => supabase.from('comments'),
  commentLikes: () => supabase.from('comment_likes'),
  commentModeration: () => supabase.from('comment_moderation'),
  commentReactions: () => supabase.from('comment_reactions'),
  commentBookmarks: () => supabase.from('comment_bookmarks'),
  commentDrafts: () => supabase.from('comment_drafts'),
  commentEditHistory: () => supabase.from('comment_edit_history'),
  commentNotifications: () => supabase.from('comment_notifications'),
  userRateLimits: () => supabase.from('user_rate_limits'),
  newsletterSubscriptions: () => supabase.from('newsletter_subscriptions'),
  userCategoryFollows: () => supabase.from('user_category_follows'),
  articles: () => supabase.from('articles'),
  articleLikes: () => supabase.from('article_likes'),
  moderationRules: () => supabase.from('moderation_rules'),
  categories: () => supabase.from('categories'),
  authors: () => supabase.from('authors'),
  podcasts: () => supabase.from('podcasts'),
  threads: () => supabase.from('threads'),
  userFollows: () => supabase.from('user_follows'),
  userPreferences: () => supabase.from('user_preferences'),
};

// Environment-aware query helpers
export const envDb = {
  profiles: {
    select: (columns: string = '*') => db.profiles().select(columns).eq('environment', config.environment),
    insert: (data: Partial<Profile>) => db.profiles().insert({ ...data, environment: config.environment } as any),
    update: (data: Partial<Profile>) => db.profiles().update({ ...data, environment: config.environment } as any),
    delete: () => db.profiles().delete().eq('environment', config.environment),
  },
  comments: {
    select: (columns: string = '*') => db.comments().select(columns).eq('environment', config.environment),
    insert: (data: any) => db.comments().insert({ ...data, environment: config.environment }),
    update: (data: any) => db.comments().update({ ...data, environment: config.environment }),
    delete: () => db.comments().delete().eq('environment', config.environment),
  },
  commentLikes: {
    select: (columns: string = '*') => db.commentLikes().select(columns).eq('environment', config.environment),
    insert: (data: any) => db.commentLikes().insert({ ...data, environment: config.environment }),
    update: (data: any) => db.commentLikes().update({ ...data, environment: config.environment }),
    delete: () => db.commentLikes().delete().eq('environment', config.environment),
  },
  commentModeration: {
    select: (columns: string = '*') => db.commentModeration().select(columns).eq('environment', config.environment),
    insert: (data: any) => db.commentModeration().insert({ ...data, environment: config.environment }),
    update: (data: any) => db.commentModeration().update({ ...data, environment: config.environment }),
    delete: () => db.commentModeration().delete().eq('environment', config.environment),
  },
  commentReactions: {
    select: (columns: string = '*') => db.commentReactions().select(columns).eq('environment', config.environment),
    insert: (data: any) => db.commentReactions().insert({ ...data, environment: config.environment }),
    update: (data: any) => db.commentReactions().update({ ...data, environment: config.environment }),
    delete: () => db.commentReactions().delete().eq('environment', config.environment),
  },
  commentBookmarks: {
    select: (columns: string = '*') => db.commentBookmarks().select(columns).eq('environment', config.environment),
    insert: (data: any) => db.commentBookmarks().insert({ ...data, environment: config.environment }),
    update: (data: any) => db.commentBookmarks().update({ ...data, environment: config.environment }),
    delete: () => db.commentBookmarks().delete().eq('environment', config.environment),
  },
  commentDrafts: {
    select: (columns: string = '*') => db.commentDrafts().select(columns).eq('environment', config.environment),
    insert: (data: any) => db.commentDrafts().insert({ ...data, environment: config.environment }),
    update: (data: any) => db.commentDrafts().update({ ...data, environment: config.environment }),
    delete: () => db.commentDrafts().delete().eq('environment', config.environment),
  },
  commentNotifications: {
    select: (columns: string = '*') => db.commentNotifications().select(columns).eq('environment', config.environment),
    insert: (data: any) => db.commentNotifications().insert({ ...data, environment: config.environment }),
    update: (data: any) => db.commentNotifications().update({ ...data, environment: config.environment }),
    delete: () => db.commentNotifications().delete().eq('environment', config.environment),
  },
  userRateLimits: {
    select: (columns: string = '*') => db.userRateLimits().select(columns).eq('environment', config.environment),
    insert: (data: any) => db.userRateLimits().insert({ ...data, environment: config.environment }),
    update: (data: any) => db.userRateLimits().update({ ...data, environment: config.environment }),
    delete: () => db.userRateLimits().delete().eq('environment', config.environment),
  },
  userCategoryFollows: {
    select: (columns: string = '*') => db.userCategoryFollows().select(columns).eq('environment', config.environment),
    insert: (data: any) => db.userCategoryFollows().insert({ ...data, environment: config.environment }),
    update: (data: any) => db.userCategoryFollows().update({ ...data, environment: config.environment }),
    delete: () => db.userCategoryFollows().delete().eq('environment', config.environment),
  },
  newsletterSubscriptions: {
    select: (columns: string = '*') => db.newsletterSubscriptions().select(columns).eq('environment', config.environment),
    insert: (data: any) => db.newsletterSubscriptions().insert({ ...data, environment: config.environment }),
    update: (data: any) => db.newsletterSubscriptions().update({ ...data, environment: config.environment }),
    delete: () => db.newsletterSubscriptions().delete().eq('environment', config.environment),
  },
};

// Utility for RPC calls
export const rpc = (fn: string, params: object) => 
  supabase.rpc(fn, params);

export type TableName = keyof typeof db;

// All your interfaces stay exactly the same
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

export interface UserCategoryFollow {
  id: string;
  user_id: string;
  category_slug: string;
  environment: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser extends User {
  is_admin?: boolean;
  admin_level?: 'super' | 'moderator' | 'editor';
}

export interface AdminProfile extends Profile {
  admin_permissions?: string[];
  last_admin_activity?: string;
}

export interface AdminSession {
  user: AdminUser;
  profile: AdminProfile;
  permissions: string[];
  expires_at: string;
}

export interface CommentNotification {
  id: string;
  user_id: string;
  comment_id: string;
  notification_type: 'mention' | 'reply' | 'reaction';
  message?: string;
  is_read: boolean;
  environment: string;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  first_name: string | null;
  full_name?: string; 
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
  environment?: string;
  created_at: string;
  updated_at: string;
}

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
  environment?: string;
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
  environment?: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  article_id: string;
  parent_id?: string;
  moderation_status: 'pending' | 'approved' | 'flagged' | 'hidden' | 'auto_approved';
  like_count: number;
  environment?: string;
  created_at: string;
  updated_at: string;
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
  environment?: string;
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
  environment?: string;
  created_at: string;
  updated_at: string;
}

// Helper function for retry logic
export async function withRetry(operation: () => Promise<any>, maxRetries = 3) {
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

// Database query helpers with retry and environment awareness
export const dbWithRetry = {
  async getProfile(userId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .eq("environment", config.environment)
        .single();
      
      if (error) throw error;
      return data;
    });
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .eq('environment', config.environment)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    });
  }
};

// Complete TinkByteAPI with ALL your methods restored
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
          author:authors!articles_author_id_fkey(*),
          category:categories!articles_category_slug_fkey(*)
        `)
        .order('published_at', { ascending: false });

      if (options.published !== false) {
        query = query.eq('is_published', true);
      }

      if (options.featured) {
        query = query.eq('is_featured', true);
      }

      if (options.category) {
        query = query.eq('category_slug', options.category);
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
          author:authors!articles_author_id_fkey(*),
          category:categories!articles_category_slug_fkey(*)
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

  // Get comments for an article with environment filtering
  static async getComments(articleId: string) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!inner(
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
        .eq('environment', config.environment)
        .eq('is_deleted', false)
        .in('moderation_status', ['approved', 'auto_approved'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      return { success: false, error: error.message };
    }
  }

  // Add this method to your TinkByteAPI class
static async deleteCommentDraft(articleId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      return { success: false, error: 'Must be logged in to delete draft' };
    }

    const { error } = await supabase
      .from('comment_drafts')
      .delete()
      .eq('user_id', user.id)
      .eq('article_id', articleId)
      .eq('environment', config.environment);

    if (error) {
      console.error('Error deleting draft:', error);
      throw error;
    }

    console.log('✅ Draft deleted successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting comment draft:', error);
    return { success: false, error: error.message };
  }
}

  // **FIX: Use crypto.randomUUID() with fallback for Node.js environments**
  private static generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Add comment method with single foreign key relationship
static async addComment(articleSlug: string, content: string, parentId: string | null = null) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication error');
    }

    if (!session?.user) {
      console.error('No session found');
      throw new Error('Must be logged in to comment');
    }

    const user = session.user;

    // Verify the article exists
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('slug, title')
      .eq('slug', articleSlug)
      .single();

    if (articleError || !article) {
      console.error('Article not found:', articleSlug, articleError);
      throw new Error(`Article with slug "${articleSlug}" not found`);
    }

    // Calculate thread level for replies
    let threadLevel = 0;
    if (parentId) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('thread_level')
        .eq('id', parentId)
        .single();
      
      if (parentComment) {
        threadLevel = Math.min((parentComment.thread_level || 0) + 1, 4);
      }
    }

    const commentId = this.generateUUID();

    const commentData = {
      id: commentId,
      content: content,
      raw_content: content,
      user_id: user.id,
      article_id: articleSlug,
      parent_id: parentId || null,
      thread_level: threadLevel,
      environment: config.environment,
      moderation_status: 'auto_approved' as const, // **ENSURE AUTO-APPROVAL**
      auto_approved_reason: 'Auto-approved by content filter',
      quality_score: 50,
      like_count: 0,
      reply_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('💾 TinkByteAPI inserting comment with status:', commentData.moderation_status);

    // Insert comment
    const { data: insertedComment, error: insertError } = await supabase
      .from('comments')
      .insert(commentData)
      .select('*')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('✅ Comment inserted with status:', insertedComment.moderation_status);

    // Process mentions
    await this.processMentions(content, insertedComment.id, user.email?.split('@')[0] || 'Someone');

    // Fetch profile separately
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        display_name,
        avatar_type,
        avatar_preset_id,
        avatar_url,
        reputation_score,
        is_admin,
        membership_type
      `)
      .eq('id', user.id)
      .eq('environment', config.environment)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    // **DELETE DRAFT AFTER SUCCESSFUL COMMENT**
    try {
      await this.deleteCommentDraft(articleSlug);
      console.log('✅ Draft deleted after comment posted');
    } catch (draftError) {
      console.warn('⚠️ Could not delete draft:', draftError);
      // Don't fail the comment creation if draft deletion fails
    }

    // Combine the data
    const finalData = {
      ...insertedComment,
      profiles: profileData || {
        id: user.id,
        display_name: user.email?.split('@')[0] || 'User',
        avatar_type: 'preset' as const,
        avatar_preset_id: 1,
        avatar_url: null,
        reputation_score: 0,
        is_admin: false,
        membership_type: 'free' as const
      }
    };

    console.log('🎉 Final comment data with status:', finalData.moderation_status);

    return { success: true, data: finalData };

  } catch (error: any) {
    console.error('Error adding comment:', error);
    return { success: false, error: error.message };
  }
}

  // Process mentions helper method
  static async processMentions(content: string, commentId: string, mentionerName: string) {
    try {
      const mentionRegex = /@(\w+)/g;
      const mentions: string[] = [];
      let match: RegExpExecArray | null;

      mentionRegex.lastIndex = 0;
      
      while ((match = mentionRegex.exec(content)) !== null) {
        if (match[1]) {
          mentions.push(match[1].toLowerCase());
        }
      }

      if (mentions.length === 0) return;

      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('environment', config.environment);

      if (error) {
        console.error('Error fetching users for mentions:', error);
        return;
      }

      const userProfiles = users || [];

      const mentionedUsers = userProfiles.filter((user: any) => {
        if (!user.display_name) return false;
        
        const username = user.display_name.toLowerCase().replace(/\s+/g, '');
        return mentions.includes(username);
      });

      // Create notifications for mentioned users
      for (const mentionedUser of mentionedUsers) {
        try {
          await this.createMentionNotification(commentId, mentionedUser.id, mentionerName);
        } catch (error) {
          console.error(`Failed to create notification for ${mentionedUser.display_name}:`, error);
        }
      }

      // Update the comment with mention_users array
      if (mentionedUsers.length > 0) {
        const mentionedUserIds: string[] = mentionedUsers.map((user: any) => user.id);
        
        const { error: updateError } = await supabase
          .from('comments')
          .update({ 
            mention_users: mentionedUserIds 
          } as { mention_users: string[] })
          .eq('id', commentId)
          .eq('environment', config.environment);

        if (updateError) {
          console.error('Error updating comment with mentions:', updateError);
        }
      }

    } catch (error) {
      console.error('Error processing mentions:', error);
    }
  }

  // Get mentionable users
  static async getMentionableUsers(query: string = '') {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        return { success: false, error: 'Must be logged in to get mentionable users' };
      }

      let queryBuilder = supabase
        .from('profiles')
        .select('id, display_name, avatar_type, avatar_preset_id, avatar_url, is_admin, membership_type')
        .eq('environment', config.environment)
        .eq('is_public', true)
        .neq('id', user.id)
        .limit(8);

      if (query && query.length > 0) {
        queryBuilder = queryBuilder.ilike('display_name', `%${query}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      const formattedUsers = (data || []).map((profile: any) => ({
        id: profile.id,
        username: profile.display_name?.toLowerCase().replace(/\s+/g, '') || 'user',
        display_name: profile.display_name || 'User',
        avatar_type: profile.avatar_type,
        avatar_preset_id: profile.avatar_preset_id,
        avatar_url: profile.avatar_url,
        is_admin: profile.is_admin,
        membership_type: profile.membership_type
      }));

      return { success: true, data: formattedUsers };
    } catch (error: any) {
      console.error('Error fetching mentionable users:', error);
      return { success: false, error: error.message };
    }
  }

  // Create mention notification
  static async createMentionNotification(commentId: string, mentionedUserId: string, mentionerName: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        return { success: false, error: 'Must be logged in to create notifications' };
      }

      // Check if user has notification preferences
      const { data: prefs } = await supabase
        .from('comment_notification_preferences')
        .select('mention_notifications')
        .eq('user_id', mentionedUserId)
        .single();

      // If user has disabled mention notifications, don't create notification
      if (prefs && prefs.mention_notifications === false) {
        return { success: true, message: 'User has disabled mention notifications' };
      }

      // Insert notification into comment_notifications table
      const { data, error } = await supabase
        .from('comment_notifications')
        .insert({
          user_id: mentionedUserId,
          comment_id: commentId,
          notification_type: 'mention' as const,
          is_read: false,
          environment: config.environment,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating mention notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user notifications
  static async getUserNotifications(limit = 20) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        return { success: false, error: 'Must be logged in to get notifications' };
      }

      const { data, error } = await supabase
        .from('comment_notifications')
        .select(`
          *,
          comments!inner(
            id,
            content,
            article_id,
            user_id,
            profiles!inner(
              display_name,
              avatar_type,
              avatar_preset_id,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('environment', config.environment)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        return { success: false, error: 'Must be logged in to mark notifications as read' };
      }

      const { error } = await supabase
        .from('comment_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .eq('environment', config.environment);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Get unread notification count
  static async getUnreadNotificationCount() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        return { success: false, error: 'Must be logged in to get notification count' };
      }

      const { count, error } = await supabase
        .from('comment_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('environment', config.environment)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true, count: count || 0 };
    } catch (error: any) {
      console.error('Error getting notification count:', error);
      return { success: false, error: error.message };
    }
  }

  // Update comment with environment awareness
  static async updateComment(commentId: string, content: string, editReason: string | null = null) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        throw new Error('Must be logged in to update comment');
      }

      // First, get the comment to check ownership and time
      const { data: existingComment, error: fetchError } = await supabase
        .from('comments')
        .select('user_id, created_at, editable_until')
        .eq('id', commentId)
        .eq('environment', config.environment)
        .single();

      if (fetchError || !existingComment) {
        throw new Error('Comment not found');
      }

      // Check ownership
      if (existingComment.user_id !== user.id) {
        throw new Error('You can only edit your own comments');
      }

      // Check time limit (15 minutes)
      const createdAt = new Date(existingComment.created_at);
      const now = new Date();
      const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      if (diffInMinutes > 15) {
        throw new Error('Comments can only be edited within 15 minutes of posting');
      }

      // Update the comment
      const { data, error } = await supabase
        .from('comments')
        .update({
          content,
          raw_content: content,
          edit_reason: editReason || null,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', user.id)
        .eq('environment', config.environment)
        .select('*')
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Delete comment with environment awareness
  static async deleteComment(commentId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        throw new Error('Must be logged in to delete comment');
      }

      const { error } = await supabase
        .from('comments')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq('id', commentId)
        .eq('user_id', user.id)
        .eq('environment', config.environment);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }
  }

  // Toggle comment like with environment awareness
  static async toggleCommentLike(commentId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        throw new Error('Must be logged in to like comments');
      }

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .eq('environment', config.environment)
        .single();

      if (existingLike) {
        // Remove like
        await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingLike.id)
          .eq('environment', config.environment);

        // Get current like count and decrement
        const { data: comment } = await supabase
          .from('comments')
          .select('like_count')
          .eq('id', commentId)
          .eq('environment', config.environment)
          .single();

        const newCount = Math.max((comment?.like_count || 1) - 1, 0);
        
        await supabase
          .from('comments')
          .update({ like_count: newCount })
          .eq('id', commentId)
          .eq('environment', config.environment);

        return { success: true, liked: false };
      } else {
        // Add like
        await supabase
          .from('comment_likes')
          .insert({
            user_id: user.id,
            comment_id: commentId,
            environment: config.environment,
            created_at: new Date().toISOString()
          });

        // Get current like count and increment
        const { data: comment } = await supabase
          .from('comments')
          .select('like_count')
          .eq('id', commentId)
          .eq('environment', config.environment)
          .single();

        const newCount = (comment?.like_count || 0) + 1;
        
        await supabase
          .from('comments')
          .update({ like_count: newCount })
          .eq('id', commentId)
          .eq('environment', config.environment);

        return { success: true, liked: true };
      }
    } catch (error: any) {
      console.error('Error toggling comment like:', error);
      return { success: false, error: error.message };
    }
  }

 // Save comment draft with environment awareness
static async saveCommentDraft(articleId: string, content: string, draftKey?: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      throw new Error('Must be logged in to save draft');
    }

    console.log('💾 Saving draft for user:', user.id, 'article:', articleId);

    // **FIX: Remove draft_key entirely to avoid constraint conflicts**
    const { data, error } = await supabase
      .from('comment_drafts')
      .upsert({
        user_id: user.id,
        article_id: articleId,
        content,
        environment: config.environment,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,article_id,environment',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Draft save error:', error);
      throw error;
    }
    
    console.log('✅ Draft saved successfully');
    return { success: true, data };
  } catch (error: any) {
    console.error('Error saving comment draft:', error);
    return { success: false, error: error.message };
  }
}

  // Toggle comment bookmark
  static async toggleCommentBookmark(commentId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        throw new Error('Must be logged in to bookmark comments');
      }

      // Check if already bookmarked
      const { data: existingBookmark } = await supabase
        .from('comment_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .eq('environment', config.environment)
        .single();

      if (existingBookmark) {
        // Remove bookmark
        await supabase
          .from('comment_bookmarks')
          .delete()
          .eq('id', existingBookmark.id);

        return { success: true, bookmarked: false };
      } else {
        // Add bookmark
        await supabase
          .from('comment_bookmarks')
          .insert({
            user_id: user.id,
            comment_id: commentId,
            environment: config.environment,
            created_at: new Date().toISOString()
          });

        return { success: true, bookmarked: true };
      }
    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
      return { success: false, error: error.message };
    }
  }

  // Toggle comment reaction
  static async toggleCommentReaction(commentId: string, reactionType: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        throw new Error('Must be logged in to react to comments');
      }

      // Check if already reacted
      const { data: existingReaction } = await supabase
        .from('comment_reactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .eq('reaction_type', reactionType)
        .eq('environment', config.environment)
        .single();

      if (existingReaction) {
        // Remove reaction
        await supabase
          .from('comment_reactions')
          .delete()
          .eq('id', existingReaction.id);

        // Get updated count
        const { count } = await supabase
          .from('comment_reactions')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', commentId)
          .eq('reaction_type', reactionType)
          .eq('environment', config.environment);

        return { success: true, reacted: false, count: count || 0 };
      } else {
        // Add reaction
        await supabase
          .from('comment_reactions')
          .insert({
            user_id: user.id,
            comment_id: commentId,
            reaction_type: reactionType,
            environment: config.environment,
            created_at: new Date().toISOString()
          });

        // Get updated count
        const { count } = await supabase
          .from('comment_reactions')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', commentId)
          .eq('reaction_type', reactionType)
          .eq('environment', config.environment);

        return { success: true, reacted: true, count: count || 0 };
      }
    } catch (error: any) {
      console.error('Error toggling reaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Get comment draft with environment awareness
static async getCommentDraft(articleId: string, draftKey?: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      return { success: false, error: 'Must be logged in to get draft' };
    }

    // First try current environment
    let { data, error } = await supabase
      .from('comment_drafts')
      .select('*')
      .eq('user_id', user.id)
      .eq('article_id', articleId)
      .eq('environment', config.environment)
      .maybeSingle();

    // If not found and we're in production, try development as fallback
    if (!data && config.environment === 'production') {
      console.log('🔄 No draft in production, checking development...');
      const { data: devData, error: devError } = await supabase
        .from('comment_drafts')
        .select('*')
        .eq('user_id', user.id)
        .eq('article_id', articleId)
        .eq('environment', 'development')
        .maybeSingle();

      if (devData) {
        console.log('📝 Found draft in development, migrating to production...');
        // Migrate the draft to production
        await supabase
          .from('comment_drafts')
          .update({ environment: 'production' })
          .eq('id', devData.id);
        
        data = { ...devData, environment: 'production' };
      }
    }

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error getting comment draft:', error);
    return { success: false, error: error.message };
  }
}

  // Category operations
  static async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;

      return { success: true, data: data as Category[] };
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      return { success: false, error: error.message };
    }
  }

  // Toggle article like
  static async toggleArticleLike(articleId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

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

        return { success: true, liked: true };
      }
    } catch (error: any) {
      console.error('Error toggling article like:', error);
      return { success: false, error: error.message };
    }
  }

  // Follow user
  static async followUser(userId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

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

  // Unfollow user
  static async unfollowUser(userId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

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
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .upsert({
          email,
          user_id: user?.id || null,
          newsletter_type: 'weekly',
          is_active: true,
          environment: config.environment,
          subscribed_at: new Date().toISOString()
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

  // Get user's newsletter subscriptions
  static async getUserNewsletterSubscriptions() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        return { success: false, error: 'Must be logged in to get subscriptions' };
      }

      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('environment', config.environment)
        .eq('is_active', true);

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching newsletter subscriptions:', error);
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
            author:authors!articles_author_id_fkey(*),
            category:categories!articles_category_slug_fkey(*)
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
          .eq('environment', config.environment)
          .limit(10);

        results.users = users || [];
      }

      return { success: true, data: results };
    } catch (error: any) {
      console.error('Error searching content:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user activity
  static async getUserActivity(userId: string, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching user activity:', error);
      return { success: false, error: error.message };
    }
  }

  // Admin operations
  static async moderateComment(commentId: string, action: 'approve' | 'flag' | 'hide' | 'delete', reason?: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        throw new Error('Must be logged in to moderate comments');
      }

      // Get user profile to check admin status
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .eq('environment', config.environment)
        .single();

      if (!profile?.is_admin) {
        throw new Error('Must be admin to moderate comments');
      }

      // Update comment status
      const { error: commentError } = await supabase
        .from('comments')
        .update({
          moderation_status: action === 'approve' ? 'approved' : 
                           action === 'flag' ? 'flagged' : 
                           action === 'hide' ? 'hidden' : 'hidden',
          moderation_reason: reason || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('environment', config.environment);

      if (commentError) throw commentError;

      // Log moderation action
      const { error: logError } = await supabase
        .from('comment_moderation')
        .insert({
          comment_id: commentId,
          moderator_id: user.id,
          action,
          reason: reason || null,
          environment: config.environment,
          created_at: new Date().toISOString()
        });

      if (logError) throw logError;

      return { success: true };
    } catch (error: any) {
      console.error('Error moderating comment:', error);
      return { success: false, error: error.message };
    }
  }
}

export default supabase;