-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create trigger to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create fasts table
CREATE TABLE public.fasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_days INTEGER NOT NULL CHECK (total_days > 0),
  start_date DATE NOT NULL,
  days_completed_before_app INTEGER DEFAULT 0 CHECK (days_completed_before_app >= 0),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.fasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fasts"
  ON public.fasts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fasts"
  ON public.fasts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fasts"
  ON public.fasts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fasts"
  ON public.fasts FOR DELETE
  USING (auth.uid() = user_id);

-- Create fast_blocks table
CREATE TABLE public.fast_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fast_id UUID NOT NULL REFERENCES public.fasts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_days INTEGER NOT NULL CHECK (total_days > 0),
  order_index INTEGER NOT NULL,
  manually_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.fast_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view blocks of own fasts"
  ON public.fast_blocks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.fasts
    WHERE fasts.id = fast_blocks.fast_id
    AND fasts.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert blocks for own fasts"
  ON public.fast_blocks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.fasts
    WHERE fasts.id = fast_blocks.fast_id
    AND fasts.user_id = auth.uid()
  ));

CREATE POLICY "Users can update blocks of own fasts"
  ON public.fast_blocks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.fasts
    WHERE fasts.id = fast_blocks.fast_id
    AND fasts.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete blocks of own fasts"
  ON public.fast_blocks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.fasts
    WHERE fasts.id = fast_blocks.fast_id
    AND fasts.user_id = auth.uid()
  ));

-- Create fast_days table (completed/failed days)
CREATE TABLE public.fast_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fast_id UUID NOT NULL REFERENCES public.fasts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  block_id UUID REFERENCES public.fast_blocks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fast_id, date)
);

ALTER TABLE public.fast_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view days of own fasts"
  ON public.fast_days FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.fasts
    WHERE fasts.id = fast_days.fast_id
    AND fasts.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert days for own fasts"
  ON public.fast_days FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.fasts
    WHERE fasts.id = fast_days.fast_id
    AND fasts.user_id = auth.uid()
  ));

CREATE POLICY "Users can update days of own fasts"
  ON public.fast_days FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.fasts
    WHERE fasts.id = fast_days.fast_id
    AND fasts.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete days of own fasts"
  ON public.fast_days FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.fasts
    WHERE fasts.id = fast_days.fast_id
    AND fasts.user_id = auth.uid()
  ));

-- Create reminders table
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  time TIME NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders"
  ON public.reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON public.reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON public.reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON public.reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_fasts_user_id ON public.fasts(user_id);
CREATE INDEX idx_fasts_is_active ON public.fasts(is_active);
CREATE INDEX idx_fast_blocks_fast_id ON public.fast_blocks(fast_id);
CREATE INDEX idx_fast_days_fast_id ON public.fast_days(fast_id);
CREATE INDEX idx_fast_days_date ON public.fast_days(date);
CREATE INDEX idx_reminders_user_id ON public.reminders(user_id);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for fasts
CREATE TRIGGER update_fasts_updated_at
  BEFORE UPDATE ON public.fasts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();