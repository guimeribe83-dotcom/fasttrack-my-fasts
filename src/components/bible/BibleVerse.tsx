import { useState } from "react";
import { BibleVerse as BibleVerseType } from "@/data/bibleData";
import { HIGHLIGHT_COLORS, type HighlightColor } from "@/lib/highlightColors";
import { ColorPicker } from "./ColorPicker";
import { NoteDialog } from "./NoteDialog";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface BibleVerseProps {
  verse: BibleVerseType;
  bookId: string;
  bookName: string;
  chapter: number;
  highlight?: { color: HighlightColor };
  note?: { note: string };
  onHighlight: (verse: number, color: HighlightColor) => void;
  onRemoveHighlight: (verse: number) => void;
  onSaveNote: (verse: number, note: string) => void;
  onRemoveNote: (verse: number) => void;
}

export const BibleVerse = ({
  verse,
  bookId,
  bookName,
  chapter,
  highlight,
  note,
  onHighlight,
  onRemoveHighlight,
  onSaveNote,
  onRemoveNote,
}: BibleVerseProps) => {
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  const highlightClass = highlight ? HIGHLIGHT_COLORS[highlight.color] : "";

  return (
    <>
      <div
        data-verse={verse.number}
        className={cn(
          "flex gap-3 group rounded-lg p-2 transition-all",
          highlightClass,
          !highlight && "hover:bg-accent/50"
        )}
      >
        {/* Número do Versículo */}
        <span className="flex-shrink-0 text-sm font-bold text-blue-500 dark:text-blue-400 select-none min-w-[2rem]">
          {verse.number}
        </span>

        {/* Texto do Versículo */}
        <p className="text-base md:text-lg text-foreground leading-relaxed flex-1">
          {verse.text}
        </p>

        {/* Ações */}
        <div className="flex items-start gap-1 flex-shrink-0">
          {/* Ícone de Nota */}
          {note ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setNoteDialogOpen(true)}
            >
              <MessageSquare className="h-4 w-4 fill-primary text-primary" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setNoteDialogOpen(true)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}

          {/* Seletor de Cor */}
          <ColorPicker
            currentColor={highlight?.color}
            onColorSelect={(color) => onHighlight(verse.number, color)}
            onRemove={() => onRemoveHighlight(verse.number)}
          />
        </div>
      </div>

      {/* Dialog de Nota */}
      <NoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        verseNumber={verse.number}
        verseText={verse.text}
        bookName={bookName}
        chapter={chapter}
        existingNote={note?.note}
        onSave={(noteText) => onSaveNote(verse.number, noteText)}
        onDelete={note ? () => onRemoveNote(verse.number) : undefined}
      />
    </>
  );
};
