// src/lib/admin/auth.ts - ENHANCED SINGLETON VERSION
import { supabase } from '../supabase.js';
import { config } from '../config.js';

class AdminAuthManager {
  private static instance: AdminAuthManager;
  private initialized: boolean = false;
  private currentUser: any = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  static readonly ADMIN_EMAILS = ["tinkbytehq@gmail.com"];
  static readonly STORAGE_KEY = "tinkbyte-admin-session";

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): AdminAuthManager {
    if (!AdminAuthManager.instance) {
      AdminAuthManager.instance = new AdminAuthManager();
    }
    return AdminAuthManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔄 Initializing Admin Auth Manager...');
      
      // Check for existing session
      await this.loadCurrentSession();
      
      // Setup session monitoring
      this.setupSessionMonitoring();
      
      this.initialized = true;
      console.log('✅ Admin Auth Manager initialized');
    } catch (error) {
      console.error('❌ Admin Auth Manager initialization failed:', error);
      throw error;
    }
  }

  private async loadCurrentSession(): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      this.currentUser = user;
    } catch (error) {
      console.warn('⚠️ No valid session found during initialization');
      this.currentUser = null;
    }
  }

  private setupSessionMonitoring(): void {
    // Check session validity every 5 minutes
    this.sessionCheckInterval = setInterval(async () => {
      try {
        await this.getCurrentUser();
      } catch (error) {
        console.warn('⚠️ Session validation failed, signing out');
        await this.signOut();
      }
    }, 5 * 60 * 1000);
  }

  async signIn(email: string, password: string) {
    try {
      console.log('🔐 Admin signin attempt for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Signin error:', error);
        return { success: false, error: error.message };
      }

      if (!data.user || !data.session) {
        return { success: false, error: "Authentication failed" };
      }

      // Verify admin status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, is_blocked, email')
        .eq('id', data.user.id)
        .eq('environment', config.environment)
        .single();

      if (profileError) {
        console.error('❌ Profile check error:', profileError);
        await supabase.auth.signOut();
        return { success: false, error: "Failed to verify admin status" };
      }

      if (!profile || profile.is_blocked) {
        await supabase.auth.signOut();
        return { success: false, error: "Account is blocked or not found" };
      }

      if (!profile.is_admin && !this.isAdmin(data.user.email || "")) {
        await supabase.auth.signOut();
        return { success: false, error: "Access denied. Admin privileges required." };
      }

      const adminUser = {
        id: data.user.id,
        email: data.user.email,
        isAdmin: true,
        profile: profile
      };

      const sessionData = {
        user: adminUser,
        token: data.session.access_token,
        expiresAt: data.session.expires_at,
        refreshToken: data.session.refresh_token,
        createdAt: Date.now()
      };

      // Store session
      if (typeof window !== 'undefined') {
        localStorage.setItem(AdminAuthManager.STORAGE_KEY, JSON.stringify(sessionData));
      }
      
      this.currentUser = adminUser;
      console.log('✅ Admin signin successful');
      return { success: true, user: adminUser };
    } catch (error: any) {
      console.error('❌ Signin exception:', error);
      return { success: false, error: error.message || "Signin failed" };
    }
  }

  async getCurrentUser() {
    try {
      if (typeof window === 'undefined') return null;

      // Return cached user if valid
      if (this.currentUser && this.isSessionValid()) {
        return this.currentUser;
      }

      // Check Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session check error:', error);
        await this.signOut();
        return null;
      }

      if (!session?.user) {
        // Check localStorage as fallback
        const stored = localStorage.getItem(AdminAuthManager.STORAGE_KEY);
        if (!stored) return null;

        let sessionData;
        try {
          sessionData = JSON.parse(stored);
        } catch {
          localStorage.removeItem(AdminAuthManager.STORAGE_KEY);
          return null;
        }

        if (Date.now() > sessionData.expiresAt * 1000) {
          await this.signOut();
          return null;
        }

        this.currentUser = sessionData.user;
        return sessionData.user;
      }

      // Verify admin status from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, is_blocked')
        .eq('id', session.user.id)
        .eq('environment', config.environment)
        .single();

      if (profileError || !profile || profile.is_blocked || 
          (!profile.is_admin && !this.isAdmin(session.user.email || ""))) {
        await this.signOut();
        return null;
      }

      const user = {
        id: session.user.id,
        email: session.user.email,
        isAdmin: true,
        profile: profile
      };

      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('❌ getCurrentUser error:', error);
      await this.signOut();
      return null;
    }
  }

  private isSessionValid(): boolean {
    if (typeof window === 'undefined') return false;
    
    const stored = localStorage.getItem(AdminAuthManager.STORAGE_KEY);
    if (!stored) return false;

    try {
      const sessionData = JSON.parse(stored);
      return Date.now() < sessionData.expiresAt * 1000;
    } catch {
      return false;
    }
  }

async signOut(): Promise<void> {
  try {
    console.log("🔄 Starting admin sign out...");
    
    // Clear local storage first
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AdminAuthManager.STORAGE_KEY);
    }
    
    // Clear intervals
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    
    // Clear current user
    this.currentUser = null;
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    console.log('✅ Admin signout completed');
  } catch (error) {
    console.error('❌ Signout error:', error);
    // Even on error, ensure local state is cleared
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AdminAuthManager.STORAGE_KEY);
    }
  }
}

  async requireAdmin() {
    if (!this.initialized) {
      await this.initialize();
    }

    const user = await this.getCurrentUser();
    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = "/auth/admin-signin";
      }
      throw new Error("Not authenticated");
    }
    return user;
  }

  private isAdmin(email: string): boolean {
    return AdminAuthManager.ADMIN_EMAILS.includes(email.toLowerCase());
  }

  async checkAdminStatus(): Promise<boolean> {
    try {
      await this.requireAdmin();
      return true;
    } catch {
      return false;
    }
  }

  destroy(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    this.initialized = false;
    this.currentUser = null;
  }
}

// Export singleton instance
export const adminAuthManager = AdminAuthManager.getInstance();

// Export class for backward compatibility
export class ClientAdminAuth {
  static ADMIN_EMAILS = AdminAuthManager.ADMIN_EMAILS;
  static STORAGE_KEY = AdminAuthManager.STORAGE_KEY;

  static async initialize() {
    const manager = AdminAuthManager.getInstance();
    return manager.initialize();
  }

  static async signIn(email: string, password: string) {
    const manager = AdminAuthManager.getInstance();
    return manager.signIn(email, password);
  }

  static async getCurrentUser() {
    const manager = AdminAuthManager.getInstance();
    return manager.getCurrentUser();
  }

  static async signOut() {
    const manager = AdminAuthManager.getInstance();
    return manager.signOut();
  }

  static async requireAdmin() {
    const manager = AdminAuthManager.getInstance();
    return manager.requireAdmin();
  }

  static isAdmin(email: string): boolean {
    const manager = AdminAuthManager.getInstance();
    return manager['isAdmin'](email);
  }

  static async checkAdminStatus(): Promise<boolean> {
    const manager = AdminAuthManager.getInstance();
    return manager.checkAdminStatus();
  }
}