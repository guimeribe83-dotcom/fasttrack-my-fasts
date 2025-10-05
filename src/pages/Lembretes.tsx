import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Bell, Plus, Trash2, BellRing, BellOff } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "react-i18next";

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

    if (!newLabel || !newTime) {
      toast({
        variant: "destructive",
        title: t("reminders.requiredFields"),
        description: t("reminders.requiredFieldsMessage"),
      });
      return;
    }

    try {
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
    }
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

  const handleDeleteReminder = async (id: string) => {
    try {
      const { error } = await supabase.from("reminders").delete().eq("id", id);

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
    }
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
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("reminders.title")}</h1>
          <p className="text-muted-foreground">
            {t("reminders.subtitle")}
          </p>
        </div>

        {/* Notification Permission Banner */}
        {isSupported && permission !== 'granted' && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-4">
              <BellRing className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-foreground">{t("reminders.enableNotifications")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("reminders.enableNotificationsMessage")}
                </p>
                <Button 
                  onClick={handleRequestPermission}
                  className="bg-primary hover:bg-primary/90"
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
          <Card className="p-4 bg-success/5 border-success/20">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-success" />
              <p className="text-sm text-success font-medium">
                {t("reminders.notificationsEnabled")}
              </p>
            </div>
          </Card>
        )}

        {!isSupported && (
          <Card className="p-4 bg-destructive/5 border-destructive/20">
            <div className="flex items-center gap-3">
              <BellOff className="w-5 h-5 text-destructive" />
              <p className="text-sm text-destructive">
                {t("reminders.notSupported")}
              </p>
            </div>
          </Card>
        )}

        {/* Add new reminder */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{t("reminders.addNew")}</h2>
          </div>

          <form onSubmit={handleAddReminder} className="space-y-4">
            <div>
              <Label htmlFor="label">{t("reminders.label")}</Label>
              <Input
                id="label"
                placeholder={t("reminders.labelPlaceholder")}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="time">{t("reminders.time")}</Label>
              <Input
                id="time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-primary">
              <Plus className="mr-2 w-4 h-4" />
              {t("reminders.add")}
            </Button>
          </form>
        </Card>

        {/* Reminders list */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {t("reminders.myReminders")} ({reminders.length})
            </h2>
          </div>

          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">{t("reminders.noReminders")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <Card key={reminder.id} className="p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{reminder.label}</p>
                      <p className="text-sm text-muted-foreground">{reminder.time}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={reminder.enabled}
                        onCheckedChange={(enabled) =>
                          handleToggleReminder(reminder.id, enabled)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteReminder(reminder.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-muted border-muted-foreground/30">
          <p className="text-sm text-muted-foreground">
            {t("reminders.note")}
          </p>
        </Card>
      </div>
    </Layout>
  );
}