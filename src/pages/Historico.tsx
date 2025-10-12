import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Circle, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function Historico() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [activeFast, setActiveFast] = useState<any>(null);
  const [completedDays, setCompletedDays] = useState<any[]>([]);
  const [failedDays, setFailedDays] = useState<any[]>([]);
  const [currentMonth] = useState(new Date());

  const getDateFnsLocale = () => {
    switch (i18n.language) {
      case 'en': return enUS;
      case 'es': return es;
      default: return ptBR;
    }
  };

  const getWeekDays = () => {
    switch (i18n.language) {
      case 'en': return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      case 'es': return ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      default: return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    }
  };

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
        .eq("fast_id", fast.id)
        .order("date", { ascending: false });

      if (daysError) throw daysError;

      // Remove duplicates by keeping only the most recent entry for each date
      const uniqueDays = allDays?.reduce((acc: any[], day: any) => {
        const existingDay = acc.find((d) => d.date === day.date);
        if (!existingDay) {
          acc.push(day);
        }
        return acc;
      }, []) || [];

      setCompletedDays(uniqueDays.filter((d) => d.completed));
      setFailedDays(uniqueDays.filter((d) => !d.completed));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("history.error"),
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
          <p className="text-muted-foreground">{t("history.loading")}</p>
        </div>
      </Layout>
    );
  }

  if (!activeFast) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <h2 className="text-2xl font-bold mb-4 text-foreground">{t("history.noActiveFast")}</h2>
          <p className="text-muted-foreground mb-6">
            {t("history.noActiveFastMessage")}
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
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("history.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("history.subtitle")}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <Card className="p-4 border-l-4 border-l-success shadow-sm">
            <div className="flex flex-col items-center gap-2 text-center">
              <CheckCircle className="w-6 h-6 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{totalCompleted}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("history.completed")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-destructive shadow-sm">
            <div className="flex flex-col items-center gap-2 text-center">
              <XCircle className="w-6 h-6 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{totalFailed}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("history.notCompleted")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-muted shadow-sm">
            <div className="flex flex-col items-center gap-2 text-center">
              <Circle className="w-6 h-6 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-muted-foreground">{totalPending}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("history.pending")}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Calendar Card */}
        <Card className="p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              {t("history.fastCalendar")}
            </h2>
          </div>

          {/* Chip - Days from start */}
          {activeFast.days_completed_before_app > 0 && (
            <div className="mb-4 flex justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{activeFast.days_completed_before_app} {t("home.daysFromStart")}</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <h3 className="text-lg font-medium text-foreground capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: getDateFnsLocale() })}
            </h3>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-3 mb-3">
            {getWeekDays().map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-3">
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
                    "aspect-square flex flex-col items-center justify-center rounded-lg transition-all",
                    status === "completed" && "bg-success/20",
                    status === "failed" && "bg-destructive/20",
                    status === "pending" && "bg-muted",
                    isToday && "ring-2 ring-primary/30"
                  )}
                >
                  <span className={cn(
                    "text-sm font-medium mb-1",
                    status === "completed" && "text-success",
                    status === "failed" && "text-destructive",
                    status === "pending" && "text-muted-foreground"
                  )}>
                    {format(date, "d")}
                  </span>
                  <div>
                    {status === "completed" && <div className="w-1.5 h-1.5 rounded-full bg-success" />}
                    {status === "failed" && <div className="w-1.5 h-1.5 rounded-full bg-destructive" />}
                    {status === "pending" && <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">{t("history.legendCompleted")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-xs text-muted-foreground">{t("history.legendNotCompleted")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t("history.legendPending")}</span>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}