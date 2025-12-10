import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatContext {
  religiousAffiliation: string;
  needsToday: string[];
  currentMood: string[];
  discussionTopics: string[];
}

const CHAT_URL = `https://vaynvghwdiaviglqkadu.supabase.co/functions/v1/chat-with-god`;

export function useChatWithGod(context: ChatContext) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const createConversation = async (firstMessage: string): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
    
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({ user_id: user.id, title })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return data.id;
  };

  const saveMessage = async (convId: string, message: Message) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: convId,
        user_id: user.id,
        role: message.role,
        content: message.content,
      });
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let currentConvId = conversationId;
    
    // Create conversation if this is the first message
    if (!currentConvId) {
      currentConvId = await createConversation(content);
      if (currentConvId) {
        setConversationId(currentConvId);
      }
    }

    // Save user message
    if (currentConvId) {
      await saveMessage(currentConvId, userMessage);
    }

    let assistantContent = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao enviar mensagem');
      }

      if (!response.body) {
        throw new Error('Resposta vazia do servidor');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      // Add empty assistant message to update
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              assistantContent += deltaContent;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') {
                  newMessages[newMessages.length - 1] = {
                    ...lastMsg,
                    content: assistantContent,
                  };
                }
                return newMessages;
              });
            }
          } catch {
            // Incomplete JSON, put back and wait for more
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Save assistant message
      if (currentConvId && assistantContent) {
        await saveMessage(currentConvId, { role: 'assistant', content: assistantContent });
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
      // Remove empty assistant message on error
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === 'assistant' && !lastMsg.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, context, isLoading, conversationId]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  const loadConversation = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading conversation:', error);
      return;
    }

    if (data) {
      setMessages(data as Message[]);
      setConversationId(convId);
    }
  }, []);

  return {
    messages,
    isLoading,
    conversationId,
    sendMessage,
    clearConversation,
    loadConversation,
  };
}
