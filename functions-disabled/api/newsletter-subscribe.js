// functions/api/newsletter-subscribe.js
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const requestData = await request.json();
    const { email, tags, preferences } = requestData;
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Please provide a valid email address' 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    // Check for required environment variables
    if (!env.CONVERTKIT_API_KEY || !env.PUBLIC_CONVERTKIT_FORM_ID) {
      console.error('Missing ConvertKit configuration');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Newsletter service not configured' 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Prepare ConvertKit subscription data
    const convertkitData = {
      api_key: env.CONVERTKIT_API_KEY,
      email: email,
      tags: tags || [],
      fields: preferences ? {
        newsletter_preferences: (preferences.newsletters || []).join(','),
        additional_preferences: (preferences.additional || []).join(','),
        signup_date: preferences.signup_date || new Date().toISOString(),
        signup_source: preferences.source || 'website',
        tinkbyte_weekly: (preferences.newsletters || []).includes('Tinkbyte Weekly') ? 'yes' : 'no',
        build_sheet: (preferences.newsletters || []).includes('Build Sheet') ? 'yes' : 'no',
        stackdown: (preferences.newsletters || []).includes('Stackdown') ? 'yes' : 'no',
        signal_drop: (preferences.newsletters || []).includes('Signal Drop') ? 'yes' : 'no',
        system_signal: (preferences.newsletters || []).includes('System Signal') ? 'yes' : 'no',
        the_real_build: (preferences.newsletters || []).includes('The Real Build') ? 'yes' : 'no',
        the_loop: (preferences.newsletters || []).includes('The Loop') ? 'yes' : 'no',
        data_slice: (preferences.newsletters || []).includes('Data Slice') ? 'yes' : 'no',
        the_mirror: (preferences.newsletters || []).includes('The Mirror') ? 'yes' : 'no',
        community_code: (preferences.newsletters || []).includes('Community Code') ? 'yes' : 'no',
        start_here_future_tech: (preferences.newsletters || []).includes('Start Here: Future Tech') ? 'yes' : 'no'
      } : {}
    };
    
    
    
    // Subscribe to ConvertKit
    const convertkitResponse = await fetch(
      `https://api.convertkit.com/v3/forms/${env.PUBLIC_CONVERTKIT_FORM_ID}/subscribe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(convertkitData)
      }
    );
    
    if (!convertkitResponse.ok) {
      const errorData = await convertkitResponse.text();
      console.error('ConvertKit error:', errorData);
      throw new Error('Failed to subscribe to newsletter');
    }
    
    const result = await convertkitResponse.json();
    
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Successfully subscribed!',
      subscriber_id: result.subscription?.subscriber?.id 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Subscription failed. Please try again.' 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}