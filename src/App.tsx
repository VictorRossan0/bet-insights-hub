import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Jogos from "@/pages/Jogos";
import Times from "@/pages/Times";
import Historico from "@/pages/Historico";
import Confronto from "@/pages/Confronto";
import Apostas from "@/pages/Apostas";
import TimePerfil from "@/pages/TimePerfil";
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
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jogos" element={<Jogos />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/times" element={<Times />} />
            <Route path="/times/:id" element={<TimePerfil />} />
            <Route path="/confronto" element={<Confronto />} />
            {/* <Route path="/apostas" element={<Apostas />} /> */}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
