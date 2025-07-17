// src/lib/types/follows.ts
export interface UserFollow {
  id: string;
  follower_id?: string;
  following_id?: string;
  created_at: string;
  follow_type: 'user' | 'author' | 'topic';
  is_active: boolean;
}

export interface UserFollowingPreferences {
  id: string;
  user_id?: string;
  follow_topics: boolean;
  follow_authors: boolean;
  follow_users: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  digest_frequency: 'daily' | 'weekly' | 'monthly' | 'never';
  created_at: string;
  updated_at: string;
}

export interface FollowStats {
  followers_count: number;
  following_count: number;
  mutual_follows: number;
}

export interface FollowingUser {
  id: string;
  display_name?: string;
  avatar_url?: string;
  avatar_type: 'preset' | 'uploaded';
  avatar_preset_id: number;
  bio_short?: string;
  reputation_score: number;
  is_admin: boolean;
  followed_at: string;
}