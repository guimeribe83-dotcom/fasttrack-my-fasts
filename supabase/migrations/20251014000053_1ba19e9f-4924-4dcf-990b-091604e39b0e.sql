-- Tabela para armazenar os propósitos/motivos dos jejuns
CREATE TABLE public.fast_purposes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fast_id UUID NOT NULL REFERENCES public.fasts(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('healing', 'guidance', 'gratitude', 'intercession', 'deliverance', 'breakthrough', 'other')),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para o diário espiritual
CREATE TABLE public.spiritual_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fast_id UUID REFERENCES public.fasts(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  feeling_rating INTEGER CHECK (feeling_rating >= 1 AND feeling_rating <= 10),
  what_god_said TEXT,
  prayers TEXT,
  answered_prayers TEXT,
  learnings TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos de check-in emocional na tabela fast_days
ALTER TABLE public.fast_days
ADD COLUMN feeling_rating INTEGER CHECK (feeling_rating >= 1 AND feeling_rating <= 5),
ADD COLUMN emotional_tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN daily_note TEXT;

-- Habilitar RLS
ALTER TABLE public.fast_purposes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spiritual_journal ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para fast_purposes
CREATE POLICY "Users can view purposes of own fasts"
ON public.fast_purposes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.fasts
  WHERE fasts.id = fast_purposes.fast_id
  AND fasts.user_id = auth.uid()
));

CREATE POLICY "Users can insert purposes for own fasts"
ON public.fast_purposes FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.fasts
  WHERE fasts.id = fast_purposes.fast_id
  AND fasts.user_id = auth.uid()
));

CREATE POLICY "Users can update purposes of own fasts"
ON public.fast_purposes FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.fasts
  WHERE fasts.id = fast_purposes.fast_id
  AND fasts.user_id = auth.uid()
));

CREATE POLICY "Users can delete purposes of own fasts"
ON public.fast_purposes FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.fasts
  WHERE fasts.id = fast_purposes.fast_id
  AND fasts.user_id = auth.uid()
));

-- Políticas RLS para spiritual_journal
CREATE POLICY "Users can view own journal entries"
ON public.spiritual_journal FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
ON public.spiritual_journal FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
ON public.spiritual_journal FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
ON public.spiritual_journal FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at no spiritual_journal
CREATE TRIGGER update_spiritual_journal_updated_at
BEFORE UPDATE ON public.spiritual_journal
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Índices para performance
CREATE INDEX idx_fast_purposes_fast_id ON public.fast_purposes(fast_id);
CREATE INDEX idx_spiritual_journal_user_id ON public.spiritual_journal(user_id);
CREATE INDEX idx_spiritual_journal_entry_date ON public.spiritual_journal(entry_date);
CREATE INDEX idx_spiritual_journal_fast_id ON public.spiritual_journal(fast_id);