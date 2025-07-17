// src/pages/api/admin/users/update.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { id, ...updateData } = await request.json();
    
    if (!id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User ID is required' 
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
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized' 
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
        error: 'Forbidden' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prepare update data for profiles table
    const profileUpdateData: any = {
      updated_at: new Date().toISOString()
    };

    // Map allowed fields
    const allowedProfileFields = [
      'display_name', 'bio', 'bio_short', 'website', 'twitter_handle', 
      'linkedin_url', 'github_username', 'location', 'job_title', 
      'company', 'is_admin', 'is_blocked', 'blocked_until', 'membership_type'
    ];

    allowedProfileFields.forEach(field => {
      if (updateData[field] !== undefined) {
        profileUpdateData[field] = updateData[field];
      }
    });

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(profileUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to update user: ${updateError.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update users table if needed
    const userUpdateData: any = {};
    const allowedUserFields = ['membership_type', 'status'];

    allowedUserFields.forEach(field => {
      if (updateData[field] !== undefined) {
        userUpdateData[field] = updateData[field];
      }
    });

    if (Object.keys(userUpdateData).length > 0) {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update(userUpdateData)
        .eq('id', id);

      if (userUpdateError) {
        console.error('Error updating users table:', userUpdateError);
      }
    }

    // Log the action
    await supabase.from('user_activities').insert({
      user_id: id,
      activity_type: 'admin_user_update',
      description: `User profile updated by admin`,
      metadata: {
        admin_id: user.id,
        admin_email: user.email,
        updated_fields: Object.keys(profileUpdateData),
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: true,
      data: updatedProfile,
      message: 'User updated successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};