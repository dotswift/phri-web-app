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
  citation: Citation;
}

export function CitationBadge({ citation }: CitationBadgeProps) {
  const { openResourceDetail } = useResourceDetail();

  return (
    <Popover>
      <PopoverTrigger className="cursor-pointer">
        <Badge
          variant="outline"
          className="text-xs hover:bg-accent"
        >
          Source
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm">
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
            <p className="mt-2 text-xs italic text-muted-foreground">
              "{citation.excerpt}"
            </p>
          )}
          <button
            type="button"
            className="mt-2 block text-xs text-primary hover:underline"
            onClick={() =>
              openResourceDetail(
                citation.resourceId,
                endpointForResourceType(citation.resourceType),
              )
            }
          >
            View Source
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
