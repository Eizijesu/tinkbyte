// src/pages/api/admin/newsletters/subscriber-action.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { subscriptionId, action } = await request.json();
    
    if (!subscriptionId || !action) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Subscription ID and action are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['unsubscribe', 'resubscribe', 'delete'].includes(action)) {
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

    // Get subscription details
    const { data: subscription, error: subscriptionError } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subscriptionError || !subscription) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Subscription not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let message = '';
    let updateData: any = {};

    switch (action) {
      case 'unsubscribe':
        updateData = {
          is_active: false,
          unsubscribed_at: new Date().toISOString()
        };
        message = 'Subscriber unsubscribed successfully';
        break;
        
      case 'resubscribe':
        updateData = {
          is_active: true,
          unsubscribed_at: null
        };
        message = 'Subscriber resubscribed successfully';
        break;
        
      case 'delete':
        // Hard delete the subscription
        const { error: deleteError } = await supabase
          .from('newsletter_subscriptions')
          .delete()
          .eq('id', subscriptionId);

        if (deleteError) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to delete subscription: ${deleteError.message}` 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Log the action
        await supabase.from('user_activities').insert({
          user_id: user.id,
          activity_type: 'admin_subscription_delete',
          description: `Newsletter subscription deleted by admin`,
          metadata: {
            subscription_id: subscriptionId,
            subscriber_email: subscription.email,
            admin_id: user.id,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(JSON.stringify({
          success: true,
          message: 'Subscription deleted successfully'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
    }

    // Update subscription for unsubscribe/resubscribe
    const { error: updateError } = await supabase
      .from('newsletter_subscriptions')
      .update(updateData)
      .eq('id', subscriptionId);

    if (updateError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to update subscription: ${updateError.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log the action
    await supabase.from('user_activities').insert({
      user_id: user.id,
      activity_type: `admin_subscription_${action}`,
      description: `Newsletter subscription ${action}d by admin`,
      metadata: {
        subscription_id: subscriptionId,
        subscriber_email: subscription.email,
        admin_id: user.id,
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
    console.error('Error performing subscriber action:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};