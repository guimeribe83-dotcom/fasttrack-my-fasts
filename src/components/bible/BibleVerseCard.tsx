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
          className="flex gap-3 leading-relaxed group transition-all duration-200 hover:translate-x-1"
        >
          <span className="font-bold text-primary dark:text-purple-400 min-w-[2.5rem] text-sm select-none">
            {verse.number}
          </span>
          <p className="text-base md:text-lg text-foreground flex-1 text-justify leading-loose">
            {verse.text}
          </p>
        </div>
      ))}
    </div>
  );
};
