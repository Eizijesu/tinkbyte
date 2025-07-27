// functions/api/admin/categories/update.ts
import { supabase } from '../../../../src/lib/supabase.js';

interface UpdateCategoryData {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  target_audience?: string;
  color?: string;
  icon?: string;
  featured?: boolean;
  is_premium?: boolean;
}

export async function onRequestPost(context: any) {
  const { request } = context;
  
  try {
    const requestData = await request.json() as UpdateCategoryData;
    const { id, ...topicData } = requestData;
    
    // Check admin auth (same pattern as create)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update topic
    const { data: topic, error: updateError } = await supabase
      .from('categories')
      .update(topicData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: topic,
      message: 'Topic updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating topic:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}