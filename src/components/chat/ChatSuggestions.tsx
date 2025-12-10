import { Button } from "@/components/ui/button";
import { ChatPreferences } from "@/pages/ChatComDeus";

interface ChatSuggestionsProps {
  preferences: ChatPreferences;
  onSuggestionClick: (suggestion: string) => void;
}

const baseSuggestions = [
  "Pode me dar uma palavra de conforto para hoje?",
  "Compartilhe um versículo que me ajude a ter esperança",
  "Como posso fortalecer minha fé?",
  "Preciso de orientação para uma decisão importante",
];

const moodSuggestions: Record<string, string[]> = {
  ansioso: [
    "Como encontrar paz em momentos de ansiedade?",
    "Existe algum versículo sobre confiar em Deus?",
  ],
  triste: [
    "Preciso de conforto, estou passando por um momento difícil",
    "Como Deus me vê nos momentos de tristeza?",
  ],
  feliz: [
    "Quero agradecer a Deus pelas bênçãos de hoje",
    "Como posso expressar minha gratidão?",
  ],
  confuso: [
    "Como discernir a vontade de Deus?",
    "Preciso de clareza para tomar uma decisão",
  ],
  grato: [
    "Quero louvar a Deus pela sua bondade",
    "Como cultivar um coração agradecido?",
  ],
};

const topicSuggestions: Record<string, string[]> = {
  familia: [
    "Como orar pela minha família?",
    "Orientação para lidar com conflitos familiares",
  ],
  trabalho: [
    "Como honrar a Deus no meu trabalho?",
    "Preciso de direção profissional",
  ],
  saude: [
    "Uma oração para minha saúde",
    "Como confiar em Deus em tempos de doença?",
  ],
  relacionamentos: [
    "Orientação para meus relacionamentos",
    "Como perdoar alguém que me magoou?",
  ],
  financas: [
    "Como administrar minhas finanças com sabedoria?",
    "Versículos sobre provisão divina",
  ],
  futuro: [
    "Como confiar em Deus sobre o meu futuro?",
    "Preciso de esperança para os dias à frente",
  ],
  luto: [
    "Como lidar com a perda de alguém querido?",
    "Preciso de consolo neste momento de dor",
  ],
};

export function ChatSuggestions({ preferences, onSuggestionClick }: ChatSuggestionsProps) {
  const getSuggestions = (): string[] => {
    const suggestions: string[] = [];
    
    // Add mood-based suggestions
    preferences.currentMood.forEach(mood => {
      if (moodSuggestions[mood]) {
        suggestions.push(...moodSuggestions[mood].slice(0, 1));
      }
    });
    
    // Add topic-based suggestions
    preferences.discussionTopics.forEach(topic => {
      if (topicSuggestions[topic]) {
        suggestions.push(...topicSuggestions[topic].slice(0, 1));
      }
    });
    
    // Fill with base suggestions if needed
    const remaining = 4 - suggestions.length;
    if (remaining > 0) {
      suggestions.push(...baseSuggestions.slice(0, remaining));
    }
    
    return suggestions.slice(0, 4);
  };

  const suggestions = getSuggestions();

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium">Perguntas sugeridas:</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="text-xs h-auto py-2 px-3 whitespace-normal text-left"
            onClick={() => onSuggestionClick(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}
