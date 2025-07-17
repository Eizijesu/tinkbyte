// src/types/global.d.ts - SIMPLIFIED
import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    supabase: SupabaseClient;
  }
}

export {};