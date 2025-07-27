//functions/api/admin/users/index.ts;
import { supabase } from '../../../../src/lib/supabase';

export const prerender = false;

export async function onRequestGet(context: any) {
  const { request } = context;
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const membership = url.searchParams.get('membership') || '';
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

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

    // Build query
    let query = supabase
      .from('profiles')
      .select(`
        *,
        users!inner(email, created_at, last_login, status, membership_type)
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,users.email.ilike.%${search}%`);
    }

    if (status) {
      if (status === 'active') {
        query = query.eq('is_blocked', false);
      } else if (status === 'blocked') {
        query = query.eq('is_blocked', true);
      } else if (status === 'admin') {
        query = query.eq('is_admin', true);
      }
    }

    if (membership) {
      query = query.eq('membership_type', membership);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: users, error: usersError, count } = await query;

    if (usersError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to get users: ${usersError.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get engagement data for each user
    const usersWithEngagement = await Promise.all(
      (users || []).map(async (userProfile) => {
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

        return {
          ...userProfile,
          engagement: {
            articleLikes: articleLikes || 0,
            articleSaves: articleSaves || 0,
            articleFollows: articleFollows || 0,
            authorFollows: authorFollows || 0,
            categoryFollows: categoryFollows || 0,
            newsletterSubscriptions: newsletterSubs || 0
          }
        };
      })
    );

    const totalPages = Math.ceil((count || 0) / limit);

    return new Response(JSON.stringify({
      success: true,
      data: usersWithEngagement,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error getting users:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};