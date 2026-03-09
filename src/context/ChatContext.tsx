import { createContext, useContext, useState, useCallback, useRef } from "react";
import { streamChat } from "../lib/chat";
import type { ChatCitation, ChatSSEEvent } from "../types/api";

export interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
}

interface ChatContextValue {
  messages: Message[];
  isStreaming: boolean;
  sessionId: string | undefined;
  setSessionId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sendMessage: (text: string) => Promise<void>;
  stopStreaming: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const streamingTextRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setIsStreaming(true);
      streamingTextRef.current = "";

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamChat(text, sessionId, (event: ChatSSEEvent) => {
          switch (event.type) {
            case "text_delta":
              streamingTextRef.current += event.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: streamingTextRef.current,
                };
                return updated;
              });
              break;

            case "citations":
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  citations: event.citations,
                };
                return updated;
              });
              break;

            case "done":
              setSessionId(event.sessionId);
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  id: event.messageId,
                };
                return updated;
              });
              break;

            case "error": {
              const friendly =
                event.error === "Message contains disallowed content"
                  ? "I can only answer questions about your health records. Please rephrase your question."
                  : event.error;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: friendly,
                };
                return updated;
              });
              break;
            }
          }
        }, controller.signal);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}`,
          };
          return updated;
        });
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [sessionId],
  );

  return (
    <ChatContext.Provider
      value={{
        messages,
        isStreaming,
        sessionId,
        setSessionId,
        setMessages,
        sendMessage,
        stopStreaming,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return ctx;
}
