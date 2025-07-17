// src/lib/types/moderation.ts - Content moderation types

export interface ModerationRule {
  id: string;
  rule_name: string;
  rule_type: 'keyword' | 'pattern' | 'length' | 'frequency';
  rule_config: Record<string, any>;
  action: 'flag' | 'hide' | 'require_approval';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModerationAction {
  id: string;
  content_type: 'comment' | 'article' | 'user_profile';
  content_id: string;
  moderator_id?: string;
  action: 'flag' | 'unflag' | 'hide' | 'delete' | 'approve' | 'reject';
  reason?: string;
  auto_flagged: boolean;
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface ContentFlag {
  id: string;
  content_type: 'comment' | 'article' | 'user_profile';
  content_id: string;
  reporter_id?: string;
  reason: string;
  category: 'spam' | 'harassment' | 'inappropriate' | 'copyright' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface ModerationQueue {
  id: string;
  content_type: 'comment' | 'article' | 'user_profile';
  content_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_review' | 'completed';
  assigned_to?: string;
  flags_count: number;
  auto_flagged: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModerationStats {
  total_flagged: number;
  total_approved: number;
  total_rejected: number;
  pending_review: number;
  auto_approved: number;
  response_time_avg: number;
  accuracy_rate: number;
}
