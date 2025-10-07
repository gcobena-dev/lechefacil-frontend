import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { User, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { performLogout } from "@/services/auth";
import { useTranslation } from "@/hooks/useTranslation";
import { NotificationBell } from "./NotificationBell";

export function Header() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-50 border-b bg-card/50 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-foreground">
              Finca Dos Hermanos
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("common.milkManagementSystem")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("common.myAccount")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => navigate("/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                {t("common.settings")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive cursor-pointer"
                onClick={async () => {
                  await performLogout();
                  navigate("/login", { replace: true });
                }}
              >
                {t("common.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
