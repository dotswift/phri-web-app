import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/components/shared/ChatMessage";
import { useChat } from "@/hooks/useChat";
import { useChatAccessibility } from "@/hooks/useChatAccessibility";
import { detectCrisis, CRISIS_MESSAGE } from "@/lib/crisis-detection";
import { ApiError } from "@/lib/api";
import { Send, Phone, Square, Sparkles } from "lucide-react";

/**
 * Inline chat component for embedding on the dashboard.
 * Uses flex-1 to fill remaining viewport height from its parent.
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const hasMessages = messages.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border bg-card">
      {/* Screen reader streaming status */}
      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        className="sr-only"
      />

      {/* Messages area — scrollable, fills remaining space */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div role="log" aria-live="off" className="flex min-h-full flex-col">
          {!hasMessages && !crisisDetected && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Your health assistant</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Ask questions about your conditions, medications, lab results,
                  immunizations, or anything in your health records.
                </p>
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

          {hasMessages && (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  citations={msg.citations}
                  isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input area — pinned to bottom */}
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
            className="min-h-[44px] resize-none"
            rows={1}
            disabled={isStreaming}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="h-[44px] w-[44px]"
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
