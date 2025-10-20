import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BibleChapterSelectorProps {
  totalChapters: number;
  selectedChapter: number | null;
  onSelectChapter: (chapter: number) => void;
}

export const BibleChapterSelector = ({ 
  totalChapters, 
  selectedChapter, 
  onSelectChapter 
}: BibleChapterSelectorProps) => {
  const { t } = useTranslation();

  return (
    <Select
      value={selectedChapter?.toString() || ""}
      onValueChange={(value) => onSelectChapter(parseInt(value))}
    >
      <SelectTrigger className="w-full md:w-[120px] bg-background border-primary/20">
        <SelectValue placeholder={t("bible.selectChapter")} />
      </SelectTrigger>
      <SelectContent className="max-h-[400px] bg-popover/95 backdrop-blur-md border-primary/30 z-50">
        <ScrollArea className="h-[350px]">
          <div className="grid grid-cols-6 gap-2 p-2">
            {Array.from({ length: totalChapters }, (_, i) => i + 1).map((chapter) => (
              <Button
                key={chapter}
                onClick={() => onSelectChapter(chapter)}
                variant={selectedChapter === chapter ? "default" : "outline"}
                className={`h-10 w-10 p-0 text-sm font-medium transition-all ${
                  selectedChapter === chapter 
                    ? "bg-primary text-white scale-110" 
                    : "hover:bg-primary hover:text-white hover:scale-105"
                }`}
              >
                {chapter}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </SelectContent>
    </Select>
  );
};
