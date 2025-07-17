// src/lib/types/topics.ts - Topic and categorization types

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  target_audience?: string;
  color: string;
  icon?: string;
  is_premium: boolean;
  sort_order: number;
  created_at: string;
}

export interface UserTopicFollow {
  id: string;
  user_id?: string;
  category_slug: string;
  created_at: string;
}

export interface TopicWithStats extends Topic {
  article_count: number;
  follower_count: number;
  is_followed?: boolean;
  recent_articles?: Array<{
    id: string;
    title: string;
    slug: string;
    published_at: string;
  }>;
}

export interface TopicStats {
  total_articles: number;
  total_followers: number;
  total_views: number;
  avg_engagement: number;
  growth_rate: number;
}
