import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ResourceTypeBadge } from "@/components/shared/ResourceTypeBadge";
import { CitationBadge } from "@/components/shared/CitationBadge";
import { DataProvenance } from "@/components/shared/DataProvenance";
import { KpiCard } from "@/components/charts/KpiCard";
import { AnimatedList } from "@/components/shared/AnimatedList";
import { FHIR_RESOURCE_COLORS } from "@/lib/colors";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useSandboxDemo } from "@/context/SandboxContext";
import { DEMO_MEDICATIONS } from "@/lib/sandboxMedications";
import type { DashboardResponse } from "@/types/api";
import {
  Clock,
  Sparkles,
  MessageSquare,
  Activity,
  Heart,
  Pill,
  Syringe,
  Stethoscope,
  FileText,
  Eye,
} from "lucide-react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const SUMMARY_CARDS: {
  key: keyof DashboardResponse["summary"];
  label: string;
  icon: React.ElementType;
  link: string;
  resourceType: string;
}[] = [
  {
    key: "conditions",
    label: "Conditions",
    icon: Heart,
    link: "/records/conditions",
    resourceType: "Condition",
  },
  {
    key: "observations",
    label: "Observations",
    icon: Eye,
    link: "/records/lab-results",
    resourceType: "Observation",
  },
  {
    key: "encounters",
    label: "Encounters",
    icon: Stethoscope,
    link: "/records/visits",
    resourceType: "Encounter",
  },
  {
    key: "immunizations",
    label: "Immunizations",
    icon: Syringe,
    link: "/records/immunizations",
    resourceType: "Immunization",
  },
  {
    key: "procedures",
    label: "Procedures",
    icon: Activity,
    link: "/records/visits",
    resourceType: "Procedure",
  },
  {
    key: "diagnosticReports",
    label: "Diagnostic Reports",
    icon: FileText,
    link: "/records/documents",
    resourceType: "DiagnosticReport",
  },
  {
    key: "medications",
    label: "Medications",
    icon: Pill,
    link: "/records/medications",
    resourceType: "MedicationRequest",
  },
];

const QUICK_ACTIONS = [
  { label: "Timeline", icon: Clock, to: "/records/timeline" },
  { label: "Deep Dive", icon: Sparkles, to: "/records/medications/insights" },
  { label: "Chat", icon: MessageSquare, to: "/chat" },
];

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { sandboxDemoActive, activateSandboxDemo } = useSandboxDemo();

  useEffect(() => {
    api
      .get<DashboardResponse>("/api/dashboard")
      .then(setData)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const firstName = data.patient.sandboxPersona.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Patient header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.summary.totalResources} total resources
          </p>
          <DataProvenance
            source={data.patient.sandboxPersona}
            lastSynced={data.patient.lastSyncedAt}
          />
        </div>
        <Badge
          variant={data.patient.status === "ready" ? "default" : "secondary"}
        >
          {data.patient.status}
        </Badge>
      </div>

      {/* Summary KPI cards */}
      <AnimatedList className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map(({ key, label, icon: Icon, link, resourceType }) => {
          const color = FHIR_RESOURCE_COLORS[resourceType];

          // Medications tile: show demo count when active, or activation prompt
          if (key === "medications" && data.summary.medications === 0) {
            const demoCount =
              DEMO_MEDICATIONS.active.length + DEMO_MEDICATIONS.other.length;

            if (sandboxDemoActive) {
              return (
                <Link key={key} to={link}>
                  <KpiCard
                    title="Medications (demo)"
                    value={demoCount}
                    icon={<Icon className="h-5 w-5" style={{ color: color?.badge }} />}
                    accentColor={color?.badge}
                  />
                </Link>
              );
            }

            return (
              <button
                key={key}
                onClick={activateSandboxDemo}
                className="w-full text-left"
              >
                <KpiCard
                  title="Medications (try demo)"
                  value={0}
                  icon={<Icon className="h-5 w-5" style={{ color: color?.badge }} />}
                  accentColor={color?.badge}
                />
              </button>
            );
          }

          return (
            <Link key={key} to={link}>
              <KpiCard
                title={label}
                value={data.summary[key]}
                icon={<Icon className="h-5 w-5" style={{ color: color?.badge }} />}
                accentColor={color?.badge}
              />
            </Link>
          );
        })}
      </AnimatedList>

      {/* Quick action pills */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map(({ label, icon: Icon, to }) => (
          <Link
            key={to}
            to={to}
            className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Icon className="h-4 w-4 text-primary" />
            {label}
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      {data.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest health events</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatedList className="space-y-3">
              {data.recentActivity.map((item) => {
                const color = FHIR_RESOURCE_COLORS[item.resourceType];
                return (
                  <Link
                    key={item.id}
                    to={`/records/timeline?resourceType=${item.resourceType}`}
                    className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent"
                    style={color ? { borderLeft: `3px solid ${color.badge}` } : undefined}
                  >
                    <div className="pl-2">
                      <p className="text-sm font-medium">
                        {item.displayText ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.source}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CitationBadge citation={item.citation} />
                      <div className="text-right">
                        <ResourceTypeBadge resourceType={item.resourceType} />
                        {item.dateRecorded && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(item.dateRecorded).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </AnimatedList>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-full" />
        ))}
      </div>
    </div>
  );
}
