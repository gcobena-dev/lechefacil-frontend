import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Milk } from "lucide-react";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  const location = useLocation();
  
  // Don't show layout on login page
  if (location.pathname === '/login') {
    return <Outlet />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          {/* Add bottom padding so content isn’t hidden behind BottomNav on mobile */}
          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <Outlet />
          </main>
        </div>
        {/* Floating Action Button for Mobile (hidden on pages with their own FAB) */}
        {!(location.pathname.startsWith('/animals')) && (
          <FloatingActionButton to="/milk/collect">
            <Milk className="h-6 w-6" />
          </FloatingActionButton>
        )}
        {/* Bottom Navigation for mobile */}
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
