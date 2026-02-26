import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartAccessibility } from "./ChartAccessibility";

export interface DosageDataPoint {
  date: string;
  [drug: string]: string | number;
}

export function MedicationDosageChart({
  changes,
}: {
  changes: Array<{
    drug: string;
    history: Array<{
      date: string | null;
      dosage: string | null;
      status: string | null;
    }>;
  }>;
}) {
  if (changes.length === 0) return null;

  // Build unified timeline data for all drugs
  const drugNames = changes.map((c) => c.drug);
  const allDates = new Set<string>();
  const drugTimelines: Record<string, Record<string, number>> = {};

  for (const group of changes) {
    drugTimelines[group.drug] = {};
    let stepIndex = 0;
    for (const entry of group.history) {
      const dateKey = entry.date
        ? new Date(entry.date).toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          })
        : `Step ${++stepIndex}`;
      allDates.add(dateKey);
      // Extract numeric dosage if possible, otherwise use step index
      const numericDosage = entry.dosage
        ? parseFloat(entry.dosage.replace(/[^\d.]/g, ""))
        : 0;
      drugTimelines[group.drug][dateKey] = isNaN(numericDosage)
        ? entry.status === "active"
          ? 1
          : 0
        : numericDosage;
    }
  }

  const sortedDates = Array.from(allDates);
  const data = sortedDates.map((date) => {
    const point: Record<string, string | number> = { date };
    for (const drug of drugNames) {
      point[drug] = drugTimelines[drug]?.[date] ?? 0;
    }
    return point;
  });

  const COLORS = [
    "oklch(0.65 0.15 45)",
    "oklch(0.59 0.155 210)",
    "oklch(0.59 0.17 155)",
    "oklch(0.65 0.15 330)",
  ];

  const insight = `Medication dosage changes for ${drugNames.join(", ")}. ${data.length} time points tracked.`;

  return (
    <ChartAccessibility
      label="Medication dosage changes chart"
      insight={insight}
      dataTable={
        <table className="w-full text-xs">
          <caption className="sr-only">
            Medication dosage change history
          </caption>
          <thead>
            <tr>
              <th scope="col" className="text-left p-1">
                Date
              </th>
              {drugNames.map((drug) => (
                <th key={drug} scope="col" className="text-right p-1">
                  {drug}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <td className="p-1">{d.date}</td>
                {drugNames.map((drug) => (
                  <td key={drug} className="text-right p-1">
                    {d[drug]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} accessibilityLayer={false}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          {drugNames.map((drug, i) => (
            <Area
              key={drug}
              type="stepAfter"
              dataKey={drug}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.15}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartAccessibility>
  );
}
