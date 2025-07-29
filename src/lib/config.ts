// src/lib/config.ts - FIXED VERSION
import { deploymentManager } from './deployment.js';

// Simple environment type matching your database
export type Environment = 'development' | 'production';

// Fixed environment detection for static site
const getEnvironment = (): Environment => {
  // Server-side: always return development during build
  if (typeof window === 'undefined') {
    return 'development';
  }
  
  // Client-side: check actual browser location
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  
  // Development conditions (more comprehensive)
  const isDev = 
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local') ||
    port === '4321' || // Astro dev server
    port === '3000' || // Common dev ports
    port === '5173' || // Vite dev server
    protocol === 'http:' || // HTTP usually means dev
    hostname.includes('localhost');
  
  console.log('🌍 Environment Detection:', {
    hostname,
    port,
    protocol,
    isDev,
    result: isDev ? 'development' : 'production'
  });
  
  return isDev ? 'development' : 'production';
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