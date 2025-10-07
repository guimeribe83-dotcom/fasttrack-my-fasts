import { useState, useEffect } from 'react';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

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
        // Subscribe to push notifications
        // Note: You'll need to generate VAPID keys for production
        // For now, this creates a subscription without keys (for demonstration)
        const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY_HERE';
        
        try {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidPublicKey
          });
        } catch (e) {
          console.log('Push subscription failed (VAPID key needed for production):', e);
          // Still set the subscription state even if VAPID fails
        }
      }
      
      setSubscription(sub);
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  };

  const unsubscribe = async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe();
        setSubscription(null);
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
