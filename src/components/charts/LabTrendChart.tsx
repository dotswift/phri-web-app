import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { ChartAccessibility } from "./ChartAccessibility";

export interface LabDataPoint {
  date: string;
  value: number;
  unit: string;
}

export function LabTrendChart({
  data,
  normalLow,
  normalHigh,
  label,
}: {
  data: LabDataPoint[];
  normalLow?: number;
  normalHigh?: number;
  label: string;
}) {
  if (data.length === 0) return null;

  const unit = data[0].unit;
  const insight = `${label}: ${data.length} data points. Latest value: ${data[data.length - 1].value} ${unit}.${
    normalLow !== undefined && normalHigh !== undefined
      ? ` Normal range: ${normalLow}-${normalHigh} ${unit}.`
      : ""
  }`;

  return (
    <ChartAccessibility
      label={`${label} trend chart`}
      insight={insight}
      dataTable={
        <table className="w-full text-xs">
          <caption className="sr-only">{label} values</caption>
          <thead>
            <tr>
              <th scope="col" className="text-left p-1">Date</th>
              <th scope="col" className="text-right p-1">Value</th>
              <th scope="col" className="text-right p-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <td className="p-1">{d.date}</td>
                <td className="text-right p-1">
                  {d.value} {d.unit}
                </td>
                <td className="text-right p-1">
                  {normalLow !== undefined &&
                  normalHigh !== undefined &&
                  d.value >= normalLow &&
                  d.value <= normalHigh
                    ? "Within range"
                    : "Outside range"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} accessibilityLayer={false}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          {normalLow !== undefined && normalHigh !== undefined && (
            <>
              <ReferenceArea
                y1={normalLow}
                y2={normalHigh}
                fill="oklch(0.59 0.17 155)"
                fillOpacity={0.08}
              />
              <ReferenceLine
                y={normalLow}
                stroke="oklch(0.59 0.17 155)"
                strokeDasharray="3 3"
              />
              <ReferenceLine
                y={normalHigh}
                stroke="oklch(0.59 0.17 155)"
                strokeDasharray="3 3"
              />
            </>
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="oklch(0.59 0.155 210)"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartAccessibility>
  );
}
