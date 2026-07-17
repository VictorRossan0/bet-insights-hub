import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { LigaProvider } from "@/contexts/LigaContext";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Jogos from "@/pages/Jogos";
import Times from "@/pages/Times";
import Historico from "@/pages/Historico";
import Confronto from "@/pages/Confronto";
import TimePerfil from "@/pages/TimePerfil";
import Auth from "@/pages/Auth";
import Admin from "@/pages/Admin";
import Backtesting from "@/pages/Backtesting";
import Health from "@/pages/Health";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LigaProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/health" element={<Health />} />
              <Route path="/" element={<Navigate to="/bra.1" replace />} />

              <Route path="/admin" element={<Layout showLigaNav={false} />}>
                <Route index element={<Admin />} />
              </Route>

              <Route path="/:ligaSlug" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="jogos" element={<Jogos />} />
                <Route path="historico" element={<Historico />} />
                <Route path="times" element={<Times />} />
                <Route path="times/:id" element={<TimePerfil />} />
                <Route path="confronto" element={<Confronto />} />
                <Route path="backtesting" element={<Backtesting />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </LigaProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
