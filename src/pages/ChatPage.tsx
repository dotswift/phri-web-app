import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatMessage } from "@/components/shared/ChatMessage";
import { useChat, type Message } from "@/hooks/useChat";
import { useChatAccessibility } from "@/hooks/useChatAccessibility";
import { detectCrisis, CRISIS_MESSAGE } from "@/lib/crisis-detection";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { Send, Plus, MessageSquare, AlertTriangle, Phone, Sparkles, Square } from "lucide-react";
import type { ChatSession, ChatMessage as ChatMessageType } from "@/types/api";
import { Link } from "react-router-dom";

const SUGGESTED_PROMPTS = [
  "What conditions do I have?",
  "Explain my latest lab results",
  "Do any of my medications interact?",
  "Am I up to date on vaccines?",
];

export function ChatPage() {
  const {
    messages,
    isStreaming,
    sessionId,
    setSessionId,
    setMessages,
    sendMessage,
    stopStreaming,
  } = useChat();
  const { statusRef, announceStreaming, announceComplete } =
    useChatAccessibility();
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [aiDisabled, setAiDisabled] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
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

  // Announce streaming for screen readers
  useEffect(() => {
    if (isStreaming && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant") {
        announceStreaming(lastMsg.content);
      }
    } else if (!isStreaming) {
      announceComplete();
    }
  }, [isStreaming, messages, announceStreaming, announceComplete]);

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isStreaming) return;

    // Crisis detection — bypass AI
    const crisisResult = detectCrisis(messageText);
    if (crisisResult.isCrisis) {
      setCrisisDetected(true);
      setInput("");
      return;
    }

    setInput("");
    try {
      await sendMessage(messageText);
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
      setCrisisDetected(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load session",
      );
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(undefined);
    setCrisisDetected(false);
  };

  if (aiDisabled) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-12 w-12 text-warning" />
        <h1 className="text-lg font-medium">AI Chat is Disabled</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          AI mode has been turned off in your settings. Enable it to use the
          chat feature.
        </p>
        <Link to="/profile/settings">
          <Button>Go to Settings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-3rem)] overflow-hidden">
      <h1 className="sr-only">Chat</h1>

      {/* Screen reader streaming status */}
      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        className="sr-only"
      />

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
      <div className="flex flex-1 flex-col min-h-0">
        <ScrollArea className="flex-1 min-h-0 p-4">
          <div role="log" aria-live="off" className="space-y-4">
            {messages.length === 0 && !crisisDetected && (
              <div className="flex flex-col items-center justify-center gap-6 pt-12 text-center">
                <div>
                  <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ask a question about your health records
                  </p>
                </div>

                {/* Suggested prompts */}
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Sparkles className="mr-1 inline h-3 w-3" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Crisis detection card */}
            {crisisDetected && (
              <div
                role="alert"
                aria-live="assertive"
                className="mx-auto max-w-md rounded-lg border-2 border-destructive bg-destructive/5 p-4"
              >
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 shrink-0 text-destructive" />
                  <div className="space-y-2">
                    <p className="font-semibold text-destructive">
                      {CRISIS_MESSAGE.title}
                    </p>
                    <p className="text-sm">{CRISIS_MESSAGE.body}</p>
                    <div className="space-y-1">
                      {CRISIS_MESSAGE.contacts.map((c) => (
                        <p key={c.number} className="text-sm font-medium">
                          {c.label}:{" "}
                          <a
                            href={`tel:${c.number}`}
                            className="text-primary underline"
                          >
                            {c.number}
                          </a>
                        </p>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCrisisDetected(false)}
                      className="mt-2"
                    >
                      Continue chatting
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                role={msg.role}
                content={msg.content}
                citations={msg.citations}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
                onSuggestionClick={
                  !isStreaming && i === messages.length - 1 && msg.role === "assistant"
                    ? (text) => handleSend(text)
                    : undefined
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t p-3">
          {/* Stop generating button */}
          {isStreaming && (
            <div className="mb-2 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={stopStreaming}
                className="gap-1.5"
              >
                <Square className="h-3 w-3" />
                Stop generating
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <label htmlFor="chat-input" className="sr-only">
              Message
            </label>
            <Textarea
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your health records..."
              className="min-h-[40px] resize-none"
              rows={1}
              disabled={isStreaming}
              aria-describedby="chat-help-text"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              size="icon"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <p
              id="chat-help-text"
              className="text-xs text-muted-foreground"
            >
              {isStreaming
                ? "Generating response..."
                : "Press Enter to send"}
            </p>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            AI assistant for informational purposes only. Not medical advice.
            Always consult your healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );
}
