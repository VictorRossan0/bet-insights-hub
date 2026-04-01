import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { StatsAcumulado, MarketData } from '@/types/database';

type Props = {
  stats: StatsAcumulado | null;
  prevStats?: StatsAcumulado | null;
  isLoading: boolean;
};

function getClassificacao(pct: number): string {
  if (pct >= 90) return '🔥🔥🔥🔥';
  if (pct >= 80) return '🔥🔥🔥';
  if (pct >= 70) return '🔥🔥';
  if (pct >= 60) return '🔥';
  return '⚠️';
}

type MarketKey = 'pct_o5_cantos' | 'pct_o6_cantos' | 'pct_o7_cantos' | 'pct_u35_gols' | 'pct_u25_gols' | 'pct_u7_cartoes' | 'pct_o8_cantos' | 'pct_o9_cantos';

const MARKET_KEYS: { nome: string; key: MarketKey }[] = [
  { nome: 'Over 5 Cantos', key: 'pct_o5_cantos' },
  { nome: 'Over 6 Cantos', key: 'pct_o6_cantos' },
  { nome: 'Over 7 Cantos', key: 'pct_o7_cantos' },
  { nome: 'Under 3.5 Gols', key: 'pct_u35_gols' },
  { nome: 'Under 2.5 Gols', key: 'pct_u25_gols' },
  { nome: 'Under 7 Cartões', key: 'pct_u7_cartoes' },
  { nome: 'Over 8 Cantos', key: 'pct_o8_cantos' },
  { nome: 'Over 9 Cantos', key: 'pct_o9_cantos' },
];

function YoYDelta({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous;
  if (Math.abs(delta) < 0.3) return null;
  const isUp = delta > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
      isUp ? 'text-bet-green' : 'text-destructive'
    }`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isUp ? '+' : ''}{delta.toFixed(1)}pp
    </span>
  );
}

export default function MarketCards({ stats, prevStats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card-bet p-3 sm:p-4 space-y-3">
            <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
            <div className="h-8 w-16 bg-secondary rounded animate-pulse" />
            <div className="h-2 bg-secondary rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
      {MARKET_KEYS.map((market, i) => {
        const pct = stats[market.key] ?? 0;
        const prevPct = prevStats?.[market.key];

        return (
          <motion.div
            key={market.nome}
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.3 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="card-bet p-3 sm:p-4 hover:border-bet-green/30 transition-colors duration-200 min-w-0 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <h3 className="text-xs sm:text-sm font-semibold leading-tight">{market.nome}</h3>
              <span className="text-sm sm:text-lg">{getClassificacao(pct)}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-0.5 sm:gap-2 mb-2 sm:mb-3">
              <p className="text-xl sm:text-3xl font-bold font-mono tabular-nums text-bet-green">
                {pct.toFixed(1)}%
              </p>
              {prevPct != null && <YoYDelta current={pct} previous={prevPct} />}
            </div>
            <div className="market-bar">
              <motion.div
                className="market-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.5 + i * 0.07, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
