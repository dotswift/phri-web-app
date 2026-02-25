import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePatientStatus } from "@/hooks/usePatientStatus";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function ProgressPage() {
  const status = usePatientStatus();
  const navigate = useNavigate();
  const { refreshUserState } = useAuth();

  useEffect(() => {
    if (status === "ready") {
      (async () => {
        await refreshUserState();
        navigate("/dashboard");
      })();
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 animate-in fade-in duration-300">
      <div className="text-center">
        <h1 className="text-2xl font-bold">PHRI</h1>
        <p className="text-sm text-muted-foreground">Personal Health Record &amp; Insights</p>
      </div>

      {(status === "pending" || status === "querying" || !status) && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="max-w-xs text-sm text-muted-foreground">
            Retrieving your health records&hellip; This usually takes 15–30 seconds.
          </p>
        </div>
      )}

      {status === "partial" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-8 w-8 text-yellow-500" />
          <p className="max-w-xs text-sm text-muted-foreground">
            Some data has arrived. More may still be loading — you can continue now or wait.
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            Continue to Dashboard
          </Button>
        </div>
      )}

      {status === "failed" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="max-w-xs text-sm text-muted-foreground">
            Data retrieval failed. The health network may be temporarily unavailable.
          </p>
          <Button variant="destructive" onClick={handleDisconnect}>
            Disconnect &amp; Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
