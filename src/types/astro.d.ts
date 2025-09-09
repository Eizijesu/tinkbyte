// src/types/astro.d.ts

declare global {
  namespace App {
    interface Locals {
      // User authentication data
      user?: {
        id: string;
        email: string;
        email_verified?: boolean;
        user_metadata?: any;
        app_metadata?: any;
        created_at?: string;
      } | null;
      
      // Admin status
      isAdmin?: boolean;
      
      // Session data
      session?: {
        access_token: string;
        refresh_token: string;
        expires_at?: number;
        user: {
          id: string;
          email: string;
        };
      } | null;
    }
  }
}

export {};