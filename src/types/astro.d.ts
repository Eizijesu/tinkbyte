declare global {
  namespace App {
    interface Locals {
      // User authentication data
      user?: {
        id: string;
        email: string;
        email_verified?: boolean;
        user_metadata?: any;
        app_metadata?: any;
        created_at?: string;
      } | null;
      
      // Admin status
      isAdmin?: boolean;
      
      // Session data
      session?: {
        access_token: string;
        refresh_token: string;
        expires_at?: number;
        user: {
          id: string;
          email: string;
        };
      } | null;
    }
  }
}
declare module 'astro:content' {
  interface CollectionEntry<T extends keyof ContentEntryMap> {
    id: string;
    slug: string;
    body: string;
    collection: T;
    data: ContentEntryMap[T];
  }

  interface ContentEntryMap {
    'blog': {
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
    
    'authors': {
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
    
    'categories': {
      name: string;
      description?: string;
      color?: string;
      is_featured?: boolean;
      featured?: boolean;
      is_premium?: boolean;
    };
    
    'newsletter': {
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
    
    'podcast': {
      title: string;
      pubDate: Date;
      category?: string;
      featured?: boolean;
      guests?: any[];
      tags?: string[];
      host?: string;
      is_published?: boolean;
    };
    
    'pages': {
      title: string;
      description?: string;
      layout?: string;
    };
    
    'legal': {
      title: string;
      lastUpdated: Date;
      version?: string;
      type: 'privacy' | 'terms' | 'cookies' | 'disclaimer';
    };
    
    'settings': {
      key: string;
      value: any;
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    };
    
    'contact': {
      name: string;
      email: string;
      department?: string;
      role?: string;
    };
    
    'allTopics': {
      name: string;
      slug: string;
      description?: string;
      count?: number;
    };
  }

  export function getCollection<T extends keyof ContentEntryMap>(
    collection: T,
    filter?: (entry: CollectionEntry<T>) => boolean
  ): Promise<CollectionEntry<T>[]>;

  export function getEntry<T extends keyof ContentEntryMap>(
    collection: T,
    slug: string
  ): Promise<CollectionEntry<T> | undefined>;

  export function getEntries<T extends keyof ContentEntryMap>(
    entries: Array<{ collection: T; slug: string }>
  ): Promise<CollectionEntry<T>[]>;

  export { type CollectionEntry };
}

export {};