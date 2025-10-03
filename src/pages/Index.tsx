import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProgressCircle } from "@/components/ProgressCircle";
import { BlockCard } from "@/components/BlockCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Index() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeFast, setActiveFast] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [completedDays, setCompletedDays] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    loadActiveFast();
  };

  const loadActiveFast = async () => {
    try {
      setLoading(true);
      
      // Load active fast
      const { data: fast, error: fastError } = await supabase
        .from("fasts")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (fastError) throw fastError;

      if (!fast) {
        setLoading(false);
        return;
      }

      setActiveFast(fast);

      // Load blocks
      const { data: blocksData, error: blocksError } = await supabase
        .from("fast_blocks")
        .select("*")
        .eq("fast_id", fast.id)
        .order("order_index");

      if (blocksError) throw blocksError;
      setBlocks(blocksData || []);

      // Load completed days
      const { data: daysData, error: daysError } = await supabase
        .from("fast_days")
        .select("*")
        .eq("fast_id", fast.id)
        .eq("completed", true);

      if (daysError) throw daysError;
      setCompletedDays(daysData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar jejum",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDay = async () => {
    if (!activeFast) return;

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { error } = await supabase
        .from("fast_days")
        .insert({
          fast_id: activeFast.id,
          date: today,
          completed: true,
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            variant: "destructive",
            title: "Dia já registrado",
            description: "Você já registrou o dia de hoje!",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Dia registrado!",
        description: "Parabéns por manter seu jejum!",
      });

      loadActiveFast();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar dia",
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

  if (!activeFast) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Nenhum jejum ativo</h2>
          <p className="text-muted-foreground mb-6 text-center">
            Comece criando seu primeiro jejum para acompanhar seu progresso espiritual.
          </p>
          <Button onClick={() => navigate("/novo-jejum")}>Criar Jejum</Button>
        </div>
      </Layout>
    );
  }

  const totalCompleted = completedDays.length + (activeFast.days_completed_before_app || 0);
  const daysRemaining = activeFast.total_days - totalCompleted;
  const percentage = Math.round((totalCompleted / activeFast.total_days) * 100);

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const dayAlreadyCompleted = completedDays.some(
    (day) => day.date === format(new Date(), "yyyy-MM-dd")
  );

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Bem-vindo de volta! 👋
          </h1>
          <p className="text-muted-foreground capitalize">{today}</p>
        </div>

        {/* Progress Section */}
        <Card className="p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <ProgressCircle percentage={percentage} />
            
            <div className="flex-1 space-y-6 w-full">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  {activeFast.name}
                </h2>
                <p className="text-muted-foreground">Seu jejum está em andamento</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">CONCLUÍDOS</p>
                      <p className="text-3xl font-bold text-primary">{totalCompleted}</p>
                      <p className="text-xs text-muted-foreground">de {activeFast.total_days} dias</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-success/5 border-success/20">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-success" />
                    <div>
                      <p className="text-sm text-muted-foreground">FALTAM</p>
                      <p className="text-3xl font-bold text-success">{daysRemaining}</p>
                      <p className="text-xs text-muted-foreground">dias restantes</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Card>

        {/* Blocks Section */}
        {blocks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Etapas do Jejum
            </h3>
            <div className="grid gap-4">
              {blocks.map((block) => {
                const blockDays = completedDays.filter(
                  (day) => day.block_id === block.id
                );
                const isCompleted = block.manually_completed || blockDays.length >= block.total_days;
                const isActive = !isCompleted && blocks.findIndex((b) => !b.manually_completed) === blocks.indexOf(block);
                
                return (
                  <BlockCard
                    key={block.id}
                    name={block.name}
                    totalDays={block.total_days}
                    completedDays={blockDays.length}
                    isCompleted={isCompleted}
                    isActive={isActive}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-4">
          <Button
            size="lg"
            className="flex-1 h-14 text-lg bg-gradient-success hover:opacity-90"
            onClick={handleCompleteDay}
            disabled={dayAlreadyCompleted}
          >
            <CheckCircle className="mr-2 w-5 h-5" />
            {dayAlreadyCompleted ? "Dia Já Registrado" : "Registrar Dia Concluído"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14"
            onClick={() => navigate("/historico")}
          >
            <Calendar className="mr-2 w-5 h-5" />
            Histórico
          </Button>
        </div>
      </div>
    </Layout>
  );
}