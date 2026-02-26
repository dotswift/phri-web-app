import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DataProvenance({
  source,
  lastSynced,
  onSync,
  syncing,
}: {
  source?: string;
  lastSynced?: string | null;
  onSync?: () => void;
  syncing?: boolean;
}) {
  const syncText = lastSynced
    ? `Last synced: ${new Date(lastSynced).toLocaleString()}`
    : "Not yet synced";

  const isStale =
    lastSynced &&
    Date.now() - new Date(lastSynced).getTime() > 24 * 60 * 60 * 1000;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      {source && (
        <>
          <span>From {source} via FHIR</span>
          <span aria-hidden="true" className="text-muted-foreground/40">
            ·
          </span>
        </>
      )}
      <span
        aria-live="polite"
        className={isStale ? "text-warning font-medium" : ""}
      >
        {syncing ? "Syncing..." : syncText}
      </span>
      {onSync && (
        <>
          <span aria-hidden="true" className="text-muted-foreground/40">
            ·
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-primary hover:underline"
            onClick={onSync}
            disabled={syncing}
          >
            <RefreshCw
              className={`mr-1 h-3 w-3 ${syncing ? "animate-spin" : ""}`}
            />
            Sync now
          </Button>
        </>
      )}
    </div>
  );
}
