// functions/api/auth/admin-signin.ts
import { supabase } from '../../../src/lib/supabase.js';

interface LoginData {
  email: string;
  password: string;
}

export async function onRequestPost(context: any) {
  const { request } = context;
  
  try {
    const body = await request.json() as LoginData;
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

    // Set cookies using Headers
    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    const maxAge = 60 * 60 * 24 * 7; // 7 days
    
    // Set cookies
    headers.append('Set-Cookie', `sb-access-token=${data.session.access_token}; Path=/; Max-Age=${maxAge}; SameSite=lax`);
    headers.append('Set-Cookie', `user-is-admin=true; Path=/; Max-Age=${maxAge}; SameSite=lax`);
    headers.append('Set-Cookie', `user-info=${encodeURIComponent(JSON.stringify({
      id: data.user.id,
      email: data.user.email,
      isAdmin: true
    }))}; Path=/; Max-Age=${maxAge}; SameSite=lax`);

    console.log('✅ Cookies set successfully');

    // Return success
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        isAdmin: true
      },
      message: 'Admin signin successful',
      redirectUrl: '/admin/test-auth-fixed'
    }), {
      status: 200,
      headers
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
}