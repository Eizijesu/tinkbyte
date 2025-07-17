// src/pages/api/admin/newsletters/create.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const newsletterData = await request.json();
    
    // Validate required fields
    if (!newsletterData.name || !newsletterData.slug) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Name and slug are required' 
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

    // Check if slug already exists
    const { data: existingNewsletter } = await supabase
      .from('newsletters')
      .select('id')
      .eq('slug', newsletterData.slug)
      .single();

    if (existingNewsletter) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Newsletter with this slug already exists' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create newsletter
    const { data: newNewsletter, error: createError } = await supabase
      .from('newsletters')
      .insert({
        name: newsletterData.name,
        slug: newsletterData.slug,
        description: newsletterData.description || null,
        frequency: newsletterData.frequency || 'weekly',
        day_of_week: newsletterData.day_of_week || null,
        image_url: newsletterData.image_url || null,
        is_active: newsletterData.is_active || true,
        sort_order: newsletterData.sort_order || 0,
        subscriber_count: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to create newsletter: ${createError.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log the action
    await supabase.from('user_activities').insert({
      user_id: user.id,
      activity_type: 'admin_newsletter_create',
      description: `Newsletter "${newsletterData.name}" created by admin`,
      metadata: {
        newsletter_id: newNewsletter.id,
        newsletter_name: newsletterData.name,
        admin_id: user.id,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: true,
      data: newNewsletter,
      message: 'Newsletter created successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating newsletter:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};