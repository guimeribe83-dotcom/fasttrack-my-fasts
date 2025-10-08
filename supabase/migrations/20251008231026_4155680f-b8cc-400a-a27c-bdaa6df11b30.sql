-- Add notification_style and snooze_minutes columns to reminders table
ALTER TABLE reminders 
ADD COLUMN notification_style text DEFAULT 'default' CHECK (notification_style IN ('default', 'silent', 'vibrate')),
ADD COLUMN snooze_minutes integer DEFAULT NULL;