import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { Badge as BadgeUI } from "@/components/ui/badge";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_value: number;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
}

export const BadgesDisplay = () => {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all badges
      const { data: badges } = await supabase
        .from("badges")
        .select("*")
        .order("requirement_value", { ascending: true });

      // Load earned badges
      const { data: earned } = await supabase
        .from("user_badges")
        .select("badge_id, earned_at")
        .eq("user_id", user.id);

      setAllBadges(badges || []);
      setEarnedBadges(earned || []);
    } catch (error) {
      console.error("Error loading badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const isBadgeEarned = (badgeId: string) => {
    return earnedBadges.some(eb => eb.badge_id === badgeId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const earnedCount = earnedBadges.length;
  const totalCount = allBadges.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Conquistas
          </CardTitle>
          <BadgeUI variant="secondary">
            {earnedCount}/{totalCount}
          </BadgeUI>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {allBadges.map((badge) => {
            const earned = isBadgeEarned(badge.id);
            return (
              <div
                key={badge.id}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  earned
                    ? "border-primary bg-primary/5 scale-105"
                    : "border-muted bg-muted/5 opacity-50 grayscale"
                }`}
                title={`${badge.name}: ${badge.description}`}
              >
                <span className="text-3xl">{badge.icon}</span>
                <span className="text-xs text-center font-medium line-clamp-2">
                  {badge.name}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
