// src/pages/api/auth/session.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const authHeader = request.headers.get('authorization');
    let session: { user: any } | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        session = { user };
      }
    }

    if (!session) {
      // Try to get session directly from Supabase
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        session = currentSession;
      }
    }

    return new Response(JSON.stringify({ 
      user: session?.user || null,
      authenticated: !!session?.user 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Session API error:', error);
    return new Response(JSON.stringify({ 
      user: null, 
      authenticated: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};