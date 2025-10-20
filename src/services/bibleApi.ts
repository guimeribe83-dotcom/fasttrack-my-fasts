import { BibleChapter, BibleBook } from '@/data/bibleData';

// Tipos da API
interface ApiBibleVerse {
  number: number;
  text: string;
}

interface ApiBibleChapter {
  number: number;
  verses: number;
}

interface ApiBibleBook {
  abbrev: { pt: string };
  name: string;
  author: string;
  group: string;
  version: string;
  chapters: number;
}

interface ApiBibleChapterResponse {
  book: ApiBibleBook;
  chapter: ApiBibleChapter;
  verses: ApiBibleVerse[];
}

interface ApiBooksResponse {
  abbrev: { pt: string };
  name: string;
  chapters: number;
  group: string;
}

// Serviço de API
export class BibleApiService {
  private static BASE_URL = 'https://www.abibliadigital.com.br/api';
  private static VERSION = 'ara'; // Almeida Revista e Atualizada
  private static CACHE_PREFIX = 'bible_cache_';
  private static CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 dias

  // Buscar capítulo com cache
  static async fetchChapter(bookId: string, chapterNumber: number): Promise<BibleChapter | null> {
    try {
      // 1. Tentar carregar do cache
      const cached = this.getFromCache(bookId, chapterNumber);
      if (cached) {
        console.log(`📖 Carregado do cache: ${bookId} ${chapterNumber}`);
        return cached;
      }

      // 2. Buscar da API
      const token = import.meta.env.VITE_BIBLE_API_TOKEN;
      if (!token) {
        console.warn('⚠️ Token da API não configurado. Usando conteúdo offline limitado.');
        return null;
      }

      const url = `${this.BASE_URL}/verses/${this.VERSION}/${bookId}/${chapterNumber}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: ApiBibleChapterResponse = await response.json();

      // 3. Converter para o formato interno
      const chapter: BibleChapter = {
        number: data.chapter.number,
        verses: data.verses.map(v => ({
          number: v.number,
          text: v.text,
        })),
      };

      // 4. Salvar no cache
      this.saveToCache(bookId, chapterNumber, chapter);

      console.log(`🌐 Carregado da API: ${bookId} ${chapterNumber}`);
      return chapter;

    } catch (error) {
      console.error('Erro ao buscar capítulo da API:', error);
      return null;
    }
  }

  // Buscar lista de todos os livros
  static async fetchBooks(): Promise<BibleBook[]> {
    try {
      const cached = localStorage.getItem('bible_books_list');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.CACHE_DURATION) {
          return data;
        }
      }

      const token = import.meta.env.VITE_BIBLE_API_TOKEN;
      if (!token) {
        console.warn('⚠️ Token não configurado. Retornando lista offline.');
        return [];
      }

      const response = await fetch(`${this.BASE_URL}/books`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const apiBooks: ApiBooksResponse[] = await response.json();

      // Converter para formato interno
      const books: BibleBook[] = apiBooks.map(book => ({
        id: book.abbrev.pt.toLowerCase(),
        name: book.name,
        abbr: book.abbrev.pt.toUpperCase(),
        testament: book.group === 'Antigo Testamento' ? 'old' : 'new',
        chapters: Array.from({ length: book.chapters }, (_, i) => ({
          number: i + 1,
          verses: [], // Será carregado sob demanda
        })),
      }));

      // Salvar no cache
      localStorage.setItem('bible_books_list', JSON.stringify({
        data: books,
        timestamp: Date.now(),
      }));

      return books;

    } catch (error) {
      console.error('Erro ao buscar lista de livros:', error);
      return [];
    }
  }

  // Cache helpers
  private static getFromCache(bookId: string, chapter: number): BibleChapter | null {
    const key = `${this.CACHE_PREFIX}${bookId}_${chapter}`;
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;

    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < this.CACHE_DURATION) {
        return data;
      }
      // Cache expirado
      localStorage.removeItem(key);
      return null;
    } catch {
      return null;
    }
  }

  private static saveToCache(bookId: string, chapter: number, data: BibleChapter): void {
    const key = `${this.CACHE_PREFIX}${bookId}_${chapter}`;
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  }

  // Limpar cache antigo
  static clearOldCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const { timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp >= this.CACHE_DURATION) {
              localStorage.removeItem(key);
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      }
    });
  }
}
