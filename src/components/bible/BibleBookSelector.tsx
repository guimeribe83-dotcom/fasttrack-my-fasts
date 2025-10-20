import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BibleBook } from "@/lib/bibleApi";
import { BookOpen } from "lucide-react";

interface BibleBookSelectorProps {
  books: BibleBook[];
  selectedBook: BibleBook | null;
  onSelectBook: (book: BibleBook) => void;
}

export const BibleBookSelector = ({ books, selectedBook, onSelectBook }: BibleBookSelectorProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const oldTestamentBooks = books.filter(b => b.testament === 'VT');
  const newTestamentBooks = books.filter(b => b.testament === 'NT');

  const filteredOldTestament = oldTestamentBooks.filter(b => 
    searchQuery === '' || b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredNewTestament = newTestamentBooks.filter(b => 
    searchQuery === '' || b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Select
      value={selectedBook?.abbrev.pt || ""}
      onValueChange={(value) => {
        const book = books.find(b => b.abbrev.pt === value);
        if (book) onSelectBook(book);
      }}
    >
      <SelectTrigger className="w-full md:w-[200px] bg-background border-primary/20">
        <SelectValue placeholder={t("bible.selectBook")} />
      </SelectTrigger>
      <SelectContent className="w-[280px] max-h-[500px] bg-popover/95 backdrop-blur-md border-primary/30 z-50">
        <div className="p-2 sticky top-0 bg-popover/95 backdrop-blur-md z-10">
          <Input
            placeholder={t("bible.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 bg-background/50"
          />
        </div>
        
        <ScrollArea className="h-[400px]">
          {/* Antigo Testamento */}
          {filteredOldTestament.length > 0 && (
            <>
              <div className="px-2 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  📖 {t("bible.oldTestament")}
                </p>
              </div>
              {filteredOldTestament.map((book) => (
                <SelectItem 
                  key={book.abbrev.pt} 
                  value={book.abbrev.pt}
                  className="flex items-center justify-between hover:bg-accent/50 cursor-pointer data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary"
                >
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="font-medium">{book.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {book.chapters} {t("bible.chapters")}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          {/* Novo Testamento */}
          {filteredNewTestament.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="px-2 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  ✝️ {t("bible.newTestament")}
                </p>
              </div>
              {filteredNewTestament.map((book) => (
                <SelectItem 
                  key={book.abbrev.pt} 
                  value={book.abbrev.pt}
                  className="flex items-center justify-between hover:bg-accent/50 cursor-pointer data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary"
                >
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="font-medium">{book.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {book.chapters} {t("bible.chapters")}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          {filteredOldTestament.length === 0 && filteredNewTestament.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t("bible.noResults")}
            </div>
          )}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
};
