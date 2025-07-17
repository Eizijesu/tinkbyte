// src/lib/types/authors.ts - Author and contributor types

export interface Author {
  id: string;
  slug: string;
  name: string;
  bio?: string;
  avatar?: string;
  role?: string;
  company?: string;
  email?: string;
  social: Record<string, any>;
  featured: boolean;
  follower_count: number;
  article_count: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthorFollow {
  id: string;
  user_id?: string;
  author_slug: string;
  created_at: string;
}

export interface AuthorWithStats extends Author {
  total_views: number;
  total_likes: number;
  total_comments: number;
  avg_read_time: number;
  engagement_rate: number;
  is_followed?: boolean;
  recent_articles?: Array<{
    id: string;
    title: string;
    slug: string;
    published_at: string;
    view_count: number;
  }>;
}

export interface AuthorStats {
  total_articles: number;
  total_followers: number;
  total_views: number;
  total_engagement: number;
  avg_article_performance: number;
  growth_metrics: {
    followers_last_30d: number;
    articles_last_30d: number;
    views_last_30d: number;
  };
}
