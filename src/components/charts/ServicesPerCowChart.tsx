import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useTranslation } from "@/hooks/useTranslation";
import type { ServicesDistribution } from "@/services/reproductionDashboard";

interface Props {
  data: ServicesDistribution;
}

const COLORS = [
  "hsl(220 70% 50%)",
  "hsl(160 60% 45%)",
  "hsl(30 80% 55%)",
];

export default function ServicesPerCowChart({ data }: Props) {
  const { t } = useTranslation();

  const chartData = [
    { name: t("reproduction.kpiOneService"), value: data.one_service },
    { name: t("reproduction.kpiTwoServices"), value: data.two_services },
    { name: t("reproduction.kpiThreePlusServices"), value: data.three_plus_services },
  ];

  const total = data.one_service + data.two_services + data.three_plus_services;

  const chartConfig: ChartConfig = {
    value: { label: t("reproduction.kpiCows") },
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
      <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={35} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
          <LabelList dataKey="value" position="top" className="fill-foreground text-xs" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
