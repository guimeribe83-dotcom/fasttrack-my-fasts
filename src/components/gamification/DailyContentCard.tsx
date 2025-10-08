import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Heart, Lightbulb, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DailyContent {
  verse_reference: string;
  verse_text: string;
  motivation: string;
  health_tip: string;
  reflection: string;
}

export const DailyContentCard = () => {
  const [content, setContent] = useState<DailyContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyContent();
  }, []);

  const loadDailyContent = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("daily_content")
        .select("*")
        .eq("date", today)
        .maybeSingle();

      if (error) throw error;
      setContent(data);
    } catch (error) {
      console.error("Error loading daily content:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!content) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Conteúdo diário não disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Conteúdo do Dia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="verse" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="verse" className="text-xs">
              <BookOpen className="w-4 h-4 mr-1" />
              Versículo
            </TabsTrigger>
            <TabsTrigger value="motivation" className="text-xs">
              <Heart className="w-4 h-4 mr-1" />
              Motivação
            </TabsTrigger>
            <TabsTrigger value="tip" className="text-xs">
              <Lightbulb className="w-4 h-4 mr-1" />
              Dica
            </TabsTrigger>
            <TabsTrigger value="reflection" className="text-xs">
              <MessageCircle className="w-4 h-4 mr-1" />
              Reflexão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verse" className="space-y-2 mt-4">
            <p className="text-sm font-semibold text-primary">{content.verse_reference}</p>
            <p className="text-sm italic leading-relaxed">{content.verse_text}</p>
          </TabsContent>

          <TabsContent value="motivation" className="mt-4">
            <p className="text-sm leading-relaxed">{content.motivation}</p>
          </TabsContent>

          <TabsContent value="tip" className="mt-4">
            <p className="text-sm leading-relaxed">{content.health_tip}</p>
          </TabsContent>

          <TabsContent value="reflection" className="mt-4">
            <p className="text-sm leading-relaxed">{content.reflection}</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
