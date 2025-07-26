// src/lib/supabase-client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = config.supabase.url;
    const supabaseAnonKey = config.supabase.anonKey;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: `tinkbyte-auth-token-${config.environment}`,
        debug: false
      },
      global: {
        headers: {
          'X-Environment': config.environment,
          'X-Client-Info': `tinkbyte-web-${config.environment}`
        }
      }
    });

    console.log('✅ Supabase singleton client created');
  }

  return supabaseInstance;
}

// Export the singleton instance
export const supabase = getSupabaseClient();

// Export type for consistency
export type { SupabaseClient };