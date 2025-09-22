import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Login from "./pages/Login";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Animals from "./pages/Animals";
import AnimalDetail from "./pages/AnimalDetail";
import AnimalForm from "./pages/AnimalForm";
import MilkCollect from "./pages/MilkCollect";
import MilkPrices from "./pages/MilkPrices";
import MilkPriceForm from "./pages/MilkPriceForm";
import Health from "./pages/Health";
import HealthEventForm from "./pages/HealthEventForm";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import RequestAccess from "./pages/RequestAccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="animals" element={<Animals />} />
            <Route path="animals/new" element={<AnimalForm />} />
            <Route path="animals/:id" element={<AnimalDetail />} />
            <Route path="animals/:id/edit" element={<AnimalForm />} />
            <Route path="milk/collect" element={<MilkCollect />} />
            <Route path="milk/prices" element={<MilkPrices />} />
            <Route path="milk/prices/new" element={<MilkPriceForm />} />
            <Route path="health" element={<Health />} />
            <Route path="health/new" element={<HealthEventForm />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/request-access" element={<RequestAccess />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
