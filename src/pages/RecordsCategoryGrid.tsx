import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResourceTypeBadge } from "@/components/shared/ResourceTypeBadge";
import { AnimatedList } from "@/components/shared/AnimatedList";
import { FHIR_RESOURCE_COLORS } from "@/lib/colors";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { DashboardResponse } from "@/types/api";
import {
  Heart,
  Pill,
  FlaskConical,
  Syringe,
  Stethoscope,
  FileText,
} from "lucide-react";

const CATEGORIES = [
  {
    label: "Health Conditions",
    icon: Heart,
    to: "/records/conditions",
    keys: ["conditions", "allergies"] as const,
    resourceType: "Condition",
  },
  {
    label: "Medications",
    icon: Pill,
    to: "/records/medications",
    keys: ["medications"] as const,
    resourceType: "MedicationRequest",
  },
  {
    label: "Lab Results",
    icon: FlaskConical,
    to: "/records/lab-results",
    keys: ["observations", "diagnosticReports"] as const,
    resourceType: "Observation",
  },
  {
    label: "Immunizations",
    icon: Syringe,
    to: "/records/immunizations",
    keys: ["immunizations"] as const,
    resourceType: "Immunization",
  },
  {
    label: "Visits & Procedures",
    icon: Stethoscope,
    to: "/records/visits",
    keys: ["encounters", "procedures"] as const,
    resourceType: "Encounter",
  },
  {
    label: "Documents",
    icon: FileText,
    to: "/records/documents",
    keys: ["diagnosticReports"] as const,
    resourceType: "DiagnosticReport",
  },
];

export function RecordsCategoryGrid() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardResponse>("/api/dashboard")
      .then(setData)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Records</h1>

      <AnimatedList className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map(({ label, icon: Icon, to, keys, resourceType }) => {
          const count = data
            ? keys.reduce(
                (sum, k) =>
                  sum + ((data.summary[k as keyof typeof data.summary] as number) ?? 0),
                0,
              )
            : 0;
          const color = FHIR_RESOURCE_COLORS[resourceType];

          return (
            <Link key={to} to={to}>
              <Card
                className="transition-colors hover:bg-accent h-full"
                style={color ? { borderTop: `4px solid ${color.badge}` } : undefined}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={
                      color
                        ? { backgroundColor: `color-mix(in oklch, ${color.badge} 10%, transparent)` }
                        : undefined
                    }
                  >
                    <Icon
                      className="h-5 w-5"
                      style={color ? { color: color.badge } : undefined}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {count} records
                      </span>
                      <ResourceTypeBadge resourceType={resourceType} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </AnimatedList>

      <Link
        to="/records/timeline"
        className="block text-sm text-primary hover:underline"
      >
        View full timeline
      </Link>
    </div>
  );
}
