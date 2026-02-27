import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import { CitationMarker } from "./CitationMarker";
import { Sparkles } from "lucide-react";
import type { ChatCitation } from "@/types/api";
import { trimIncompleteMarkdown } from "@/lib/markdownStream";

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

/** Inject CitationMarker components into a plain-text string */
function injectCitations(text: string, citations: ChatCitation[]): ReactNode[] {
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
    return part;
  });
}

/** Walk ReactMarkdown children and replace citation markers like [1] */
function replaceCitationsInChildren(
  children: ReactNode,
  citations: ChatCitation[]
): ReactNode {
  if (typeof children === "string") {
    const injected = injectCitations(children, citations);
    // If nothing was replaced, return the original string
    return injected.length === 1 && typeof injected[0] === "string"
      ? children
      : injected;
  }
  if (Array.isArray(children)) {
    return children.map((child, i) =>
      typeof child === "string" ? (
        <span key={i}>{injectCitations(child, citations)}</span>
      ) : (
        child
      )
    );
  }
  return children;
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
  const displayContent = isStreaming ? trimIncompleteMarkdown(content) : content;

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] space-y-2">
        <div className="relative rounded-lg bg-muted px-4 py-2 text-sm">
          {/* AI-generated badge */}
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            <Sparkles className="h-2.5 w-2.5" />
            AI-generated
          </span>

          <div className="prose prose-sm max-w-none dark:prose-invert">
            {hasCitations ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p>{replaceCitationsInChildren(children, citations)}</p>
                  ),
                  li: ({ children }) => (
                    <li>{replaceCitationsInChildren(children, citations)}</li>
                  ),
                  td: ({ children }) => (
                    <td>{replaceCitationsInChildren(children, citations)}</td>
                  ),
                  th: ({ children }) => (
                    <th>{replaceCitationsInChildren(children, citations)}</th>
                  ),
                  strong: ({ children }) => (
                    <strong>{replaceCitationsInChildren(children, citations)}</strong>
                  ),
                  em: ({ children }) => (
                    <em>{replaceCitationsInChildren(children, citations)}</em>
                  ),
                }}
              >
                {displayContent}
              </ReactMarkdown>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
            )}
            {isStreaming && <span className="ml-0.5 inline-block animate-pulse">|</span>}
          </div>
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
