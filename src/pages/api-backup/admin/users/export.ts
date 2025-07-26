// src/pages/api/admin/users/export.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'csv'; // csv or json
    const includeEngagement = url.searchParams.get('engagement') === 'true';
    const includeActivities = url.searchParams.get('activities') === 'true';

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

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        *,
        users!inner(email, created_at, last_login, status, membership_type)
      `)
      .order('created_at', { ascending: false });

    if (usersError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to get users: ${usersError.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prepare export data
    const exportData = await Promise.all(
      (users || []).map(async (userProfile) => {
        const baseData = {
          id: userProfile.id,
          display_name: userProfile.display_name || '',
          email: userProfile.users?.email || '',
          bio: userProfile.bio || '',
          website: userProfile.website || '',
          twitter_handle: userProfile.twitter_handle || '',
          linkedin_url: userProfile.linkedin_url || '',
          github_username: userProfile.github_username || '',
          location: userProfile.location || '',
          job_title: userProfile.job_title || '',
          company: userProfile.company || '',
          membership_type: userProfile.membership_type || 'free',
          is_admin: userProfile.is_admin || false,
          is_blocked: userProfile.is_blocked || false,
          reputation_score: userProfile.reputation_score || 0,
          total_comments: userProfile.total_comments || 0,
          total_reads: userProfile.total_reads || 0,
          total_articles: userProfile.total_articles || 0,
          followers_count: userProfile.followers_count || 0,
          following_count: userProfile.following_count || 0,
          created_at: userProfile.created_at,
          updated_at: userProfile.updated_at,
          last_login: userProfile.users?.last_login || null,
          status: userProfile.users?.status || 'active'
        };

        // Add engagement data if requested
        if (includeEngagement) {
          const [
            { count: articleLikes },
            { count: articleSaves },
            { count: articleFollows },
            { count: authorFollows },
            { count: categoryFollows },
            { count: newsletterSubs }
          ] = await Promise.all([
            supabase.from("article_likes").select("*", { count: "exact", head: true }).eq("user_id", userProfile.id),
            supabase.from("article_saves").select("*", { count: "exact", head: true }).eq("user_id", userProfile.id),
            supabase.from("article_follows").select("*", { count: "exact", head: true }).eq("user_id", userProfile.id),
            supabase.from("author_follows").select("*", { count: "exact", head: true }).eq("user_id", userProfile.id),
            supabase.from("user_category_follows").select("*", { count: "exact", head: true }).eq("user_id", userProfile.id),
            supabase.from("newsletter_subscriptions").select("*", { count: "exact", head: true }).eq("user_id", userProfile.id)
          ]);

          Object.assign(baseData, {
            article_likes: articleLikes || 0,
            article_saves: articleSaves || 0,
            article_follows: articleFollows || 0,
            author_follows: authorFollows || 0,
            category_follows: categoryFollows || 0,
            newsletter_subscriptions: newsletterSubs || 0
          });
        }

        // Add recent activities if requested
        if (includeActivities) {
          const { data: activities } = await supabase
            .from('user_activities')
            .select('activity_type, created_at')
            .eq('user_id', userProfile.id)
            .order('created_at', { ascending: false })
            .limit(5);

          Object.assign(baseData, {
            recent_activities: activities?.map(a => `${a.activity_type}:${a.created_at}`).join(';') || ''
          });
        }

        return baseData;
      })
    );

    // Log the export
    await supabase.from('user_activities').insert({
      user_id: user.id,
      activity_type: 'admin_users_export',
      description: `Users exported by admin (${format.toUpperCase()})`,
      metadata: {
        admin_id: user.id,
        format,
        user_count: exportData.length,
        include_engagement: includeEngagement,
        include_activities: includeActivities,
        timestamp: new Date().toISOString()
      }
    });

    if (format === 'json') {
      return new Response(JSON.stringify({
        success: true,
        data: exportData,
        exported_at: new Date().toISOString(),
        total_users: exportData.length
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    }

    // Generate CSV
    if (exportData.length === 0) {
      return new Response('No users found', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting users:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};