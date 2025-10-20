import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

export const useLoginStreak = (userId: string | undefined) => {
  const { toast } = useToast();

  const calculateDayDifference = (lastDate: string, currentDate: string): number => {
    const last = new Date(lastDate);
    const current = new Date(currentDate);
    const diffTime = current.getTime() - last.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const showMilestoneToast = (streak: number) => {
    const milestones: Record<number, { title: string; emoji: string }> = {
      7: { title: "Você está em chamas! 🔥", emoji: "🔥" },
      30: { title: "Um mês completo! 🏆", emoji: "🏆" },
      100: { title: "Lendário! 💎", emoji: "💎" },
      365: { title: "Um ano completo! 👑", emoji: "👑" },
    };

    const milestone = milestones[streak];
    if (milestone) {
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#FF6B6B', '#FFA500', '#FFD700']
      });

      toast({
        title: milestone.title,
        description: `${streak} dias consecutivos acessando o app!`,
        duration: 5000,
      });
    }
  };

  const updateLoginStreak = async () => {
    if (!userId) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Buscar stats atuais
      const { data: stats, error: fetchError } = await supabase
        .from("user_stats")
        .select("login_streak, best_login_streak, last_login_date")
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching login streak:", fetchError);
        return;
      }

      const lastLogin = stats?.last_login_date;

      // Se já acessou hoje, não fazer nada
      if (lastLogin === today) return;

      let newStreak = 1;
      
      if (lastLogin) {
        const diffDays = calculateDayDifference(lastLogin, today);
        
        if (diffDays === 1) {
          // Dia consecutivo
          newStreak = (stats?.login_streak || 0) + 1;
        } else if (diffDays === 0) {
          // Mesmo dia (não deveria acontecer devido ao check acima)
          return;
        }
        // Se diffDays > 1, streak reseta para 1 (já definido acima)
      }

      const newBestStreak = Math.max(stats?.best_login_streak || 0, newStreak);

      // Atualizar banco
      const { error: updateError } = await supabase
        .from("user_stats")
        .update({
          login_streak: newStreak,
          best_login_streak: newBestStreak,
          last_login_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating login streak:", updateError);
        return;
      }

      // Celebrar marcos importantes
      if ([7, 30, 100, 365].includes(newStreak)) {
        showMilestoneToast(newStreak);
      }

      // Mensagem motivacional se perdeu a sequência
      if (lastLogin && calculateDayDifference(lastLogin, today) > 1 && stats?.best_login_streak > 1) {
        toast({
          title: "Sequência reiniciada",
          description: `Continue firme! Seu recorde é ${stats.best_login_streak} dias.`,
          duration: 4000,
        });
      }

    } catch (error) {
      console.error("Error in updateLoginStreak:", error);
    }
  };

  useEffect(() => {
    if (userId) {
      updateLoginStreak();
    }
  }, [userId]);

  return { updateLoginStreak };
};
