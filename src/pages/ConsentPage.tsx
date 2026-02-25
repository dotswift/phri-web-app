import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { Consent } from "@/types/api";

const CONSENT_ITEMS = [
  {
    key: "dataUsage" as const,
    label:
      "I consent to my health records being fetched and stored for generating insights",
  },
  {
    key: "llmDataFlow" as const,
    label:
      "I understand that my questions and health record excerpts are sent to an external AI (Claude) for chat",
  },
  {
    key: "deletionRights" as const,
    label: "I understand I can delete all my data at any time",
  },
];

export function ConsentPage() {
  const [checks, setChecks] = useState({
    dataUsage: false,
    llmDataFlow: false,
    deletionRights: false,
  });
  const [loading, setLoading] = useState(false);
  const { refreshUserState } = useAuth();
  const navigate = useNavigate();

  const allChecked = checks.dataUsage && checks.llmDataFlow && checks.deletionRights;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post<Consent>("/api/consent", {
        dataUsage: true,
        llmDataFlow: true,
        deletionRights: true,
      });
      await refreshUserState();
      navigate("/connect");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save consent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Data Consent</CardTitle>
          <CardDescription>
            Before we connect your health records, please review how your data
            will be used.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-md bg-muted p-4 text-sm text-muted-foreground space-y-2">
            <p>
              PHRI fetches health records from connected provider networks and
              stores them securely to power your insights dashboard and
              AI-powered chat.
            </p>
            <p>
              You can permanently delete all your data at any time from the
              Settings page.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {CONSENT_ITEMS.map(({ key, label }) => (
              <div key={key} className="flex items-start gap-3">
                <Checkbox
                  id={key}
                  checked={checks[key]}
                  onCheckedChange={(checked) =>
                    setChecks((prev) => ({ ...prev, [key]: checked === true }))
                  }
                />
                <Label htmlFor={key} className="text-sm leading-tight">
                  {label}
                </Label>
              </div>
            ))}
            <Button
              type="submit"
              className="w-full"
              disabled={!allChecked || loading}
            >
              {loading ? "Saving..." : "I Agree — Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
