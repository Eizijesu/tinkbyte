// src/lib/types/threads.ts - Forum threads and discussions

export interface Thread {
  id: string;
  slug: string;
  title: string;
  description?: string;
  user_id?: string;
  category_slug?: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface ThreadReply {
  id: string;
  thread_id: string;
  user_id?: string;
  parent_id?: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ThreadWithMetadata extends Thread {
  author_name?: string;
  author_avatar?: string;
  topic_name?: string;
  topic_color?: string;
  last_reply_by?: string;
  last_reply_at?: string;
  is_subscribed?: boolean;
  unread_replies?: number;
}

export interface ThreadStats {
  total_threads: number;
  total_replies: number;
  active_threads: number;
  avg_replies_per_thread: number;
  top_contributors: Array<{
    user_id: string;
    username: string;
    thread_count: number;
    reply_count: number;
  }>;
}
