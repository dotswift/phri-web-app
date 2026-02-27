import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataProvenance } from "@/components/shared/DataProvenance";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type {
  DashboardResponse,
  MedicationInsightsResponse,
  ImmunizationInsightsResponse,
} from "@/types/api";
import {
  Clock,
  Pill,
  Syringe,
  MessageSquare,
  ArrowRight,
  AlertTriangle,
  Info,
} from "lucide-react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const NAV_CARDS = [
  {
    label: "Timeline",
    description: "View your health events chronologically",
    icon: Clock,
    to: "/timeline",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-100 dark:bg-violet-900/30",
  },
  {
    label: "Medications",
    description: "Insights, duplicates & dosage changes",
    icon: Pill,
    to: "/records/medications/insights",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    label: "Immunizations",
    description: "Vaccine timeline & coverage",
    icon: Syringe,
    to: "/records/immunizations",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    label: "Chat",
    description: "Ask questions about your records",
    icon: MessageSquare,
    to: "/chat",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
];

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [medInsights, setMedInsights] =
    useState<MedicationInsightsResponse | null>(null);
  const [immunInsights, setImmunInsights] =
    useState<ImmunizationInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<DashboardResponse>("/api/dashboard"),
      api
        .get<MedicationInsightsResponse>("/api/medications/insights")
        .catch(() => null),
      api
        .get<ImmunizationInsightsResponse>("/api/immunizations/insights")
        .catch(() => null),
    ])
      .then(([dash, meds, immun]) => {
        setData(dash);
        setMedInsights(meds);
        setImmunInsights(immun);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const firstName = data.patient.sandboxPersona.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Greeting */}
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

      {/* Navigation cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {NAV_CARDS.map(({ label, description, icon: Icon, to, color, bg }) => (
          <Link key={to} to={to}>
            <Card className="group h-full transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="flex items-start gap-3 p-4">
                <div className={`rounded-lg p-2 ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Insight summary cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Medication summary */}
        <Link to="/records/medications/insights" className="group block">
          <Card className="flex h-full flex-col transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/30">
                  <Pill className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-base">
                  Medication Insights
                </CardTitle>
              </div>
              {medInsights && (
                <CardDescription>
                  {medInsights.insights.summary.totalActive} active
                  {medInsights.insights.summary.providerCount > 0 &&
                    ` · ${medInsights.insights.summary.providerCount} providers`}
                  {medInsights.insights.summary.totalStopped > 0 &&
                    ` · ${medInsights.insights.summary.totalStopped} stopped`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-2">
              {medInsights && medInsights.findings.length > 0 ? (
                medInsights.findings.slice(0, 2).map((f, i) => (
                  <div key={i} className="flex gap-2">
                    {f.severity === "warning" ? (
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    ) : (
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {f.text}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No medication insights available yet.
                </p>
              )}
              <div className="flex-1" />
              <p className="flex items-center gap-1 pt-2 text-xs font-medium text-primary transition-colors group-hover:underline">
                View all medication insights
                <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Immunization summary */}
        <Link to="/records/immunizations" className="group block">
          <Card className="flex h-full flex-col transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/30">
                  <Syringe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-base">
                  Immunization Insights
                </CardTitle>
              </div>
              {immunInsights && (
                <CardDescription>
                  {immunInsights.insights.summary.totalImmunizations} immunizations
                  {" · "}
                  {immunInsights.insights.summary.uniqueVaccines} vaccines
                  {immunInsights.insights.summary.providerCount > 0 &&
                    ` · ${immunInsights.insights.summary.providerCount} providers`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-2">
              {immunInsights && immunInsights.findings.length > 0 ? (
                immunInsights.findings.slice(0, 2).map((f, i) => (
                  <div key={i} className="flex gap-2">
                    {f.severity === "warning" ? (
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    ) : (
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {f.text}
                    </p>
                  </div>
                ))
              ) : immunInsights &&
                immunInsights.insights.summary.totalImmunizations > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {immunInsights.insights.summary.totalImmunizations}{" "}
                  immunization records on file.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No immunization data available yet.
                </p>
              )}
              <div className="flex-1" />
              <p className="flex items-center gap-1 pt-2 text-xs font-medium text-primary transition-colors group-hover:underline">
                View all immunization insights
                <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
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
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    </div>
  );
}
