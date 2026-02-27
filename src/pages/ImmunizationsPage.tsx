import { useEffect, useState, useMemo } from "react";
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
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Syringe,
  Sparkles,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useResourceDetail } from "@/context/ResourceDetailContext";
import type { ImmunizationInsightsResponse } from "@/types/api";

export function ImmunizationsPage() {
  const [data, setData] = useState<ImmunizationInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { openResourceDetail } = useResourceDetail();

  useEffect(() => {
    api
      .get<ImmunizationInsightsResponse>("/api/immunizations/insights")
      .then(setData)
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Failed to load immunizations")
      )
      .finally(() => setLoading(false));
  }, []);

  // Group timeline by year (newest first)
  const grouped = useMemo(() => {
    if (!data) return {};
    const groups: Record<string, typeof data.timeline> = {};
    for (const item of data.timeline) {
      const year = item.date
        ? new Date(item.date).getFullYear().toString()
        : "Unknown";
      if (!groups[year]) groups[year] = [];
      groups[year].push(item);
    }
    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
    );
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!data || data.timeline.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Immunizations</h1>
        <EmptyState
          icon={Syringe}
          title="No immunizations found"
          description="No immunization records are available."
        />
      </div>
    );
  }

  const { findings, narrativeSummary, insights, methodology } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Immunizations</h1>

      {/* Compact stat row */}
      <p className="text-sm text-muted-foreground">
        {insights.summary.totalImmunizations} immunizations · {insights.summary.uniqueVaccines} vaccines
        {insights.summary.providerCount > 0 &&
          ` · ${insights.summary.providerCount} providers`}
        {insights.summary.dateRange.earliest &&
          insights.summary.dateRange.latest &&
          ` · ${new Date(insights.summary.dateRange.earliest).getFullYear()}–${new Date(insights.summary.dateRange.latest).getFullYear()}`}
      </p>

      {/* Key Findings hero section */}
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

      {/* Timeline by year */}
      {Object.entries(grouped).map(([year, items]) => (
        <Card key={year}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{year}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative ml-3 border-l-2 border-muted pl-4">
              {items.map((item) => (
                <div
                  key={item.id + item.date}
                  className="relative mb-4 cursor-pointer last:mb-0"
                  onClick={() =>
                    openResourceDetail(item.id, "/api/immunizations")
                  }
                >
                  <div className="absolute -left-[1.35rem] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                  <div className="rounded p-2 hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.name}</span>
                      {item.status && (
                        <Badge
                          variant={
                            item.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        {item.source}
                        {item.date &&
                          ` — ${new Date(item.date).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="mt-1">
                      <CitationBadge citation={item.citation} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

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
