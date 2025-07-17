// src/pages/api/auth/admin-signout.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  try {
    console.log("🚪 Admin API signout initiated");
    
    // Clear all auth cookies
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    cookies.delete('user-is-admin', { path: '/' });
    cookies.delete('user-info', { path: '/' });

    console.log("🧹 Admin cookies cleared via API");

    return new Response(JSON.stringify({
      success: true,
      message: 'Admin signed out successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
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
};