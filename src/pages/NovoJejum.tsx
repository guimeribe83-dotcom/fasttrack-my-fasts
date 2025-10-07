import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Calendar, Layers } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocalFasts } from "@/hooks/useLocalFasts";

interface Block {
  id: string;
  name: string;
  totalDays: number;
  manuallyCompleted: boolean;
}

export default function NovoJejum() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [totalDays, setTotalDays] = useState("");
  const [startDate, setStartDate] = useState("");
  const [daysCompletedBefore, setDaysCompletedBefore] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const { createFast, createBlock, setActiveFast } = useLocalFasts();

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

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Create fast in local DB (works offline!)
      const fastId = await createFast({
        user_id: user.id,
        name,
        total_days: parseInt(totalDays),
        start_date: startDate,
        days_completed_before_app: parseInt(daysCompletedBefore || "0"),
        is_active: true
      });

      // Set as active (deactivates others)
      await setActiveFast(fastId);

      // Create blocks in local DB
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        await createBlock({
          fast_id: fastId,
          name: block.name,
          total_days: block.totalDays,
          order_index: i,
          manually_completed: block.manuallyCompleted
        });
      }

      toast({
        title: "Jejum criado!",
        description: navigator.onLine 
          ? "Seu jejum foi criado com sucesso."
          : "Jejum salvo offline. Será sincronizado quando voltar online.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar jejum",
        description: error.message,
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

              <div className="space-y-2">
                <Label htmlFor="daysCompletedBefore" className="text-sm font-medium">
                  Dias Já Concluídos (antes do app)
                </Label>
                <Input
                  id="daysCompletedBefore"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={daysCompletedBefore}
                  onChange={(e) => setDaysCompletedBefore(e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Se você já estava em jejum antes de usar o app, informe quantos dias já completou
                </p>
              </div>
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
      </div>
    </Layout>
  );
}