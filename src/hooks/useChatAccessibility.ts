import { useRef, useCallback } from "react";

/**
 * Provides debounced streaming status announcements for screen readers.
 * Announces at sentence boundaries to avoid overwhelming screen reader users.
 */
export function useChatAccessibility() {
  const statusRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announceStreaming = useCallback((text: string) => {
    // Debounce announcements — only announce at sentence-level intervals
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (statusRef.current) {
        // Announce last sentence
        const sentences = text.split(/[.!?]+/).filter(Boolean);
        const lastSentence = sentences[sentences.length - 1]?.trim();
        if (lastSentence) {
          statusRef.current.textContent = lastSentence;
        }
      }
    }, 1000);
  }, []);

  const announceComplete = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (statusRef.current) {
      statusRef.current.textContent = "Response complete.";
    }
  }, []);

  return { statusRef, announceStreaming, announceComplete };
}
