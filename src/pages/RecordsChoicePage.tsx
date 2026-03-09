import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrustBadges } from "@/components/shared/TrustBadges";
import { FileUp, Search } from "lucide-react";

const OPTIONS = [
  {
    title: "I have my records",
    description:
      "Upload a PDF and we'll organize your health data so it's yours to explore.",
    icon: FileUp,
    to: "/upload",
  },
  {
    title: "Help me get them",
    description:
      "Find your provider's contact info so you can request your records directly.",
    icon: Search,
    to: "/provider-search",
  },
] as const;

export function RecordsChoicePage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Take Ownership of Your Records</h1>
        <p className="mt-1 text-muted-foreground">
          Your health data should be in your hands. Let's make that happen.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {OPTIONS.map(({ title, description, icon: Icon, to }) => (
          <Card
            key={to}
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
      </div>

      <TrustBadges />
    </div>
  );
}
