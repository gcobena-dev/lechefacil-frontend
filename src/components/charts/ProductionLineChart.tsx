import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const COLORS = [
  "hsl(var(--chart-1, 220 70% 50%))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
];

interface ProductionLineChartProps {
  data: Array<{ date: string; [animalKey: string]: number | string }>;
  animals: Array<{ key: string; label: string; color?: string }>;
  days?: number;
  className?: string;
}

export default function ProductionLineChart({
  data,
  animals,
  days,
  className,
}: ProductionLineChartProps) {
  if (!data.length) return null;

  const chartConfig: ChartConfig = {};
  animals.forEach((a, i) => {
    chartConfig[a.key] = {
      label: a.label,
      color: a.color || COLORS[i % COLORS.length],
    };
  });

  const formatTick = (value: string) => {
    const [, m, d] = value.split("-");
    return `${d}/${m}`;
  };

  // Show ~10 ticks max so labels don't overlap
  const tickInterval = Math.max(1, Math.floor(data.length / 10)) - 1;

  const showDots = data.length <= 30;

  return (
    <ChartContainer
      config={chartConfig}
      className={cn("h-[200px] sm:h-[300px] w-full", className)}
    >
      <LineChart
        data={data}
        margin={{ top: 5, right: 10, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatTick}
          interval={tickInterval}
          angle={-45}
          textAnchor="end"
          height={50}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => `${v}L`}
          width={45}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => {
                if (typeof label !== "string") return label;
                const [y, m, d] = label.split("-");
                return `${d}/${m}/${y}`;
              }}
              formatter={(value, name) => {
                const animal = animals.find((a) => a.key === name);
                const label = animal?.label || name;
                return (
                  <span>
                    {label}: <strong>{Number(value).toFixed(1)}L</strong>
                  </span>
                );
              }}
            />
          }
        />
        {animals.map((a, i) => (
          <Line
            key={a.key}
            type="monotone"
            dataKey={a.key}
            stroke={a.color || COLORS[i % COLORS.length]}
            strokeWidth={1.5}
            dot={showDots ? { r: 2 } : false}
            activeDot={{ r: 4 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
