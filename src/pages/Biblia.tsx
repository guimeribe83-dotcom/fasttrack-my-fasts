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
    currentBook,
    currentChapter,
    isLoading,
    goToNextChapter,
    goToPreviousChapter,
    changeBook,
    changeChapter,
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

  // Obter dados do capítulo atual
  const currentChapterData = getChapter(currentBook, currentChapter);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Cabeçalho */}
        <BibleHeader onBack={() => navigate("/")} />

        {/* Seletores */}
        <BibleSelector
          currentBook={currentBook}
          currentChapter={currentChapter}
          onBookChange={changeBook}
          onChapterChange={changeChapter}
        />

        {/* Navegação e Texto */}
        <div className="relative">
          <ChapterNavigation
            onPrevious={goToPreviousChapter}
            onNext={goToNextChapter}
          />

          {currentChapterData && !isLoading && (
            <BibleText
              bookId={currentBook}
              chapterNumber={currentChapter}
              verses={currentChapterData.verses}
            />
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
