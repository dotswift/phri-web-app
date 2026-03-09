import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/components/shared/ChatMessage";
import { useChat } from "@/hooks/useChat";
import { useChatAccessibility } from "@/hooks/useChatAccessibility";
import { detectCrisis, CRISIS_MESSAGE } from "@/lib/crisis-detection";
import { api, ApiError } from "@/lib/api";
import { Send, MessageSquare, Phone, Sparkles, Square } from "lucide-react";

const DEFAULT_PROMPTS = [
  "What conditions do I have?",
  "Explain my latest lab results",
  "Am I up to date on vaccines?",
];

/**
 * Inline chat component for embedding on the dashboard.
 * No sidebar, no full-page layout — just the chat interface.
 */
export function InlineChat() {
  const {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
  } = useChat();
  const { statusRef, announceStreaming, announceComplete } =
    useChatAccessibility();
  const [input, setInput] = useState("");
  const [aiDisabled, setAiDisabled] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_PROMPTS);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load suggestions
  useEffect(() => {
    api
      .get<{ suggestions: Array<{ text: string }> }>("/api/chat/suggestions")
      .then((result) => {
        if (result.suggestions.length > 0) {
          setSuggestions(result.suggestions.map((s) => s.text));
        }
      })
      .catch(() => {});
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

  if (aiDisabled) return null;

  return (
    <div className="rounded-lg border bg-card">
      {/* Screen reader streaming status */}
      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        className="sr-only"
      />

      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Ask about your records</h2>
      </div>

      {/* Messages area */}
      <div className="max-h-[300px] overflow-y-auto p-4 sm:max-h-[400px]">
        <div role="log" aria-live="off" className="space-y-4">
          {messages.length === 0 && !crisisDetected && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Ask a question about your health records
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((prompt) => (
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
      </div>

      {/* Input area */}
      <div className="border-t px-4 py-3">
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
        <p className="mt-1 text-[10px] text-muted-foreground">
          AI assistant for informational purposes only. Not medical advice.
        </p>
      </div>
    </div>
  );
}
