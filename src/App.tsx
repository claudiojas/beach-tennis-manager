import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import RefereeLogin from "./pages/referee/RefereeLogin";
import RefereeDashboard from "./pages/referee/RefereeDashboard";
import { RefereeRoute } from "./routes/RefereeRoute";
import ArenaPanel from "./pages/ArenaPanel";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TournamentDetails from "./pages/admin/TournamentDetails";
import GlobalAthletes from "./pages/admin/GlobalAthletes";
import GlobalArenas from "./pages/admin/GlobalArenas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
          </Route>

          <Route path="/" element={<Index />} />

          {/* Rotas de Arbitragem */}
          <Route path="/arbitro" element={<RefereeLogin />} />
          <Route element={<RefereeRoute />}>
            <Route path="/arbitro/painel" element={<RefereeDashboard />} />
          </Route>

          <Route path="/arena" element={<ArenaPanel />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
