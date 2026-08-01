import * as React from "react";
import { HelpCircle, LucideIcon, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type StatTrend = "up" | "down" | "flat";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Etiqueta corta de la métrica, p. ej. "Litros hoy" */
  label: string;
  /** Cifra principal ya formateada */
  value: React.ReactNode;
  /** Sufijo de unidad pegado a la cifra, p. ej. "L" o "%" */
  unit?: string;
  /** Texto secundario bajo la cifra (contexto o delta) */
  hint?: React.ReactNode;
  /** Dirección de la tendencia; define color e icono del delta */
  trend?: StatTrend;
  /** Valor del delta ya formateado, p. ej. "+12%" */
  trendValue?: string;
  icon?: LucideIcon;
  /** Clase de color para el icono; por defecto discreto */
  iconClassName?: string;
  /** Cuando una subida es mala (p. ej. animales enfermos) */
  invertTrendColor?: boolean;
  /** Explicación de la métrica, mostrada en un popover junto a la etiqueta */
  info?: string;
  /** Etiqueta accesible del botón de info */
  infoAriaLabel?: string;
}

const trendIcon: Record<StatTrend, LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

/**
 * Tarjeta de métrica: etiqueta discreta, cifra dominante en cifras tabulares
 * y delta con color semántico. Es el bloque base del dashboard, reproducción
 * y reportes — no usar Card+CardHeader a mano para KPIs.
 */
export function StatCard({
  label,
  value,
  unit,
  hint,
  trend,
  trendValue,
  icon: Icon,
  iconClassName,
  invertTrendColor = false,
  info,
  infoAriaLabel,
  className,
  ...props
}: StatCardProps) {
  const TrendIcon = trend ? trendIcon[trend] : null;

  const trendColor =
    trend === "flat" || !trend
      ? "text-muted-foreground"
      : (trend === "up") !== invertTrendColor
        ? "text-success"
        : "text-destructive";

  return (
    <Card className={cn("p-4 sm:p-5", className)} {...props}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">
            {label}
          </p>
          {info && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={infoAriaLabel ?? label}
                  className="shrink-0 text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-3">
                <p className="text-xs font-semibold mb-1">{label}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{info}</p>
              </PopoverContent>
            </Popover>
          )}
        </div>
        {Icon && (
          <Icon className={cn("h-4 w-4 shrink-0", iconClassName ?? "text-muted-foreground")} />
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-1 min-w-0">
        <span
          data-metric
          className="text-2xl sm:text-3xl font-semibold leading-none tracking-tight truncate"
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-muted-foreground">{unit}</span>
        )}
      </div>

      {(trendValue || hint) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {TrendIcon && trendValue && (
            <span className={cn("flex items-center gap-1 font-medium", trendColor)}>
              <TrendIcon className="h-3.5 w-3.5" />
              <span data-metric>{trendValue}</span>
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </Card>
  );
}

export default StatCard;
