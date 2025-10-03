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
import { Bell, Plus, Trash2 } from "lucide-react";

interface Reminder {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
}

export default function Lembretes() {
  const navigate = useNavigate();
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
        title: "Erro ao carregar lembretes",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newLabel || !newTime) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha o rótulo e horário.",
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
        title: "Lembrete adicionado!",
        description: "Você receberá notificações neste horário.",
      });

      setNewLabel("");
      setNewTime("");
      loadReminders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar lembrete",
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
        title: enabled ? "Lembrete ativado" : "Lembrete desativado",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar lembrete",
        description: error.message,
      });
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      const { error } = await supabase.from("reminders").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Lembrete excluído",
      });

      loadReminders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir lembrete",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Lembretes</h1>
          <p className="text-muted-foreground">
            Configure notificações para não esquecer
          </p>
        </div>

        {/* Add new reminder */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Novo Lembrete</h2>
          </div>

          <form onSubmit={handleAddReminder} className="space-y-4">
            <div>
              <Label htmlFor="label">Rótulo</Label>
              <Input
                id="label"
                placeholder="Ex: Café da manhã, Almoço..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-primary">
              <Plus className="mr-2 w-4 h-4" />
              Adicionar Lembrete
            </Button>
          </form>
        </Card>

        {/* Reminders list */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Meus Lembretes ({reminders.length})
            </h2>
          </div>

          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Nenhum lembrete configurado</p>
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
            <strong>Nota:</strong> Os lembretes são apenas visuais nesta versão. Para receber
            notificações reais no seu dispositivo, você precisará conceder permissão quando
            solicitado pelo app.
          </p>
        </Card>
      </div>
    </Layout>
  );
}