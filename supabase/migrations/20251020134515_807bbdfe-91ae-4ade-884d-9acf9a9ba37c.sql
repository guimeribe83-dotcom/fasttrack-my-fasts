-- Create fast_prayers table
CREATE TABLE public.fast_prayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fast_id UUID NOT NULL REFERENCES public.fasts(id) ON DELETE CASCADE,
  prayer_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable Row Level Security
ALTER TABLE public.fast_prayers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view prayers of their own fasts
CREATE POLICY "Users can view own prayers"
  ON public.fast_prayers
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.fasts 
    WHERE fasts.id = fast_prayers.fast_id 
    AND fasts.user_id = auth.uid()
  ));

-- RLS Policy: Users can insert prayers for their own fasts
CREATE POLICY "Users can insert own prayers"
  ON public.fast_prayers
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.fasts 
    WHERE fasts.id = fast_prayers.fast_id 
    AND fasts.user_id = auth.uid()
  ));

-- RLS Policy: Users can update prayers of their own fasts
CREATE POLICY "Users can update own prayers"
  ON public.fast_prayers
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.fasts 
    WHERE fasts.id = fast_prayers.fast_id 
    AND fasts.user_id = auth.uid()
  ));

-- RLS Policy: Users can delete prayers of their own fasts
CREATE POLICY "Users can delete own prayers"
  ON public.fast_prayers
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.fasts 
    WHERE fasts.id = fast_prayers.fast_id 
    AND fasts.user_id = auth.uid()
  ));

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_fast_prayers_updated_at
  BEFORE UPDATE ON public.fast_prayers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();