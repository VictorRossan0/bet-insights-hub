import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Swords, TrendingUp, AlertTriangle, Check, X, BarChart3 } from 'lucide-react';
import { fetchTimes } from '@/services/supabase/jogosService';
import { fetchStatsH2H, fetchStatsCasaFora } from '@/services/supabase/statsService';
import { fetchStatsH2HEnhanced } from '@/services/api/stats-views.api';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];
const anim = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease } };

export default function Confronto() {
  const [timeAId, setTimeAId] = useState<number | null>(null);
  const [timeBId, setTimeBId] = useState<number | null>(null);

  const { data: times } = useQuery({ queryKey: ['times'], queryFn: fetchTimes });

  const { data: h2h, isLoading: h2hLoading } = useQuery({
    queryKey: ['h2h', timeAId, timeBId],
    queryFn: () => fetchStatsH2H(timeAId!, timeBId!),
    enabled: !!timeAId && !!timeBId && timeAId !== timeBId,
  });

  const { data: casaFora } = useQuery({
    queryKey: ['stats-casa-fora'],
    queryFn: fetchStatsCasaFora,
    enabled: !!timeAId && !!timeBId,
  });

  const timeA = useMemo(() => times?.find(t => t.id === timeAId), [times, timeAId]);
  const timeB = useMemo(() => times?.find(t => t.id === timeBId), [times, timeBId]);

  const cfA = useMemo(() => casaFora?.find(c => c.nome === timeA?.nome), [casaFora, timeA]);
  const cfB = useMemo(() => casaFora?.find(c => c.nome === timeB?.nome), [casaFora, timeB]);

  const radarData = useMemo(() => {
    if (!h2h) return [];
    return [
      { stat: 'Gols', value: h2h.media_gols },
      { stat: 'Escanteios', value: h2h.media_escanteios },
      { stat: 'Cartões', value: h2h.media_cartoes },
      { stat: 'Total Jogos', value: h2h.total_jogos },
    ];
  }, [h2h]);

  // Recommendation logic based on available data
  const recommendation = useMemo(() => {
    if (!h2h || !cfA || !cfB) return null;

    const signals: { label: string; positive: boolean }[] = [];

    // H2H corner signal based on average
    if (h2h.media_escanteios >= 10) signals.push({ label: `Média Escanteios H2H: ${h2h.media_escanteios.toFixed(1)}`, positive: true });
    else signals.push({ label: `Média Escanteios H2H: ${h2h.media_escanteios.toFixed(1)}`, positive: false });

    // Goals signal
    if (h2h.media_gols <= 3.5) signals.push({ label: `Média Gols H2H: ${h2h.media_gols.toFixed(2)} (U3.5 favorável)`, positive: true });
    else signals.push({ label: `Média Gols H2H: ${h2h.media_gols.toFixed(2)} (U3.5 desfavorável)`, positive: false });

    // Casa/fora corners
    const avgEsc = (cfA.media_esc_casa + cfB.media_esc_fora) / 2;
    if (avgEsc >= 10) signals.push({ label: `Média Esc Casa/Fora: ${avgEsc.toFixed(1)}`, positive: true });
    else signals.push({ label: `Média Esc Casa/Fora: ${avgEsc.toFixed(1)}`, positive: false });

    // Cards signal
    if (h2h.media_cartoes >= 4) signals.push({ label: `Média Cartões H2H: ${h2h.media_cartoes.toFixed(1)}`, positive: true });
    else signals.push({ label: `Média Cartões H2H: ${h2h.media_cartoes.toFixed(1)}`, positive: false });

    const positives = signals.filter(s => s.positive).length;
    const verdict = positives >= 3 ? 'APOSTAR' : positives >= 2 ? 'CAUTELOSO' : 'EVITAR';

    return { signals, verdict, positives, total: signals.length };
  }, [h2h, cfA, cfB]);

  const bothSelected = timeAId && timeBId && timeAId !== timeBId;

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <motion.div {...anim}>
        <h1 className="text-2xl font-display tracking-wide">Confronto H2H</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Análise de confrontos diretos entre dois times</p>
      </motion.div>

      {/* Team Selectors */}
      <motion.div {...anim} transition={{ ...anim.transition, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-center"
      >
        <select
          value={timeAId ?? ''}
          onChange={e => setTimeAId(e.target.value ? Number(e.target.value) : null)}
          className="bg-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Selecione o Time A</option>
          {times?.filter(t => t.id !== timeBId).map(t => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </select>

        <div className="flex justify-center">
          <Swords className="w-6 h-6 text-bet-green" />
        </div>

        <select
          value={timeBId ?? ''}
          onChange={e => setTimeBId(e.target.value ? Number(e.target.value) : null)}
          className="bg-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Selecione o Time B</option>
          {times?.filter(t => t.id !== timeAId).map(t => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </select>
      </motion.div>

      {/* Content */}
      {!bothSelected && (
        <motion.div {...anim} transition={{ ...anim.transition, delay: 0.2 }}
          className="card-bet p-8 flex flex-col items-center justify-center min-h-[250px]"
        >
          <Swords className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">Selecione dois times para ver o confronto direto</p>
        </motion.div>
      )}

      {bothSelected && h2hLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {bothSelected && !h2hLoading && !h2h && (
        <motion.div {...anim} transition={{ ...anim.transition, delay: 0.2 }}
          className="card-bet p-8 flex flex-col items-center justify-center min-h-[250px]"
        >
          <AlertTriangle className="w-10 h-10 text-yellow-500/60 mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum confronto encontrado entre esses times</p>
        </motion.div>
      )}

      {bothSelected && h2h && (
        <div className="space-y-6">
          {/* H2H Stats Cards */}
          <motion.div {...anim} transition={{ ...anim.transition, delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            <StatCard label="Total Jogos" value={h2h.total_jogos} />
            <StatCard label="Média Gols" value={h2h.media_gols.toFixed(2)} />
            <StatCard label="Média Escanteios" value={h2h.media_escanteios.toFixed(1)} highlight={h2h.media_escanteios >= 10} />
            <StatCard label="Média Cartões" value={h2h.media_cartoes.toFixed(1)} />
          </motion.div>

          {/* Radar Chart */}
          <motion.div {...anim} transition={{ ...anim.transition, delay: 0.3 }}
            className="card-bet p-5"
          >
            <h3 className="text-sm font-semibold mb-4">
              📊 Perfil do Confronto
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="stat" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Radar
                    dataKey="value"
                    stroke="hsl(var(--bet-green))"
                    fill="hsl(var(--bet-green))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Casa/Fora Comparison */}
          {cfA && cfB && (
            <motion.div {...anim} transition={{ ...anim.transition, delay: 0.35 }}
              className="card-bet p-5"
            >
              <h3 className="text-sm font-semibold mb-4">🏠 Mando de Campo</h3>
              <div className="overflow-x-auto">
                <table className="table-bet text-sm">
                  <thead>
                    <tr className="bg-secondary/30">
                      <th>Métrica</th>
                      <th className="text-center">{timeA?.nome} (Casa)</th>
                      <th className="text-center">{timeB?.nome} (Fora)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <CompareRow label="Jogos" a={cfA.jogos_casa} b={cfB.jogos_fora} />
                    <CompareRow label="Média Gols" a={cfA.media_gols_casa} b={cfB.media_gols_fora} decimals={2} />
                    <CompareRow label="Média Escanteios" a={cfA.media_esc_casa} b={cfB.media_esc_fora} decimals={1} />
                    <CompareRow label="Média Cartões" a={cfA.media_cart_casa} b={cfB.media_cart_fora} decimals={1} />
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Recommendation */}
          {recommendation && (
            <motion.div {...anim} transition={{ ...anim.transition, delay: 0.4 }}
              className={`card-bet p-5 border-l-4 ${
                recommendation.verdict === 'APOSTAR'
                  ? 'border-l-green-500'
                  : recommendation.verdict === 'CAUTELOSO'
                    ? 'border-l-yellow-500'
                    : 'border-l-red-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className={`w-5 h-5 ${
                  recommendation.verdict === 'APOSTAR' ? 'text-green-500' : recommendation.verdict === 'CAUTELOSO' ? 'text-yellow-500' : 'text-red-500'
                }`} />
                <h3 className="text-sm font-semibold">Recomendação Automática</h3>
                <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                  recommendation.verdict === 'APOSTAR'
                    ? 'bg-green-500/20 text-green-400'
                    : recommendation.verdict === 'CAUTELOSO'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                }`}>
                  {recommendation.verdict}
                </span>
              </div>
              <div className="space-y-2">
                {recommendation.signals.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {s.positive
                      ? <Check className="w-4 h-4 text-green-400 shrink-0" />
                      : <X className="w-4 h-4 text-red-400 shrink-0" />}
                    <span className="text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {recommendation.positives}/{recommendation.total} sinais positivos — baseado em H2H + mando de campo
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="card-bet p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-mono font-bold ${highlight ? 'text-bet-green' : ''}`}>{value}</p>
    </div>
  );
}

function CompareRow({ label, a, b, decimals = 0 }: { label: string; a: number; b: number; decimals?: number }) {
  const fmtA = decimals ? a.toFixed(decimals) : a;
  const fmtB = decimals ? b.toFixed(decimals) : b;
  return (
    <tr>
      <td className="text-muted-foreground">{label}</td>
      <td className={`text-center font-mono ${a > b ? 'text-bet-green font-bold' : ''}`}>{fmtA}</td>
      <td className={`text-center font-mono ${b > a ? 'text-bet-green font-bold' : ''}`}>{fmtB}</td>
    </tr>
  );
}
