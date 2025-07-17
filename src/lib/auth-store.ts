// src/lib/auth-store.ts - UPDATED for instant access
import { auth } from './auth.js';
import type { User, Profile } from './supabase.js';

class AuthStore {
  private static instance: AuthStore;
  private user: User | null = null;
  private profile: Profile | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  static getInstance(): AuthStore {
    if (!AuthStore.instance) {
      AuthStore.instance = new AuthStore();
      // Load from cache immediately on first access
      AuthStore.instance.loadFromCacheSync();
    }
    return AuthStore.instance;
  }

  // Synchronously load from cache (instant)
  private loadFromCacheSync(): void {
    try {
      const cachedUser = localStorage.getItem('tinkbyte-user');
      const cachedProfile = localStorage.getItem('tinkbyte-profile');
      
      if (cachedUser && cachedProfile) {
        this.user = JSON.parse(cachedUser);
        this.profile = JSON.parse(cachedProfile);
        this.isInitialized = true;
        
        console.log('⚡ AuthStore: Instant cache load', {
          user: this.user?.email,
          profile: this.profile?.display_name
        });
      }
    } catch (error) {
      console.error('❌ AuthStore: Cache load error:', error);
      this.clearAuthData();
    }
  }

  async initialize(): Promise<void> {
    // If already loaded from cache, just verify in background
    if (this.isInitialized && this.user && this.profile) {
      this.verifyAuthInBackground();
      return Promise.resolve();
    }

    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('🔄 AuthStore: Full initialization...');
      
      // Initialize your existing auth system
      await auth.initialize();
      
      this.user = auth.getUser();
      this.profile = auth.getProfile();
      
      console.log('✅ AuthStore: Loaded from auth system', {
        user: this.user?.email,
        profile: this.profile?.display_name
      });
      
      if (this.user && this.profile) {
        this.cacheAuthData();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ AuthStore: Initialization error:', error);
      this.isInitialized = true;
    }
  }

  private async verifyAuthInBackground(): Promise<void> {
    try {
      console.log('🔄 AuthStore: Background verification...');
      
      const authCheck = await auth.simpleAuthCheck();
      if (!authCheck.isAuthenticated) {
        console.log('❌ AuthStore: Auth expired, clearing cache');
        this.clearAuthData();
        window.location.href = '/auth/signin';
        return;
      }

      // Refresh profile data in background
      await auth.initialize();
      const freshUser = auth.getUser();
      const freshProfile = auth.getProfile();

      if (freshUser && freshProfile) {
        const profileChanged = JSON.stringify(this.profile) !== JSON.stringify(freshProfile);
        
        if (profileChanged) {
          console.log('🔄 AuthStore: Profile updated in background');
          this.user = freshUser;
          this.profile = freshProfile;
          this.cacheAuthData();
          this.notifyProfileUpdate();
        }
      }
    } catch (error) {
      console.error('❌ AuthStore: Background verification failed:', error);
    }
  }

  private notifyProfileUpdate(): void {
    window.dispatchEvent(new CustomEvent('profile-updated', {
      detail: { user: this.user, profile: this.profile }
    }));
  }

  private cacheAuthData(): void {
    if (this.user) {
      localStorage.setItem('tinkbyte-user', JSON.stringify(this.user));
    }
    if (this.profile) {
      localStorage.setItem('tinkbyte-profile', JSON.stringify(this.profile));
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem('tinkbyte-user');
    localStorage.removeItem('tinkbyte-profile');
    this.user = null;
    this.profile = null;
    this.isInitialized = false;
  }

  // Instant access (no loading) - these should NEVER be null if properly cached
  getUser(): User | null {
    return this.user;
  }

  getProfile(): Profile | null {
    return this.profile;
  }

  isAuthenticated(): boolean {
    return !!this.user;
  }

  // Check if data is available instantly
  hasInstantData(): boolean {
    return this.isInitialized && !!this.user && !!this.profile;
  }

  updateProfile(profile: Profile): void {
    this.profile = profile;
    this.cacheAuthData();
    this.notifyProfileUpdate();
  }

  async signOut(): Promise<void> {
    try {
      await auth.signOut();
    } finally {
      this.clearAuthData();
    }
  }

  getDisplayName(): string {
    if (this.profile?.display_name && this.profile.display_name !== "TBMember") {
      return this.profile.display_name;
    }
    
    if (this.user?.user_metadata?.display_name) {
      return this.user.user_metadata.display_name;
    }
    
    if (this.user?.user_metadata?.full_name) {
      return this.user.user_metadata.full_name;
    }
    
    if (this.user?.user_metadata?.name) {
      return this.user.user_metadata.name;
    }
    
    if (this.user?.email) {
      return this.user.email.split('@')[0];
    }
    
    return 'TBMember';
  }

  getAvatarUrl(): string {
    return auth.getAvatarUrl();
  }
}

export const authStore = AuthStore.getInstance();