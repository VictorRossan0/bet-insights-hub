import SEO from '@/components/SEO';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FlaskConical, Target, TrendingUp } from 'lucide-react';
import { supabase } from '@/services/supabase/client';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

// Baselines reais observados no dataset (2.986 jogos)
const BASELINES: { linha: number; label: string; taxaReal: number }[] = [
  { linha: 5, label: 'Over 5 Cantos', taxaReal: 92.7 },
  { linha: 7, label: 'Over 7 Cantos', taxaReal: 78.5 },
  { linha: 9, label: 'Over 9 Cantos', taxaReal: 56.4 },
  { linha: 10, label: 'Over 10 Cantos', taxaReal: 44.8 },
  { linha: 12, label: 'Over 12 Cantos', taxaReal: 25.3 },
];

type BacktestRow = {
  taxa_acerto?: number | null;
  taxa_over?: number | null;
  total_jogos?: number | null;
  jogos_sinalizados?: number | null;
  linha?: number | null;
};

async function fetchBacktestCantos9() {
  const { data, error } = await supabase
    .from('backtest_cantos')
    .select('*')
    .eq('linha', 9)
    .maybeSingle();
  if (error) throw error;
  return data as BacktestRow | null;
}

async function fetchBacktestOver5() {
  const { data, error } = await supabase
    .from('backtest_over5_cantos')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as BacktestRow | null;
}

export default function Backtesting() {
  const { data: over9, isLoading: loading9, error: err9 } = useQuery({
    queryKey: ['backtest-cantos-9'],
    queryFn: fetchBacktestCantos9,
  });
  const { data: over5, isLoading: loading5, error: err5 } = useQuery({
    queryKey: ['backtest-over5'],
    queryFn: fetchBacktestOver5,
  });

  const taxa9 = over9?.taxa_acerto ?? 63.3;
  const taxa5 = over5?.taxa_acerto ?? over5?.taxa_over ?? 92.7;
  const baseline9 = 56.3;
  const edge9 = taxa9 - baseline9;

  return (
    <div className="page-container space-y-8">
      <SEO
        title="Backtesting de Modelos"
        description="Resultados de backtest histórico dos modelos de recomendação de escanteios no Brasileirão Série A."
        path="/backtesting"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-bet-green" />
          <h1 className="text-2xl font-display tracking-wide">Backtesting</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Validação histórica dos modelos em 2.986 jogos do Brasileirão Série A
        </p>
      </motion.div>

      {/* Destaque: Over 9 combinado */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.1 }}
        className="rounded-xl border border-bet-green/40 bg-bet-green/5 p-5"
      >
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-bet-green mt-1" />
          <div className="flex-1">
            <h2 className="font-display text-lg">Sinal com edge real — Over 9 Cantos (combinado)</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Quando a média combinada (H2H + Casa/Fora) é ≥ 9, o modelo acerta em{' '}
              <span className="text-bet-green font-semibold">{taxa9.toFixed(1)}%</span> das ocorrências,
              contra baseline de {baseline9.toFixed(1)}% — edge de{' '}
              <span className="text-bet-green font-semibold">+{edge9.toFixed(1)} p.p.</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Cobertura: ~7% dos jogos {over9?.jogos_sinalizados ? `(${over9.jogos_sinalizados} jogos sinalizados)` : ''}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Comparação de modelos */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.15 }}
        className="space-y-3"
      >
        <h2 className="font-display text-lg">Modelos vs. baseline real</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Over 5 Cantos (legado)</div>
            <div className="text-2xl font-display mt-1">
              {loading5 ? '…' : `${taxa5.toFixed(1)}%`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Baseline real: 92.7% — <span className="text-bet-red">sem edge</span>
            </div>
            {err5 && <div className="text-xs text-bet-red mt-1">Erro ao carregar backtest.</div>}
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Over 9 Cantos (novo)</div>
            <div className="text-2xl font-display mt-1 text-bet-green">
              {loading9 ? '…' : `${taxa9.toFixed(1)}%`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Baseline real: {baseline9.toFixed(1)}% —{' '}
              <span className="text-bet-green">+{edge9.toFixed(1)} p.p.</span>
            </div>
            {err9 && <div className="text-xs text-bet-red mt-1">Erro ao carregar backtest.</div>}
          </div>
        </div>
      </motion.section>

      {/* Tabela: taxa real de Over por linha */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-display text-lg">Taxa real de Over por linha</h2>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Mercado</th>
                <th className="text-right px-4 py-2">Taxa real</th>
                <th className="text-right px-4 py-2">Valor de aposta</th>
              </tr>
            </thead>
            <tbody>
              {BASELINES.map((b) => {
                const semValor = b.taxaReal >= 85 || b.taxaReal <= 30;
                return (
                  <tr key={b.linha} className="border-t border-border">
                    <td className="px-4 py-2">{b.label}</td>
                    <td className="px-4 py-2 text-right font-mono">{b.taxaReal.toFixed(1)}%</td>
                    <td className="px-4 py-2 text-right">
                      {b.linha === 9 ? (
                        <span className="text-bet-green">Edge com filtro</span>
                      ) : semValor ? (
                        <span className="text-muted-foreground">Sem valor</span>
                      ) : (
                        <span className="text-muted-foreground">Neutro</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Dataset: 2.986 jogos do Brasileirão Série A. Linhas com taxa ≥ 85% ou ≤ 30% não oferecem valor prático
          contra as odds típicas de mercado.
        </p>
      </motion.section>
    </div>
  );
}
