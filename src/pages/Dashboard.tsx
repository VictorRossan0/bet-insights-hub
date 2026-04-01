import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DashboardKPIs from '@/components/DashboardKPIs';
import MarketCards from '@/components/MarketCards';
import { fetchStatsAcumulado, fetchStatsPorRodada } from '@/services/supabase/statsService';

const TEMPORADA_ANO: Record<number, number> = { 1: 2026, 2: 2025, 3: 2024, 4: 2023, 5: 2022, 6: 2021, 7: 2020 };
const MAX_TEMPORADA_ID = 7;

export default function Dashboard() {
  const [temporadaId, setTemporadaId] = useState(1);
  const ano = TEMPORADA_ANO[temporadaId] ?? temporadaId;
  const prevTemporadaId = temporadaId < MAX_TEMPORADA_ID ? temporadaId + 1 : null;

  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['stats-acumulado', temporadaId],
    queryFn: () => fetchStatsAcumulado(temporadaId),
  });

  const { data: prevStats } = useQuery({
    queryKey: ['stats-acumulado', prevTemporadaId],
    queryFn: () => fetchStatsAcumulado(prevTemporadaId!),
    enabled: prevTemporadaId !== null,
  });

  const { data: statsPorRodada, isLoading: loadingRodada, refetch: refetchRodada } = useQuery({
    queryKey: ['stats-por-rodada', temporadaId],
    queryFn: () => fetchStatsPorRodada(temporadaId),
  });

  const handleRefresh = () => {
    refetchStats();
    refetchRodada();
  };

  return (
    <div className="page-container space-y-5 sm:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display tracking-wide">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral do Brasileirão {ano}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={temporadaId}
            onChange={(e) => setTemporadaId(Number(e.target.value))}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {Object.entries(TEMPORADA_ANO).map(([id, year]) => (
              <option key={id} value={id}>{year}</option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-sm font-medium hover:bg-accent/80 transition-colors active:scale-[0.97]"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </motion.div>

      {/* KPIs */}
      <DashboardKPIs stats={stats ?? null} prevStats={prevStats ?? null} isLoading={loadingStats} />

      {/* Markets */}
      <motion.div
        initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="text-lg font-semibold mb-4">🎯 Mercados</h2>
        <MarketCards stats={stats ?? null} prevStats={prevStats ?? null} isLoading={loadingStats} />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="card-bet p-5"
        >
          <h3 className="text-sm font-semibold mb-4">📉 Evolução por Rodada</h3>
          {loadingRodada ? (
            <div className="h-64 bg-secondary/30 rounded animate-pulse" />
          ) : statsPorRodada && statsPorRodada.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={statsPorRodada}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" />
                <XAxis dataKey="rodada" tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} />
                <Tooltip contentStyle={{ background: 'hsl(0 0% 7%)', border: '1px solid hsl(0 0% 14%)', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="media_gols" name="Gols" stroke="#00ff87" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="media_escanteios" name="Escanteios" stroke="#60a5fa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="media_cartoes" name="Cartões" stroke="#FF3D3D" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12 text-sm">Sem dados disponíveis</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="card-bet p-5"
        >
          <h3 className="text-sm font-semibold mb-4">📊 Over 5 vs Over 6 Cantos</h3>
          {loadingRodada ? (
            <div className="h-64 bg-secondary/30 rounded animate-pulse" />
          ) : statsPorRodada && statsPorRodada.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statsPorRodada}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" />
                <XAxis dataKey="rodada" tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }} />
                <Tooltip contentStyle={{ background: 'hsl(0 0% 7%)', border: '1px solid hsl(0 0% 14%)', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="pct_o5_cantos" name="Over 5" fill="#00ff87" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pct_o6_cantos" name="Over 6" fill="#00ff8766" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12 text-sm">Sem dados disponíveis</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
