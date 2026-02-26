import { Card, CardContent } from "@/components/ui/card";
import { type ReactNode } from "react";

export function KpiCard({
  title,
  value,
  icon,
  description,
  accentColor,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  accentColor?: string;
}) {
  return (
    <Card
      className="hover:scale-[1.02] transition-transform duration-200"
      style={accentColor ? { borderLeft: `4px solid ${accentColor}` } : undefined}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
          style={
            accentColor
              ? { backgroundColor: `color-mix(in oklch, ${accentColor} 12%, transparent)` }
              : undefined
          }
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
          {description && (
            <p className="mt-0.5 text-[10px] text-muted-foreground/70">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
