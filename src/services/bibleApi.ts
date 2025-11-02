import { BibleBook, BibleChapter } from '@/types/bible';
import { LocalBibleService } from './localBibleService';

// API.Bible Types
interface ApiBibleVerse {
  id: string;
  orgId: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  number: string;
  text: string;
  reference: string;
}

interface ApiBibleChapter {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  reference: string;
}

interface ApiBibleBook {
  id: string;
  bibleId: string;
  abbreviation: string;
  name: string;
  nameLong: string;
}

interface ApiBibleChapterResponse {
  data: {
    id: string;
    bibleId: string;
    number: string;
    bookId: string;
    reference: string;
    copyright: string;
    verseCount: number;
    content: ApiBibleVerse[];
  };
}

interface ApiBibleBooksResponse {
  data: ApiBibleBook[];
}

interface AvailableBible {
  id: string;
  name: string;
  language: {
    id: string;
    name: string;
  };
}

interface AvailableBiblesResponse {
  data: AvailableBible[];
}

// Mapeamento de IDs dos livros (API.Bible usa IDs diferentes)
const BOOK_ID_MAP: Record<string, string> = {
  'gn': 'GEN',
  'ex': 'EXO',
  'lv': 'LEV',
  'nm': 'NUM',
  'dt': 'DEU',
  'js': 'JOS',
  'jz': 'JDG',
  'rt': 'RUT',
  '1sm': '1SA',
  '2sm': '2SA',
  '1rs': '1KI',
  '2rs': '2KI',
  '1cr': '1CH',
  '2cr': '2CH',
  'ed': 'EZR',
  'ne': 'NEH',
  'et': 'EST',
  'job': 'JOB',
  'sl': 'PSA',
  'pv': 'PRO',
  'ec': 'ECC',
  'ct': 'SNG',
  'is': 'ISA',
  'jr': 'JER',
  'lm': 'LAM',
  'ez': 'EZK',
  'dn': 'DAN',
  'os': 'HOS',
  'jl': 'JOL',
  'am': 'AMO',
  'ob': 'OBA',
  'jn': 'JON',
  'mq': 'MIC',
  'na': 'NAM',
  'hc': 'HAB',
  'sf': 'ZEP',
  'ag': 'HAG',
  'zc': 'ZEC',
  'ml': 'MAL',
  'mt': 'MAT',
  'mc': 'MRK',
  'lc': 'LUK',
  'jo': 'JHN',
  'at': 'ACT',
  'rm': 'ROM',
  '1co': '1CO',
  '2co': '2CO',
  'gl': 'GAL',
  'ef': 'EPH',
  'fp': 'PHP',
  'cl': 'COL',
  '1ts': '1TH',
  '2ts': '2TH',
  '1tm': '1TI',
  '2tm': '2TI',
  'tt': 'TIT',
  'fm': 'PHM',
  'hb': 'HEB',
  'tg': 'JAS',
  '1pe': '1PE',
  '2pe': '2PE',
  '1jo': '1JN',
  '2jo': '2JN',
  '3jo': '3JN',
  'jd': 'JUD',
  'ap': 'REV',
};

// Mapeamento reverso (API.Bible -> interno)
const REVERSE_BOOK_ID_MAP: Record<string, string> = Object.entries(BOOK_ID_MAP).reduce(
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);

// Versões disponíveis da Bíblia em português
export const BIBLE_VERSIONS = {
  ara: { id: '9e0f7304b4c33b44-01', name: 'Almeida Revista e Atualizada' },
  nvi: { id: 'e2e888f8dc60835f-01', name: 'Nova Versão Internacional' },
  acf: { id: 'aa0ca8942e849152-01', name: 'Almeida Corrigida Fiel' },
};

// Serviço simplificado para cache e acesso aos dados locais
export class BibleApiService {
  private static CACHE_PREFIX = 'bible_cache_';
  private static CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 dias

  // Buscar capítulo com cache
  static async fetchChapter(bookId: string, chapterNumber: number): Promise<BibleChapter | null> {
    try {
      // 1. Tentar carregar do cache
      const cached = this.getFromCache(bookId, chapterNumber);
      if (cached) {
        console.log(`📦 Capítulo ${bookId} ${chapterNumber} carregado do cache`);
        return cached;
      }

      // 2. Carregar dos dados locais (JSON estático)
      const chapter = await LocalBibleService.getChapter(bookId, chapterNumber);
      
      if (chapter) {
        // 3. Salvar no cache
        this.saveToCache(bookId, chapterNumber, chapter);
        console.log(`✅ Capítulo ${bookId} ${chapterNumber} carregado com sucesso`);
        return chapter;
      }

      console.error(`❌ Capítulo não encontrado: ${bookId} ${chapterNumber}`);
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar capítulo:', error);
      return null;
    }
  }

  // Buscar lista de livros
  static async fetchBooks(): Promise<BibleBook[]> {
    try {
      // Verificar cache
      const cached = localStorage.getItem('bible_books_list');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.CACHE_DURATION) {
          console.log('📦 Lista de livros carregada do cache');
          return data;
        }
      }

      // Carregar dos dados locais
      const books = await LocalBibleService.getAllBooks();
      
      // Salvar no cache
      localStorage.setItem('bible_books_list', JSON.stringify({
        data: books,
        timestamp: Date.now()
      }));

      console.log(`✅ ${books.length} livros carregados com sucesso`);
      return books;
    } catch (error) {
      console.error('❌ Erro ao buscar livros:', error);
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
