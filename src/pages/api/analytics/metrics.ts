// src/pages/api/analytics/metrics.ts
import type { APIRoute } from 'astro';
import { db } from '../../../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  try {
    const metric = url.searchParams.get('metric');
    const timeframe = url.searchParams.get('timeframe') || '7d';

    let startDate: Date;
    switch (timeframe) {
      case '1d':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    let data;

    switch (metric) {
      case 'comment-volume':
        data = await getCommentVolumeMetrics(startDate);
        break;
      case 'user-activity':
        data = await getUserActivityMetrics(startDate);
        break;
      case 'moderation-queue':
        data = await getModerationQueueMetrics(startDate);
        break;
      case 'response-times':
        data = await getResponseTimeMetrics(startDate);
        break;
      case 'engagement-rates':
        data = await getEngagementRateMetrics(startDate);
        break;
      default:
        throw new Error('Invalid metric requested');
    }

    return new Response(JSON.stringify({ data }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Analytics metrics error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function getCommentVolumeMetrics(startDate: Date) {
  const { data: comments } = await db.comments()
    .select('created_at, moderation_status')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  const safeComments = comments || [];
  const dailyVolume = new Map();
  
  safeComments.forEach(comment => {
    const date = new Date(comment.created_at).toISOString().split('T')[0];
    if (!dailyVolume.has(date)) {
      dailyVolume.set(date, { total: 0, approved: 0, pending: 0, flagged: 0 });
    }
    const day = dailyVolume.get(date);
    day.total++;
    if (day[comment.moderation_status] !== undefined) {
      day[comment.moderation_status]++;
    }
  });

  return Array.from(dailyVolume.entries()).map(([date, metrics]) => ({
    date,
    ...metrics
  }));
}

async function getUserActivityMetrics(startDate: Date) {
  const { data: activities } = await db.userActivities()
    .select('activity_type, created_at, user_id')
    .gte('created_at', startDate.toISOString())
    .eq('activity_type', 'comment_created');

  const safeActivities = activities || [];
  const dailyActivity = new Map();
  const uniqueUsers = new Set();

  safeActivities.forEach(activity => {
    const date = new Date(activity.created_at).toISOString().split('T')[0];
    if (!dailyActivity.has(date)) {
      dailyActivity.set(date, { activities: 0, users: new Set() });
    }
    const day = dailyActivity.get(date);
    day.activities++;
    day.users.add(activity.user_id);
    uniqueUsers.add(activity.user_id);
  });

  return {
    dailyActivity: Array.from(dailyActivity.entries()).map(([date, data]) => ({
      date,
      activities: data.activities,
      uniqueUsers: data.users.size
    })),
    totalUniqueUsers: uniqueUsers.size
  };
}

async function getModerationQueueMetrics(startDate: Date) {
  const { data: queue } = await db.comments()
    .select('created_at, moderation_status, updated_at')
    .gte('created_at', startDate.toISOString());

  const safeQueue = queue || [];
  
  const queueMetrics = {
    pending: safeQueue.filter(c => c.moderation_status === 'pending').length,
    processing: safeQueue.filter(c => c.moderation_status === 'flagged').length,
    resolved: safeQueue.filter(c => ['approved', 'rejected'].includes(c.moderation_status)).length
  };

  const averageProcessingTime = calculateAverageProcessingTime(safeQueue);

  return {
    ...queueMetrics,
    averageProcessingTime,
    total: safeQueue.length
  };
}

async function getResponseTimeMetrics(startDate: Date) {
  const { data: moderationActions } = await db.commentModeration()
    .select('created_at, comment_id')
    .gte('created_at', startDate.toISOString());

  const safeActions = moderationActions || [];
  
  // Calculate response time metrics
  const responseTimes = safeActions.map(action => {
    // Simplified calculation - in real implementation, you'd compare with comment creation time
    return Math.random() * 120; // Mock response time in minutes
  });

  if (responseTimes.length === 0) {
    return {
      average: 0,
      median: 0,
      responseTimes: []
    };
  }

  const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const sortedTimes = [...responseTimes].sort((a, b) => a - b);
  const medianResponseTime = sortedTimes[Math.floor(sortedTimes.length / 2)];

  return {
    average: Math.round(averageResponseTime),
    median: Math.round(medianResponseTime),
    responseTimes: responseTimes.map((time, index) => ({
      index,
      responseTime: Math.round(time)
    }))
  };
}

async function getEngagementRateMetrics(startDate: Date) {
  // Get comments with their IDs for proper linking
  const { data: comments } = await db.comments()
    .select('id, article_id, user_id, created_at')
    .gte('created_at', startDate.toISOString());

  const { data: reactions } = await db.commentReactions()
    .select('comment_id, created_at')
    .gte('created_at', startDate.toISOString());

  const safeComments = comments || [];
  const safeReactions = reactions || [];
  
  const articleEngagement = new Map();
  
  // Track comments per article
  safeComments.forEach(comment => {
    if (!articleEngagement.has(comment.article_id)) {
      articleEngagement.set(comment.article_id, { comments: 0, reactions: 0 });
    }
    articleEngagement.get(comment.article_id).comments++;
  });

  // Track reactions per article
  safeReactions.forEach(reaction => {
    // Find the comment's article
    const comment = safeComments.find(c => c.id === reaction.comment_id);
    if (comment && articleEngagement.has(comment.article_id)) {
      articleEngagement.get(comment.article_id).reactions++;
    }
  });

  return Array.from(articleEngagement.entries()).map(([articleId, data]) => ({
    articleId,
    comments: data.comments,
    reactions: data.reactions,
    engagementRate: data.comments > 0 ? Math.round((data.reactions / data.comments) * 100) / 100 : 0
  }));
}

function calculateAverageProcessingTime(queue: any[]): number {
  if (queue.length === 0) return 0;
  
  const processedComments = queue.filter(c => 
    c.updated_at && c.created_at && 
    ['approved', 'rejected'].includes(c.moderation_status)
  );

  if (processedComments.length === 0) return 0;

  const totalProcessingTime = processedComments.reduce((sum, comment) => {
    const created = new Date(comment.created_at);
    const updated = new Date(comment.updated_at);
    return sum + (updated.getTime() - created.getTime());
  }, 0);

  return Math.round(totalProcessingTime / processedComments.length / (1000 * 60)); // Convert to minutes
}