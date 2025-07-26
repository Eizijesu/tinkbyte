import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { article_id, content, draft_key } = body;
    
    if (!article_id) {
      return new Response(JSON.stringify({ error: 'Article ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    
    // Verify the user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const draftKeyToUse = draft_key || `${user.id}_${article_id}`;

    // Check if draft exists
    const { data: existingDraft } = await supabase
      .from('comment_drafts')
      .select('id')
      .eq('user_id', user.id)
      .eq('article_id', article_id)
      .eq('draft_key', draftKeyToUse)
      .single();

    if (existingDraft) {
      // Update existing draft
      const { data: updatedDraft, error: updateError } = await supabase
        .from('comment_drafts')
        .update({
          content: content || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDraft.id)
        .select()
        .single();

      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to update draft' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        data: updatedDraft 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Create new draft
      const { data: newDraft, error: createError } = await supabase
        .from('comment_drafts')
        .insert({
          user_id: user.id,
          article_id,
          content: content || '',
          draft_key: draftKeyToUse
        })
        .select()
        .single();

      if (createError) {
        return new Response(JSON.stringify({ error: 'Failed to create draft' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        data: newDraft 
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Draft API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const articleId = url.searchParams.get('article_id');
    const draftKey = url.searchParams.get('draft_key');
    
    if (!articleId) {
      return new Response(JSON.stringify({ error: 'Article ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get authorization header
    const authHeader = url.searchParams.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    
    // Verify the user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const draftKeyToUse = draftKey || `${user.id}_${articleId}`;

    const { data: draft, error } = await supabase
      .from('comment_drafts')
      .select('*')
      .eq('user_id', user.id)
      .eq('article_id', articleId)
      .eq('draft_key', draftKeyToUse)
      .single();

    if (error && error.code !== 'PGRST116') {
      return new Response(JSON.stringify({ error: 'Failed to fetch draft' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: draft || null 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get draft error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};