import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { CitationBadge } from "@/components/shared/CitationBadge";
import { ResourceTypeBadge } from "@/components/shared/ResourceTypeBadge";
import { FHIR_RESOURCE_COLORS } from "@/lib/colors";
import {
  useResourceDetail,
  endpointForResourceType,
} from "@/context/ResourceDetailContext";
import type { TimelineItem } from "@/types/api";

const DEFAULT_BORDER = "oklch(0.55 0.02 260)";

export function TimelineItemCard({ item }: { item: TimelineItem }) {
  const { openResourceDetail } = useResourceDetail();
  const color = FHIR_RESOURCE_COLORS[item.resourceType];
  const borderColor = color?.badge ?? DEFAULT_BORDER;
  const date = item.dateRecorded ? new Date(item.dateRecorded) : null;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent"
      style={{ borderLeft: `3px solid ${borderColor}` }}
      onClick={() =>
        openResourceDetail(item.id, endpointForResourceType(item.resourceType))
      }
    >
      <CardContent className="flex items-center gap-3 p-3">
        {/* Date block */}
        <div className="flex w-10 shrink-0 flex-col items-center text-center">
          {date ? (
            <>
              <span className="text-2xl font-bold leading-none">
                {format(date, "d")}
              </span>
              <span className="text-xs uppercase text-muted-foreground">
                {format(date, "MMM")}
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">--</span>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {item.displayText ?? "Unknown"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {item.source}
          </p>
        </div>

        {/* Badges */}
        <div className="flex shrink-0 items-center gap-2">
          <CitationBadge citation={item.citation} />
          <ResourceTypeBadge resourceType={item.resourceType} />
        </div>
      </CardContent>
    </Card>
  );
}
