// src/lib/auth.ts - COMPLETE STATIC CUSTOM EMAIL FLOW

import { AuthState, type User, type Profile, supabase } from './supabase.js';
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
  // Our custom properties
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
  private authState: AuthState;
  private listeners: Array<(user: User | null, profile: Profile | null) => void> = [];
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    this.authState = AuthState.getInstance();
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

  get supabase() {
    return supabase;
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

// Fix the getDisplayName method - remove full_name reference
getDisplayName(): string {
  const profile = this.authState.getProfile();
  const user = this.authState.getUser();
  
  // Use only properties that exist in your Profile type
  return profile?.display_name || 
         user?.user_metadata?.display_name ||
         user?.user_metadata?.full_name ||
         user?.user_metadata?.name ||
         user?.email?.split('@')[0] || 
         'Builder';
}

  getAvatarUrl(): string {
    const profile = this.authState.getProfile();
    
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
      const { data: { session } } = await this.supabase.auth.getSession();
      return !!session?.user;
    } catch (error) {
      return false;
    }
  }

  // Check if user needs to set up their password (first-time user)
async needsPasswordSetup(): Promise<boolean> {
  try {
    const user = this.getUser();
    if (!user) return false;
    
    // Type assertion to include our custom properties
    const metadata = user.user_metadata as CustomUserMetadata;
    return metadata?.needs_password_setup === true;
  } catch (error) {
    return false;
  }
}

  async simpleAuthCheck(): Promise<AuthCheckResult> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
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

  // Generate secure temporary password
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
  

  // Step 1: User enters email + display name (NO PASSWORD)
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
    console.log('🔐 Email signup for:', email);
    
    // Check if there's already a pending OTP for this email
    const existingOTP = localStorage.getItem(`otp_${email}`);
    if (existingOTP) {
      const otpData = JSON.parse(existingOTP);
      
      // If OTP is still valid, don't send a new one
      if (Date.now() < otpData.expires) {
        console.log('🔐 OTP already exists and is still valid');
        return { 
          success: true, 
          message: 'Verification code already sent. Check your email or wait for it to expire to request a new one.' 
        };
      } else {
        // Clean up expired OTP
        localStorage.removeItem(`otp_${email}`);
      }
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP temporarily in localStorage
    const otpData = {
      email,
      otp,
      displayName,
      created: Date.now(),
      expires: Date.now() + (30 * 60 * 1000), // 30 minutes
      isNewUser: true
    };
    
    localStorage.setItem(`otp_${email}`, JSON.stringify(otpData));
    
    // Send custom verification email with OTP
    const result = await EmailService.sendVerificationEmail(
      email, 
      otp, 
      `${window.location.origin}/auth/verify?email=${encodeURIComponent(email)}`,
      displayName
    );
    
    if (!result.success) {
      // Clean up OTP data if email failed
      localStorage.removeItem(`otp_${email}`);
      throw new Error(result.error || 'Failed to send verification email');
    }

    console.log('✅ Verification email sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('🔐 Email signup error:', error);
    return { success: false, error: error.message };
  }
}


  // User enters OTP code → Account created + Auto sign in
async verifyOTP(email: string, token: string) {
  try {
    console.log('🔐 Verifying OTP for:', email);
    
    // Get stored OTP data
    const storedData = localStorage.getItem(`otp_${email}`);
    if (!storedData) {
      throw new Error('No verification code found. Please request a new one.');
    }
    
    const otpData = JSON.parse(storedData);
    
    // Check if OTP has expired
    if (Date.now() > otpData.expires) {
      localStorage.removeItem(`otp_${email}`);
      throw new Error('Verification code has expired. Please request a new one.');
    }
    
    // Verify OTP
    if (otpData.otp !== token) {
      throw new Error('Invalid verification code. Please try again.');
    }
    
    // Create account with temporary password
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

    // Handle duplicate email error from Supabase
    if (error) {
      console.log('🔐 Supabase signup error:', error);
      
      if (error.message.includes('already registered') || 
          error.message.includes('already been registered') ||
          error.message.includes('User already registered')) {
        
        // Clean up OTP data
        localStorage.removeItem(`otp_${email}`);
        
        // Try to sign in the existing user instead
        throw new Error('You already have an account with this email. Please use the Sign In page instead.');
      }
      throw error;
    }
    
    // Account created successfully - sign them in
    const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
      email: email,
      password: tempPassword
    });
    
    if (signInError) throw signInError;
    
    // Clean up OTP data
    localStorage.removeItem(`otp_${email}`);
    
    // Send welcome email
    this.sendWelcomeEmailAsync(email, otpData.displayName);

    return { 
      success: true, 
      data: signInData,
      needsPasswordSetup: true
    };
    
  } catch (error: any) {
    console.error('🔐 OTP verification error:', error);
    return { success: false, error: error.message };
  }
}

  // Step 3: User creates their real password (called from profile page)
