import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import { CitationMarker } from "./CitationMarker";
import {
  BookOpen,
  Sparkles,
  Heart,
  FileText,
  Stethoscope,
  Syringe,
  Eye,
  Activity,
  Pill,
  AlertTriangle,
} from "lucide-react";
import type { ChatCitation } from "@/types/api";
import { trimIncompleteMarkdown } from "@/lib/markdownStream";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FHIR_RESOURCE_COLORS } from "@/lib/colors";
import {
  useResourceDetail,
  endpointForResourceType,
} from "@/context/ResourceDetailContext";

const SOURCE_ICONS: Record<string, React.ElementType> = {
  Condition: Heart,
  DiagnosticReport: FileText,
  Encounter: Stethoscope,
  Immunization: Syringe,
  Observation: Eye,
  Procedure: Activity,
  MedicationRequest: Pill,
  AllergyIntolerance: AlertTriangle,
};

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

function SourcesDialog({ citations }: { citations: ChatCitation[] }) {
  const { openResourceDetail } = useResourceDetail();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="mt-1 inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
          <BookOpen className="h-3 w-3" />
          Sources ({citations.length})
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[70vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sources</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {citations.map((c) => {
            const color = FHIR_RESOURCE_COLORS[c.resourceType];
            const Icon = SOURCE_ICONS[c.resourceType];
            return (
              <div
                key={c.index}
                className="rounded-lg border p-3"
                style={color ? { borderLeftWidth: 4, borderLeftColor: color.badge } : undefined}
              >
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                    {c.index}
                  </span>
                  {Icon && (
                    <Icon
                      className="h-3.5 w-3.5"
                      style={color ? { color: color.badge } : undefined}
                    />
                  )}
                  <span className="text-sm font-medium">{c.resourceType}</span>
                  {c.date && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(c.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs italic text-muted-foreground">
                  "{c.excerpt}"
                </p>
                <button
                  type="button"
                  className="mt-1.5 text-xs text-primary hover:underline"
                  onClick={() =>
                    openResourceDetail(
                      c.fhirResourceId,
                      endpointForResourceType(c.resourceType),
                    )
                  }
                >
                  View record
                </button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
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
        {hasCitations && !isStreaming && (
          <SourcesDialog citations={citations} />
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
