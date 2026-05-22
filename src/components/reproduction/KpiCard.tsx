import { Card, CardContent } from "@/components/ui/card";
import {
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

export default function KpiCard({
  icon: Icon,
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
  const goodDirection = invertColor ? "down" : "up";
  const colorClass =
    direction === "flat"
      ? "text-muted-foreground"
      : direction === goodDirection
        ? "text-emerald-500"
        : "text-rose-500";
  const TrendIcon =
    direction === "flat" ? Minus : direction === "up" ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2 min-w-0">
          <Icon className={`h-4 w-4 shrink-0 ${iconClassName ?? "text-muted-foreground"}`} />
          <span className="text-[11px] sm:text-xs text-muted-foreground truncate min-w-0">
            {label}
          </span>
          {info && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={t("reproduction.kpiInfoAria")}
                  className="shrink-0 text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-64 p-3"
              >
                <p className="text-xs font-semibold mb-1">{label}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {info}
                </p>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{value}</p>
        {hasDelta && (
          <div className={`mt-1 flex items-center gap-1 text-[11px] sm:text-xs ${colorClass}`}>
            <TrendIcon className="h-3 w-3 shrink-0" />
            <span className="font-medium">{formatDelta(delta!, unit)}</span>
            <span className="text-muted-foreground hidden md:inline">·</span>
            <span className="text-muted-foreground truncate hidden md:inline">
              {t("reproduction.vsPreviousPeriod")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
