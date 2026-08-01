import { type LucideIcon } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  value: string | number;
  delta?: number | null;
  unit?: "" | "pp" | string;
  invertColor?: boolean;
  /** Optional explanation shown in a popover when the info icon is clicked. */
  info?: string;
}

function formatDelta(delta: number, unit: string): string {
  const sign = delta > 0 ? "+" : "";
  const rounded =
    Math.abs(delta) < 1 && delta !== 0 ? delta.toFixed(2) : delta.toFixed(0);
  return `${sign}${rounded}${unit}`;
}

/**
 * KPI de reproducción. Envoltorio fino sobre StatCard que traduce el delta
 * numérico del backend a la API de tendencia del design system.
 */
export default function KpiCard({
  icon,
  iconClassName,
  label,
  value,
  delta,
  unit = "",
  invertColor = false,
  info,
}: Props) {
  const { t } = useTranslation();
  const hasDelta = delta !== undefined && delta !== null && !Number.isNaN(delta);
  const direction = !hasDelta || delta === 0 ? "flat" : delta! > 0 ? "up" : "down";

  return (
    <StatCard
      icon={icon}
      iconClassName={iconClassName}
      label={label}
      value={value}
      trend={direction}
      trendValue={hasDelta ? formatDelta(delta!, unit) : undefined}
      hint={
        hasDelta ? (
          <span className="hidden md:inline">{t("reproduction.vsPreviousPeriod")}</span>
        ) : undefined
      }
      invertTrendColor={invertColor}
      info={info}
      infoAriaLabel={t("reproduction.kpiInfoAria")}
    />
  );
}
