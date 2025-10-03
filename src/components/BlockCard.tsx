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
        "p-4 transition-all",
        isActive && "border-primary border-2 bg-primary/5",
        isCompleted && "bg-success-light border-success"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{totalDays} dias</p>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="flex items-center gap-1 text-sm font-medium text-success">
              <CheckCircle2 className="w-4 h-4" />
              Concluído
            </span>
          ) : isActive ? (
            <span className="text-sm font-medium text-primary">Em Andamento</span>
          ) : (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Circle className="w-4 h-4" />
              Não iniciado
            </span>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-right text-muted-foreground">
          {completedDays} de {totalDays} dias
        </p>
      </div>
    </Card>
  );
};