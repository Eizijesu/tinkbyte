//functions/api/admin/users/[id].ts
import { supabase } from '../../../../src/lib/supabase';

export const prerender = false;

export async function onRequestGet(context: any) {
  const { request, params } = context;
  
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    // Get user details
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select(`
        *,
        users!inner(email, created_at, last_login, status, membership_type)
      `)
      .eq('id', id)
      .single();

    if (userError || !userProfile) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get comprehensive user data
    const [
      { data: comments },
      { data: articleLikes },
      { data: articleSaves },
      { data: articleFollows },
      { data: authorFollows },
      { data: categoryFollows },
      { data: newsletterSubs },
      { data: userFollows },
      { data: userActivities }
    ] = await Promise.all([
      supabase.from("comments").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(10),
      supabase.from("article_likes").select("*, articles(title, slug)").eq("user_id", id).limit(10),
      supabase.from("article_saves").select("*, articles(title, slug)").eq("user_id", id).limit(10),
      supabase.from("article_follows").select("*, articles(title, slug)").eq("user_id", id).limit(10),
      supabase.from("author_follows").select("*, authors(name, slug)").eq("user_id", id).limit(10),
      supabase.from("user_category_follows").select("*, categories(name, slug)").eq("user_id", id).limit(10),
      supabase.from("newsletter_subscriptions").select("*").eq("user_id", id),
      supabase.from("user_follows").select("*, profiles!following_id(display_name)").eq("follower_id", id).limit(10),
      supabase.from("user_activities").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(20)
    ]);

    const userDetails = {
      ...userProfile,
      engagement: {
        comments: comments || [],
        articleLikes: articleLikes || [],
        articleSaves: articleSaves || [],
        articleFollows: articleFollows || [],
        authorFollows: authorFollows || [],
        categoryFollows: categoryFollows || [],
        newsletterSubscriptions: newsletterSubs || [],
        userFollows: userFollows || [],
        recentActivities: userActivities || []
      },
      stats: {
        totalComments: comments?.length || 0,
        totalArticleLikes: articleLikes?.length || 0,
        totalArticleSaves: articleSaves?.length || 0,
        totalArticleFollows: articleFollows?.length || 0,
        totalAuthorFollows: authorFollows?.length || 0,
        totalCategoryFollows: categoryFollows?.length || 0,
        totalNewsletterSubs: newsletterSubs?.length || 0,
        totalUserFollows: userFollows?.length || 0
      }
    };

    return new Response(JSON.stringify({
      success: true,
      data: userDetails
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error getting user details:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};