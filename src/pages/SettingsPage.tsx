import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useHealthData } from "@/context/HealthDataContext";
import { useUpload } from "@/context/UploadContext";
import { useRebuild } from "@/context/RebuildContext";
import { toast } from "sonner";
import {
  LogOut,
  User,
  Trash2,
  Plus,
  Upload,
  Download,
  X,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  RefreshCw,
} from "lucide-react";
import type { SettingsResponse } from "@/types/api";

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, signOut, refreshUserState } = useAuth();
  const { refresh: refreshHealthData } = useHealthData();
  const { isRebuilding: regenerating, triggerRebuild } = useRebuild();
  const navigate = useNavigate();
  const {
    state: uploadState,
    progress,
    result,
    error: uploadError,
    upload,
    cancel,
    reset: resetUpload,
  } = useUpload();

  const fetchSettings = () =>
    api
      .get<SettingsResponse>("/api/settings")
      .then(setSettings)
      .catch((err) => toast.error(err.message));

  useEffect(() => {
    fetchSettings().finally(() => setLoading(false));
  }, []);

  const handleWipeRecords = async () => {
    setWiping(true);
    try {
      await api.post("/api/settings/wipe-records");
      await refreshUserState();
      await fetchSettings();
      refreshHealthData();
      toast.success("All records wiped");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to wipe records",
      );
    } finally {
      setWiping(false);
    }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
    upload(selectedFile, { firstName: "", lastName: "", dob: "" });
  };

  const handleUploadDialogClose = (open: boolean) => {
    if (!open && uploadState === "uploading") return;
    setUploadDialogOpen(open);
    if (!open) {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      resetUpload();
    }
  };

  const handleUploadComplete = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    resetUpload();
    fetchSettings();
    refreshUserState();
    refreshHealthData();
    toast.success(`Extracted ${result?.resourceCount ?? 0} health records`);
  };

  const handleToggleAI = async (enabled: boolean) => {
    try {
      const updated = await api.patch<SettingsResponse>("/api/settings", {
        aiModeEnabled: enabled,
      });
      setSettings(updated);
      toast.success(`AI mode ${enabled ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      await api.delete("/api/settings/data");
      await refreshUserState();
      toast.success("All data deleted");
      navigate("/consent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete data");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
          <CardDescription>Your signed-in identity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <User className="size-5 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">
              {user?.email ?? "Unknown"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Upload Records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Records</CardTitle>
          <CardDescription>
            Upload medical record PDFs to extract and analyze your health data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Dialog
              open={uploadDialogOpen}
              onOpenChange={handleUploadDialogClose}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
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
                          <Label htmlFor="settings-pdf-file">PDF File</Label>
                          <Input
                            id="settings-pdf-file"
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
                        <Button
                          variant="outline"
                          onClick={cancel}
                          className="w-full"
                        >
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
                        <Button
                          onClick={handleUploadComplete}
                          className="w-full"
                        >
                          Close
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

                <ConfirmDialog
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Wipe All Records
                    </Button>
                  }
                  title="Wipe All Records?"
                  description="This will delete all health resources, embeddings, insights, uploaded documents, and chat history. Your account, consent, and settings will be preserved. The patient will be reset to pending."
                  confirmLabel="Wipe Records"
                  destructive
                  requireTyping="WIPE"
                  loading={wiping}
                  onConfirm={handleWipeRecords}
                />
          </div>
        </CardContent>
      </Card>

      {/* Export Records */}
      {settings.hasPatient && settings.patientStatus === "ready" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Export Records</CardTitle>
            <CardDescription>
              Download your health data as PDF, CSV, FHIR, or a full archive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/export">
              <Button variant="outline">
                <Download className="mr-1 h-4 w-4" />
                Export Records
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Regenerate Insights */}
      {settings.hasPatient && settings.patientStatus === "ready" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rebuild Data</CardTitle>
            <CardDescription>
              Regenerate insights, chat suggestions, and search embeddings from your health records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={triggerRebuild}
              disabled={regenerating}
            >
              <RefreshCw className={`mr-1 h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Rebuilding..." : "Rebuild Everything"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* View All Records */}
      {settings.hasPatient && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Records</CardTitle>
            <CardDescription>
              Browse all your health records by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/records">
              <Button variant="outline">
                <FolderOpen className="mr-1 h-4 w-4" />
                View All Records
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appearance</CardTitle>
          <CardDescription>Choose light or dark mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">
              Toggle dark mode
            </span>
          </div>
        </CardContent>
      </Card>

      {/* AI Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Mode</CardTitle>
          <CardDescription>
            Controls whether the AI chat feature is enabled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="ai-mode"
              checked={settings.aiModeEnabled}
              onCheckedChange={handleToggleAI}
            />
            <Label htmlFor="ai-mode">
              {settings.aiModeEnabled
                ? "AI Chat Enabled"
                : "AI Chat Disabled"}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sign Out</CardTitle>
          <CardDescription>
            Sign out of your account on this device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={async () => {
              await signOut();
              navigate("/login");
            }}
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Delete All */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">
            Delete All Data
          </CardTitle>
          <CardDescription>
            Permanently deletes all your data: health records, chat history,
            consent, and settings. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfirmDialog
            trigger={
              <Button variant="destructive">Delete All My Data</Button>
            }
            title="Delete All Data?"
            description="This will permanently delete all your health records, chat history, and settings. This cannot be undone."
            confirmLabel="Delete Everything"
            destructive
            requireTyping="DELETE"
            loading={deleting}
            onConfirm={handleDeleteAll}
          />
        </CardContent>
      </Card>
    </div>
  );
}
