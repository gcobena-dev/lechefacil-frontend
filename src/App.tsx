import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/hooks/useTheme.tsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { RequireAuth } from "./components/auth/RequireAuth";
import { RequirePasswordChange } from "./components/auth/RequirePasswordChange";
import { RequireTenant } from "./components/auth/RequireTenant";
// Auth pages
import Login from "./pages/auth/Login";
import SignIn from "./pages/auth/SignIn";
import RequestAccess from "./pages/auth/RequestAccess";
import SelectFarm from "./pages/auth/SelectFarm";
import NoAccess from "./pages/auth/NoAccess";
import ChangePassword from "./pages/auth/ChangePassword";

// Dashboard pages
import Dashboard from "./pages/dashboard/Dashboard";
import Reports from "./pages/dashboard/Reports";

// Animal pages
import Animals from "./pages/animals/Animals";
import AnimalDetail from "./pages/animals/AnimalDetail";
import AnimalForm from "./pages/animals/AnimalForm";

// Milk pages
import MilkCollect from "./pages/milk/MilkCollect";
import MilkPrices from "./pages/milk/MilkPrices";
import MilkPriceForm from "./pages/milk/MilkPriceForm";
import BuyerForm from "./pages/milk/BuyerForm";

// Health pages
import Health from "./pages/health/Health";
import HealthEventForm from "./pages/health/HealthEventForm";

// Settings pages
import Profile from "./pages/settings/Profile";
import Settings from "./pages/settings/Settings";

// Other pages
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="lechefacil-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<RequireAuth><RequireTenant><RequirePasswordChange><AppLayout /></RequirePasswordChange></RequireTenant></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="animals" element={<Animals />} />
            <Route path="animals/new" element={<AnimalForm />} />
            <Route path="animals/:id" element={<AnimalDetail />} />
            <Route path="animals/:id/edit" element={<AnimalForm />} />
            <Route path="milk/collect" element={<MilkCollect />} />
            <Route path="milk/prices" element={<MilkPrices />} />
            <Route path="milk/prices/new" element={<MilkPriceForm />} />
            <Route path="buyers/new" element={<BuyerForm />} />
            <Route path="health" element={<Health />} />
            <Route path="health/new" element={<HealthEventForm />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/request-access" element={<RequestAccess />} />
          <Route path="/select-farm" element={<SelectFarm />} />
          <Route path="/force-change-password" element={<ChangePassword />} />
          <Route path="/no-access" element={<NoAccess />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
