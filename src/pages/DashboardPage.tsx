import { useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthData } from "@/context/HealthDataContext";
import { usePendingUploadStatus } from "@/hooks/usePendingUploadStatus";
import { useRebuild } from "@/context/RebuildContext";
import { toast } from "sonner";
import {
  Heart,
  Pill,
  FlaskConical,
  Syringe,
  Stethoscope,
  Activity,
  FileBarChart,
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
  MessageSquare,
  RefreshCw,
} from "lucide-react";

const InlineChat = lazy(() =>
  import("./ChatPage").then((m) => ({ default: m.InlineChat })),
);

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    dashboard: data,
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

  const { isRebuilding } = useRebuild();

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

  const firstName = data.patient.firstName || "there";
  const { summary } = data;

  // Build non-zero record type entries for stat tiles
  const RECORD_TYPES = [
    { label: "Conditions", count: summary.conditions, icon: Heart, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-900/30", to: "/records/conditions" },
    { label: "Medications", count: summary.medications, icon: Pill, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", to: "/records/medications/insights" },
    { label: "Lab Results", count: summary.observations, icon: FlaskConical, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", to: "/records/lab-results" },
    { label: "Immunizations", count: summary.immunizations, icon: Syringe, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30", to: "/records/immunizations" },
    { label: "Visits", count: summary.encounters, icon: Stethoscope, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30", to: "/records/visits" },
    { label: "Procedures", count: summary.procedures, icon: Activity, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-100 dark:bg-cyan-900/30", to: "/records" },
    { label: "Reports", count: summary.diagnosticReports, icon: FileBarChart, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", to: "/records/documents" },
  ].filter((r) => r.count > 0);

  return (
    // Fixed viewport height minus AppLayout padding — forces chat to scroll internally
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4 md:h-[calc(100vh-3.5rem)]">
      {/* Greeting + record summary */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold">
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You own <span className="font-semibold text-foreground">{summary.totalResources} health records</span>
        </p>
      </div>

      {/* Record type stat tiles */}
      {RECORD_TYPES.length > 0 && (
        <div className="shrink-0 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {RECORD_TYPES.map(({ label, count, icon: Icon, color, bg, to }) => (
            <div
              key={label}
              onClick={() => navigate(to)}
              className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
            >
              <div className={`rounded-lg p-1.5 ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight">{count}</p>
                <p className="truncate text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
          <div
            onClick={() => navigate("/provider-search")}
            className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
          >
            <div className="rounded-lg p-1.5 bg-slate-100 dark:bg-slate-900/30">
              <Search className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Search Providers & Records</p>
            </div>
          </div>
        </div>
      )}

      {/* Rebuild banner */}
      {isRebuilding && (
        <div className="shrink-0">
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-primary" />
            <span className="text-sm">Rebuilding insights and embeddings...</span>
          </div>
        </div>
      )}

      {/* Processing banners */}
      {isProcessing && (
        <div className="shrink-0 space-y-2">
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

      {/* Inline chat — fills remaining viewport height */}
      {(!isProcessing || embeddingDone) && (
        <Suspense fallback={<Skeleton className="flex-1" />}>
          <InlineChat />
        </Suspense>
      )}
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
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
