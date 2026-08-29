import { useEffect, useRef } from "react";
import { AlertTriangle, Syringe, CheckCircle2, CircleSlash, Calendar, Users } from "lucide-react";
import {
  REPRODUCTIVE_BUCKETS,
  type ReproductiveBucket,
  type BucketCounts,
} from "@/services/reproductionDashboard";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  active: ReproductiveBucket;
  counts: BucketCounts;
  onChange: (b: ReproductiveBucket) => void;
}

// Icon and highlight per tab. The order comes from REPRODUCTIVE_BUCKETS so the
// bar and the mobile swipe navigation can never drift apart.
const TAB_STYLE: Record<
  ReproductiveBucket,
  { icon: typeof AlertTriangle; activeClass: string; labelKey: string }
> = {
  alertas: {
    icon: AlertTriangle,
    activeClass: "text-destructive border-destructive",
    labelKey: "reproduction.tabAlertas",
  },
  inseminadas: {
    icon: Syringe,
    activeClass: "text-foreground border-foreground",
    labelKey: "reproduction.tabInseminadas",
  },
  prenadas: {
    icon: CheckCircle2,
    activeClass: "text-foreground border-foreground",
    labelKey: "reproduction.tabPrenadas",
  },
  vacias: {
    icon: CircleSlash,
    activeClass: "text-foreground border-foreground",
    labelKey: "reproduction.tabVacias",
  },
  sin_inseminar: {
    icon: Calendar,
    activeClass: "text-foreground border-foreground",
    labelKey: "reproduction.tabSinInseminar",
  },
  todas: {
    icon: Users,
    activeClass: "text-foreground border-foreground",
    labelKey: "reproduction.tabTodas",
  },
};

export default function ReproductiveStatusTabs({ active, counts, onChange }: Props) {
  const { t } = useTranslation();
  const activeRef = useRef<HTMLButtonElement | null>(null);

  // Keep the selected tab visible when it changes from a swipe on mobile,
  // where the bar scrolls sideways.
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [active]);

  return (
    <div className="border-b overflow-x-auto">
      <div className="flex items-center gap-1 min-w-max">
        {REPRODUCTIVE_BUCKETS.map((id) => {
          const { icon: Icon, activeClass, labelKey } = TAB_STYLE[id];
          const isActive = active === id;
          return (
            <button
              key={id}
              ref={isActive ? activeRef : undefined}
              type="button"
              onClick={() => onChange(id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
                isActive
                  ? activeClass
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t(labelKey)}</span>
              <span
                className={`text-xs rounded-md px-1.5 py-0.5 ${
                  isActive ? "bg-muted" : "bg-muted text-muted-foreground"
                }`}
              >
                {counts[id]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
