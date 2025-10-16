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
  BarChart3, Lightbulb, Star, BookOpen, Check
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
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header Moderno com Ações Rápidas */}
        <div className="mb-8 bg-gradient-to-br from-primary/10 via-purple-500/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-primary shadow-lg">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {t("journal.title")}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{t("journal.subtitle")}</p>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-3 flex flex-col gap-2 hover:bg-primary/10 hover:border-primary transition-all"
              onClick={() => window.scrollTo({ top: document.querySelector('#journal-form')?.getBoundingClientRect().top || 0, behavior: 'smooth' })}
            >
              <Plus className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium">{t("journal.newEntry")}</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-auto py-3 flex flex-col gap-2 hover:bg-purple-500/10 hover:border-purple-500 transition-all"
            >
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-medium">{t("journal.statistics")}</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-auto py-3 flex flex-col gap-2 hover:bg-yellow-500/10 hover:border-yellow-500 transition-all"
            >
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <span className="text-xs font-medium">{t("journal.suggestions")}</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-auto py-3 flex flex-col gap-2 hover:bg-green-500/10 hover:border-green-500 transition-all"
            >
              <Sparkles className="w-5 h-5 text-green-600" />
              <span className="text-xs font-medium">{t("journal.verseOfDay")}</span>
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Coluna Esquerda: Formulário */}
          <div className="space-y-6">
            {/* Seletor de Data */}
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  {t("journal.selectDate")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal hover:bg-primary/5">
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
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

            {/* Formulário de Entrada */}
            <Card id="journal-form" className="border-primary/20 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {currentEntry ? (
                    <>
                      <Edit className="w-4 h-4 text-primary" />
                      {t("journal.editEntry")}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-primary" />
                      {t("journal.newEntry")}
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Conexão com Deus - Slider */}
                <div className="space-y-3 bg-gradient-to-br from-primary/5 to-purple-500/5 p-4 rounded-xl border border-primary/10">
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Heart className="w-4 h-4 text-primary" />
                    {t("journal.feelingRating")}
                  </Label>
                  <div className="space-y-3">
                    <Slider
                      value={[feelingRating]}
                      onValueChange={(values) => setFeelingRating(values[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">{t("journal.distant")}</span>
                      <div className="px-4 py-1 rounded-full bg-primary text-white font-bold text-lg shadow-md">
                        {feelingRating}/10
                      </div>
                      <span className="text-muted-foreground">{t("journal.close")}</span>
                    </div>
                  </div>
                </div>

                {/* Ícones de Humor (Emotional Tags) */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {t("journal.emotionalTags")}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {emotionalTags.map((tag) => (
                      <Badge
                        key={tag.value}
                        variant={selectedTags.includes(tag.value) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all text-sm py-1.5 px-3",
                          selectedTags.includes(tag.value) 
                            ? "bg-primary text-white shadow-md scale-105" 
                            : "hover:bg-accent hover:scale-105"
                        )}
                        onClick={() => toggleTag(tag.value)}
                      >
                        <span className="mr-1.5 text-base">{tag.icon}</span>
                        {t(`journal.tags.${tag.value}`)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* O que Deus te falou */}
                <div className="space-y-2">
                  <Label htmlFor="whatGodSaid" className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                    {t("journal.whatGodSaid")}
                  </Label>
                  <Textarea
                    id="whatGodSaid"
                    value={whatGodSaid}
                    onChange={(e) => setWhatGodSaid(e.target.value)}
                    placeholder={t("journal.whatGodSaidPlaceholder")}
                    className="min-h-[90px] resize-none bg-yellow-500/5 border-yellow-500/20 focus:border-yellow-500/40"
                  />
                </div>

                {/* Suas Orações */}
                <div className="space-y-2">
                  <Label htmlFor="prayers" className="flex items-center gap-2 text-sm font-semibold">
                    🙏 {t("journal.prayers")}
                  </Label>
                  <Textarea
                    id="prayers"
                    value={prayers}
                    onChange={(e) => setPrayers(e.target.value)}
                    placeholder={t("journal.prayersPlaceholder")}
                    className="min-h-[90px] resize-none bg-blue-500/5 border-blue-500/20 focus:border-blue-500/40"
                  />
                </div>

                {/* Orações Respondidas */}
                <div className="space-y-2">
                  <Label htmlFor="answeredPrayers" className="flex items-center gap-2 text-sm font-semibold">
                    ✅ {t("journal.answeredPrayers")}
                  </Label>
                  <Textarea
                    id="answeredPrayers"
                    value={answeredPrayers}
                    onChange={(e) => setAnsweredPrayers(e.target.value)}
                    placeholder={t("journal.answeredPrayersPlaceholder")}
                    className="min-h-[90px] resize-none bg-green-500/5 border-green-500/20 focus:border-green-500/40"
                  />
                </div>

                {/* Aprendizados */}
                <div className="space-y-2">
                  <Label htmlFor="learnings" className="flex items-center gap-2 text-sm font-semibold">
                    💡 {t("journal.learnings")}
                  </Label>
                  <Textarea
                    id="learnings"
                    value={learnings}
                    onChange={(e) => setLearnings(e.target.value)}
                    placeholder={t("journal.learningsPlaceholder")}
                    className="min-h-[90px] resize-none bg-purple-500/5 border-purple-500/20 focus:border-purple-500/40"
                  />
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-gradient-primary shadow-lg hover:shadow-xl transition-all"
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
                      className="shadow-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita: Entradas Recentes (Estilo Notas) */}
          <div className="space-y-6">
            {entries.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Book className="w-5 h-5 text-primary" />
                    {t("journal.recentEntries")}
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'}
                  </Badge>
                </div>

                {/* Cards de Notas */}
                <div className="space-y-4">
                  {entries.slice(0, 10).map((entry, index) => {
                    const noteColors = [
                      'from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/30',
                      'from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50 dark:border-purple-800/30',
                      'from-pink-50 to-pink-100/50 dark:from-pink-950/30 dark:to-pink-900/20 border-pink-200/50 dark:border-pink-800/30',
                      'from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200/50 dark:border-yellow-800/30',
                      'from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200/50 dark:border-green-800/30',
                    ];
                    const colorClass = noteColors[index % noteColors.length];

                    const getEntryTitle = (entry: JournalEntry) => {
                      if (entry.what_god_said) {
                        const words = entry.what_god_said.split(' ').slice(0, 5).join(' ');
                        return words + (entry.what_god_said.split(' ').length > 5 ? '...' : '');
                      }
                      const tagInfo = entry.tags[0] ? emotionalTags.find(t => t.value === entry.tags[0]) : null;
                      return tagInfo ? `${tagInfo.icon} ${t(`journal.tags.${entry.tags[0]}`)}` : t("journal.myReflection");
                    };

                    const getEntrySummary = (entry: JournalEntry) => {
                      const parts = [];
                      if (entry.prayers) parts.push(entry.prayers);
                      if (entry.answered_prayers) parts.push(entry.answered_prayers);
                      if (entry.learnings) parts.push(entry.learnings);
                      const summary = parts.join(' ').split(' ').slice(0, 15).join(' ');
                      return summary ? summary + '...' : '';
                    };

                    return (
                      <Card 
                        key={entry.id}
                        className={cn(
                          "bg-gradient-to-br border-2 shadow-md hover:shadow-xl transition-all cursor-pointer group",
                          colorClass
                        )}
                        onClick={() => handleEditEntry(entry)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base font-bold line-clamp-2 group-hover:text-primary transition-colors">
                                {getEntryTitle(entry)}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                <CalendarIcon className="w-3 h-3" />
                                {format(new Date(entry.entry_date + 'T00:00:00'), "dd MMM yyyy", { locale: dateLocale })}
                              </p>
                            </div>
                            
                            {/* Ícone de Sentimento */}
                            {entry.feeling_rating && (
                              <div className={cn(
                                "p-2 rounded-full shadow-sm",
                                entry.feeling_rating >= 8 
                                  ? "bg-green-500/20"
                                  : entry.feeling_rating >= 6
                                  ? "bg-blue-500/20"
                                  : entry.feeling_rating >= 4
                                  ? "bg-orange-500/20"
                                  : "bg-red-500/20"
                              )}>
                                <Heart className={cn("w-4 h-4", getFeelingColor(entry.feeling_rating))} fill="currentColor" />
                              </div>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          {/* Resumo */}
                          {getEntrySummary(entry) && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {getEntrySummary(entry)}
                            </p>
                          )}

                          {/* Tags e Rating */}
                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div className="flex items-center gap-1.5">
                              {entry.tags.slice(0, 3).map((tag) => {
                                const tagInfo = emotionalTags.find(t => t.value === tag);
                                return tagInfo ? (
                                  <span key={tag} className="text-base" title={t(`journal.tags.${tag}`)}>
                                    {tagInfo.icon}
                                  </span>
                                ) : null;
                              })}
                              {entry.tags.length > 3 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  +{entry.tags.length - 3}
                                </span>
                              )}
                            </div>

                            {/* Ações rápidas */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyEntry(entry);
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Adicionar funcionalidade de favorito
                                }}
                              >
                                <Star className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                                onClick={async (e) => {
                                  e.stopPropagation();
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
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {entries.length > 10 && (
                  <Button variant="outline" className="w-full">
                    {t("journal.viewAll")} ({entries.length - 10} mais)
                  </Button>
                )}
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
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
      </div>
    </Layout>
  );
}
