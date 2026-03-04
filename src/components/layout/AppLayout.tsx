import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Milk, UserCircle } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { useQuery } from "@tanstack/react-query";
import { me as apiMe } from "@/services/auth";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PROFILE_PROMPT_KEY = "lf_profile_prompt_dismissed";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: apiMe });

  useEffect(() => {
    if (!meData) return;
    const dismissed = localStorage.getItem(PROFILE_PROMPT_KEY);
    if (!dismissed && !meData.first_name && !meData.last_name) {
      const timer = setTimeout(() => setShowProfilePrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [meData]);

  const dismissPrompt = () => {
    localStorage.setItem(PROFILE_PROMPT_KEY, "1");
    setShowProfilePrompt(false);
  };

  const goToProfile = () => {
    dismissPrompt();
    navigate("/account");
  };

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
          {/* Add bottom padding so content isn't hidden behind BottomNav on mobile */}
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

      {/* Profile completion prompt */}
      <Dialog open={showProfilePrompt} onOpenChange={(open) => { if (!open) dismissPrompt(); }}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <UserCircle className="h-12 w-12 text-primary" />
            </div>
            <DialogTitle className="text-center">
              {t("common.completeProfileTitle")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("common.completeProfileMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={dismissPrompt} className="w-full sm:w-auto">
              {t("common.later")}
            </Button>
            <Button onClick={goToProfile} className="w-full sm:w-auto">
              {t("common.goToProfile")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
