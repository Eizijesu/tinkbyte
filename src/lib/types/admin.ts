// src/lib/types/admin.ts
import type { CommentWithProfile } from './comments.js';
import type { ModerationStats } from './moderation.js';

export interface AdminComment extends CommentWithProfile {
  // Additional admin-specific fields
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  auto_flagged?: boolean;
  flags_count?: number;
  assigned_to?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface AdminPaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

export interface AdminApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: AdminPaginationInfo;
  validation_errors?: Record<string, string>;
}

export interface AdminCommentFilters {
  status?: 'pending' | 'approved' | 'flagged' | 'hidden';
  page?: number;
  limit?: number;
  search?: string;
  article?: string;
  userType?: 'registered' | 'guest';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  auto_flagged?: boolean;
}

export interface BulkModerationRequest {
  comment_ids: string[];
  action: 'approve' | 'reject' | 'flag' | 'hide' | 'restore';
  reason?: string;
  moderator_notes?: string;
}

export interface ModerationActionResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: string[];
  message?: string;
}

export interface AdminStats extends ModerationStats {
  // Additional admin stats
  guest_comments_percentage: number;
  avg_response_time_hours: number;
  processing_rate_per_hour: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  urgent_count: number;
  overdue_count: number;
}

export interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'moderator' | 'super_admin';
  permissions: string[];
  last_active: string;
  is_active: boolean;
}

export interface AdminActivity {
  id: string;
  admin_id: string;
  action: string;
  target_type: 'comment' | 'article' | 'user';
  target_id: string;
  details: Record<string, any>;
  created_at: string;
}

export interface AdminDashboardData {
  stats: AdminStats;
  recent_activities: AdminActivity[];
  pending_queue: AdminComment[];
  flagged_content: AdminComment[];
  system_alerts: SystemAlert[];
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  details?: string;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
}