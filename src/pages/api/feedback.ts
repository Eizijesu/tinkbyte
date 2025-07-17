// src/pages/api/feedback.ts

import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
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
};

export const GET: APIRoute = async () => {
    return new Response(JSON.stringify({ 
        message: 'Feedback endpoint is working',
        timestamp: new Date().toISOString()
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
};