// src/lib/auth.ts - FIXED TYPESCRIPT ERRORS
import { supabase, type User, type Profile } from './supabase.js';
import { config, isDevelopment, shouldLog, getEnvironmentFor } from './config.js';
import { EmailService } from './email.js';
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

interface CustomUserMetadata {
  display_name?: string;
  full_name?: string;
  given_name?: string;
  family_name?: string;
  avatar_url?: string;
  picture?: string;
  name?: string;
  provider?: string;
  needs_password_setup?: boolean;
  temp_password?: boolean;
  password_set_at?: string;
  email_verified?: boolean;
  last_sign_in_at?: string;
}

export interface AuthCheckResult {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
}

class TinkByteAuthManager {
  private static instance: TinkByteAuthManager;
  private listeners: Array<(user: User | null, profile: Profile | null) => void> = [];
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private currentUser: User | null = null;
  private currentProfile: Profile | null = null;

  public authState: {
    currentUser: User | null;
    profile: Profile | null;
    isAuthenticated: boolean;
  } = {
    currentUser: null,
    profile: null,
    isAuthenticated: false
  };

  // ✅ CACHE PROPERTIES
  private readonly AUTH_CACHE_KEY = 'tinkbyte_auth_cache';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // ✅ FIXED: SINGLE debugLog METHOD
  private debugLog(...args: any[]) {
    if (shouldLog() && isDevelopment()) {
      console.log(...args);
    }
  }

  // ✅ FIXED: SINGLE errorLog METHOD  
  private errorLog(...args: any[]) {
    if (shouldLog() && isDevelopment()) {
      console.error(...args);
    }
  }

  // ✅ FIXED: ADD MISSING CACHE METHODS
  private getAuthCache(): { user: User | null; profile: Profile | null; timestamp: number } | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(this.AUTH_CACHE_KEY);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      
      if (Date.now() - data.timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(this.AUTH_CACHE_KEY);
        return null;
      }
      
      return data;
    } catch {
      localStorage.removeItem(this.AUTH_CACHE_KEY);
      return null;
    }
  }

  private setAuthCache(user: User | null, profile: Profile | null): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = {
        user,
        profile,
        timestamp: Date.now()
      };
      localStorage.setItem(this.AUTH_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      // Ignore cache errors
    }
  }

  private clearAuthCache(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.AUTH_CACHE_KEY);
    }
  }

  // ✅ QUICK SYNC METHOD
  getAuthStateSync(): { user: User | null; profile: Profile | null; isLoading: boolean } {
    const cached = this.getAuthCache();
    
    return {
      user: this.currentUser || cached?.user || null,
      profile: this.currentProfile || cached?.profile || null,
      isLoading: !this.initialized
    };
  }

  private constructor() {}

  static getInstance(): TinkByteAuthManager {
    if (!TinkByteAuthManager.instance) {
      TinkByteAuthManager.instance = new TinkByteAuthManager();
    }
    return TinkByteAuthManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    if (this.initialized) return Promise.resolve();

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      this.debugLog('🔐 TinkByteAuth: Initializing...');
      
      // ✅ STEP 1: Load from cache first
      const cached = this.getAuthCache();
      if (cached && cached.user) {
        this.debugLog('⚡ Auth: Loading from cache');
        this.currentUser = cached.user;
        this.currentProfile = cached.profile;
        this.updateAuthState();
        this.notifyListeners(this.currentUser, this.currentProfile);
      }
      
      // ✅ STEP 2: Verify with Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.errorLog('❌ Auth initialization error:', error);
        this.clearAuthCache();
        this.initialized = true;
        return;
      }

      if (session?.user) {
        if (!cached || cached.user?.id !== session.user.id) {
          await this.setUserData(session.user, session);
        } else {
          this.currentUser = session.user;
          this.updateAuthState();
        }
      } else if (cached) {
        this.clearAuthCache();
        this.clearUserData();
      }

      // ✅ AUTH STATE LISTENER
      supabase.auth.onAuthStateChange(async (event, session) => {
        this.debugLog('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await this.setUserData(session.user, session);
        } else if (event === 'SIGNED_OUT') {
          this.clearUserData();
          this.clearAuthCache();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          this.currentUser = session.user;
          this.setAuthCache(this.currentUser, this.currentProfile);
        }
        
        this.notifyListeners(this.currentUser, this.currentProfile);
      });

      this.initialized = true;
      
    } catch (error) {
      this.errorLog('🔐 TinkByteAuth: Initialization failed:', error);
      this.clearAuthCache();
      this.initialized = true;
      this.notifyListeners(null, null);
    }
  }

