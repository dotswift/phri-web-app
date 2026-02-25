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
import { DetailDrawer } from "@/components/shared/DetailDrawer";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import type { MedicationInsightsResponse } from "@/types/api";

export function MedicationInsightsPage() {
  const [data, setData] = useState<MedicationInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<MedicationInsightsResponse>("/api/medications/insights")
      .then(setData)
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

  const { insights, methodology } = data;
  const isEmpty =
    insights.duplicates.length === 0 && insights.changes.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Medication Insights</h1>

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

      {isEmpty ? (
        <EmptyState
          icon={Sparkles}
          title="No medication insights available"
          description="This sandbox persona has no medication records. In a real deployment, medication duplicates and dosage change tracking would appear here."
        />
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
                          className="flex cursor-pointer items-center justify-between rounded p-2 hover:bg-accent"
                          onClick={() => setSelectedId(occ.id)}
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

          {/* Dosage changes */}
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
                          className="relative mb-4 cursor-pointer last:mb-0"
                          onClick={() => setSelectedId(entry.id)}
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

      <DetailDrawer
        resourceId={selectedId}
        endpoint="/api/timeline"
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
