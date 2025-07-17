// src/lib/types/analytics.ts - Analytics and tracking types

export interface UserActivity {
  id: string;
  user_id?: string;
  activity_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface UserActivityFeed {
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
  created_at: string;
}

export interface UserRateLimit {
  id: string;
  user_id?: string;
  action_type: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id?: string;
  session_id?: string;
  event_type: string;
  event_data: Record<string, any>;
  page_url: string;
  referrer?: string;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
}

export interface PageView {
  id: string;
  user_id?: string;
  session_id?: string;
  page_url: string;
  page_title: string;
  referrer?: string;
  duration_seconds?: number;
  scroll_depth?: number;
  created_at: string;
}

export interface PerformanceMetrics {
  page_load_time: number;
  first_contentful_paint: number;
  largest_contentful_paint: number;
  cumulative_layout_shift: number;
  first_input_delay: number;
  time_to_interactive: number;
}
