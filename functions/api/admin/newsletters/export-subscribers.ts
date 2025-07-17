// functions/api/admin/newsletters/export-subscribers.ts
import { supabase } from '../../../../src/lib/supabase';

export const prerender = false;

export async function onRequestGet(context: any) {
  const { request } = context;
  
  try {
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

    // Get all newsletter subscriptions with user details
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('newsletter_subscriptions')
      .select(`
        *,
        users:user_id(
          id,
          profiles(display_name, created_at)
        )
      `)
      .order('subscribed_at', { ascending: false });

    if (subscriptionsError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to get subscriptions: ${subscriptionsError.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Format data for CSV
    const csvData = subscriptions?.map(sub => ({
      email: sub.email,
      name: sub.users?.profiles?.display_name || 'Unknown',
      newsletter_type: sub.newsletter_type,
      is_active: sub.is_active ? 'Active' : 'Inactive',
      subscribed_date: new Date(sub.subscribed_at).toLocaleDateString(),
      unsubscribed_date: sub.unsubscribed_at ? new Date(sub.unsubscribed_at).toLocaleDateString() : '',
      convertkit_id: sub.convertkit_subscriber_id || '',
      user_id: sub.user_id || 'Guest'
    })) || [];

    // Generate CSV content
    const headers = ['Email', 'Name', 'Newsletter Type', 'Status', 'Subscribed Date', 'Unsubscribed Date', 'ConvertKit ID', 'User ID'];
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => [
        `"${row.email}"`,
        `"${row.name}"`,
        `"${row.newsletter_type}"`,
        `"${row.is_active}"`,
        `"${row.subscribed_date}"`,
        `"${row.unsubscribed_date}"`,
        `"${row.convertkit_id}"`,
        `"${row.user_id}"`
      ].join(','))
    ].join('\n');

    // Log the export action
    await supabase.from('user_activities').insert({
      user_id: user.id,
      activity_type: 'admin_subscribers_export',
      description: `Newsletter subscribers exported by admin`,
      metadata: {
        admin_id: user.id,
        subscriber_count: csvData.length,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting subscribers:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};