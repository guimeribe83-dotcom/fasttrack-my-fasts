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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Book, Heart, Sparkles, CalendarIcon, Plus, Edit, Trash2, Copy, ChevronRight } from "lucide-react";
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
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Book className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t("journal.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("journal.subtitle")}</p>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {t("journal.selectDate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
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

        {/* Journal Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentEntry ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {currentEntry ? t("journal.editEntry") : t("journal.newEntry")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Feeling Rating */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                {t("journal.feelingRating")}
              </Label>
              <div className="space-y-2">
                <Slider
                  value={[feelingRating]}
                  onValueChange={(values) => setFeelingRating(values[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("journal.distant")}</span>
                  <span className="font-bold text-lg text-primary">{feelingRating}/10</span>
                  <span>{t("journal.close")}</span>
                </div>
              </div>
            </div>

            {/* Emotional Tags */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {t("journal.emotionalTags")}
              </Label>
              <div className="flex flex-wrap gap-2">
                {emotionalTags.map((tag) => (
                  <Badge
                    key={tag.value}
                    variant={selectedTags.includes(tag.value) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedTags.includes(tag.value) ? tag.color : "hover:bg-accent"
                    )}
                    onClick={() => toggleTag(tag.value)}
                  >
                    <span className="mr-1">{tag.icon}</span>
                    {t(`journal.tags.${tag.value}`)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* What God Said */}
            <div className="space-y-2">
              <Label htmlFor="whatGodSaid">{t("journal.whatGodSaid")}</Label>
              <Textarea
                id="whatGodSaid"
                value={whatGodSaid}
                onChange={(e) => setWhatGodSaid(e.target.value)}
                placeholder={t("journal.whatGodSaidPlaceholder")}
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Prayers */}
            <div className="space-y-2">
              <Label htmlFor="prayers">{t("journal.prayers")}</Label>
              <Textarea
                id="prayers"
                value={prayers}
                onChange={(e) => setPrayers(e.target.value)}
                placeholder={t("journal.prayersPlaceholder")}
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Answered Prayers */}
            <div className="space-y-2">
              <Label htmlFor="answeredPrayers">{t("journal.answeredPrayers")}</Label>
              <Textarea
                id="answeredPrayers"
                value={answeredPrayers}
                onChange={(e) => setAnsweredPrayers(e.target.value)}
                placeholder={t("journal.answeredPrayersPlaceholder")}
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Learnings */}
            <div className="space-y-2">
              <Label htmlFor="learnings">{t("journal.learnings")}</Label>
              <Textarea
                id="learnings"
                value={learnings}
                onChange={(e) => setLearnings(e.target.value)}
                placeholder={t("journal.learningsPlaceholder")}
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1"
              >
                {loading ? t("journal.saving") : t("journal.save")}
              </Button>
              {currentEntry && (
                <Button
                  onClick={handleDelete}
                  disabled={loading}
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Entries */}
        {entries.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Book className="w-5 h-5" />
                {t("journal.recentEntries")} ({entries.length})
              </CardTitle>
              {entries.length > 10 && (
                <Button variant="link" size="sm" className="text-xs">
                  {t("journal.viewAll")} <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {entries.slice(0, 10).map((entry) => (
                  <AccordionItem 
                    key={entry.id} 
                    value={entry.id}
                    className="border-none px-6"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-full transition-colors",
                            entry.feeling_rating && entry.feeling_rating >= 8 
                              ? "bg-green-500/10"
                              : entry.feeling_rating && entry.feeling_rating >= 6
                              ? "bg-blue-500/10"
                              : entry.feeling_rating && entry.feeling_rating >= 4
                              ? "bg-orange-500/10"
                              : "bg-red-500/10"
                          )}>
                            <Heart className={cn("w-4 h-4", getFeelingColor(entry.feeling_rating))} />
                          </div>
                          
                          <div className="text-left">
                            <p className="font-medium">
                              {format(new Date(entry.entry_date + 'T00:00:00'), "EEE, dd MMM yyyy", { locale: dateLocale })}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {entry.feeling_rating && (
                                <span className={cn("text-xs font-semibold", getFeelingColor(entry.feeling_rating))}>
                                  {entry.feeling_rating}/10
                                </span>
                              )}
                              {entry.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {entry.tags.slice(0, 2).map((tag) => {
                                    const tagInfo = emotionalTags.find(t => t.value === tag);
                                    return tagInfo ? (
                                      <span key={tag} className="text-xs">
                                        {tagInfo.icon}
                                      </span>
                                    ) : null;
                                  })}
                                  {entry.tags.length > 2 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{entry.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pb-4">
                      <div className="space-y-4 pl-11">
                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {entry.tags.map((tag) => {
                              const tagInfo = emotionalTags.find(t => t.value === tag);
                              return tagInfo ? (
                                <Badge key={tag} variant="secondary" className={cn("text-xs", tagInfo.color)}>
                                  <span className="mr-1">{tagInfo.icon}</span>
                                  {t(`journal.tags.${tag}`)}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}

                        {entry.what_god_said && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              {t("journal.whatGodSaid")}
                            </p>
                            <p className="text-sm bg-accent/50 p-3 rounded-md border border-border/50">
                              {entry.what_god_said}
                            </p>
                          </div>
                        )}

                        {entry.prayers && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">
                              🙏 {t("journal.prayers")}
                            </p>
                            <p className="text-sm bg-accent/50 p-3 rounded-md border border-border/50">
                              {entry.prayers}
                            </p>
                          </div>
                        )}

                        {entry.answered_prayers && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">
                              ✅ {t("journal.answeredPrayers")}
                            </p>
                            <p className="text-sm bg-accent/50 p-3 rounded-md border border-border/50">
                              {entry.answered_prayers}
                            </p>
                          </div>
                        )}

                        {entry.learnings && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">
                              💡 {t("journal.learnings")}
                            </p>
                            <p className="text-sm bg-accent/50 p-3 rounded-md border border-border/50">
                              {entry.learnings}
                            </p>
                          </div>
                        )}

                        <Separator className="my-3" />

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEntry(entry)}
                            className="flex-1"
                          >
                            <Edit className="w-3 h-3 mr-2" />
                            {t("journal.edit")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyEntry(entry)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
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
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
