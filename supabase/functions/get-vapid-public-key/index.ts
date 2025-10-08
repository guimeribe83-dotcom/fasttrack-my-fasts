import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    
    if (!vapidPublicKey) {
      console.error('VAPID_PUBLIC_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'VAPID public key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Returning VAPID public key (length:', vapidPublicKey.length, ')');

    return new Response(
      JSON.stringify({ publicKey: vapidPublicKey }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get VAPID public key' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
