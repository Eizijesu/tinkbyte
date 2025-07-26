// src/lib/config.ts - ENHANCED FOR STATIC
import { deploymentManager } from './deployment.js';

export const config = {
  environment: 'production',
  deployment: {
    isStatic: deploymentManager.isStaticDeployment(),
    type: deploymentManager.getEnvironment()
  },
  supabase: {
    url: import.meta.env.PUBLIC_SUPABASE_URL as string,
    anonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string,
    serviceKey: import.meta.env.SUPABASE_SERVICE_KEY as string,
  },
  admin: {
    emails: ['tinkbytehq@gmail.com'],
    storageKey: 'tinkbyte-admin-session',
  },
  resend: {
    apiKey: import.meta.env.RESEND_API_KEY || '',
    fromEmail: import.meta.env.RESEND_FROM_EMAIL || 'notify@notify.tinkbyte.com',
    enabled: !!import.meta.env.RESEND_API_KEY
  },
  site: {
    url: import.meta.env.PUBLIC_SITE_URL || 'https://tinkbyte.com',
    name: 'TinkByte',
  },
  features: {
    emailService: !!import.meta.env.RESEND_API_KEY,
    analytics: true,
    comments: true,
    newsletter: true
  }
} as const;

// Log deployment info on initialization
deploymentManager.logDeploymentInfo();

export type Config = typeof config;