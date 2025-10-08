import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  userId?: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { userId, title, body, icon, badge, url, data } = await req.json() as PushNotificationRequest;
    
    const targetUserId = userId || user.id;

    console.log(`Sending push notification to user ${targetUserId}:`, { title, body });

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId);

    if (subError) {
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for user');
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icon-512x512.png',
      badge: badge || '/icon-512x512.png',
      url: url || '/',
      data: data || {},
      timestamp: Date.now(),
    });

    let successCount = 0;
    let failedCount = 0;
    const failedSubscriptions: string[] = [];

    // Send to all subscriptions
    for (const sub of subscriptions) {
      try {
        const subscription = sub.subscription as any;
        
        // Use web-push-deno library
        const webPush = await import('https://deno.land/x/web_push@0.0.7/mod.ts');
        
        await webPush.sendNotification({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          },
          payload,
          options: {
            vapidDetails: {
              subject: 'mailto:notifications@fasttrack.com',
              publicKey: vapidPublicKey,
              privateKey: vapidPrivateKey,
            },
            TTL: 86400, // 24 hours
          },
        });

        successCount++;
        console.log('Push sent successfully to subscription:', subscription.endpoint);
      } catch (error: any) {
        failedCount++;
        console.error('Failed to send push:', error.message);
        
        // If subscription is invalid/expired (410), mark for deletion
        if (error.statusCode === 410 || error.statusCode === 404) {
          failedSubscriptions.push(sub.id);
        }
      }
    }

    // Delete failed subscriptions
    if (failedSubscriptions.length > 0) {
      await supabaseClient
        .from('push_subscriptions')
        .delete()
        .in('id', failedSubscriptions);
      
      console.log(`Deleted ${failedSubscriptions.length} expired subscriptions`);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Push notifications sent', 
        sent: successCount,
        failed: failedCount,
        deletedExpired: failedSubscriptions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
