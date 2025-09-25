import { NavLink } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  DollarSign,
  FileText,
  Plus,
  User,
  Beef
} from "lucide-react";


export function AppSidebar() {
  const { state } = useSidebar();
  const { t } = useTranslation();

  const navigationItems = [
    { titleKey: "common.dashboard", url: "/dashboard", icon: LayoutDashboard },
    { titleKey: "animals.title", url: "/animals", icon: Beef },
    { titleKey: "milk.title", url: "/milk/collect", icon: Plus },
    { titleKey: "milk.milkPricesTitle", url: "/milk/prices", icon: DollarSign },
    { titleKey: "dashboard.reports", url: "/reports", icon: FileText },
    { titleKey: "common.profile", url: "/profile", icon: User },
  ];
  const collapsed = state === "collapsed";


  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <h2 className={`font-bold text-primary ${collapsed ? 'text-xs text-center' : 'text-lg'}`}>
{collapsed ? 'FL' : t("auth.loginTitle")}
          </h2>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>{t("common.dashboard")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground'
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
    </Sidebar>
  );
}