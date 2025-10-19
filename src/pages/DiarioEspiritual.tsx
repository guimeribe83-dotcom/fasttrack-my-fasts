import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { BookOpen, Plus, Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface JournalEntry {
  id: string;
  entry_date: string;
  title: string | null;
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
  const [noteTitle, setNoteTitle] = useState('');
  const [noteText, setNoteText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [activeFastId, setActiveFastId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

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
        title: t("common.error"),
        description: t("journal.emptyFieldError"),
      });
      return;
    }

    setLoading(true);

    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const entryData = {
      user_id: user.id,
      fast_id: activeFastId,
      entry_date: dateStr,
      title: noteTitle.trim() || null,
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
          title: t("journal.updateSuccess"),
        });
      } else {
        const { error } = await supabase
          .from("spiritual_journal")
          .insert(entryData);

        if (error) throw error;

        toast({
          title: t("journal.saveSuccess"),
        });
      }

      setNoteTitle('');
      setNoteText('');
      setSelectedTags([]);
      setEditingEntry(null);
      setIsDialogOpen(false);
      loadEntries();
    } catch (error: any) {
      console.error("Error saving entry:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm(t("journal.deleteConfirm"))) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("spiritual_journal")
        .delete()
        .eq("id", entryId);

      if (error) throw error;

      toast({
        title: t("journal.deleteSuccess"),
      });

      if (editingEntry?.id === entryId) {
        setNoteText('');
        setSelectedTags([]);
        setEditingEntry(null);
        setIsDialogOpen(false);
      }

      loadEntries();
    } catch (error: any) {
      console.error("Error deleting entry:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenViewDialog = (entry: JournalEntry) => {
    setViewingEntry(entry);
    setIsViewDialogOpen(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNoteTitle(entry.title || '');
    setNoteText(entry.what_god_said || '');
    setSelectedTags(entry.tags);
    setIsViewDialogOpen(false);
    setIsDialogOpen(true);
  };

  const handleNewNote = () => {
    setEditingEntry(null);
    setNoteTitle('');
    setNoteText('');
    setSelectedTags([]);
    setIsDialogOpen(true);
  };

  const handleCancelDialog = () => {
    setIsDialogOpen(false);
    setEditingEntry(null);
    setNoteTitle('');
    setNoteText('');
    setSelectedTags([]);
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-24">
        {/* Header Simples - Padrão do App */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {t("journal.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("journal.subtitle")}
          </p>
        </div>

        {/* Entradas Salvas */}
        {entries.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("journal.emptyTitle")}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t("journal.emptyDescription")}
            </p>
            <Button onClick={handleNewNote}>
              <Plus className="w-4 h-4 mr-2" />
              {t("journal.createFirstEntry")}
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {entries.map((entry) => (
              <Card
                key={entry.id}
                className="group p-4 hover:border-primary transition-all"
              >
                {/* Header: Data + Tags */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {format(new Date(entry.entry_date + 'T00:00:00'), "dd MMM yyyy", { locale: dateLocale })}
                  </p>
                  <div className="flex gap-1">
                    {entry.tags.slice(0, 3).map((tag) => {
                      const tagInfo = emotionalTags.find(t => t.value === tag);
                      return tagInfo ? (
                        <span key={tag} className="text-base">
                          {tagInfo.icon}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Título (se existir) */}
                {entry.title && (
                  <h3 className="text-base font-semibold text-foreground mb-2 line-clamp-1">
                    {entry.title}
                  </h3>
                )}

                {/* Preview do Texto */}
                <p className="text-foreground text-sm leading-relaxed line-clamp-3">
                  {entry.what_god_said || t("journal.emptyNote")}
                </p>

                {/* Ações (aparecem no hover em desktop, sempre em mobile) */}
                <div className="flex gap-2 mt-3 pt-3 border-t opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenViewDialog(entry);
                    }}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    {t("common.view")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEntry(entry);
                    }}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    {t("common.edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entry.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {t("common.delete")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Visualização (Somente Leitura) */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewingEntry?.title || t("journal.viewEntry")}
            </DialogTitle>
            <DialogDescription>
              {viewingEntry && format(new Date(viewingEntry.entry_date + 'T00:00:00'), "PPP", { locale: dateLocale })}
            </DialogDescription>
          </DialogHeader>

            {viewingEntry && (
              <>
                {/* Tags */}
                {viewingEntry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {viewingEntry.tags.map((tag) => {
                      const tagInfo = emotionalTags.find(t => t.value === tag);
                      return tagInfo ? (
                        <Badge key={tag} variant="outline" className="text-base px-3 py-1.5">
                          {tagInfo.icon}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Conteúdo */}
                <div className="bg-muted/30 p-4 rounded-md">
                  <p className="whitespace-pre-line text-sm text-foreground leading-relaxed">
                    {viewingEntry.what_god_said || t("journal.emptyNote")}
                  </p>
                </div>
              </>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                {t("common.close")}
              </Button>
              <Button onClick={() => viewingEntry && handleEditEntry(viewingEntry)}>
                <Edit className="w-4 h-4 mr-2" />
                {t("common.edit")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para Criar/Editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? t("journal.editEntry") : t("journal.newEntry")}
              </DialogTitle>
              <DialogDescription>
                {t("journal.dialogDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Tags Emocionais */}
              <div className="flex flex-wrap gap-2">
                {emotionalTags.map((tag) => (
                  <Badge
                    key={tag.value}
                    variant={selectedTags.includes(tag.value) ? "default" : "outline"}
                    className="cursor-pointer text-base px-3 py-1.5"
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

              {/* Campo de Título */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  {t("journal.titleLabel")}
                </Label>
                <Input
                  id="title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder={t("journal.titlePlaceholder")}
                  maxLength={100}
                  className="font-medium"
                />
                <p className="text-xs text-muted-foreground">
                  {t("journal.titleHint")}
                </p>
              </div>

              {/* Campo de Conteúdo */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm font-medium">
                  {t("journal.contentLabel")}
                </Label>
                <Textarea
                  id="content"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={t("journal.placeholder")}
                  className="min-h-[300px] resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancelDialog}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Botão Flutuante ➕ */}
        <Button
          onClick={handleNewNote}
          size="lg"
          className="fixed bottom-20 md:bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 z-50"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </Layout>
  );
}
