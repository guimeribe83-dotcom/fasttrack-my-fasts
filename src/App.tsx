import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import GerenciarJejuns from "./pages/GerenciarJejuns";
import NovoJejum from "./pages/NovoJejum";
import EditarJejum from "./pages/EditarJejum";
import Historico from "./pages/Historico";
import Lembretes from "./pages/Lembretes";
import Notificacoes from "./pages/Notificacoes";
import Configuracoes from "./pages/Configuracoes";
import Perfil from "./pages/Perfil";
import DiarioEspiritual from "./pages/DiarioEspiritual";
import Biblia from "./pages/Biblia";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { setTheme } = useTheme();

  useEffect(() => {
    const loadUserTheme = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("theme_preference")
          .eq("id", session.user.id)
          .single();
        
        if (profile?.theme_preference) {
          setTheme(profile.theme_preference);
        }
      }
    };

    loadUserTheme();
  }, [setTheme]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/gerenciar" element={<GerenciarJejuns />} />
      <Route path="/novo-jejum" element={<NovoJejum />} />
      <Route path="/editar-jejum/:id" element={<EditarJejum />} />
      <Route path="/historico" element={<Historico />} />
      <Route path="/lembretes" element={<Lembretes />} />
      <Route path="/notificacoes" element={<Notificacoes />} />
      <Route path="/configuracoes" element={<Configuracoes />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/diario" element={<DiarioEspiritual />} />
      <Route path="/biblia" element={<Biblia />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <BrowserRouter>
          <AppContent />
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
