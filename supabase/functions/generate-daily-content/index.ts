import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY não configurada');
    }

    console.log('Iniciando geração de conteúdo diário...');

    // Temas rotativos para variedade
    const temas = [
      'perseverança e força espiritual',
      'fé e confiança em Deus',
      'gratidão e louvor',
      'renovação e transformação',
      'comunhão e oração',
      'sacrifício e dedicação',
      'esperança e promessas divinas'
    ];
    
    const hoje = new Date();
    const temaIndex = hoje.getDay();
    const temaDodia = temas[temaIndex];

    // Prompt otimizado para DeepSeek
    const prompt = `Você é um assistente espiritual cristão brasileiro especializado em jejum e oração.

Gere conteúdo motivacional diário para um aplicativo de jejum cristão.

CONTEXTO: Usuários brasileiros em jornada de jejum espiritual
TEMA DO DIA: ${temaDodia}
TOM: Acolhedor, encorajador, espiritual, simples

IMPORTANTE:
- Use português brasileiro natural
- Versículos da Bíblia em português (tradução NVI ou ARC)
- Evite clichês religiosos
- Seja prático e aplicável

Gere EXATAMENTE neste formato JSON (sem formatação markdown):
{
  "verse_reference": "Referência bíblica completa (ex: Mateus 6:16-18)",
  "verse_text": "Texto completo do versículo em português",
  "motivation": "Frase motivacional curta e impactante (máximo 2 linhas)",
  "health_tip": "Dica prática de saúde sobre jejum - hidratação, alimentação, descanso (1-2 linhas)",
  "reflection": "Reflexão espiritual para meditação do dia (2-3 linhas)"
}`;

    // Chamar API DeepSeek
    console.log('Chamando API DeepSeek...');
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um assistente espiritual cristão que gera conteúdo motivacional em português brasileiro. Sempre responda apenas com JSON válido, sem formatação markdown.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('Erro DeepSeek API:', deepseekResponse.status, errorText);
      throw new Error(`DeepSeek API error: ${deepseekResponse.status}`);
    }

    const deepseekData = await deepseekResponse.json();
    console.log('Resposta recebida da DeepSeek');

    let conteudo = deepseekData.choices[0].message.content;
    
    // Remover markdown se presente
    conteudo = conteudo.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const contentData = JSON.parse(conteudo);

    // Validar dados
    if (!contentData.verse_reference || !contentData.verse_text || 
        !contentData.motivation || !contentData.health_tip || !contentData.reflection) {
      throw new Error('Formato de conteúdo inválido gerado pela IA');
    }

    // Salvar no banco
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    const dataParaGerar = new Date();
    dataParaGerar.setDate(dataParaGerar.getDate() + 1); // Gerar para amanhã
    const dataFormatada = dataParaGerar.toISOString().split('T')[0];

    console.log(`Salvando conteúdo para ${dataFormatada}...`);

    const { data, error } = await supabase
      .from('daily_content')
      .upsert({
        date: dataFormatada,
        verse_reference: contentData.verse_reference,
        verse_text: contentData.verse_text,
        motivation: contentData.motivation,
        health_tip: contentData.health_tip,
        reflection: contentData.reflection,
      }, {
        onConflict: 'date'
      })
      .select();

    if (error) {
      console.error('Erro ao salvar no banco:', error);
      throw error;
    }

    console.log('Conteúdo salvo com sucesso!', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        date: dataFormatada,
        content: contentData,
        message: 'Conteúdo diário gerado com sucesso!' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro na geração de conteúdo:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
