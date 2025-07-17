// src/lib/auth.ts
import { supabase, AuthState, type User, type Profile } from './supabase.js';
import type { Session } from '@supabase/supabase-js';

export type { Profile, User };

export interface AuthProfileData {
  user: User;
  profile: Profile | null;
  stats?: {
    followed_articles: number;
    following_topics: number;
    following_users: number;
    articles_read: number;
    comments_posted: number;
  };
}

export interface AuthCheckResult {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
}

class TinkByteAuth {
  private authState: AuthState;
  private listeners: Array<(user: User | null, profile: Profile | null) => void> = [];
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  public supabase = supabase;

  constructor() {
    this.authState = AuthState.getInstance();
  }

  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    if (this.initialized) return Promise.resolve();

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('🔐 TinkByteAuth: Initializing...');
      
      await this.authState.initialize();
      
      this.authState.onAuthChange((user, profile) => {
        this.notifyListeners(user, profile);
      });

      this.initialized = true;
      
      const user = this.authState.getUser();
      const profile = this.authState.getProfile();
      this.notifyListeners(user, profile);
      
    } catch (error) {
      console.error('🔐 TinkByteAuth: Initialization failed:', error);
      this.initialized = true;
      this.notifyListeners(null, null);
    }
  }

  onAuthChange(callback: (user: User | null, profile: Profile | null) => void) {
    this.listeners.push(callback);
    
    const user = this.authState.getUser();
    const profile = this.authState.getProfile();
    callback(user, profile);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(user: User | null, profile: Profile | null): void {
    this.listeners.forEach(callback => {
      try {
        callback(user, profile);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  getUser(): User | null {
    return this.authState.getUser();
  }

  getProfile(): Profile | null {
    return this.authState.getProfile();
  }

  getDisplayName(): string {
    const profile = this.authState.getProfile();
    const user = this.authState.getUser();
    
    return profile?.display_name || 
           user?.user_metadata?.display_name ||
           user?.email?.split('@')[0] || 
           'TBMember';
  }

// src/lib/auth.ts - UPDATE getAvatarUrl method
getAvatarUrl(): string {
  const profile = this.authState.getProfile();
  
  // Handle uploaded files
  if (profile?.avatar_type === 'uploaded' && profile?.avatar_url) {
    return profile.avatar_url;
  }
  
  // Handle Google avatars
  if (profile?.avatar_type === 'google' && profile?.avatar_url) {
    return profile.avatar_url;
  }
  
  // Fallback to preset
  return `/images/avatars/preset-${profile?.avatar_preset_id || 1}.svg`;
}

  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session?.user;
    } catch (error) {
      return false;
    }
  }

    async simpleAuthCheck(): Promise<AuthCheckResult> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth check error:', error);
        return { isAuthenticated: false, user: null, session: null };
      }

      return {
        isAuthenticated: !!session?.user,
        user: session?.user as User || null,
        session: session
      };
    } catch (error) {
      console.error('Auth check failed:', error);
      return { isAuthenticated: false, user: null, session: null };
    }
  }
  
  // Email signup with OTP
  async signUpWithEmail(email: string, displayName: string) {
    try {
      console.log('🔐 Email signup for:', email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('🔐 Email signup error:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify OTP
  async verifyOTP(email: string, token: string) {
    try {
      console.log('🔐 Verifying OTP for:', email);
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('🔐 OTP verification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Email signin with password
  async signInWithEmail(email: string, password: string) {
    try {
      console.log('🔐 Email signin for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('🔐 Email signin error:', error);
      return { success: false, error: error.message };
    }
  }

async signInWithGoogle() {
  try {
    console.log('🔐 Google signin starting...');
    console.log('🔐 Current origin:', window.location.origin);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        }
      }
    });

    console.log('🔐 Google signin response:', { data, error });

    if (error) {
      console.error('🔐 Google signin error details:', error);
      throw error;
    }

    console.log('🔐 Google signin successful, redirecting...');
    return { success: true, data };
  } catch (error: any) {
    console.error('🔐 Google signin error:', error);
    return { success: false, error: error.message };
  }
}

  // Set password after OTP verification
  async setPassword(password: string) {
    try {
      console.log('🔐 Setting password');
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('🔐 Set password error:', error);
      return { success: false, error: error.message };
    }
  }

  // Password reset
  async resetPassword(email: string) {
    try {
      console.log('🔐 Password reset for:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('🔐 Password reset error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update password
  async updatePassword(password: string) {
    try {
      console.log('🔐 Updating password');
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('🔐 Update password error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign out
  async signOut() {
    try {
      console.log('🔐 Signing out');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('🔐 Signout error:', error);
      }
      
      // Clear everything
      this.initialized = false;
      this.initPromise = null;
      this.listeners = [];
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      return { success: true };
    } catch (error: any) {
      console.error('🔐 Signout error:', error);
      
      localStorage.clear();
      sessionStorage.clear();
      
      this.initialized = false;
      this.initPromise = null;
      this.listeners = [];
      
      return { success: true };
    }
  }

  // Update profile
  async updateProfile(updates: Partial<Profile>) {
    return await this.authState.updateProfile(updates);
  }

  // Load profile data with stats
  async loadProfileData(): Promise<AuthProfileData | null> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      await this.authState.refreshProfile();
      
      const user = this.authState.getUser();
      const profile = this.authState.getProfile();
      
      if (!user) {
        console.error('🔐 TinkByteAuth: No authenticated user');
        return null;
      }

      const stats = await this.loadUserStats(user.id);

      return {
        user,
        profile,
        stats
      } as AuthProfileData;
    } catch (error) {
      console.error('🔐 TinkByteAuth: Error loading profile data:', error);
      return null;
    }
  }

  private async loadUserStats(userId: string) {
    try {
      const [followedArticles, followingTopics, followingUsers] = await Promise.all([
        supabase.from('article_follows').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('user_category_follows').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('user_follows').select('id', { count: 'exact' }).eq('follower_id', userId).eq('follow_type', 'user')
      ]);

      return {
        followed_articles: followedArticles.count || 0,
        following_topics: followingTopics.count || 0,
        following_users: followingUsers.count || 0,
        articles_read: 0,
        comments_posted: 0
      };
    } catch (error) {
      console.error('Error loading user stats:', error);
      return {
        followed_articles: 0,
        following_topics: 0,
        following_users: 0,
        articles_read: 0,
        comments_posted: 0
      };
    }
  }
}

export const auth = new TinkByteAuth();