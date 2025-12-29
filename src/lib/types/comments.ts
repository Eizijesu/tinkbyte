
// src/lib/types/comments.ts - Complete types
export interface CommentWithProfile {
  id: string;
  article_id: string;
  user_id?: string;
  parent_id?: string;
  content: string;
  guest_name?: string;
  guest_email?: string;
  is_edited: boolean;
  is_deleted: boolean;
  like_count: number;
  comment_count?: number;
  created_at: string;
  updated_at: string;
  thread_level: number;
  status: 'pending' | 'approved' | 'auto_approved' | 'flagged' | 'hidden';
  moderation_status?: 'pending' | 'approved' | 'auto_approved' | 'flagged' | 'hidden';
  moderation_reason?: string;
  edit_reason?: string;
  reply_to_author?: string;
  reply_to_content?: string;
  reply_to_user?: string;
  reply_to_user_id?: string;
  deleted_at?: string;
  deleted_by?: string;
  
  // Profile Data - Nullable to handle joined data
  profiles?: {
    id: string;
    display_name: string;
    avatar_type: 'preset' | 'uploaded' | 'google';
    avatar_preset_id: number;
    avatar_url?: string;
    reputation_score: number;
    is_admin: boolean;
  } | null; 

  user_profile?: {
    id: string;
    display_name: string;
    avatar_type: 'preset' | 'uploaded' | 'google';
    avatar_preset_id: number;
    avatar_url?: string;
    reputation_score: number;
    is_admin: boolean;
  } | null; 

  // Reaction data
  user_reaction?: string | null;
  comment_reactions?: Array<{
    reaction_type: string;
    user_id: string;
  }>;
  
  // User interaction states
  comment_likes?: Array<{
    user_id: string;
  }>;

  reaction_counts?: Record<string, number>;
  comment_saves?: Array<{
    user_id: string;
  }>;
  
  comment_bookmarks?: Array<{
    user_id: string;
  }>;

  // User interaction flags
  is_comment_liked?: boolean;
  is_comment_saved?: boolean;
  is_comment_bookmarked?: boolean;    
  is_liked?: boolean;
  is_saved?: boolean;
  is_bookmarked?: boolean;
  
  // Threading
  replies?: CommentWithProfile[];
  reply_count?: number;
  has_more_replies?: boolean;
  is_collapsed?: boolean;
  
  // Display fields
  display_name?: string;
  avatar_type?: 'preset' | 'uploaded' | 'google';
  avatar_preset_id?: number;
  avatar_url?: string;
  reputation_score?: number;
  is_admin?: boolean;
  
  // Moderation
  is_pinned?: boolean;
  quality_score?: number;
  mention_users?: string[];
  auto_approved_reason?: string;
  
  // Helper fields
  user_tier?: 'free' | 'premium' | 'admin';
  can_edit?: boolean;
  can_delete?: boolean;
  can_reply?: boolean;
  depth?: number;
  path?: string[];
}

export interface CommentFormData {
  content: string;
  name: string;
  email?: string;
  parent_id?: string;
  article_id: string;
  mentions?: string[];
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export interface CommentBookmark {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  article_id: string;
  user_id?: string;
  parent_id?: string;
  content: string;
  thread_level: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  moderation_status: string;
  like_count: number;
  reply_count: number;
}

export interface CommentValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

export interface CommentResponse {
  success: boolean;
  data?: CommentWithProfile;
  error?: string;
  message?: string;
}

export interface CommentsListResponse {
  success: boolean;
  data: CommentWithProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CommentMutationResponse {
  success: boolean;
  data?: CommentWithProfile;
  error?: string;
  message?: string;
  validation_errors?: Record<string, string>;
}

export interface CommentPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Config types
export interface MobileConfig {
  maxThreadDepth: number;
  initialLoad: number;
  pageSize: number;
  repliesPageSize: number;
  hideDeepThreads: boolean;
}

export interface RateLimitTier {
  comments: number;
  window: number;
}

export interface CommentConfig {
  maxThreadDepth: number;
  mobileMaxDepth: number;
  collapseAfter: number;
  initialLoad: number;
  pageSize: number;
  repliesPerComment: number;
  repliesPageSize: number;
  maxCommentsBeforeVirtualization: number;
  virtualScrollBuffer: number;
  rateLimits: {
    free: RateLimitTier;
    premium: RateLimitTier;
    admin: RateLimitTier;
  };
  animationDuration: number;
  autoSaveDelay: number;
  characterLimits: {
    min: number;
    max: number;
    warning: number;
  };
  editWindowHours: number;
  allowDelete: boolean;
  allowEdit: boolean;
  trackEditHistory: boolean;
  editReasons: string[];
  autoApprove: boolean;
  requireModeration: boolean;
  spamDetection: boolean;
  enableReactions: boolean;
  enableMentions: boolean;
  enableBookmarks: boolean;
  enableDrafts: boolean;
  mobile: MobileConfig;
  THREADING: {
    MAX_DEPTH: number;
  };
  VALIDATION: {
    MIN_CONTENT_LENGTH: number;
    MAX_CAPS_PERCENTAGE: number;
  };
  SECURITY: {
    MAX_CONTENT_LENGTH: number;
  };
  MENTIONS: {
    MAX_MENTIONS_PER_COMMENT: number;
  };
  MODERATION: {
    AUTO_APPROVE_HIGH_REP: number;
    AUTO_APPROVE_THRESHOLD: number;
    SPAM_THRESHOLD: number;
    REVIEW_THRESHOLD: number;
  };
  RATE_LIMITING: {
    COMMENTS_PER_MINUTE: number;
  };
}
