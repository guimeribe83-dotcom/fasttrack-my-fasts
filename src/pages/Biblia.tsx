import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { BibleHeader } from "@/components/bible/BibleHeader";
import { BibleSelector } from "@/components/bible/BibleSelector";
import { BibleText } from "@/components/bible/BibleText";
import { ChapterNavigation } from "@/components/bible/ChapterNavigation";
import { useBibleReader } from "@/hooks/useBibleReader";
import { getChapter } from "@/data/bibleData";

export default function Biblia() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const {
    availableBooks,
    currentBook,
    currentChapter,
    currentChapterData,
    isLoading,
    error,
    goToNextChapter,
    goToPreviousChapter,
    changeBook,
    changeChapter,
    reloadBooks,
  } = useBibleReader();

  // Verificar autenticação
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setIsAuthenticated(true);
  };

  const handleNavigateToVerse = (bookId: string, chapter: number, verse: number) => {
    // Navegar para o livro e capítulo
    if (bookId !== currentBook) {
      changeBook(bookId);
    }
    if (chapter !== currentChapter) {
      changeChapter(chapter);
    }
    // Após navegar, fazer scroll até o versículo (com delay para garantir que a página carregou)
    setTimeout(() => {
      const verseElement = document.querySelector(`[data-verse="${verse}"]`);
      if (verseElement) {
        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };


  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Cabeçalho */}
        <BibleHeader 
          onBack={() => navigate("/")}
          onNavigateToVerse={handleNavigateToVerse}
        />

        {/* Seletores */}
        <BibleSelector
          availableBooks={availableBooks}
          currentBook={currentBook}
          currentChapter={currentChapter}
          onBookChange={changeBook}
          onChapterChange={changeChapter}
          onVersionChange={reloadBooks}
        />

        {/* Navegação e Texto */}
        <div className="relative">
          <ChapterNavigation
            onPrevious={goToPreviousChapter}
            onNext={goToNextChapter}
          />

          <BibleText
            bookId={currentBook}
            chapterNumber={currentChapter}
            verses={currentChapterData?.verses || []}
            isLoading={isLoading}
            error={error || ''}
          />
        </div>
      </div>
    </Layout>
  );
}
