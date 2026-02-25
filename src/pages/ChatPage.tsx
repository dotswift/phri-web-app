import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatMessage } from "@/components/shared/ChatMessage";
import { useChat, type Message } from "@/hooks/useChat";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { Send, Plus, MessageSquare, AlertTriangle } from "lucide-react";
import type { ChatSession, ChatMessage as ChatMessageType } from "@/types/api";
import { Link } from "react-router-dom";

export function ChatPage() {
  const {
    messages,
    isStreaming,
    sessionId,
    setSessionId,
    setMessages,
    sendMessage,
  } = useChat();
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [aiDisabled, setAiDisabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions
  useEffect(() => {
    api
      .get<ChatSession[]>("/api/chat/sessions")
      .then(setSessions)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setAiDisabled(true);
        }
      })
      .finally(() => setSessionsLoading(false));
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    try {
      await sendMessage(text);
      // Refresh sessions list
      const updated = await api.get<ChatSession[]>("/api/chat/sessions");
      setSessions(updated);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setAiDisabled(true);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const loadSession = async (id: string) => {
    try {
      const msgs = await api.get<ChatMessageType[]>(
        `/api/chat/sessions/${id}`,
      );
      setMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          citations: m.citations ?? undefined,
        })) as Message[],
      );
      setSessionId(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load session");
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(undefined);
  };

  if (aiDisabled) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <h2 className="text-lg font-medium">AI Chat is Disabled</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          AI mode has been turned off in your settings. Enable it to use the
          chat feature.
        </p>
        <Link to="/settings">
          <Button>Go to Settings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] md:h-[calc(100vh-theme(spacing.12))]">
      {/* Sessions sidebar */}
      <div className="hidden w-56 flex-col border-r md:flex">
        <div className="p-3">
          <Button
            variant="outline"
            className="w-full"
            size="sm"
            onClick={startNewChat}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {sessionsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))
            ) : sessions.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground">
                No chat history
              </p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent ${
                    sessionId === s.id ? "bg-accent" : ""
                  }`}
                >
                  <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2 text-xs">
                    {s.preview ?? "New session"}
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat main area */}
      <div className="flex flex-1 flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex h-40 items-center justify-center text-center text-sm text-muted-foreground">
                Ask a question about your health records
              </div>
            )}
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                role={msg.role}
                content={msg.content}
                citations={msg.citations}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-3">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your health records..."
              className="min-h-[40px] resize-none"
              rows={1}
              disabled={isStreaming}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {isStreaming && (
            <p className="mt-1 text-xs text-muted-foreground">
              Generating response...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
