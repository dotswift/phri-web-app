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
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { Patient, Persona } from "@/types/api";

const PERSONAS: {
  name: Persona;
  fullName: string;
  dob: string;
  gender: string;
  description: string;
}[] = [
  {
    name: "Jane",
    fullName: "Jane Smith",
    dob: "1996-02-10",
    gender: "Female",
    description: "~30 years old, ~159 health resources",
  },
  {
    name: "Chris",
    fullName: "Chris Smith",
    dob: "1995-01-01",
    gender: "Male",
    description: "~30 years old, ~159 health resources",
  },
  {
    name: "Ollie",
    fullName: "Ollie Brown",
    dob: "1946-03-18",
    gender: "Male",
    description: "~80 years old, extensive encounter history",
  },
  {
    name: "Kyla",
    fullName: "Kyla Brown",
    dob: "1927-05-23",
    gender: "Female",
    description: "~99 years old, ~168 health resources",
  },
  {
    name: "Andreas",
    fullName: "Andreas Brown",
    dob: "1952-01-01",
    gender: "Male",
    description: "~74 years old",
  },
];

export function ConnectPage() {
  const [selected, setSelected] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(false);
  const { refreshUserState } = useAuth();
  const navigate = useNavigate();

  const handleConnect = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await api.post<Patient>("/api/patient/connect", { persona: selected });
      await refreshUserState();
      navigate("/progress");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to connect persona",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Connect a Health Record</h1>
          <p className="mt-1 text-muted-foreground">
            Choose a sandbox persona to explore PHRI. Each persona has realistic
            health data.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {PERSONAS.map((persona) => (
            <Card
              key={persona.name}
              className={`cursor-pointer transition-colors ${
                selected === persona.name
                  ? "border-primary ring-2 ring-primary"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelected(persona.name)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{persona.fullName}</CardTitle>
                <CardDescription className="flex gap-2">
                  <Badge variant="secondary">{persona.gender}</Badge>
                  <Badge variant="outline">DOB: {persona.dob}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {persona.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button
          onClick={handleConnect}
          disabled={!selected || loading}
          className="w-full"
          size="lg"
        >
          {loading ? "Connecting..." : "Connect Selected Persona"}
        </Button>
      </div>
    </div>
  );
}
