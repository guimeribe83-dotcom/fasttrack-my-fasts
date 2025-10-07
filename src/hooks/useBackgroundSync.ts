import { useState, useEffect } from 'react';

export const useBackgroundSync = () => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        // @ts-ignore - sync is not yet in TypeScript types
        setIsSupported('sync' in registration);
      }
    };
    
    checkSupport();
  }, []);

  const registerSync = async (tag: string) => {
    if (!isSupported) {
      console.log('Background Sync not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      // @ts-ignore - sync is not yet in TypeScript types
      await registration.sync.register(tag);
      console.log(`Background sync registered: ${tag}`);
      return true;
    } catch (error) {
      console.error('Error registering background sync:', error);
      return false;
    }
  };

  const getTags = async (): Promise<string[]> => {
    if (!isSupported) return [];

    try {
      const registration = await navigator.serviceWorker.ready;
      // @ts-ignore - sync is not yet in TypeScript types
      return await registration.sync.getTags();
    } catch (error) {
      console.error('Error getting sync tags:', error);
      return [];
    }
  };

  return {
    isSupported,
    registerSync,
    getTags
  };
};
