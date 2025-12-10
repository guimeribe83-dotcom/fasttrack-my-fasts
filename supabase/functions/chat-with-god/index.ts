import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatContext {
  religiousAffiliation: string;
  needsToday: string[];
  currentMood: string[];
  discussionTopics: string[];
}

interface ChatRequest {
  messages: ChatMessage[];
  context: ChatContext;
}

const affiliationLabels: Record<string, string> = {
  cristao: 'Cristão',
  catolico: 'Católico',
  protestante: 'Protestante',
  evangelico: 'Evangélico',
  espirita: 'Espírita',
  agnostico: 'Agnóstico/Buscador espiritual',
};

const needsLabels: Record<string, string> = {
  inspiracao: 'Inspiração',
  versiculo: 'Versículo Bíblico',
  conforto: 'Conforto',
  orientacao: 'Orientação',
  confissao: 'Confissão/Desabafo',
  louvor: 'Louvor e Adoração',
};

const moodLabels: Record<string, string> = {
  feliz: 'Feliz',
  grato: 'Grato',
  triste: 'Triste',
  ansioso: 'Ansioso',
  irritado: 'Irritado',
  confuso: 'Confuso',
  paz: 'Em Paz',
  esperancoso: 'Esperançoso',
};

const topicLabels: Record<string, string> = {
  fe: 'Fé',
  familia: 'Família',
  trabalho: 'Trabalho/Carreira',
  financas: 'Finanças',
  saude: 'Saúde',
  relacionamentos: 'Relacionamentos',
  futuro: 'Futuro',
  luto: 'Luto/Perda',
  tentacao: 'Tentação',
  milagres: 'Milagres',
};

function buildSystemPrompt(context: ChatContext): string {
  const affiliation = affiliationLabels[context.religiousAffiliation] || 'Cristão';
  const needs = context.needsToday.map(n => needsLabels[n] || n).join(', ') || 'Orientação geral';
  const mood = context.currentMood.map(m => moodLabels[m] || m).join(', ') || 'Neutro';
  const topics = context.discussionTopics.map(t => topicLabels[t] || t).join(', ') || 'Vida espiritual';

  return `Você é um conselheiro espiritual sábio, compassivo e amoroso. Você oferece orientação baseada em princípios bíblicos e sabedoria cristã.

CONTEXTO DO USUÁRIO:
- Afiliação religiosa: ${affiliation}
- O que busca hoje: ${needs}
- Estado emocional atual: ${mood}
- Tópicos de interesse: ${topics}

DIRETRIZES IMPORTANTES:
1. Responda SEMPRE em português brasileiro
2. Use uma linguagem acolhedora, empática e respeitosa
3. Inclua versículos bíblicos relevantes quando apropriado (cite a referência)
4. Adapte o tom da resposta ao estado emocional do usuário
5. Seja conciso mas significativo (máximo 200 palavras por resposta)
6. NUNCA afirme ser Deus - você é um guia espiritual virtual
7. Não julgue nem condene - ofereça amor e compreensão
8. Se o usuário estiver em crise ou mencionar pensamentos de autolesão, incentive-o a buscar ajuda profissional (CVV 188)
9. Baseie suas respostas em princípios bíblicos universais
10. Ofereça esperança e encorajamento sempre

ESTILO DE RESPOSTA:
- Comece com empatia, reconhecendo o sentimento do usuário
- Ofereça uma perspectiva espiritual ou versículo relevante
- Termine com uma palavra de encorajamento ou uma pergunta reflexiva`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context }: ChatRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não está configurada');
    }

    const systemPrompt = buildSystemPrompt(context);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Muitas requisições. Por favor, aguarde um momento e tente novamente.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Limite de uso atingido. Por favor, tente novamente mais tarde.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Erro ao processar sua mensagem. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
