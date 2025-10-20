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

  const hasActiveFast = fasts.some(fast => fast.is_active);

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Gerenciar Jejuns</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Defina o jejum ativo, edite ou crie novos propósitos
            </p>
          </div>
          {!hasActiveFast && (
            <Button onClick={() => navigate("/novo-jejum")} className="bg-gradient-primary h-11 whitespace-nowrap">
              <Plus className="mr-2 w-4 h-4" />
              Criar Novo Jejum
            </Button>
          )}
        </div>

        {fasts.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Plus className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum jejum cadastrado</h3>
              <p className="text-sm text-muted-foreground mb-6">Comece criando seu primeiro jejum</p>
              <Button onClick={() => navigate("/novo-jejum")} className="bg-gradient-primary h-11">
                <Plus className="mr-2 w-4 h-4" />
                Criar Primeiro Jejum
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {fasts.map((fast) => {
              const completedDays = fast.fast_days?.[0]?.count || 0;
              const totalCompleted = completedDays + (fast.days_completed_before_app || 0);
              const percentage = Math.round((totalCompleted / fast.total_days) * 100);

              return (
                <Card 
                  key={fast.id} 
                  className={`p-4 md:p-6 transition-all hover:shadow-md ${
                    fast.is_active ? "border-primary border-2 bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Left side - Info */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg md:text-xl font-bold text-foreground">{fast.name}</h3>
                          {fast.is_active && (
                            <Badge className="bg-primary/90 text-white border-0">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Ativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {fast.total_days} dias • {new Date(fast.start_date).toLocaleDateString('pt-BR')} → {(() => {
                            const start = new Date(fast.start_date);
                            const end = new Date(start);
                            end.setDate(end.getDate() + fast.total_days);
                            return end.toLocaleDateString('pt-BR');
                          })()}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground font-medium">Progresso</span>
                          <span className="text-primary font-bold">{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {totalCompleted} de {fast.total_days} dias concluídos
                        </p>
                      </div>

                      {!fast.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetActive(fast.id)}
                          className="w-full md:w-auto h-9"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Tornar Ativo
                        </Button>
                      )}
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex md:flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/editar-jejum/${fast.id}`)}
                        className="h-9 w-9"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(fast.id)}
                        className="h-9 w-9"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">Excluir jejum?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed">
                Tem certeza que deseja excluir este jejum? Esta ação não pode ser desfeita.
                Todos os dias registrados e blocos serão removidos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="h-10">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 h-10">
                Excluir Jejum
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Botão Flutuante quando há jejum ativo */}
        {hasActiveFast && (
          <Button
            onClick={() => navigate("/novo-jejum")}
            size="lg"
            className="fixed bottom-20 md:bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 z-50"
          >
            <Plus className="w-6 h-6" />
          </Button>
        )}
      </div>
    </Layout>
  );
}