import ReactMarkdown from "react-markdown";
import { CitationMarker } from "./CitationMarker";
import { Sparkles } from "lucide-react";
import type { ChatCitation } from "@/types/api";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
  isStreaming?: boolean;
  onSuggestionClick?: (text: string) => void;
}

const FOLLOW_UP_CHIPS = [
  "Tell me more",
  "Compare to previous results",
  "Is this value normal?",
];

function renderTextWithCitations(text: string, citations: ChatCitation[]) {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/\[(\d+)\]/);
    if (match) {
      const index = parseInt(match[1], 10);
      const citation = citations.find((c) => c.index === index);
      if (citation) {
        return <CitationMarker key={i} citation={citation} />;
      }
    }
    return <span key={i}>{part}</span>;
  });
}

export function ChatMessage({ role, content, citations, isStreaming, onSuggestionClick }: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
          {content}
        </div>
      </div>
    );
  }

  // Assistant message
  const hasCitations = citations && citations.length > 0;

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] space-y-2">
        <div className="relative rounded-lg bg-muted px-4 py-2 text-sm">
          {/* AI-generated badge */}
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            <Sparkles className="h-2.5 w-2.5" />
            AI-generated
          </span>

          {hasCitations ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {renderTextWithCitations(content, citations)}
              {isStreaming && <span className="ml-0.5 inline-block animate-pulse">|</span>}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{content}</ReactMarkdown>
              {isStreaming && <span className="ml-0.5 inline-block animate-pulse">|</span>}
            </div>
          )}
        </div>
        {hasCitations && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground">Sources:</span>
            {citations.map((c) => (
              <span
                key={c.index}
                className="text-xs text-muted-foreground"
              >
                [{c.index}] {c.excerpt}
                {c.index < citations.length ? "," : ""}
              </span>
            ))}
          </div>
        )}
        {/* Follow-up suggestion chips — show only when not streaming and has content */}
        {!isStreaming && content && onSuggestionClick && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {FOLLOW_UP_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => onSuggestionClick(chip)}
                className="rounded-full border bg-card px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
