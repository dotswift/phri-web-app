import { type ReactNode } from "react";

/**
 * Accessible chart wrapper providing:
 * - <figure> with aria-label
 * - <div role="img" aria-hidden="true"> for SVG chart
 * - <figcaption class="sr-only"> for insight text
 * - <details> expandable data table
 */
export function ChartAccessibility({
  label,
  insight,
  children,
  dataTable,
}: {
  label: string;
  insight: string;
  children: ReactNode;
  dataTable?: ReactNode;
}) {
  return (
    <figure aria-label={label}>
      <div role="img" aria-hidden="true">
        {children}
      </div>
      <figcaption className="sr-only">{insight}</figcaption>
      {dataTable && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            View data as table
          </summary>
          <div className="mt-2 overflow-auto">{dataTable}</div>
        </details>
      )}
    </figure>
  );
}
