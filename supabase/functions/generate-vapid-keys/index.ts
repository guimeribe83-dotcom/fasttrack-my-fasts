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

    // Extract VAPID keys from JWK format
    const publicKey = getPublicKeyFromJwk(publicKeyJwk);
    const privateKey = getPrivateKeyFromJwk(privateKeyJwk);

    console.log('Generated VAPID keys successfully');
    console.log('Public key length:', publicKey.length);
    console.log('Private key length:', privateKey.length);

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

// Função auxiliar para converter base64url para Uint8Array
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Função auxiliar para converter Uint8Array para base64url
function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Extrai a chave pública VAPID do JWK (formato uncompressed: 0x04 || x || y)
function getPublicKeyFromJwk(jwk: JsonWebKey): string {
  if (!jwk.x || !jwk.y) {
    throw new Error('Invalid public key JWK: missing x or y coordinates');
  }
  
  // Converter x e y de base64url para Uint8Array
  const x = base64UrlToUint8Array(jwk.x);
  const y = base64UrlToUint8Array(jwk.y);
  
  // Criar chave pública no formato uncompressed (0x04 + x + y)
  const publicKey = new Uint8Array(65);
  publicKey[0] = 0x04; // Uncompressed point indicator
  publicKey.set(x, 1);
  publicKey.set(y, 33);
  
  // Converter para base64url
  return uint8ArrayToBase64Url(publicKey);
}

// Extrai a chave privada VAPID do JWK (campo 'd')
function getPrivateKeyFromJwk(jwk: JsonWebKey): string {
  if (!jwk.d) {
    throw new Error('Invalid private key JWK: missing d parameter');
  }
  
  // O campo 'd' já está em base64url, apenas retornar
  return jwk.d;
}
