import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellOff, Smartphone, Globe, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Subscription {
  id: string;
  device_type: string;
  created_at: string;
  subscription: any;
}

export default function Notificacoes() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const { toast } = useToast();
  const { permission, requestPermission, isSupported } = usePushNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    loadSubscriptions();
  };

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error: any) {
      console.error('Error loading subscriptions:', error);
      toast({
        title: "Erro ao carregar dispositivos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: "Notificações ativadas! 🔔",
        description: "Você receberá notificações de conquistas e lembretes."
      });
      loadSubscriptions();
    } else {
      toast({
        title: "Permissão negada",
        description: "Você pode ativar notificações nas configurações do navegador.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Dispositivo removido",
        description: "Este dispositivo não receberá mais notificações."
      });
      loadSubscriptions();
    } catch (error: any) {
      toast({
        title: "Erro ao remover dispositivo",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTestNotification = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.functions.invoke('send-push-notification', {
        body: {
          title: "🎉 Notificação de Teste",
          body: "Suas notificações estão funcionando perfeitamente!",
          icon: '/icon-512x512.png',
          url: '/'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      toast({
        title: "Notificação enviada!",
        description: "Verifique se recebeu a notificação."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar notificação",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notificações Push</h1>
          <p className="text-muted-foreground">
            Configure e gerencie suas notificações de conquistas e lembretes
          </p>
        </div>

        {/* Permission Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {permission === 'granted' ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              Status de Notificações
            </CardTitle>
            <CardDescription>
              {!isSupported && "Notificações não suportadas neste navegador"}
              {isSupported && permission === 'default' && "Você ainda não concedeu permissão"}
              {permission === 'denied' && "Permissão negada - ative nas configurações do navegador"}
              {permission === 'granted' && "Notificações ativadas e funcionando"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {permission === 'default' && isSupported && (
              <Button onClick={handleRequestPermission} className="w-full">
                <Bell className="mr-2 h-4 w-4" />
                Ativar Notificações
              </Button>
            )}
            
            {permission === 'granted' && (
              <div className="space-y-3">
                <Button onClick={handleTestNotification} variant="outline" className="w-full">
                  Enviar Notificação de Teste
                </Button>
              </div>
            )}

            {permission === 'denied' && (
              <div className="bg-destructive/10 p-4 rounded-lg">
                <p className="text-sm">
                  As notificações foram bloqueadas. Para ativá-las:
                </p>
                <ol className="list-decimal list-inside text-sm mt-2 space-y-1">
                  <li>Clique no ícone de cadeado na barra de endereço</li>
                  <li>Procure por "Notificações"</li>
                  <li>Altere para "Permitir"</li>
                  <li>Recarregue a página</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registered Devices */}
        {subscriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Dispositivos Registrados</CardTitle>
              <CardDescription>
                Dispositivos que receberão notificações push
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {sub.device_type === 'web' ? (
                        <Globe className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">
                          {sub.device_type === 'web' ? 'Navegador Web' : 'Dispositivo Móvel'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Registrado em {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSubscription(sub.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Sobre Notificações Push</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Receba notificações quando desbloquear novas conquistas</p>
            <p>• Seja notificado sobre sua sequência diária</p>
            <p>• Configure lembretes personalizados na página de Lembretes</p>
            <p>• As notificações funcionam mesmo quando o app está fechado</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
