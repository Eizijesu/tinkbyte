// env.d.ts (in project root, same level as package.json)
/// <reference types="astro/client" />

declare global {
    namespace App {
      interface Locals {
        user?: {
          id: string;
          email: string;
          email_verified?: boolean;
          user_metadata?: any;
          app_metadata?: any;
          created_at?: string;
        } | null;
        isAdmin?: boolean;
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