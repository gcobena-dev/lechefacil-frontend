import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  value: "3m" | "6m" | "12m" | "year";
  onChange: (v: "3m" | "6m" | "12m" | "year") => void;
}

export default function CompactPeriodSelector({ value, onChange }: Props) {
  const { t } = useTranslation();
  const options: { id: Props["value"]; label: string }[] = [
    { id: "3m", label: t("reproduction.period3Months") },
    { id: "6m", label: t("reproduction.period6Months") },
    { id: "12m", label: t("reproduction.period12Months") },
    { id: "year", label: t("reproduction.periodYear") },
  ];
  return (
    <div className="inline-flex items-center rounded-md border bg-card p-1">
      {options.map((o) => {
        const isActive = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              isActive
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function rangeForPeriod(value: Props["value"]): [string, string] {
  const today = new Date();
  const from = new Date(today);
  if (value === "3m") from.setMonth(from.getMonth() - 3);
  else if (value === "6m") from.setMonth(from.getMonth() - 6);
  else if (value === "12m") from.setFullYear(from.getFullYear() - 1);
  else if (value === "year") {
    from.setMonth(0);
    from.setDate(1);
  }
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return [fmt(from), fmt(today)];
}
