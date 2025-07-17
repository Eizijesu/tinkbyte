// src/lib/auth.ts - FIXED RACE CONDITIONS
import { supabase } from './supabase.js';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_type: 'preset' | 'uploaded';
  avatar_preset_id: number;
  avatar_url?: string;
  website?: string;
  twitter_handle?: string;
  linkedin_url?: string;
  github_username?: string;
  location?: string;
  job_title?: string;
  company?: string;
  total_reads: number;
  total_comments: number;
  total_articles: number;
  reputation_score: number;
  following_count: number;
  followers_count: number;
  is_public: boolean;
  membership_type: 'free' | 'premium' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  following_topics: number;
  following_users: number;
  followed_articles: number;
  followers: number;
  articles_read: number;
  comments_posted: number;
}

export interface ProfileData {
  profile: Profile | null;
  stats: UserStats | null;
  preferences: any | null;
}

class TinkByteAuth {
  private user: User | null = null;
  private profile: Profile | null = null;
  private session: Session | null = null;
  private listeners: Array<(user: User | null, profile: Profile | null) => void> = [];
  private initialized = false;
  private initializing = false;
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();

  async initialize(): Promise<void> {
    if (this.initialized || this.initializing) return;
    
    this.initializing = true;
    console.log('🔄 Auth: Starting initialization...');

    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Auth initialization error:', error);
        this.initializing = false;
        return;
      }

      console.log('📋 Auth: Initial session check:', session ? 'Found session' : 'No session');

      if (session?.user) {
        await this.setUserData(session.user, session);
      }

