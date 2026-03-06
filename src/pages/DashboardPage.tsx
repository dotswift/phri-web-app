import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataProvenance } from "@/components/shared/DataProvenance";
import { api } from "@/lib/api";
import { useUpload } from "@/context/UploadContext";
import { useAuth } from "@/context/AuthContext";
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
  Upload,
  FileText,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
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
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    setLoading(true);
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
  }, [fetchKey]);

  const refetch = () => setFetchKey((k) => k + 1);

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  if (data.summary.totalResources === 0) {
    return <DashboardEmpty persona={data.patient.sandboxPersona} onDataAdded={refetch} />;
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

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function DashboardEmpty({ persona, onDataAdded }: { persona: string | null; onDataAdded: () => void }) {
  const { refreshUserState } = useAuth();
  const {
    state: uploadState,
    progress,
    result,
    error: uploadError,
    upload,
    cancel,
    reset: resetUpload,
  } = useUpload();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File must be smaller than 10MB");
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadSubmit = () => {
    if (!selectedFile) return;
    upload(selectedFile, {
      firstName: firstName.trim() || "Patient",
      lastName,
      dob,
    });
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && uploadState === "uploading") return;
    setDialogOpen(open);
    if (!open) {
      setSelectedFile(null);
      setFirstName("");
      setLastName("");
      setDob("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      resetUpload();
    }
  };

  const handleComplete = () => {
    setDialogOpen(false);
    setSelectedFile(null);
    setFirstName("");
    setLastName("");
    setDob("");
    resetUpload();
    refreshUserState();
    toast.success(`Extracted ${result?.resourceCount ?? 0} health records`);
    onDataAdded();
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold">
        {persona ? `Welcome, ${persona.split(" ")[0]}` : "Welcome"}
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        No health records yet. Upload a PDF to get started, or head to Settings
        to manage your connection.
      </p>
      <div className="mt-6 flex gap-3">
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" />
              Upload PDF
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Medical Record</DialogTitle>
            </DialogHeader>

            {uploadState === "idle" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dash-pdf-file">PDF File</Label>
                  <Input
                    id="dash-pdf-file"
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="mt-1"
                  />
                  {selectedFile && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedFile.name} (
                      {(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="dash-first-name">First Name</Label>
                    <Input
                      id="dash-first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Patient"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dash-last-name">Last Name</Label>
                    <Input
                      id="dash-last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="dash-dob">Date of Birth</Label>
                  <Input
                    id="dash-dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Patient info is used to remove personal details before AI
                  processing.
                </p>
                <Button
                  onClick={handleUploadSubmit}
                  disabled={!selectedFile}
                  className="w-full"
                >
                  <Upload className="mr-1 h-4 w-4" />
                  Upload & Process
                </Button>
              </div>
            )}

            {uploadState === "uploading" && progress && (
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>{progress.description}</span>
                    <span className="text-muted-foreground">
                      {progress.percent}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Step {progress.step} of {progress.totalSteps}
                  </p>
                </div>
                <Button variant="outline" onClick={cancel} className="w-full">
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}

            {uploadState === "complete" && result && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                  <p className="font-medium">Upload Complete</p>
                  <p className="text-sm text-muted-foreground">
                    Extracted {result.resourceCount} health record
                    {result.resourceCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <Button onClick={handleComplete} className="w-full">
                  View Dashboard
                </Button>
              </div>
            )}

            {uploadState === "error" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="font-medium">Upload Failed</p>
                  <p className="text-sm text-muted-foreground">
                    {uploadError}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={resetUpload}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Link to="/settings">
          <Button variant="outline">Settings</Button>
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
