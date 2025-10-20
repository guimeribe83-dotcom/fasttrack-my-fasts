import { useState, useEffect } from 'react';
import { bibleBooks, findBookById } from '@/data/bibleData';

const STORAGE_KEY = 'bibleReaderPosition';

interface BibleReaderPosition {
  bookId: string;
  chapterNumber: number;
}

export const useBibleReader = () => {
  const [currentBook, setCurrentBook] = useState<string>('genesis');
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);

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

  // Salvar posição no localStorage quando mudar
  useEffect(() => {
    const position: BibleReaderPosition = {
      bookId: currentBook,
      chapterNumber: currentChapter,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  }, [currentBook, currentChapter]);

  // Navegar para próximo capítulo
  const goToNextChapter = () => {
    setIsLoading(true);
    
    const book = findBookById(currentBook);
    if (!book) {
      setIsLoading(false);
      return;
    }

    const maxChapter = book.chapters.length;
    
    if (currentChapter < maxChapter) {
      // Próximo capítulo do mesmo livro
      setCurrentChapter(currentChapter + 1);
    } else {
      // Ir para o próximo livro
      const currentIndex = bibleBooks.findIndex(b => b.id === currentBook);
      if (currentIndex < bibleBooks.length - 1) {
        const nextBook = bibleBooks[currentIndex + 1];
        setCurrentBook(nextBook.id);
        setCurrentChapter(1);
      }
    }
    
    setTimeout(() => setIsLoading(false), 300);
  };

  // Navegar para capítulo anterior
  const goToPreviousChapter = () => {
    setIsLoading(true);

    if (currentChapter > 1) {
      // Capítulo anterior do mesmo livro
      setCurrentChapter(currentChapter - 1);
    } else {
      // Ir para o livro anterior
      const currentIndex = bibleBooks.findIndex(b => b.id === currentBook);
      if (currentIndex > 0) {
        const previousBook = bibleBooks[currentIndex - 1];
        const lastChapter = previousBook.chapters.length;
        setCurrentBook(previousBook.id);
        setCurrentChapter(lastChapter);
      }
    }

    setTimeout(() => setIsLoading(false), 300);
  };

  // Mudar livro
  const changeBook = (bookId: string) => {
    setIsLoading(true);
    setCurrentBook(bookId);
    setCurrentChapter(1);
    setTimeout(() => setIsLoading(false), 300);
  };

  // Mudar capítulo
  const changeChapter = (chapterNumber: number) => {
    setIsLoading(true);
    setCurrentChapter(chapterNumber);
    setTimeout(() => setIsLoading(false), 300);
  };

  return {
    currentBook,
    currentChapter,
    isLoading,
    goToNextChapter,
    goToPreviousChapter,
    changeBook,
    changeChapter,
  };
};
