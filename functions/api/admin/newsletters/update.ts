// functions/api/admin/newsletters/update.ts
import { supabase } from '../../../../src/lib/supabase.js';

export const prerender = false;

export async function onRequestGet(context: any) {
  const { request } = context;
  try {
    const { id, ...updateData } = await request.json();
    
    if (!id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Newsletter ID is required' 
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

    // Check if newsletter exists
    const { data: existingNewsletter } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingNewsletter) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Newsletter not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if slug is being changed and if it conflicts
    if (updateData.slug && updateData.slug !== existingNewsletter.slug) {
      const { data: conflictingNewsletter } = await supabase
        .from('newsletters')
        .select('id')
        .eq('slug', updateData.slug)
        .neq('id', id)
        .single();

      if (conflictingNewsletter) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Newsletter with this slug already exists' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Update newsletter
    const { data: updatedNewsletter, error: updateError } = await supabase
      .from('newsletters')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to update newsletter: ${updateError.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log the action
    await supabase.from('user_activities').insert({
      user_id: user.id,
      activity_type: 'admin_newsletter_update',
      description: `Newsletter "${updatedNewsletter.name}" updated by admin`,
      metadata: {
        newsletter_id: id,
        newsletter_name: updatedNewsletter.name,
        admin_id: user.id,
        changes: updateData,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: true,
      data: updatedNewsletter,
      message: 'Newsletter updated successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating newsletter:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};