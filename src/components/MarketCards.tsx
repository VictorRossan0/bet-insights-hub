import { motion } from 'framer-motion';
import type { StatsAcumulado, MarketData } from '@/types/database';

type Props = {
  stats: StatsAcumulado | null;
  isLoading: boolean;
};

function getClassificacao(pct: number): string {
  if (pct >= 90) return '🔥🔥🔥🔥';
  if (pct >= 80) return '🔥🔥🔥';
  if (pct >= 70) return '🔥🔥';
  if (pct >= 60) return '🔥';
  return '⚠️';
}

function getMarkets(stats: StatsAcumulado): MarketData[] {
  return [
    { nome: 'Over 5 Cantos', percentual: stats.pct_o5_cantos, classificacao: getClassificacao(stats.pct_o5_cantos) },
    { nome: 'Over 6 Cantos', percentual: stats.pct_o6_cantos, classificacao: getClassificacao(stats.pct_o6_cantos) },
    { nome: 'Over 7 Cantos', percentual: stats.pct_o7_cantos, classificacao: getClassificacao(stats.pct_o7_cantos) },
    { nome: 'Under 3.5 Gols', percentual: stats.pct_u35_gols, classificacao: getClassificacao(stats.pct_u35_gols) },
    { nome: 'Under 2.5 Gols', percentual: stats.pct_u25_gols, classificacao: getClassificacao(stats.pct_u25_gols) },
    { nome: 'Under 7 Cartões', percentual: stats.pct_u7_cartoes, classificacao: getClassificacao(stats.pct_u7_cartoes) },
    { nome: 'Over 8 Escanteios', percentual: stats.pct_o8_escanteios, classificacao: getClassificacao(stats.pct_o8_escanteios) },
    { nome: 'Over 9 Escanteios', percentual: stats.pct_o9_escanteios, classificacao: getClassificacao(stats.pct_o9_escanteios) },
  ];
}

export default function MarketCards({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card-bet p-4 space-y-3">
            <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
            <div className="h-8 w-16 bg-secondary rounded animate-pulse" />
            <div className="h-2 bg-secondary rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const markets = getMarkets(stats);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {markets.map((market, i) => (
        <motion.div
          key={market.nome}
          initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.3 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="card-bet p-4 hover:border-bet-green/30 transition-colors duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{market.nome}</h3>
            <span className="text-lg">{market.classificacao}</span>
          </div>
          <p className="text-3xl font-bold font-mono tabular-nums text-bet-green mb-3">
            {market.percentual.toFixed(1)}%
          </p>
          <div className="market-bar">
            <motion.div
              className="market-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${market.percentual}%` }}
              transition={{ delay: 0.5 + i * 0.07, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
