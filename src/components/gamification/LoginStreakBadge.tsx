import { Flame } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LoginStreakBadgeProps {
  streak: number;
}

export const LoginStreakBadge = ({ streak }: LoginStreakBadgeProps) => {
  const { t } = useTranslation();

  if (streak === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 transition-all hover:bg-primary/15">
      <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" />
      <div className="flex flex-col leading-none">
        <span className="text-xs font-bold text-foreground">{streak}</span>
        <span className="text-[10px] text-muted-foreground">{t("days", { defaultValue: "dias" })}</span>
      </div>
    </div>
  );
};