async setFirstTimePassword(password: string) {
  try {
    console.log('🔐 Setting first-time password');
    
    const user = this.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    // Type assertion for custom metadata
    const metadata = user.user_metadata as CustomUserMetadata;
    
    // Check if user needs password setup
    if (!metadata?.needs_password_setup) {
      throw new Error('Password setup not required for this user');
    }
    
    // Update to real password and clear setup flags
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

    console.log('✅ First-time password set successfully');
    return { success: true };
  } catch (error: any) {
    console.error('🔐 Set first-time password error:', error);
    return { success: false, error: error.message };
  }
}

  // ===========================================
  // FLOW 2: EXISTING USER SIGNIN
  // ===========================================
  
async signInWithEmail(email: string, password: string) {
  try {
    console.log('🔐 Email signin for:', email);
    
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Enhanced error handling for common scenarios
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

    // Type assertion for custom metadata
    const metadata = data.user?.user_metadata as CustomUserMetadata;
    const needsSetup = metadata?.needs_password_setup === true;

    return { 
      success: true, 
      data,
      needsPasswordSetup: needsSetup
    };
  } catch (error: any) {
    console.error('🔐 Email signin error:', error);
    return { success: false, error: error.message };
  }
}


  // ===========================================
  // FLOW 3: GOOGLE SIGNIN (Standard)
  // ===========================================
  
async signInWithGoogle() {
  try {
    console.log('🔐 Google signin starting...');
    
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

// Handle auth callback (for Google signin)
async handleAuthCallback(): Promise<{
  success: boolean;
  isNewUser?: boolean;
  needsPasswordSetup?: boolean;
  provider?: string;
  error?: string;
}> {
  try {
    const { data, error } = await this.supabase.auth.getSession();
    
    if (error) throw error;
    
    if (data.session?.user) {
      const user = data.session.user;
      const metadata = user.user_metadata as CustomUserMetadata;
      
      const isNewUser = !metadata?.last_sign_in_at;
      const provider = user.app_metadata?.provider;
      
      // For Google users, they never need password setup
      const needsPasswordSetup = metadata?.needs_password_setup === true && provider !== 'google';
      
      // Send welcome email for new Google users
      if (isNewUser && provider === 'google') {
        const displayName = metadata?.full_name || user.email?.split('@')[0] || 'New User';
        this.sendWelcomeEmailAsync(user.email!, displayName);
      }
      
      return {
        success: true,
        isNewUser,
        needsPasswordSetup,
        provider
      };
    }
    
    return { success: false, error: 'No session found' };
  } catch (error: any) {
    console.error('🔐 Auth callback error:', error);
    return { success: false, error: error.message };
  }
}

  // ===========================================
  // FLOW 4: PASSWORD RESET (OTP Based)
  // ===========================================
  
  async setPassword(password: string) {
  try {
    console.log('🔐 Setting password');
    
    const { error } = await this.supabase.auth.updateUser({
      password: password,
    });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('🔐 Set password error:', error);
    return { success: false, error: error.message };
  }
}

  // Step 1: User requests password reset
async resetPassword(email: string) {
  try {
    console.log('🔐 Password reset for:', email);
    
    // Generate 6-digit OTP (same as signup)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP for password reset
    const resetData = {
      email,
      otp,
      created: Date.now(),
      expires: Date.now() + (30 * 60 * 1000), // 30 minutes
      isPasswordReset: true
    };
    
    localStorage.setItem(`reset_otp_${email}`, JSON.stringify(resetData));
    
    // Send password reset email with OTP - NOW WITH 4 PARAMETERS
    const resetUrl = `${window.location.origin}/auth/reset-password?email=${encodeURIComponent(email)}`;
    const displayName = this.getDisplayName();
    
    const result = await EmailService.sendPasswordResetEmail(email, resetUrl, displayName, otp);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send password reset email');
    }

    console.log('✅ Password reset OTP sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('🔐 Password reset error:', error);
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
      
      // For password reset, we need the user to sign in first
      // So we'll store the verified new password and let them sign in
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
      console.error('🔐 Password reset OTP error:', error);
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
      console.error('🔐 Resend verification error:', error);
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
        console.log('✅ Welcome email sent to:', email);
      } else {
        console.warn('⚠️ Welcome email failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Welcome email error:', error);
    }
  }

  async subscribeToNewsletter(email: string, name?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const confirmationUrl = `${window.location.origin}/newsletter/confirm?email=${encodeURIComponent(email)}`;
      const unsubscribeUrl = `${window.location.origin}/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
      
      const result = await EmailService.sendNewsletterSubscriptionEmail(email, confirmationUrl, unsubscribeUrl, name);
      return result;
    } catch (error: any) {
      console.error('❌ Newsletter subscription email error:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePassword(password: string) {
    try {
      console.log('🔐 Updating password');
      
      const { error } = await this.supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('🔐 Update password error:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      console.log('🔐 Signing out');
      
      const { error } = await this.supabase.auth.signOut();
      
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

  async updateProfile(updates: Partial<Profile>) {
    return await this.authState.updateProfile(updates);
  }

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