// functions/api/comments/report.ts - MISSING
import { supabase } from '../../../src/lib/supabase.js';

export async function onRequestPost(context: any) {
  const { request } = context;
  try {
    const body = await request.json();
    const { comment_id, reason, details } = body;
    
    if (!comment_id || !reason) {
      return new Response(JSON.stringify({ error: 'Comment ID and reason are required' }), {
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

    // Check if user already reported this comment
    const { data: existingReport } = await supabase
      .from('comment_reports')
      .select('id')
      .eq('comment_id', comment_id)
      .eq('user_id', user.id)
      .single();

    if (existingReport) {
      return new Response(JSON.stringify({ error: 'You have already reported this comment' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create report
    await supabase
      .from('comment_reports')
      .insert({
        comment_id,
        user_id: user.id,
        reason,
        details: details || null,
        status: 'pending'
      });

    // Flag comment for moderation if multiple reports
    const { data: reportCount } = await supabase
      .from('comment_reports')
      .select('id', { count: 'exact' })
      .eq('comment_id', comment_id);

    if ((reportCount?.length || 0) >= 3) {
      await supabase
        .from('comments')
        .update({ 
          moderation_status: 'flagged',
          moderation_reason: 'Multiple reports received'
        })
        .eq('id', comment_id);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Comment reported successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Report error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}