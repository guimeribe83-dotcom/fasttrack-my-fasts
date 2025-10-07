import { useState, useEffect } from 'react';

export const usePeriodicSync = () => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        // @ts-ignore - periodicSync is not yet in TypeScript types
        setIsSupported('periodicSync' in registration);
      }
    };
    
    checkSupport();
  }, []);

  const register = async (tag: string, minInterval: number) => {
    if (!isSupported) {
      console.log('Periodic Background Sync not supported');
      return false;
    }

    try {
      // @ts-ignore - periodicSync is not yet in TypeScript types
      const status = await navigator.permissions.query({
        // @ts-ignore - periodic-background-sync is not yet in TypeScript types
        name: 'periodic-background-sync',
      });

      if (status.state === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        // @ts-ignore - periodicSync is not yet in TypeScript types
        await registration.periodicSync.register(tag, {
          minInterval
        });
        console.log(`Periodic sync registered: ${tag}`);
        return true;
      } else {
        console.log('Periodic sync permission not granted');
        return false;
      }
    } catch (error) {
      console.error('Error registering periodic sync:', error);
      return false;
    }
  };

  const unregister = async (tag: string) => {
    if (!isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      // @ts-ignore - periodicSync is not yet in TypeScript types
      await registration.periodicSync.unregister(tag);
      console.log(`Periodic sync unregistered: ${tag}`);
      return true;
    } catch (error) {
      console.error('Error unregistering periodic sync:', error);
      return false;
    }
  };

  const getTags = async (): Promise<string[]> => {
    if (!isSupported) return [];

    try {
      const registration = await navigator.serviceWorker.ready;
      // @ts-ignore - periodicSync is not yet in TypeScript types
      return await registration.periodicSync.getTags();
    } catch (error) {
      console.error('Error getting periodic sync tags:', error);
      return [];
    }
  };

  return {
    isSupported,
    register,
    unregister,
    getTags
  };
};
