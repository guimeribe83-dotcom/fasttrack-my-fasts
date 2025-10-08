-- Add onboarding status to profiles
ALTER TABLE public.profiles
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;

-- Create user_stats table for gamification
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  total_days_completed INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  last_check_in DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for user_stats
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_stats
CREATE POLICY "Users can view own stats"
ON public.user_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
ON public.user_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
ON public.user_stats FOR UPDATE
USING (auth.uid() = user_id);

-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- 'streak', 'total_days', 'fast_completed'
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for badges (public read)
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone"
ON public.badges FOR SELECT
USING (true);

-- Create user_badges junction table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS for user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges"
ON public.user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
ON public.user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create daily_content table
CREATE TABLE public.daily_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  verse_reference TEXT NOT NULL,
  verse_text TEXT NOT NULL,
  motivation TEXT NOT NULL,
  health_tip TEXT NOT NULL,
  reflection TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for daily_content (public read)
ALTER TABLE public.daily_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily content is viewable by everyone"
ON public.daily_content FOR SELECT
USING (true);

-- Insert default badges
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value) VALUES
  ('Primeiro Passo', 'Complete seu primeiro dia de jejum', '🌱', 'total_days', 1),
  ('Determinação', 'Mantenha 3 dias seguidos', '🔥', 'streak', 3),
  ('Dedicado', 'Mantenha 7 dias seguidos', '⭐', 'streak', 7),
  ('Perseverante', 'Mantenha 14 dias seguidos', '💪', 'streak', 14),
  ('Conquistador', 'Mantenha 21 dias seguidos', '💎', 'streak', 21),
  ('Lenda', 'Mantenha 40 dias seguidos', '👑', 'streak', 40),
  ('Veterano', 'Complete 100 dias no total', '🏆', 'total_days', 100),
  ('Mestre', 'Complete seu primeiro jejum', '✨', 'fast_completed', 1);

-- Insert some daily content samples
INSERT INTO public.daily_content (date, verse_reference, verse_text, motivation, health_tip, reflection) VALUES
  (CURRENT_DATE, 'Mateus 6:16-18', 'Quando jejuarem, não mostrem uma aparência triste como os hipócritas, pois eles mudam a aparência do rosto a fim de que os outros vejam que eles estão jejuando.', 'Cada dia de jejum é uma vitória. Continue firme!', 'Mantenha-se hidratado durante o jejum. Água é essencial.', 'O jejum não é sobre privação, mas sobre aproximação com Deus.'),
  (CURRENT_DATE + INTERVAL '1 day', 'Isaías 58:6', 'O jejum que desejo não é este: soltar as correntes da injustiça, desatar as cordas do jugo, pôr em liberdade os oprimidos e romper todo jugo?', 'Você está mais forte do que imagina!', 'Escute seu corpo. Descanse quando necessário.', 'Use este tempo para oração e meditação.'),
  (CURRENT_DATE + INTERVAL '2 days', 'Joel 2:12', 'Voltem para mim de todo o coração, com jejum, lamento e pranto.', 'Sua dedicação inspira outros!', 'Evite exercícios intensos durante jejuns prolongados.', 'O jejum é uma jornada espiritual, não uma corrida.');

-- Create trigger for updated_at on user_stats
CREATE TRIGGER update_user_stats_updated_at
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Function to initialize user stats when user is created
CREATE OR REPLACE FUNCTION public.initialize_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to auto-create user_stats
CREATE TRIGGER on_user_created_stats
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.initialize_user_stats();