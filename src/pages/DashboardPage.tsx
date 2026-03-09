import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataProvenance } from "@/components/shared/DataProvenance";
import { useHealthData } from "@/context/HealthDataContext";
import { usePendingUploadStatus } from "@/hooks/usePendingUploadStatus";
import { toast } from "sonner";
import {
  Clock,
  Pill,
  Syringe,
  MessageSquare,
  ArrowRight,
  AlertTriangle,
  Info,
  FileUp,
  FileText,
  Search,
  Phone,
  Mail,
  Printer,
  Globe,
  Sparkles,
  BrainCircuit,
  Loader2,
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
  const {
    dashboard: data,
    medInsights,
    immunInsights,
    initialLoading,
    refreshDashboard,
  } = useHealthData();

  const {
    isExtracting,
    isProcessing,
    extractionDone,
    enrichmentDone,
    embeddingDone,
    chunksCompleted,
    totalChunks,
  } = usePendingUploadStatus();

  // Track previous values to only toast on transitions, not on mount
  const prevEnrichmentDone = useRef(enrichmentDone);
  const prevEmbeddingDone = useRef(embeddingDone);
  const prevChunksCompleted = useRef(chunksCompleted);

  // Refresh dashboard when new chunks arrive
  useEffect(() => {
    if (chunksCompleted > 0 && chunksCompleted !== prevChunksCompleted.current) {
      refreshDashboard();
    }
    prevChunksCompleted.current = chunksCompleted;
  }, [chunksCompleted, refreshDashboard]);

  useEffect(() => {
    if (enrichmentDone && !prevEnrichmentDone.current) {
      toast.success("Your health insights are ready");
      refreshDashboard();
    }
    prevEnrichmentDone.current = enrichmentDone;
  }, [enrichmentDone, refreshDashboard]);

  useEffect(() => {
    if (embeddingDone && !prevEmbeddingDone.current) {
      toast.success("Your health assistant is ready");
    }
    prevEmbeddingDone.current = embeddingDone;
  }, [embeddingDone]);

  if (initialLoading) return <DashboardSkeleton />;
  if (!data) return null;

  if (data.summary.totalResources === 0) {
    return (
      <DashboardEmpty
        firstName={data.patient.firstName}
        isProcessing={isProcessing}
        isExtracting={isExtracting}
        chunksCompleted={chunksCompleted}
        totalChunks={totalChunks}
      />
    );
  }

  const firstName = data.patient.sandboxPersona?.split(" ")[0] ?? "there";

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
          source={data.patient.sandboxPersona ?? undefined}
          lastSynced={data.patient.lastSyncedAt}
        />
      </div>

      {/* Processing banners */}
      {isProcessing && (
        <div className="space-y-2">
          {isExtracting && (
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <BrainCircuit className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm">
                Processing your records
                {totalChunks > 0 && ` \u2014 ${chunksCompleted}/${totalChunks} sections done`}
              </span>
              <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {extractionDone && !enrichmentDone && (
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm">Building your health insights...</span>
              <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {extractionDone && !embeddingDone && (
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm">Preparing your health assistant...</span>
              <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

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
                  <p className="text-sm text-muted-foreground">{description}</p>
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
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {f.text}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
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
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {f.text}
                    </p>
                  </div>
                ))
              ) : immunInsights &&
                immunInsights.insights.summary.totalImmunizations > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {immunInsights.insights.summary.totalImmunizations}{" "}
                  immunization records on file.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
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

interface SavedProvider {
  providerName: string;
  npi: string;
  contactOptions: { type: string; value: string }[];
  savedAt: string;
}

const SAVED_CONTACT_ICONS: Record<string, typeof Phone> = {
  phone: Phone,
  email: Mail,
  fax: Printer,
  website: Globe,
};

function DashboardEmpty({
  firstName,
  isProcessing = false,
  isExtracting = false,
  chunksCompleted = 0,
  totalChunks = 0,
}: {
  firstName: string | null;
  isProcessing?: boolean;
  isExtracting?: boolean;
  chunksCompleted?: number;
  totalChunks?: number;
}) {
  const navigate = useNavigate();
  const savedRaw = localStorage.getItem("phri_saved_provider");
  const savedProvider: SavedProvider | null = savedRaw
    ? JSON.parse(savedRaw)
    : null;

  const name = firstName || "there";

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-center">
        Your dashboard is ready, {name}
      </h1>
      <p className="mt-2 text-muted-foreground text-center">
        Here's what you can do next
      </p>

      <div className="mt-8 w-full max-w-lg space-y-4">
        {isProcessing && (
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            {isExtracting ? (
              <BrainCircuit className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
            )}
            <span className="text-sm text-muted-foreground">
              {isExtracting
                ? `Processing your records${totalChunks > 0 ? ` \u2014 ${chunksCompleted}/${totalChunks} sections done` : ""}`
                : "Your records are being processed \u2014 insights will appear shortly"}
            </span>
            {isExtracting && (
              <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        )}
        {savedProvider && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {savedProvider.providerName}
              </CardTitle>
              <CardDescription>Saved provider contact info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {savedProvider.contactOptions.map((opt, i) => {
                const Icon = SAVED_CONTACT_ICONS[opt.type] || Globe;
                let href: string | undefined;
                if (opt.type === "phone" || opt.type === "fax")
                  href = `tel:${opt.value}`;
                else if (opt.type === "email") href = `mailto:${opt.value}`;
                else if (opt.type === "website") href = opt.value;

                return (
                  <div
                    key={`${opt.type}-${i}`}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {href ? (
                      <a
                        href={href}
                        target={
                          opt.type === "website" ? "_blank" : undefined
                        }
                        rel={
                          opt.type === "website"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="text-sm font-medium text-foreground hover:underline break-all"
                      >
                        {opt.value}
                      </a>
                    ) : (
                      <span className="text-sm font-medium break-all">
                        {opt.value}
                      </span>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Card
            className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
            onClick={() => navigate("/upload")}
          >
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                <FileUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-semibold">Upload Records</p>
              <p className="text-xs text-muted-foreground">
                Upload a PDF of your medical records
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
            onClick={() => navigate("/provider-search")}
          >
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/30">
                <Search className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-sm font-semibold">Find a Provider</p>
              <p className="text-xs text-muted-foreground">
                Get contact info to request your records
              </p>
            </CardContent>
          </Card>
        </div>
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
