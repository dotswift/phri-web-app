import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrustBadges } from "@/components/shared/TrustBadges";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export function ProfileSetupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshUserState } = useAuth();
  const navigate = useNavigate();

  const isValid = firstName.trim() && lastName.trim() && dateOfBirth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      await api.patch("/api/patient/profile", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
      });
      await refreshUserState();
      navigate("/records-choice");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save profile",
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
              Profile Setup
            </h1>
          </div>
          <CardDescription>
            Tell us a bit about yourself so we can personalize your experience
            and de-identify your records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>

            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  Your data is encrypted at rest (AES-256) and in transit (TLS).
                  Personal identifiers are stripped before any AI processing.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || loading}
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <TrustBadges />
    </div>
  );
}
