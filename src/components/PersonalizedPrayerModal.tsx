import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, Sparkles, Heart, BookOpen, HandHeart, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import type { PrayerData } from "@/lib/prayerFallbacks";

interface PersonalizedPrayerModalProps {
  prayer: PrayerData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerate?: () => void;
}

const getSectionIcon = (type: string) => {
  switch (type) {
    case "adoration": return <Heart className="w-4 h-4" />;
    case "confession": return <BookOpen className="w-4 h-4" />;
    case "supplication": return <HandHeart className="w-4 h-4" />;
    case "thanksgiving": return <Sparkles className="w-4 h-4" />;
    default: return <Lightbulb className="w-4 h-4" />;
  }
};

export const PersonalizedPrayerModal = ({ 
  prayer, 
  open, 
  onOpenChange,
  onRegenerate 
}: PersonalizedPrayerModalProps) => {
  const handleCopyPrayer = () => {
    const fullText = `${prayer.title}\n\n"${prayer.scripture_text}"\n— ${prayer.scripture_reference}\n\n${prayer.prayer_text}\n\n${prayer.sections.map(s => `${s.title}:\n${s.content}`).join('\n\n')}\n\nAfirmação Diária:\n"${prayer.daily_affirmation}"`;
    
    navigator.clipboard.writeText(fullText);
    toast.success("Oração copiada!", {
      description: "O texto foi copiado para sua área de transferência."
    });
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border/50">
          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 rounded-lg bg-amber-500/10">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-2xl font-bold text-foreground mb-1">
                {prayer.title}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">
                {prayer.introduction}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Versículo em destaque */}
        <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 mb-6">
          <blockquote className="italic text-sm text-foreground mb-2 leading-relaxed">
            "{prayer.scripture_text}"
          </blockquote>
          <cite className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
            — {prayer.scripture_reference}
          </cite>
        </Card>

        {/* Oração completa */}
        <div className="mb-6">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {prayer.prayer_text}
          </p>
        </div>

        {/* Seções da oração */}
        <div className="space-y-4 mb-6">
          {prayer.sections.map((section, index) => (
            <div 
              key={section.type} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                {getSectionIcon(section.type)}
                {section.title}
              </h4>
              <p className="text-sm text-foreground leading-relaxed pl-6">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Afirmação diária */}
        <Card className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 mb-6">
          <p className="text-xs text-muted-foreground mb-2 font-semibold">Afirmação Diária</p>
          <p className="text-sm font-bold text-foreground">
            "{prayer.daily_affirmation}"
          </p>
        </Card>

        {/* Ações */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 border-amber-500/30 hover:bg-amber-500/10"
            onClick={handleCopyPrayer}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </Button>
          {onRegenerate && (
            <Button 
              variant="outline" 
              className="flex-1 border-amber-500/30 hover:bg-amber-500/10"
              onClick={handleRegenerate}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerar
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
