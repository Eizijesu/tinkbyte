// src/pages/api/auth/signout.ts - IMPROVED VERSION
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🔄 API: Processing signout request');
    
    // Get the session token from the request if available
    const authHeader = request.headers.get('authorization');
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('❌ API: Signout error:', error);
      // Even if there's an error, we'll still return success
      // because we want the client to clear local storage
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Signed out (with minor issues)' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ API: Signout successful');
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Signed out successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ API: Signout error:', error);
    // Still return success to ensure client clears storage
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Signed out (client-side)' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};