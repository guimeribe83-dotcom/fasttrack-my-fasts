import { useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSyncEngine } from "@/hooks/useSyncEngine";

export const PWAFeatures = () => {
  const { isSupported: pushSupported, requestPermission: requestPushPermission } = usePushNotifications();
  const { sync } = useSyncEngine();

  useEffect(() => {
    // Initialize PWA features silently in the background
    const initializeFeatures = async () => {
      // Request push notification permission if supported
      if (pushSupported) {
        await requestPushPermission();
      }

      // Try initial sync on startup if online
      if (navigator.onLine) {
        await sync();
      }

      // Listen for SW messages to sync
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event: any) => {
          if (event.data?.type === 'PROCESS_OFFLINE_QUEUE' || event.data?.type === 'SYNC_REQUESTED') {
            sync();
          }
        });
      }
    };

    initializeFeatures();

    const handleOnline = () => sync();
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [pushSupported, requestPushPermission, sync]);

  // This component doesn't render anything
  return null;
};
