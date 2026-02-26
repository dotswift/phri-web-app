/**
 * 4-level progressive disclosure for lab results.
 * Level 1 (Summary): Quick status badge
 * Level 2 (Value): Numeric value + reference range
 * Level 3 (Explanation): Plain-language interpretation
 * Level 4 (Action): Recommended next steps
 */
export function LabResultDisclosure({
  testName,
  value,
  unit,
  referenceRange,
  status,
  explanation,
  action,
}: {
  testName: string;
  value: number | string;
  unit: string;
  referenceRange?: string;
  status: "normal" | "high" | "low" | "critical";
  explanation?: string;
  action?: string;
}) {
  const statusColors = {
    normal: "text-success bg-success/10",
    high: "text-warning bg-warning/10",
    low: "text-warning bg-warning/10",
    critical: "text-destructive bg-destructive/10",
  };

  const statusLabels = {
    normal: "Within normal range",
    high: "Above normal range",
    low: "Below normal range",
    critical: "Needs attention",
  };

  return (
    <div className="space-y-1">
      {/* Level 1: Summary */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{testName}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status]}`}
        >
          {statusLabels[status]}
        </span>
      </div>

      {/* Level 2: Value */}
      <details className="group">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
          View value details
        </summary>
        <div className="mt-1 rounded-md bg-muted p-2 text-sm">
          <p>
            <span className="font-medium">
              {value} {unit}
            </span>
            {referenceRange && (
              <span className="ml-2 text-xs text-muted-foreground">
                Reference: {referenceRange}
              </span>
            )}
          </p>

          {/* Level 3: Explanation */}
          {explanation && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                What does this mean?
              </summary>
              <p className="mt-1 text-xs text-muted-foreground">
                {explanation}
              </p>

              {/* Level 4: Action */}
              {action && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    Recommended next steps
                  </summary>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {action}
                  </p>
                </details>
              )}
            </details>
          )}
        </div>
      </details>
    </div>
  );
}
