import { BibleChapter, BibleBook } from '@/data/bibleData';

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

// Serviço de API
export class BibleApiService {
  private static BASE_URL = 'https://api.scripture.api.bible/v1';
  private static CACHE_PREFIX = 'bible_cache_';
  private static CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 dias
  private static selectedBibleId: string | null = null;

  // Buscar a primeira versão da Bíblia disponível para a chave API
  private static async getAvailableBibleId(): Promise<string | null> {
    // Se já temos uma versão selecionada, retornar
    if (this.selectedBibleId) {
      return this.selectedBibleId;
    }

    // Verificar cache
    const cached = localStorage.getItem('selected_bible_id');
    if (cached) {
      const { id, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) { // 7 dias
        this.selectedBibleId = id;
        return id;
      }
    }

    const apiKey = import.meta.env.VITE_BIBLE_API_KEY;
    if (!apiKey) {
      return null;
    }

    try {
      const response = await fetch(`${this.BASE_URL}/bibles`, {
        headers: { 'api-key': apiKey }
      });

      if (!response.ok) {
        console.error('❌ Erro ao buscar bíblias disponíveis:', response.status);
        return null;
      }

      const data: AvailableBiblesResponse = await response.json();
      
      // Priorizar versões em português
      const portugueseBibles = data.data.filter(
        b => b.language.id === 'por' || b.language.name.toLowerCase().includes('portuguese')
      );

      const selectedBible = portugueseBibles.length > 0 ? portugueseBibles[0] : data.data[0];
      
      if (selectedBible) {
        this.selectedBibleId = selectedBible.id;
        localStorage.setItem('selected_bible_id', JSON.stringify({
          id: selectedBible.id,
          name: selectedBible.name,
          timestamp: Date.now()
        }));
        console.log(`✅ Bíblia selecionada: ${selectedBible.name} (${selectedBible.id})`);
        return selectedBible.id;
      }

      console.error('❌ Nenhuma bíblia disponível para esta chave API');
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar bíblias disponíveis:', error);
      return null;
    }
  }

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
      const apiKey = import.meta.env.VITE_BIBLE_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ API Key não configurado. Usando conteúdo offline limitado.');
        return null;
      }

      // Obter versão da bíblia disponível
      const bibleId = await this.getAvailableBibleId();
      if (!bibleId) {
        console.error('❌ Nenhuma versão da Bíblia disponível');
        return null;
      }

      // Converter ID interno para ID da API.Bible
      const apiBibleBookId = BOOK_ID_MAP[bookId.toLowerCase()];
      if (!apiBibleBookId) {
        console.error(`Livro não encontrado no mapeamento: ${bookId}`);
        return null;
      }

      const url = `${this.BASE_URL}/bibles/${bibleId}/chapters/${apiBibleBookId}.${chapterNumber}?content-type=json&include-verse-spans=false`;
      
      const response = await fetch(url, {
        headers: {
          'api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: ApiBibleChapterResponse = await response.json();

      // 3. Converter para o formato interno
      const chapter: BibleChapter = {
        number: parseInt(data.data.number),
        verses: data.data.content.map(v => ({
          number: parseInt(v.number),
          text: v.text.replace(/<[^>]*>/g, ''), // Remove tags HTML
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

      const apiKey = import.meta.env.VITE_BIBLE_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ API Key não configurado. Retornando lista offline.');
        return [];
      }

      // Obter versão da bíblia disponível
      const bibleId = await this.getAvailableBibleId();
      if (!bibleId) {
        console.error('❌ Nenhuma versão da Bíblia disponível');
        return [];
      }

      const response = await fetch(
        `${this.BASE_URL}/bibles/${bibleId}/books`,
        {
          headers: {
            'api-key': apiKey,
          },
        }
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const result: ApiBibleBooksResponse = await response.json();

      // Buscar número de capítulos para cada livro
      const booksWithChapters = await Promise.all(
        result.data.map(async (book) => {
          const chaptersResponse = await fetch(
            `${this.BASE_URL}/bibles/${bibleId}/books/${book.id}/chapters`,
            {
              headers: {
                'api-key': apiKey,
              },
            }
          );
          
          const chaptersData = await chaptersResponse.json();
          const chapterCount = chaptersData.data.length;

          const internalId = REVERSE_BOOK_ID_MAP[book.id] || book.id.toLowerCase();

          return {
            id: internalId,
            name: book.name,
            abbr: book.abbreviation,
            testament: ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'].includes(book.id) ? 'old' : 'new',
            chapters: Array.from({ length: chapterCount }, (_, i) => ({
              number: i + 1,
              verses: [], // Será carregado sob demanda
            })),
          } as BibleBook;
        })
      );

      // Salvar no cache
      localStorage.setItem('bible_books_list', JSON.stringify({
        data: booksWithChapters,
        timestamp: Date.now(),
      }));

      return booksWithChapters;

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
