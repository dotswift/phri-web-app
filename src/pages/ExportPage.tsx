import { ExportPanel } from "@/components/export/ExportPanel";

export function ExportPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Export Records</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Download your health data in your preferred format.
        </p>
      </div>
      <ExportPanel />
    </div>
  );
}
