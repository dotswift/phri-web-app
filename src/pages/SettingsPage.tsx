import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { SettingsResponse } from "@/types/api";

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { refreshUserState } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<SettingsResponse>("/api/settings")
      .then(setSettings)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

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

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.post("/api/settings/disconnect");
      await refreshUserState();
      toast.success("Patient disconnected");
      navigate("/connect");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setDisconnecting(false);
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

      {/* Connected Record */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connected Record</CardTitle>
          <CardDescription>Your linked health record persona</CardDescription>
        </CardHeader>
        <CardContent>
          {settings.connectedPersona ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {settings.connectedPersona}
                </span>
                <Badge
                  variant={
                    settings.patientStatus === "ready" ? "default" : "secondary"
                  }
                >
                  {settings.patientStatus}
                </Badge>
              </div>
              {settings.lastSyncedAt && (
                <p className="text-sm text-muted-foreground">
                  Last synced:{" "}
                  {new Date(settings.lastSyncedAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No record connected
              </p>
              <Link to="/connect">
                <Button variant="outline" size="sm">
                  Connect a Persona
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

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

      <Separator />

      {/* Disconnect */}
      {settings.connectedPersona && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Disconnect Record</CardTitle>
            <CardDescription>
              Removes your patient record, FHIR resources, and embeddings. Chat
              history is preserved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConfirmDialog
              trigger={
                <Button variant="outline">Disconnect Patient</Button>
              }
              title="Disconnect Patient Record?"
              description="This will delete your patient record, all health resources, and embeddings. Chat history will be preserved. You can reconnect with a different persona afterward."
              confirmLabel="Disconnect"
              loading={disconnecting}
              onConfirm={handleDisconnect}
            />
          </CardContent>
        </Card>
      )}

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
