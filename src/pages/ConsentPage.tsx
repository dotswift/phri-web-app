import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TrustBadges } from "@/components/shared/TrustBadges";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Info, ShieldCheck } from "lucide-react";
import type { Consent } from "@/types/api";

const CONSENT_ITEMS = [
  {
    key: "dataUsage" as const,
    label:
      "I consent to my health records being fetched and stored for generating insights",
    description:
      "Your records are fetched from connected provider networks and stored securely to power your dashboard.",
  },
  {
    key: "llmDataFlow" as const,
    label:
      "I understand that my questions and health record excerpts are sent to an external AI (Claude) for chat",
    description:
      "Your questions are de-identified (personal identifiers stripped) before processing. Health record excerpts include clinical details (conditions, medications, dates) but not your name, address, or other direct identifiers. You can disable AI mode at any time in Settings.",
  },
  {
    key: "deletionRights" as const,
    label:
      "I understand I can revoke AI access or delete all my data at any time",
    description:
      "Disable AI chat in Settings to stop sending data to the AI provider, or delete all records, chat history, and account data permanently.",
  },
];

type Step = "inform" | "select" | "confirm";

export function ConsentPage() {
  const [step, setStep] = useState<Step>("inform");
  const [checks, setChecks] = useState({
    dataUsage: false,
    llmDataFlow: false,
    deletionRights: false,
  });
  const [loading, setLoading] = useState(false);
  const { refreshUserState } = useAuth();
  const navigate = useNavigate();

  const allChecked =
    checks.dataUsage && checks.llmDataFlow && checks.deletionRights;

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
      toast.error(
        err instanceof Error ? err.message : "Failed to save consent",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold leading-none tracking-tight">
              Data Consent
            </h1>
          </div>
          <CardDescription>
            Before we connect your health records, please review how your data
            will be used.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Inform */}
          {step === "inform" && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                  <div className="space-y-2">
                    <p>
                      PHRI fetches health records from connected provider
                      networks and stores them in an encrypted database
                      (AES-256 at rest, TLS in transit) to power your insights
                      dashboard and AI-powered chat.
                    </p>
                    <p>
                      Your health records and chat history are stored in our
                      encrypted database until you choose to delete them. When
                      excerpts are sent to our AI provider (Anthropic Claude)
                      for chat, they are processed in real-time and are not
                      used to train AI models.
                    </p>
                    <p>
                      You can permanently delete all your data at any time from
                      the Settings page.
                    </p>
                    <p className="font-medium text-foreground">
                      You maintain full control of your data at all times.
                    </p>
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={() => setStep("select")}>
                I understand — Continue
              </Button>
            </div>
          )}

          {/* Step 2: Select */}
          {step === "select" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (allChecked) setStep("confirm");
              }}
              className="space-y-4"
            >
              <fieldset>
                <legend className="mb-3 text-sm font-medium">
                  Please review and accept each item:
                </legend>
                <div className="space-y-4">
                  {CONSENT_ITEMS.map(({ key, label, description }) => (
                    <div key={key} className="flex items-start gap-3">
                      <Checkbox
                        id={key}
                        checked={checks[key]}
                        onCheckedChange={(checked) =>
                          setChecks((prev) => ({
                            ...prev,
                            [key]: checked === true,
                          }))
                        }
                        aria-required="true"
                      />
                      <div>
                        <Label htmlFor={key} className="text-sm leading-tight">
                          {label}
                        </Label>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("inform")}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={!allChecked}>
                  Review & Confirm
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-md border border-primary/20 bg-primary/5 p-4 text-sm space-y-2">
                <p className="font-medium">You have agreed to:</p>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li>Health records fetched and stored securely</li>
                  <li>Excerpts sent to AI for chat features</li>
                  <li>
                    Full data deletion or AI revocation available at any time
                  </li>
                </ul>
                <p className="mt-2 text-xs text-muted-foreground/80">
                  Once health record excerpts are sent to the AI provider for
                  processing, they are subject to the provider's data handling
                  policies.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                You can revoke consent and delete all data at any time from
                Settings. No data is shared with third parties beyond the AI
                provider.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("select")}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Saving..." : "I Agree — Continue"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      <TrustBadges />
    </div>
  );
}
