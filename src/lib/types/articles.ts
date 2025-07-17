// src/lib/types/articles.ts - Article and content types

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  content: string;
  author_id?: string;
  category_slug?: string;
  featured_image_url?: string;
  is_published: boolean;
  is_premium: boolean;
  is_featured: boolean;
  read_time_minutes?: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface ArticleRead {
  id: string;
  user_id?: string;
  article_id: string;
  read_percentage: number;
  time_spent_seconds: number;
  created_at: string;
}

export interface ArticleLike {
  id: string;
  user_id?: string;
  article_id: string;
  created_at: string;
}

export interface ArticleSave {
  id: string;
  user_id?: string;
  article_id: string;
  created_at: string;
}

export interface ArticleFollow {
  id: string;
  user_id?: string;
  article_id: string;
  created_at: string;
}

// Article with extended data
export interface ArticleWithMetadata extends Article {
  author_name?: string;
  author_avatar?: string;
  topic_name?: string;
  topic_color?: string;
  is_liked?: boolean;
  is_saved?: boolean;
  is_followed?: boolean;
  read_progress?: number;
}

export interface ArticleStats {
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  avg_read_time: number;
  completion_rate: number;
}
