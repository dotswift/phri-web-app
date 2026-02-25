import { useState, useCallback, useRef } from "react";
import { streamChat } from "../lib/chat";
import type { ChatCitation, ChatSSEEvent } from "../types/api";

export interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const streamingTextRef = useRef("");

  const sendMessage = useCallback(
    async (text: string) => {
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setIsStreaming(true);
      streamingTextRef.current = "";

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
        });
      } catch (err) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}`,
          };
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [sessionId],
  );

  return {
    messages,
    isStreaming,
    sessionId,
    setSessionId,
    setMessages,
    sendMessage,
  };
}
