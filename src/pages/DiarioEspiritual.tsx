import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { 
  Book, Heart, Sparkles, CalendarIcon, Plus, Edit, Trash2, Copy, 
  BookOpen, Check, Eye
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  { value: 'grateful', icon: '🙏', color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' },
  { value: 'renewed', icon: '✨', color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20' },
  { value: 'tired', icon: '😴', color: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20' },
  { value: 'tempted', icon: '⚔️', color: 'bg-red-500/10 text-red-600 hover:bg-red-500/20' },
  { value: 'peaceful', icon: '🕊️', color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20' },
  { value: 'hopeful', icon: '🌟', color: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20' },
];

export default function DiarioEspiritual() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [feelingRating, setFeelingRating] = useState<number>(5);
  const [whatGodSaid, setWhatGodSaid] = useState('');
  const [prayers, setPrayers] = useState('');
  const [answeredPrayers, setAnsweredPrayers] = useState('');
  const [learnings, setLearnings] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeFastId, setActiveFastId] = useState<string | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

  const dateLocale = i18n.language === 'pt' ? ptBR : i18n.language === 'es' ? es : enUS;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    loadEntry(selectedDate);
  }, [selectedDate]);

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

  const loadEntry = async (date: Date) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const { data } = await supabase
      .from("spiritual_journal")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", dateStr)
      .maybeSingle();

    if (data) {
      const tags = Array.isArray(data.tags) ? data.tags as string[] : [];
      setCurrentEntry({
        ...data,
        tags
      });
      setFeelingRating(data.feeling_rating || 5);
      setWhatGodSaid(data.what_god_said || '');
      setPrayers(data.prayers || '');
      setAnsweredPrayers(data.answered_prayers || '');
      setLearnings(data.learnings || '');
      setSelectedTags(tags);
    } else {
      // Reset form for new entry
      setCurrentEntry(null);
      setFeelingRating(5);
      setWhatGodSaid('');
      setPrayers('');
      setAnsweredPrayers('');
      setLearnings('');
      setSelectedTags([]);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const entryData = {
      user_id: user.id,
      fast_id: activeFastId,
      entry_date: dateStr,
      feeling_rating: feelingRating,
      what_god_said: whatGodSaid || null,
      prayers: prayers || null,
      answered_prayers: answeredPrayers || null,
      learnings: learnings || null,
      tags: selectedTags,
    };

    try {
      if (currentEntry) {
        // Update existing entry
        const { error } = await supabase
          .from("spiritual_journal")
          .update(entryData)
          .eq("id", currentEntry.id);

        if (error) throw error;

        toast({
          title: t("journal.updateSuccess"),
        });
      } else {
        // Create new entry
        const { error } = await supabase
          .from("spiritual_journal")
          .insert(entryData);

        if (error) throw error;

        toast({
          title: t("journal.createSuccess"),
        });
      }

      loadEntries();
      loadEntry(selectedDate);
    } catch (error: any) {
      console.error("Error saving entry:", error);
      toast({
        variant: "destructive",
        title: t("journal.error"),
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentEntry) return;

    if (!confirm(t("journal.deleteConfirm"))) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("spiritual_journal")
        .delete()
        .eq("id", currentEntry.id);

      if (error) throw error;

      toast({
        title: t("journal.deleteSuccess"),
      });

      loadEntries();
      loadEntry(selectedDate);
    } catch (error: any) {
      console.error("Error deleting entry:", error);
      toast({
        variant: "destructive",
        title: t("journal.error"),
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const hasEntryForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.some(entry => entry.entry_date === dateStr);
  };

  const getFeelingColor = (rating: number | null) => {
    if (!rating) return "text-muted-foreground";
    if (rating >= 8) return "text-green-600 dark:text-green-400";
    if (rating >= 6) return "text-blue-600 dark:text-blue-400";
    if (rating >= 4) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const handleCopyEntry = (entry: JournalEntry) => {
    const content = `
📅 ${format(new Date(entry.entry_date + 'T00:00:00'), "PPP", { locale: dateLocale })}
❤️ ${t("journal.feelingRating")}: ${entry.feeling_rating}/10

${entry.what_god_said ? `🙏 ${t("journal.whatGodSaid")}:\n${entry.what_god_said}\n\n` : ''}
${entry.prayers ? `📿 ${t("journal.prayers")}:\n${entry.prayers}\n\n` : ''}
${entry.answered_prayers ? `✅ ${t("journal.answeredPrayers")}:\n${entry.answered_prayers}\n\n` : ''}
${entry.learnings ? `💡 ${t("journal.learnings")}:\n${entry.learnings}` : ''}
    `.trim();

    navigator.clipboard.writeText(content);
    toast({
      title: t("journal.copied"),
      description: t("journal.copiedMessage"),
    });
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setSelectedDate(new Date(entry.entry_date + 'T00:00:00'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({
      title: t("journal.editingEntry"),
      description: format(new Date(entry.entry_date + 'T00:00:00'), "PPP", { locale: dateLocale }),
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl pb-24">
        {/* Header Simplificado */}
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Book className="w-6 h-6 text-primary" />
            {t("journal.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("journal.subtitle")}
          </p>
        </div>

        {/* Layout Responsivo: 1 coluna em mobile, 2 em desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Coluna 1: Formulário */}
          <div className="space-y-4 sm:space-y-6">
            {/* Seletor de Data - Compacto */}
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  {t("journal.selectDate")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal hover:bg-primary/5 text-sm">
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      {format(selectedDate, "PPP", { locale: dateLocale })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      locale={dateLocale}
                      modifiers={{
                        hasEntry: (date) => hasEntryForDate(date)
                      }}
                      modifiersStyles={{
                        hasEntry: {
                          fontWeight: 'bold',
                          textDecoration: 'underline',
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {/* Formulário de Entrada - Otimizado para Mobile */}
            <Card id="journal-form" className="border-primary/20 shadow-md scroll-mt-20">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  {currentEntry ? (
                    <>
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      {t("journal.editEntry")}
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      {t("journal.newEntry")}
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5">
                {/* Conexão com Deus - Slider com Espaçamento para Polegar */}
                <div className="space-y-3 bg-gradient-to-br from-primary/5 to-purple-500/5 p-3 sm:p-4 rounded-xl border border-primary/10">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    {t("journal.feelingRating")}
                  </Label>
                  <div className="space-y-3 sm:space-y-3 px-1 py-2">
                    <Slider
                      value={[feelingRating]}
                      onValueChange={(values) => setFeelingRating(values[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground text-xs sm:text-sm">{t("journal.distant")}</span>
                      <div className="px-3 sm:px-4 py-1 sm:py-1 rounded-full bg-primary text-white font-bold text-base sm:text-lg shadow-md">
                        {feelingRating}/10
                      </div>
                      <span className="text-muted-foreground text-xs sm:text-sm">{t("journal.close")}</span>
                    </div>
                  </div>
                </div>

                {/* Ícones de Humor - Touch-Friendly */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    {t("journal.emotionalTags")}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {emotionalTags.map((tag) => (
                      <Badge
                        key={tag.value}
                        variant={selectedTags.includes(tag.value) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all py-2 px-3 sm:py-1.5 sm:px-3 text-xs sm:text-sm touch-manipulation",
                          selectedTags.includes(tag.value) 
                            ? "bg-primary text-white shadow-md scale-105" 
                            : "hover:bg-accent hover:scale-105 active:scale-95"
                        )}
                        onClick={() => toggleTag(tag.value)}
                      >
                        <span className="mr-1.5 text-base">{tag.icon}</span>
                        {t(`journal.tags.${tag.value}`)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator className="my-3 sm:my-4" />

                {/* Campos de Texto - Otimizados para Digitação Mobile */}
                <div className="space-y-2">
                  <Label htmlFor="whatGodSaid" className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-600" />
                    {t("journal.whatGodSaid")}
                  </Label>
                  <Textarea
                    id="whatGodSaid"
                    value={whatGodSaid}
                    onChange={(e) => setWhatGodSaid(e.target.value)}
                    placeholder={t("journal.whatGodSaidPlaceholder")}
                    className="min-h-[100px] sm:min-h-[90px] resize-none bg-yellow-500/5 border-yellow-500/20 focus:border-yellow-500/40 text-sm sm:text-base p-3 sm:p-3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prayers" className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                    🙏 {t("journal.prayers")}
                  </Label>
                  <Textarea
                    id="prayers"
                    value={prayers}
                    onChange={(e) => setPrayers(e.target.value)}
                    placeholder={t("journal.prayersPlaceholder")}
                    className="min-h-[100px] sm:min-h-[90px] resize-none bg-blue-500/5 border-blue-500/20 focus:border-blue-500/40 text-sm sm:text-base p-3 sm:p-3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answeredPrayers" className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                    ✅ {t("journal.answeredPrayers")}
                  </Label>
                  <Textarea
                    id="answeredPrayers"
                    value={answeredPrayers}
                    onChange={(e) => setAnsweredPrayers(e.target.value)}
                    placeholder={t("journal.answeredPrayersPlaceholder")}
                    className="min-h-[100px] sm:min-h-[90px] resize-none bg-green-500/5 border-green-500/20 focus:border-green-500/40 text-sm sm:text-base p-3 sm:p-3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learnings" className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                    💡 {t("journal.learnings")}
                  </Label>
                  <Textarea
                    id="learnings"
                    value={learnings}
                    onChange={(e) => setLearnings(e.target.value)}
                    placeholder={t("journal.learningsPlaceholder")}
                    className="min-h-[100px] sm:min-h-[90px] resize-none bg-purple-500/5 border-purple-500/20 focus:border-purple-500/40 text-sm sm:text-base p-3 sm:p-3"
                  />
                </div>

                {/* Botões de Ação - Touch-Friendly */}
                <div className="flex gap-2 sm:gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-gradient-primary shadow-lg hover:shadow-xl transition-all h-11 sm:h-10 text-sm sm:text-base touch-manipulation"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("journal.saving")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {t("journal.save")}
                      </span>
                    )}
                  </Button>
                  {currentEntry && (
                    <Button
                      onClick={handleDelete}
                      disabled={loading}
                      variant="destructive"
                      size="icon"
                      className="shadow-md h-11 w-11 sm:h-10 sm:w-10 touch-manipulation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Entradas Recentes */}
          <div className="space-y-4 sm:space-y-6">
            {entries.length > 0 ? (
              <>
                <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:static">
                  <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <Book className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    {t("journal.recentEntries")}
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {entries.length}
                  </Badge>
                </div>

                {/* Cards Simplificados */}
                <div className="space-y-3 sm:space-y-4">
                  {entries.slice(0, 10).map((entry) => (
                    <Card 
                      key={entry.id}
                      className="border hover:border-primary transition-colors"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {format(new Date(entry.entry_date + 'T00:00:00'), "dd MMM yyyy", { locale: dateLocale })}
                          </p>
                          
                          {entry.feeling_rating && (
                            <div className="flex items-center gap-1.5">
                              <Heart className={cn("w-4 h-4", getFeelingColor(entry.feeling_rating))} fill="currentColor" />
                              <span className="text-xs font-semibold">{entry.feeling_rating}/10</span>
                            </div>
                          )}
                        </div>
                        
                        {entry.tags.length > 0 && (
                          <div className="flex gap-1.5 mt-2">
                            {entry.tags.slice(0, 3).map((tag) => {
                              const tagInfo = emotionalTags.find(t => t.value === tag);
                              return tagInfo ? (
                                <span key={tag} className="text-lg" title={t(`journal.tags.${tag}`)}>
                                  {tagInfo.icon}
                                </span>
                              ) : null;
                            })}
                            {entry.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{entry.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="flex gap-2 pt-0">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setViewingEntry(entry)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          {t("journal.viewComplete")}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEditEntry(entry)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="hover:text-destructive"
                          onClick={async () => {
                            if (!confirm(t("journal.deleteConfirm"))) return;
                            const { error } = await supabase
                              .from("spiritual_journal")
                              .delete()
                              .eq("id", entry.id);
                            
                            if (!error) {
                              toast({ title: t("journal.deleteSuccess") });
                              loadEntries();
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {entries.length > 10 && (
                  <Button variant="outline" className="w-full text-sm touch-manipulation">
                    {t("journal.viewAll")} ({entries.length - 10} mais)
                  </Button>
                )}
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
                  <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-3 sm:mb-4 opacity-50" />
                  <p className="text-muted-foreground text-sm">
                    {t("journal.noEntries")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("journal.startWriting")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Botão Flutuante - Apenas Mobile */}
        <Button
          onClick={() => {
            setSelectedDate(new Date());
            const form = document.querySelector('#journal-form');
            form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-primary hover:scale-110 transition-transform z-50 touch-manipulation lg:hidden"
        >
          <Plus className="w-6 h-6" />
        </Button>

        {/* Dialog para Visualização Completa */}
        <Dialog open={!!viewingEntry} onOpenChange={() => setViewingEntry(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {viewingEntry && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Book className="w-5 h-5" />
                    {format(new Date(viewingEntry.entry_date + 'T00:00:00'), "PPP", { locale: dateLocale })}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {viewingEntry.feeling_rating && (
                    <div className="flex items-center gap-2">
                      <Heart className={cn("w-5 h-5", getFeelingColor(viewingEntry.feeling_rating))} fill="currentColor" />
                      <span className="font-semibold">{t("journal.feelingRating")}: {viewingEntry.feeling_rating}/10</span>
                    </div>
                  )}

                  {viewingEntry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {viewingEntry.tags.map((tag) => {
                        const tagInfo = emotionalTags.find(t => t.value === tag);
                        return tagInfo ? (
                          <Badge key={tag} variant="secondary">
                            <span className="mr-1">{tagInfo.icon}</span>
                            {t(`journal.tags.${tag}`)}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}

                  <Separator />

                  {viewingEntry.what_god_said && (
                    <div>
                      <h4 className="font-semibold text-sm flex items-center gap-1 mb-2">
                        <Sparkles className="w-4 h-4 text-yellow-600" />
                        {t("journal.whatGodSaid")}
                      </h4>
                      <p className="text-sm bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-md border">
                        {viewingEntry.what_god_said}
                      </p>
                    </div>
                  )}

                  {viewingEntry.prayers && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">🙏 {t("journal.prayers")}</h4>
                      <p className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border">
                        {viewingEntry.prayers}
                      </p>
                    </div>
                  )}

                  {viewingEntry.answered_prayers && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">✅ {t("journal.answeredPrayers")}</h4>
                      <p className="text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded-md border">
                        {viewingEntry.answered_prayers}
                      </p>
                    </div>
                  )}

                  {viewingEntry.learnings && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">💡 {t("journal.learnings")}</h4>
                      <p className="text-sm bg-purple-50 dark:bg-purple-950/20 p-3 rounded-md border">
                        {viewingEntry.learnings}
                      </p>
                    </div>
                  )}
                </div>

                <DialogFooter className="flex gap-2">
                  <Button variant="outline" onClick={() => handleCopyEntry(viewingEntry)}>
                    <Copy className="w-3 h-3 mr-2" />
                    Copiar
                  </Button>
                  <Button onClick={() => {
                    setViewingEntry(null);
                    handleEditEntry(viewingEntry);
                  }}>
                    <Edit className="w-3 h-3 mr-2" />
                    Editar
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
