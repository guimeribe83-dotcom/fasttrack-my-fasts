import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { FastTemplates } from "@/components/onboarding/FastTemplates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Calendar, Layers, CheckCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { useBackgroundSync } from "@/hooks/useBackgroundSync";
import { Separator } from "@/components/ui/separator";

interface Block {
  id: string;
  name: string;
  totalDays: number;
  manuallyCompleted: boolean;
}

export default function NovoJejum() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [name, setName] = useState("");
  const [totalDays, setTotalDays] = useState("");
  const [startDate, setStartDate] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Calculate days completed automatically based on start date
  const calculateDaysCompleted = (startDateStr: string): number => {
    if (!startDateStr) return 0;
    const start = new Date(startDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    
    if (start > today) return 0; // Future date
    
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateEndDate = (startDateStr: string, totalDays: number): Date | null => {
    if (!startDateStr || !totalDays) return null;
    const start = new Date(startDateStr);
    const end = new Date(start);
    end.setDate(end.getDate() + totalDays);
    return end;
  };

  const daysCompletedAuto = calculateDaysCompleted(startDate);
  const endDate = calculateEndDate(startDate, parseInt(totalDays) || 0);
  const { queueCreateFast, processQueue } = useOfflineQueue();
  const { registerSync } = useBackgroundSync();

  const handleTemplateSelect = (template: any) => {
    setName(template.name);
    setTotalDays(template.totalDays.toString());
    setBlocks(
      template.blocks.map((block: any, index: number) => ({
        id: Date.now().toString() + index,
        name: block.name,
        totalDays: block.days,
        manuallyCompleted: false
      }))
    );
    setShowTemplates(false);
    toast({
      title: "Template Carregado! ✨",
      description: "Você pode personalizar os campos antes de criar.",
    });
  };

  const addBlock = () => {
    setBlocks([
      ...blocks,
      { id: Date.now().toString(), name: "", totalDays: 0, manuallyCompleted: false },
    ]);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const updateBlock = (id: string, field: keyof Block, value: any) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !totalDays || !startDate) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    const payload = {
      name,
      total_days: parseInt(totalDays),
      start_date: startDate,
      days_completed_before_app: daysCompletedAuto,
      is_active: true,
      blocks: blocks.map((block, index) => ({
        name: block.name,
        total_days: block.totalDays,
        order_index: index,
        manually_completed: block.manuallyCompleted,
      })),
    };

    // If offline, queue and exit early
    if (!navigator.onLine) {
      queueCreateFast(payload);
      // Try to register background sync so it can process later
      // @ts-ignore - sync not in TS types
      registerSync && (await registerSync('sync-fasts'));
      toast({
        title: "Salvo offline",
        description: "O jejum foi salvo e será sincronizado quando voltar a ficar online.",
      });
      // Attempt to process queue if we got back online quickly
      await processQueue();
      navigate("/");
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Create fast
      const { data: fast, error: fastError } = await supabase
        .from("fasts")
        .insert({
          user_id: user.id,
          name: payload.name,
          total_days: payload.total_days,
          start_date: payload.start_date,
          days_completed_before_app: payload.days_completed_before_app,
          is_active: payload.is_active,
        })
        .select()
        .single();

      if (fastError) throw fastError;

      // Deactivate other fasts
      await supabase
        .from("fasts")
        .update({ is_active: false })
        .neq("id", fast.id);

      // Create blocks
      if (payload.blocks.length > 0) {
        const blocksToInsert = payload.blocks.map((b, index) => ({
          fast_id: fast.id,
          name: b.name,
          total_days: b.total_days,
          order_index: index,
          manually_completed: b.manually_completed,
        }));

        const { error: blocksError } = await supabase
          .from("fast_blocks")
          .insert(blocksToInsert);

        if (blocksError) throw blocksError;
      }

      toast({
        title: "Jejum criado!",
        description: "Seu jejum foi criado com sucesso.",
      });

      navigate("/");
    } catch (error: any) {
      // If it's a network error, queue for later
      const message = error?.message || '';
      if (!navigator.onLine || /Failed to fetch|NetworkError|TypeError/.test(message)) {
        queueCreateFast(payload);
        // @ts-ignore
        registerSync && (await registerSync('sync-fasts'));
        toast({
          title: "Salvo offline",
          description: "O jejum foi salvo e será sincronizado quando voltar a ficar online.",
        });
        await processQueue();
        navigate("/");
        return;
      }

      toast({
        variant: "destructive",
        title: "Erro ao criar jejum",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Criar Novo Jejum</h1>
          <p className="text-sm md:text-base text-muted-foreground">Configure seu propósito espiritual</p>
        </div>

        {showTemplates && (
          <div className="mb-8">
            <FastTemplates onSelect={handleTemplateSelect} />
            <div className="flex items-center gap-4 my-6">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">ou crie do zero</span>
              <Separator className="flex-1" />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTemplates(false)}
              className="w-full"
            >
              Criar Jejum Personalizado
            </Button>
          </div>
        )}

        {!showTemplates && (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowTemplates(true)}
              className="mb-4"
            >
              ← Ver Templates
            </Button>
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="p-4 md:p-6 border-2">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-foreground">Informações Básicas</h2>
            </div>

            <div className="space-y-4 md:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nome do Jejum *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Jejum de Daniel, Jejum de 21 dias..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalDays" className="text-sm font-medium">Total de Dias *</Label>
                  <Input
                    id="totalDays"
                    type="number"
                    min="1"
                    placeholder="21"
                    value={totalDays}
                    onChange={(e) => setTotalDays(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-medium">Data de Início *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              </div>

              {/* Preview of end date and auto-calculated days */}
              {startDate && totalDays && (
                <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        Término previsto
                      </span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {endDate?.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  {daysCompletedAuto > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-xs text-muted-foreground">
                        {daysCompletedAuto} {daysCompletedAuto === 1 ? 'dia já completado' : 'dias já completados'} desde o início
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Blocks */}
          <Card className="p-4 md:p-6 border-2">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Layers className="w-4 h-4 md:w-5 md:h-5 text-success" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-foreground">Blocos</h2>
                <p className="text-xs text-muted-foreground">Opcional</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 md:mb-6">
              Divida seu jejum em etapas para acompanhar melhor seu progresso
            </p>

            <div className="space-y-3">
              {blocks.map((block, index) => (
                <Card key={block.id} className="p-4 bg-muted/50 border-muted-foreground/20">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder="Nome do bloco (ex: Arroz, Carne...)"
                          value={block.name}
                          onChange={(e) => updateBlock(block.id, "name", e.target.value)}
                          className="h-10"
                        />
                        <Input
                          type="number"
                          min="1"
                          placeholder="Quantidade de dias"
                          value={block.totalDays || ""}
                          onChange={(e) =>
                            updateBlock(block.id, "totalDays", parseInt(e.target.value) || 0)
                          }
                          className="h-10"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBlock(block.id)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`completed-${block.id}`}
                        checked={block.manuallyCompleted}
                        onCheckedChange={(checked) =>
                          updateBlock(block.id, "manuallyCompleted", checked)
                        }
                      />
                      <Label htmlFor={`completed-${block.id}`} className="text-sm cursor-pointer text-muted-foreground">
                        Marcar como já concluído
                      </Label>
                    </div>
                  </div>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addBlock}
                className="w-full h-11 border-dashed"
              >
                <Plus className="mr-2 w-4 h-4" />
                Adicionar Bloco
              </Button>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/gerenciar")}
              className="flex-1 h-11"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 bg-gradient-primary hover:opacity-90"
            >
              {loading ? "Criando..." : "Iniciar Jejum →"}
            </Button>
          </div>
        </form>
        </>
        )}
      </div>
    </Layout>
  );
}