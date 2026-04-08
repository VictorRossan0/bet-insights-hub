import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Trophy, Target, CornerDownRight, CreditCard, AlertTriangle } from 'lucide-react';
import type { StatsAcumulado } from '@/types/database';
import { SkeletonKPI } from '@/components/ui/skeleton-loaders';

type Props = {
  stats: StatsAcumulado | null;
  prevStats?: StatsAcumulado | null;
  isLoading: boolean;
};

const kpis = [
  { key: 'total_jogos', label: 'Total Jogos', icon: Trophy, format: (v: number | null) => (v ?? 0).toString(), isCount: true },
  { key: 'total_rodadas', label: 'Rodadas', icon: Target, format: (v: number | null) => (v ?? 0).toString(), isCount: true },
  { key: 'media_escanteios', label: 'Média Escanteios', icon: CornerDownRight, format: (v: number | null) => (v ?? 0).toFixed(1), isCount: false },
  { key: 'media_gols', label: 'Média Gols', icon: CreditCard, format: (v: number | null) => (v ?? 0).toFixed(2), isCount: false },
  { key: 'media_cartoes', label: 'Média Cartões', icon: AlertTriangle, format: (v: number | null) => (v ?? 0).toFixed(1), isCount: false },
] as const;

function YoYBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pctChange = ((current - previous) / previous) * 100;
  if (Math.abs(pctChange) < 0.5) return null;

  const isUp = pctChange > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
      isUp ? 'bg-bet-green/15 text-bet-green' : 'bg-destructive/15 text-destructive'
    }`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isUp ? '+' : ''}{pctChange.toFixed(1)}%
    </span>
  );
}

export default function DashboardKPIs({ stats, prevStats, isLoading }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin md:grid md:grid-cols-3 lg:grid-cols-5 md:gap-4 md:overflow-visible md:pb-0">
      {kpis.map((kpi, i) => {
        const currentVal = stats ? (stats[kpi.key] as number) : null;
        const prevVal = prevStats ? (prevStats[kpi.key] as number) : null;

        return (
          <motion.div
            key={kpi.key}
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="kpi-card group min-w-[140px] snap-start flex-shrink-0 md:min-w-0 md:flex-shrink"
          >
            <div className="flex items-center gap-2 mb-3">
              <kpi.icon className="w-4 h-4 text-bet-green" />
              <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
            </div>
            {isLoading ? (
              <SkeletonKPI />
            ) : (
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold font-mono tabular-nums">
                  {currentVal !== null ? kpi.format(currentVal) : '—'}
                </p>
                {!kpi.isCount && currentVal !== null && prevVal !== null && (
                  <YoYBadge current={currentVal} previous={prevVal} />
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
