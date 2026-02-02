import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import RefereePanel from "./pages/RefereePanel";
import ArenaPanel from "./pages/ArenaPanel";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TournamentDetails from "./pages/admin/TournamentDetails";
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
            {/* Futuras rotas de admin aqui: /admin/atletas, /admin/quadras */}
          </Route>

          <Route path="/" element={<Index />} />
          <Route path="/arbitro" element={<RefereePanel />} />
          <Route path="/arena" element={<ArenaPanel />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
