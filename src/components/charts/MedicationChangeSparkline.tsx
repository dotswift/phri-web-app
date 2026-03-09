interface SparklineProps {
  history: Array<{ dosage: string | null }>;
}

function extractNumeric(dosage: string | null): number | null {
  if (!dosage) return null;
  const match = dosage.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

export function MedicationChangeSparkline({ history }: SparklineProps) {
  const values = history.map((h) => extractNumeric(h.dosage)).filter((v): v is number => v !== null);
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 120;
  const height = 36;
  const padding = 4;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  // Build step-line path
  const stepX = values.length > 1 ? innerW / (values.length - 1) : 0;
  const points = values.map((v, i) => ({
    x: padding + i * stepX,
    y: padding + innerH - ((v - min) / range) * innerH,
  }));

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    // Step line: horizontal then vertical
    d += ` H ${points[i].x} V ${points[i].y}`;
  }

  const increased = values[values.length - 1] > values[0];
  const decreased = values[values.length - 1] < values[0];
  const strokeColor = increased
    ? "oklch(0.55 0.15 155)"
    : decreased
      ? "oklch(0.35 0.18 250)"
      : "oklch(0.55 0.1 250)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block"
      aria-label={`Dosage trend: ${values[0]} to ${values[values.length - 1]}`}
      role="img"
    >
      <path d={d} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={strokeColor} />
      ))}
    </svg>
  );
}
