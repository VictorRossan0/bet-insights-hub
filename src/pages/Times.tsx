import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, LineChart, Line, ReferenceLine } from 'recharts';
import { ArrowUpDown, Users, ExternalLink, TrendingUp, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchStatsPorTime } from '@/services/supabase/statsService';
import { fetchAllJogos } from '@/services/api/games.api';
import type { StatsPorTime } from '@/types/database';
import CasaForaStats from '@/components/CasaForaStats';
import { buildStandings, buildPositionEvolution } from '@/lib/standings';
import { TiebreakerBadge, TiebreakerLegend } from '@/components/standings/TiebreakerBadge';

type SortKey = 'media_gols_jogo' | 'media_escanteios_jogo' | 'media_cartoes_jogo' | 'total_jogos';
type Tab = 'geral' | 'casa-fora' | 'forma';
type ClassSortKey = 'pontos_total' | 'vitorias' | 'saldo_gols' | 'aproveitamento' | 'media_escanteios';

// Paleta para gráfico de evolução (10 cores semânticas-friendly)
const LINE_COLORS = [
  '#00ff87', '#60a5fa', '#fbbf24', '#f87171', '#c084fc',
  '#34d399', '#fb923c', '#f472b6', '#a3e635', '#22d3ee',
];

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
  const [classSortBy, setClassSortBy] = useState<ClassSortKey>('pontos_total');
  const [classSortAsc, setClassSortAsc] = useState(false);
  const [untilRodada, setUntilRodada] = useState<number | undefined>(undefined);
  const [evolutionTeams, setEvolutionTeams] = useState<string[]>([]);

  const { data: times, isLoading } = useQuery({
    queryKey: ['stats-por-time'],
    queryFn: fetchStatsPorTime,
  });

  // Buscar todos os jogos da temporada atual (id=1 = 2026) para calcular standings dinâmicos
  const { data: allJogos } = useQuery({
    queryKey: ['all-jogos', 1],
    queryFn: () => fetchAllJogos(1),
  });

  const allRounds = useMemo(() => {
    if (!allJogos) return [];
    return Array.from(new Set(allJogos.map(j => j.rodada))).sort((a, b) => a - b);
  }, [allJogos]);

  const standings = useMemo(() => {
    if (!allJogos) return [];
    return buildStandings(allJogos, untilRodada);
  }, [allJogos, untilRodada]);

  const evolution = useMemo(() => {
    if (!allJogos) return { rounds: [], series: {} };
    return buildPositionEvolution(allJogos);
  }, [allJogos]);

  // Dados formatados para o LineChart: [{ rodada, [time]: posicao, ... }]
  const evolutionChartData = useMemo(() => {
    if (!evolution.rounds.length || !evolutionTeams.length) return [];
    return evolution.rounds.map(r => {
      const row: Record<string, number> = { rodada: r };
      for (const team of evolutionTeams) {
        const point = evolution.series[team]?.find(p => p.rodada === r);
        if (point) row[team] = point.posicao;
      }
      return row;
    });
  }, [evolution, evolutionTeams]);

  const allTeamNames = useMemo(() => Object.keys(evolution.series).sort(), [evolution]);


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
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="card-bet overflow-hidden"
          >
            <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">🔥</span>
                <h2 className="text-sm font-semibold">
                  Classificação — Brasileirão 2026
                  {untilRodada != null && <span className="text-muted-foreground font-normal"> · até a rodada {untilRodada}</span>}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Até a rodada:</label>
                <select
                  value={untilRodada ?? ''}
                  onChange={(e) => setUntilRodada(e.target.value ? Number(e.target.value) : undefined)}
                  className="bg-secondary border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Todas (atual)</option>
                  {allRounds.map(r => (
                    <option key={r} value={r}>Rodada {r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-auto">
              <table className="table-bet text-sm">
                <thead className="sticky top-0 bg-card z-10">
                  <tr>
                    <th className="w-10">#</th>
                    <th>Time</th>
                    {([
                      ['pontos_total', 'P'],
                      [null, 'J'],
                      ['vitorias', 'V'],
                      [null, 'E'],
                      [null, 'D'],
                      [null, 'GP/GC'],
                      ['saldo_gols', 'SG'],
                      ['aproveitamento', '%'],
                      ['media_escanteios', 'Esc.'],
                    ] as const).map(([key, label]) => (
                      <th key={label} className="text-center">
                        {key ? (
                          <button
                            onClick={() => {
                              if (classSortBy === key) setClassSortAsc(!classSortAsc);
                              else { setClassSortBy(key as ClassSortKey); setClassSortAsc(false); }
                            }}
                            className={`inline-flex items-center gap-0.5 hover:text-foreground transition-colors ${classSortBy === key ? 'text-bet-green font-bold' : ''}`}
                          >
                            {label} <ArrowUpDown className="w-3 h-3" />
                          </button>
                        ) : label}
                      </th>
                    ))}
                    <th>Forma</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (!standings.length) return null;
                    const total = standings.length;
                    const sorted = [...standings].sort((a, b) => {
                      const dir = classSortAsc ? 1 : -1;
                      const diff = (a[classSortBy] as number) - (b[classSortBy] as number);
                      if (diff !== 0) return diff * dir;
                      return (b.pontos_total - a.pontos_total) || (b.vitorias - a.vitorias) || (b.saldo_gols - a.saldo_gols) || (b.gp - a.gp);
                    });

                    const getZoneStyle = (pos: number) => {
                      if (pos <= 4) return 'border-l-2 border-l-blue-500 bg-blue-500/[0.06]';
                      if (pos <= 6) return 'border-l-2 border-l-blue-400/60 bg-blue-400/[0.04]';
                      if (pos <= 12) return 'border-l-2 border-l-orange-400/60 bg-orange-400/[0.03]';
                      if (pos > total - 4) return 'border-l-2 border-l-red-500 bg-red-500/[0.06]';
                      return '';
                    };

                    const teamIdByName = new Map((times ?? []).map((t: StatsPorTime) => [t.nome, t.time_id]));

                    return sorted.map((t, i) => {
                      return (
                      <tr key={t.team_sigla} className={getZoneStyle(i + 1)}>
                        <td className="font-mono text-xs text-muted-foreground text-center">{i + 1}</td>
                        <td className="font-medium text-sm">
                          <div className="flex items-center gap-1.5">
                            <span>{t.team_nome}</span>
                            <TiebreakerBadge
                              kind={t.tiebreaker}
                              label={t.tiebreakerLabel}
                              steps={t.tiebreakerSteps}
                              tiedWith={t.tiedWith}
                            />
                          </div>
                        </td>
                        <td className="text-center font-mono text-sm font-bold">{t.pontos_total}</td>
                        <td className="text-center font-mono text-sm">{t.jogos}</td>
                        <td className="text-center font-mono text-sm text-bet-green">{t.vitorias}</td>
                        <td className="text-center font-mono text-sm text-yellow-400">{t.empates}</td>
                        <td className="text-center font-mono text-sm text-destructive">{t.derrotas}</td>
                        <td className="text-center font-mono text-xs">{t.gp} / {t.gc}</td>
                        <td className={`text-center font-mono text-sm ${t.saldo_gols > 0 ? 'text-bet-green' : t.saldo_gols < 0 ? 'text-destructive' : ''}`}>{t.saldo_gols > 0 ? '+' : ''}{t.saldo_gols}</td>
                        <td className="text-center font-mono text-sm">{t.aproveitamento}</td>
                        <td className={`text-center font-mono text-sm ${t.media_escanteios >= 10 ? 'text-bet-green font-bold' : ''}`}>{t.media_escanteios.toFixed(1)}</td>
                        <td>
                          <div className="flex gap-0.5">
                            {t.forma_5jogos.split('').map((c, ci) => {
                              const color = c === 'W' ? 'bg-bet-green' : c === 'L' ? 'bg-destructive' : c === 'D' ? 'bg-yellow-500' : 'bg-muted';
                              return <span key={ci} className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold text-white ${color}`}>{c === '-' ? '' : c}</span>;
                            })}
                          </div>
                        </td>
                        <td>
                          {teamIdByName.get(t.team_nome) != null && (
                            <Link to={`/times/${teamIdByName.get(t.team_nome)}`} className="text-muted-foreground hover:text-foreground transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </td>
                      </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
              <div className="flex flex-wrap gap-4 p-4 border-t border-border text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500" /> Libertadores</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-400/60" /> Pré-Libertadores</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-400/60" /> Sul-Americana</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500" /> Rebaixamento</span>
                <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded border bg-bet-green/15 text-bet-green border-bet-green/30 text-[9px] font-bold">H2H</span> Confronto direto aplicado</span>
                <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded border bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-[9px] font-bold">Critérios</span> Sem confronto direto (3+ empatados)</span>
                <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded border bg-destructive/15 text-destructive border-destructive/30 text-[9px] font-bold">=</span> Empate persistente após H2H</span>
              </div>
            </div>
          </motion.div>

          {/* Gráfico de Evolução de Posição */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="card-bet p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-bet-green" />
              <h2 className="text-sm font-semibold">Evolução de Posição por Rodada</h2>
            </div>

            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-2 block">
                Selecione times para comparar ({evolutionTeams.length} selecionados — máx. 10)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {evolutionTeams.map(team => (
                  <button
                    key={team}
                    onClick={() => setEvolutionTeams(evolutionTeams.filter(t => t !== team))}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-bet-green/15 text-bet-green text-xs hover:bg-bet-green/25 transition-colors"
                  >
                    {team} <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
              <select
                value=""
                onChange={(e) => {
                  const v = e.target.value;
                  if (v && !evolutionTeams.includes(v) && evolutionTeams.length < 10) {
                    setEvolutionTeams([...evolutionTeams, v]);
                  }
                }}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">+ Adicionar time...</option>
                {allTeamNames.filter(t => !evolutionTeams.includes(t)).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {evolutionTeams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <TrendingUp className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">Selecione 2-10 times para ver a evolução</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={evolutionChartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" />
                  <XAxis
                    dataKey="rodada"
                    tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }}
                    label={{ value: 'Rodada', position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: 'hsl(0 0% 55%)' } }}
                  />
                  <YAxis
                    reversed
                    domain={[1, 20]}
                    ticks={[1, 4, 6, 12, 16, 20]}
                    tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }}
                    label={{ value: 'Posição', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'hsl(0 0% 55%)' } }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(0 0% 7%)',
                      border: '1px solid hsl(0 0% 14%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: number) => [`${val}º`, '']}
                    labelFormatter={(l) => `Rodada ${l}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {/* Linhas de zona — entre as posições */}
                  <ReferenceLine y={4.5} stroke="#3b82f6" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: 'Libertadores', position: 'insideTopRight', fill: '#3b82f6', fontSize: 9 }} />
                  <ReferenceLine y={6.5} stroke="#60a5fa" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Pré-Lib.', position: 'insideTopRight', fill: '#60a5fa', fontSize: 9 }} />
                  <ReferenceLine y={12.5} stroke="#fb923c" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Sul-Americana', position: 'insideTopRight', fill: '#fb923c', fontSize: 9 }} />
                  <ReferenceLine y={16.5} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: 'Rebaixamento', position: 'insideTopRight', fill: '#ef4444', fontSize: 9 }} />
                  {evolutionTeams.map((team, idx) => (
                    <Line
                      key={team}
                      type="monotone"
                      dataKey={team}
                      stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>
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