      // Set up auth state listener - ONLY ONCE
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email || 'no user');
        
        if (event === 'SIGNED_IN' && session?.user) {
          await this.setUserData(session.user, session);
        } else if (event === 'SIGNED_OUT') {
          this.clearUserData();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Don't reload profile on token refresh, just update session
          this.session = session;
        }
        
        this.notifyListeners();
      });

      this.initialized = true;
      this.initializing = false;
      console.log('✅ Auth: Initialization complete');
      
      // Notify listeners after everything is set up
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      this.initializing = false;
    }
  }

  private async setUserData(user: User, session: Session): Promise<void> {
    console.log('📝 Auth: Setting user data for:', user.email);
    
    this.user = user;
    this.session = session;

    // Load profile with caching
    const cacheKey = `profile_${user.id}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('💾 Auth: Using cached profile');
      this.profile = cached;
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error loading profile:', error);
        throw error;
      }

      if (profile) {
        console.log('✅ Auth: Profile loaded from database');
        this.profile = profile;
        this.setCache(cacheKey, profile, 5 * 60 * 1000); // 5 minutes cache
      } else {
        console.log('🆕 Auth: Creating new profile');
        await this.createProfile(user);
      }
    } catch (error) {
      console.error('❌ Error in setUserData:', error);
      // Don't throw, just continue without profile
    }
  }

  private async createProfile(user: User): Promise<void> {
    const displayName = user.user_metadata?.display_name || 
                       user.user_metadata?.full_name || 
                       user.email?.split('@')[0] || 
                       'TBMember';

    const newProfile = {
      id: user.id,
      display_name: displayName,
      first_name: user.user_metadata?.given_name || null,
      last_name: user.user_metadata?.family_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      avatar_type: user.user_metadata?.avatar_url ? 'uploaded' as const : 'preset' as const,
      avatar_preset_id: 1,
      total_reads: 0,
      total_comments: 0,
      total_articles: 0,
      reputation_score: 0,
      following_count: 0,
      followers_count: 0,
      is_public: true,
      membership_type: 'free' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Auth: Profile created successfully');
      this.profile = data;
      this.setCache(`profile_${user.id}`, data, 5 * 60 * 1000);
    } catch (error) {
      console.error('❌ Error creating profile:', error);
    }
  }

  private clearUserData(): void {
    console.log('🧹 Auth: Clearing user data');
    this.user = null;
    this.profile = null;
    this.session = null;
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + ttl);
  }

  private getFromCache(key: string): any {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  onAuthChange(callback: (user: User | null, profile: Profile | null) => void) {
    this.listeners.push(callback);
    
    // Call immediately if already initialized
    if (this.initialized) {
      callback(this.user, this.profile);
    }

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    console.log('📢 Auth: Notifying listeners, user:', this.user?.email || 'none');
    this.listeners.forEach(callback => {
      try {
        callback(this.user, this.profile);
      } catch (error) {
        console.error('❌ Error in auth listener:', error);
      }
    });
  }

  // Public getters
  getUser(): User | null {
    return this.user;
  }

  getProfile(): Profile | null {
    return this.profile;
  }

  getSession(): Session | null {
    return this.session;
  }

  isAuthenticated(): boolean {
    return !!(this.user && this.session);
  }

  getDisplayName(): string {
    return this.profile?.display_name || 
           this.user?.email?.split('@')[0] || 
           'TBMember';
  }

  getAvatarUrl(): string {
    if (this.profile?.avatar_type === 'uploaded' && this.profile?.avatar_url) {
      return this.profile.avatar_url;
    }
    return `/images/avatars/preset-${this.profile?.avatar_preset_id || 1}.svg`;
  }

  // Auth methods
  async signInWithEmail(email: string, password: string) {
    try {
      console.log('🔐 Auth: Signing in with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      console.log('✅ Auth: Email sign in successful');
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Auth: Email sign in failed:', error);
      return { success: false, error: error.message };
    }
  }

  async signUpWithEmail(email: string, password: string, displayName: string) {
    try {
      console.log('📝 Auth: Signing up with email:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      });

      if (error) throw error;

      console.log('✅ Auth: Email sign up successful');
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Auth: Email sign up failed:', error);
      return { success: false, error: error.message };
    }
  }

  async signInWithGoogle() {
    try {
      console.log('🔐 Auth: Signing in with Google');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      console.log('✅ Auth: Google sign in initiated');
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Auth: Google sign in failed:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      console.log('🚪 Auth: Signing out');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      this.clearUserData();
      console.log('✅ Auth: Sign out successful');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Auth: Sign out failed:', error);
      return { success: false, error: error.message };
    }
  }

  async updateProfile(updates: Partial<Profile>) {
    if (!this.user) {
      return { success: false, error: 'Not authenticated' };
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

      if (error) throw error;

      this.profile = data;
      this.setCache(`profile_${this.user.id}`, data, 5 * 60 * 1000);
      this.notifyListeners();

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Batch data loading for profile pages
  async loadProfileData(userId?: string): Promise<ProfileData | null> {
    const targetUserId = userId || this.user?.id;
    if (!targetUserId) return null;

    const cacheKey = `profile_data_${targetUserId}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const [
        profileResult,
        statsResult,
        preferencesResult
      ] = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', targetUserId).single(),
        this.loadUserStats(targetUserId),
        supabase.from('user_preferences').select('*').eq('id', targetUserId).single()
      ]);

      const data: ProfileData = {
        profile: profileResult.status === 'fulfilled' ? profileResult.value.data : null,
        stats: statsResult.status === 'fulfilled' ? statsResult.value : null,
        preferences: preferencesResult.status === 'fulfilled' ? preferencesResult.value.data : null
      };

      this.setCache(cacheKey, data, 2 * 60 * 1000); // 2 minutes cache
      return data;
    } catch (error) {
      console.error('Error loading profile data:', error);
      return null;
    }
  }

  private async loadUserStats(userId: string): Promise<UserStats> {
    const [
      categoriesResult,
      followingUsersResult,
      articleFollowsResult,
      followersResult,
      articleReadsResult,
      commentsResult
    ] = await Promise.allSettled([
      supabase.from('user_category_follows').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      supabase.from('article_follows').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('article_reads').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_deleted', false)
    ]);

    return {
      following_topics: this.getResultCount(categoriesResult),
      following_users: this.getResultCount(followingUsersResult),
      followed_articles: this.getResultCount(articleFollowsResult),
      followers: this.getResultCount(followersResult),
      articles_read: this.getResultCount(articleReadsResult),
      comments_posted: this.getResultCount(commentsResult)
    };
  }

  private getResultCount(result: any): number {
    return result.status === 'fulfilled' ? result.value.count || 0 : 0;
  }
}

export const auth = new TinkByteAuth();