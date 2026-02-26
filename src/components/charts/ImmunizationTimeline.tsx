import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartAccessibility } from "./ChartAccessibility";

interface ImmunizationChartItem {
  name: string;
  date: string;
  status: string | null;
}

export function ImmunizationTimeline({
  items,
}: {
  items: ImmunizationChartItem[];
}) {
  if (items.length === 0) return null;

  // Deduplicate vaccine names and assign Y-axis indices
  const vaccineNames = [...new Set(items.map((item) => item.name))];
  const vaccineIndex: Record<string, number> = {};
  vaccineNames.forEach((name, i) => {
    vaccineIndex[name] = i;
  });

  const data = items.map((item) => ({
    x: new Date(item.date).getTime(),
    y: vaccineIndex[item.name],
    name: item.name,
    date: new Date(item.date).toLocaleDateString(),
    status: item.status ?? "unknown",
  }));

  const insight = `Immunization timeline showing ${items.length} vaccinations across ${vaccineNames.length} vaccine types.`;

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: (typeof data)[0] }>;
  }) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded border bg-popover p-2 text-xs shadow-md">
        <p className="font-medium">{d.name}</p>
        <p className="text-muted-foreground">{d.date}</p>
        <p className="capitalize">{d.status}</p>
      </div>
    );
  };

  return (
    <ChartAccessibility
      label="Immunization timeline chart"
      insight={insight}
      dataTable={
        <table className="w-full text-xs">
          <caption className="sr-only">Immunization history</caption>
          <thead>
            <tr>
              <th scope="col" className="text-left p-1">
                Vaccine
              </th>
              <th scope="col" className="text-right p-1">
                Date
              </th>
              <th scope="col" className="text-right p-1">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td className="p-1">{item.name}</td>
                <td className="text-right p-1">
                  {new Date(item.date).toLocaleDateString()}
                </td>
                <td className="text-right p-1 capitalize">
                  {item.status ?? "unknown"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <ResponsiveContainer width="100%" height={Math.max(200, vaccineNames.length * 40)}>
        <ScatterChart accessibilityLayer={false} margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            type="number"
            dataKey="x"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(ts: number) =>
              new Date(ts).toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
              })
            }
            tick={{ fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[-0.5, vaccineNames.length - 0.5]}
            ticks={vaccineNames.map((_, i) => i)}
            tickFormatter={(i: number) => vaccineNames[i] ?? ""}
            tick={{ fontSize: 9 }}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter
            data={data}
            fill="oklch(0.59 0.155 210)"
            shape="circle"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartAccessibility>
  );
}
