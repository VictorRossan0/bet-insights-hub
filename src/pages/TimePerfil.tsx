import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { rpcGetTeamForm, rpcCalculateMarketProbability, fetchStatsTeamForm } from '@/services/api/stats-views.api';
import type { MarketProbabilityRow, StatsTeamForm } from '@/types/database';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

function FormaBadge({ forma }: { forma: string }) {
  return (
    <div className="flex gap-1">
      {forma.split('').map((c, i) => {
        const color = c === 'W' ? 'bg-bet-green' : c === 'L' ? 'bg-destructive' : 'bg-yellow-500';
        return (
          <span key={i} className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold text-white ${color}`}>
            {c}
          </span>
        );
      })}
    </div>
  );
}

function ConfidenceBadge({ level }: { level: string }) {
  const cls = level === 'HIGH'
    ? 'bg-bet-green/15 text-bet-green'
    : level === 'MEDIUM'
      ? 'bg-yellow-500/15 text-yellow-400'
      : 'bg-destructive/15 text-destructive';
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{level}</span>;
}

export default function TimePerfil() {
  const { id } = useParams<{ id: string }>();
  const teamId = Number(id);

  const { data: teamForm } = useQuery({
    queryKey: ['stats-team-form'],
    queryFn: fetchStatsTeamForm,
  });

  const { data: formGames } = useQuery({
    queryKey: ['team-form-rpc', teamId],
    queryFn: () => rpcGetTeamForm(teamId, 10),
    enabled: !!teamId,
  });

  const { data: marketProb, isLoading: loadingMarket } = useQuery({
    queryKey: ['market-probability', teamId],
    queryFn: () => rpcCalculateMarketProbability(teamId),
    enabled: !!teamId,
  });

  const team = teamForm?.find((t: StatsTeamForm) => t.team_id === teamId);

  return (
    <div className="page-container space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <Link to="/times" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <h1 className="text-2xl font-display tracking-wide">{team?.team_nome ?? `Time #${teamId}`}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{team?.team_sigla ?? ''} — Perfil detalhado</p>
      </motion.div>

      {/* Team Stats Overview */}
      {team && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="card-bet p-4">
            <p className="text-xs text-muted-foreground mb-1">Jogos</p>
            <p className="text-2xl font-bold font-mono">{team.jogos}</p>
          </div>
          <div className="card-bet p-4">
            <p className="text-xs text-muted-foreground mb-1">V / E / D</p>
            <p className="text-lg font-bold font-mono">
              <span className="text-bet-green">{team.vitorias}</span>
              {' / '}
              <span className="text-yellow-400">{team.empates}</span>
              {' / '}
              <span className="text-destructive">{team.derrotas}</span>
            </p>
          </div>
          <div className="card-bet p-4">
            <p className="text-xs text-muted-foreground mb-1">Gols Pró / Contra</p>
            <p className="text-lg font-bold font-mono">
              {team.media_gols_pro.toFixed(1)} / {team.media_gols_contra.toFixed(1)}
            </p>
          </div>
          <div className="card-bet p-4">
            <p className="text-xs text-muted-foreground mb-1">Média Escanteios</p>
            <p className={`text-2xl font-bold font-mono ${team.media_escanteios >= 10 ? 'text-bet-green' : ''}`}>
              {team.media_escanteios.toFixed(1)}
            </p>
          </div>
        </motion.div>
      )}

      {/* Forma Recente */}
      {team && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease }}
          className="card-bet p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">🔥 Forma Recente (Últimos 5)</h2>
            <span className="text-xs text-muted-foreground font-mono">{team.pontos_ultimos5} pts</span>
          </div>
          <FormaBadge forma={team.forma_5jogos} />
        </motion.div>
      )}

      {/* Market Probabilities */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease }}
        className="card-bet p-5"
      >
        <h2 className="text-sm font-semibold mb-4">📊 Probabilidades por Mercado</h2>
        {loadingMarket ? (
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-8 bg-secondary rounded animate-pulse" />
            ))}
          </div>
        ) : marketProb && marketProb.length > 0 ? (
          <div className="space-y-3">
            {marketProb.map((m: MarketProbabilityRow) => {
              const prob = m.probabilidade ?? 0;
              const barColor = prob >= 80 ? 'bg-bet-green' : prob >= 60 ? 'bg-yellow-500' : 'bg-destructive';
              return (
                <div key={m.mercado} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-32 shrink-0">{m.mercado}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${prob}%` }} />
                  </div>
                  <span className="text-xs font-mono w-12 text-right">{prob?.toFixed(0) ?? '—'}%</span>
                  <ConfidenceBadge level={m.confianca} />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Dados insuficientes para este time</p>
        )}
      </motion.div>

      {/* Recent Games from RPC */}
      {formGames && formGames.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease }}
          className="card-bet overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold">📋 Últimos Jogos</h2>
          </div>
          <div className="overflow-auto max-h-[400px]">
            <table className="table-bet text-sm">
              <thead className="sticky top-0 bg-card">
                <tr>
                  <th>Rodada</th>
                  <th>Data</th>
                  <th>Adversário</th>
                  <th className="text-center">Placar</th>
                  <th className="text-center">Esc.</th>
                  <th className="text-center">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {formGames.map((g: any, i: number) => (
                  <tr key={i}>
                    <td className="font-mono text-xs">{g.rodada}</td>
                    <td className="text-xs text-muted-foreground">{g.data_jogo}</td>
                    <td className="text-xs">{g.adversario ?? '—'}</td>
                    <td className="text-center font-mono text-xs">
                      {g.gols_pro ?? '?'} x {g.gols_contra ?? '?'}
                    </td>
                    <td className="text-center font-mono text-xs">{g.escanteios_total ?? '—'}</td>
                    <td className="text-center">
                      {g.resultado === 'V' ? (
                        <TrendingUp className="w-4 h-4 text-bet-green inline" />
                      ) : g.resultado === 'D' ? (
                        <TrendingDown className="w-4 h-4 text-destructive inline" />
                      ) : (
                        <Minus className="w-4 h-4 text-yellow-500 inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
