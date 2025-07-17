// src/pages/api/admin/users/action.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userId, action } = await request.json();
    
    // Validate required fields
    if (!userId || !action) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing userId or action' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate action
    if (!['block', 'unblock', 'delete', 'suspend', 'activate', 'view', 'edit'].includes(action)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid action' 
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
        error: 'Unauthorized - No token provided' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized - Invalid token' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Forbidden - Admin access required' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if target user exists
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('id, is_admin')
      .eq('id', userId)
      .single();

    if (targetUserError || !targetUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prevent admin from deleting other admins
    if (action === 'delete' && targetUser.is_admin) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Cannot delete admin users' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Perform user action
    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    let message = '';

    switch (action) {
      case 'block':
        updateData.is_blocked = true;
        updateData.blocked_until = null; // Indefinite block
        message = 'User blocked successfully';
        break;
        
      case 'unblock':
        updateData.is_blocked = false;
        updateData.blocked_until = null;
        message = 'User unblocked successfully';
        break;
        
      case 'suspend':
        updateData.is_blocked = true;
        // 30 day suspension
        updateData.blocked_until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        message = 'User suspended for 30 days';
        break;
        
      case 'activate':
        updateData.is_blocked = false;
        updateData.blocked_until = null;
        message = 'User activated successfully';
        break;
        
      case 'delete':
        // Soft delete in both users and profiles tables
        const { error: userDeleteError } = await supabase
          .from('users')
          .update({ status: 'deleted' })
          .eq('id', userId);
        
        if (userDeleteError) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to delete user: ${userDeleteError.message}` 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Also update profile
        updateData.is_blocked = true;
        message = 'User deleted successfully';
        break;
        
      case 'view':
        // Return user details for view action
        const { data: userDetails, error: detailsError } = await supabase
          .from('profiles')
          .select(`
            *,
            users!inner(email, created_at, last_login)
          `)
          .eq('id', userId)
          .single();

        if (detailsError) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to get user details: ${detailsError.message}` 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          data: userDetails,
          message: 'User details retrieved successfully'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      case 'edit':
        // For edit, just return success - actual editing would be handled by a separate endpoint
        return new Response(JSON.stringify({
          success: true,
          message: 'Edit mode activated'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
    }

    // Update profile for non-view/edit actions
    if (action !== 'view' && action !== 'edit') {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Failed to update user: ${updateError.message}` 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Log the action
    await supabase.from('user_activities').insert({
      user_id: userId,
      activity_type: `admin_${action}`,
      description: `User ${action}ed by admin`,
      metadata: {
        admin_id: user.id,
        admin_email: user.email,
        action,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error performing user action:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};