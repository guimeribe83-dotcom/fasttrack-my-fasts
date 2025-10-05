import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProgressCircle } from "@/components/ProgressCircle";
import { BlockCard } from "@/components/BlockCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Calendar, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";

export default function Index() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [activeFast, setActiveFast] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [completedDays, setCompletedDays] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const getDateFnsLocale = () => {
    switch (i18n.language) {
      case 'en': return enUS;
      case 'es': return es;
      default: return ptBR;
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
    loadActiveFast();
  };

  const loadActiveFast = async () => {
    try {
      setLoading(true);
      
      // Load user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profileData) setProfile(profileData);
      }
      
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
        title: t("common.error"),
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
      
      // Check if day already exists
      const { data: existingDay } = await supabase
        .from("fast_days")
        .select("id")
        .eq("fast_id", activeFast.id)
        .eq("date", today)
        .maybeSingle();

      if (existingDay) {
        toast({
          variant: "destructive",
          title: t("home.errorMarking"),
          description: t("home.dayAlreadyMarked"),
        });
        return;
      }

      // Find the active block to assign this day to
      let activeBlockId = null;
      let remainingDaysFromBeforeApp = activeFast.days_completed_before_app || 0;

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const blockDays = completedDays.filter((day) => day.block_id === block.id);
        
        // Calculate days from before app for this block
        let daysFromBeforeApp = 0;
        if (remainingDaysFromBeforeApp > 0) {
          daysFromBeforeApp = Math.min(remainingDaysFromBeforeApp, block.total_days);
          remainingDaysFromBeforeApp -= daysFromBeforeApp;
        }
        
        const totalBlockCompleted = blockDays.length + daysFromBeforeApp;
        
        // If this block is not complete and not manually completed, it's the active one
        if (!block.manually_completed && totalBlockCompleted < block.total_days) {
          activeBlockId = block.id;
          break;
        }
      }
      
      const { error } = await supabase
        .from("fast_days")
        .insert({
          fast_id: activeFast.id,
          date: today,
          completed: true,
          block_id: activeBlockId,
        });

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("home.successMarked"),
      });

      loadActiveFast();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("home.errorMarking"),
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

  if (!activeFast) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <h2 className="text-2xl font-bold mb-4 text-foreground">{t("home.noActiveFast")}</h2>
          <p className="text-muted-foreground mb-6 text-center">
            {t("home.noActiveFastMessage")}
          </p>
          <Button onClick={() => navigate("/novo-jejum")}>{t("home.createFast")}</Button>
        </div>
      </Layout>
    );
  }

  const totalCompleted = completedDays.length + (activeFast.days_completed_before_app || 0);
  const daysRemaining = activeFast.total_days - totalCompleted;
  const percentage = Math.round((totalCompleted / activeFast.total_days) * 100);

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: getDateFnsLocale() });
  const dayAlreadyCompleted = completedDays.some(
    (day) => day.date === format(new Date(), "yyyy-MM-dd")
  );

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
        {/* Welcome Header with Avatar */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm md:text-base text-muted-foreground">
              {t("profile.welcome")}
            </p>
            <h1 className="text-xl md:text-3xl font-bold text-foreground">
              {profile?.full_name || t("profile.guest")}!
            </h1>
          </div>
          <Avatar 
            className="w-12 h-12 md:w-16 md:h-16 border-2 border-primary/20 cursor-pointer hover:border-primary transition-colors" 
            onClick={() => navigate("/perfil")}
          >
            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg md:text-2xl">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : <User className="w-6 h-6 md:w-8 md:h-8" />}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Fast Title */}
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-foreground mb-1">
            {activeFast.name}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground capitalize">{today}</p>
        </div>

        {/* Progress Section */}
        <Card className="p-4 md:p-8">
          <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-8">
            <ProgressCircle percentage={percentage} />
            
            <div className="flex-1 space-y-4 md:space-y-6 w-full">
              <div>
                <h2 className="text-xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">
                  {t("home.progress")}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">{t("home.daysCompleted", { count: totalCompleted, total: activeFast.total_days })}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <Card className="p-3 md:p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 md:gap-3">
                    <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] md:text-sm text-muted-foreground font-medium uppercase">{t("home.completed")}</p>
                      <p className="text-2xl md:text-3xl font-bold text-primary">{totalCompleted}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">{t("home.daysCompleted", { count: totalCompleted, total: activeFast.total_days })}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-3 md:p-4 bg-success/5 border-success/20">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Calendar className="w-6 h-6 md:w-8 md:h-8 text-success flex-shrink-0" />
                    <div>
                      <p className="text-[10px] md:text-sm text-muted-foreground font-medium uppercase">{t("history.pending")}</p>
                      <p className="text-2xl md:text-3xl font-bold text-success">{daysRemaining}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">{t("home.days")}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Card>

        {/* Blocks Section */}
        {blocks.length > 0 && (
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 md:w-6 md:h-6" />
              {t("home.stages")}
            </h3>
            <div className="grid gap-4">
              {blocks.map((block, blockIndex) => {
                const blockDays = completedDays.filter(
                  (day) => day.block_id === block.id
                );
                
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
                    daysFromBeforeApp = Math.min(
                      Math.max(0, remainingDaysFromBeforeApp),
                      block.total_days
                    );
                  }
                }
                
                const totalBlockCompleted = blockDays.length + daysFromBeforeApp;
                const isCompleted = block.manually_completed || totalBlockCompleted >= block.total_days;
                
                // Find first incomplete block
                let firstIncompleteIndex = -1;
                for (let i = 0; i < blocks.length; i++) {
                  const bDays = completedDays.filter((day) => day.block_id === blocks[i].id);
                  let bDaysFromBeforeApp = 0;
                  let bRemainingDaysFromBeforeApp = activeFast.days_completed_before_app || 0;
                  
                  for (let j = 0; j < blocks.length; j++) {
                    if (j < i) {
                      bRemainingDaysFromBeforeApp -= blocks[j].total_days;
                    } else if (j === i) {
                      bDaysFromBeforeApp = Math.min(
                        Math.max(0, bRemainingDaysFromBeforeApp),
                        blocks[i].total_days
                      );
                    }
                  }
                  
                  const bTotalCompleted = bDays.length + bDaysFromBeforeApp;
                  if (!blocks[i].manually_completed && bTotalCompleted < blocks[i].total_days) {
                    firstIncompleteIndex = i;
                    break;
                  }
                }
                
                const isActive = blockIndex === firstIncompleteIndex;
                
                return (
                  <BlockCard
                    key={block.id}
                    name={block.name}
                    totalDays={block.total_days}
                    completedDays={totalBlockCompleted}
                    isCompleted={isCompleted}
                    isActive={isActive}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-3 md:gap-4">
          <Button
            size="lg"
            className="flex-1 h-12 md:h-14 text-sm md:text-lg bg-gradient-success hover:opacity-90"
            onClick={handleCompleteDay}
            disabled={dayAlreadyCompleted}
          >
            <CheckCircle className="mr-1.5 md:mr-2 w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">{dayAlreadyCompleted ? t("home.completed") : t("home.markAsCompleted")}</span>
            <span className="sm:hidden">{dayAlreadyCompleted ? t("home.completed") : t("home.markAsCompleted")}</span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 md:h-14 px-3 md:px-4"
            onClick={() => navigate("/historico")}
          >
            <Calendar className="mr-0 md:mr-2 w-5 h-5" />
            <span className="hidden md:inline">{t("menu.history")}</span>
          </Button>
        </div>
      </div>
    </Layout>
  );
}