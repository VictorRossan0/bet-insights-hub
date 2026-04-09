import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import { ArrowUpDown, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchStatsPorTime } from '@/services/supabase/statsService';
import { fetchStatsTeamForm } from '@/services/api/stats-views.api';
import type { StatsPorTime, StatsTeamForm } from '@/types/database';
import CasaForaStats from '@/components/CasaForaStats';

type SortKey = 'media_gols_jogo' | 'media_escanteios_jogo' | 'media_cartoes_jogo' | 'total_jogos';
type Tab = 'geral' | 'casa-fora' | 'forma';

const sortLabels: Record<SortKey, string> = {
  media_gols_jogo: 'Gols',
  media_escanteios_jogo: 'Escanteios',
  media_cartoes_jogo: 'Cartões',
  total_jogos: 'Jogos',
};

export default function Times() {
  const [sortBy, setSortBy] = useState<SortKey>('media_gols_jogo');
  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');
  const [tab, setTab] = useState<Tab>('geral');

  const { data: times, isLoading } = useQuery({
    queryKey: ['stats-por-time'],
    queryFn: fetchStatsPorTime,
  });

  const { data: teamForms } = useQuery({
    queryKey: ['stats-team-form'],
    queryFn: fetchStatsTeamForm,
  });

  const sorted = useMemo(() => {
    if (!times) return [];
    return [...times].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [times, sortBy]);

  const teamA = useMemo(() => times?.find(t => t.nome === compareA), [times, compareA]);
  const teamB = useMemo(() => times?.find(t => t.nome === compareB), [times, compareB]);

  const radarData = useMemo(() => {
    if (!teamA || !teamB || !times) return [];
    const maxGols = Math.max(...times.map(t => t.media_gols_jogo));
    const maxEsc = Math.max(...times.map(t => t.media_escanteios_jogo));
    const maxCart = Math.max(...times.map(t => t.media_cartoes_jogo));
    const maxJogos = Math.max(...times.map(t => t.total_jogos));

    return [
      { stat: 'Gols', A: (teamA.media_gols_jogo / maxGols) * 100, B: (teamB.media_gols_jogo / maxGols) * 100 },
      { stat: 'Escanteios', A: (teamA.media_escanteios_jogo / maxEsc) * 100, B: (teamB.media_escanteios_jogo / maxEsc) * 100 },
      { stat: 'Cartões', A: (teamA.media_cartoes_jogo / maxCart) * 100, B: (teamB.media_cartoes_jogo / maxCart) * 100 },
      { stat: 'Jogos', A: (teamA.total_jogos / maxJogos) * 100, B: (teamB.total_jogos / maxJogos) * 100 },
    ];
  }, [teamA, teamB, times]);

  const barChartData = useMemo(() => {
    if (!sorted.length) return [];
    return sorted.slice(0, 12).map(t => ({
      nome: t.nome.length > 12 ? t.nome.slice(0, 12) + '…' : t.nome,
      value: t[sortBy],
    }));
  }, [sorted, sortBy]);

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-2xl font-display tracking-wide">Estatísticas por Time</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Ranking e comparação entre equipes</p>
        <div className="flex gap-2 mt-4">
          {([['geral', 'Geral'], ['casa-fora', 'Casa / Fora'], ['forma', 'Forma']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                tab === key
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {tab === 'forma' ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="card-bet overflow-hidden"
        >
          <div className="p-4 border-b border-border flex items-center gap-2">
            <span className="text-sm">🔥</span>
            <h2 className="text-sm font-semibold">Classificação — Brasileirão 2026</h2>
          </div>
          <div className="overflow-auto">
            <table className="table-bet text-sm">
              <thead className="sticky top-0 bg-card z-10">
                <tr>
                  <th className="w-10">#</th>
                  <th>Time</th>
                  <th className="text-center">P</th>
                  <th className="text-center">J</th>
                  <th className="text-center">V</th>
                  <th className="text-center">E</th>
                  <th className="text-center">D</th>
                  <th className="text-center">GP/GC</th>
                  <th className="text-center">SG</th>
                  <th className="text-center">Esc.</th>
                  <th>Forma</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  if (!teamForms) return null;
                  const sorted = [...teamForms]
                    .map(t => ({
                      ...t,
                      pontos_total: t.vitorias * 3 + t.empates,
                      saldo_gols: Number(((t.media_gols_pro - t.media_gols_contra) * t.jogos).toFixed(0)),
                      gp: Number((t.media_gols_pro * t.jogos).toFixed(0)),
                      gc: Number((t.media_gols_contra * t.jogos).toFixed(0)),
                    }))
                    .sort((a, b) => b.pontos_total - a.pontos_total || b.saldo_gols - a.saldo_gols || b.vitorias - a.vitorias);
                  return sorted.map((t, i) => (
                    <tr key={t.team_id} className={i < 4 ? 'bg-primary/[0.04]' : i >= sorted.length - 4 ? 'bg-destructive/[0.04]' : ''}>
                      <td className="font-mono text-xs text-muted-foreground text-center">{i + 1}</td>
                      <td className="font-medium text-sm">{t.team_nome}</td>
                      <td className="text-center font-mono text-sm font-bold">{t.pontos_total}</td>
                      <td className="text-center font-mono text-sm">{t.jogos}</td>
                      <td className="text-center font-mono text-sm text-bet-green">{t.vitorias}</td>
                      <td className="text-center font-mono text-sm text-yellow-400">{t.empates}</td>
                      <td className="text-center font-mono text-sm text-destructive">{t.derrotas}</td>
                      <td className="text-center font-mono text-xs">{t.gp} / {t.gc}</td>
                      <td className={`text-center font-mono text-sm ${t.saldo_gols > 0 ? 'text-bet-green' : t.saldo_gols < 0 ? 'text-destructive' : ''}`}>{t.saldo_gols > 0 ? '+' : ''}{t.saldo_gols}</td>
                      <td className={`text-center font-mono text-sm ${t.media_escanteios >= 10 ? 'text-bet-green font-bold' : ''}`}>{t.media_escanteios.toFixed(1)}</td>
                      <td>
                        <div className="flex gap-0.5">
                          {t.forma_5jogos.split('').map((c, ci) => {
                            const color = c === 'W' ? 'bg-bet-green' : c === 'L' ? 'bg-destructive' : 'bg-yellow-500';
                            return <span key={ci} className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold text-white ${color}`}>{c}</span>;
                          })}
                        </div>
                      </td>
                      <td>
                        <Link to={`/times/${t.team_id}`} className="text-muted-foreground hover:text-foreground transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : tab === 'casa-fora' ? (
        <CasaForaStats />
      ) : (
      <>
      {/* Top Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="card-bet p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">📊 Top 12 — {sortLabels[sortBy]}</h2>
          <div className="flex gap-1.5">
            {(Object.keys(sortLabels) as SortKey[]).map(key => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors active:scale-95 ${
                  sortBy === key
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {sortLabels[key]}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="h-72 bg-secondary/30 rounded animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData} layout="vertical" margin={{ left: 8 }}>
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
                formatter={(val: number) => [val.toFixed(1), sortLabels[sortBy]]}
              />
              <Bar dataKey="value" fill="hsl(153 100% 50%)" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking Table */}
        <motion.div
          initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="card-bet overflow-hidden"
        >
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Users className="w-4 h-4 text-bet-green" />
            <h2 className="text-sm font-semibold">Ranking Completo</h2>
          </div>
          <div className="overflow-auto max-h-[480px] scrollbar-thin">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-8 bg-secondary rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <table className="table-bet">
                <thead className="sticky top-0 bg-card z-10">
                  <tr>
                    <th className="w-10">#</th>
                    <th>Time</th>
                    <th className="text-center">Jogos</th>
                    <th className="text-center">
                      <button onClick={() => setSortBy('media_gols_jogo')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                        Gols <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-center">
                      <button onClick={() => setSortBy('media_escanteios_jogo')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                        Esc. <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-center">
                      <button onClick={() => setSortBy('media_cartoes_jogo')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                        Cart. <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((t, i) => (
                    <tr key={t.sigla} className={i < 3 ? 'bg-primary/[0.03]' : ''}>
                      <td className="font-mono text-xs text-muted-foreground text-center">{i + 1}</td>
                      <td className="font-medium text-sm">{t.nome}</td>
                      <td className="text-center font-mono text-sm">{t.total_jogos}</td>
                      <td className="text-center font-mono text-sm text-bet-green">{t.media_gols_jogo.toFixed(1)}</td>
                      <td className="text-center font-mono text-sm">{t.media_escanteios_jogo.toFixed(1)}</td>
                      <td className="text-center font-mono text-sm">{t.media_cartoes_jogo.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="card-bet p-5"
        >
          <h2 className="text-sm font-semibold mb-4">⚔️ Comparar Times</h2>
          <div className="flex gap-3 mb-5">
            <select
              value={compareA}
              onChange={e => setCompareA(e.target.value)}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Selecionar time A</option>
              {times?.map(t => (
                <option key={t.sigla} value={t.nome}>{t.nome}</option>
              ))}
            </select>
            <select
              value={compareB}
              onChange={e => setCompareB(e.target.value)}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Selecionar time B</option>
              {times?.map(t => (
                <option key={t.sigla} value={t.nome}>{t.nome}</option>
              ))}
            </select>
          </div>

          {teamA && teamB ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(0 0% 14%)" />
                  <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11, fill: 'hsl(0 0% 75%)' }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar name={teamA.nome} dataKey="A" stroke="#00ff87" fill="#00ff87" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name={teamB.nome} dataKey="B" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.15} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </RadarChart>
              </ResponsiveContainer>

              {/* Side-by-side stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'Gols', a: teamA.media_gols_jogo, b: teamB.media_gols_jogo },
                  { label: 'Escanteios', a: teamA.media_escanteios_jogo, b: teamB.media_escanteios_jogo },
                  { label: 'Cartões', a: teamA.media_cartoes_jogo, b: teamB.media_cartoes_jogo },
                ].map(({ label, a, b }) => (
                  <div key={label} className="bg-secondary/50 rounded-lg p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className={`font-mono text-sm font-bold ${a > b ? 'text-bet-green' : 'text-muted-foreground'}`}>{a.toFixed(1)}</span>
                      <span className="text-[10px] text-muted-foreground">vs</span>
                      <span className={`font-mono text-sm font-bold ${b > a ? 'text-[#60a5fa]' : 'text-muted-foreground'}`}>{b.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Selecione dois times para comparar</p>
            </div>
          )}
        </motion.div>
      </div>
      </>
      )}
    </div>
  );
}
