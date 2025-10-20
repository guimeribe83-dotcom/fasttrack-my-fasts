import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProgressCircle } from "@/components/ProgressCircle";
import { BlockCard } from "@/components/BlockCard";
import { InstallPWA } from "@/components/InstallPWA";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { BibleFloatingButton } from "@/components/BibleFloatingButton";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { DailyContentCard } from "@/components/gamification/DailyContentCard";
import { BadgesDisplay } from "@/components/gamification/BadgesDisplay";
import EmotionalCheckIn from "@/components/EmotionalCheckIn";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Calendar, User, Book } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useGamification } from "@/hooks/useGamification";
import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
export default function Index() {
  const navigate = useNavigate();
  const {
    t,
    i18n
  } = useTranslation();
  const { stats, updateStats, reloadStats } = useGamification();
  const [loading, setLoading] = useState(true);
  const [activeFast, setActiveFast] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [completedDays, setCompletedDays] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInData, setCheckInData] = useState<any>(null);
  const [purpose, setPurpose] = useState<any>(null);
  const [purposeExpanded, setPurposeExpanded] = useState(false);
  
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

  const getDateFormat = () => {
    switch (i18n.language) {
      case 'en':
        return "EEEE, MMMM d";
      case 'es':
        return "EEEE, d 'de' MMMM";
      default:
        return "EEEE, d 'de' MMMM";
    }
  };
  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        const {
          data: profileData
        } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profileData) {
          setProfile(profileData);
          // Check if needs onboarding
          if (!profileData.onboarding_completed) {
            setShowOnboarding(true);
          }
        }
      }

      // Load active fast
      const {
        data: fast,
        error: fastError
      } = await supabase.from("fasts").select("*").eq("is_active", true).maybeSingle();
      if (fastError) throw fastError;
      if (!fast) {
        setLoading(false);
        return;
      }
      setActiveFast(fast);

      // Load purpose
      const { data: purposeData, error: purposeError } = await supabase
        .from("fast_purposes")
        .select("*")
        .eq("fast_id", fast.id)
        .maybeSingle();

      if (purposeError) console.error(purposeError);
      setPurpose(purposeData);

      // Load blocks
      const {
        data: blocksData,
        error: blocksError
      } = await supabase.from("fast_blocks").select("*").eq("fast_id", fast.id).order("order_index");
      if (blocksError) throw blocksError;
      setBlocks(blocksData || []);

      // Load completed days
      const {
        data: daysData,
        error: daysError
      } = await supabase.from("fast_days").select("*").eq("fast_id", fast.id).eq("completed", true);
      if (daysError) throw daysError;
      setCompletedDays(daysData || []);
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
    
    const today = format(new Date(), "yyyy-MM-dd");
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
        description: t("home.dayAlreadyMarked")
      });
      return;
    }
    
    // Open check-in modal
    setShowCheckIn(true);
  };

  const handleCheckInComplete = async (data: {
    feeling_rating: number;
    emotional_tags: string[];
    daily_note: string;
  }) => {
    if (!activeFast) return;
    
    try {
      const today = format(new Date(), "yyyy-MM-dd");

      // Find the active block to assign this day to
      let activeBlockId = null;
      let remainingDaysFromBeforeApp = activeFast.days_completed_before_app || 0;
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const blockDays = completedDays.filter(day => day.block_id === block.id);

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

      const { error } = await supabase.from("fast_days").insert({
        fast_id: activeFast.id,
        date: today,
        completed: true,
        block_id: activeBlockId,
        feeling_rating: data.feeling_rating || null,
        emotional_tags: data.emotional_tags,
        daily_note: data.daily_note || null,
      });

      if (error) throw error;

      // Check if fast is completed
      const newTotalCompleted = totalCompleted + 1;
      const fastCompleted = newTotalCompleted >= activeFast.total_days;

      // Update gamification stats
      await updateStats(true, fastCompleted);
      
      toast({
        title: t("common.success"),
        description: t("home.successMarked")
      });
      
      loadActiveFast();
      reloadStats();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("home.errorMarking"),
        description: error.message
      });
    }
  };
  if (loading) {
    return <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </Layout>;
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
  const today = format(new Date(), getDateFormat(), {
    locale: getDateFnsLocale()
  });
  const dayAlreadyCompleted = completedDays.some(day => day.date === format(new Date(), "yyyy-MM-dd"));
  
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    loadActiveFast();
  };

  const getPurposeIcon = (category: string) => {
    const icons: Record<string, string> = {
      healing: "❤️",
      guidance: "🧭",
      gratitude: "🙏",
      intercession: "🤲",
      deliverance: "⛓️‍💥",
      breakthrough: "⚡",
      other: "✨"
    };
    return icons[category] || "✨";
  };

  const getPurposeCategoryName = (category: string) => {
    const names: Record<string, string> = {
      healing: t("purpose.healing"),
      guidance: t("purpose.guidance"),
      gratitude: t("purpose.gratitude"),
      intercession: t("purpose.intercession"),
      deliverance: t("purpose.deliverance"),
      breakthrough: t("purpose.breakthrough"),
      other: t("purpose.other")
    };
    return names[category] || category;
  };

  return <Layout>
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}
      <InstallPWA />
      <PWAUpdatePrompt />
      <BibleFloatingButton />
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
        {/* Header - Mobile Only */}
        <div 
          className="flex items-center gap-3 md:hidden bg-card/50 p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-card hover:border-border transition-all active:scale-[0.98]"
          onClick={() => navigate("/perfil")}
        >
          <Avatar className="w-10 h-10 ring-2 ring-primary/20">
            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">
              {profile?.full_name || t("profile.guest")}
            </h1>
            <p className="text-xs text-muted-foreground capitalize">{today}</p>
          </div>
          <User className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Fast Title - Desktop */}
        <div className="hidden md:block">
          <p className="text-sm text-muted-foreground capitalize">{today}</p>
        </div>

        {/* Daily Content */}
        <DailyContentCard />

        {/* Spiritual Journal Card */}
        <Card 
          className="p-4 md:p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm cursor-pointer hover:shadow-md transition-all hover:-translate-y-1"
          onClick={() => navigate("/diario")}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Book className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {t("journal.cardTitle")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("journal.cardDescription")}
              </p>
            </div>
          </div>
        </Card>

        {/* Purpose Card */}
        {purpose && (
          <Card className="p-4 md:p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 shadow-sm">
            <div 
              className="cursor-pointer"
              onClick={() => setPurposeExpanded(!purposeExpanded)}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="text-3xl">{getPurposeIcon(purpose.category)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-semibold text-foreground">
                      {t("home.purposeTitle")}
                    </h3>
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      {getPurposeCategoryName(purpose.category)}
                    </span>
                  </div>
                  <p className={`text-sm text-muted-foreground leading-relaxed ${
                    purposeExpanded ? '' : 'line-clamp-2'
                  }`}>
                    {purpose.description}
                  </p>
                </div>
              </div>
              
              {purpose.description.length > 100 && (
                <button className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium mt-1">
                  {purposeExpanded ? t("common.showLess") : t("common.showMore")}
                </button>
              )}
            </div>
          </Card>
        )}

        {/* Progress Section */}
        <Card className="p-4 md:p-6 bg-gradient-to-br from-card to-card/50 border-border shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <div className="flex-shrink-0">
              <ProgressCircle 
                percentage={percentage} 
                size={120} 
                strokeWidth={8} 
              />
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <div className="text-center md:text-left">
                <h3 className="text-lg md:text-xl font-bold text-foreground mb-1">
                  {activeFast.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("home.progressDetails", { 
                    completed: totalCompleted, 
                    total: activeFast.total_days, 
                    remaining: daysRemaining 
                  })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1 rounded-md bg-primary/10">
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      {t("home.completed")}
                    </p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-primary">
                    {totalCompleted}
                  </p>
                </div>

                <div className="bg-success/5 rounded-xl p-3 border border-success/10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1 rounded-md bg-success/10">
                      <Calendar className="w-3.5 h-3.5 text-success" />
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      {t("history.pending")}
                    </p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-success">
                    {daysRemaining}
                  </p>
                </div>
              </div>

              {/* End Date Display */}
              {activeFast.start_date && (
                <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {t("home.fastEnds")}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {(() => {
                        const start = new Date(activeFast.start_date);
                        const end = new Date(start);
                        end.setDate(end.getDate() + activeFast.total_days);
                        return format(end, "dd/MM/yyyy");
                      })()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const start = new Date(activeFast.start_date);
                      const end = new Date(start);
                      end.setDate(end.getDate() + activeFast.total_days);
                      return format(end, "EEEE", { locale: getDateFnsLocale() });
                    })()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Blocks Section */}
        {blocks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base md:text-lg font-bold text-foreground">
                {t("home.stages")}
              </h3>
              <span className="text-xs text-muted-foreground">
                {blocks.filter(b => {
                  const blockDays = completedDays.filter(day => day.block_id === b.id);
                  let daysFromBeforeApp = 0;
                  let remainingDaysFromBeforeApp = activeFast.days_completed_before_app || 0;
                  for (let i = 0; i < blocks.length; i++) {
                    if (i < blocks.indexOf(b)) {
                      remainingDaysFromBeforeApp -= blocks[i].total_days;
                    } else if (i === blocks.indexOf(b)) {
                      daysFromBeforeApp = Math.min(Math.max(0, remainingDaysFromBeforeApp), b.total_days);
                    }
                  }
                  const totalBlockCompleted = blockDays.length + daysFromBeforeApp;
                  return b.manually_completed || totalBlockCompleted >= b.total_days;
                }).length} / {blocks.length} {t("home.completed")}
              </span>
            </div>
            
            <div className="grid gap-3">
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
          </div>
        )}

        {/* Badges Display */}
        <BadgesDisplay />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button 
            size="lg" 
            className="flex-1 h-12 text-sm font-semibold bg-gradient-success hover:opacity-90 shadow-sm transition-all active:scale-[0.98]" 
            onClick={handleCompleteDay} 
            disabled={dayAlreadyCompleted}
          >
            <CheckCircle className="mr-2 w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {dayAlreadyCompleted ? t("home.completed") : t("home.markAsCompleted")}
            </span>
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="h-12 px-4 md:px-6 shadow-sm transition-all active:scale-[0.98]" 
            onClick={() => navigate("/historico")}
          >
            <Calendar className="w-4 h-4 md:mr-2 flex-shrink-0" />
            <span className="hidden sm:inline ml-2">{t("menu.history")}</span>
          </Button>
        </div>
      </div>
      
      {/* Emotional Check-In Modal */}
      <EmotionalCheckIn 
        open={showCheckIn}
        onOpenChange={setShowCheckIn}
        onComplete={handleCheckInComplete}
      />
    </Layout>;
}