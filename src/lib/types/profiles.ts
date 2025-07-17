// src/lib/types/profiles.ts
export interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  bio?: string;
  avatar_type: 'preset' | 'uploaded';
  avatar_preset_id: number;
  avatar_url?: string;
  website?: string;
  twitter_handle?: string;
  linkedin_url?: string;
  github_username?: string;
  location?: string;
  job_title?: string;
  company?: string;
  total_reads: number;
  total_comments: number;
  total_articles: number;
  reputation_score: number;
  created_at: string;
  updated_at: string;
  following_count: number;
  followers_count: number;
  is_public: boolean;
  bio_short?: string;
  is_admin: boolean;
  is_blocked: boolean;
  blocked_until?: string;
  membership_type: 'free' | 'premium' | 'enterprise';
}

export interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  bio?: string;
  bio_short?: string;
  avatar_type?: 'preset' | 'uploaded';
  avatar_preset_id?: number;
  avatar_url?: string;
  website?: string;
  twitter_handle?: string;
  linkedin_url?: string;
  github_username?: string;
  location?: string;
  job_title?: string;
  company?: string;
  is_public?: boolean;
}

export interface ProfileStats {
  total_reads: number;
  total_comments: number;
  total_articles: number;
  reputation_score: number;
  following_count: number;
  followers_count: number;
}