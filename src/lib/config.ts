// src/lib/config.ts - DUAL ENVIRONMENT SUPPORT
import { deploymentManager } from './deployment.js';

export type Environment = 'development' | 'production';

// Enhanced environment detection
const getEnvironment = (): Environment => {
  if (typeof window === 'undefined') {
    // Server-side: check build context
    return import.meta.env?.PROD ? 'production' : 'development';
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
  
  // **UPDATED: Environment utilities**
  environments: {
    current: getEnvironment(),
    isDevelopment: getEnvironment() === 'development',
    isProduction: getEnvironment() === 'production',
    
    // Force specific environment for certain operations
    forceProduction: () => 'production' as Environment,
    forceDevelopment: () => 'development' as Environment,
    
    // Get both environments for dual queries
    both: ['development', 'production'] as Environment[],
    
    // **NEW: Comments strategy**
    comments: {
      // Primary environment for new comments
      write: getEnvironment(),
      // Environments to read from (production first for existing data)
      read: ['production', 'development'] as Environment[],
      // Fallback for SSR (always check production first)
      ssr: 'production' as Environment,
    },
  },
  
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
    profileEnvironment: 'production' as Environment,
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
    enabled: false,
    level: 'error' as const,
    supabase: false,
    deployment: false
  }
} as const;

export type Config = typeof config;

// **UPDATED: Enhanced utility functions**
export const isDevelopment = (): boolean => config.environments.isDevelopment;
export const isProduction = (): boolean => config.environments.isProduction;
export const getCurrentEnvironment = (): Environment => config.environments.current;
export const getBothEnvironments = (): Environment[] => config.environments.both;
export const shouldLog = (type: keyof typeof config.logging = 'enabled'): boolean => false;

// **UPDATED: Environment-specific helpers with comments strategy**
export const getEnvironmentFor = (context: 'admin' | 'comments' | 'general'): Environment => {
  switch (context) {
    case 'admin':
      return config.admin.profileEnvironment;
    case 'comments':
      return config.environments.comments.write; // Use write environment for new comments
    case 'general':
    default:
      return config.environment;
  }
};

// **NEW: Comments-specific helpers**
export const getCommentsReadEnvironments = (): Environment[] => {
  return config.environments.comments.read;
};

export const getCommentsWriteEnvironment = (): Environment => {
  return config.environments.comments.write;
};

export const getCommentsSSREnvironment = (): Environment => {
  return config.environments.comments.ssr;
};