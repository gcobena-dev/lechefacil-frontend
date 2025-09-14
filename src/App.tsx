import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Animals from "./pages/Animals";
import AnimalDetail from "./pages/AnimalDetail";
import MilkCollect from "./pages/MilkCollect";
import MilkPrices from "./pages/MilkPrices";
import Health from "./pages/Health";
import Reports from "./pages/Reports";
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
            <Route path="animals/:id" element={<AnimalDetail />} />
            <Route path="milk/collect" element={<MilkCollect />} />
            <Route path="milk/prices" element={<MilkPrices />} />
            <Route path="health" element={<Health />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
