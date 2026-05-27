import { useMemo, useState } from "react";
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
  type ChartConfig,
} from "@/components/ui/chart";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import type { SirePerformanceSummaryItem } from "@/services/sireCatalog";

type Metric = "conception_rate" | "straws_used" | "straws_in_stock";
type TopN = "5" | "10" | "20" | "all";

interface Props {
  items: SirePerformanceSummaryItem[];
  isLoading?: boolean;
  includeInactive: boolean;
  onIncludeInactiveChange: (value: boolean) => void;
}

const truncate = (s: string, max = 14) =>
  s.length > max ? `${s.slice(0, max - 1)}…` : s;

export default function SirePerformanceChart({
  items,
  isLoading,
  includeInactive,
  onIncludeInactiveChange,
}: Props) {
  const { t } = useTranslation();
  const [metric, setMetric] = useState<Metric>("conception_rate");
  const [topN, setTopN] = useState<TopN>("10");

  const { chartData, totalCount } = useMemo(() => {
    const mapped = items.map((it) => ({
      sire_id: it.sire.id,
      name: it.sire.name,
      short_code: it.sire.short_code,
      is_active: it.sire.is_active,
      total_inseminations: it.total_inseminations,
      confirmed_pregnancies: it.confirmed_pregnancies,
      conception_rate: Math.round(it.conception_rate * 1000) / 10,
      straws_used: it.straws_used,
      straws_in_stock: it.straws_in_stock,
    }));
    const sorted = [...mapped].sort((a, b) => {
      if (metric === "conception_rate") {
        if (b.conception_rate !== a.conception_rate)
          return b.conception_rate - a.conception_rate;
        return b.total_inseminations - a.total_inseminations;
      }
      if (metric === "straws_used") return b.straws_used - a.straws_used;
      return b.straws_in_stock - a.straws_in_stock;
    });
    const limit = topN === "all" ? sorted.length : parseInt(topN, 10);
    return { chartData: sorted.slice(0, limit), totalCount: sorted.length };
  }, [items, metric, topN]);

  const shown = chartData.length;
  const showingNote =
    totalCount > shown
      ? t("reproduction.showingTopOfTotal")
          .replace("{shown}", String(shown))
          .replace("{total}", String(totalCount))
      : "";

  const chartConfig: ChartConfig = {
    total_inseminations: {
      label: t("reproduction.totalInseminations"),
      color: "hsl(220 70% 50%)",
    },
    straws_in_stock: {
      label: t("reproduction.strawsInStock"),
      color: "hsl(200 65% 55%)",
    },
    conception_rate: {
      label: t("reproduction.conceptionRate"),
      color: "hsl(142 71% 45%)",
    },
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
        <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
          <TabsList>
            <TabsTrigger value="conception_rate">
              {t("reproduction.metricConceptionRate")}
            </TabsTrigger>
            <TabsTrigger value="straws_used">
              {t("reproduction.metricStrawsUsed")}
            </TabsTrigger>
            <TabsTrigger value="straws_in_stock">
              {t("reproduction.metricStrawsInStock")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">
              {t("reproduction.showLabel")}
            </Label>
            <Select value={topN} onValueChange={(v) => setTopN(v as TopN)}>
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">{t("reproduction.top5")}</SelectItem>
                <SelectItem value="10">{t("reproduction.top10")}</SelectItem>
                <SelectItem value="20">{t("reproduction.top20")}</SelectItem>
                <SelectItem value="all">{t("reproduction.topAll")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="include-inactive"
              checked={includeInactive}
              onCheckedChange={onIncludeInactiveChange}
            />
            <Label htmlFor="include-inactive" className="text-xs cursor-pointer">
              {t("reproduction.includeInactiveSires")}
            </Label>
          </div>
        </div>
      </div>

      {showingNote && (
        <p className="text-xs text-muted-foreground">{showingNote}</p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-[280px] sm:h-[340px] text-muted-foreground text-sm">
          {t("reproduction.loading")}
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] sm:h-[340px] text-muted-foreground text-sm">
          {t("reproduction.noData")}
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <ChartContainer
            config={chartConfig}
            className="h-[300px] sm:h-[360px] w-full"
            style={{ minWidth: `${Math.max(chartData.length * 70, 400)}px` }}
          >
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) => truncate(v, 14)}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={70}
              />
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
                width={40}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <ChartTooltip
                content={(props) => {
                  const { active, payload } = props as {
                    active?: boolean;
                    payload?: Array<{ payload: (typeof chartData)[number] }>;
                  };
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload;
                  const title = row.short_code
                    ? `${row.name} (${row.short_code})`
                    : row.name;
                  const primaryMetric =
                    metric === "straws_in_stock"
                      ? {
                          label: chartConfig.straws_in_stock.label,
                          value: row.straws_in_stock,
                        }
                      : {
                          label: chartConfig.total_inseminations.label,
                          value: row.total_inseminations,
                        };
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-md text-xs">
                      <div className="font-medium mb-1">{title}</div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">
                            {primaryMetric.label}
                          </span>
                          <span className="font-mono font-medium">
                            {primaryMetric.value}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">
                            {t("reproduction.confirmedPregnancies")}
                          </span>
                          <span className="font-mono font-medium">
                            {row.confirmed_pregnancies}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">
                            {chartConfig.conception_rate.label}
                          </span>
                          <span className="font-mono font-medium">
                            {row.conception_rate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                formatter={(value) => chartConfig[value]?.label || value}
                wrapperStyle={{ fontSize: "11px" }}
              />
              {metric === "straws_in_stock" ? (
                <Bar
                  yAxisId="counts"
                  dataKey="straws_in_stock"
                  fill="hsl(200 65% 55%)"
                  radius={[4, 4, 0, 0]}
                />
              ) : (
                <Bar
                  yAxisId="counts"
                  dataKey="total_inseminations"
                  fill="hsl(220 70% 50%)"
                  radius={[4, 4, 0, 0]}
                />
              )}
              <Line
                yAxisId="rate"
                type="monotone"
                dataKey="conception_rate"
                stroke="hsl(142 71% 45%)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls
              />
            </ComposedChart>
          </ChartContainer>
        </div>
      )}
    </div>
  );
}
