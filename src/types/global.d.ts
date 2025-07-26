// src/types/global.d.ts - SIMPLIFIED
import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    supabase: SupabaseClient;
  }
}

declare global {
  interface Window {
    tinkbyteInitialized?: boolean;
  }
}

export {};

declare global {
  interface Window {
    themeTransitionManager?: {
      startTransition: () => void;
      endTransition: () => void;
      isTransitioning: boolean;
    };
    toggleTheme?: () => void;
  }
}

export {};

export {};