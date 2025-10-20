import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical, Share2, Star, Copy, Type, Moon, Sun } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export const BibleActionButton = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleShare = () => {
    toast.success("Compartilhamento em breve!");
  };

  const handleFavorite = () => {
    toast.success("Favoritos em breve!");
  };

  const handleCopy = () => {
    toast.success("Copiar em breve!");
  };

  const handleFontSize = () => {
    toast.success("Ajuste de fonte em breve!");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    toast.success(`Tema ${theme === "dark" ? "claro" : "escuro"} ativado!`);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-24 md:bottom-8 right-4 md:right-6 h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white z-40 transition-all duration-300 hover:shadow-2xl hover:scale-110"
        >
          <MoreVertical className="w-6 h-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-popover/95 backdrop-blur-md border-primary/30 z-50 mb-2"
      >
        <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar versículo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFavorite} className="cursor-pointer">
          <Star className="w-4 h-4 mr-2" />
          Marcar favorito
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
          <Copy className="w-4 h-4 mr-2" />
          Copiar texto
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFontSize} className="cursor-pointer">
          <Type className="w-4 h-4 mr-2" />
          Tamanho da fonte
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 mr-2" />
              Modo claro
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 mr-2" />
              Modo escuro
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
