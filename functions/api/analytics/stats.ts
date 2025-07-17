// functions/api/analytics/stats.ts
import { supabase } from '../../../src/lib/supabase.js';

export async function onRequestGet(context: any) {
  const { request } = context;
  
  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Comment statistics - Use standard Supabase syntax
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (commentsError) throw commentsError;

    // User statistics
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, total_comments, reputation_score, created_at')
      .gte('created_at', startDate.toISOString());

    if (usersError) throw usersError;

    // Moderation statistics
    const { data: moderationActions, error: modError } = await supabase
      .from('comment_moderation')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (modError) throw modError;

    // Calculate metrics
    const stats = {
      overview: {
        totalComments: comments?.length || 0,
        approvedComments: comments?.filter(c => c.moderation_status === 'approved').length || 0,
        pendingComments: comments?.filter(c => c.moderation_status === 'pending').length || 0,
        flaggedComments: comments?.filter(c => c.moderation_status === 'flagged').length || 0,
        activeUsers: users?.length || 0,
        totalModerationActions: moderationActions?.length || 0
      },
      trends: calculateTrends(comments, days),
      topArticles: getTopArticles(comments),
      userEngagement: calculateUserEngagement(users, comments),
      moderationEfficiency: calculateModerationEfficiency(moderationActions)
    };

    return new Response(JSON.stringify({ data: stats }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Analytics stats error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function calculateTrends(comments: any[], days: number) {
  const now = new Date();
  const periods = Array.from({ length: days }, (_, i) => {
    const date = new Date(now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    return {
      date: date.toISOString().split('T')[0],
      comments: 0
    };
  });

  comments?.forEach(comment => {
    const commentDate = new Date(comment.created_at).toISOString().split('T')[0];
    const period = periods.find(p => p.date === commentDate);
    if (period) period.comments++;
  });

  return periods;
}

function getTopArticles(comments: any[]) {
  const articleCounts = new Map();
  
  comments?.forEach(comment => {
    const count = articleCounts.get(comment.article_id) || 0;
    articleCounts.set(comment.article_id, count + 1);
  });

  return Array.from(articleCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([articleId, count]) => ({ articleId, count }));
}

function calculateUserEngagement(users: any[], comments: any[]) {
  const totalUsers = users?.length || 0;
  const totalComments = comments?.length || 0;
  
  return {
    averageCommentsPerUser: totalUsers > 0 ? totalComments / totalUsers : 0,
    commentsPerDay: Math.round(totalComments / 30),
    activeUsers: totalUsers,
    engagementRate: totalUsers > 0 ? (totalComments / totalUsers) * 100 : 0
  };
}

function calculateModerationEfficiency(actions: any[]) {
  if (!actions || actions.length === 0) {
    return { averageResponseTime: 0, actionsPerDay: 0, efficiency: 0 };
  }

  const totalActions = actions.length;
  const actionsPerDay = Math.round(totalActions / 7); // Last 7 days
  
  // Calculate average response time (simplified)
  const averageResponseTime = Math.round(Math.random() * 60); // Mock calculation
  
  return {
    averageResponseTime,
    actionsPerDay,
    efficiency: Math.min(100, (totalActions / 10) * 100) // Mock efficiency calculation
  };
}