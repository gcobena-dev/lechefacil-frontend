import { NavLink } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, FileText, Heart, Milk, Settings, createLucideIcon } from "lucide-react";
import { bullHead } from "@lucide/lab";
const CowHead = createLucideIcon("CowHead", bullHead as any);
import { VersionLabel } from "@/components/updates/VersionLabel";

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const { t } = useTranslation();

  const navigationItems = [
    { titleKey: "common.dashboard", url: "/dashboard", icon: Home },
    { titleKey: "animals.title", url: "/animals", icon: CowHead },
    { titleKey: "milk.title", url: "/milk/collect", icon: Milk },
    { titleKey: "reproduction.title", url: "/reproduction", icon: Heart },
    { titleKey: "dashboard.reports", url: "/reports", icon: FileText },
    { titleKey: "common.settings", url: "/settings", icon: Settings },
  ];
  const collapsed = state === "collapsed";


  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className={`flex items-center justify-center ${collapsed ? "py-2 px-2" : "py-1 px-2"}`}>
          <img
            src={collapsed ? "/logo.png" : "/logo.webp"}
            alt="LecheFácil"
            className={collapsed ? 'h-10 w-10 object-contain' : 'h-40 w-auto'}
          />
        </div>

        <SidebarGroup className={collapsed ? "mt-1" : "-mt-8"}>
          <SidebarGroupLabel>{t("common.dashboard")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      onClick={() => setOpenMobile(false)}
                      className={({ isActive }) =>
                        // Activo tonal + barra de marca: menos peso visual que
                        // un bloque sólido y consistente en claro y oscuro
                        `relative flex items-center gap-3 px-3 py-2.5 rounded-control font-medium transition-colors ${
                          isActive
                            ? 'bg-accent text-accent-foreground before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-full before:bg-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{t(item.titleKey)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-center px-3 py-2 border-t">
          <VersionLabel variant="small" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
