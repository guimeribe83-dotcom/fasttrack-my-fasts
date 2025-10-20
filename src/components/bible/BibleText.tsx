import { BibleVerse } from "@/data/bibleData";
import { findBookById } from "@/data/bibleData";

interface BibleTextProps {
  bookId: string;
  chapterNumber: number;
  verses: BibleVerse[];
}

export const BibleText = ({ bookId, chapterNumber, verses }: BibleTextProps) => {
  const book = findBookById(bookId);

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
          <div
            key={verse.number}
            className="flex gap-3 group hover:bg-accent/50 rounded-lg p-2 transition-colors"
          >
            {/* Número do Versículo */}
            <span className="flex-shrink-0 text-sm font-bold text-blue-500 dark:text-blue-400 select-none min-w-[2rem]">
              {verse.number}
            </span>

            {/* Texto do Versículo */}
            <p className="text-base md:text-lg text-foreground leading-relaxed">
              {verse.text}
            </p>
          </div>
        ))}
      </div>

      {/* Espaço para navegação inferior */}
      <div className="h-24 md:h-8" />
    </div>
  );
};
