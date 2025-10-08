-- Add advanced reminder features to reminders table
ALTER TABLE public.reminders
ADD COLUMN repeat_days jsonb DEFAULT '[]'::jsonb,
ADD COLUMN start_date date,
ADD COLUMN end_date date;

-- Create notification_logs table
CREATE TABLE public.notification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  reminder_id uuid NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  device_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notification_logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_logs
CREATE POLICY "Users can view own notification logs"
ON public.notification_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification logs"
ON public.notification_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX idx_notification_logs_reminder_id ON public.notification_logs(reminder_id);
CREATE INDEX idx_notification_logs_sent_at ON public.notification_logs(sent_at DESC);