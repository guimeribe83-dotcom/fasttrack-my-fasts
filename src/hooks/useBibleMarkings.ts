import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { HighlightColor } from "@/lib/highlightColors";

export interface BibleHighlight {
  id: string;
  user_id: string;
  book_id: string;
  chapter: number;
  verse: number;
  color: HighlightColor;
  created_at: string;
}

export interface BibleNote {
  id: string;
  user_id: string;
  book_id: string;
  chapter: number;
  verse: number;
  note: string;
  created_at: string;
  updated_at: string;
}

export const useBibleMarkings = (bookId: string, chapter: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar highlights do capítulo atual
  const { data: highlights = [] } = useQuery({
    queryKey: ['bible-highlights', bookId, chapter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bible_highlights')
        .select('*')
        .eq('book_id', bookId)
        .eq('chapter', chapter);

      if (error) throw error;
      return data as BibleHighlight[];
    },
  });

  // Buscar notas do capítulo atual
  const { data: notes = [] } = useQuery({
    queryKey: ['bible-notes', bookId, chapter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bible_notes')
        .select('*')
        .eq('book_id', bookId)
        .eq('chapter', chapter);

      if (error) throw error;
      return data as BibleNote[];
    },
  });

  // Adicionar/atualizar highlight
  const highlightMutation = useMutation({
    mutationFn: async ({ verse, color }: { verse: number; color: HighlightColor }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('bible_highlights')
        .upsert({
          user_id: user.id,
          book_id: bookId,
          chapter,
          verse,
          color,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bible-highlights', bookId, chapter] });
      queryClient.invalidateQueries({ queryKey: ['all-bible-markings'] });
    },
    onError: () => {
      toast({
        title: "Erro ao destacar versículo",
        description: "Não foi possível salvar o destaque.",
        variant: "destructive",
      });
    },
  });

  // Remover highlight
  const removeHighlightMutation = useMutation({
    mutationFn: async (verse: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('bible_highlights')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .eq('chapter', chapter)
        .eq('verse', verse);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bible-highlights', bookId, chapter] });
      queryClient.invalidateQueries({ queryKey: ['all-bible-markings'] });
      toast({
        title: "Destaque removido",
        description: "O destaque foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover destaque",
        description: "Não foi possível remover o destaque.",
        variant: "destructive",
      });
    },
  });

  // Adicionar/atualizar nota
  const noteMutation = useMutation({
    mutationFn: async ({ verse, note }: { verse: number; note: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('bible_notes')
        .upsert({
          user_id: user.id,
          book_id: bookId,
          chapter,
          verse,
          note,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bible-notes', bookId, chapter] });
      queryClient.invalidateQueries({ queryKey: ['all-bible-markings'] });
      toast({
        title: "Anotação salva",
        description: "Sua anotação foi salva com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar anotação",
        description: "Não foi possível salvar a anotação.",
        variant: "destructive",
      });
    },
  });

  // Remover nota
  const removeNoteMutation = useMutation({
    mutationFn: async (verse: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('bible_notes')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .eq('chapter', chapter)
        .eq('verse', verse);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bible-notes', bookId, chapter] });
      queryClient.invalidateQueries({ queryKey: ['all-bible-markings'] });
      toast({
        title: "Anotação removida",
        description: "A anotação foi removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover anotação",
        description: "Não foi possível remover a anotação.",
        variant: "destructive",
      });
    },
  });

  return {
    highlights,
    notes,
    addHighlight: highlightMutation.mutate,
    removeHighlight: removeHighlightMutation.mutate,
    saveNote: noteMutation.mutate,
    removeNote: removeNoteMutation.mutate,
  };
};

// Hook para buscar todas as marcações do usuário
export const useAllBibleMarkings = () => {
  const { data: allMarkings = [], isLoading } = useQuery({
    queryKey: ['all-bible-markings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const [highlightsRes, notesRes] = await Promise.all([
        supabase
          .from('bible_highlights')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('bible_notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (highlightsRes.error) throw highlightsRes.error;
      if (notesRes.error) throw notesRes.error;

      // Combinar highlights e notes
      const combined = [
        ...(highlightsRes.data || []).map(h => ({ ...h, type: 'highlight' as const })),
        ...(notesRes.data || []).map(n => ({ ...n, type: 'note' as const })),
      ];

      // Ordenar por data de criação
      return combined.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });

  return { allMarkings, isLoading };
};
