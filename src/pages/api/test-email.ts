// src/pages/api/test-email.ts - FIXED
import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🧪 API endpoint called');
    console.log('🧪 Request content-type:', request.headers.get('content-type'));
    
    let email: string;
    
    // Handle different content types
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      try {
        const body = await request.json();
        console.log('🧪 JSON body:', body);
        email = body.email;
      } catch (jsonError) {
        console.error('❌ JSON parse error:', jsonError);
        return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Fallback to text parsing
      try {
        const bodyText = await request.text();
        console.log('🧪 Raw body text:', bodyText);
        
        if (bodyText.startsWith('{')) {
          const body = JSON.parse(bodyText);
          email = body.email;
        } else {
          // Handle form data
          const params = new URLSearchParams(bodyText);
          email = params.get('email') || '';
        }
      } catch (parseError) {
        console.error('❌ Body parse error:', parseError);
        return new Response(JSON.stringify({ error: 'Could not parse request body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    console.log('🧪 Extracted email:', email);
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const apiKey = import.meta.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('❌ No API key found');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('🧪 API key exists:', !!apiKey);
    console.log('🧪 Creating Resend instance...');
    
    const resend = new Resend(apiKey);
    
    console.log('🧪 Sending email...');
    const { data, error } = await resend.emails.send({
      from: 'notify@notify.tinkbyte.com',
      to: email,
      subject: 'API Test - TinkByte',
      html: `
        <h1>API Test Success!</h1>
        <p>This email was sent via API endpoint.</p>
        <p>Sent to: ${email}</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
      text: `API Test Success! Sent to: ${email} - Time: ${new Date().toISOString()}`
    });
    
    if (error) {
      console.error('❌ Resend error:', error);
      return new Response(JSON.stringify({ error: error.message, details: error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ Email sent via API:', data);
    
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ API error:', error);
    return new Response(JSON.stringify({ 
      error: error.message, 
      stack: error.stack,
      type: error.constructor.name 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};