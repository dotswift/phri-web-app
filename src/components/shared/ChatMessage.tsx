import ReactMarkdown from "react-markdown";
import { CitationMarker } from "./CitationMarker";
import type { ChatCitation } from "@/types/api";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
}

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

export function ChatMessage({ role, content, citations }: ChatMessageProps) {
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
        <div className="rounded-lg bg-muted px-4 py-2 text-sm">
          {hasCitations ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {renderTextWithCitations(content, citations)}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{content}</ReactMarkdown>
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
      </div>
    </div>
  );
}
