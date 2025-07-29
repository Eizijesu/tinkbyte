// src/lib/types.ts - CLEANED UP
export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    display_name?: string;
    full_name?: string;
    avatar_url?: string;
    given_name?: string;
    family_name?: string;
  };
}

export interface Profile {
  id: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
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
  following_count: number;
  followers_count: number;
  is_public: boolean;
  membership_type: 'free' | 'premium' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  author_id: string;
  category_id: string;
  tags: string[];
  featured_image?: string;
  is_published: boolean;
  is_featured: boolean;
  reading_time: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  article_count: number;
  follower_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  like_count: number;
  reply_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ArticleWithAuthor extends Article {
  author: Profile;
  category: Category;
}

export interface CommentWithAuthor extends Comment {
  author: Profile;
  replies?: CommentWithAuthor[];
}

export interface UserStats {
  following_topics: number;
  following_users: number;
  followed_articles: number;
  followers: number;
  articles_read: number;
  comments_posted: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query?: string;
  category?: string;
  tags?: string[];
  author?: string;
}