import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiDownload, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { Download, Loader2, FileText } from "lucide-react";
import type { ExportFormat, ExportFormatsResponse, ExportSection } from "@/types/api";

const EXPORT_SECTIONS: { value: ExportSection; label: string }[] = [
  { value: "conditions", label: "Conditions" },
  { value: "medications", label: "Medications" },
  { value: "immunizations", label: "Immunizations" },
  { value: "allergies", label: "Allergies" },
  { value: "encounters", label: "Encounters" },
  { value: "procedures", label: "Procedures" },
  { value: "observations", label: "Observations" },
  { value: "diagnosticReports", label: "Diagnostic Reports" },
];

export function ExportPage() {
  const [formats, setFormats] = useState<ExportFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [selectedSections, setSelectedSections] = useState<Set<ExportSection>>(
    () => new Set(EXPORT_SECTIONS.map((s) => s.value)),
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    api
      .get<ExportFormatsResponse>("/api/export/formats")
      .then((data) => {
        setFormats(data.formats);
        if (data.formats.length > 0) {
          setSelectedFormat(data.formats[0].id);
        }
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load export formats"))
      .finally(() => setLoading(false));
  }, []);

  const toggleSection = (section: ExportSection) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const toggleAllSections = () => {
    if (selectedSections.size === EXPORT_SECTIONS.length) {
      setSelectedSections(new Set());
    } else {
      setSelectedSections(new Set(EXPORT_SECTIONS.map((s) => s.value)));
    }
  };

  const handleExport = async () => {
    if (selectedSections.size === 0) {
      toast.error("Select at least one section to export.");
      return;
    }

    setDownloading(true);
    try {
      const params = new URLSearchParams({ format: selectedFormat });
      if (selectedSections.size < EXPORT_SECTIONS.length) {
        params.set("sections", [...selectedSections].join(","));
      }
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await apiDownload(`/api/export?${params}`);
      const blob = await res.blob();

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename =
        filenameMatch?.[1] ??
        `health-export.${selectedFormat === "fhir" ? "json" : selectedFormat === "archive" ? "zip" : selectedFormat}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Export downloaded successfully");
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.status) {
          case 400:
            toast.error("Invalid export options. Please check your selections.");
            break;
          case 404:
            toast.error("No health records found. Connect your records first.");
            break;
          case 429:
            toast.error("Too many requests. Please wait a moment and try again.");
            break;
          default:
            toast.error(err.message || "Export failed. Please try again.");
        }
      } else {
        toast.error("Export failed. Please try again.");
      }
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (formats.length === 0) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Export Records</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Export unavailable</p>
            <p className="text-sm text-muted-foreground">
              No export formats are currently available. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Export Records</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Download your health data in your preferred format.
        </p>
      </div>

      {/* Format selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Format</CardTitle>
          <CardDescription>Choose an export format</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {formats.map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => setSelectedFormat(fmt.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selectedFormat === fmt.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="font-medium text-sm">{fmt.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {fmt.description}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Section filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Sections</CardTitle>
              <CardDescription>Select which data to include</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleAllSections}>
              {selectedSections.size === EXPORT_SECTIONS.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {EXPORT_SECTIONS.map((section) => (
            <label
              key={section.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={selectedSections.has(section.value)}
                onCheckedChange={() => toggleSection(section.value)}
              />
              <span className="text-sm">{section.label}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Date range */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Date Range</CardTitle>
          <CardDescription>
            Optionally filter records by date (leave blank for all)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="export-date-from">From</Label>
              <Input
                id="export-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="export-date-to">To</Label>
              <Input
                id="export-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download button */}
      <Button
        onClick={handleExport}
        disabled={downloading || selectedSections.size === 0}
        className="w-full"
        size="lg"
      >
        {downloading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating export...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Download Export
          </>
        )}
      </Button>
    </div>
  );
}
