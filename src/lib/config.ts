// src/lib/config.ts - CLEAN VERSION (NO LOGGING)
import { deploymentManager } from './deployment.js';

export type Environment = 'development' | 'production';

const getEnvironment = (): Environment => {
  if (typeof window === 'undefined') {
    return 'development';
  }
  
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  
  const isDev = 
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local') ||
    port === '4321' ||
    port === '3000' ||
    port === '5173' ||
    protocol === 'http:' ||
    hostname.includes('localhost');
  
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
  logging: {
    enabled: false, // DISABLED FOR PRODUCTION
    level: 'error' as const,
    supabase: false,
    deployment: false
  }
} as const;

export type Config = typeof config;

export const isDevelopment = (): boolean => config.environment === 'development';
export const isProduction = (): boolean => config.environment === 'production';
export const shouldLog = (type: keyof typeof config.logging = 'enabled'): boolean => false; // DISABLED