private async setUserData(user: User, session: Session): Promise<void> {
  this.debugLog('📝 Auth: Setting user data for:', user.email);
  
  this.currentUser = user;

  try {
    // ✅ REMOVE ENVIRONMENT FILTER COMPLETELY
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      this.debugLog('⚠️ Profile not found, creating new one');
      await this.createProfile(user);
    } else if (profile) {
      this.debugLog('✅ Auth: Profile loaded from database');
      this.currentProfile = profile;
    } else {
      this.debugLog('🆕 Auth: Creating new profile');
      await this.createProfile(user);
    }

    this.setAuthCache(this.currentUser, this.currentProfile);
    
  } catch (error) {
    this.errorLog('❌ Error in setUserData:', error);
  }

  this.updateAuthState();
}

  private updateAuthState(): void {
    this.authState = {
      currentUser: this.currentUser,
      profile: this.currentProfile,
      isAuthenticated: !!this.currentUser
    };
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
  // ✅ PRESERVE ALL AVATAR TYPES PROPERLY
  avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
  avatar_type: this.determineAvatarType(user),
  avatar_preset_id: 1,
  total_reads: 0,
  total_comments: 0,
  total_articles: 0,
  reputation_score: 0,
  following_count: 0,
  followers_count: 0,
  is_public: true,
  membership_type: 'free' as const,
  is_admin: user.email === 'tinkbytehq@gmail.com',
  environment: config.environment,
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
      
      this.debugLog('✅ Auth: Profile created successfully');
      this.currentProfile = data;
    } catch (error) {
      this.errorLog('❌ Error creating profile:', error);
    }
  }

  private determineAvatarType(user: User): 'preset' | 'uploaded' | 'google' {
  // Check if it's a Google OAuth user
  const provider = user.app_metadata?.provider;
  if (provider === 'google' && (user.user_metadata?.avatar_url || user.user_metadata?.picture)) {
    return 'google';
  }
  
  // Check if user has uploaded avatar (usually contains specific patterns)
  const avatarUrl = user.user_metadata?.avatar_url;
  if (avatarUrl) {
    // If it contains your storage bucket URL or upload patterns, it's uploaded
    if (avatarUrl.includes('supabase') || 
        avatarUrl.includes('storage') || 
        avatarUrl.includes('upload') ||
        avatarUrl.includes('amazonaws') ||
        avatarUrl.includes('cloudinary')) {
      return 'uploaded';
    }
    
    // If it contains Google URLs, it's Google
    if (avatarUrl.includes('googleusercontent.com') || 
        avatarUrl.includes('google.com')) {
      return 'google';
    }
    
    // Default to uploaded if we have a URL but can't determine type
    return 'uploaded';
  }
  
  // No avatar URL means preset
  return 'preset';
}

  private clearUserData(): void {
    this.debugLog('🧹 Auth: Clearing user data');
    this.currentUser = null;
    this.currentProfile = null;
    this.updateAuthState();
  }

  get supabase() {
    return supabase;
  }

  onAuthChange(callback: (user: User | null, profile: Profile | null) => void) {
    this.listeners.push(callback);
    
    // Call immediately if initialized
    if (this.initialized) {
      callback(this.currentUser, this.currentProfile);
    }

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
        this.errorLog('Error in auth listener:', error);
      }
    });
  }

  getUser(): User | null {
    return this.currentUser;
  }

  getProfile(): Profile | null {
    return this.currentProfile;
  }

  getDisplayName(): string {
    const profile = this.currentProfile;
    const user = this.currentUser;
    
    return profile?.display_name || 
           user?.user_metadata?.display_name ||
           user?.user_metadata?.full_name ||
           user?.user_metadata?.name ||
           user?.email?.split('@')[0] || 
           'Builder';
  }

  getAvatarUrl(): string {
    const profile = this.currentProfile;
    const user = this.currentUser;
    
    // ✅ GOOGLE AVATAR PRIORITY
    if (profile?.avatar_type === 'google' && profile?.avatar_url) {
      return profile.avatar_url;
    }
    
    if (profile?.avatar_type === 'uploaded' && profile?.avatar_url) {
      return profile.avatar_url;
    }
    
    // ✅ FALLBACK TO USER METADATA FOR GOOGLE
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    
    if (user?.user_metadata?.picture) {
      return user.user_metadata.picture;
    }
    
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

    isUserAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  async needsPasswordSetup(): Promise<boolean> {
    try {
      const user = this.getUser();
      if (!user) return false;
      
      const metadata = user.user_metadata as CustomUserMetadata;
      return metadata?.needs_password_setup === true;
    } catch (error) {
      return false;
    }
  }

  async simpleAuthCheck(): Promise<AuthCheckResult> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.errorLog('Auth check error:', error);
        return { isAuthenticated: false, user: null, session: null };
      }

      return {
        isAuthenticated: !!session?.user,
        user: session?.user as User || null,
        session: session
      };
    } catch (error) {
      this.errorLog('Auth check failed:', error);
      return { isAuthenticated: false, user: null, session: null };
    }
  }

  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 24; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // ===========================================
  // AUTHENTICATION METHODS
  // ===========================================

  async checkEmailAuthMethods(email: string): Promise<{
    exists: boolean;
    methods: ('email' | 'google')[];
    needsPasswordSetup: boolean;
  }> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_auth_methods', {
        user_email: email
      });

      if (error) {
        return { exists: false, methods: [], needsPasswordSetup: false };
      }

      return data;
    } catch (error) {
      console.error('Error checking email auth methods:', error);
      return { exists: false, methods: [], needsPasswordSetup: false };
    }
  }

  async signUpWithEmail(email: string, displayName: string) {
    try {
      this.debugLog('🔐 Email signup for:', email);
      
      const existingOTP = localStorage.getItem(`otp_${email}`);
      if (existingOTP) {
        const otpData = JSON.parse(existingOTP);
        
        if (Date.now() < otpData.expires) {
          this.debugLog('🔐 OTP already exists and is still valid');
          return { 
            success: true, 
            message: 'Verification code already sent. Check your email or wait for it to expire to request a new one.' 
          };
        } else {
          localStorage.removeItem(`otp_${email}`);
        }
      }
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      const otpData = {
        email,
        otp,
        displayName,
        created: Date.now(),
        expires: Date.now() + (30 * 60 * 1000),
        isNewUser: true
      };
      
      localStorage.setItem(`otp_${email}`, JSON.stringify(otpData));
      
      const result = await EmailService.sendVerificationEmail(
        email, 
        otp, 
        `${window.location.origin}/auth/verify?email=${encodeURIComponent(email)}`,
        displayName
      );
      
      if (!result.success) {
        localStorage.removeItem(`otp_${email}`);
        throw new Error(result.error || 'Failed to send verification email');
      }

      this.debugLog('✅ Verification email sent successfully');
      return { success: true };
    } catch (error: any) {
      this.errorLog('🔐 Email signup error:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyOTP(email: string, token: string) {
    try {
      this.debugLog('🔐 Verifying OTP for:', email);
      
      const storedData = localStorage.getItem(`otp_${email}`);
      if (!storedData) {
        throw new Error('No verification code found. Please request a new one.');
      }
      
      const otpData = JSON.parse(storedData);
      
      if (Date.now() > otpData.expires) {
        localStorage.removeItem(`otp_${email}`);
        throw new Error('Verification code has expired. Please request a new one.');
      }
      
      if (otpData.otp !== token) {
        throw new Error('Invalid verification code. Please try again.');
      }
      
      const tempPassword = this.generateSecurePassword();
      
      const { data, error } = await this.supabase.auth.signUp({
        email: email,
        password: tempPassword,
        options: {
          emailRedirectTo: undefined,
          data: {
            display_name: otpData.displayName,
            email_verified: true,
            needs_password_setup: true,
            temp_password: true
          }
        }
      });

      if (error) {
        this.debugLog('🔐 Supabase signup error:', error);
        
        if (error.message.includes('already registered') || 
            error.message.includes('already been registered') ||
            error.message.includes('User already registered')) {
          
          localStorage.removeItem(`otp_${email}`);
          throw new Error('You already have an account with this email. Please use the Sign In page instead.');
        }
        throw error;
      }
      
      const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
        email: email,
        password: tempPassword
      });
      
      if (signInError) throw signInError;
      
      localStorage.removeItem(`otp_${email}`);
      this.sendWelcomeEmailAsync(email, otpData.displayName);

      return { 
        success: true, 
        data: signInData,
        needsPasswordSetup: true
      };
      
    } catch (error: any) {
      this.errorLog('🔐 OTP verification error:', error);
      return { success: false, error: error.message };
    }
  }

  async setFirstTimePassword(password: string) {
    try {
      this.debugLog('🔐 Setting first-time password');
      
      const user = this.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      const metadata = user.user_metadata as CustomUserMetadata;
      
      if (!metadata?.needs_password_setup) {
        throw new Error('Password setup not required for this user');
      }
      
      const { error } = await this.supabase.auth.updateUser({
        password: password,
        data: {
          ...user.user_metadata,
          needs_password_setup: false,
          temp_password: false,
          password_set_at: new Date().toISOString()
        } as CustomUserMetadata
      });

      if (error) throw error;

      this.debugLog('✅ First-time password set successfully');
      return { success: true };
    } catch (error: any) {
      this.errorLog('🔐 Set first-time password error:', error);
      return { success: false, error: error.message };
    }
  }

  async signInWithEmail(email: string, password: string) {
    try {
      this.debugLog('🔐 Email signin for:', email);
      
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return {
            success: false,
            error: 'Incorrect email or password. If you signed up with Google, please use the Google sign-in button instead.',
            suggestGoogle: true
          };
        }
        
        if (error.message.includes('Email not confirmed')) {
          return {
            success: false,
            error: 'Please verify your email address first. Check your inbox for the verification code.',
            needsVerification: true
          };
        }
        
        throw error;
      }

      const metadata = data.user?.user_metadata as CustomUserMetadata;
      const needsSetup = metadata?.needs_password_setup === true;

      return { 
        success: true, 
        data,
        needsPasswordSetup: needsSetup
      };
    } catch (error: any) {
      this.errorLog('🔐 Email signin error:', error);
      return { success: false, error: error.message };
    }
  }

  async signInWithGoogle() {
    try {
      this.debugLog('🔐 Google signin starting...');
      
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?provider=google`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          }
        }
      });

      if (error) {
        this.errorLog('🔐 Google signin error details:', error);
        throw error;
      }

      this.debugLog('🔐 Google signin successful, redirecting...');
      return { success: true, data };
    } catch (error: any) {
      this.errorLog('🔐 Google signin error:', error);
      return { success: false, error: error.message };
    }
  }

  async handleAuthCallback(): Promise<{
    success: boolean;
    isNewUser?: boolean;
    needsPasswordSetup?: boolean;
    provider?: string;
    error?: string;
  }> {
    try {
      this.debugLog('🔄 Processing auth callback...');
      
      const hash = window.location.hash.substring(1);
      const urlParams = new URLSearchParams(hash);
      const accessToken = urlParams.get('access_token');
      
      if (accessToken) {
        this.debugLog('🔑 Found access token in URL, setting session...');
        const refreshToken = urlParams.get('refresh_token');
        
        const { data, error } = await this.supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
        
        if (error) throw error;
        
        window.history.replaceState({}, '', window.location.pathname);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const { data, error } = await this.supabase.auth.getSession();
      
      if (error) throw error;
      
      if (data.session?.user) {
        const user = data.session.user;
        const metadata = user.user_metadata as CustomUserMetadata;
        
        const isNewUser = !metadata?.last_sign_in_at;
        const provider = user.app_metadata?.provider;
        const needsPasswordSetup = metadata?.needs_password_setup === true && provider !== 'google';
        
        this.debugLog('✅ Auth callback successful:', { isNewUser, needsPasswordSetup, provider });
        
        if (isNewUser) {
          await this.supabase.auth.updateUser({
            data: {
              ...metadata,
              last_sign_in_at: new Date().toISOString()
            }
          });
          
          if (provider === 'google') {
            const displayName = metadata?.full_name || user.email?.split('@')[0] || 'New User';
            this.sendWelcomeEmailAsync(user.email!, displayName);
          }
        }
        
        return {
          success: true,
          isNewUser,
          needsPasswordSetup,
          provider
        };
      }
      
      return { success: false, error: 'No session found after callback' };
    } catch (error: any) {
      this.errorLog('🔄 Auth callback error:', error);
      return { success: false, error: error.message };
    }
  }

  async setPassword(password: string) {
    try {
      this.debugLog('🔐 Setting password');
      
      const { error } = await this.supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      this.errorLog('🔐 Set password error:', error);
      return { success: false, error: error.message };
    }
  }

  async resetPassword(email: string) {
    try {
      this.debugLog('🔐 Password reset for:', email);
      
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;

      this.debugLog('✅ Password reset email sent successfully');
      return { success: true };
    } catch (error: any) {
      this.errorLog('🔐 Password reset error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async verifyPasswordResetOTP(email: string, otp: string, newPassword: string) {
    try {
      const storedData = localStorage.getItem(`reset_otp_${email}`);
      if (!storedData) {
        throw new Error('No password reset found. Please request a new one.');
      }
      
      const resetData = JSON.parse(storedData);
      
      if (Date.now() > resetData.expires) {
        localStorage.removeItem(`reset_otp_${email}`);
        throw new Error('Password reset code has expired.');
      }
      
      if (resetData.otp !== otp) {
        throw new Error('Invalid password reset code.');
      }
      
      const passwordChangeData = {
        email,
        newPassword,
        verified: true,
        created: Date.now(),
        expires: Date.now() + (10 * 60 * 1000)
      };
      
      localStorage.setItem(`pwd_change_${email}`, JSON.stringify(passwordChangeData));
      localStorage.removeItem(`reset_otp_${email}`);
      
      return { 
        success: true, 
        message: 'Password reset verified. Updating your password...',
        requiresSignIn: true
      };      
    } catch (error: any) {
      this.errorLog('🔐 Password reset OTP error:', error);
      return { success: false, error: error.message };
    }
  }

  async completePasswordReset(email: string) {
    try {
      const passwordChangeData = localStorage.getItem(`pwd_change_${email}`);
      if (!passwordChangeData) {
        return { success: false, error: 'No pending password change found' };
      }
      
      const changeData = JSON.parse(passwordChangeData);
      
      if (Date.now() > changeData.expires) {
        localStorage.removeItem(`pwd_change_${email}`);
        return { success: false, error: 'Password change session expired' };
      }
      
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: changeData.email,
        password: changeData.newPassword
      });
      
      if (error) {
        return { 
          success: false, 
          error: 'Password update failed. Please try the reset process again.' 
        };
      }
      
      localStorage.removeItem(`pwd_change_${email}`);
      
      return { success: true, data };
      
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getUserAuthMethods(email: string): Promise<{
    hasPassword: boolean;
    hasGoogle: boolean;
    suggestions: string[];
  }> {
    try {
      const suggestions: string[] = [];
      
      const { error: passwordError } = await this.supabase.auth.signInWithPassword({
        email,
        password: 'dummy-password-check-12345'
      });
      
      const hasPassword = passwordError?.message !== 'Invalid login credentials';
      const hasGoogle = true;
      
      if (!hasPassword) {
        suggestions.push('Try signing in with Google if you used Google to create your account');
        suggestions.push('Use "Sign Up" if you don\'t have an account yet');
      }
      
      if (hasPassword) {
        suggestions.push('Use "Forgot Password" if you can\'t remember your password');
      }
      
      return {
        hasPassword,
        hasGoogle,
        suggestions
      };
    } catch (error) {
      return {
        hasPassword: false,
        hasGoogle: true,
        suggestions: ['Try signing in with Google or use "Sign Up" to create a new account']
      };
    }
  }

  async setRecoverySessionFromUrl(): Promise<{ success: boolean; error?: string }> {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      const type = params.get('type');
      
      if (type === 'recovery' && access_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || '',
        });
        if (error) throw error;
        window.history.replaceState({}, '', window.location.pathname);
        return { success: true };
      }
      return { success: false, error: 'Missing or invalid recovery session.' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updatePassword(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  async resendVerificationCode(email: string) {
    try {
      const storedData = localStorage.getItem(`otp_${email}`);
      if (!storedData) {
        throw new Error('No pending verification found for this email');
      }
      
      const otpData = JSON.parse(storedData);
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      const updatedData = {
        ...otpData,
        otp: newOtp,
        created: Date.now(),
        expires: Date.now() + (30 * 60 * 1000)
      };
      
      localStorage.setItem(`otp_${email}`, JSON.stringify(updatedData));
      
      const result = await EmailService.sendVerificationEmail(
        email,
        newOtp,
        `${window.location.origin}/auth/verify?email=${encodeURIComponent(email)}`,
        otpData.displayName
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to resend verification email');
      }
      
      return { success: true };
    } catch (error: any) {
      this.errorLog('🔐 Resend verification error:', error);
      return { success: false, error: error.message };
    }
  }

  getPasswordResetOTP(email: string): string | null {
    try {
      const storedData = localStorage.getItem(`reset_otp_${email}`);
      if (!storedData) return null;
      
      const resetData = JSON.parse(storedData);
      
      if (Date.now() > resetData.expires) {
        localStorage.removeItem(`reset_otp_${email}`);
        return null;
      }
      
      return resetData.otp;
    } catch (error) {
      return null;
    }
  }

  private async sendWelcomeEmailAsync(email: string, displayName: string): Promise<void> {
    try {
      const result = await EmailService.sendWelcomeEmail(email, displayName);
      if (result.success) {
        this.debugLog('✅ Welcome email sent to:', email);
      } else {
        this.debugLog('⚠️ Welcome email failed:', result.error);
      }
    } catch (error) {
      this.errorLog('❌ Welcome email error:', error);
    }
  }

  async subscribeToNewsletter(email: string, name?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const confirmationUrl = `${window.location.origin}/newsletter/confirm?email=${encodeURIComponent(email)}`;
      const unsubscribeUrl = `${window.location.origin}/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
      
      const result = await EmailService.sendNewsletterSubscriptionEmail(email, confirmationUrl, unsubscribeUrl, name);
      return result;
    } catch (error: any) {
      this.errorLog('❌ Newsletter subscription email error:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      this.debugLog('🔐 Signing out');
      
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        this.errorLog('🔐 Signout error:', error);
      }
      
      this.initialized = false;
      this.initPromise = null;
      this.listeners = [];
      
      localStorage.clear();
      sessionStorage.clear();
      
      return { success: true };
    } catch (error: any) {
      this.errorLog('🔐 Signout error:', error);
      
      localStorage.clear();
      sessionStorage.clear();
      
      this.initialized = false;
      this.initPromise = null;
      this.listeners = [];
      
      return { success: true };
    }
  }

