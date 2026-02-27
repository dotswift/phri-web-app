import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSandboxDemo } from "@/context/SandboxContext";
import { Database, Info, X } from "lucide-react";

export function SandboxActivationCard() {
  const { activateSandboxDemo } = useSandboxDemo();

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="rounded-full bg-primary/10 p-3">
          <Database className="h-8 w-8 text-primary" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-lg font-semibold">No medication data available</h3>
          <p className="text-sm text-muted-foreground">
            This sandbox persona has no medication records. Activate demo mode to
            explore medication list, duplicate detection, and dosage change
            tracking with realistic sample data.
          </p>
        </div>
        <Button onClick={activateSandboxDemo}>Activate Demo Data</Button>
      </CardContent>
    </Card>
  );
}

export function SandboxActiveBanner() {
  const { deactivateSandboxDemo } = useSandboxDemo();

  return (
    <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
      <Info className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        Showing demo medication data — sandbox persona has no real records.
      </span>
      <button
        onClick={deactivateSandboxDemo}
        className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium hover:bg-blue-200/60 dark:hover:bg-blue-800/60"
      >
        <X className="h-3 w-3" />
        Deactivate
      </button>
    </div>
  );
}
