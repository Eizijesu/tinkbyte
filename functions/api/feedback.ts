// functions/api/feedback.ts
import { supabase } from '../../src/lib/supabase.js';

interface FeedbackData {
  type: string;
  message: string;
  user_id?: string;
  metadata?: any;
}

export async function onRequestPost(context: any) {
  const { request } = context;
  
  try {
    const body = await request.json() as FeedbackData;
    const { type, message, user_id, metadata } = body;
    
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        type,
        message,
        user_id,
        metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Feedback error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      data,
      success: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Feedback error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestGet(context: any) {
  return new Response(JSON.stringify({ 
    message: 'Feedback endpoint is working',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}