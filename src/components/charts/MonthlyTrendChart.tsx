import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useTranslation } from "@/hooks/useTranslation";
import type { MonthlyTrend } from "@/services/reproductionDashboard";

interface Props {
  data: MonthlyTrend[];
}

export default function MonthlyTrendChart({ data }: Props) {
  const { t } = useTranslation();

  const chartConfig: ChartConfig = {
    insemination_count: {
      label: t("reproduction.kpiInseminations"),
      color: "hsl(220 70% 50%)",
    },
    conception_rate: {
      label: t("reproduction.kpiConceptionRate"),
      color: "hsl(142 76% 36%)",
    },
    services_per_cow: {
      label: t("reproduction.kpiServicesPerCow"),
      color: "hsl(30 80% 55%)",
    },
  };

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[200px] sm:h-[250px] text-muted-foreground text-sm">
        {t("reproduction.noData")}
      </div>
    );
  }

  const formatMonth = (m: string) => {
    const [, month] = m.split("-");
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return months[parseInt(month, 10) - 1] || m;
  };

  return (
    <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
      <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => `${v}%`}
          width={40}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11 }}
          allowDecimals={false}
          width={35}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend
          formatter={(value) => chartConfig[value]?.label || value}
          wrapperStyle={{ fontSize: "11px" }}
        />
        <Bar
          yAxisId="right"
          dataKey="insemination_count"
          fill="hsl(220 70% 50%)"
          radius={[4, 4, 0, 0]}
          opacity={0.7}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="conception_rate"
          stroke="hsl(142 76% 36%)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="services_per_cow"
          stroke="hsl(30 80% 55%)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
