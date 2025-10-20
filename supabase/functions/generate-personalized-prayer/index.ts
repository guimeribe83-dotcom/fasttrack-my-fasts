import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface PrayerRequest {
  purposeCategory: string;
  purposeDescription: string;
  fastName: string;
  totalDays: number;
}

const categoryVerses = {
  healing: "Jeremias 30:17, Salmos 103:2-3, Isaías 53:5",
  guidance: "Provérbios 3:5-6, Salmos 32:8, Tiago 1:5",
  gratitude: "1 Tessalonicenses 5:18, Salmos 100:4, Filipenses 4:6",
  intercession: "1 Timóteo 2:1-2, Tiago 5:16, João 17:9",
  deliverance: "Salmos 34:17, 2 Coríntios 10:4-5, João 8:36",
  breakthrough: "Marcos 11:24, Filipenses 4:13, Efésios 3:20",
  spiritual_growth: "2 Pedro 3:18, Filipenses 1:6, Colossenses 1:10",
  wisdom: "Tiago 1:5, Provérbios 2:6, 1 Coríntios 2:12",
  other: "Filipenses 4:6-7, Mateus 7:7, Salmos 37:4"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { purposeCategory, purposeDescription, fastName, totalDays }: PrayerRequest = await req.json();

    console.log("Generating prayer for:", { purposeCategory, fastName, totalDays });

    const systemPrompt = `Você é um conselheiro espiritual cristão especializado em criar orações personalizadas e profundas.

CONTEXTO:
- O usuário está iniciando um jejum de ${totalDays} dias chamado "${fastName}"
- Propósito: ${purposeCategory}
- Descrição pessoal: ${purposeDescription}

INSTRUÇÕES:
1. Crie uma oração PERSONALIZADA que:
   - Reflita exatamente o propósito descrito
   - Use linguagem respeitosa, profunda e tocante
   - Seja prática e aplicável durante o jejum
   - Tenha entre 200-300 palavras no total
   
2. Base a oração em:
   - Versículos bíblicos relevantes ao propósito: ${categoryVerses[purposeCategory as keyof typeof categoryVerses] || categoryVerses.other}
   - Princípios de fé cristã
   - Estrutura ACTS (Adoração, Confissão, Súplica, Gratidão)
   
3. Inclua:
   - Um versículo-chave com referência bíblica completa
   - Seções claras de 2-3 frases cada (adoração, confissão, súplica, gratidão)
   - Uma afirmação diária curta e impactante para meditação
   
4. TOM: Pessoal, íntimo, como se fosse uma conversa sincera com Deus. Use "eu" e "meu" para tornar pessoal.

IMPORTANTE: Retorne APENAS um JSON válido no seguinte formato (sem markdown, sem \`\`\`json):
{
  "title": "Título inspirador relacionado ao propósito (ex: Oração de Cura e Restauração)",
  "introduction": "Uma frase curta de apresentação (máx 15 palavras)",
  "prayer_text": "Oração completa e fluida de 200-300 palavras, começando com 'Pai Celestial' ou 'Senhor', escrita na primeira pessoa",
  "scripture_reference": "Livro Capítulo:Versículo (formato exato: '1 Coríntios 10:13')",
  "scripture_text": "Texto completo do versículo em português",
  "sections": [
    {"type": "adoration", "title": "Adoração", "content": "2-3 frases reconhecendo quem Deus é"},
    {"type": "confession", "title": "Confissão", "content": "2-3 frases de humildade e dependência"},
    {"type": "supplication", "title": "Súplica", "content": "2-3 frases pedindo especificamente sobre o propósito"},
    {"type": "thanksgiving", "title": "Gratidão", "content": "2-3 frases de agradecimento antecipado"}
  ],
  "daily_affirmation": "Uma frase curta e poderosa (máx 12 palavras) para repetir diariamente"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Crie uma oração personalizada para este jejum. Seja específico sobre: ${purposeDescription}` 
          }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API Error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limit", message: "Limite de requisições excedido. Tente novamente em alguns momentos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "payment_required", message: "Créditos insuficientes. Configure o pagamento em Settings -> Workspace -> Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log("Raw AI response:", generatedText);

    // Clean markdown if present
    let cleanedText = generatedText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/```\n?/, "").replace(/\n?```$/, "");
    }

    const prayerData = JSON.parse(cleanedText);

    console.log("Prayer generated successfully:", prayerData.title);

    return new Response(
      JSON.stringify({ prayerData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-personalized-prayer:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Erro ao gerar oração personalizada. Tente novamente."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
