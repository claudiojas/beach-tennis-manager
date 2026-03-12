import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import ArenaPanel from "./pages/ArenaPanel";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TournamentDetails from "./pages/admin/TournamentDetails";
import GlobalAthletes from "./pages/admin/GlobalAthletes";
import GlobalArenas from "./pages/admin/GlobalArenas";
import SponsorsManager from "./pages/admin/SponsorsManager";
import PublicView from "./pages/PublicView";
import NotFound from "./pages/NotFound";

import { seedService } from "./services/seedService";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const hasSeeded = localStorage.getItem("temp_seed_80_v5");
    if (!hasSeeded) {
      seedService.seedAthletes().then(() => {
        localStorage.setItem("temp_seed_80_v5", "true");
        console.log("✅ Database seeded with 300 athletes!");
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Rotas Protegidas do Admin */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/tournament/:id" element={<TournamentDetails />} />
              <Route path="/admin/athletes" element={<GlobalAthletes />} />
              <Route path="/admin/arenas" element={<GlobalArenas />} />
              <Route path="/admin/sponsors" element={<SponsorsManager />} />
            </Route>

            <Route path="/" element={<Index />} />


            <Route path="/arena" element={<ArenaPanel />} />
            <Route path="/torneio/:id" element={<PublicView />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
