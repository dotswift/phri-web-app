import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Heart,
  Pill,
  ShieldAlert,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import type { DashboardSnapshot, DashboardResponse } from "@/types/api";

interface SnapshotRow {
  icon: React.ElementType;
  label: string;
  count?: number;
  to: string;
}

export function HealthSnapshotCard({
  snapshot,
  summary,
}: {
  snapshot: DashboardSnapshot;
  summary: DashboardResponse["summary"];
}) {
  const navigate = useNavigate();

  const rows: SnapshotRow[] = [];

  // Conditions
  if (snapshot.activeConditions.length > 0) {
    rows.push({
      icon: Heart,
      label: `${snapshot.activeConditions.length} active condition${snapshot.activeConditions.length !== 1 ? "s" : ""}`,
      to: "/records/conditions",
    });
  } else if (summary.conditions > 0) {
    rows.push({
      icon: Heart,
      label: `${summary.conditions} past condition${summary.conditions !== 1 ? "s" : ""}`,
      to: "/records/conditions",
    });
  }

  // Medications
  if (snapshot.activeMedications.length > 0) {
    rows.push({
      icon: Pill,
      label: `${snapshot.activeMedications.length} active medication${snapshot.activeMedications.length !== 1 ? "s" : ""}`,
      to: "/records/medications/insights",
    });
  } else if (summary.medications > 0) {
    rows.push({
      icon: Pill,
      label: `${summary.medications} medication${summary.medications !== 1 ? "s" : ""} on file`,
      to: "/records/medications/insights",
    });
  }

  // Allergies
  if (snapshot.activeAllergies.length > 0) {
    rows.push({
      icon: ShieldAlert,
      label: `${snapshot.activeAllergies.length} allerg${snapshot.activeAllergies.length !== 1 ? "ies" : "y"}`,
      to: "/records/conditions",
    });
  }

  // Last visit
  if (snapshot.lastEncounter) {
    const enc = snapshot.lastEncounter;
    const dateStr = enc.date ? format(new Date(enc.date), "MMM d") : null;
    const parts = [dateStr, enc.type].filter(Boolean);
    rows.push({
      icon: Stethoscope,
      label: `Last visit${parts.length > 0 ? `: ${parts.join(" — ")}` : ""}`,
      to: "/records/visits",
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">Health Snapshot</h2>
      <div className="space-y-1">
        {rows.map((row) => (
          <div
            key={row.label}
            onClick={() => navigate(row.to)}
            className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
          >
            <row.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 truncate">{row.label}</span>
            <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  );
}
