import { NavLink, useLocation } from "react-router-dom";
import { Home, Milk, FileText, Heart, createLucideIcon } from "lucide-react";
import { bullHead } from "@lucide/lab";

const CowHead = createLucideIcon("CowHead", bullHead as any);

export function BottomNav() {
  const location = useLocation();

  const items = [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/animals", icon: CowHead, label: "Animals" },
    { to: "/milk/collect", icon: Milk, label: "Milk" },
    { to: "/reproduction", icon: Heart, label: "Reproduction" },
    { to: "/reports", icon: FileText, label: "Reports" },
  ];

  // Hide on routes like login
  if (location.pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-background md:hidden pb-[env(safe-area-inset-bottom)]">
      <ul className="flex items-stretch justify-around h-14">
        {items.map(({ to, icon: Icon, label }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                `h-full flex items-center justify-center transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <span className="sr-only">{label}</span>
              <Icon className="h-6 w-6" />
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
