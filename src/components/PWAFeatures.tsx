import { useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useBackgroundSync } from "@/hooks/useBackgroundSync";
import { usePeriodicSync } from "@/hooks/usePeriodicSync";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

export const PWAFeatures = () => {
  const { isSupported: pushSupported, requestPermission: requestPushPermission } = usePushNotifications();
  const { isSupported: syncSupported, registerSync } = useBackgroundSync();
  const { isSupported: periodicSupported, register: registerPeriodicSync } = usePeriodicSync();
  const { processQueue } = useOfflineQueue();

  useEffect(() => {
    // Initialize PWA features silently in the background
    const initializeFeatures = async () => {
      // Request push notification permission if supported
      if (pushSupported) {
        await requestPushPermission();
      }

      // Register periodic sync for checking updates every 24 hours
      if (periodicSupported) {
        await registerPeriodicSync('check-updates', 24 * 60 * 60 * 1000); // 24 hours
      }

      // Register background sync for offline queue
      if (syncSupported && registerSync) {
        // @ts-ignore - sync not in TS types
        await registerSync('sync-fasts');
      }

      // Try processing queue on startup if online
      if (navigator.onLine) {
        await processQueue();
      }

      // Listen for SW messages to process queue
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event: any) => {
          if (event.data?.type === 'PROCESS_OFFLINE_QUEUE') {
            processQueue();
          }
        });
      }
    };

    initializeFeatures();

    const handleOnline = () => processQueue();
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [pushSupported, periodicSupported, syncSupported, requestPushPermission, registerPeriodicSync, registerSync, processQueue]);

  // This component doesn't render anything
  return null;
};
