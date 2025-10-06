import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockCardProps {
  name: string;
  totalDays: number;
  completedDays: number;
  isCompleted: boolean;
  isActive: boolean;
}

export const BlockCard = ({ 
  name, 
  totalDays, 
  completedDays, 
  isCompleted,
  isActive 
}: BlockCardProps) => {
  const percentage = (completedDays / totalDays) * 100;

  return (
    <Card 
      className={cn(
        "p-4 transition-all border shadow-none bg-card",
        isActive && "border-primary/30 bg-primary/[0.03]",
        isCompleted && "border-success/30 bg-success/[0.03]"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-foreground truncate">{name}</h3>
            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />}
            {isActive && !isCompleted && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                Atual
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{totalDays} dias</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-medium text-foreground mb-1">{completedDays}/{totalDays}</p>
          <p className="text-[10px] text-muted-foreground">{Math.round(percentage)}%</p>
        </div>
      </div>
      <Progress 
        value={percentage} 
        className={cn(
          "h-1.5 mt-3",
          isActive && "[&>div]:bg-primary",
          isCompleted && "[&>div]:bg-success"
        )} 
      />
    </Card>
  );
};