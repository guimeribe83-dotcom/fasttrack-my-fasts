import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await subscribeToPush();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let sub = await registration.pushManager.getSubscription();
      
      if (!sub) {
        // Get VAPID public key from edge function or use default
        const vapidPublicKey = 'BNxzKzgN9C0QZQxzCQxzCQxzCQxzCQxzCQxzCQxzCQxzCQxzCQxzCQxzCQxzCQxzCQxzCQxzCQxzCQxzCQxzCQxzCQxzCQ';
        
        try {
          const appServerKey = urlBase64ToUint8Array(vapidPublicKey);
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: appServerKey as any
          });

          // Save subscription to database
          const { data: { user } } = await supabase.auth.getUser();
          if (user && sub) {
            await saveSubscription(sub, user.id);
          }
        } catch (e) {
          console.error('Push subscription failed:', e);
          toast({
            title: "Erro ao configurar notificações",
            description: "Não foi possível configurar notificações push.",
            variant: "destructive"
          });
          return;
        }
      }
      
      setSubscription(sub);
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  };

  const saveSubscription = async (sub: PushSubscription, userId: string) => {
    try {
      const subscriptionData = sub.toJSON();
      
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: userId,
          subscription: subscriptionData as any,
          device_type: 'web'
        });

      if (error) {
        console.error('Error saving subscription:', error);
      } else {
        console.log('Subscription saved successfully');
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const unsubscribe = async () => {
    if (subscription) {
      try {
        // Remove from database first
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const endpoint = subscription.endpoint;
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('subscription->>endpoint', endpoint);
        }

        await subscription.unsubscribe();
        setSubscription(null);
        
        toast({
          title: "Notificações desativadas",
          description: "Você não receberá mais notificações push."
        });
      } catch (error) {
        console.error('Error unsubscribing from push:', error);
      }
    }
  };

  const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  return {
    permission,
    subscription,
    requestPermission,
    unsubscribe,
    isSupported
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
