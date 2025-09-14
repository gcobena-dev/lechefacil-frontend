import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Milk } from "lucide-react";

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
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
        {/* Floating Action Button for Mobile */}
        <FloatingActionButton to="/milk/collect">
          <Milk className="h-6 w-6" />
        </FloatingActionButton>
      </div>
    </SidebarProvider>
  );
}