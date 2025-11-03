import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Palette, MessageSquare } from "lucide-react";
import { useAllBibleMarkings } from "@/hooks/useBibleMarkings";
import { bibleBooks } from "@/data/bibleData";
import { HIGHLIGHT_COLORS } from "@/lib/highlightColors";
import { cn } from "@/lib/utils";

interface MarkingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToVerse: (bookId: string, chapter: number, verse: number) => void;
}

export const MarkingsSheet = ({
  open,
  onOpenChange,
  onNavigateToVerse,
}: MarkingsSheetProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { allMarkings, isLoading } = useAllBibleMarkings();

  const filteredMarkings = useMemo(() => {
    if (!searchQuery.trim()) return allMarkings;

    const query = searchQuery.toLowerCase();
    return allMarkings.filter((marking) => {
      const book = bibleBooks.find((b) => b.id === marking.book_id);
      const bookName = book?.name.toLowerCase() || "";
      
      if (marking.type === 'note') {
        return (
          bookName.includes(query) ||
          marking.note.toLowerCase().includes(query)
        );
      }
      
      return bookName.includes(query);
    });
  }, [allMarkings, searchQuery]);

  const handleItemClick = (marking: typeof allMarkings[0]) => {
    onNavigateToVerse(marking.book_id, marking.chapter, marking.verse);
    onOpenChange(false);
  };

  const getBookName = (bookId: string) => {
    const book = bibleBooks.find((b) => b.id === bookId);
    return book?.name || bookId;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>📚 Minhas Marcações</SheetTitle>
          <SheetDescription>
            Todos os seus destaques e anotações
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar marcações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de Marcações */}
          <ScrollArea className="h-[calc(100vh-200px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredMarkings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery ? "Nenhuma marcação encontrada" : "Você ainda não tem marcações"}
                </p>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {filteredMarkings.map((marking, index) => (
                  <Button
                    key={`${marking.type}-${marking.id}-${index}`}
                    variant="outline"
                    className={cn(
                      "w-full h-auto p-4 flex flex-col items-start gap-2 text-left",
                      marking.type === 'highlight' && marking.color && HIGHLIGHT_COLORS[marking.color]
                    )}
                    onClick={() => handleItemClick(marking)}
                  >
                    {/* Cabeçalho */}
                    <div className="flex items-center gap-2 w-full">
                      {marking.type === 'highlight' ? (
                        <Palette className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      )}
                      <span className="font-semibold text-sm">
                        {getBookName(marking.book_id)} {marking.chapter}:{marking.verse}
                      </span>
                    </div>

                    {/* Conteúdo da Nota */}
                    {marking.type === 'note' && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {marking.note}
                      </p>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};
