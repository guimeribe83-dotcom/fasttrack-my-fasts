import { BibleVerse, bibleBooks } from "@/data/bibleData";

interface BibleTextProps {
  bookId: string;
  chapterNumber: number;
  verses: BibleVerse[];
  isLoading?: boolean;
  error?: string | null;
}

export const BibleText = ({ bookId, chapterNumber, verses, isLoading, error }: BibleTextProps) => {
  const book = bibleBooks.find(b => b.id === bookId);

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
          <p className="text-destructive font-semibold mb-2">⚠️ Aviso</p>
          <p className="text-sm text-foreground mb-4">{error}</p>
          <p className="text-xs text-muted-foreground">
            Para acessar toda a Bíblia, obtenha um token gratuito em{" "}
            <a 
              href="https://www.abibliadigital.com.br/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              abibliadigital.com.br
            </a>
            {" "}e adicione ao arquivo .env como VITE_BIBLE_API_TOKEN
          </p>
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
