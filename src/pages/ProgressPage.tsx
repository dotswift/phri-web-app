import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatientStatus } from "@/hooks/usePatientStatus";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function ProgressPage() {
  const status = usePatientStatus();
  const navigate = useNavigate();
  const { refreshUserState } = useAuth();

  useEffect(() => {
    if (status === "ready") {
      refreshUserState();
      navigate("/dashboard");
    }
  }, [status, navigate, refreshUserState]);

  const handleDisconnect = async () => {
    try {
      await api.post("/api/settings/disconnect");
      await refreshUserState();
      navigate("/connect");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to disconnect",
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Retrieving Health Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(status === "pending" || status === "querying" || !status) && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Connecting to health networks and fetching your records. This
                usually takes 15-30 seconds...
              </p>
            </>
          )}

          {status === "partial" && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-yellow-500" />
              <p className="text-muted-foreground">
                Some data has arrived. More may still be loading — you can
                continue now or wait.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Continue to Dashboard
              </Button>
            </>
          )}

          {status === "failed" && (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
              <p className="text-muted-foreground">
                Data retrieval failed. This can happen if the health network is
                temporarily unavailable.
              </p>
              <Button variant="destructive" onClick={handleDisconnect}>
                Disconnect & Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
