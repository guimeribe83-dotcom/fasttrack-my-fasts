import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5" />
            {t("profile.badges")}
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
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {t("profile.badges")}
          </CardTitle>
          <BadgeUI variant="secondary" className="text-xs">
            {earnedCount}/{totalCount}
          </BadgeUI>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
          {allBadges.map((badge) => {
            const earned = isBadgeEarned(badge.id);
            return (
              <div
                key={badge.id}
                className={`flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-lg border-2 transition-all ${
                  earned
                    ? "border-primary bg-primary/5 scale-105"
                    : "border-muted bg-muted/5 opacity-50 grayscale"
                }`}
                title={`${badge.name}: ${badge.description}`}
              >
                <span className="text-2xl md:text-3xl">{badge.icon}</span>
                <span className="text-[10px] md:text-xs text-center font-medium line-clamp-2 leading-tight">
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
