import { useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Zap, Loader2 } from 'lucide-react';
import InsightCards from '@/components/InsightCards';
import { fetchSugestoes, updateSugestaoResultado, saveSugestoes } from '@/services/supabase/sugestoesService';
import { supabase as cloudSupabase } from '@/integrations/supabase/client';
import { supabase as externalSupabase } from '@/services/supabase/client';
import { fetchStatsAcumulado, fetchStatsPorRodada } from '@/services/supabase/statsService';
import { toast } from 'sonner';
import type { SugestaoAposta } from '@/types/database';

export default function Insights() {
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: sugestoes, isLoading } = useQuery({
    queryKey: ['sugestoes'],
    queryFn: fetchSugestoes,
  });

  const markResultMutation = useMutation({
    mutationFn: ({ id, resultado }: { id: number; resultado: 'ganhou' | 'perdeu' }) =>
      updateSugestaoResultado(id, resultado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sugestoes'] });
      toast.success('Resultado marcado');
    },
    onError: () => toast.error('Erro ao marcar resultado'),
  });

  const handleGenerateAnalysis = useCallback(async () => {
    setGenerating(true);
    try {
      // Fetch data from external Supabase
      const [stats, roundStats, recentGamesRes] = await Promise.all([
        fetchStatsAcumulado(),
        fetchStatsPorRodada(),
        externalSupabase
          .from('jogos')
          .select('*, time_casa:times!jogos_time_casa_id_fkey(nome,sigla), time_fora:times!jogos_time_fora_id_fkey(nome,sigla)')
          .order('rodada', { ascending: false })
          .limit(20),
      ]);

      const recentGames = recentGamesRes.data?.map((g: any) => ({
        rodada: g.rodada,
        casa: g.time_casa?.nome,
        fora: g.time_fora?.nome,
        gols: `${g.gols_casa}x${g.gols_fora}`,
        escanteios: g.escanteios_total,
        cartoes: g.cartoes_total,
      }));

      const lastRoundStats = roundStats.slice(-3);

      // Call Groq via edge function
      const { data, error } = await cloudSupabase.functions.invoke('generate-insights', {
        body: { stats, recentGames, lastRoundStats },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Save to external Supabase
      const maxRodada = recentGames?.[0]?.rodada ?? 0;
      const toSave = data.sugestoes.map((s: any) => ({
        rodada_referencia: maxRodada + 1,
        mercado: s.mercado,
        tipo_aposta: s.tipo_aposta,
        descricao: s.descricao,
        confianca: Math.min(95, Math.max(50, s.confianca)),
        odd_sugerida: s.odd_sugerida,
        resultado: 'pendente',
        enviado_telegram: false,
      }));

      await saveSugestoes(toSave);
      queryClient.invalidateQueries({ queryKey: ['sugestoes'] });
      toast.success(`${data.sugestoes.length} sugestões geradas com sucesso!`);
    } catch (err: any) {
      console.error('Generate insights error:', err);
      toast.error(err.message || 'Erro ao gerar análise');
    } finally {
      setGenerating(false);
    }
  }, [queryClient]);

  const handleSendTelegram = useCallback(async (sugestao: SugestaoAposta) => {
    try {
      const chatId = prompt('Informe o chat_id do Telegram:');
      if (!chatId) return;

      const { data, error } = await cloudSupabase.functions.invoke('send-telegram', {
        body: { chatId, sugestao },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Sugestão enviada ao Telegram!');
    } catch (err: any) {
      console.error('Telegram error:', err);
      toast.error(err.message || 'Erro ao enviar para o Telegram');
    }
  }, []);

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Insights</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Análises e sugestões geradas por IA</p>
        </div>
        <button
          onClick={handleGenerateAnalysis}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Gerar Análise
        </button>
      </motion.div>

      {/* Cards */}
      <InsightCards
        sugestoes={sugestoes ?? []}
        isLoading={isLoading}
        onMarkResult={(id, resultado) => markResultMutation.mutate({ id, resultado })}
        onSendTelegram={handleSendTelegram}
      />
    </div>
  );
}
