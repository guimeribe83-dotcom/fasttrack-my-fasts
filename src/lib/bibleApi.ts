import fallbackData from './bibleFallbackData.json';

const API_BASE_URL = 'https://www.abibliadigital.com.br/api';
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// Função para obter headers de autenticação
function getAuthHeaders(): HeadersInit {
  const token = import.meta.env.VITE_BIBLE_API_TOKEN;
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
}

export interface BibleBook {
  abbrev: { pt: string; en: string };
  name: string;
  author: string;
  group: string;
  chapters: number;
  testament: string;
}

export interface BibleVerse {
  number: number;
  text: string;
}

export interface BibleChapter {
  book: {
    abbrev: { pt: string; en: string };
    name: string;
    author: string;
    group: string;
    version: string;
  };
  chapter: {
    number: number;
    verses: number;
  };
  verses: BibleVerse[];
}

export interface BibleVersion {
  version: string;
  verses: number;
}

// Cache key for localStorage
const CACHE_PREFIX = 'bible_cache_';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

interface CacheData<T> {
  data: T;
  timestamp: number;
}

// Função para retry com delay progressivo
async function fetchWithRetry(url: string, attempts: number = RETRY_ATTEMPTS): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) return response;
      
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
      }
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
    }
  }
  throw new Error('Failed after retries');
}

// Função para cache local
function getFromCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const { data, timestamp }: CacheData<T> = JSON.parse(cached);
    
    // Verificar se cache ainda é válido
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function saveToCache<T>(key: string, data: T): void {
  try {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to save to cache:', error);
  }
}

// Função para carregar capítulo offline
async function getOfflineChapter(version: string, bookAbbrev: string, chapter: number): Promise<BibleChapter | null> {
  try {
    const offlineData = await import(`./offlineChapters/${version}/${bookAbbrev}-${chapter}.json`);
    return offlineData.default;
  } catch (error) {
    console.log(`No offline data for ${bookAbbrev} ${chapter}`);
    return null;
  }
}

export const bibleApi = {
  async getVersions(): Promise<BibleVersion[]> {
    const cacheKey = 'versions';
    const cached = getFromCache<BibleVersion[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/versions`);
      const data = await response.json();
      saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch versions:', error);
      // Retornar versões padrão como fallback
      return [
        { version: 'nvi', verses: 31102 },
        { version: 'acf', verses: 31102 },
        { version: 'aa', verses: 31102 }
      ];
    }
  },

  async getBooks(): Promise<BibleBook[]> {
    const cacheKey = 'books';
    const cached = getFromCache<BibleBook[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/books`);
      const data = await response.json();
      saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch books, using fallback data:', error);
      // Usar dados locais como fallback
      return fallbackData.books;
    }
  },

  async getChapter(version: string, bookAbbrev: string, chapter: number): Promise<BibleChapter> {
    const cacheKey = `chapter_${version}_${bookAbbrev}_${chapter}`;
    const cached = getFromCache<BibleChapter>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/verses/${version}/${bookAbbrev}/${chapter}`);
      const data = await response.json();
      saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Failed to fetch chapter ${bookAbbrev} ${chapter}:`, error);
      
      // Tentar carregar conteúdo offline
      const offlineData = await getOfflineChapter(version, bookAbbrev, chapter);
      if (offlineData) {
        console.log('Using offline content');
        return offlineData;
      }
      
      throw new Error('Não foi possível carregar o capítulo. Verifique sua conexão.');
    }
  },

  async getOfflineChapter(version: string, bookAbbrev: string, chapter: number): Promise<BibleChapter | null> {
    return getOfflineChapter(version, bookAbbrev, chapter);
  },

  async searchVerses(version: string, query: string): Promise<any> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/verses/${version}/search?query=${encodeURIComponent(query)}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to search verses:', error);
      throw new Error('Não foi possível realizar a busca. Verifique sua conexão.');
    }
  }
};
