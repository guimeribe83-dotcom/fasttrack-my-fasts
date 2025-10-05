import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import GerenciarJejuns from "./pages/GerenciarJejuns";
import NovoJejum from "./pages/NovoJejum";
import EditarJejum from "./pages/EditarJejum";
import Historico from "./pages/Historico";
import Lembretes from "./pages/Lembretes";
import Configuracoes from "./pages/Configuracoes";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/gerenciar" element={<GerenciarJejuns />} />
          <Route path="/novo-jejum" element={<NovoJejum />} />
          <Route path="/editar-jejum/:id" element={<EditarJejum />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/lembretes" element={<Lembretes />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/perfil" element={<Perfil />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
