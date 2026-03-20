import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY não configurada");

    const { stats, recentGames, lastRoundStats } = await req.json();

    const systemPrompt = `Você é um analista de apostas esportivas especializado no Campeonato Brasileiro.
Analise os dados estatísticos fornecidos e gere de 3 a 5 sugestões de apostas para a próxima rodada.

Para cada sugestão, retorne um JSON array com objetos contendo:
- mercado: nome do mercado (ex: "Over 2.5 Gols - Flamengo x Palmeiras")
- tipo_aposta: tipo (ex: "over_gols", "under_gols", "escanteios_over", "cartoes_under")
- descricao: análise detalhada explicando o racional (2-3 frases)
- confianca: número de 50 a 95 representando % de confiança
- odd_sugerida: odd estimada (ex: 1.85)

Retorne APENAS o JSON array, sem markdown, sem texto extra.`;

    const userPrompt = `Dados acumulados do campeonato:
${JSON.stringify(stats, null, 2)}

Últimos 20 jogos:
${JSON.stringify(recentGames, null, 2)}

Stats últimas 3 rodadas:
${JSON.stringify(lastRoundStats, null, 2)}

Gere sugestões de apostas para a próxima rodada com base nesses dados.`;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Groq API error:", groqResponse.status, errText);
      if (groqResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit da Groq API. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    const content = groqData.choices?.[0]?.message?.content;

    if (!content) throw new Error("Resposta vazia da Groq API");

    let sugestoes: any[];
    try {
      sugestoes = JSON.parse(content);
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Não foi possível parsear a resposta da IA");
      sugestoes = JSON.parse(match[0]);
    }

    return new Response(JSON.stringify({ sugestoes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-insights error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
