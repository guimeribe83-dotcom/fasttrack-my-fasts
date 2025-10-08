import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

interface Reminder {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
  notification_style?: string;
  snooze_minutes?: number;
}

export const useNotifications = () => {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermission | 'granted' | 'denied'>('default');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const lastNotificationTime = useRef<{ [key: string]: string }>({});
  const checkInterval = useRef<number | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // Request notification permission
  const requestPermission = async () => {
    if (isNative) {
      // Use Capacitor Local Notifications for native platforms
      try {
        const result = await LocalNotifications.requestPermissions();
        const granted = result.display === 'granted';
        setPermission(granted ? 'granted' : 'denied');
        return granted;
      } catch (error) {
        console.error('Error requesting native permissions:', error);
        return false;
      }
    } else {
      // Use web notifications for browser
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
      }

      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }
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

  // Schedule native notifications for all reminders
  const scheduleNativeNotifications = async () => {
    if (!isNative || permission !== 'granted') return;

    try {
      // Cancel all existing notifications
      await LocalNotifications.cancel({ notifications: reminders.map((r, idx) => ({ id: idx + 1 })) });

      // Schedule new notifications
      const notifications = reminders.map((reminder, index) => {
        const [hours, minutes] = reminder.time.split(':').map(Number);
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);

        // If the time has passed today, schedule for tomorrow
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const notificationConfig: any = {
          id: index + 1,
          title: t('reminders.notificationTitle'),
          body: reminder.label,
          schedule: {
            at: scheduledTime,
            repeats: true,
            every: 'day' as const,
          },
          smallIcon: 'ic_stat_icon_config_sample',
        };

        // Apply notification style
        if (reminder.notification_style === 'silent') {
          notificationConfig.sound = undefined;
        } else if (reminder.notification_style === 'vibrate') {
          notificationConfig.sound = undefined;
        } else {
          notificationConfig.sound = 'beep.wav';
        }

        return notificationConfig;
      });

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
      }
    } catch (error) {
      console.error('Error scheduling native notifications:', error);
    }
  };

  // Check if it's time to show notification (for web only)
  const checkReminders = () => {
    if (isNative || permission !== 'granted') return;

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
        showWebNotification(reminder);
        lastNotificationTime.current[reminderKey] = currentTime;
      }
    });
  };

  // Show browser notification (for web only)
  const showWebNotification = (reminder: Reminder) => {
    if (isNative || permission !== 'granted') return;

    const isSilent = reminder.notification_style === 'silent';

    const notification = new Notification(t('reminders.notificationTitle'), {
      body: reminder.label,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: reminder.id,
      requireInteraction: false,
      silent: isSilent,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Implement snooze: if snooze_minutes is set, show notification again after that time
    const closeTimeout = reminder.snooze_minutes 
      ? reminder.snooze_minutes * 60 * 1000 
      : 10000;

    setTimeout(() => {
      notification.close();
      
      // If snooze is enabled, show notification again
      if (reminder.snooze_minutes && reminder.snooze_minutes > 0) {
        showWebNotification(reminder);
      }
    }, closeTimeout);
  };

  // Initialize notification system
  useEffect(() => {
    const initPermissions = async () => {
      if (isNative) {
        // Check native permissions
        try {
          const result = await LocalNotifications.checkPermissions();
          setPermission(result.display === 'granted' ? 'granted' : 'denied');
        } catch (error) {
          console.error('Error checking native permissions:', error);
        }
      } else {
        // Check web permissions
        if ('Notification' in window) {
          setPermission(Notification.permission);
        }
      }
    };

    initPermissions();
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

  // Schedule notifications when reminders change (native only)
  useEffect(() => {
    if (isNative && permission === 'granted') {
      scheduleNativeNotifications();
    }
  }, [reminders, permission, isNative]);

  // Set up check interval (web only)
  useEffect(() => {
    if (!isNative && permission === 'granted' && reminders.length > 0) {
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
  }, [permission, reminders, isNative]);

  return {
    permission,
    requestPermission,
    isSupported: isNative || 'Notification' in window,
  };
};
