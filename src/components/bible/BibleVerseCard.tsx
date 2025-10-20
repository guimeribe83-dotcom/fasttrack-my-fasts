import { BibleVerse } from "@/lib/bibleApi";

interface BibleVerseCardProps {
  verses: BibleVerse[];
}

export const BibleVerseCard = ({ verses }: BibleVerseCardProps) => {
  return (
    <div className="space-y-4 animate-fade-in">
      {verses.map((verse) => (
        <div 
          key={verse.number} 
          className="flex gap-3 leading-relaxed group transition-all duration-200"
        >
          <span className="font-semibold text-sky-400 dark:text-sky-300 min-w-[2.5rem] text-sm select-none">
            {verse.number}
          </span>
          <p className="text-base md:text-lg text-foreground/95 dark:text-foreground/90 flex-1 text-justify leading-loose">
            {verse.text}
          </p>
        </div>
      ))}
    </div>
  );
};
