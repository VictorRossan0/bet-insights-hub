import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DashboardKPIs from '@/components/dashboard/DashboardKPIs';
import MarketCards from '@/components/dashboard/MarketCards';
import { computeStatsAcumulado as fetchStatsAcumulado, computeStatsPorRodada as fetchStatsPorRodada } from '@/services/domain/stats.service';
import { SkeletonChart } from '@/components/ui/skeleton-loaders';
import { useLiga } from '@/contexts/LigaContext';
import SEO from '@/components/SEO';

export default function Dashboard() {
  const { temporadaAtualId, ligaAtual, isLoading: ligaLoading } = useLiga();

  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['stats-acumulado', temporadaAtualId],
    queryFn: () => fetchStatsAcumulado(temporadaAtualId!),
    enabled: !!temporadaAtualId,
  });

  const { data: statsPorRodada, isLoading: loadingRodada, refetch: refetchRodada } = useQuery({
    queryKey: ['stats-por-rodada', temporadaAtualId],
    queryFn: () => fetchStatsPorRodada(temporadaAtualId!),
    enabled: !!temporadaAtualId,
  });

  const handleRefresh = () => {
    refetchStats();
    refetchRodada();
  };

  const ligaNome = ligaAtual?.nome ?? 'Liga';

  return (
    <div className="page-container space-y-5 sm:space-y-8">
      <SEO
        title={`Dashboard ${ligaNome}`}
        description={`Visão geral, KPIs e tendências de ${ligaNome}: gols, escanteios, cartões e mercados.`}
        path="/"
      />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display tracking-wide">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral — {ligaNome}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={!temporadaAtualId}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-sm font-medium hover:bg-accent/80 transition-colors active:scale-[0.97] disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </motion.div>

      {(ligaLoading || !temporadaAtualId) && (
        <p className="text-sm text-muted-foreground">Carregando temporada da liga…</p>
      )}

      {/* KPIs */}
      <DashboardKPIs stats={stats ?? null} prevStats={null} isLoading={loadingStats} />


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
            <SkeletonChart height={280} />
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
            <SkeletonChart height={280} />
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
