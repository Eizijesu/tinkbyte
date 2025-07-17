// src/pages/api/admin/verify-session.ts
import type { APIRoute } from 'astro';
import { supabase, db } from '../../../lib/supabase';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const accessToken = cookies.get('sb-access-token')?.value;
  
  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'No session found' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check admin status
    const { data: profile } = await db.profiles()
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.is_admin || user.user_metadata?.role === 'admin';

    return new Response(JSON.stringify({ 
      user: {
        id: user.id,
        email: user.email,
        isAdmin
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};