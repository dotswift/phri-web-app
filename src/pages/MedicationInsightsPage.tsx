import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { CitationBadge } from "@/components/shared/CitationBadge";
import {
  SandboxActivationCard,
  SandboxActiveBanner,
} from "@/components/shared/SandboxBanner";
import { useSandboxDemo } from "@/context/SandboxContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Sparkles,
  AlertTriangle,
  Info,
  ArrowUp,
  ArrowDown,
  Users,
} from "lucide-react";
import { MedicationChangeSparkline } from "@/components/charts/MedicationChangeSparkline";
import { useResourceDetail } from "@/context/ResourceDetailContext";
import type { MedicationInsightsResponse } from "@/types/api";
import { DEMO_MEDICATION_INSIGHTS } from "@/lib/sandboxMedications";

export function MedicationInsightsPage() {
  const { openResourceDetail } = useResourceDetail();
  const [data, setData] = useState<MedicationInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiEmpty, setApiEmpty] = useState(false);
  const { sandboxDemoActive } = useSandboxDemo();

  useEffect(() => {
    api
      .get<MedicationInsightsResponse>("/api/medications/insights")
      .then((result) => {
        const empty =
          result.insights.duplicates.length === 0 &&
          result.insights.changes.length === 0;
        setApiEmpty(empty);
        setData(result);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!data) return null;

  const showDemo = apiEmpty && sandboxDemoActive;
  const displayData = showDemo ? DEMO_MEDICATION_INSIGHTS : data;
  const { findings, narrativeSummary, insights, methodology } = displayData;
  const isEmpty =
    insights.duplicates.length === 0 && insights.changes.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Medication Insights</h1>

      {showDemo && <SandboxActiveBanner />}

      {/* Compact stat row */}
      <p className="text-sm text-muted-foreground">
        {insights.summary.totalUnique} medications · {insights.summary.totalActive} active
        {insights.summary.totalStopped > 0 &&
          ` · ${insights.summary.totalStopped} stopped`}
        {insights.summary.providerCount > 0 &&
          ` · ${insights.summary.providerCount} providers`}
      </p>

      {/* Key Findings hero section (LLM-powered) */}
      {findings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Key Findings
            </CardTitle>
            {narrativeSummary && (
              <CardDescription className="text-sm">
                {narrativeSummary}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {findings.map((finding, i) => (
              <div
                key={i}
                className={`flex gap-3 rounded-md border p-3 ${
                  finding.severity === "warning"
                    ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20"
                    : "border-border bg-muted/30"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {finding.severity === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="min-w-0 space-y-1.5">
                  <p className="text-sm leading-relaxed">{finding.text}</p>
                  {finding.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {finding.citations.map((c, ci) => (
                        <CitationBadge key={ci} citation={c} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {apiEmpty && !sandboxDemoActive ? (
        <SandboxActivationCard />
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No medication insights available</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            No medication insights match the current data.
          </p>
        </div>
      ) : (
        <>
          {/* Duplicates */}
          {insights.duplicates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Duplicate Detection</CardTitle>
                <CardDescription>
                  Medications appearing in multiple records from different
                  sources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.duplicates.map((group) => (
                  <div
                    key={group.drug}
                    className={`rounded-md border p-3 ${
                      group.isMultiProvider
                        ? "border-amber-200 dark:border-amber-900/50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{group.drug}</p>
                      {group.isMultiProvider && (
                        <Badge
                          variant="outline"
                          className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                        >
                          <Users className="mr-1 h-3 w-3" />
                          Multiple Providers
                        </Badge>
                      )}
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Appears in {group.occurrences.length} records
                      {group.isMultiProvider &&
                        ` across ${group.providers.join(", ")}`}
                    </p>
                    <div className="space-y-2">
                      {group.occurrences.map((occ) => (
                        <div
                          key={occ.id}
                          className={`flex items-center justify-between rounded p-2 ${showDemo ? "" : "cursor-pointer hover:bg-accent"}`}
                          onClick={showDemo ? undefined : () => openResourceDetail(occ.id, "/api/medications")}
                        >
                          <div>
                            {occ.dosage && (
                              <p className="text-sm">{occ.dosage}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {occ.source}
                              {occ.date &&
                                ` — ${new Date(occ.date).toLocaleDateString()}`}
                            </p>
                          </div>
                          <CitationBadge citation={occ.citation} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Dosage changes detail */}
          {insights.changes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dosage Changes</CardTitle>
                <CardDescription>
                  Tracked dosage and status changes over time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.changes.map((group) => {
                  const isIncrease = group.summary.includes("increased");
                  const isDecrease = group.summary.includes("decreased");

                  return (
                    <div key={group.drug} className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{group.drug}</p>
                            {isIncrease && (
                              <ArrowUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            )}
                            {isDecrease && (
                              <ArrowDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {group.summary}
                          </p>
                        </div>
                        <MedicationChangeSparkline history={group.history} />
                      </div>
                      <div className="relative ml-3 mt-3 border-l-2 border-muted pl-4">
                        {group.history.map((entry) => (
                          <div
                            key={entry.id + entry.date}
                            className={`relative mb-4 last:mb-0 ${showDemo ? "" : "cursor-pointer"}`}
                            onClick={showDemo ? undefined : () => openResourceDetail(entry.id, "/api/medications")}
                          >
                            <div className="absolute -left-[1.35rem] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                            <div className="rounded p-2 hover:bg-accent">
                              <div className="flex items-center gap-2">
                                {entry.date && (
                                  <span className="text-xs font-medium">
                                    {new Date(entry.date).toLocaleDateString()}
                                  </span>
                                )}
                                {entry.status && (
                                  <Badge
                                    variant={
                                      entry.status === "active"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {entry.status}
                                  </Badge>
                                )}
                              </div>
                              {entry.dosage && (
                                <p className="text-sm">{entry.dosage}</p>
                              )}
                              <div className="mt-1">
                                <CitationBadge citation={entry.citation} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Methodology */}
      <Accordion type="single" collapsible>
        <AccordionItem value="methodology">
          <AccordionTrigger>Methodology</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="text-sm">{methodology.description}</p>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Steps
              </p>
              <ol className="mt-1 list-inside list-decimal space-y-1 text-sm">
                {methodology.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Limitations
              </p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                {methodology.limitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
