import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { PersonalizedPrayerModal } from "./PersonalizedPrayerModal";
import type { PrayerData } from "@/lib/prayerFallbacks";

interface PersonalizedPrayerProps {
  prayer: PrayerData | null;
  onRegenerate?: () => void;
  isLoading?: boolean;
}

export const PersonalizedPrayer = ({ prayer, onRegenerate, isLoading }: PersonalizedPrayerProps) => {
  const [showModal, setShowModal] = useState(false);

  if (!prayer && !isLoading) return null;

  if (isLoading) {
    return (
      <Card className="p-4 md:p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 shadow-lg animate-pulse">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-amber-500/20">
            <Sparkles className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="h-5 bg-amber-500/20 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-amber-500/10 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4 md:p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-amber-500/20 animate-pulse">
            <Sparkles className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground mb-1">
              Sua Oração Personalizada
            </h3>
            <p className="text-sm text-muted-foreground">
              Uma oração especial para o seu jejum
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowModal(true)}
            className="hover:bg-amber-500/20"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      {prayer && (
        <PersonalizedPrayerModal
          prayer={prayer}
          open={showModal}
          onOpenChange={setShowModal}
          onRegenerate={onRegenerate}
        />
      )}
    </>
  );
};
