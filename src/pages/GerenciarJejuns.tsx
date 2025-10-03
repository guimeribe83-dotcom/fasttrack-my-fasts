import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Star, Edit, Trash2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function GerenciarJejuns() {
  const navigate = useNavigate();
  const [fasts, setFasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    loadFasts();
  };

  const loadFasts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("fasts")
        .select(`
          *,
          fast_days(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFasts(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar jejuns",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      // Deactivate all fasts
      await supabase
        .from("fasts")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      // Activate selected fast
      const { error } = await supabase
        .from("fasts")
        .update({ is_active: true })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Jejum ativado!",
        description: "Este jejum agora está ativo.",
      });

      loadFasts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao ativar jejum",
        description: error.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("fasts")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Jejum excluído",
        description: "O jejum foi removido com sucesso.",
      });

      loadFasts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir jejum",
        description: error.message,
      });
    } finally {
      setDeleteId(null);
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
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Jejuns</h1>
            <p className="text-muted-foreground">
              Defina o jejum ativo, edite ou crie novos propósitos
            </p>
          </div>
          <Button onClick={() => navigate("/novo-jejum")}>
            <Plus className="mr-2 w-4 h-4" />
            Criar Novo Jejum
          </Button>
        </div>

        {fasts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhum jejum cadastrado ainda</p>
            <Button onClick={() => navigate("/novo-jejum")}>
              Criar Primeiro Jejum
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {fasts.map((fast) => {
              const completedDays = fast.fast_days?.[0]?.count || 0;
              const totalCompleted = completedDays + (fast.days_completed_before_app || 0);
              const percentage = Math.round((totalCompleted / fast.total_days) * 100);

              return (
                <Card key={fast.id} className={`p-6 ${fast.is_active ? "border-primary border-2" : ""}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-foreground">{fast.name}</h3>
                        {fast.is_active && (
                          <Badge variant="default" className="bg-primary">
                            <Star className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {fast.total_days} dias
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/editar-jejum/${fast.id}`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(fast.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium text-primary">{percentage}%</span>
                      </div>
                      <Progress value={percentage} />
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {totalCompleted} de {fast.total_days} dias concluídos
                    </p>

                    {!fast.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(fast.id)}
                        className="w-full"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Tornar Ativo
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir jejum</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este jejum? Esta ação não pode ser desfeita.
                Todos os dias registrados e blocos serão removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}