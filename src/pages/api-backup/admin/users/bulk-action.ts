// src/pages/api/admin/users/bulk-action.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userIds, action } = await request.json();
    
    // Validate input
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid or empty user IDs array' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['block', 'unblock', 'delete', 'suspend', 'activate'].includes(action)) {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Forbidden - Admin access required' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if any target users are admins (for delete action)
    if (action === 'delete') {
      const { data: adminUsers } = await supabase
        .from('profiles')
        .select('id')
        .in('id', userIds)
        .eq('is_admin', true);

      if (adminUsers && adminUsers.length > 0) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Cannot delete admin users' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Perform bulk action
    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    let message = '';

    switch (action) {
      case 'block':
        updateData.is_blocked = true;
        updateData.blocked_until = null;
        message = `${userIds.length} users blocked successfully`;
        break;
        
      case 'unblock':
        updateData.is_blocked = false;
        updateData.blocked_until = null;
        message = `${userIds.length} users unblocked successfully`;
        break;
        
      case 'suspend':
        updateData.is_blocked = true;
        updateData.blocked_until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        message = `${userIds.length} users suspended for 30 days`;
        break;
        
      case 'activate':
        updateData.is_blocked = false;
        updateData.blocked_until = null;
        message = `${userIds.length} users activated successfully`;
        break;
        
      case 'delete':
        // Bulk soft delete in users table
        const { error: bulkDeleteError } = await supabase
          .from('users')
          .update({ status: 'deleted' })
          .in('id', userIds);
        
        if (bulkDeleteError) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to delete users: ${bulkDeleteError.message}` 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Also block in profiles
        updateData.is_blocked = true;
        message = `${userIds.length} users deleted successfully`;
        break;
    }

    // Update profiles for all actions
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .in('id', userIds);

    if (updateError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to update users: ${updateError.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log bulk action for each user
    const activities = userIds.map(userId => ({
      user_id: userId,
      activity_type: `admin_bulk_${action}`,
      description: `User ${action}ed by admin (bulk operation)`,
      metadata: {
        admin_id: user.id,
        admin_email: user.email,
        action,
        bulk_operation: true,
        total_users: userIds.length,
        timestamp: new Date().toISOString()
      }
    }));

    await supabase.from('user_activities').insert(activities);

    return new Response(JSON.stringify({
      success: true,
      message
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error performing bulk user action:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};