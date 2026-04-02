import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { fetchApostasSugeridas } from '@/services/supabase/statsService';
import { useMemo, useState } from 'react';

type FilterResult = 'todos' | 'pendente' | 'ganhou' | 'perdeu' | 'void';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

function getResultIcon(resultado?: string | null) {
  switch (resultado) {
    case 'ganhou': case 'green': return <CheckCircle className="w-4 h-4 text-bet-green" />;
    case 'perdeu': case 'red': return <XCircle className="w-4 h-4 text-bet-red" />;
    case 'void': return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    default: return <Clock className="w-4 h-4 text-yellow-500" />;
  }
}

function getResultBadge(resultado?: string | null) {
  switch (resultado) {
    case 'ganhou': case 'green': return 'badge-green';
    case 'perdeu': case 'red': return 'badge-red';
    case 'void': return 'text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground';
    default: return 'text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400';
  }
}

function getConfiancaBar(confianca: number) {
  const pct = Math.min(confianca, 100);
  const color = pct >= 80 ? 'bg-bet-green' : pct >= 60 ? 'bg-yellow-500' : 'bg-bet-red';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono">{pct}%</span>
    </div>
  );
}

export default function Apostas() {
  const [filter, setFilter] = useState<FilterResult>('todos');

  const { data: apostas, isLoading } = useQuery({
    queryKey: ['apostas-sugeridas'],
    queryFn: fetchApostasSugeridas,
  });

  const filtered = useMemo(() => {
    if (!apostas) return [];
    if (filter === 'todos') return apostas;
    return apostas.filter((a: any) => {
      const r = a.resultado || 'pendente';
      if (filter === 'ganhou') return r === 'ganhou' || r === 'green';
      if (filter === 'perdeu') return r === 'perdeu' || r === 'red';
      return r === filter;
    });
  }, [apostas, filter]);

  const resumo = useMemo(() => {
    if (!apostas || apostas.length === 0) return null;
    const total = apostas.length;
    const ganhou = apostas.filter((a: any) => a.resultado === 'ganhou' || a.resultado === 'green').length;
    const perdeu = apostas.filter((a: any) => a.resultado === 'perdeu' || a.resultado === 'red').length;
    const pendente = apostas.filter((a: any) => !a.resultado || a.resultado === 'pendente').length;
    const voided = apostas.filter((a: any) => a.resultado === 'void').length;
    const pctAcerto = ganhou + perdeu > 0 ? (ganhou / (ganhou + perdeu)) * 100 : 0;
    return { total, ganhou, perdeu, pendente, voided, pctAcerto };
  }, [apostas]);

  return (
    <div className="page-container space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1 className="text-2xl font-display tracking-wide">Central de Apostas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Sugestões baseadas em dados — Brasileirão 2026</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-secondary/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !apostas || apostas.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="card-bet p-8 flex flex-col items-center justify-center min-h-[300px]"
        >
          <TrendingUp className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">Nenhuma sugestão de aposta disponível ainda</p>
          <p className="text-muted-foreground/60 text-xs mt-1">As sugestões aparecerão aqui quando forem cadastradas no banco</p>
        </motion.div>
      ) : (
        <>
          {/* KPI Summary */}
          {resumo && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease }}
              className="grid grid-cols-2 sm:grid-cols-5 gap-3"
            >
              <div className="kpi-card">
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-bold font-mono">{resumo.total}</p>
              </div>
              <div className="kpi-card">
                <p className="text-xs text-muted-foreground mb-1">✅ Ganhou</p>
                <p className="text-2xl font-bold font-mono text-bet-green">{resumo.ganhou}</p>
              </div>
              <div className="kpi-card">
                <p className="text-xs text-muted-foreground mb-1">❌ Perdeu</p>
                <p className="text-2xl font-bold font-mono text-bet-red">{resumo.perdeu}</p>
              </div>
              <div className="kpi-card">
                <p className="text-xs text-muted-foreground mb-1">⏳ Pendente</p>
                <p className="text-2xl font-bold font-mono text-yellow-400">{resumo.pendente}</p>
              </div>
              <div className="kpi-card">
                <p className="text-xs text-muted-foreground mb-1">% Acerto</p>
                <p className="text-2xl font-bold font-mono text-bet-green">{resumo.pctAcerto.toFixed(1)}%</p>
              </div>
            </motion.div>
          )}

          {/* Filter */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease }}
            className="flex gap-1.5"
          >
            {(['todos', 'pendente', 'ganhou', 'perdeu', 'void'] as FilterResult[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${
                  filter === f
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </motion.div>

          {/* Apostas Cards */}
          <div className="space-y-3">
            {filtered.map((aposta: any, i: number) => (
              <motion.div
                key={aposta.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.4, ease }}
                className="card-bet p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                       {getResultIcon(aposta.resultado)}
                       <span className="font-semibold text-sm">
                         {aposta.time_casa_nome || 'Time Casa'} vs {aposta.time_fora_nome || 'Time Fora'}
                       </span>
                       <span className="text-xs text-muted-foreground">R{aposta.rodada}</span>
                     </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                        {aposta.mercado || 'Mercado'}
                      </span>
                      <span className="text-xs text-muted-foreground">{aposta.tipo || 'Tipo'}</span>
                      <span className={getResultBadge(aposta.resultado)}>
                        {aposta.resultado || 'pendente'}
                      </span>
                    </div>
                  </div>
                  {aposta.odd_sugerida && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Odd</p>
                      <p className="text-lg font-mono font-bold text-bet-green">{Number(aposta.odd_sugerida).toFixed(2)}</p>
                    </div>
                  )}
                </div>

                {/* Confiança */}
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Confiança</p>
                  {getConfiancaBar(aposta.confianca ?? 0)}
                </div>

                {/* 3 Justification Layers */}
                {(aposta.justificativa || aposta.base_historica || aposta.base_h2h || aposta.base_casa_fora) && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-border/50">
                    {aposta.justificativa && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Justificativa</p>
                        <p className="text-xs text-foreground/80">{aposta.justificativa}</p>
                      </div>
                    )}
                    {aposta.base_historica && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-bet-green mb-0.5">Base Histórica</p>
                        <p className="text-xs text-foreground/80">{aposta.base_historica}</p>
                      </div>
                    )}
                    {aposta.base_h2h && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-bet-blue mb-0.5">Base H2H</p>
                        <p className="text-xs text-foreground/80">{aposta.base_h2h}</p>
                      </div>
                    )}
                    {aposta.base_casa_fora && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-yellow-400 mb-0.5">Base Casa/Fora</p>
                        <p className="text-xs text-foreground/80">{aposta.base_casa_fora}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
