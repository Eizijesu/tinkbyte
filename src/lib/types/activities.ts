// src/lib/types/activities.ts - User activities and engagement

export interface Activity {
  id: string;
  user_id?: string;
  activity_type: string;
  description: string;
  metadata: Record<string, any>;
  is_public: boolean;
  created_at: string;
}

export interface ActivityFeed {
  id: string;
  user_id?: string;
  activity_type: string;
  source_type: 'topic' | 'author' | 'user' | 'article';
  source_id: string;
  title: string;
  description?: string;
  url?: string;
  image_url?: string;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface ActivityStats {
  total_activities: number;
  activities_today: number;
  most_active_users: Array<{
    user_id: string;
    username: string;
    activity_count: number;
  }>;
  activity_breakdown: Record<string, number>;
  engagement_metrics: {
    daily_active_users: number;
    weekly_active_users: number;
    monthly_active_users: number;
    avg_session_duration: number;
    bounce_rate: number;
  };
}

export interface ActivityNotification {
  id: string;
  user_id: string;
  activity_id: string;
  notification_type: 'mention' | 'reply' | 'like' | 'follow' | 'article_published';
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityDigest {
  id: string;
  user_id: string;
  digest_type: 'daily' | 'weekly' | 'monthly';
  content: {
    articles_published: number;
    comments_received: number;
    likes_received: number;
    new_followers: number;
    trending_articles: Array<{
      title: string;
      url: string;
      engagement: number;
    }>;
  };
  sent_at: string;
  created_at: string;
}
