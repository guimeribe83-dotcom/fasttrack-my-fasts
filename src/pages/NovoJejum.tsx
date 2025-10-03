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

      // Create fast
      const { data: fast, error: fastError } = await supabase
        .from("fasts")
        .insert({
          user_id: user.id,
          name,
          total_days: parseInt(totalDays),
          start_date: startDate,
          days_completed_before_app: parseInt(daysCompletedBefore || "0"),
          is_active: true,
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
      if (blocks.length > 0) {
        const blocksToInsert = blocks.map((block, index) => ({
          fast_id: fast.id,
          name: block.name,
          total_days: block.totalDays,
          order_index: index,
          manually_completed: block.manuallyCompleted,
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
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Criar Novo Jejum</h1>
          <p className="text-muted-foreground">Configure seu propósito espiritual</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Informações Básicas</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Jejum *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Jejum de Daniel, Jejum de 21 dias..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalDays">Total de Dias *</Label>
                  <Input
                    id="totalDays"
                    type="number"
                    min="1"
                    placeholder="21"
                    value={totalDays}
                    onChange={(e) => setTotalDays(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Data de Início *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="daysCompletedBefore">
                  Dias Já Concluídos (antes do app)
                </Label>
                <Input
                  id="daysCompletedBefore"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={daysCompletedBefore}
                  onChange={(e) => setDaysCompletedBefore(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Se você já estava em jejum antes de usar o app, informe quantos dias já completou
                </p>
              </div>
            </div>
          </Card>

          {/* Blocks */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Layers className="w-5 h-5 text-success" />
              <h2 className="text-xl font-semibold text-foreground">Blocos (Opcional)</h2>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Divida seu jejum em etapas para acompanhar melhor seu progresso
            </p>

            <div className="space-y-4">
              {blocks.map((block, index) => (
                <Card key={block.id} className="p-4 bg-muted/30">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder="Nome do bloco (ex: Arroz, Carne...)"
                          value={block.name}
                          onChange={(e) => updateBlock(block.id, "name", e.target.value)}
                        />
                        <Input
                          type="number"
                          min="1"
                          placeholder="Quantidade de dias"
                          value={block.totalDays || ""}
                          onChange={(e) =>
                            updateBlock(block.id, "totalDays", parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBlock(block.id)}
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
                      <Label htmlFor={`completed-${block.id}`} className="text-sm cursor-pointer">
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
                className="w-full"
              >
                <Plus className="mr-2 w-4 h-4" />
                Adicionar Bloco
              </Button>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/gerenciar")}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-primary"
            >
              {loading ? "Criando..." : "Iniciar Jejum →"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}