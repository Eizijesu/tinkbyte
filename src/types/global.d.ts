//src/types/global.d.ts
import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    supabase: SupabaseClient;
    authManager?: any;
    tinkbyteInitialized?: boolean;
    themeTransitionManager?: {
      startTransition: () => void;
      endTransition: () => void;
      isTransitioning: boolean;
    };
    toggleTheme?: () => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];

       // **ADD THIS: TinkByteAPI interface**
    TinkByteAPI?: {
      toggleCommentReaction: (commentId: string, reactionType: string) => Promise<any>;
      addComment: (articleSlug: string, content: string, parentId?: string) => Promise<any>;
      toggleCommentLike: (commentId: string) => Promise<any>;
      toggleCommentBookmark: (commentId: string) => Promise<any>;
    };
    
    // **ADD THIS: Additional config**
    TINKBYTE_CONFIG?: any;
  }
}


// Common types for your project
export interface Post {
  slug: string;
  data: {
    title: string;
    pubDate: Date;
    category?: string;
    featured?: boolean;
    tags?: string[];
    excerpt?: string;
    description?: string;
    readTime?: string;
    authorInfo?: {
      name: string;
      role?: string;
    };
    heroImage?: any;
    image?: string;
    audioUrl?: string;
    draft?: boolean;
  };
  body?: string;
}

export interface Author {
  slug: string;
  data: {
    name: string;
    featured?: boolean;
    pubDate?: Date;
    bio?: string;
    avatar?: string;
    role?: string;
    is_verified?: boolean;
    is_active?: boolean;
    article_count?: number;
  };
}

export interface Topic {
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

export interface Category {
  name: string;
  slug: string;
  description?: string;
  count?: number;
  is_featured?: boolean;
  featured?: boolean;
  is_premium?: boolean;
}

export interface Newsletter {
  slug: string;
  data: {
    title: string;
    publishDate: Date;
    excerpt?: string;
    featured?: boolean;
    highlights?: any[];
    tags?: string[];
    stats?: {
      subscribers?: number;
      openRate?: number;
    };
  };
}

export interface Podcast {
  slug: string;
  data: {
    title: string;
    pubDate: Date;
    category?: string;
    featured?: boolean;
    guests?: any[];
    tags?: string[];
    host?: string;
    is_published?: boolean;
  };
}

// Utility types
export type CollectionType = 'blog' | 'authors' | 'categories' | 'newsletters' | 'podcasts';

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  role?: string;
  is_active?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  comment_id?: string;
  created_at: string;
  moderation_status: 'pending' | 'approved' | 'flagged' | 'hidden' | 'auto_approved';
}

export {};