import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { bibleApi, BibleBook, BibleChapter } from "@/lib/bibleApi";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { BibleBookSelector } from "@/components/bible/BibleBookSelector";
import { BibleChapterSelector } from "@/components/bible/BibleChapterSelector";
import { BibleActionButton } from "@/components/bible/BibleActionButton";
import { BibleVerseCard } from "@/components/bible/BibleVerseCard";

export default function Biblia() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [version, setVersion] = useState('acf');
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingChapter, setLoadingChapter] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await bibleApi.getBooks();
      setBooks(data);
    } catch (error) {
      console.error(error);
      toast.error(t("bible.errorLoading"));
    } finally {
      setLoading(false);
    }
  };

  const loadChapter = async (bookAbbrev: string, chapter: number) => {
    try {
      setLoadingChapter(true);
      const data = await bibleApi.getChapter(version, bookAbbrev, chapter);
      setChapterData(data);
      setSelectedChapter(chapter);
      
      // Scroll suave para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      toast.error(t("bible.errorLoading"));
    } finally {
      setLoadingChapter(false);
    }
  };

  const handleBookSelect = (book: BibleBook) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setChapterData(null);
    // Auto-load chapter 1
    loadChapter(book.abbrev.pt, 1);
  };

  const handleChapterSelect = (chapter: number) => {
    if (selectedBook) {
      loadChapter(selectedBook.abbrev.pt, chapter);
    }
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    if (!selectedBook || !selectedChapter) return;
    
    const newChapter = direction === 'prev' ? selectedChapter - 1 : selectedChapter + 1;
    
    if (newChapter >= 1 && newChapter <= selectedBook.chapters) {
      loadChapter(selectedBook.abbrev.pt, newChapter);
    }
  };

  const canGoPrev = selectedBook && selectedChapter && selectedChapter > 1;
  const canGoNext = selectedBook && selectedChapter && selectedChapter < selectedBook.chapters;

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-20">
        {/* Header Fixo com Blur */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 border-b border-primary/10 shadow-sm">
          <div className="container max-w-4xl mx-auto p-4 space-y-3">
            {/* Primeira linha: Navegação e Título */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="hover:bg-primary/10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h1 className="text-lg md:text-xl font-bold">
                    {selectedBook ? `${selectedBook.name} ${selectedChapter || ''}` : t("bible.title")}
                  </h1>
                </div>
              </div>
              
              {/* Seletor de Versão */}
              <Select value={version} onValueChange={setVersion}>
                <SelectTrigger className="w-[100px] bg-primary/10 text-primary border-primary/20 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-md z-50">
                  <SelectItem value="acf">ACF</SelectItem>
                  <SelectItem value="nvi">NVI</SelectItem>
                  <SelectItem value="aa">AA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Segunda linha: Seletores */}
            {!loading && (
              <div className="flex items-center gap-2 md:gap-3">
                <BibleBookSelector
                  books={books}
                  selectedBook={selectedBook}
                  onSelectBook={handleBookSelect}
                />
                
                {selectedBook && (
                  <BibleChapterSelector
                    totalChapters={selectedBook.chapters}
                    selectedChapter={selectedChapter}
                    onSelectChapter={handleChapterSelect}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="container max-w-4xl mx-auto p-4 md:p-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ) : (
            <>
              {!selectedBook ? (
                <Card className="p-8 text-center bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 border-primary/20">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <h2 className="text-xl font-semibold mb-2">{t("bible.title")}</h2>
                  <p className="text-muted-foreground">
                    Selecione um livro para começar a leitura
                  </p>
                </Card>
              ) : loadingChapter ? (
                <Card className="p-6 space-y-4 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 border-primary/20">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-6 w-8" />
                      <Skeleton className="h-6 flex-1" />
                    </div>
                  ))}
                </Card>
              ) : chapterData ? (
                <div className="space-y-6">
                  <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 dark:from-purple-950/20 dark:to-blue-950/20 border-primary/20 dark:border-purple-800/30 shadow-lg">
                    <BibleVerseCard verses={chapterData.verses} />
                  </Card>

                  {/* Navegação entre Capítulos */}
                  <div className="flex gap-3 justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={() => navigateChapter('prev')}
                      disabled={!canGoPrev}
                      className="flex-1 h-12 transition-all hover:scale-105 disabled:opacity-50"
                    >
                      <ChevronLeft className="mr-2 h-5 w-5" />
                      {t("bible.previousChapter")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigateChapter('next')}
                      disabled={!canGoNext}
                      className="flex-1 h-12 transition-all hover:scale-105 disabled:opacity-50"
                    >
                      {t("bible.nextChapter")}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Botões Laterais de Navegação (Desktop) */}
        {selectedBook && chapterData && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateChapter('prev')}
              disabled={!canGoPrev}
              className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full shadow-xl bg-background/95 backdrop-blur-md hover:bg-primary hover:text-white hover:scale-110 transition-all duration-300 z-40 disabled:opacity-30"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateChapter('next')}
              disabled={!canGoNext}
              className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full shadow-xl bg-background/95 backdrop-blur-md hover:bg-primary hover:text-white hover:scale-110 transition-all duration-300 z-40 disabled:opacity-30"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Botão Flutuante de Ações */}
        {chapterData && <BibleActionButton />}
      </div>
    </Layout>
  );
}
