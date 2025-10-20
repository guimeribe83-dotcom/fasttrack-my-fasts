const API_BASE_URL = 'https://www.abibliadigital.com.br/api';

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

export const bibleApi = {
  async getVersions(): Promise<BibleVersion[]> {
    const response = await fetch(`${API_BASE_URL}/versions`);
    if (!response.ok) throw new Error('Failed to fetch versions');
    return response.json();
  },

  async getBooks(): Promise<BibleBook[]> {
    const response = await fetch(`${API_BASE_URL}/books`);
    if (!response.ok) throw new Error('Failed to fetch books');
    return response.json();
  },

  async getChapter(version: string, bookAbbrev: string, chapter: number): Promise<BibleChapter> {
    const response = await fetch(`${API_BASE_URL}/verses/${version}/${bookAbbrev}/${chapter}`);
    if (!response.ok) throw new Error('Failed to fetch chapter');
    return response.json();
  },

  async searchVerses(version: string, query: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/verses/${version}/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search verses');
    return response.json();
  }
};
