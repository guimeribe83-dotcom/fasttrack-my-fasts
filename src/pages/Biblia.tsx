import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { bibleApi, BibleBook, BibleChapter } from "@/lib/bibleApi";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";

type ViewMode = 'books' | 'chapters' | 'verses';

export default function Biblia() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [viewMode, setViewMode] = useState<ViewMode>('books');
  const [version, setVersion] = useState('acf');
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      setLoading(true);
      const data = await bibleApi.getChapter(version, bookAbbrev, chapter);
      setChapterData(data);
      setSelectedChapter(chapter);
      setViewMode('verses');
    } catch (error) {
      console.error(error);
      toast.error(t("bible.errorLoading"));
    } finally {
      setLoading(false);
    }
  };

  const handleBookSelect = (book: BibleBook) => {
    setSelectedBook(book);
    setViewMode('chapters');
  };

  const handleChapterSelect = (chapter: number) => {
    if (selectedBook) {
      loadChapter(selectedBook.abbrev.pt, chapter);
    }
  };

  const handleBack = () => {
    if (viewMode === 'verses') {
      setViewMode('chapters');
      setChapterData(null);
    } else if (viewMode === 'chapters') {
      setViewMode('books');
      setSelectedBook(null);
    } else {
      navigate(-1);
    }
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    if (!selectedBook || !selectedChapter) return;
    
    const newChapter = direction === 'prev' ? selectedChapter - 1 : selectedChapter + 1;
    
    if (newChapter >= 1 && newChapter <= selectedBook.chapters) {
      loadChapter(selectedBook.abbrev.pt, newChapter);
    }
  };

  const oldTestamentBooks = books.filter(b => b.testament === 'VT');
  const newTestamentBooks = books.filter(b => b.testament === 'NT');

  const filteredOldTestament = oldTestamentBooks.filter(b => 
    searchQuery === '' || b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredNewTestament = newTestamentBooks.filter(b => 
    searchQuery === '' || b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container max-w-4xl mx-auto p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  <h1 className="text-lg font-bold">
                    {viewMode === 'books' && t("bible.title")}
                    {viewMode === 'chapters' && selectedBook?.name}
                    {viewMode === 'verses' && `${selectedBook?.name} ${selectedChapter}`}
                  </h1>
                </div>
              </div>
              
              <Select value={version} onValueChange={setVersion}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acf">ACF</SelectItem>
                  <SelectItem value="nvi">NVI</SelectItem>
                  <SelectItem value="aa">AA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="container max-w-4xl mx-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
              {/* Books View */}
              {viewMode === 'books' && (
                <div className="space-y-6 animate-fade-in">
                  <Input
                    placeholder={t("bible.search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                  />

                  {/* Old Testament */}
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      📚 {t("bible.oldTestament")}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredOldTestament.map((book) => (
                        <Card
                          key={book.abbrev.pt}
                          className="p-4 hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => handleBookSelect(book)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{book.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {book.chapters} {t("bible.chapters")}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* New Testament */}
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      📚 {t("bible.newTestament")}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredNewTestament.map((book) => (
                        <Card
                          key={book.abbrev.pt}
                          className="p-4 hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => handleBookSelect(book)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{book.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {book.chapters} {t("bible.chapters")}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chapters View */}
              {viewMode === 'chapters' && selectedBook && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-lg font-semibold">{t("bible.selectChapter")}</h2>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => (
                      <Button
                        key={chapter}
                        variant="outline"
                        className="h-12 text-base hover:bg-purple-600 hover:text-white"
                        onClick={() => handleChapterSelect(chapter)}
                      >
                        {chapter}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Verses View */}
              {viewMode === 'verses' && chapterData && (
                <div className="space-y-6 animate-fade-in">
                  <Card className="p-6 space-y-4 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200/50 dark:border-purple-800/50">
                    {chapterData.verses.map((verse) => (
                      <div key={verse.number} className="flex gap-3 leading-relaxed">
                        <span className="font-bold text-purple-600 dark:text-purple-400 min-w-[2rem]">
                          {verse.number}
                        </span>
                        <p className="text-base text-foreground flex-1">
                          {verse.text}
                        </p>
                      </div>
                    ))}
                  </Card>

                  {/* Navigation */}
                  <div className="flex gap-3 justify-between">
                    <Button
                      variant="outline"
                      onClick={() => navigateChapter('prev')}
                      disabled={!selectedChapter || selectedChapter === 1}
                      className="flex-1"
                    >
                      ← {t("bible.previousChapter")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigateChapter('next')}
                      disabled={!selectedChapter || !selectedBook || selectedChapter === selectedBook.chapters}
                      className="flex-1"
                    >
                      {t("bible.nextChapter")} →
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
