import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { Badge as BadgeUI } from "@/components/ui/badge";
import i18n from "@/i18n/config";

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

const BadgesDisplay = () => {
  const t = i18n.t.bind(i18n);
  const [allBadges, setAllBadges] = React.useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = React.useState<UserBadge[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3 md:gap-4">
          {allBadges.map((badge) => {
            const earned = isBadgeEarned(badge.id);
            return (
              <div
                key={badge.id}
                className={`w-full aspect-square relative flex flex-col items-center justify-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-lg border-2 transition-all overflow-hidden ${
                  earned
                    ? "border-primary bg-primary/5 ring-1 ring-primary/10"
                    : "border-muted bg-muted/5 opacity-60 grayscale"
                }`}
                title={`${badge.name}: ${badge.description}`}
              >
                <span className="text-2xl md:text-3xl pointer-events-none">{badge.icon}</span>
                <span className="hidden sm:block w-full px-1 text-[10px] md:text-xs text-center font-medium leading-tight break-words overflow-hidden max-h-8 md:max-h-10">
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

export { BadgesDisplay };
