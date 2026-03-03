import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useTranslation } from "@/hooks/useTranslation";
import type { MonthlyActivity } from "@/services/reproductionDashboard";

interface Props {
  data: MonthlyActivity[];
}

export default function InseminationActivityChart({ data }: Props) {
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
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={35} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend
          formatter={(value) => chartConfig[value]?.label || value}
          wrapperStyle={{ fontSize: "11px" }}
        />
        <Bar
          dataKey="straws_used"
          fill="hsl(220 70% 50%)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="cows_inseminated"
          fill="hsl(160 60% 45%)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
