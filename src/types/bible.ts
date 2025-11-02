export interface BibleJsonBook {
  abbrev: string;
  author: string;
  chapters: string[][];
  group: string;
  name: string;
  testament: string;
}

export type BibleJsonData = BibleJsonBook[];

export interface BibleVerse {
  number: number;
  text: string;
}

export interface BibleChapter {
  number: number;
  verses: BibleVerse[];
}

export interface BibleBook {
  id: string;
  name: string;
  abbr: string;
  testament: 'old' | 'new';
  chapters: BibleChapter[];
}
