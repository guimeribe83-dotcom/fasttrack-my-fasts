import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Plus, Trash2, BellRing, BellOff, Filter, Clock, Sparkles } from "lucide-react";

interface Reminder {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
}

export default function Lembretes() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { permission, requestPermission, isSupported } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newTime, setNewTime] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeError, setTimeError] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    loadReminders();
  };

  const loadReminders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .order("time");

      if (error) throw error;
      setReminders(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("reminders.error"),
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: t("reminders.permissionGranted"),
        description: t("reminders.permissionGrantedMessage"),
      });
    } else {
      toast({
        variant: "destructive",
        title: t("reminders.permissionDenied"),
        description: t("reminders.permissionDeniedMessage"),
      });
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimeError("");

    if (!newLabel || !newTime) {
      toast({
        variant: "destructive",
        title: t("reminders.requiredFields"),
        description: t("reminders.requiredFieldsMessage"),
      });
      return;
    }

    // Check for duplicate time
    const duplicateTime = reminders.some(r => r.time === newTime);
    if (duplicateTime) {
      setTimeError(t("reminders.duplicateTime"));
      toast({
        variant: "destructive",
        title: t("reminders.duplicateTime"),
        description: t("reminders.duplicateTimeMessage"),
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("reminders").insert({
        user_id: user.id,
        label: newLabel,
        time: newTime,
        enabled: true,
      });

      if (error) throw error;

      toast({
        title: t("reminders.success"),
        description: t("reminders.successMessage"),
      });

      setNewLabel("");
      setNewTime("");
      loadReminders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("reminders.error"),
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickTemplates = [
    { label: t("reminders.templates.morningPrayer"), time: "06:00" },
    { label: t("reminders.templates.bibleReading"), time: "08:00" },
    { label: t("reminders.templates.lunchFast"), time: "12:00" },
    { label: t("reminders.templates.eveningPrayer"), time: "18:00" },
  ];

  const handleQuickTemplate = (label: string, time: string) => {
    setNewLabel(label);
    setNewTime(time);
    setTimeError("");
  };

  const handleToggleReminder = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("reminders")
        .update({ enabled })
        .eq("id", id);

      if (error) throw error;

      setReminders(reminders.map((r) => (r.id === id ? { ...r, enabled } : r)));

      toast({
        title: enabled ? t("reminders.enabled") : t("reminders.disabled"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("reminders.error"),
        description: error.message,
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      const { error } = await supabase.from("reminders").delete().eq("id", deleteId);

      if (error) throw error;

      toast({
        title: t("reminders.deleteSuccess"),
      });

      loadReminders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("reminders.deleteError"),
        description: error.message,
      });
    } finally {
      setDeleteId(null);
    }
  };

  // Filter reminders
  const filteredReminders = reminders.filter(r => {
    if (filter === "active") return r.enabled;
    if (filter === "inactive") return !r.enabled;
    return true;
  });

  // Statistics
  const stats = {
    total: reminders.length,
    active: reminders.filter(r => r.enabled).length,
    inactive: reminders.filter(r => !r.enabled).length,
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t("reminders.title")}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t("reminders.subtitle")}
          </p>
        </div>

        <Tabs defaultValue="manage" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="manage" className="gap-2">
              <Bell className="w-4 h-4" />
              {t("reminders.manageTab")}
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2">
              <Plus className="w-4 h-4" />
              {t("reminders.createTab")}
            </TabsTrigger>
          </TabsList>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            {/* Notification Permission Banner */}
            {isSupported && permission !== 'granted' && (
              <Card className="p-4 md:p-6 bg-primary/5 border-primary/20 animate-fade-in">
                <div className="flex items-start gap-3 md:gap-4">
                  <BellRing className="w-5 h-5 md:w-6 md:h-6 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm md:text-base">{t("reminders.enableNotifications")}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        {t("reminders.enableNotificationsMessage")}
                      </p>
                    </div>
                    <Button 
                      onClick={handleRequestPermission}
                      className="bg-primary hover:bg-primary/90 w-full md:w-auto"
                      size="sm"
                    >
                      <BellRing className="mr-2 w-4 h-4" />
                      {t("reminders.allowNotifications")}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {isSupported && permission === 'granted' && (
              <Card className="p-4 bg-success/10 border-success/30 animate-fade-in">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-success flex-shrink-0" />
                  <p className="text-sm text-success font-medium">
                    {t("reminders.notificationsEnabled")}
                  </p>
                </div>
              </Card>
            )}

            {!isSupported && (
              <Card className="p-4 bg-destructive/10 border-destructive/30">
                <div className="flex items-center gap-3">
                  <BellOff className="w-5 h-5 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive font-medium">
                    {t("reminders.notSupported")}
                  </p>
                </div>
              </Card>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("reminders.stats.total")}</p>
              </Card>
              <Card className="p-4 text-center bg-gradient-to-br from-success/5 to-success/10 border-success/20">
                <p className="text-2xl font-bold text-success">{stats.active}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("reminders.stats.active")}</p>
              </Card>
              <Card className="p-4 text-center bg-gradient-to-br from-muted/30 to-muted/50 border-muted">
                <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("reminders.stats.inactive")}</p>
              </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{t("reminders.filter")}</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                  className="flex-1"
                >
                  {t("reminders.filterAll")}
                </Button>
                <Button
                  variant={filter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("active")}
                  className="flex-1"
                >
                  {t("reminders.filterActive")}
                </Button>
                <Button
                  variant={filter === "inactive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("inactive")}
                  className="flex-1"
                >
                  {t("reminders.filterInactive")}
                </Button>
              </div>
            </Card>

            {/* Reminders list */}
            <Card className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <h2 className="text-base md:text-lg font-semibold text-foreground">
                    {t("reminders.myReminders")}
                  </h2>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {filteredReminders.length}
                </Badge>
              </div>

              {filteredReminders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    {filter === "all" ? t("reminders.noReminders") : t("reminders.noFilteredReminders")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {filter === "all" ? t("reminders.createFirstReminder") : t("reminders.tryDifferentFilter")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReminders.map((reminder) => (
                    <Card key={reminder.id} className="p-4 bg-background border-border hover:border-primary/50 transition-all duration-200 hover:shadow-md animate-fade-in">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate text-sm md:text-base">
                            {reminder.label}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="text-lg md:text-xl font-bold text-primary">
                              {reminder.time}
                            </span>
                            {reminder.enabled && (
                              <Badge variant="outline" className="text-xs border-success/30 text-success">
                                {t("reminders.active")}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Switch
                            checked={reminder.enabled}
                            onCheckedChange={(enabled) =>
                              handleToggleReminder(reminder.id, enabled)
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(reminder.id)}
                            className="h-9 w-9 hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-6"
>

            {/* Quick Templates */}
            <Card className="p-4 md:p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-base md:text-lg font-semibold text-foreground">{t("reminders.quickTemplates")}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickTemplates.map((template, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:bg-primary/10 hover:border-primary transition-all"
                    onClick={() => handleQuickTemplate(template.label, template.time)}
                  >
                    <span className="text-sm font-medium text-foreground">{template.label}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{template.time}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Add new reminder */}
            <Card className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <Plus className="w-5 h-5 text-primary" />
                <h2 className="text-base md:text-lg font-semibold text-foreground">{t("reminders.addNew")}</h2>
              </div>

              <form onSubmit={handleAddReminder} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="label" className="text-sm font-medium">{t("reminders.label")}</Label>
                  <Input
                    id="label"
                    placeholder={t("reminders.labelPlaceholder")}
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="text-sm font-medium">{t("reminders.time")}</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newTime}
                    onChange={(e) => {
                      setNewTime(e.target.value);
                      setTimeError("");
                    }}
                    className={`h-11 ${timeError ? "border-destructive" : ""}`}
                  />
                  {timeError && (
                    <p className="text-xs text-destructive">{timeError}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-primary hover:opacity-90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-pulse">{t("common.loading")}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 w-4 h-4" />
                      {t("reminders.add")}
                    </>
                  )}
                </Button>
              </form>
            </Card>

            {/* Info Card */}
            <Card className="p-4 bg-muted/50 border-muted-foreground/20">
              <div className="flex gap-3">
                <Bell className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {t("reminders.note")}
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("reminders.deleteConfirm")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("reminders.deleteMessage")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                {t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}