import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Circle, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Historico() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeFast, setActiveFast] = useState<any>(null);
  const [completedDays, setCompletedDays] = useState<any[]>([]);
  const [failedDays, setFailedDays] = useState<any[]>([]);
  const [currentMonth] = useState(new Date());

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: fast, error: fastError } = await supabase
        .from("fasts")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (fastError) throw fastError;
      setActiveFast(fast);

      if (!fast) {
        setLoading(false);
        return;
      }

      const { data: allDays, error: daysError } = await supabase
        .from("fast_days")
        .select("*")
        .eq("fast_id", fast.id);

      if (daysError) throw daysError;

      setCompletedDays(allDays?.filter((d) => d.completed) || []);
      setFailedDays(allDays?.filter((d) => !d.completed) || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar histórico",
        description: error.message,
      });
    } finally {
      setLoading(false);
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
          <p className="text-muted-foreground mb-6">
            Crie um jejum para visualizar o histórico.
          </p>
        </div>
      </Layout>
    );
  }

  const totalCompleted = completedDays.length + (activeFast.days_completed_before_app || 0);
  const totalFailed = failedDays.length;
  const totalPending = activeFast.total_days - totalCompleted - totalFailed;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (completedDays.some((d) => d.date === dateStr)) return "completed";
    if (failedDays.some((d) => d.date === dateStr)) return "failed";
    return "pending";
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Histórico</h1>
          <p className="text-sm md:text-base text-muted-foreground">Acompanhe seus dias</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Card className="p-3 md:p-4 bg-success/5 border-success/20">
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-success" />
              <div>
                <p className="text-lg md:text-2xl font-bold text-success">{totalCompleted}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 bg-destructive/5 border-destructive/20">
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
              <XCircle className="w-5 h-5 md:w-6 md:h-6 text-destructive" />
              <div>
                <p className="text-lg md:text-2xl font-bold text-destructive">{totalFailed}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Não Concluídos</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 bg-muted/30 border-muted-foreground/20">
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
              <Circle className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
              <div>
                <p className="text-lg md:text-2xl font-bold text-muted-foreground">{totalPending}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Note */}
        {totalCompleted < activeFast.total_days && (
          <Card className="p-3 md:p-4 bg-primary/5 border-primary/20">
            <p className="text-xs md:text-sm">
              <strong>1º dia já concluído:</strong> Antes de usar o app
            </p>
          </Card>
        )}

        {/* Calendar */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              Calendário do Jejum
            </h2>
          </div>

          <div className="mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-medium text-foreground capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h3>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div key={day} className="text-center text-xs md:text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {daysInMonth.map((date) => {
              const status = getDayStatus(date);
              const isToday = isSameDay(date, new Date());

              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center rounded-md md:rounded-lg border transition-all",
                    status === "completed" && "bg-success/10 border-success/30",
                    status === "failed" && "bg-destructive/10 border-destructive/30",
                    status === "pending" && "border-border/50 bg-muted/20",
                    isToday && "ring-1 ring-primary/50"
                  )}
                >
                  <span className={cn(
                    "text-[10px] md:text-xs font-medium",
                    status === "completed" && "text-success",
                    status === "failed" && "text-destructive",
                    status === "pending" && "text-muted-foreground"
                  )}>
                    {format(date, "d")}
                  </span>
                  <div className="mt-0.5 md:mt-1">
                    {status === "completed" && <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-success" />}
                    {status === "failed" && <XCircle className="w-3 h-3 md:w-4 md:h-4 text-destructive" />}
                    {status === "pending" && <Circle className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground/50" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-4 md:mt-6 pt-4 md:pt-6 border-t">
            <div className="flex items-center gap-1.5 md:gap-2">
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-success" />
              <span className="text-xs md:text-sm text-muted-foreground">Concluído</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <XCircle className="w-3 h-3 md:w-4 md:h-4 text-destructive" />
              <span className="text-xs md:text-sm text-muted-foreground">Não Concluído</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <Circle className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground/50" />
              <span className="text-xs md:text-sm text-muted-foreground">Pendente</span>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}