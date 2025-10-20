import { Flame } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LoginStreakFloatingBadgeProps {
  streak: number;
}

export const LoginStreakFloatingBadge = ({ streak }: LoginStreakFloatingBadgeProps) => {
  const { t } = useTranslation();

  if (streak === 0) return null;

  return (
    <div 
      className="md:hidden fixed bottom-20 left-4 z-40 animate-scale-in"
      aria-label={`${streak} ${t("days", { defaultValue: "dias" })}`}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-background/95 backdrop-blur border border-orange-500/20 shadow-lg">
        <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" />
        <span className="text-sm font-bold text-foreground">{streak}</span>
      </div>
    </div>
  );
};
