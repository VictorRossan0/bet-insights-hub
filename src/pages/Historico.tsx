import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { History, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchStatsPorTemporada } from '@/services/supabase/statsService';
import { useMemo, useState } from 'react';

type Metric = 'media_gols' | 'media_escanteios' | 'media_cartoes' | 'pct_o5_cantos' | 'pct_o6_cantos' | 'pct_u35_gols';

const metricLabels: Record<Metric, string> = {
  media_gols: 'Média Gols',
  media_escanteios: 'Média Escanteios',
  media_cartoes: 'Média Cartões',
  pct_o5_cantos: '% Over 5 Cantos',
  pct_o6_cantos: '% Over 6 Cantos',
  pct_u35_gols: '% Under 3.5 Gols',
};

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function Historico() {
  const [selectedMetric, setSelectedMetric] = useState<Metric>('media_gols');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats-por-temporada'],
    queryFn: fetchStatsPorTemporada,
  });

  const insights = useMemo(() => {
    if (!stats || stats.length < 2) return [];
    const last = stats[stats.length - 1];
    const prev = stats[stats.length - 2];
    const results: { label: string; diff: number; positive: boolean }[] = [];

    for (const [key, label] of Object.entries(metricLabels) as [Metric, string][]) {
      const curr = last[key] as number;
      const prevVal = prev[key] as number;
      if (prevVal === 0) continue;
      const diff = ((curr - prevVal) / prevVal) * 100;
      results.push({ label, diff, positive: diff > 0 });
    }
    return results;
  }, [stats]);

  return (
    <div className="page-container space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1 className="text-2xl font-display tracking-wide">Histórico</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tendências de 2020 a 2025 — Brasileirão Série A</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-secondary/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !stats || stats.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="card-bet p-8 flex flex-col items-center justify-center min-h-[300px]"
        >
          <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">Sem dados históricos disponíveis</p>
        </motion.div>
      ) : (
        <>
          {/* Insights */}
          {insights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
            >
              {insights.map((ins, i) => (
                <div key={ins.label} className="card-bet p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{ins.label}</p>
                  <div className="flex items-center gap-1">
                    {ins.positive
                      ? <TrendingUp className="w-3.5 h-3.5 text-bet-green" />
                      : <TrendingDown className="w-3.5 h-3.5 text-bet-red" />}
                    <span className={`font-mono text-sm font-bold ${ins.positive ? 'text-bet-green' : 'text-bet-red'}`}>
                      {ins.diff > 0 ? '+' : ''}{ins.diff.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">vs ano anterior</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Metric selector */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease }}
            className="flex flex-wrap gap-1.5"
          >
            {(Object.keys(metricLabels) as Metric[]).map(key => (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  selectedMetric === key
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {metricLabels[key]}
              </button>
            ))}
          </motion.div>

          {/* Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.2, duration: 0.5, ease }}
            className="card-bet p-5"
          >
            <h3 className="text-sm font-semibold mb-4">📈 Evolução — {metricLabels[selectedMetric]}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" />
                <XAxis dataKey="ano" tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(0 0% 7%)',
                    border: '1px solid hsl(0 0% 14%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [val.toFixed(2), metricLabels[selectedMetric]]}
                />
                <Line type="monotone" dataKey={selectedMetric} stroke="#00ff87" strokeWidth={2.5} dot={{ r: 4, fill: '#00ff87' }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Multi-line comparison */}
          <motion.div
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.3, duration: 0.5, ease }}
            className="card-bet p-5"
          >
            <h3 className="text-sm font-semibold mb-4">📉 Médias por Temporada</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" />
                <XAxis dataKey="ano" tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(0 0% 7%)',
                    border: '1px solid hsl(0 0% 14%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="media_gols" name="Gols" stroke="#00ff87" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="media_escanteios" name="Escanteios" stroke="#60a5fa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="media_cartoes" name="Cartões" stroke="#FF3D3D" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Bar chart - markets */}
          <motion.div
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.4, duration: 0.5, ease }}
            className="card-bet p-5"
          >
            <h3 className="text-sm font-semibold mb-4">📊 Mercados por Temporada</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" />
                <XAxis dataKey="ano" tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(0 0% 7%)',
                    border: '1px solid hsl(0 0% 14%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [`${val.toFixed(1)}%`]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="pct_o5_cantos" name="Over 5 Cantos" fill="#00ff87" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pct_o6_cantos" name="Over 6 Cantos" fill="#00ff8766" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pct_u35_gols" name="Under 3.5" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Data Table */}
          <motion.div
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.5, duration: 0.5, ease }}
            className="card-bet overflow-hidden"
          >
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold">📋 Resumo por Temporada</h3>
            </div>
            <div className="overflow-auto scrollbar-thin">
              <table className="table-bet">
                <thead>
                  <tr>
                    <th>Ano</th>
                    <th className="text-center">Jogos</th>
                    <th className="text-center">Gols</th>
                    <th className="text-center">Esc.</th>
                    <th className="text-center">Cart.</th>
                    <th className="text-center">O5</th>
                    <th className="text-center">O6</th>
                    <th className="text-center">U3.5</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map(s => (
                    <tr key={s.ano}>
                      <td className="font-mono font-bold">{s.ano}</td>
                      <td className="text-center font-mono">{s.total_jogos}</td>
                      <td className="text-center font-mono text-bet-green">{s.media_gols.toFixed(2)}</td>
                      <td className="text-center font-mono">{s.media_escanteios.toFixed(1)}</td>
                      <td className="text-center font-mono">{s.media_cartoes.toFixed(1)}</td>
                      <td className="text-center font-mono">{s.pct_o5_cantos.toFixed(1)}%</td>
                      <td className="text-center font-mono">{s.pct_o6_cantos.toFixed(1)}%</td>
                      <td className="text-center font-mono">{s.pct_u35_gols.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
