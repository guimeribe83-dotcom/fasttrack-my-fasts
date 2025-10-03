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
        "p-3 md:p-4 transition-all",
        isActive && "border-primary border-2 bg-primary/5",
        isCompleted && "bg-success-light border-success"
      )}
    >
      <div className="flex items-start justify-between mb-2 md:mb-3">
        <div className="flex-1">
          <h3 className="text-sm md:text-base font-semibold text-foreground">{name}</h3>
          <p className="text-xs md:text-sm text-muted-foreground">{totalDays} dias</p>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          {isCompleted ? (
            <span className="flex items-center gap-1 text-xs md:text-sm font-medium text-success">
              <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Concluído</span>
            </span>
          ) : isActive ? (
            <span className="text-xs md:text-sm font-medium text-primary">
              <span className="hidden sm:inline">Em Andamento</span>
              <span className="sm:hidden">Atual</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
              <Circle className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Não iniciado</span>
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1.5 md:space-y-2">
        <Progress value={percentage} className="h-1.5 md:h-2" />
        <p className="text-[10px] md:text-xs text-right text-muted-foreground">
          {completedDays} de {totalDays} dias
        </p>
      </div>
    </Card>
  );
};