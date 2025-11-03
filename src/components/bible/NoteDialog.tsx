import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verseNumber: number;
  verseText: string;
  bookName: string;
  chapter: number;
  existingNote?: string;
  onSave: (note: string) => void;
  onDelete?: () => void;
}

export const NoteDialog = ({
  open,
  onOpenChange,
  verseNumber,
  verseText,
  bookName,
  chapter,
  existingNote,
  onSave,
  onDelete,
}: NoteDialogProps) => {
  const [note, setNote] = useState(existingNote || "");

  useEffect(() => {
    setNote(existingNote || "");
  }, [existingNote, open]);

  const handleSave = () => {
    if (note.trim()) {
      onSave(note.trim());
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            📝 Anotação - {bookName} {chapter}:{verseNumber}
          </DialogTitle>
          <DialogDescription className="text-sm italic pt-2 border-l-2 border-muted pl-3">
            "{verseText.length > 100 ? verseText.slice(0, 100) + '...' : verseText}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Digite sua anotação aqui..."
            className="min-h-[120px] resize-none"
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {note.length}/2000
          </p>
        </div>

        <DialogFooter className="gap-2">
          {existingNote && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="mr-auto text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!note.trim()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
