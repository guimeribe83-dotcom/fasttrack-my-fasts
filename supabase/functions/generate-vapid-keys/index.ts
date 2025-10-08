import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Generate VAPID keys using Web Crypto API
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    );

    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    // Convert to URL-safe base64
    const publicKey = urlBase64Encode(publicKeyJwk);
    const privateKey = urlBase64Encode(privateKeyJwk);

    console.log('Generated VAPID keys successfully');

    return new Response(
      JSON.stringify({
        publicKey,
        privateKey,
        message: 'Store these keys as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY secrets in Supabase'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating VAPID keys:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function urlBase64Encode(jwk: JsonWebKey): string {
  const json = JSON.stringify(jwk);
  const uint8Array = new TextEncoder().encode(json);
  const base64 = btoa(String.fromCharCode(...uint8Array));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
