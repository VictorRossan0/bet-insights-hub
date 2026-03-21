import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Home, Plane } from 'lucide-react';
import { fetchStatsCasaFora } from '@/services/supabase/statsService';

type Metric = 'gols' | 'esc' | 'cart';
const metricLabels: Record<Metric, string> = { gols: 'Gols', esc: 'Escanteios', cart: 'Cartões' };

export default function CasaForaStats() {
  const [metric, setMetric] = useState<Metric>('gols');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats-casa-fora'],
    queryFn: fetchStatsCasaFora,
  });

  const chartData = useMemo(() => {
    if (!stats) return [];
    const getValue = (s: typeof stats[0], loc: 'casa' | 'fora') => {
      if (metric === 'gols') return s[loc].media_gols;
      if (metric === 'esc') return s[loc].media_esc;
      return s[loc].media_cart;
    };
    return [...stats]
      .sort((a, b) => getValue(b, 'casa') - getValue(a, 'casa'))
      .slice(0, 12)
      .map(s => ({
        nome: s.time.length > 12 ? s.time.slice(0, 12) + '…' : s.time,
        Casa: +getValue(s, 'casa').toFixed(1),
        Fora: +getValue(s, 'fora').toFixed(1),
      }));
  }, [stats, metric]);

  const tableData = useMemo(() => {
    if (!stats) return [];
    return [...stats].sort((a, b) => b.casa.media_gols - a.casa.media_gols);
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="card-bet p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-bet-green" />
            <h2 className="text-sm font-semibold">Casa vs Fora — {metricLabels[metric]}</h2>
          </div>
          <div className="flex gap-1.5">
            {(Object.keys(metricLabels) as Metric[]).map(key => (
              <button
                key={key}
                onClick={() => setMetric(key)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors active:scale-95 ${
                  metric === key
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {metricLabels[key]}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="h-72 bg-secondary/30 rounded animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} />
              <YAxis type="category" dataKey="nome" width={110} tick={{ fontSize: 11, fill: 'hsl(0 0% 75%)' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(0 0% 7%)',
                  border: '1px solid hsl(0 0% 14%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Casa" fill="#00ff87" radius={[0, 4, 4, 0]} barSize={10} />
              <Bar dataKey="Fora" fill="#60a5fa" radius={[0, 4, 4, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="card-bet overflow-hidden"
      >
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Plane className="w-4 h-4 text-[#60a5fa]" />
          <h2 className="text-sm font-semibold">Detalhamento Casa / Fora</h2>
        </div>
        <div className="overflow-auto max-h-[480px] scrollbar-thin">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 bg-secondary rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="table-bet">
              <thead className="sticky top-0 bg-card z-10">
                <tr>
                  <th rowSpan={2}>Time</th>
                  <th colSpan={3} className="text-center text-bet-green border-b border-border">🏠 Casa</th>
                  <th colSpan={3} className="text-center text-[#60a5fa] border-b border-border">✈️ Fora</th>
                </tr>
                <tr>
                  <th className="text-center text-[10px]">Gols</th>
                  <th className="text-center text-[10px]">Esc.</th>
                  <th className="text-center text-[10px]">Cart.</th>
                  <th className="text-center text-[10px]">Gols</th>
                  <th className="text-center text-[10px]">Esc.</th>
                  <th className="text-center text-[10px]">Cart.</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map(t => (
                  <tr key={t.sigla}>
                    <td className="font-medium text-sm">{t.time}</td>
                    <td className="text-center font-mono text-sm text-bet-green">{t.casa.media_gols.toFixed(1)}</td>
                    <td className="text-center font-mono text-sm">{t.casa.media_esc.toFixed(1)}</td>
                    <td className="text-center font-mono text-sm">{t.casa.media_cart.toFixed(1)}</td>
                    <td className="text-center font-mono text-sm text-[#60a5fa]">{t.fora.media_gols.toFixed(1)}</td>
                    <td className="text-center font-mono text-sm">{t.fora.media_esc.toFixed(1)}</td>
                    <td className="text-center font-mono text-sm">{t.fora.media_cart.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
