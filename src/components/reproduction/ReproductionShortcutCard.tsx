import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function ReproductionShortcutCard({
  icon: Icon,
  title,
  subtitle,
  onClick,
  disabled,
}: Props) {
  const interactive = !!onClick && !disabled;
  return (
    <Card
      className={`${
        interactive ? "cursor-pointer hover:border-primary/50 transition-colors" : "opacity-60"
      }`}
      onClick={interactive ? onClick : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2 shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        </div>
        {interactive && (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </CardContent>
    </Card>
  );
}
