import { useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Zap, Loader2 } from 'lucide-react';
import InsightCards from '@/components/InsightCards';
import { fetchSugestoes, updateSugestaoResultado } from '@/services/supabase/sugestoesService';
import { supabase } from '@/integrations/supabase/client';
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
      const { data, error } = await supabase.functions.invoke('generate-insights');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ['sugestoes'] });
      toast.success(`${data.sugestoes?.length ?? 0} sugestões geradas com sucesso!`);
    } catch (err: any) {
      console.error('Generate insights error:', err);
      toast.error(err.message || 'Erro ao gerar análise');
    } finally {
      setGenerating(false);
    }
  }, [queryClient]);

  const handleSendTelegram = useCallback((sugestao: SugestaoAposta) => {
    const message = `⚽ BetAnalytics\n🔥 Sugestão: ${sugestao.mercado}\n📊 Confiança: ${sugestao.confianca}%\n💰 Odd: ${sugestao.odd_sugerida}\n🧠 ${sugestao.descricao}`;
    toast.info('Integração Telegram será configurada. Mensagem preparada.');
    console.log('Telegram message:', message);
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
