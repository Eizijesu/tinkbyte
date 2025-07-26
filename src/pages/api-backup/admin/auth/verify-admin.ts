// src/pages/api/auth/verify-admin.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase'; 

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🔐 Admin signin API called');
    
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Email and password are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔐 Attempting signin for:', email);
    
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Supabase signin error:', error);
      return new Response(JSON.stringify({ 
        success: false,
        error: error.message || 'Invalid credentials' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!data.user || !data.session) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No user or session returned' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Signin successful for:', data.user.email);

    // Check admin status
    let isAdmin = false;

    // Method 1: Check user metadata
    if (data.user.user_metadata?.role === 'admin') {
      isAdmin = true;
    }

    // Method 2: Check profiles table
    if (!isAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single();

      isAdmin = profile?.is_admin === true;
    }

    // Method 3: Hardcoded admin emails
    const adminEmails = ['tinkbytehq@gmail.com'];
    if (!isAdmin && data.user.email && adminEmails.includes(data.user.email.toLowerCase())) {
      isAdmin = true;
    }

    if (!isAdmin) {
      console.log('❌ User is not an admin');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Access denied. Admin privileges required.' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Admin verification successful');

    // Set cookies
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const cookieOptions = `path=/; max-age=${maxAge}; samesite=lax; secure=${process.env.NODE_ENV === 'production'}`;

    return new Response(JSON.stringify({ 
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        isAdmin: true
      },
      message: 'Admin signin successful'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': [
          `sb-access-token=${data.session.access_token}; ${cookieOptions}`,
          `sb-refresh-token=${data.session.refresh_token}; ${cookieOptions}`
        ]
      }
    });

  } catch (error: any) {
    console.error('❌ Admin signin error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Server error during signin' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};