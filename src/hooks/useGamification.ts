import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

interface UserStats {
  current_streak: number;
  best_streak: number;
  total_days_completed: number;
  points: number;
  level: number;
  last_check_in: string | null;
}

export const useGamification = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create initial stats
        const { data: newStats } = await supabase
          .from("user_stats")
          .insert({ user_id: user.id })
          .select()
          .single();
        setStats(newStats);
      } else {
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const celebrateCompletion = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const updateStats = async (dayCompleted: boolean, fastCompleted: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !stats) return;

      const today = new Date().toISOString().split('T')[0];
      const lastCheckIn = stats.last_check_in;

      let newStreak = stats.current_streak;
      let newTotalDays = stats.total_days_completed;

      if (dayCompleted) {
        newTotalDays += 1;

        // Check if streak continues
        if (lastCheckIn) {
          const lastDate = new Date(lastCheckIn);
          const todayDate = new Date(today);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Consecutive day
            newStreak += 1;
          } else if (diffDays > 1) {
            // Streak broken
            newStreak = 1;
          }
          // If diffDays === 0, same day, don't change streak
        } else {
          // First check-in
          newStreak = 1;
        }

        const newBestStreak = Math.max(stats.best_streak, newStreak);
        const newPoints = stats.points + 10; // 10 points per day
        const newLevel = Math.floor(newPoints / 100) + 1;

        const updatedStats: UserStats = {
          current_streak: newStreak,
          best_streak: newBestStreak,
          total_days_completed: newTotalDays,
          points: newPoints,
          level: newLevel,
          last_check_in: today
        };

        await supabase
          .from("user_stats")
          .update(updatedStats)
          .eq("user_id", user.id);

        setStats(updatedStats);

        // Celebrate
        celebrateCompletion();
        
        // Send push notification for achievement
        if (fastCompleted || dayCompleted) {
          await sendAchievementNotification(updatedStats, fastCompleted);
        }
      }
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  };

  const sendAchievementNotification = async (stats: UserStats, fastCompleted: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let title = "🎉 Parabéns!";
      let body = "";

      if (fastCompleted) {
        body = `Você completou um jejum e ganhou ${stats.points} pontos!`;
      } else if (stats.current_streak > 1) {
        body = `Sequência de ${stats.current_streak} dias! Continue assim! 🔥`;
      } else {
        body = `Dia completado! +10 pontos. Continue firme! 💪`;
      }

      await supabase.functions.invoke('send-push-notification', {
        body: {
          title,
          body,
          icon: '/icon-512x512.png',
          url: '/',
          data: { type: 'achievement', stats }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
    } catch (error) {
      console.error('Error sending achievement notification:', error);
    }
  };

  return {
    stats,
    loading,
    updateStats,
    reloadStats: loadStats,
    celebrateCompletion
  };
};
