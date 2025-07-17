// src/lib/utils/supabase-global.ts - Global Supabase utilities
import { supabase } from '../supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// Function to safely get global supabase instance
export function getGlobalSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  
  const windowWithSupabase = window as any;
  return windowWithSupabase.supabase || null;
}

// Function to initialize global supabasea
export function initializeGlobalSupabase(): void {
  if (typeof window !== 'undefined') {
    (window as any).supabase = supabase;
  }
}

// Safe supabase operations
export async function safeSupabaseAuth() {
  const globalSupabase = getGlobalSupabase();
  if (!globalSupabase) {
    throw new Error('Supabase not initialized');
  }
  return globalSupabase.auth;
}

export async function safeSupabaseFrom(table: string) {
  const globalSupabase = getGlobalSupabase();
  if (!globalSupabase) {
    throw new Error('Supabase not initialized');
  }
  return globalSupabase.from(table);
}