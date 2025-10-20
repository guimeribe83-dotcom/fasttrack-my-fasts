import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ChapterNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
}

export const ChapterNavigation = ({ onPrevious, onNext }: ChapterNavigationProps) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Botão Anterior - Esquerda */}
      <Button
        onClick={onPrevious}
        size="icon"
        variant="outline"
        className="fixed left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full shadow-lg bg-background/95 backdrop-blur border-border hover:bg-accent hover:border-primary/50 transition-all hover:scale-110"
        aria-label={t("bible.previousChapter")}
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>

      {/* Botão Próximo - Direita */}
      <Button
        onClick={onNext}
        size="icon"
        variant="outline"
        className="fixed right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full shadow-lg bg-background/95 backdrop-blur border-border hover:bg-accent hover:border-primary/50 transition-all hover:scale-110"
        aria-label={t("bible.nextChapter")}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>
    </>
  );
};
