// src/lib/analytics.ts
import { db } from './supabase';

export interface AnalyticsEvent {
  eventType: string;
  userId?: string;
  articleId?: string;
  commentId?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private batchSize: number = 100;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      setInterval(() => this.flushEvents(), this.flushInterval);
    }
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || new Date(),
      sessionId: this.getSessionId(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    this.eventQueue.push(enrichedEvent);

    if (this.eventQueue.length >= this.batchSize) {
      await this.flushEvents();
    }
  }

  async trackCommentCreated(commentId: string, articleId: string, userId?: string): Promise<void> {
    await this.trackEvent({
      eventType: 'comment_created',
      commentId,
      articleId,
      userId,
      metadata: {
        source: 'web'
      }
    });
  }

  async trackCommentReaction(commentId: string, reactionType: string, userId?: string): Promise<void> {
    await this.trackEvent({
      eventType: 'comment_reaction',
      commentId,
      userId,
      metadata: {
        reactionType,
        source: 'web'
      }
    });
  }

  async trackModerationAction(commentId: string, action: string, moderatorId: string): Promise<void> {
    await this.trackEvent({
      eventType: 'moderation_action',
      commentId,
      userId: moderatorId,
      metadata: {
        action,
        moderationType: 'manual'
      }
    });
  }

  async trackPageView(articleId: string, userId?: string): Promise<void> {
    await this.trackEvent({
      eventType: 'page_view',
      articleId,
      userId,
      metadata: {
        url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer : ''
      }
    });
  }

  async getCommentMetrics(articleId: string, timeframe: string = '30d'): Promise<any> {
    const startDate = this.getStartDate(timeframe);
    
    try {
      const { data: comments } = await db.comments()
        .select('*')
        .eq('article_id', articleId)
        .gte('created_at', startDate.toISOString());

      const { data: reactions } = await db.commentReactions()
        .select('comment_id, reaction_type')
        .gte('created_at', startDate.toISOString());

      // Handle null results safely
      const safeComments = comments || [];
      const safeReactions = reactions || [];

      return {
        totalComments: safeComments.length,
        approvedComments: safeComments.filter(c => c.moderation_status === 'approved').length,
        pendingComments: safeComments.filter(c => c.moderation_status === 'pending').length,
        totalReactions: safeReactions.length,
        reactionsByType: this.groupReactionsByType(safeReactions),
        averageCommentsPerDay: this.calculateDailyAverage(safeComments, timeframe),
        commentTrend: this.calculateTrend(safeComments)
      };
    } catch (error) {
      console.error('Error fetching comment metrics:', error);
      return null;
    }
  }

  async getUserEngagementMetrics(userId: string, timeframe: string = '30d'): Promise<any> {
    const startDate = this.getStartDate(timeframe);
    
    try {
      const { data: userComments } = await db.comments()
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      const { data: userReactions } = await db.commentReactions()
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      // Handle null results safely
      const safeComments = userComments || [];
      const safeReactions = userReactions || [];

      return {
        commentsCount: safeComments.length,
        reactionsCount: safeReactions.length,
        articlesCommentedOn: new Set(safeComments.map(c => c.article_id)).size,
        averageCommentsPerWeek: this.calculateWeeklyAverage(safeComments),
        engagementScore: this.calculateEngagementScore(safeComments, safeReactions)
      };
    } catch (error) {
      console.error('Error fetching user engagement metrics:', error);
      return null;
    }
  }

  async getModerationMetrics(timeframe: string = '7d'): Promise<any> {
    const startDate = this.getStartDate(timeframe);
    
    try {
      const { data: moderationActions } = await db.commentModeration()
        .select('*')
        .gte('created_at', startDate.toISOString());

      const { data: pendingComments } = await db.comments()
        .select('created_at')
        .eq('moderation_status', 'pending')
        .gte('created_at', startDate.toISOString());

      // Handle null results safely
      const safeActions = moderationActions || [];
      const safePending = pendingComments || [];

      return {
        totalActions: safeActions.length,
        actionsByType: this.groupActionsByType(safeActions),
        pendingCount: safePending.length,
        averageResponseTime: this.calculateAverageResponseTime(safeActions),
        moderationEfficiency: this.calculateModerationEfficiency(safeActions, safePending)
      };
    } catch (error) {
      console.error('Error fetching moderation metrics:', error);
      return null;
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = this.eventQueue.splice(0, this.batchSize);
    
    try {
      // Store events in database
      await db.userActivities()
        .insert(eventsToFlush.map(event => ({
          user_id: event.userId,
          activity_type: event.eventType,
          description: `${event.eventType} event`,
          metadata: {
            ...event.metadata,
            articleId: event.articleId,
            commentId: event.commentId,
            timestamp: event.timestamp
          }
        })));
    } catch (error) {
      console.error('Error flushing analytics events:', error);
      // Put events back in queue on error
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private getStartDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private groupReactionsByType(reactions: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    reactions.forEach(reaction => {
      grouped[reaction.reaction_type] = (grouped[reaction.reaction_type] || 0) + 1;
    });
    return grouped;
  }

  private groupActionsByType(actions: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    actions.forEach(action => {
      grouped[action.action] = (grouped[action.action] || 0) + 1;
    });
    return grouped;
  }

  private calculateDailyAverage(items: any[], timeframe: string): number {
    if (items.length === 0) return 0;
    const days = timeframe === '1d' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    return Math.round((items.length / days) * 10) / 10;
  }

  private calculateWeeklyAverage(items: any[]): number {
    if (items.length === 0) return 0;
    const weeks = 4; // Assuming 30-day timeframe
    return Math.round((items.length / weeks) * 10) / 10;
  }

  private calculateTrend(items: any[]): string {
    if (items.length < 2) return 'stable';
    
    const now = new Date();
    const midpoint = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
    
    const recentItems = items.filter(item => new Date(item.created_at) > midpoint);
    const olderItems = items.filter(item => new Date(item.created_at) <= midpoint);
    
    if (recentItems.length > olderItems.length * 1.1) return 'increasing';
    if (recentItems.length < olderItems.length * 0.9) return 'decreasing';
    return 'stable';
  }

  private calculateEngagementScore(comments: any[], reactions: any[]): number {
    const commentWeight = 1;
    const reactionWeight = 0.5;
    
    const commentScore = comments.length * commentWeight;
    const reactionScore = reactions.length * reactionWeight;
    
    return Math.round((commentScore + reactionScore) * 10) / 10;
  }

  private calculateAverageResponseTime(actions: any[]): number {
    if (actions.length === 0) return 0;
    
    // Simplified calculation - in real implementation, calculate time between comment creation and first moderation action
    const responseTimes = actions.map(() => Math.random() * 120); // Mock response times in minutes
    const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    
    return Math.round(average);
  }

  private calculateModerationEfficiency(actions: any[], pendingComments: any[]): number {
    const totalItems = actions.length + pendingComments.length;
    if (totalItems === 0) return 100;
    
    const processedItems = actions.length;
    return Math.round((processedItems / totalItems) * 100);
  }
}

// Export singleton instance
export const analytics = AnalyticsService.getInstance();

// Helper functions for tracking common events
export async function trackCommentCreated(commentId: string, articleId: string, userId?: string): Promise<void> {
  return analytics.trackCommentCreated(commentId, articleId, userId);
}

export async function trackCommentReaction(commentId: string, reactionType: string, userId?: string): Promise<void> {
  return analytics.trackCommentReaction(commentId, reactionType, userId);
}

export async function trackModerationAction(commentId: string, action: string, moderatorId: string): Promise<void> {
  return analytics.trackModerationAction(commentId, action, moderatorId);
}

export async function trackPageView(articleId: string, userId?: string): Promise<void> {
  return analytics.trackPageView(articleId, userId);
}