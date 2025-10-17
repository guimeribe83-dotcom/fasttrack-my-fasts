import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  BookOpen, Plus, Edit, Trash2, Settings
} from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface JournalEntry {
  id: string;
  entry_date: string;
  feeling_rating: number | null;
  what_god_said: string | null;
  prayers: string | null;
  answered_prayers: string | null;
  learnings: string | null;
  tags: string[];
}

const emotionalTags = [
  { value: 'grateful', icon: '🙏' },
  { value: 'renewed', icon: '✨' },
  { value: 'tired', icon: '😴' },
  { value: 'tempted', icon: '⚔️' },
  { value: 'peaceful', icon: '🕊️' },
  { value: 'hopeful', icon: '🌟' },
];

export default function DiarioEspiritual() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [noteText, setNoteText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [activeFastId, setActiveFastId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const dateLocale = i18n.language === 'pt' ? ptBR : i18n.language === 'es' ? es : enUS;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    loadEntries();
    loadActiveFast();
  };

  const loadActiveFast = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("fasts")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (data) {
      setActiveFastId(data.id);
    }
  };

  const loadEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("spiritual_journal")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false });

    if (error) {
      console.error("Error loading entries:", error);
      return;
    }

    setEntries((data || []).map(entry => ({
      ...entry,
      tags: Array.isArray(entry.tags) ? entry.tags as string[] : []
    })));
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!noteText.trim()) {
      toast({
        variant: "destructive",
        title: "Campo vazio",
        description: "Escreva algo antes de salvar.",
      });
      return;
    }

    setLoading(true);

    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const entryData = {
      user_id: user.id,
      fast_id: activeFastId,
      entry_date: dateStr,
      feeling_rating: null,
      what_god_said: noteText,
      prayers: null,
      answered_prayers: null,
      learnings: null,
      tags: selectedTags,
    };

    try {
      if (editingEntry) {
        const { error } = await supabase
          .from("spiritual_journal")
          .update(entryData)
          .eq("id", editingEntry.id);

        if (error) throw error;

        toast({
          title: "Nota atualizada com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from("spiritual_journal")
          .insert(entryData);

        if (error) throw error;

        toast({
          title: "Nota salva com sucesso!",
        });
      }

      setNoteText('');
      setSelectedTags([]);
      setEditingEntry(null);
      loadEntries();
    } catch (error: any) {
      console.error("Error saving entry:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta nota?")) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("spiritual_journal")
        .delete()
        .eq("id", entryId);

      if (error) throw error;

      toast({
        title: "Nota deletada com sucesso!",
      });

      if (editingEntry?.id === entryId) {
        setNoteText('');
        setSelectedTags([]);
        setEditingEntry(null);
      }

      loadEntries();
    } catch (error: any) {
      console.error("Error deleting entry:", error);
      toast({
        variant: "destructive",
        title: "Erro ao deletar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNoteText(entry.what_god_said || '');
    setSelectedTags(entry.tags);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    textareaRef.current?.focus();
  };

  const handleNewNote = () => {
    setEditingEntry(null);
    setNoteText('');
    setSelectedTags([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    textareaRef.current?.focus();
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-purple-500/10 to-background">
        {/* Header com Gradiente */}
        <div className="bg-gradient-to-r from-primary via-purple-600 to-primary py-6 px-4 shadow-lg">
          <div className="container mx-auto max-w-4xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-white" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Diário Espiritual
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/configuracoes')}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Container Principal */}
        <div className="container mx-auto max-w-4xl px-4 py-6 pb-24">
          {/* Campo de Criação / Edição */}
          <Card className="mb-6 border-2 border-primary/20 shadow-xl bg-card/95 backdrop-blur">
            <div className="p-6 space-y-4">
              {/* Mood Tags */}
              <div className="flex flex-wrap gap-2">
                {emotionalTags.map((tag) => (
                  <Badge
                    key={tag.value}
                    variant={selectedTags.includes(tag.value) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all text-base px-3 py-1.5 hover:scale-105",
                      selectedTags.includes(tag.value) && "shadow-md"
                    )}
                    onClick={() => setSelectedTags(prev =>
                      prev.includes(tag.value)
                        ? prev.filter(t => t !== tag.value)
                        : [...prev, tag.value]
                    )}
                  >
                    {tag.icon}
                  </Badge>
                ))}
              </div>

              {/* Textarea Principal */}
              <Textarea
                ref={textareaRef}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="O que Deus te falou hoje?"
                className="min-h-[250px] resize-none text-base leading-relaxed border-none focus-visible:ring-0 bg-transparent p-0 placeholder:text-muted-foreground/60"
              />

              {/* Botão Salvar */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary-dark hover:to-purple-700 text-white shadow-lg"
                >
                  {loading ? "Salvando..." : editingEntry ? "Atualizar Nota" : "Salvar Nota"}
                </Button>
                {editingEntry && (
                  <Button
                    onClick={handleNewNote}
                    variant="outline"
                    className="border-primary/30"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Entradas Salvas */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground/80 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Suas Notas
            </h2>

            {entries.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-2">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  Ainda não há notas. Comece a escrever acima!
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {entries.map((entry) => (
                  <Card
                    key={entry.id}
                    className={cn(
                      "border-2 transition-all hover:shadow-lg cursor-pointer bg-card/80 backdrop-blur",
                      editingEntry?.id === entry.id && "border-primary shadow-lg"
                    )}
                    onClick={() => handleEditEntry(entry)}
                  >
                    <div className="p-4">
                      {/* Data e Tags */}
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-muted-foreground">
                          {format(new Date(entry.entry_date + 'T00:00:00'), "dd 'de' MMM", { locale: dateLocale })}
                        </p>
                        <div className="flex gap-1.5">
                          {entry.tags.slice(0, 3).map((tag) => {
                            const tagInfo = emotionalTags.find(t => t.value === tag);
                            return tagInfo ? (
                              <span key={tag} className="text-lg">
                                {tagInfo.icon}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>

                      {/* Preview do Texto */}
                      <p className="text-foreground/90 text-sm leading-relaxed line-clamp-3">
                        {entry.what_god_said || "Nota vazia"}
                      </p>

                      {/* Ações */}
                      <div className="flex gap-2 mt-4 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditEntry(entry)}
                          className="flex-1"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1.5" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(entry.id)}
                          className="hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botão Flutuante ➕ */}
        <Button
          onClick={handleNewNote}
          size="lg"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-purple-600 to-primary hover:from-purple-700 hover:to-primary-dark hover:scale-110 transition-transform z-50"
        >
          <Plus className="w-7 h-7" />
        </Button>
      </div>
    </Layout>
  );
}
