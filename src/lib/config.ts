// src/lib/config.ts - SIMPLE DEV/PROD ONLY FOR STATIC SITE
import { deploymentManager } from './deployment.js';

// Simple environment type matching your database
export type Environment = 'development' | 'production';

// Simple environment detection for static site
const getEnvironment = (): Environment => {
  // For static sites, check hostname on client-side
  if (typeof window !== 'undefined') {
    // Development: localhost and local IPs
    if (window.location.hostname === 'localhost' || 
        window.location.hostname.includes('127.0.0.1') ||
        window.location.hostname.includes('192.168.') ||
        window.location.port === '4321') { // Astro dev server
      return 'development';
    }
  }
  
  // Everything else is production (including staging/preview URLs)
  return 'production';
};

export const config = {
  environment: getEnvironment(),
  deployment: {
    isStatic: deploymentManager.isStaticDeployment(),
    type: deploymentManager.getEnvironment(),
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
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
  },
  // Simple logging: only in development
  logging: {
    enabled: getEnvironment() === 'development',
    level: getEnvironment() === 'development' ? 'debug' as const : 'error' as const,
    supabase: getEnvironment() === 'development',
    deployment: getEnvironment() === 'development'
  }
} as const;

// Only log in development
if (config.logging.deployment) {
  deploymentManager.logDeploymentInfo();
}

export type Config = typeof config;

// Simple utility functions
export const isDevelopment = (): boolean => config.environment === 'development';
export const isProduction = (): boolean => config.environment === 'production';
export const shouldLog = (type: keyof typeof config.logging = 'enabled'): boolean => config.logging[type];