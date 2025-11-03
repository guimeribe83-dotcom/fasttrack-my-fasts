import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Palette, Trash2 } from "lucide-react";
import { HIGHLIGHT_COLOR_OPTIONS, type HighlightColor } from "@/lib/highlightColors";

interface ColorPickerProps {
  onColorSelect: (color: HighlightColor) => void;
  onRemove: () => void;
  currentColor?: HighlightColor;
}

export const ColorPicker = ({ onColorSelect, onRemove, currentColor }: ColorPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">Destacar com:</p>
          {HIGHLIGHT_COLOR_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => onColorSelect(option.value)}
            >
              <div className={`h-4 w-4 rounded-full ${option.color}`} />
              <span className="text-sm">{option.name}</span>
              {currentColor === option.value && (
                <span className="ml-auto text-xs text-primary">✓</span>
              )}
            </Button>
          ))}
          {currentColor && (
            <>
              <div className="border-t my-2" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-sm">Remover</span>
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
