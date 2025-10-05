import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface Reminder {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
}

export const useNotifications = () => {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const lastNotificationTime = useRef<{ [key: string]: string }>({});
  const checkInterval = useRef<number | null>(null);

  // Request notification permission
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  // Load reminders from database
  const loadReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('enabled', true)
        .order('time');

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  // Check if it's time to show notification
  const checkReminders = () => {
    if (permission !== 'granted') return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = now.toDateString();

    reminders.forEach((reminder) => {
      const reminderKey = `${reminder.id}-${today}`;
      
      // Check if we already sent notification for this reminder today
      if (lastNotificationTime.current[reminderKey] === currentTime) {
        return;
      }

      // Check if current time matches reminder time
      if (reminder.time === currentTime) {
        showNotification(reminder);
        lastNotificationTime.current[reminderKey] = currentTime;
      }
    });
  };

  // Show browser notification
  const showNotification = (reminder: Reminder) => {
    if (permission !== 'granted') return;

    const notification = new Notification(t('reminders.notificationTitle'), {
      body: reminder.label,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: reminder.id,
      requireInteraction: false,
      silent: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);
  };

  // Initialize notification system
  useEffect(() => {
    // Check current permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Load reminders initially
    loadReminders();

    // Set up realtime subscription for reminders changes
    const channel = supabase
      .channel('reminders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reminders',
        },
        () => {
          loadReminders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Set up check interval
  useEffect(() => {
    if (permission === 'granted' && reminders.length > 0) {
      // Check immediately
      checkReminders();

      // Then check every minute
      checkInterval.current = window.setInterval(() => {
        checkReminders();
      }, 60000); // Check every minute
    }

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [permission, reminders]);

  return {
    permission,
    requestPermission,
    isSupported: 'Notification' in window,
  };
};
