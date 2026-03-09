import { CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import type { DashboardSnapshot } from "@/types/api";

const INTERP_LABELS: Record<string, { label: string; className: string }> = {
  HH: { label: "Critical High", className: "bg-red-100 text-red-700" },
  LL: { label: "Critical Low", className: "bg-red-100 text-red-700" },
  H: { label: "High", className: "bg-amber-100 text-amber-700" },
  L: { label: "Low", className: "bg-amber-100 text-amber-700" },
};

export function NeedsAttentionCard({
  snapshot,
}: {
  snapshot: DashboardSnapshot;
}) {
  const highRiskAllergies = snapshot.activeAllergies.filter(
    (a) => a.criticality === "high",
  );
  const hasFlagged = snapshot.flaggedLabs.length > 0 || highRiskAllergies.length > 0;
  const hasAnyAllergies = snapshot.activeAllergies.length > 0;

  return (
    <div className="rounded-2xl border bg-card p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {hasFlagged ? (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        ) : (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        )}
        {hasFlagged ? "Needs Attention" : hasAnyAllergies ? "Your Allergies" : "All Clear"}
      </h2>

      {hasFlagged ? (
        <div className="space-y-2">
          {snapshot.flaggedLabs.map((lab) => {
            const interp = INTERP_LABELS[lab.interpretation ?? ""] ?? {
              label: lab.interpretation,
              className: "bg-muted text-muted-foreground",
            };
            return (
              <div key={lab.id} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 truncate font-medium">{lab.name}</span>
                {lab.value != null && (
                  <span className="shrink-0 text-muted-foreground">
                    {lab.value}
                    {lab.unit ? ` ${lab.unit}` : ""}
                  </span>
                )}
                <span
                  className={`ml-auto shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${interp.className}`}
                >
                  {interp.label}
                </span>
              </div>
            );
          })}
          {highRiskAllergies.map((allergy) => (
            <div key={allergy.id} className="flex items-center gap-2 text-sm">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-red-500" />
              <span className="min-w-0 truncate font-medium">{allergy.name}</span>
              <span className="ml-auto shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                High-risk
              </span>
            </div>
          ))}
        </div>
      ) : hasAnyAllergies ? (
        <div className="space-y-2">
          {snapshot.activeAllergies.map((allergy) => (
            <div key={allergy.id} className="flex items-center gap-2 text-sm">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate">{allergy.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No flagged items — everything looks good.
        </p>
      )}
    </div>
  );
}
