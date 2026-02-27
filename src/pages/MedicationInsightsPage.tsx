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
import { Sparkles } from "lucide-react";
import { MedicationDosageChart } from "@/components/charts/MedicationDosageChart";
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
  const { insights, methodology } = displayData;
  const isEmpty =
    insights.duplicates.length === 0 && insights.changes.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Medication Insights</h1>

      {showDemo && <SandboxActiveBanner />}

      {/* Summary stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{insights.summary.totalUnique}</p>
            <p className="text-sm text-muted-foreground">Unique Medications</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{insights.summary.totalActive}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">
              {insights.summary.totalStopped}
            </p>
            <p className="text-sm text-muted-foreground">Stopped</p>
          </CardContent>
        </Card>
      </div>

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
                  <div key={group.drug} className="rounded-md border p-3">
                    <p className="font-medium">{group.drug}</p>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Appears in {group.occurrences.length} records
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

          {/* Dosage changes chart */}
          {insights.changes.length > 0 && (
            <Card className="p-4">
              <MedicationDosageChart changes={insights.changes} />
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
                {insights.changes.map((group) => (
                  <div key={group.drug} className="rounded-md border p-3">
                    <p className="mb-3 font-medium">{group.drug}</p>
                    <div className="relative ml-3 border-l-2 border-muted pl-4">
                      {group.history.map((entry) => (
                        <div
                          key={entry.id}
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
                ))}
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
