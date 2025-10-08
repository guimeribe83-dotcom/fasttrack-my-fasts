import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Flame, Sparkles, Heart } from "lucide-react";

interface FastTemplate {
  name: string;
  description: string;
  totalDays: number;
  blocks: Array<{ name: string; days: number }>;
  icon: any;
  color: string;
}

const templates: FastTemplate[] = [
  {
    name: "Jejum de 21 Dias",
    description: "Jejum clássico de 21 dias, dividido em 3 blocos de 7 dias cada",
    totalDays: 21,
    blocks: [
      { name: "Primeira Semana", days: 7 },
      { name: "Segunda Semana", days: 7 },
      { name: "Terceira Semana", days: 7 }
    ],
    icon: Flame,
    color: "text-orange-500"
  },
  {
    name: "Jejum de Daniel (21 dias)",
    description: "Jejum parcial focado em alimentação saudável",
    totalDays: 21,
    blocks: [
      { name: "Adaptação", days: 3 },
      { name: "Fortalecimento", days: 10 },
      { name: "Conclusão", days: 8 }
    ],
    icon: Heart,
    color: "text-green-500"
  },
  {
    name: "Jejum de 40 Dias",
    description: "Jejum intenso de 40 dias, inspirado no jejum de Jesus",
    totalDays: 40,
    blocks: [
      { name: "1ª Semana", days: 7 },
      { name: "2ª Semana", days: 7 },
      { name: "3ª Semana", days: 7 },
      { name: "4ª Semana", days: 7 },
      { name: "Reta Final", days: 12 }
    ],
    icon: Sparkles,
    color: "text-purple-500"
  },
  {
    name: "Jejum Semanal",
    description: "Jejum de 7 dias para iniciantes",
    totalDays: 7,
    blocks: [
      { name: "Jejum Completo", days: 7 }
    ],
    icon: Clock,
    color: "text-blue-500"
  }
];

interface FastTemplatesProps {
  onSelect: (template: FastTemplate) => void;
}

export const FastTemplates = ({ onSelect }: FastTemplatesProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Templates Prontos</h3>
        <p className="text-sm text-muted-foreground">
          Escolha um modelo para começar rapidamente
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <Card 
              key={template.name}
              className="hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => onSelect(template)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${template.color}`} />
                      {template.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {template.totalDays} dias · {template.blocks.length} blocos
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                  >
                    Usar Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
