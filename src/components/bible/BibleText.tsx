import { useEffect } from "react";
import { BibleVerse as BibleVerseType, bibleBooks } from "@/data/bibleData";
import { BibleVerse } from "./BibleVerse";
import { useBibleMarkings } from "@/hooks/useBibleMarkings";

interface BibleTextProps {
  bookId: string;
  chapterNumber: number;
  verses: BibleVerseType[];
  isLoading?: boolean;
  error?: string | null;
}

export const BibleText = ({ bookId, chapterNumber, verses, isLoading, error }: BibleTextProps) => {
  const book = bibleBooks.find(b => b.id === bookId);
  
  const {
    highlights,
    notes,
    addHighlight,
    removeHighlight,
    saveNote,
    removeNote,
  } = useBibleMarkings(bookId, chapterNumber);

  // Scroll para o topo quando mudar de capítulo
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [bookId, chapterNumber]);

  // Funções wrapper para os handlers
  const handleHighlight = (verse: number, color: any) => {
    addHighlight({ verse, color });
  };

  const handleSaveNote = (verse: number, note: string) => {
    saveNote({ verse, note });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
          <p className="text-destructive font-semibold mb-2">⚠️ Erro ao Carregar</p>
          <p className="text-sm text-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (verses.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Nenhum versículo disponível.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 animate-fade-in">
      {/* Cabeçalho do Capítulo */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {book?.name} {chapterNumber}
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
      </div>

      {/* Versículos */}
      <div className="space-y-4">
        {verses.map((verse) => (
          <BibleVerse
            key={verse.number}
            verse={verse}
            bookId={bookId}
            bookName={book?.name || ""}
            chapter={chapterNumber}
            highlight={highlights.find(h => h.verse === verse.number)}
            note={notes.find(n => n.verse === verse.number)}
            onHighlight={handleHighlight}
            onRemoveHighlight={removeHighlight}
            onSaveNote={handleSaveNote}
            onRemoveNote={removeNote}
          />
        ))}
      </div>

      {/* Espaço para navegação inferior */}
      <div className="h-24 md:h-8" />
    </div>
  );
};
