//functions/api/admin/newsletters/toggle-status.ts
import { supabase } from '../../../../src/lib/supabase';

export const prerender = false;

export async function onRequestPost(context: any) {
  const { request } = context;
  try {
    const { newsletterId, isActive } = await request.json();
    
    if (!newsletterId || typeof isActive !== 'boolean') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Newsletter ID and isActive status are required' 
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

    // Update newsletter status
    const { data: updatedNewsletter, error: updateError } = await supabase
      .from('newsletters')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', newsletterId)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to update newsletter status: ${updateError.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log the action
    await supabase.from('user_activities').insert({
      user_id: user.id,
      activity_type: `admin_newsletter_${isActive ? 'activate' : 'deactivate'}`,
      description: `Newsletter "${updatedNewsletter.name}" ${isActive ? 'activated' : 'deactivated'} by admin`,
      metadata: {
        newsletter_id: newsletterId,
        newsletter_name: updatedNewsletter.name,
        admin_id: user.id,
        new_status: isActive,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: true,
      data: updatedNewsletter,
      message: `Newsletter ${isActive ? 'activated' : 'deactivated'} successfully`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error toggling newsletter status:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};