import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { DashboardResponse } from "@/types/api";
import {
  Clock,
  Sparkles,
  MessageSquare,
  Activity,
  Heart,
  Pill,
  Syringe,
  Stethoscope,
  FileText,
  Eye,
  AlertTriangle,
} from "lucide-react";

const SUMMARY_CARDS: {
  key: keyof DashboardResponse["summary"];
  label: string;
  icon: React.ElementType;
  link: string;
}[] = [
  {
    key: "conditions",
    label: "Conditions",
    icon: Heart,
    link: "/timeline?resourceType=Condition",
  },
  {
    key: "observations",
    label: "Observations",
    icon: Eye,
    link: "/timeline?resourceType=Observation",
  },
  {
    key: "encounters",
    label: "Encounters",
    icon: Stethoscope,
    link: "/timeline?resourceType=Encounter",
  },
  {
    key: "immunizations",
    label: "Immunizations",
    icon: Syringe,
    link: "/immunizations",
  },
  {
    key: "procedures",
    label: "Procedures",
    icon: Activity,
    link: "/timeline?resourceType=Procedure",
  },
  {
    key: "diagnosticReports",
    label: "Diagnostic Reports",
    icon: FileText,
    link: "/timeline?resourceType=DiagnosticReport",
  },
  {
    key: "medications",
    label: "Medications",
    icon: Pill,
    link: "/medications",
  },
  {
    key: "allergies",
    label: "Allergies",
    icon: AlertTriangle,
    link: "/timeline?resourceType=AllergyIntolerance",
  },
];

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardResponse>("/api/dashboard")
      .then(setData)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Patient header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {data.patient.sandboxPersona}'s Health Record
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.summary.totalResources} total resources
            {data.patient.lastSyncedAt &&
              ` — Last synced ${new Date(data.patient.lastSyncedAt).toLocaleDateString()}`}
          </p>
        </div>
        <Badge
          variant={data.patient.status === "ready" ? "default" : "secondary"}
        >
          {data.patient.status}
        </Badge>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map(({ key, label, icon: Icon, link }) => (
          <Link key={key} to={link}>
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="flex items-center gap-3 p-4">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{data.summary[key]}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* CTAs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/timeline">
          <Card className="transition-colors hover:bg-accent">
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Timeline</p>
                <p className="text-xs text-muted-foreground">
                  Browse all health events chronologically
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/medications/insights">
          <Card className="transition-colors hover:bg-accent">
            <CardContent className="flex items-center gap-3 p-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Deep Dive</p>
                <p className="text-xs text-muted-foreground">
                  Medication insights & analysis
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/chat">
          <Card className="transition-colors hover:bg-accent">
            <CardContent className="flex items-center gap-3 p-4">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Chat</p>
                <p className="text-xs text-muted-foreground">
                  Ask questions about your records
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent activity */}
      {data.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest health events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentActivity.map((item) => (
              <Link
                key={item.id}
                to={`/timeline?resourceType=${item.resourceType}`}
                className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent"
              >
                <div>
                  <p className="text-sm font-medium">
                    {item.displayText ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.source}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">
                    {item.resourceType}
                  </Badge>
                  {item.dateRecorded && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.dateRecorded).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}
