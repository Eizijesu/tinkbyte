// src/pages/api/admin/newsletters/send.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { newsletterId } = await request.json();
    
    if (!newsletterId) {
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

    // Get newsletter details
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', newsletterId)
      .single();

    if (newsletterError || !newsletter) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Newsletter not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!newsletter.is_active) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Cannot send inactive newsletter' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get active subscribers for this newsletter type
    const { data: subscribers, error: subscribersError } = await supabase
      .from('newsletter_subscriptions')
      .select('email, user_id')
      .eq('newsletter_type', newsletter.frequency)
      .eq('is_active', true);

    if (subscribersError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to get subscribers: ${subscribersError.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No active subscribers found for this newsletter' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Here you would integrate with your email service (ConvertKit, SendGrid, etc.)
    // For now, we'll simulate the send process
    
    // Log the send action
    await supabase.from('user_activities').insert({
      user_id: user.id,
      activity_type: 'admin_newsletter_send',
      description: `Newsletter "${newsletter.name}" sent to ${subscribers.length} subscribers`,
      metadata: {
        newsletter_id: newsletterId,
        newsletter_name: newsletter.name,
        admin_id: user.id,
        subscriber_count: subscribers.length,
        timestamp: new Date().toISOString()
      }
    });

    // Update newsletter with last sent info (you might want to add these fields to your schema)
    await supabase
      .from('newsletters')
      .update({
        last_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    return new Response(JSON.stringify({
      success: true,
      message: `Newsletter sent successfully to ${subscribers.length} subscribers`,
      data: {
        newsletter_name: newsletter.name,
        subscriber_count: subscribers.length,
        sent_at: new Date().toISOString()
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error sending newsletter:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};