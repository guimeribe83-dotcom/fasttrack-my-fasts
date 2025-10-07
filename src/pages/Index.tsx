import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProgressCircle } from "@/components/ProgressCircle";
import { BlockCard } from "@/components/BlockCard";
import { InstallPWA } from "@/components/InstallPWA";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Calendar, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useLocalFasts } from "@/hooks/useLocalFasts";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/localDatabase";

export default function Index() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [completedDays, setCompletedDays] = useState<any[]>([]);
  
  // Use local database
  const { activeFast, createDay, getDaysForFast, getBlocksForFast } = useLocalFasts();
  const getDateFnsLocale = () => {
    switch (i18n.language) {
      case 'en':
        return enUS;
      case 'es':
        return es;
      default:
        return ptBR;
    }
  };

  // Reload data when activeFast changes
  useEffect(() => {
    if (activeFast) {
      loadActiveFast();
    } else {
      setLoading(false);
    }
  }, [activeFast?.id]);

  const loadActiveFast = async () => {
    try {
      setLoading(true);

      // activeFast comes from useLocalFasts hook
      if (!activeFast) {
        setLoading(false);
        return;
      }

      // Load blocks from local DB
      const blocksData = await getBlocksForFast(activeFast.id);
      setBlocks(blocksData || []);

      // Load completed days from local DB
      const daysData = await getDaysForFast(activeFast.id);
      setCompletedDays(daysData?.filter(d => d.completed) || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  const handleCompleteDay = async () => {
    if (!activeFast) return;
    try {
      const today = format(new Date(), "yyyy-MM-dd");

      // Check if day already exists in local DB
      const existingDay = await db.fast_days
        .where({ fast_id: activeFast.id, date: today })
        .first();

      if (existingDay) {
        toast({
          variant: "destructive",
          title: t("home.errorMarking"),
          description: t("home.dayAlreadyMarked")
        });
        return;
      }

      // Find the active block to assign this day to
      let activeBlockId = null;
      let remainingDaysFromBeforeApp = activeFast.days_completed_before_app || 0;
      
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const blockDays = completedDays.filter(day => day.block_id === block.id);

        let daysFromBeforeApp = 0;
        if (remainingDaysFromBeforeApp > 0) {
          daysFromBeforeApp = Math.min(remainingDaysFromBeforeApp, block.total_days);
          remainingDaysFromBeforeApp -= daysFromBeforeApp;
        }
        const totalBlockCompleted = blockDays.length + daysFromBeforeApp;

        if (!block.manually_completed && totalBlockCompleted < block.total_days) {
          activeBlockId = block.id;
          break;
        }
      }

      // Create day using local database
      await createDay({
        fast_id: activeFast.id,
        date: today,
        completed: true,
        block_id: activeBlockId
      });

      toast({
        title: t("common.success"),
        description: t("home.successMarked")
      });
      
      loadActiveFast();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("home.errorMarking"),
        description: error.message
      });
    }
  };
  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 md:hidden">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="hidden md:block">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Skeleton className="h-[140px] w-[140px] rounded-full" />
              <div className="flex-1 w-full space-y-4">
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </Card>
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-16 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }
  if (!activeFast) {
    return <Layout>
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          {/* Header - Mobile Only */}
          <div className="flex items-center gap-3 md:hidden mb-6">
            <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/perfil")}>
              <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-base font-semibold text-foreground">
                {profile?.full_name || t("profile.guest")}
              </h1>
              <p className="text-xs text-muted-foreground">{t("home.noActiveFast")}</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h2 className="text-2xl font-bold mb-4 text-foreground">{t("home.noActiveFast")}</h2>
            <p className="text-muted-foreground mb-6 text-center">
              {t("home.noActiveFastMessage")}
            </p>
            <Button onClick={() => navigate("/novo-jejum")}>{t("home.createFast")}</Button>
          </div>
        </div>
      </Layout>;
  }
  const totalCompleted = completedDays.length + (activeFast.days_completed_before_app || 0);
  const daysRemaining = activeFast.total_days - totalCompleted;
  const percentage = Math.round(totalCompleted / activeFast.total_days * 100);
  const today = format(new Date(), "EEEE, d 'de' MMMM", {
    locale: getDateFnsLocale()
  });
  const dayAlreadyCompleted = completedDays.some(day => day.date === format(new Date(), "yyyy-MM-dd"));
  return <Layout>
      <InstallPWA />
      <PWAUpdatePrompt />
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
        {/* Header - Mobile Only */}
        <div className="flex items-center gap-3 md:hidden">
          <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/perfil")}>
            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              {profile?.full_name || t("profile.guest")}
            </h1>
            <p className="text-xs text-muted-foreground capitalize">{today}</p>
          </div>
        </div>

        {/* Fast Title - Desktop */}
        <div className="hidden md:block">
          
          <p className="text-sm text-muted-foreground capitalize">{today}</p>
        </div>

        {/* Progress Section */}
        <Card className="p-4 md:p-6 bg-card border-border shadow-none">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <ProgressCircle percentage={percentage} size={140} strokeWidth={10} />
            </div>
            
            <div className="flex-1 w-full">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {activeFast.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {totalCompleted} de {activeFast.total_days} dias · {daysRemaining} restantes
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("home.completed")}</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">{totalCompleted}</p>
                </div>

                <div className="bg-success/5 rounded-lg p-3 border border-success/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-success" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("history.pending")}</p>
                  </div>
                  <p className="text-2xl font-bold text-success">{daysRemaining}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Blocks Section */}
        {blocks.length > 0 && <div className="space-y-3">
            <h3 className="text-base md:text-lg font-semibold text-foreground">
              {t("home.stages")}
            </h3>
            <div className="grid gap-2.5">
              {blocks.map((block, blockIndex) => {
            const blockDays = completedDays.filter(day => day.block_id === block.id);

            // Calculate how many days from days_completed_before_app belong to this block
            let daysFromBeforeApp = 0;
            let remainingDaysFromBeforeApp = activeFast.days_completed_before_app || 0;

            // Distribute days_completed_before_app across blocks in order
            for (let i = 0; i < blocks.length; i++) {
              if (i < blockIndex) {
                // For previous blocks, subtract their full total
                remainingDaysFromBeforeApp -= blocks[i].total_days;
              } else if (i === blockIndex) {
                // For current block, take remaining days (up to block's total)
                daysFromBeforeApp = Math.min(Math.max(0, remainingDaysFromBeforeApp), block.total_days);
              }
            }
            const totalBlockCompleted = blockDays.length + daysFromBeforeApp;
            const isCompleted = block.manually_completed || totalBlockCompleted >= block.total_days;

            // Find first incomplete block
            let firstIncompleteIndex = -1;
            for (let i = 0; i < blocks.length; i++) {
              const bDays = completedDays.filter(day => day.block_id === blocks[i].id);
              let bDaysFromBeforeApp = 0;
              let bRemainingDaysFromBeforeApp = activeFast.days_completed_before_app || 0;
              for (let j = 0; j < blocks.length; j++) {
                if (j < i) {
                  bRemainingDaysFromBeforeApp -= blocks[j].total_days;
                } else if (j === i) {
                  bDaysFromBeforeApp = Math.min(Math.max(0, bRemainingDaysFromBeforeApp), blocks[i].total_days);
                }
              }
              const bTotalCompleted = bDays.length + bDaysFromBeforeApp;
              if (!blocks[i].manually_completed && bTotalCompleted < blocks[i].total_days) {
                firstIncompleteIndex = i;
                break;
              }
            }
            const isActive = blockIndex === firstIncompleteIndex;
            return <BlockCard key={block.id} name={block.name} totalDays={block.total_days} completedDays={totalBlockCompleted} isCompleted={isCompleted} isActive={isActive} />;
          })}
            </div>
          </div>}

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <Button size="lg" className="flex-1 h-11 md:h-12 text-sm font-medium bg-gradient-success hover:opacity-90 shadow-none" onClick={handleCompleteDay} disabled={dayAlreadyCompleted}>
            <CheckCircle className="mr-2 w-4 h-4" />
            {dayAlreadyCompleted ? t("home.completed") : t("home.markAsCompleted")}
          </Button>
          <Button size="lg" variant="outline" className="h-11 md:h-12 px-4 shadow-none" onClick={() => navigate("/historico")}>
            <Calendar className="mr-0 md:mr-2 w-4 h-4" />
            <span className="hidden md:inline">{t("menu.history")}</span>
          </Button>
        </div>
      </div>
    </Layout>;
}