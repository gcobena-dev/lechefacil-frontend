import { AlertTriangle, Syringe, CheckCircle2, CircleSlash, Calendar, Users } from "lucide-react";
import type { ReproductiveBucket, BucketCounts } from "@/services/reproductionDashboard";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  active: ReproductiveBucket;
  counts: BucketCounts;
  onChange: (b: ReproductiveBucket) => void;
}

export default function ReproductiveStatusTabs({ active, counts, onChange }: Props) {
  const { t } = useTranslation();

  const tabs: { id: ReproductiveBucket; label: string; count: number; icon: typeof AlertTriangle; activeClass: string }[] = [
    { id: "alertas", label: t("reproduction.tabAlertas"), count: counts.alertas, icon: AlertTriangle, activeClass: "text-destructive border-destructive" },
    { id: "inseminadas", label: t("reproduction.tabInseminadas"), count: counts.inseminadas, icon: Syringe, activeClass: "text-foreground border-foreground" },
    { id: "prenadas", label: t("reproduction.tabPrenadas"), count: counts.prenadas, icon: CheckCircle2, activeClass: "text-foreground border-foreground" },
    { id: "vacias", label: t("reproduction.tabVacias"), count: counts.vacias, icon: CircleSlash, activeClass: "text-foreground border-foreground" },
    { id: "sin_inseminar", label: t("reproduction.tabSinInseminar"), count: counts.sin_inseminar, icon: Calendar, activeClass: "text-foreground border-foreground" },
    { id: "todas", label: t("reproduction.tabTodas"), count: counts.todas, icon: Users, activeClass: "text-foreground border-foreground" },
  ];

  return (
    <div className="border-b overflow-x-auto">
      <div className="flex items-center gap-1 min-w-max">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
                isActive
                  ? tab.activeClass
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span
                className={`text-xs rounded-md px-1.5 py-0.5 ${
                  isActive ? "bg-muted" : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
