import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "react-router-dom";
import type { ChatCitation } from "@/types/api";

interface CitationMarkerProps {
  citation: ChatCitation;
}

export function CitationMarker({ citation }: CitationMarkerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <sup className="ml-0.5 cursor-pointer rounded bg-primary/10 px-1 text-xs font-medium text-primary hover:bg-primary/20">
          [{citation.index}]
        </sup>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm">
        <div className="space-y-1">
          <p className="font-medium">{citation.resourceType}</p>
          {citation.date && (
            <p className="text-muted-foreground">
              {new Date(citation.date).toLocaleDateString()}
            </p>
          )}
          <p className="text-xs italic text-muted-foreground">
            "{citation.excerpt}"
          </p>
          <Link
            to={`/timeline?resourceType=${citation.resourceType}`}
            className="mt-2 block text-xs text-primary hover:underline"
          >
            View Source
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
