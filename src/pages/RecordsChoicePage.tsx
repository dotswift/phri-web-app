import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrustBadges } from "@/components/shared/TrustBadges";
import { FileUp, Search, Hospital } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const OPTIONS = [
  {
    id: "upload",
    title: "I have my records",
    description:
      "Upload a PDF and we'll organize your health data so it's yours to explore.",
    icon: FileUp,
    to: "/upload",
  },
  {
    id: "search",
    title: "Help me get them",
    description:
      "Find your provider's contact info so you can request your records directly.",
    icon: Search,
    to: "/provider-search",
  },
] as const;

export function RecordsChoicePage() {
  const navigate = useNavigate();
  const [connectingEpic, setConnectingEpic] = useState(false);

  const handleEpicConnect = async () => {
    setConnectingEpic(true);
    try {
      const { url } = await api.get<{ url: string }>("/epic/authorize");
      window.location.href = url;
    } catch {
      toast.error("Failed to start Epic connection");
      setConnectingEpic(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Take Ownership of Your Records</h1>
        <p className="mt-1 text-muted-foreground">
          Your health data should be in your hands. Let's make that happen.
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        {OPTIONS.map(({ id, title, description, icon: Icon, to }) => (
          <Card
            key={id}
            className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
            onClick={() => navigate(to)}
          >
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}

        {/* Epic MyChart */}
        <Card
          className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
            connectingEpic ? "pointer-events-none opacity-60" : ""
          }`}
          onClick={handleEpicConnect}
        >
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Hospital className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">
              {connectingEpic ? "Connecting\u2026" : "Connect Epic MyChart"}
            </CardTitle>
            <CardDescription>
              Import records directly from your healthcare provider via Epic.
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>

      <TrustBadges />
    </div>
  );
}
