// functions/api/auth/admin-signout.ts
import { supabase } from '../../../src/lib/supabase.js';

export async function onRequestPost(context: any) {
  const { request } = context;
  
  try {
    
    
    // Create response headers for clearing cookies
    const headers = new Headers({
      'Content-Type': 'application/json'
    });
    
    // Clear all auth cookies by setting them to expire
    const cookieOptions = 'Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict';
    
    headers.append('Set-Cookie', `sb-access-token=; ${cookieOptions}`);
    headers.append('Set-Cookie', `sb-refresh-token=; ${cookieOptions}`);
    headers.append('Set-Cookie', `user-is-admin=; ${cookieOptions}`);
    headers.append('Set-Cookie', `user-info=; ${cookieOptions}`);

    

    return new Response(JSON.stringify({
      success: true,
      message: 'Admin signed out successfully'
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Admin signout error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to sign out'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}