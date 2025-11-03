-- Criar tabela para destaques (highlights)
CREATE TABLE IF NOT EXISTS public.bible_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  color TEXT NOT NULL CHECK (color IN ('yellow', 'green', 'blue', 'pink', 'purple')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Índice único para evitar duplicatas
  UNIQUE(user_id, book_id, chapter, verse)
);

-- Criar tabela para anotações (notes)
CREATE TABLE IF NOT EXISTS public.bible_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Índice único para uma nota por versículo
  UNIQUE(user_id, book_id, chapter, verse)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.bible_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_notes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para bible_highlights
CREATE POLICY "Users can view own highlights"
  ON public.bible_highlights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own highlights"
  ON public.bible_highlights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own highlights"
  ON public.bible_highlights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own highlights"
  ON public.bible_highlights FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para bible_notes
CREATE POLICY "Users can view own notes"
  ON public.bible_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON public.bible_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON public.bible_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON public.bible_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at em bible_notes
CREATE TRIGGER update_bible_notes_updated_at
  BEFORE UPDATE ON public.bible_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Índices para melhorar performance de queries
CREATE INDEX idx_bible_highlights_user_book ON public.bible_highlights(user_id, book_id, chapter);
CREATE INDEX idx_bible_notes_user_book ON public.bible_notes(user_id, book_id, chapter);