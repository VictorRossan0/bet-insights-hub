import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Upload, RefreshCw, Plus, FileText, FileJson } from 'lucide-react';
import GamesTable from '@/components/GamesTable';
import FormNovoJogo from '@/components/FormNovoJogo';
import { fetchJogosResumo, fetchRodadas } from '@/services/supabase/jogosService';
import { importJogosValidated, parseCSV } from '@/services/supabase/importService';
import { toast } from 'sonner';

const TEMPORADA_ANO: Record<number, number> = { 1: 2026, 2: 2025, 3: 2024, 4: 2023, 5: 2022, 6: 2021, 7: 2020 };

export default function Jogos() {
  const [page, setPage] = useState(1);
  const [temporadaId, setTemporadaId] = useState(1);
  const [rodadaFilter, setRodadaFilter] = useState<number | undefined>();
  const [timeFilter, setTimeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const pageSize = 10;
  const queryClient = useQueryClient();
  const ano = TEMPORADA_ANO[temporadaId] ?? temporadaId;

  const { data: jogosData, isLoading } = useQuery({
    queryKey: ['jogos', page, rodadaFilter, timeFilter, temporadaId],
    queryFn: () => fetchJogosResumo({ page, pageSize, rodada: rodadaFilter, time: timeFilter || undefined, temporada_id: temporadaId }),
  });

  const { data: rodadas } = useQuery({
    queryKey: ['rodadas', temporadaId],
    queryFn: () => fetchRodadas(temporadaId),
  });

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['jogos'] });
    queryClient.invalidateQueries({ queryKey: ['rodadas'] });
  }, [queryClient]);

  const handleRefresh = useCallback(() => {
    invalidateAll();
    toast.success('Dados atualizados');
  }, [invalidateAll]);

  const handleImportFile = useCallback((accept: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        let jogos;

        if (file.name.endsWith('.csv')) {
          jogos = parseCSV(text);
        } else {
          jogos = JSON.parse(text);
        }

        if (!Array.isArray(jogos) || jogos.length === 0) {
          toast.error('Arquivo vazio ou formato inválido');
          return;
        }

        // Set temporada_id if missing
        jogos = jogos.map((j: Record<string, unknown>) => ({
          ...j,
          temporada_id: j.temporada_id ?? temporadaId,
        }));

        const { inserted, duplicates } = await importJogosValidated(jogos);
        invalidateAll();

        if (duplicates > 0 && inserted > 0) {
          toast.success(`${inserted} jogos importados, ${duplicates} duplicatas ignoradas`);
        } else if (duplicates > 0) {
          toast.warning(`Todos os ${duplicates} jogos já existem no banco`);
        } else {
          toast.success(`${inserted} jogos importados com sucesso`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao importar arquivo';
        toast.error(msg);
        console.error(err);
      }
    };
    input.click();
  }, [queryClient, temporadaId, invalidateAll]);

  const btnCls = 'flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-xs sm:text-sm font-medium hover:bg-accent/80 transition-colors active:scale-[0.97]';

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
          <p className="text-sm text-muted-foreground mt-0.5">Brasileirão Série A {ano}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleRefresh} className={btnCls}>
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </button>
          <button onClick={() => setShowForm(true)} className={btnCls}>
            <Plus className="w-3.5 h-3.5" /> Novo Jogo
          </button>
          <button onClick={() => handleImportFile('.json')} className={btnCls}>
            <FileJson className="w-3.5 h-3.5" /> JSON
          </button>
          <button onClick={() => handleImportFile('.csv')} className={btnCls}>
            <FileText className="w-3.5 h-3.5" /> CSV
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
          value={temporadaId}
          onChange={(e) => { setTemporadaId(Number(e.target.value)); setRodadaFilter(undefined); setPage(1); }}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {Object.entries(TEMPORADA_ANO).map(([id, year]) => (
            <option key={id} value={id}>{year}</option>
          ))}
        </select>

        <select
          value={rodadaFilter ?? ''}
          onChange={(e) => { setRodadaFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
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

      {/* Form Modal */}
      {showForm && (
        <FormNovoJogo
          temporadaId={temporadaId}
          onSuccess={invalidateAll}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
