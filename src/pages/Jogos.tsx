import SEO from '@/components/SEO';
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, RefreshCw, Plus, FileText, FileJson, Download } from 'lucide-react';
import GamesTable from '@/components/GamesTable';
import FormNovoJogo from '@/components/FormNovoJogo';
import { fetchJogosPaginated as fetchJogosResumo, fetchRodadas } from '@/services/api/games.api';
import { importJogosValidated, parseCSV } from '@/services/supabase/importService';
import { useAuth } from '@/hooks/useAuth';
import { useLiga } from '@/contexts/LigaContext';
import { toast } from 'sonner';

export default function Jogos() {
  const [page, setPage] = useState(1);
  const [rodadaFilter, setRodadaFilter] = useState<number | undefined>();
  const [timeFilter, setTimeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const pageSize = 10;
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { temporadaAtualId, ligaAtual } = useLiga();
  const ligaNome = ligaAtual?.nome ?? 'Liga';

  const { data: jogosData, isLoading } = useQuery({
    queryKey: ['jogos', page, rodadaFilter, timeFilter, temporadaAtualId],
    queryFn: () => fetchJogosResumo({ page, pageSize, rodada: rodadaFilter, time: timeFilter || undefined, temporada_id: temporadaAtualId! }),
    enabled: !!temporadaAtualId,
  });

  const { data: rodadas } = useQuery({
    queryKey: ['rodadas', temporadaAtualId],
    queryFn: () => fetchRodadas(temporadaAtualId!),
    enabled: !!temporadaAtualId,
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
          temporada_id: j.temporada_id ?? temporadaAtualId,
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
  }, [temporadaAtualId, invalidateAll]);

  const btnCls = 'flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-xs sm:text-sm font-medium hover:bg-accent/80 transition-colors active:scale-[0.97]';

  return (
    <div className="page-container space-y-6">
      <SEO title="Jogos do Brasileirão" description="Lista de partidas do Brasileirão Série A com filtros por rodada, mercados de gols, escanteios e cartões." path="/jogos" />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display tracking-wide">Jogos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{ligaNome}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleRefresh} className={btnCls}>
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </button>
          {isAdmin && (
            <>
              <button onClick={() => setShowForm(true)} className={btnCls} data-testid="btn-novo-jogo">
                <Plus className="w-3.5 h-3.5" /> Novo Jogo
              </button>
              <button onClick={() => handleImportFile('.json')} className={btnCls}>
                <FileJson className="w-3.5 h-3.5" /> JSON
              </button>
              <button onClick={() => handleImportFile('.csv')} className={btnCls}>
                <FileText className="w-3.5 h-3.5" /> CSV
              </button>
              <a href="/exemplo_jogos.csv" download className={btnCls}>
                <Download className="w-3.5 h-3.5" /> Template
              </a>
            </>
          )}
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
          onChange={(e) => { setRodadaFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          className="bg-secondary text-secondary-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
            className="w-full bg-secondary text-secondary-foreground border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
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
          onUpdate={invalidateAll}
        />
      </motion.div>

      {/* Form Modal */}
      {showForm && temporadaAtualId && (
        <FormNovoJogo
          temporadaId={temporadaAtualId}
          onSuccess={invalidateAll}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
