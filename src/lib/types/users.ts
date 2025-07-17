// src/lib/types/users.ts - User system types

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  password_hash?: string;
  google_id?: string;
  mfa_enabled: boolean;
  mfa_secret?: string;
  backup_codes: string[];
  failed_login_attempts: number;
  locked_until?: string;
  last_password_change: string;
  status: 'active' | 'suspended' | 'deleted';
  membership_type: 'free' | 'premium';
  membership_expires_at?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserPreferences {
  id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  newsletter_frequency: 'daily' | 'weekly' | 'monthly' | 'never';
  comment_notifications: boolean;
  follow_notifications: boolean;
  forum_notifications: boolean;
  marketing_emails: boolean;
  newsletter_subscriptions: string[];
  theme_preference: 'light' | 'dark' | 'system';
  timezone: string;
  language: string;
  profile_visibility: 'public' | 'members' | 'private';
  show_email: boolean;
  show_real_name: boolean;
  content_maturity: 'general' | 'mature';
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id?: string;
  session_token: string;
  refresh_token?: string;
  ip_address?: string;
  user_agent?: string;
  device_fingerprint?: string;
  location_country?: string;
  location_city?: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

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
