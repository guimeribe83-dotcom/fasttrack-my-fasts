import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            "flex",
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          <div
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
              message.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-card border border-border rounded-bl-md'
            )}
          >
            {message.role === 'assistant' && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🕊️</span>
                <span className="text-xs font-medium text-muted-foreground">Conselheiro</span>
              </div>
            )}
            <div className="whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          </div>
        </div>
      ))}
      
      {isLoading && messages[messages.length - 1]?.role === 'user' && (
        <div className="flex justify-start">
          <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🕊️</span>
              <span className="text-xs font-medium text-muted-foreground">Conselheiro</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
