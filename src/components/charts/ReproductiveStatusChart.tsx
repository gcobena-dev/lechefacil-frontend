import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useTranslation } from "@/hooks/useTranslation";
import type { ReproductiveStatusBreakdown } from "@/services/reproductionDashboard";

interface Props {
  data: ReproductiveStatusBreakdown;
}

const COLORS: Record<string, string> = {
  pregnant: "hsl(142 76% 36%)",
  open: "hsl(0 84% 60%)",
  pending: "hsl(45 93% 47%)",
  lost: "hsl(0 0% 64%)",
};

export default function ReproductiveStatusChart({ data }: Props) {
  const { t } = useTranslation();

  const chartData = [
    { name: "pregnant", value: data.pregnant, fill: COLORS.pregnant },
    { name: "open", value: data.open, fill: COLORS.open },
    { name: "pending", value: data.pending, fill: COLORS.pending },
    ...(data.lost > 0
      ? [{ name: "lost", value: data.lost, fill: COLORS.lost }]
      : []),
  ].filter((d) => d.value > 0);

  const total = data.pregnant + data.open + data.pending + data.lost;

  const chartConfig: ChartConfig = {
    pregnant: { label: t("reproduction.confirmed"), color: COLORS.pregnant },
    open: { label: t("reproduction.open"), color: COLORS.open },
    pending: { label: t("reproduction.pending"), color: COLORS.pending },
    lost: { label: t("reproduction.lost"), color: COLORS.lost },
  };

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] sm:h-[250px] text-muted-foreground text-sm">
        {t("reproduction.noData")}
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                const label = chartConfig[name as string]?.label || name;
                return (
                  <span>
                    {label}: <strong>{value}</strong>
                  </span>
                );
              }}
            />
          }
        />
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-2xl font-bold"
        >
          {total}
        </text>
        <text
          x="50%"
          y="58%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground text-xs"
        >
          {t("reproduction.kpiTotal")}
        </text>
      </PieChart>
    </ChartContainer>
  );
}
