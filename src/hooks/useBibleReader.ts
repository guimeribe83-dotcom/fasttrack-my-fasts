import { useState, useEffect } from 'react';
import { LocalBibleService } from '@/services/localBibleService';
import { type BibleBook, type BibleChapter } from '@/types/bible';

const STORAGE_KEY = 'bibleReaderPosition';

interface BibleReaderPosition {
  bookId: string;
  chapterNumber: number;
}

export const useBibleReader = () => {
  const [availableBooks, setAvailableBooks] = useState<BibleBook[]>([]);
  const [currentBook, setCurrentBook] = useState<string>('jo'); // João em português
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [currentChapterData, setCurrentChapterData] = useState<BibleChapter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar lista de livros ao iniciar
  useEffect(() => {
    loadBooksList();
  }, []);

  // Carregar posição salva no localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem(STORAGE_KEY);
    if (savedPosition) {
      try {
        const position: BibleReaderPosition = JSON.parse(savedPosition);
        setCurrentBook(position.bookId);
        setCurrentChapter(position.chapterNumber);
      } catch (error) {
        console.error('Erro ao carregar posição da leitura:', error);
      }
    }
  }, []);

  // Carregar capítulo quando mudar
  useEffect(() => {
    loadChapter(currentBook, currentChapter);
  }, [currentBook, currentChapter]);

  // Salvar posição no localStorage quando mudar
  useEffect(() => {
    const position: BibleReaderPosition = {
      bookId: currentBook,
      chapterNumber: currentChapter,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  }, [currentBook, currentChapter]);

  const loadBooksList = async () => {
    try {
      const books = await LocalBibleService.getAllBooks();
      setAvailableBooks(books);
    } catch (error) {
      console.error('Erro ao carregar lista de livros:', error);
    }
  };

  const loadChapter = async (bookId: string, chapterNum: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const chapter = await LocalBibleService.getChapter(bookId, chapterNum);
      
      if (chapter) {
        setCurrentChapterData(chapter);
      } else {
        setError('Capítulo não encontrado.');
        setCurrentChapterData(null);
      }
    } catch (err) {
      setError('Erro ao carregar capítulo');
      console.error(err);
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  // Navegar para próximo capítulo
  const goToNextChapter = () => {
    const book = availableBooks.find(b => b.id === currentBook);
    if (!book) return;

    const maxChapter = book.chapters.length;
    
    if (currentChapter < maxChapter) {
      setCurrentChapter(currentChapter + 1);
    } else {
      const currentIndex = availableBooks.findIndex(b => b.id === currentBook);
      if (currentIndex < availableBooks.length - 1) {
        const nextBook = availableBooks[currentIndex + 1];
        setCurrentBook(nextBook.id);
        setCurrentChapter(1);
      }
    }
  };

  // Navegar para capítulo anterior
  const goToPreviousChapter = () => {
    if (currentChapter > 1) {
      setCurrentChapter(currentChapter - 1);
    } else {
      const currentIndex = availableBooks.findIndex(b => b.id === currentBook);
      if (currentIndex > 0) {
        const previousBook = availableBooks[currentIndex - 1];
        const lastChapter = previousBook.chapters.length;
        setCurrentBook(previousBook.id);
        setCurrentChapter(lastChapter);
      }
    }
  };

  // Mudar livro
  const changeBook = (bookId: string) => {
    setCurrentBook(bookId);
    setCurrentChapter(1);
  };

  // Mudar capítulo
  const changeChapter = (chapterNumber: number) => {
    setCurrentChapter(chapterNumber);
  };

  // Recarregar livros (útil ao trocar de versão)
  const reloadBooks = async () => {
    setIsLoading(true);
    await loadBooksList();
    // Recarregar capítulo atual com a nova versão
    await loadChapter(currentBook, currentChapter);
    setIsLoading(false);
  };

  return {
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
  };
};
