import { BibleBook, BibleChapter, BibleJsonData, BibleJsonBook } from '@/types/bible';

export type BibleVersionId = 'nvi' | 'acf' | 'aa';

export interface BibleVersion {
  id: BibleVersionId;
  name: string;
}

export const BIBLE_VERSIONS: Record<BibleVersionId, BibleVersion> = {
  nvi: { id: 'nvi', name: 'Nova Versão Internacional' },
  acf: { id: 'acf', name: 'Almeida Corrigida Fiel' },
  aa: { id: 'aa', name: 'Almeida Atualizada' },
};

export class LocalBibleService {
  private static currentVersion: BibleVersionId = 'nvi';
  private static data: BibleJsonData | null = null;

  static async loadVersion(versionId: BibleVersionId): Promise<void> {
    try {
      let module;
      switch (versionId) {
        case 'nvi':
          module = await import('@/data/bible/nvi.json');
          break;
        case 'acf':
          module = await import('@/data/bible/acf.json');
          break;
        case 'aa':
          module = await import('@/data/bible/aa.json');
          break;
      }
      this.data = module.default;
      this.currentVersion = versionId;
      
      // Salvar preferência
      localStorage.setItem('selected_bible_version', versionId);
    } catch (error) {
      console.error('Erro ao carregar versão da Bíblia:', error);
      throw error;
    }
  }

  static async ensureLoaded(): Promise<void> {
    if (!this.data) {
      // Tentar carregar versão salva
      const savedVersion = localStorage.getItem('selected_bible_version') as BibleVersionId;
      const versionToLoad = savedVersion && BIBLE_VERSIONS[savedVersion] ? savedVersion : 'nvi';
      await this.loadVersion(versionToLoad);
    }
  }

  static getCurrentVersion(): BibleVersionId {
    return this.currentVersion;
  }

  static async getBook(bookId: string): Promise<BibleJsonBook | null> {
    await this.ensureLoaded();
    if (!this.data) return null;

    const normalizedId = bookId.toLowerCase();
    const book = this.data.find(
      b => b.abbrev.pt.toLowerCase() === normalizedId
    );
    
    return book || null;
  }

  static async getChapter(bookId: string, chapterNum: number): Promise<BibleChapter | null> {
    await this.ensureLoaded();
    const book = await this.getBook(bookId);
    
    if (!book || !book.chapters[chapterNum - 1]) {
      return null;
    }

    return {
      number: chapterNum,
      verses: book.chapters[chapterNum - 1].map((text, index) => ({
        number: index + 1,
        text: text.trim()
      }))
    };
  }

  static async getAllBooks(): Promise<BibleBook[]> {
    await this.ensureLoaded();
    if (!this.data) return [];

    return this.data.map(book => ({
      id: book.abbrev.pt.toLowerCase(),
      name: book.name,
      abbr: book.abbrev.pt.toUpperCase(),
      testament: book.testament === 'VT' ? 'old' as const : 'new' as const,
      chapters: book.chapters.map((verses, i) => ({
        number: i + 1,
        verses: verses.map((text, j) => ({
          number: j + 1,
          text: text.trim()
        }))
      }))
    }));
  }
}
