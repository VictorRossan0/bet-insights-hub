import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Plus, Upload, RefreshCw } from 'lucide-react';
import GamesTable from '@/components/GamesTable';
import { fetchJogosResumo, fetchRodadas, fetchTimes } from '@/services/supabase/jogosService';
import { toast } from 'sonner';

export default function Jogos() {
  const [page, setPage] = useState(1);
  const [rodadaFilter, setRodadaFilter] = useState<number | undefined>();
  const [timeFilter, setTimeFilter] = useState('');
  const pageSize = 10;
  const queryClient = useQueryClient();

  const { data: jogosData, isLoading } = useQuery({
    queryKey: ['jogos', page, rodadaFilter, timeFilter],
    queryFn: () => fetchJogosResumo({ page, pageSize, rodada: rodadaFilter, time: timeFilter || undefined }),
  });

  const { data: rodadas } = useQuery({
    queryKey: ['rodadas'],
    queryFn: fetchRodadas,
  });

  const { data: times } = useQuery({
    queryKey: ['times'],
    queryFn: fetchTimes,
  });

  const timeNames = times?.map(t => t.nome) ?? [];

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['jogos'] });
    toast.success('Dados atualizados');
  }, [queryClient]);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const jogos = JSON.parse(text);
        const { importJogos } = await import('@/services/supabase/jogosService');
        await importJogos(jogos);
        queryClient.invalidateQueries({ queryKey: ['jogos'] });
        toast.success(`${jogos.length} jogos importados`);
      } catch (err) {
        toast.error('Erro ao importar JSON');
        console.error(err);
      }
    };
    input.click();
  }, [queryClient]);

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
          <h1 className="text-2xl font-display tracking-wide">Jogos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Brasileirão Série A 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-sm font-medium hover:bg-accent/80 transition-colors active:scale-[0.97]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
          <button
            onClick={handleImportJSON}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-sm font-medium hover:bg-accent/80 transition-colors active:scale-[0.97]"
          >
            <Upload className="w-3.5 h-3.5" />
            Importar JSON
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <select
          value={rodadaFilter ?? ''}
          onChange={(e) => {
            setRodadaFilter(e.target.value ? Number(e.target.value) : undefined);
            setPage(1);
          }}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Todas as rodadas</option>
          {rodadas?.map((r) => (
            <option key={r} value={r}>Rodada {r}</option>
          ))}
        </select>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrar por time..."
            value={timeFilter}
            onChange={(e) => { setTimeFilter(e.target.value); setPage(1); }}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <GamesTable
          jogos={jogosData?.data ?? []}
          isLoading={isLoading}
          page={page}
          totalCount={jogosData?.count ?? 0}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </motion.div>
    </div>
  );
}
