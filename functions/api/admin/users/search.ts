//functions/api/admin/users/search.ts
import { supabase } from '../../../../src/lib/supabase';

export const prerender = false;

export async function onRequestGet(context: any) {
  const { request } = context;
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Search query must be at least 2 characters' 
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

    // Search users
    const { data: users, error: searchError } = await supabase
      .from('profiles')
      .select(`
        id,
        display_name,
        bio,
        avatar_type,
        avatar_preset_id,
        avatar_url,
        is_admin,
        is_blocked,
        reputation_score,
        users!inner(email)
      `)
      .or(`display_name.ilike.%${query}%,bio.ilike.%${query}%,users.email.ilike.%${query}%`)
      .limit(limit);

    if (searchError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Search failed: ${searchError.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: users || [],
      query,
      total: users?.length || 0
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error searching users:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};