// src/pages/api/admin/users/stats.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y

    // Check admin auth
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Forbidden' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get overall stats
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: blockedUsers },
      { count: adminUsers },
      { count: premiumUsers },
      { count: newUsers },
      { count: totalComments },
      { count: totalArticleLikes },
      { count: totalNewsletterSubs }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_blocked', false),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_blocked', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('membership_type', 'premium'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()),
      supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()),
      supabase.from('article_likes').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()),
      supabase.from('newsletter_subscriptions').select('*', { count: 'exact', head: true }).eq('is_active', true)
    ]);

    // Get user growth data (daily for last 30 days)
    const growthData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const { count: dailyUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString());

      growthData.push({
        date: date.toISOString().split('T')[0],
        users: dailyUsers || 0
      });
    }

    // Get top users by engagement
    const { data: topUsers } = await supabase
      .from('profiles')
      .select('id, display_name, total_comments, total_reads, reputation_score')
      .order('reputation_score', { ascending: false })
      .limit(10);

    // Get user activities breakdown
    const { data: userActivities } = await supabase
      .from('user_activities')
      .select('activity_type')
      .gte('created_at', startDate.toISOString());

    const activityBreakdown = userActivities?.reduce((acc: any, activity) => {
      acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
      return acc;
    }, {}) || {};

    const stats = {
      overview: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        blockedUsers: blockedUsers || 0,
        adminUsers: adminUsers || 0,
        premiumUsers: premiumUsers || 0,
        newUsers: newUsers || 0,
        totalComments: totalComments || 0,
        totalArticleLikes: totalArticleLikes || 0,
        totalNewsletterSubs: totalNewsletterSubs || 0
      },
      growth: growthData,
      topUsers: topUsers || [],
      activityBreakdown,
      period,
      generatedAt: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      success: true,
      data: stats
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error getting user stats:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};