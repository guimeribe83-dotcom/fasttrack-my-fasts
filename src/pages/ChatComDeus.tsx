import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSuggestions } from "@/components/chat/ChatSuggestions";
import { ChatPreferencesSheet } from "@/components/chat/ChatPreferencesSheet";
import { useChatWithGod } from "@/hooks/useChatWithGod";

export interface ChatPreferences {
  religiousAffiliation: string;
  needsToday: string[];
  currentMood: string[];
  discussionTopics: string[];
}

const defaultPreferences: ChatPreferences = {
  religiousAffiliation: 'cristao',
  needsToday: [],
  currentMood: [],
  discussionTopics: [],
};

export default function ChatComDeus() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [preferences, setPreferences] = useState<ChatPreferences>(defaultPreferences);
  const [showPreferences, setShowPreferences] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    conversationId,
    sendMessage,
    clearConversation,
    loadConversation,
  } = useChatWithGod(preferences);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para usar o Chat com Deus");
        navigate("/auth");
        return;
      }
      setUser(user);
      loadPreferences(user.id);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadPreferences = async (userId: string) => {
    const { data } = await supabase
      .from('chat_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setPreferences({
        religiousAffiliation: data.religious_affiliation || 'cristao',
        needsToday: data.needs_today || [],
        currentMood: data.current_mood || [],
        discussionTopics: data.discussion_topics || [],
      });
    }
  };

  const savePreferences = async (newPrefs: ChatPreferences) => {
    if (!user) return;

    const { error } = await supabase
      .from('chat_preferences')
      .upsert({
        user_id: user.id,
        religious_affiliation: newPrefs.religiousAffiliation,
        needs_today: newPrefs.needsToday,
        current_mood: newPrefs.currentMood,
        discussion_topics: newPrefs.discussionTopics,
      }, { onConflict: 'user_id' });

    if (error) {
      toast.error("Erro ao salvar preferências");
    } else {
      setPreferences(newPrefs);
      toast.success("Preferências salvas!");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleClearChat = () => {
    clearConversation();
    toast.success("Conversa limpa");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Chat com Deus</h1>
              <p className="text-xs text-muted-foreground">Conselheiro espiritual</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPreferences(true)}
            >
              <Settings2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                <span className="text-4xl">🙏</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Olá! Como posso te ajudar hoje?</h2>
                <p className="text-muted-foreground text-sm">
                  Estou aqui para oferecer orientação espiritual, conforto e palavras de sabedoria.
                </p>
              </div>
              <ChatSuggestions
                preferences={preferences}
                onSuggestionClick={handleSuggestionClick}
              />
            </div>
          ) : (
            <>
              <ChatMessages messages={messages} isLoading={isLoading} />
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      </div>

      {/* Preferences Sheet */}
      <ChatPreferencesSheet
        open={showPreferences}
        onOpenChange={setShowPreferences}
        preferences={preferences}
        onSave={savePreferences}
      />
    </div>
  );
}
