-- Add theme_preference column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system'));