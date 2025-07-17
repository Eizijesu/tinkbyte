// src/pages/api/auth/admin-signin.ts 
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase.js';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

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
      console.error('❌ Supabase auth error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!data.user || !data.session) {
      console.error('❌ No user or session returned');
      return new Response(JSON.stringify({
        success: false,
        error: 'No user or session returned'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Auth successful, user:', data.user.email);

    // Check admin status
    const isAdmin = data.user.email === 'tinkbytehq@gmail.com';
    
    if (!isAdmin) {
      console.log('❌ User is not an admin:', data.user.email);
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied. Admin privileges required.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Admin verification successful');

    // IMPORTANT: Clear existing cookies first
    console.log('🧹 Clearing existing cookies...');
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('user-is-admin', { path: '/' });
    cookies.delete('user-info', { path: '/' });

    // Set cookies with explicit configuration
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    
    console.log('🍪 Setting new cookies...');

    // Set cookies with very explicit configuration
    cookies.set('sb-access-token', data.session.access_token, {
      path: '/',
      maxAge,
      httpOnly: false,
      secure: false, // FALSE for localhost
      sameSite: 'lax'
    });

    cookies.set('user-is-admin', 'true', {
      path: '/',
      maxAge,
      httpOnly: false,
      secure: false, // FALSE for localhost
      sameSite: 'lax'
    });

    cookies.set('user-info', JSON.stringify({
      id: data.user.id,
      email: data.user.email,
      isAdmin: true
    }), {
      path: '/',
      maxAge,
      httpOnly: false,
      secure: false, // FALSE for localhost
      sameSite: 'lax'
    });

    console.log('✅ Cookies set with configuration:', {
      maxAge,
      secure: false,
      sameSite: 'lax',
      httpOnly: false
    });

    // Return success WITHOUT redirect - let client handle it
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        isAdmin: true
      },
      message: 'Admin signin successful',
      redirectUrl: '/admin/test-auth-fixed' // Tell client where to go
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
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