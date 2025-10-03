import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface Block {
  id?: string;
  name: string;
  total_days: number;
  manually_completed: boolean;
  order_index: number;
}

export default function EditarJejum() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fastName, setFastName] = useState("");
  const [totalDays, setTotalDays] = useState<number>(0);
  const [daysCompletedBefore, setDaysCompletedBefore] = useState<number>(0);
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    loadFast();
  }, [id]);

  const loadFast = async () => {
    if (!id) return;

    try {
      const { data: fast, error: fastError } = await supabase
        .from("fasts")
        .select("*")
        .eq("id", id)
        .single();

      if (fastError) throw fastError;

      setFastName(fast.name);
      setTotalDays(fast.total_days);
      setDaysCompletedBefore(fast.days_completed_before_app || 0);

      const { data: blocksData, error: blocksError } = await supabase
        .from("fast_blocks")
        .select("*")
        .eq("fast_id", id)
        .order("order_index");

      if (blocksError) throw blocksError;

      if (blocksData && blocksData.length > 0) {
        setBlocks(
          blocksData.map((block) => ({
            id: block.id,
            name: block.name,
            total_days: block.total_days,
            manually_completed: block.manually_completed || false,
            order_index: block.order_index,
          }))
        );
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar jejum",
        description: error.message,
      });
      navigate("/gerenciar");
    } finally {
      setLoading(false);
    }
  };

  const addBlock = () => {
    setBlocks([
      ...blocks,
      {
        name: "",
        total_days: 0,
        manually_completed: false,
        order_index: blocks.length,
      },
    ]);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const updateBlock = (index: number, field: keyof Block, value: any) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], [field]: value };
    setBlocks(newBlocks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!fastName.trim()) {
        throw new Error("Nome do jejum é obrigatório");
      }

      if (totalDays <= 0) {
        throw new Error("Total de dias deve ser maior que zero");
      }

      const totalBlockDays = blocks.reduce(
        (sum, block) => sum + Number(block.total_days || 0),
        0
      );

      if (blocks.length > 0 && totalBlockDays !== totalDays) {
        throw new Error(
          `A soma dos dias dos blocos (${totalBlockDays}) deve ser igual ao total de dias do jejum (${totalDays})`
        );
      }

      // Update fast
      const { error: fastError } = await supabase
        .from("fasts")
        .update({
          name: fastName.trim(),
          total_days: totalDays,
          days_completed_before_app: daysCompletedBefore,
        })
        .eq("id", id);

      if (fastError) throw fastError;

      // Delete existing blocks
      const { error: deleteError } = await supabase
        .from("fast_blocks")
        .delete()
        .eq("fast_id", id);

      if (deleteError) throw deleteError;

      // Insert new blocks if any
      if (blocks.length > 0) {
        const blocksToInsert = blocks.map((block, index) => ({
          fast_id: id,
          name: block.name.trim(),
          total_days: block.total_days,
          order_index: index,
          manually_completed: block.manually_completed,
        }));

        const { error: blocksError } = await supabase
          .from("fast_blocks")
          .insert(blocksToInsert);

        if (blocksError) throw blocksError;
      }

      toast({
        title: "Jejum atualizado!",
        description: "Suas alterações foram salvas com sucesso.",
      });

      navigate("/gerenciar");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar jejum",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-center text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Editar Jejum
            </h1>
            <p className="text-muted-foreground">
              Atualize as informações do seu jejum
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Nome do Jejum *</Label>
                <Input
                  id="name"
                  value={fastName}
                  onChange={(e) => setFastName(e.target.value)}
                  placeholder="Ex: Jejum Daniel, Jejum de 21 dias..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="totalDays">Total de Dias *</Label>
                <Input
                  id="totalDays"
                  type="number"
                  min="1"
                  value={totalDays || ""}
                  onChange={(e) => setTotalDays(Number(e.target.value))}
                  placeholder="Ex: 21"
                  required
                />
              </div>

              <div>
                <Label htmlFor="daysCompleted">
                  Dias já concluídos antes do app
                </Label>
                <Input
                  id="daysCompleted"
                  type="number"
                  min="0"
                  max={totalDays}
                  value={daysCompletedBefore || ""}
                  onChange={(e) => setDaysCompletedBefore(Number(e.target.value))}
                  placeholder="Ex: 5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Quantos dias você já completou antes de usar o app?
                </p>
              </div>
            </Card>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Blocos (Opcional)
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Divida seu jejum em etapas
                  </p>
                </div>
                <Button type="button" onClick={addBlock} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Bloco
                </Button>
              </div>

              <div className="space-y-4">
                {blocks.map((block, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-4">
                          <div>
                            <Label htmlFor={`block-name-${index}`}>
                              Nome do Bloco {index + 1}
                            </Label>
                            <Input
                              id={`block-name-${index}`}
                              value={block.name}
                              onChange={(e) =>
                                updateBlock(index, "name", e.target.value)
                              }
                              placeholder={`Ex: Fase ${index + 1}`}
                              required={blocks.length > 0}
                            />
                          </div>

                          <div>
                            <Label htmlFor={`block-days-${index}`}>
                              Quantidade de Dias
                            </Label>
                            <Input
                              id={`block-days-${index}`}
                              type="number"
                              min="1"
                              value={block.total_days || ""}
                              onChange={(e) =>
                                updateBlock(
                                  index,
                                  "total_days",
                                  Number(e.target.value)
                                )
                              }
                              placeholder="Ex: 7"
                              required={blocks.length > 0}
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`block-completed-${index}`}
                              checked={block.manually_completed}
                              onCheckedChange={(checked) =>
                                updateBlock(
                                  index,
                                  "manually_completed",
                                  checked
                                )
                              }
                            />
                            <Label
                              htmlFor={`block-completed-${index}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              Marcar este bloco como concluído
                            </Label>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBlock(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {blocks.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Total de dias nos blocos:{" "}
                    {blocks.reduce(
                      (sum, block) => sum + Number(block.total_days || 0),
                      0
                    )}{" "}
                    / {totalDays}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/gerenciar")}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
