// src/env.d.ts
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user?: any;
    session?: any;
    profile?: {
      id?: string;  // Made optional
      display_name?: string;
      is_admin?: boolean;
      is_blocked?: boolean;
      membership_type?: string;
      reputation_score?: number;
    };
    isAdmin?: boolean;
    isBlocked?: boolean;
  }
}

interface ImportMetaEnv {
  // TinaCMS
  readonly TINA_CLIENT_ID: string;
  readonly TINA_TOKEN: string;
  readonly TINA_BRANCH: string;
  readonly TINA_SEARCH_TOKEN: string;
  
  // Supabase
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly PUBLIC_ENVIRONMENT: string;
  readonly SUPABASE_SERVICE_KEY: string;
  
  // ConvertKit
  readonly PUBLIC_CONVERTKIT_FORM_ID: string;
  readonly CONVERTKIT_API_KEY: string;
  
  // Resend - ADD THESE LINES
  readonly RESEND_API_KEY: string;
  readonly RESEND_FROM_EMAIL: string;
  
  // Giscus

  // Site Configuration
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_SITE_NAME: string;
  readonly PUBLIC_SITE_DESCRIPTION: string;
  readonly PUBLIC_SITE_AUTHOR: string;
  readonly PUBLIC_SITE_URL_DEV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}