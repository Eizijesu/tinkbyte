// src/lib/types/common.ts - Common and shared types

// Pagination and filtering
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface FilterParams {
  search?: string;
  category?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  author?: string;
  topic?: string;
}

// TinkByte specific configuration
export interface TinkByteConfig {
  site: {
    name: string;
    url: string;
    description: string;
    version: string;
  };
  features: {
    comments: boolean;
    newsletter: boolean;
    analytics: boolean;
    premium: boolean;
    social_login: boolean;
    dark_mode: boolean;
  };
  limits: {
    maxCommentLength: number;
    maxCommentsPerArticle: number;
    rateLimitWindow: number;
    maxFileSize: number;
    maxImageSize: number;
  };
  integrations: {
    supabase: boolean;
    stripe: boolean;
    paystack: boolean;
    convertkit: boolean;
    google_analytics: boolean;
  };
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

// Search and filtering
export interface SearchParams {
  query: string;
  filters?: FilterParams;
  pagination?: PaginationParams;
  facets?: string[];
}

export interface SearchResult<T> {
  results: T[];
  total: number;
  facets?: Record<string, Array<{ value: string; count: number }>>;
  suggestions?: string[];
  took: number;
}

// File upload types
export interface FileUpload {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  user_id?: string;
  created_at: string;
}

export interface ImageUpload extends FileUpload {
  width: number;
  height: number;
  alt_text?: string;
  caption?: string;
  thumbnail_url?: string;
}

// Notification types
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  in_app: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

export interface SystemNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action_url?: string;
  action_text?: string;
  is_dismissible: boolean;
  expires_at?: string;
  created_at: string;
}

// Error handling
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  user_id?: string;
  request_id?: string;
}

// Theme and UI
export interface ThemeConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  border_radius: string;
  font_family: string;
  font_size_base: string;
}

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebar_collapsed: boolean;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  animations_enabled: boolean;
}
