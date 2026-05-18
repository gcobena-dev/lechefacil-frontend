import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useTranslation } from "@/hooks/useTranslation";
import type {
  MonthlyActivity,
  MonthlyTrend,
} from "@/services/reproductionDashboard";

interface Props {
  data: MonthlyActivity[];
  trends?: MonthlyTrend[];
}

export default function InseminationActivityChart({ data, trends }: Props) {
  const { t } = useTranslation();

  const chartConfig: ChartConfig = {
    straws_used: {
      label: t("reproduction.kpiStrawsUsed"),
      color: "hsl(220 70% 50%)",
    },
    cows_inseminated: {
      label: t("reproduction.kpiCowsInseminated"),
      color: "hsl(160 60% 45%)",
    },
    conception_rate: {
      label: t("reproduction.kpiConceptionRate"),
      color: "hsl(142 71% 45%)",
    },
    services_per_cow: {
      label: t("reproduction.kpiServicesPerCow"),
      color: "hsl(25 95% 53%)",
    },
  };

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[200px] sm:h-[250px] text-muted-foreground text-sm">
        {t("reproduction.noData")}
      </div>
    );
  }

  // Merge activity (bars) with trends (lines) on month key
  const trendsByMonth = new Map(
    (trends ?? []).map((t) => [t.month, t]),
  );
  const merged = data.map((a) => {
    const t = trendsByMonth.get(a.month);
    return {
      ...a,
      conception_rate: t?.conception_rate ?? null,
      services_per_cow: t?.services_per_cow ?? null,
    };
  });

  const formatMonth = (m: string) => {
    const [, month] = m.split("-");
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return months[parseInt(month, 10) - 1] || m;
  };

  return (
    <ChartContainer config={chartConfig} className="h-[200px] sm:h-[280px] w-full">
      <ComposedChart data={merged} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
        <YAxis
          yAxisId="counts"
          orientation="left"
          tick={{ fontSize: 11 }}
          allowDecimals={false}
          width={35}
        />
        <YAxis
          yAxisId="rate"
          orientation="right"
          tick={{ fontSize: 11 }}
          width={35}
          tickFormatter={(v) => `${v}`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend
          formatter={(value) => chartConfig[value]?.label || value}
          wrapperStyle={{ fontSize: "11px" }}
        />
        <Bar
          yAxisId="counts"
          dataKey="straws_used"
          fill="hsl(220 70% 50%)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          yAxisId="counts"
          dataKey="cows_inseminated"
          fill="hsl(160 60% 45%)"
          radius={[4, 4, 0, 0]}
        />
        <Line
          yAxisId="rate"
          type="monotone"
          dataKey="conception_rate"
          stroke="hsl(142 71% 45%)"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          connectNulls
        />
        <Line
          yAxisId="rate"
          type="monotone"
          dataKey="services_per_cow"
          stroke="hsl(25 95% 53%)"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          connectNulls
        />
      </ComposedChart>
    </ChartContainer>
  );
}
