import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useResourceDetail,
  endpointForResourceType,
} from "@/context/ResourceDetailContext";
import type { Citation } from "@/types/api";

interface CitationBadgeProps {
  /** Single citation or array of citations */
  citation?: Citation;
  citations?: Citation[];
}

function CitationDetail({ citation }: { citation: Citation }) {
  const { openResourceDetail } = useResourceDetail();

  return (
    <div className="space-y-1">
      <p className="font-medium">{citation.resourceType}</p>
      {citation.date && (
        <p className="text-muted-foreground">
          {new Date(citation.date).toLocaleDateString()}
        </p>
      )}
      {citation.source && (
        <p className="text-muted-foreground">{citation.source}</p>
      )}
      {citation.excerpt && (
        <p className="mt-1 text-xs italic text-muted-foreground">
          &ldquo;{citation.excerpt}&rdquo;
        </p>
      )}
      <button
        type="button"
        className="mt-1 block text-xs text-primary hover:underline"
        onClick={(e) => {
          e.stopPropagation();
          openResourceDetail(
            citation.resourceId,
            endpointForResourceType(citation.resourceType),
          );
        }}
      >
        View Source
      </button>
    </div>
  );
}

export function CitationBadge({ citation, citations }: CitationBadgeProps) {
  const all = citations ?? (citation ? [citation] : []);
  if (all.length === 0) return null;

  const label = all.length === 1 ? "Source" : "Sources";

  return (
    <Popover>
      <PopoverTrigger className="cursor-pointer" onClick={(e) => e.stopPropagation()}>
        <Badge variant="outline" className="text-xs hover:bg-accent">
          {label}
        </Badge>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {all.length === 1 ? (
          <CitationDetail citation={all[0]} />
        ) : (
          <div className="space-y-3">
            {all.map((c, i) => (
              <div
                key={c.resourceId + i}
                className={i > 0 ? "border-t pt-3" : ""}
              >
                <CitationDetail citation={c} />
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
