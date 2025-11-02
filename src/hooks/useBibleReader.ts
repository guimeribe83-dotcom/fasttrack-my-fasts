import { useState, useEffect } from 'react';
import { BibleApiService } from '@/services/bibleApi';
import { bibleBooks as offlineBibleBooks, type BibleBook, type BibleChapter } from '@/data/bibleData';

const STORAGE_KEY = 'bibleReaderPosition';

interface BibleReaderPosition {
  bookId: string;
  chapterNumber: number;
}

export const useBibleReader = () => {
  const [availableBooks, setAvailableBooks] = useState<BibleBook[]>(offlineBibleBooks);
  const [currentBook, setCurrentBook] = useState<string>('john'); // Começa com João (offline)
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [currentChapterData, setCurrentChapterData] = useState<BibleChapter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar lista de livros ao iniciar
  useEffect(() => {
    loadBooksList();
    BibleApiService.clearOldCache(); // Limpar cache antigo
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
    const apiBooks = await BibleApiService.fetchBooks();
    if (apiBooks.length > 0) {
      setAvailableBooks(apiBooks);
    }
  };

  const loadChapter = async (bookId: string, chapterNum: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Tentar da API
      const apiChapter = await BibleApiService.fetchChapter(bookId, chapterNum);
      
      if (apiChapter) {
        setCurrentChapterData(apiChapter);
      } else {
        // 2. Fallback: buscar dos dados offline
        const offlineBook = offlineBibleBooks.find(b => b.id === bookId);
        const offlineChapter = offlineBook?.chapters.find(c => c.number === chapterNum);
        
        if (offlineChapter) {
          setCurrentChapterData(offlineChapter);
        } else {
          setError('Conteúdo não disponível offline. Configure o token da API para acessar toda a Bíblia.');
          setCurrentChapterData(null);
        }
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
