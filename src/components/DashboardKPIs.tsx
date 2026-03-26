import { motion } from 'framer-motion';
import type { StatsAcumulado } from '@/types/database';
import { Trophy, Target, CornerDownRight, CreditCard, AlertTriangle } from 'lucide-react';

type Props = {
  stats: StatsAcumulado | null;
  isLoading: boolean;
};

const kpis = [
  { key: 'total_jogos', label: 'Total Jogos', icon: Trophy, format: (v: number | null) => (v ?? 0).toString() },
  { key: 'total_rodadas', label: 'Rodadas', icon: Target, format: (v: number | null) => (v ?? 0).toString() },
  { key: 'media_escanteios', label: 'Média Escanteios', icon: CornerDownRight, format: (v: number | null) => (v ?? 0).toFixed(1) },
  { key: 'media_gols', label: 'Média Gols', icon: CreditCard, format: (v: number | null) => (v ?? 0).toFixed(2) },
  { key: 'media_cartoes', label: 'Média Cartões', icon: AlertTriangle, format: (v: number | null) => (v ?? 0).toFixed(1) },
] as const;

export default function DashboardKPIs({ stats, isLoading }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.key}
          initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="kpi-card group"
        >
          <div className="flex items-center gap-2 mb-3">
            <kpi.icon className="w-4 h-4 text-bet-green" />
            <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
          </div>
          {isLoading ? (
            <div className="h-8 bg-secondary rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold font-mono tabular-nums">
              {stats ? kpi.format(stats[kpi.key] as number) : '—'}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
