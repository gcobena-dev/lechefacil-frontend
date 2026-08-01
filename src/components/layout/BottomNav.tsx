import { NavLink, useLocation } from "react-router-dom";
import { Home, Milk, FileText, Heart, createLucideIcon } from "lucide-react";
import { bullHead } from "@lucide/lab";
import { useTranslation } from "@/hooks/useTranslation";

const CowHead = createLucideIcon("CowHead", bullHead as any);

export function BottomNav() {
  const location = useLocation();
  const { t } = useTranslation();

  const items = [
    { to: "/dashboard", icon: Home, labelKey: "common.dashboard" },
    { to: "/animals", icon: CowHead, labelKey: "animals.title" },
    { to: "/milk/collect", icon: Milk, labelKey: "milk.title" },
    { to: "/reproduction", icon: Heart, labelKey: "reproduction.title" },
    { to: "/reports", icon: FileText, labelKey: "dashboard.reports" },
  ];

  // Hide on routes like login
  if (location.pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm md:hidden pb-[env(safe-area-inset-bottom)]">
      <ul className="flex items-stretch justify-around h-16">
        {items.map(({ to, icon: Icon, labelKey }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                `h-full flex flex-col items-center justify-center gap-1 px-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground active:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Píldora de fondo en el activo: se identifica de un vistazo */}
                  <span
                    className={`flex items-center justify-center rounded-full px-3 py-0.5 transition-colors ${
                      isActive ? "bg-primary-light" : "bg-transparent"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-medium leading-none truncate max-w-full">
                    {t(labelKey)}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
