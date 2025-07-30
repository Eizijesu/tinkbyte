// src/lib/auth.ts - FIXED TO WORK WITHOUT AUTHSTATE
import { supabase, type User, type Profile } from './supabase.js';
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
  
  // **ADD: Cache keys for faster loading**
  private readonly AUTH_CACHE_KEY = 'tinkbyte_auth_cache';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Production logging control
  private readonly DEBUG = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname.includes('dev'));

  private debugLog(...args: any[]) {
    if (this.DEBUG) console.log(...args);
  }

  // **ADD: Quick auth state check from cache**
  private getAuthCache(): { user: User | null; profile: Profile | null; timestamp: number } | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(this.AUTH_CACHE_KEY);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      
      // Check if cache is still valid
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

  // **ADD: Save auth state to cache**
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

  private errorLog(...args: any[]) {
    if (this.DEBUG) {
      console.error(...args);
    } else {
      // Only log critical errors in production
      console.error(args[0]);
    }
  }

  private constructor() {
    // Private constructor for singleton
  }

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
      
      // **STEP 1: Try to load from cache first (instant)**
      const cached = this.getAuthCache();
      if (cached && cached.user) {
        this.debugLog('⚡ Auth: Loading from cache');
        this.currentUser = cached.user;
        this.currentProfile = cached.profile;
        this.notifyListeners(this.currentUser, this.currentProfile);
      }
      
      // **STEP 2: Verify with Supabase (background)**
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.errorLog('❌ Auth initialization error:', error);
        this.clearAuthCache();
        this.initialized = true;
        return;
      }

      if (session?.user) {
        // Only update if different from cache
        if (!cached || cached.user?.id !== session.user.id) {
          await this.setUserData(session.user, session);
        } else {
          // Just update the current user object
          this.currentUser = session.user;
        }
      } else if (cached) {
        // Session expired, clear cache
        this.clearAuthCache();
        this.clearUserData();
      }

      // Set up auth state change listener
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
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.errorLog('❌ Error loading profile:', error);
        throw error;
      }

      if (profile) {
        this.debugLog('✅ Auth: Profile loaded from database');
        this.currentProfile = profile;
      } else {
        this.debugLog('🆕 Auth: Creating new profile');
        await this.createProfile(user);
      }

      // **ADD: Cache the auth state**
      this.setAuthCache(this.currentUser, this.currentProfile);
      
    } catch (error) {
      this.errorLog('❌ Error in setUserData:', error);
    }
  }

  private clearAuthCache(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.AUTH_CACHE_KEY);
    }
  }

  // **ADD: Quick sync method for immediate UI updates**
  getAuthStateSync(): { user: User | null; profile: Profile | null; isLoading: boolean } {
    const cached = this.getAuthCache();
    
    return {
      user: this.currentUser || cached?.user || null,
      profile: this.currentProfile || cached?.profile || null,
      isLoading: !this.initialized
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
      is_admin: user.email === 'tinkbytehq@gmail.com',
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

  private clearUserData(): void {
    this.debugLog('🧹 Auth: Clearing user data');
    this.currentUser = null;
    this.currentProfile = null;
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
    
    if (profile?.avatar_type === 'uploaded' && profile?.avatar_url) {
      return profile.avatar_url;
    }
    
    if (profile?.avatar_type === 'google' && profile?.avatar_url) {
      return profile.avatar_url;
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
  // FLOW 1: NEW USER SIGNUP (Email Only)
  // ===========================================

  // Check if email exists and what auth methods are available
  async checkEmailAuthMethods(email: string): Promise<{
    exists: boolean;
    methods: ('email' | 'google')[];
    needsPasswordSetup: boolean;
  }> {
    try {
      // Try to get user info without signing in
      const { data, error } = await this.supabase.rpc('get_user_auth_methods', {
        user_email: email
      });

      if (error) {
        // Fallback: try a password reset to see if email exists
        // This is a workaround for static sites
        console.log('🔍 Checking email existence via alternative method');
        return { exists: false, methods: [], needsPasswordSetup: false };
      }

      return data;
    } catch (error) {
      console.error('Error checking email auth methods:', error);
      return { exists: false, methods: [], needsPasswordSetup: false };
    }
  }

  // Enhanced email signup with conflict detection
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


  // Step 3: User creates their real password (called from profile page)
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


  // ===========================================
  // FLOW 2: EXISTING USER SIGNIN
  // ===========================================
  
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

  // ===========================================
  // FLOW 3: GOOGLE SIGNIN (Standard)
  // ===========================================
  
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


  // Handle auth callback (for Google signin)
async handleAuthCallback(): Promise<{
  success: boolean;
  isNewUser?: boolean;
  needsPasswordSetup?: boolean;
  provider?: string;
  error?: string;
}> {
  try {
    this.debugLog('🔄 Processing auth callback...');
    
    // First try to get session from URL hash (for OAuth)
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
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Wait for auth state to update
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Now get the current session
    const { data, error } = await this.supabase.auth.getSession();
    
    if (error) throw error;
    
    if (data.session?.user) {
      const user = data.session.user;
      const metadata = user.user_metadata as CustomUserMetadata;
      
      // Check if this is a new user
      const isNewUser = !metadata?.last_sign_in_at;
      const provider = user.app_metadata?.provider;
      
      // Check if needs password setup (for email signups)
      const needsPasswordSetup = metadata?.needs_password_setup === true && provider !== 'google';
      
      this.debugLog('✅ Auth callback successful:', { isNewUser, needsPasswordSetup, provider });
      
      // Update user metadata to mark as signed in
      if (isNewUser) {
        await this.supabase.auth.updateUser({
          data: {
            ...metadata,
            last_sign_in_at: new Date().toISOString()
          }
        });
        
        // Send welcome email for Google users
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

  // ===========================================
  // FLOW 4: PASSWORD RESET (OTP Based)
  // ===========================================
  

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


  // Step 1: User requests password reset
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

  // Step 2: User enters OTP + new password
  async verifyPasswordResetOTP(email: string, otp: string, newPassword: string) {
    try {
      console.log('🔐 Verifying password reset OTP for:', email);
      
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
        expires: Date.now() + (10 * 60 * 1000) // 10 minutes to complete
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

  // Step 3: Complete password reset (internal method)
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
      
      // Try to sign in with new password to test it
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: changeData.email,
        password: changeData.newPassword
      });
      
      if (error) {
        // Password hasn't been updated yet, need to update it
        // This is the tricky part for static sites
        // We'll use a workaround
        return { 
          success: false, 
          error: 'Password update failed. Please try the reset process again.' 
        };
      }
      
      // Clean up
      localStorage.removeItem(`pwd_change_${email}`);
      
      return { success: true, data };
      
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Method to get user's available auth methods (for UI hints)
  async getUserAuthMethods(email: string): Promise<{
    hasPassword: boolean;
    hasGoogle: boolean;
    suggestions: string[];
  }> {
    try {
      // This is a best-effort check for static sites
      // In a real app, you'd query your user database
      
      const suggestions: string[] = [];
      
      // Try password signin to see if password exists
      const { error: passwordError } = await this.supabase.auth.signInWithPassword({
        email,
        password: 'dummy-password-check-12345'
      });
      
      const hasPassword = passwordError?.message !== 'Invalid login credentials';
      const hasGoogle = true; // We can't easily check this on static sites
      
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
        // Optionally clean up the URL hash
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
  
  // Resend verification code
  async resendVerificationCode(email: string) {
    try {
      const storedData = localStorage.getItem(`otp_${email}`);
      if (!storedData) {
        throw new Error('No pending verification found for this email');
      }
      
      const otpData = JSON.parse(storedData);
      
      // Generate new OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Update stored data
      const updatedData = {
        ...otpData,
        otp: newOtp,
        created: Date.now(),
        expires: Date.now() + (30 * 60 * 1000)
      };
      
      localStorage.setItem(`otp_${email}`, JSON.stringify(updatedData));
      
      // Send new verification email
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

  // Get reset OTP for password reset page
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

  // Async email methods
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
      this.notifyListeners(this.currentUser, this.currentProfile);

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

 async refreshProfile() {
    if (!this.currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();
      
      if (error) throw error;
      this.currentProfile = data;
      this.notifyListeners(this.currentUser, this.currentProfile);
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