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
      <CardContent className="flex items-start gap-1.5 overflow-hidden px-2 py-1.5">
        {/* Date block */}
        <div className="flex w-8 shrink-0 flex-col items-center pt-0.5 text-center">
          {date ? (
            <>
              <span className="text-lg font-bold leading-none">
                {format(date, "d")}
              </span>
              <span className="text-[10px] uppercase text-muted-foreground">
                {format(date, "MMM")}
              </span>
            </>
          ) : (
            <span className="text-[10px] text-muted-foreground">--</span>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-medium">
              {item.displayText ?? "Unknown"}
            </p>
            {/* Desktop: badges inline */}
            <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
              <CitationBadge citation={item.citation} />
              <ResourceTypeBadge resourceType={item.resourceType} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            {item.source && (
              <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground/70">
                {item.source}
              </p>
            )}
            {/* Mobile: only resource type badge */}
            <div className="flex shrink-0 sm:hidden">
              <ResourceTypeBadge resourceType={item.resourceType} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
