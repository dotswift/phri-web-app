import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
}

/** Strip inline citation markers like [1], [5], [8] from text */
function stripCitationMarkers(text: string): string {
  return text.replace(/\s*\[\d+\]/g, "");
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
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Sources</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 overflow-y-auto">
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

export function ChatMessage({ role, content, citations, isStreaming }: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
          {content}
        </div>
      </div>
    );
  }

  // Assistant message
  const hasCitations = citations && citations.length > 0;
  const rawContent = isStreaming ? trimIncompleteMarkdown(content) : content;
  const displayContent = stripCitationMarkers(rawContent);

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
        <div className="relative rounded-lg bg-muted px-4 py-2 text-sm">
          {/* AI-generated badge */}
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            <Sparkles className="h-2.5 w-2.5" />
            AI-generated
          </span>

          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
            {isStreaming && <span className="ml-0.5 inline-block animate-pulse">|</span>}
          </div>
        </div>
        {hasCitations && !isStreaming && (
          <SourcesDialog citations={citations} />
        )}
      </div>
    </div>
  );
}
