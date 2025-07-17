// src/lib/admin/auth.ts - Enhanced with better session management
import { getGlobalSupabase, safeSupabaseAuth } from '../utils/supabase-global';

export class ClientAdminAuth {
  static ADMIN_EMAILS = ["tinkbytehq@gmail.com"];
  static STORAGE_KEY = "tinkbyte-admin-session";

  static async signIn(email: string, password: string) {
    try {
      const supabase = getGlobalSupabase();
      if (!supabase) {
        return { success: false, error: "Supabase not available" };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user || !data.session) {
        return { success: false, error: "Authentication failed" };
      }

      const isAdmin = this.isAdmin(data.user.email || "");
      if (!isAdmin) {
        await supabase.auth.signOut();
        return { success: false, error: "Access denied. Admin privileges required." };
      }

      const adminUser = {
        id: data.user.id,
        email: data.user.email,
        isAdmin: true,
      };

      const sessionData = {
        user: adminUser,
        token: data.session.access_token,
        expiresAt: data.session.expires_at,
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
      return { success: true, user: adminUser };
    } catch (error: any) {
      return { success: false, error: error.message || "Signin failed" };
    }
  }

  static async getCurrentUser() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const session = JSON.parse(stored);

      if (Date.now() > session.expiresAt * 1000) {
        this.signOut();
        return null;
      }

      return session.user;
    } catch (error) {
      this.signOut();
      return null;
    }
  }

  static signOut(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    const supabase = getGlobalSupabase();
    if (supabase) {
      supabase.auth.signOut();
    }
  }

  static async requireAdmin() {
    const user = await this.getCurrentUser();
    if (!user) {
      window.location.href = "/auth/admin-signin";
      throw new Error("Not authenticated");
    }
    return user;
  }

  static isAdmin(email: string): boolean {
    return this.ADMIN_EMAILS.includes(email.toLowerCase());
  }
}