import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BibleBook } from "@/data/bibleData";
import { useTranslation } from "react-i18next";

interface BibleSelectorProps {
  availableBooks: BibleBook[];
  currentBook: string;
  currentChapter: number;
  onBookChange: (bookId: string) => void;
  onChapterChange: (chapter: number) => void;
}

export const BibleSelector = ({
  availableBooks,
  currentBook,
  currentChapter,
  onBookChange,
  onChapterChange,
}: BibleSelectorProps) => {
  const { t } = useTranslation();
  const book = availableBooks.find(b => b.id === currentBook);
  const chapters = Array.from({ length: book?.chapters.length || 0 }, (_, i) => i + 1);

  return (
    <div className="sticky top-14 z-10 bg-background/95 backdrop-blur border-b border-border p-4">
      <div className="flex gap-3 max-w-5xl mx-auto">
        {/* Selector de Livro */}
        <Select value={currentBook} onValueChange={onBookChange}>
          <SelectTrigger className="flex-1 bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] bg-card border-border">
            {availableBooks.map((book) => (
              <SelectItem key={book.id} value={book.id}>
                {book.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selector de Capítulo */}
        <Select
          value={currentChapter.toString()}
          onValueChange={(value) => onChapterChange(parseInt(value))}
        >
          <SelectTrigger className="w-24 bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] bg-card border-border">
            {chapters.map((ch) => (
              <SelectItem key={ch} value={ch.toString()}>
                {ch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
