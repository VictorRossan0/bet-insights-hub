import { useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Zap, Loader2 } from 'lucide-react';
import InsightCards from '@/components/InsightCards';
import { fetchSugestoes, updateSugestaoStatus } from '@/services/supabase/sugestoesService';
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
    mutationFn: ({ id, status }: { id: number; status: 'green' | 'red' }) =>
      updateSugestaoStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sugestoes'] });
      toast.success('Resultado marcado');
    },
    onError: () => toast.error('Erro ao marcar resultado'),
  });

  const handleGenerateAnalysis = useCallback(async () => {
    setGenerating(true);
    toast.info('Geração de análise com IA será implementada com a integração Claude.');
    setTimeout(() => setGenerating(false), 1500);
  }, []);

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
        onMarkResult={(id, status) => markResultMutation.mutate({ id, status })}
        onSendTelegram={handleSendTelegram}
      />
    </div>
  );
}
