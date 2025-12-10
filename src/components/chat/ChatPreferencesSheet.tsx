import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatPreferences } from "@/pages/ChatComDeus";
import { cn } from "@/lib/utils";

interface ChatPreferencesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: ChatPreferences;
  onSave: (preferences: ChatPreferences) => void;
}

const affiliationOptions = [
  { value: 'cristao', label: 'Cristão', icon: '✝️' },
  { value: 'catolico', label: 'Católico', icon: '⛪' },
  { value: 'protestante', label: 'Protestante', icon: '📖' },
  { value: 'evangelico', label: 'Evangélico', icon: '🙏' },
  { value: 'espirita', label: 'Espírita', icon: '🕊️' },
  { value: 'agnostico', label: 'Agnóstico', icon: '🔍' },
];

const needsOptions = [
  { value: 'inspiracao', label: 'Inspiração', icon: '🌟' },
  { value: 'versiculo', label: 'Versículo', icon: '📖' },
  { value: 'conforto', label: 'Conforto', icon: '🤗' },
  { value: 'orientacao', label: 'Orientação', icon: '🧭' },
  { value: 'confissao', label: 'Confissão', icon: '🙏' },
  { value: 'louvor', label: 'Louvor', icon: '✨' },
];

const moodOptions = [
  { value: 'feliz', label: 'Feliz', icon: '😊' },
  { value: 'grato', label: 'Grato', icon: '🙏' },
  { value: 'triste', label: 'Triste', icon: '😔' },
  { value: 'ansioso', label: 'Ansioso', icon: '😰' },
  { value: 'irritado', label: 'Irritado', icon: '😤' },
  { value: 'confuso', label: 'Confuso', icon: '😕' },
  { value: 'paz', label: 'Em Paz', icon: '🕊️' },
  { value: 'esperancoso', label: 'Esperançoso', icon: '🌟' },
];

const topicOptions = [
  { value: 'fe', label: 'Fé', icon: '🙏' },
  { value: 'familia', label: 'Família', icon: '❤️' },
  { value: 'trabalho', label: 'Trabalho', icon: '💼' },
  { value: 'financas', label: 'Finanças', icon: '💰' },
  { value: 'saude', label: 'Saúde', icon: '❤️‍🩹' },
  { value: 'relacionamentos', label: 'Relacionamentos', icon: '💑' },
  { value: 'futuro', label: 'Futuro', icon: '🔮' },
  { value: 'luto', label: 'Luto/Perda', icon: '😢' },
  { value: 'tentacao', label: 'Tentação', icon: '⚔️' },
  { value: 'milagres', label: 'Milagres', icon: '🙌' },
];

export function ChatPreferencesSheet({ open, onOpenChange, preferences, onSave }: ChatPreferencesSheetProps) {
  const [localPrefs, setLocalPrefs] = useState<ChatPreferences>(preferences);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const toggleArrayItem = (array: string[], item: string): string[] => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const handleSave = () => {
    onSave(localPrefs);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle>Configurar Chat</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Religious Affiliation */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                📿 Afiliação Religiosa
              </h3>
              <div className="flex flex-wrap gap-2">
                {affiliationOptions.map(option => (
                  <Badge
                    key={option.value}
                    variant={localPrefs.religiousAffiliation === option.value ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all py-1.5 px-3",
                      localPrefs.religiousAffiliation === option.value && "bg-primary"
                    )}
                    onClick={() => setLocalPrefs(p => ({ ...p, religiousAffiliation: option.value }))}
                  >
                    {option.icon} {option.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Needs Today */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                🎯 O que preciso hoje
              </h3>
              <div className="flex flex-wrap gap-2">
                {needsOptions.map(option => (
                  <Badge
                    key={option.value}
                    variant={localPrefs.needsToday.includes(option.value) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all py-1.5 px-3",
                      localPrefs.needsToday.includes(option.value) && "bg-primary"
                    )}
                    onClick={() => setLocalPrefs(p => ({
                      ...p,
                      needsToday: toggleArrayItem(p.needsToday, option.value)
                    }))}
                  >
                    {option.icon} {option.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Current Mood */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                💭 Como estou me sentindo
              </h3>
              <div className="flex flex-wrap gap-2">
                {moodOptions.map(option => (
                  <Badge
                    key={option.value}
                    variant={localPrefs.currentMood.includes(option.value) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all py-1.5 px-3",
                      localPrefs.currentMood.includes(option.value) && "bg-primary"
                    )}
                    onClick={() => setLocalPrefs(p => ({
                      ...p,
                      currentMood: toggleArrayItem(p.currentMood, option.value)
                    }))}
                  >
                    {option.icon} {option.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Discussion Topics */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                📚 Tópicos de interesse
              </h3>
              <div className="flex flex-wrap gap-2">
                {topicOptions.map(option => (
                  <Badge
                    key={option.value}
                    variant={localPrefs.discussionTopics.includes(option.value) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all py-1.5 px-3",
                      localPrefs.discussionTopics.includes(option.value) && "bg-primary"
                    )}
                    onClick={() => setLocalPrefs(p => ({
                      ...p,
                      discussionTopics: toggleArrayItem(p.discussionTopics, option.value)
                    }))}
                  >
                    {option.icon} {option.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
          <Button onClick={handleSave} className="w-full">
            Aplicar Filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
