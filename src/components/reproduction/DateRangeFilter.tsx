import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  dateFrom: string;
  dateTo: string;
  onChange: (dateFrom: string, dateTo: string) => void;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function DateRangeFilter({ dateFrom, dateTo, onChange }: Props) {
  const { t } = useTranslation();
  const today = new Date();

  const presets = [
    {
      label: t("reproduction.kpiLast3Months"),
      getRange: () => {
        const from = new Date(today);
        from.setMonth(from.getMonth() - 3);
        return [formatDate(from), formatDate(today)];
      },
    },
    {
      label: t("reproduction.kpiLast6Months"),
      getRange: () => {
        const from = new Date(today);
        from.setMonth(from.getMonth() - 6);
        return [formatDate(from), formatDate(today)];
      },
    },
    {
      label: t("reproduction.kpiLast12Months"),
      getRange: () => {
        const from = new Date(today);
        from.setFullYear(from.getFullYear() - 1);
        return [formatDate(from), formatDate(today)];
      },
    },
    {
      label: t("reproduction.kpiThisYear"),
      getRange: () => {
        const from = new Date(today.getFullYear(), 0, 1);
        return [formatDate(from), formatDate(today)];
      },
    },
  ];

  const isActive = (getRange: () => string[]) => {
    const [f, to] = getRange();
    return f === dateFrom && to === dateTo;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <Button
          key={preset.label}
          variant={isActive(preset.getRange) ? "default" : "outline"}
          size="sm"
          onClick={() => {
            const [f, to] = preset.getRange();
            onChange(f, to);
          }}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
