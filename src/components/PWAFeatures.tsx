import { useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useBackgroundSync } from "@/hooks/useBackgroundSync";
import { usePeriodicSync } from "@/hooks/usePeriodicSync";

export const PWAFeatures = () => {
  const { isSupported: pushSupported, requestPermission: requestPushPermission } = usePushNotifications();
  const { isSupported: syncSupported } = useBackgroundSync();
  const { isSupported: periodicSupported, register: registerPeriodicSync } = usePeriodicSync();

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
    };

    initializeFeatures();
  }, [pushSupported, periodicSupported, requestPushPermission, registerPeriodicSync]);

  // This component doesn't render anything
  return null;
};
