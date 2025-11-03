import { useState } from "react";
import { ArrowLeft, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { MarkingsSheet } from "./MarkingsSheet";

interface BibleHeaderProps {
  onBack: () => void;
  onNavigateToVerse?: (bookId: string, chapter: number, verse: number) => void;
}

export const BibleHeader = ({ onBack, onNavigateToVerse }: BibleHeaderProps) => {
  const { t } = useTranslation();
  const [markingsOpen, setMarkingsOpen] = useState(false);

  const handleNavigateToVerse = (bookId: string, chapter: number, verse: number) => {
    if (onNavigateToVerse) {
      onNavigateToVerse(bookId, chapter, verse);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-5xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-accent"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <h1 className="text-lg font-bold text-foreground">
            {t("bible.title")}
          </h1>

          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-accent"
            onClick={() => setMarkingsOpen(true)}
          >
            <BookMarked className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <MarkingsSheet
        open={markingsOpen}
        onOpenChange={setMarkingsOpen}
        onNavigateToVerse={handleNavigateToVerse}
      />
    </>
  );
};
