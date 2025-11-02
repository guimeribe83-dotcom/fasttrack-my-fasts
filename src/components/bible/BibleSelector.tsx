import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BibleBook } from "@/data/bibleData";
import { useTranslation } from "react-i18next";
import { LocalBibleService, BIBLE_VERSIONS, BibleVersionId } from "@/services/localBibleService";
import { useState } from "react";

interface BibleSelectorProps {
  availableBooks: BibleBook[];
  currentBook: string;
  currentChapter: number;
  onBookChange: (bookId: string) => void;
  onChapterChange: (chapter: number) => void;
  onVersionChange?: () => void;
}

export const BibleSelector = ({
  availableBooks,
  currentBook,
  currentChapter,
  onBookChange,
  onChapterChange,
  onVersionChange,
}: BibleSelectorProps) => {
  const { t } = useTranslation();
  const [selectedVersion, setSelectedVersion] = useState<BibleVersionId>(
    LocalBibleService.getCurrentVersion()
  );
  
  const book = availableBooks.find(b => b.id === currentBook);
  const chapters = Array.from({ length: book?.chapters.length || 0 }, (_, i) => i + 1);

  const handleVersionChange = async (versionId: BibleVersionId) => {
    setSelectedVersion(versionId);
    await LocalBibleService.loadVersion(versionId);
    // Notificar o componente pai para recarregar os dados
    if (onVersionChange) {
      onVersionChange();
    }
  };

  return (
    <div className="sticky top-14 z-10 bg-background/95 backdrop-blur border-b border-border p-4">
      <div className="flex flex-col gap-3 max-w-5xl mx-auto">
        {/* Selector de Versão */}
        <Select value={selectedVersion} onValueChange={handleVersionChange}>
          <SelectTrigger className="w-full bg-card border-border">
            <SelectValue placeholder="Selecionar versão" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            {Object.values(BIBLE_VERSIONS).map((version) => (
              <SelectItem key={version.id} value={version.id}>
                {version.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-3">
          {/* Selector de Livro */}
          <Select value={currentBook} onValueChange={onBookChange}>
            <SelectTrigger className="flex-1 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-card border-border z-50">
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
            <SelectContent className="max-h-[300px] bg-card border-border z-50">
              {chapters.map((ch) => (
                <SelectItem key={ch} value={ch.toString()}>
                  {ch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