async updateProfile(updates: Partial<Profile>) {
  if (!this.currentUser) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // ✅ REMOVE ENVIRONMENT FILTER
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', this.currentUser.id)
      .select()
      .single();

    if (error) throw error;

    this.currentProfile = data;
    this.setAuthCache(this.currentUser, this.currentProfile);
    this.notifyListeners(this.currentUser, this.currentProfile);

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async refreshProfile() {
  if (!this.currentUser) return;
  
  try {
    // ✅ REMOVE ENVIRONMENT FILTER
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', this.currentUser.id)
      .single();
    
    if (data) {
      this.currentProfile = data;
      this.setAuthCache(this.currentUser, this.currentProfile);
      this.notifyListeners(this.currentUser, this.currentProfile);
    }
  } catch (error) {
    this.errorLog('Error refreshing profile:', error);
  }
}

  private async loadUserStats(userId: string) {
    try {
      const [followedArticles, followingTopics, followingUsers] = await Promise.all([
        this.supabase.from('article_follows').select('id', { count: 'exact' }).eq('user_id', userId),
        this.supabase.from('user_category_follows').select('id', { count: 'exact' }).eq('user_id', userId),
        this.supabase.from('user_follows').select('id', { count: 'exact' }).eq('follower_id', userId).eq('follow_type', 'user')
      ]);

      return {
        followed_articles: followedArticles.count || 0,
        following_topics: followingTopics.count || 0,
        following_users: followingUsers.count || 0,
        articles_read: 0,
        comments_posted: 0
      };
    } catch (error) {
      this.errorLog('Error loading user stats:', error);
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

// Export singleton instance
export const authManager = TinkByteAuthManager.getInstance();

// Export legacy auth object for backward compatibility
export const auth = {
  initialize: () => authManager.initialize(),
  getUser: () => authManager.getUser(),
  getProfile: () => authManager.getProfile(),
  getDisplayName: () => authManager.getDisplayName(),
  getAvatarUrl: () => authManager.getAvatarUrl(),
  isAuthenticated: () => authManager.isAuthenticated(),
  isUserAuthenticated: () => authManager.isUserAuthenticated(),
  needsPasswordSetup: () => authManager.needsPasswordSetup(),
  simpleAuthCheck: () => authManager.simpleAuthCheck(),
  signUpWithEmail: (email: string, displayName: string) => authManager.signUpWithEmail(email, displayName),
  verifyOTP: (email: string, token: string) => authManager.verifyOTP(email, token),
  setFirstTimePassword: (password: string) => authManager.setFirstTimePassword(password),
  signInWithEmail: (email: string, password: string) => authManager.signInWithEmail(email, password),
  signInWithGoogle: () => authManager.signInWithGoogle(),
  signOut: () => authManager.signOut(),
  resetPassword: (email: string) => authManager.resetPassword(email),
  setPassword: (password: string) => authManager.setPassword(password), 
  verifyPasswordResetOTP: (email: string, otp: string, newPassword: string) => authManager.verifyPasswordResetOTP(email, otp, newPassword),
  getPasswordResetOTP: (email: string) => authManager.getPasswordResetOTP(email),
  resendVerificationCode: (email: string) => authManager.resendVerificationCode(email),
  subscribeToNewsletter: (email: string, name?: string) => authManager.subscribeToNewsletter(email, name),
  updateProfile: (updates: Partial<Profile>) => authManager.updateProfile(updates),
  onAuthChange: (callback: (user: User | null, profile: Profile | null) => void) => authManager.onAuthChange(callback),
  supabase: authManager.supabase
};