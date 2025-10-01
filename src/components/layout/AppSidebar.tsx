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
  const { state, setOpenMobile } = useSidebar();
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