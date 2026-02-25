import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Citation } from "@/types/api";

interface CitationBadgeProps {
  citation: Citation;
}

export function CitationBadge({ citation }: CitationBadgeProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          variant="outline"
          className="cursor-pointer text-xs hover:bg-accent"
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
