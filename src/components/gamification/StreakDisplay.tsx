import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, TrendingUp } from "lucide-react";

interface StreakDisplayProps {
  currentStreak: number;
  bestStreak: number;
  totalDays: number;
}

export const StreakDisplay = ({ currentStreak, bestStreak, totalDays }: StreakDisplayProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-background">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sequência Atual</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-orange-500">{currentStreak}</p>
                <p className="text-lg text-muted-foreground">dias</p>
              </div>
            </div>
            <Flame className="w-12 h-12 text-orange-500 animate-pulse" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Melhor Sequência</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-primary">{bestStreak}</p>
                <p className="text-lg text-muted-foreground">dias</p>
              </div>
            </div>
            <TrendingUp className="w-12 h-12 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Dias</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-green-500">{totalDays}</p>
                <p className="text-lg text-muted-foreground">dias</p>
              </div>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
