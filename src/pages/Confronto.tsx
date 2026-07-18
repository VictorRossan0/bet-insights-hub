import SEO from "@/components/SEO";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Swords, TrendingUp, AlertTriangle, Check, X } from "lucide-react";
import { SkeletonRadar, SkeletonTable } from "@/components/ui/skeleton-loaders";
import EmptyState from "@/components/ui/empty-state";
import { VerdictBadge } from "@/components/ui/confidence-badge";
import VerdictStamp from "@/components/ui/verdict-stamp";
import { fetchTimes } from "@/services/api/teams.api";
import {
  computeStatsH2H as fetchStatsH2H,
  computeStatsCasaFora as fetchStatsCasaFora,
} from "@/services/domain/stats.service";
import {
  fetchStatsH2HEnhanced,
  rpcGetH2HEscanteiosRecente,
  rpcGetFormaEscanteiosRecente,
  rpcGetConfigCantosLiga,
} from "@/services/api/stats-views.api";
import {
  getProbabilidadeOver25Gols,
  getProbabilidadeOver7Cartoes,
  getPosicaoAtual,
} from "@/services/domain/poisson.service";
import { calculateOver9CantosRecommendation } from "@/services/domain/betting.service";
import { useLiga } from "@/contexts/LigaContext";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];
const anim = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease } };

export default function Confronto() {
  const [timeAId, setTimeAId] = useState<number | null>(null);
  const [timeBId, setTimeBId] = useState<number | null>(null);
  const { temporadaAtualId, ligaAtual } = useLiga();

  const { data: times } = useQuery({
    queryKey: ["times", ligaAtual?.id],
    queryFn: () => fetchTimes(ligaAtual!.id),
    enabled: !!ligaAtual,
  });

  const { data: h2hLegacy, isLoading: h2hLegacyLoading } = useQuery({
    queryKey: ["h2h", timeAId, timeBId],
    queryFn: () => fetchStatsH2H(timeAId!, timeBId!),
    enabled: !!timeAId && !!timeBId && timeAId !== timeBId,
  });

  const { data: h2hEnhanced, isLoading: h2hEnhancedLoading } = useQuery({
    queryKey: ["h2h-enhanced", timeAId, timeBId],
    queryFn: () => fetchStatsH2HEnhanced(timeAId!, timeBId!),
    enabled: !!timeAId && !!timeBId && timeAId !== timeBId,
  });

  const { data: casaFora } = useQuery({
    queryKey: ["stats-casa-fora", temporadaAtualId],
    queryFn: () => fetchStatsCasaFora(temporadaAtualId!),
    enabled: !!timeAId && !!timeBId && !!temporadaAtualId,
  });

  // Forma recente (RPCs) — para o filtro de confirmação do Over 9 Cantos
  const { data: h2hEscRecente } = useQuery({
    queryKey: ["h2h-esc-recente", timeAId, timeBId],
    queryFn: () => rpcGetH2HEscanteiosRecente(timeAId!, timeBId!),
    enabled: !!timeAId && !!timeBId && timeAId !== timeBId,
  });
  const { data: formaEscCasaA } = useQuery({
    queryKey: ["forma-esc-recente", timeAId, "casa"],
    queryFn: () => rpcGetFormaEscanteiosRecente(timeAId!, "casa"),
    enabled: !!timeAId,
  });
  const { data: formaEscForaB } = useQuery({
    queryKey: ["forma-esc-recente", timeBId, "fora"],
    queryFn: () => rpcGetFormaEscanteiosRecente(timeBId!, "fora"),
    enabled: !!timeBId,
  });

  // Poisson: Gols e Cartões (timeA como casa, timeB como fora)
  const { data: poissonGols } = useQuery({
    queryKey: ["poisson-gols", timeAId, timeBId],
    queryFn: () => getProbabilidadeOver25Gols(timeAId!, timeBId!),
    enabled: !!timeAId && !!timeBId && timeAId !== timeBId,
  });
  const { data: poissonCartoes } = useQuery({
    queryKey: ["poisson-cartoes", timeAId, timeBId],
    queryFn: () => getProbabilidadeOver7Cartoes(timeAId!, timeBId!),
    enabled: !!timeAId && !!timeBId && timeAId !== timeBId,
  });

  const { data: posicaoA } = useQuery({
    queryKey: ["posicao-atual", timeAId, temporadaAtualId],
    queryFn: () => getPosicaoAtual(timeAId!, temporadaAtualId!),
    enabled: !!timeAId && !!temporadaAtualId,
  });
  const { data: posicaoB } = useQuery({
    queryKey: ["posicao-atual", timeBId, temporadaAtualId],
    queryFn: () => getPosicaoAtual(timeBId!, temporadaAtualId!),
    enabled: !!timeBId && !!temporadaAtualId,
  });

  const duploZ4 = !!posicaoA && !!posicaoB && posicaoA > 16 && posicaoB > 16;

  const { data: cantosLigaConfig } = useQuery({
    queryKey: ["config-cantos-liga", timeAId],
    queryFn: () => rpcGetConfigCantosLiga(timeAId!),
    enabled: !!timeAId,
  });

  const timeA = useMemo(() => times?.find((t) => t.id === timeAId), [times, timeAId]);
  const timeB = useMemo(() => times?.find((t) => t.id === timeBId), [times, timeBId]);

  const cfA = useMemo(() => {
    const base = casaFora?.find((c) => c.nome === timeA?.nome);
    if (!base) return base;
    return { ...base, media_esc_recente: formaEscCasaA ?? undefined };
  }, [casaFora, timeA, formaEscCasaA]);
  const cfB = useMemo(() => {
    const base = casaFora?.find((c) => c.nome === timeB?.nome);
    if (!base) return base;
    return { ...base, media_esc_recente: formaEscForaB ?? undefined };
  }, [casaFora, timeB, formaEscForaB]);

  // Merge: prefer h2hEnhanced (SQL view) over legacy client-side h2h
  const enhancedRow = h2hEnhanced?.[0] ?? null;
  const h2h = useMemo(() => {
    const base = h2hLegacy
      ? h2hLegacy
      : enhancedRow
        ? {
            time_a_id: enhancedRow.time_a_id,
            time_b_id: enhancedRow.time_b_id,
            time_a_nome: enhancedRow.time_a_nome,
            time_b_nome: enhancedRow.time_b_nome,
            total_jogos: enhancedRow.total_jogos,
            media_gols: enhancedRow.media_gols,
            media_escanteios: enhancedRow.media_esc,
            media_cartoes: enhancedRow.media_cart,
          }
        : null;
    if (!base) return null;
    return { ...base, media_escanteios_recente: h2hEscRecente ?? undefined };
  }, [h2hLegacy, enhancedRow, h2hEscRecente]);

  const h2hLoading = h2hLegacyLoading && h2hEnhancedLoading;

  const radarData = useMemo(() => {
    if (!h2h) return [];
    return [
      { stat: "Gols", value: h2h.media_gols },
      { stat: "Escanteios", value: h2h.media_escanteios },
      { stat: "Cartões", value: h2h.media_cartoes },
      { stat: "Total Jogos", value: h2h.total_jogos },
    ];
  }, [h2h]);

  // Recommendation logic based on available data
  const recommendation = useMemo(() => {
    if (!h2h || !cfA || !cfB) return null;

    const signals: { label: string; positive: boolean }[] = [];

    // H2H corner signal based on average
    if (h2h.media_escanteios >= 10)
      signals.push({ label: `Média Escanteios H2H: ${h2h.media_escanteios.toFixed(1)}`, positive: true });
    else signals.push({ label: `Média Escanteios H2H: ${h2h.media_escanteios.toFixed(1)}`, positive: false });

    // Goals signal
    if (h2h.media_gols <= 3.5)
      signals.push({ label: `Média Gols H2H: ${h2h.media_gols.toFixed(2)} (U3.5 favorável)`, positive: true });
    else signals.push({ label: `Média Gols H2H: ${h2h.media_gols.toFixed(2)} (U3.5 desfavorável)`, positive: false });

    // Casa/fora corners
    const avgEsc = (cfA.media_esc_casa + cfB.media_esc_fora) / 2;
    if (avgEsc >= 10) signals.push({ label: `Média Esc Casa/Fora: ${avgEsc.toFixed(1)}`, positive: true });
    else signals.push({ label: `Média Esc Casa/Fora: ${avgEsc.toFixed(1)}`, positive: false });

    // Cards signal
    if (h2h.media_cartoes >= 4)
      signals.push({ label: `Média Cartões H2H: ${h2h.media_cartoes.toFixed(1)}`, positive: true });
    else signals.push({ label: `Média Cartões H2H: ${h2h.media_cartoes.toFixed(1)}`, positive: false });

    const positives = signals.filter((s) => s.positive).length;
    const verdict = positives >= 3 ? "APOSTAR" : positives >= 2 ? "CAUTELOSO" : "EVITAR";

    return { signals, verdict, positives, total: signals.length };
  }, [h2h, cfA, cfB]);

  const over9Reco = useMemo(() => {
    if (!h2h || !cfA || !cfB) return null;
    return calculateOver9CantosRecommendation(h2h, cfA, cfB);
  }, [h2h, cfA, cfB]);

  const bothSelected = timeAId && timeBId && timeAId !== timeBId;

  return (
    <div className="page-container space-y-6">
      <SEO
        title="Confronto H2H"
        description={`Comparação histórica entre dois clubes${ligaAtual?.nome ? ` do ${ligaAtual.nome}` : ""}: estatísticas, mando de campo e recomendação automática.`}
        path="/confronto"
      />
      {/* Header */}
      <motion.div {...anim}>
        <h1 className="text-2xl font-display tracking-wide">Confronto H2H</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Análise de confrontos diretos entre dois times</p>
      </motion.div>

      {/* Team Selectors */}
      <motion.div
        {...anim}
        transition={{ ...anim.transition, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-center"
      >
        <select
          value={timeAId ?? ""}
          onChange={(e) => setTimeAId(e.target.value ? Number(e.target.value) : null)}
          className="bg-secondary text-secondary-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Selecione o Time A</option>
          {times
            ?.filter((t) => t.id !== timeBId)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
        </select>

        <div className="flex justify-center">
          <Swords className="w-6 h-6 text-bet-green" />
        </div>

        <select
          value={timeBId ?? ""}
          onChange={(e) => setTimeBId(e.target.value ? Number(e.target.value) : null)}
          className="bg-secondary text-secondary-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Selecione o Time B</option>
          {times
            ?.filter((t) => t.id !== timeAId)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
        </select>
      </motion.div>

      {bothSelected && duploZ4 && (
        <motion.div
          {...anim}
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 flex items-start gap-2"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Duelo direto na zona de rebaixamento</strong> — historicamente: −14% gols, +12% escanteios nesse
            cenário.
          </span>
        </motion.div>
      )}

      {/* Content */}

      {!bothSelected && (
        <EmptyState
          icon={Swords}
          title="Selecione dois times"
          description="Escolha os times acima para ver o confronto direto, estatísticas e recomendações automáticas."
        />
      )}

      {bothSelected && h2hLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-bet p-4 space-y-2">
                <div className="h-3 w-20 bg-secondary/60 rounded animate-pulse" />
                <div className="h-6 w-14 bg-secondary/60 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="card-bet p-5">
            <SkeletonRadar />
          </div>
        </div>
      )}

      {bothSelected && !h2hLoading && !h2h && (
        <EmptyState
          icon={AlertTriangle}
          title="Nenhum confronto encontrado"
          description="Não há registros de partidas entre esses dois times na base de dados."
        />
      )}

      {bothSelected && h2h && (
        <div className="space-y-6">
          {/* H2H Stats Cards */}
          <motion.div
            {...anim}
            transition={{ ...anim.transition, delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            <StatCard label="Total Jogos" value={h2h.total_jogos} />
            <StatCard label="Média Gols" value={h2h.media_gols.toFixed(2)} />
            <StatCard
              label="Média Escanteios"
              value={h2h.media_escanteios.toFixed(1)}
              highlight={h2h.media_escanteios >= 10}
            />
            <StatCard label="Média Cartões" value={h2h.media_cartoes.toFixed(1)} />
          </motion.div>

          {/* Poisson Markets */}
          {(poissonGols || poissonCartoes) && (
            <motion.div
              {...anim}
              transition={{ ...anim.transition, delay: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {poissonGols && (
                <div className="card-bet p-4">
                  <p className="text-xs text-muted-foreground mb-1">Over 2.5 Gols (Poisson)</p>
                  <p className="text-xl font-mono font-bold text-bet-green">{poissonGols.probabilidade.toFixed(1)}%</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    λ = {poissonGols.lambda.toFixed(2)} gols esperados
                  </p>
                </div>
              )}
              {poissonCartoes && (
                <div className="card-bet p-4">
                  <p className="text-xs text-muted-foreground mb-1">Over 7 Cartões (Poisson)</p>
                  <p className="text-xl font-mono font-bold text-bet-green">
                    {poissonCartoes.probabilidade.toFixed(1)}%
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    λ = {poissonCartoes.lambda.toFixed(2)} cartões esperados
                  </p>
                  {poissonCartoes.arbitro && (
                    <p className="text-[11px] text-amber-400/90 mt-1">
                      Árbitro confirmado: {poissonCartoes.arbitro} (ajustado ao seu histórico)
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Radar Chart */}
          <motion.div {...anim} transition={{ ...anim.transition, delay: 0.3 }} className="card-bet p-5">
            <h2 className="text-sm font-semibold mb-4">📊 Perfil do Confronto</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="stat" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
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
            <motion.div {...anim} transition={{ ...anim.transition, delay: 0.35 }} className="card-bet p-5">
              <h2 className="text-sm font-semibold mb-4">🏠 Mando de Campo</h2>
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

          {/* Over 9 Cantos — recomendação recalibrada com gate por liga */}
          {over9Reco &&
            (cantosLigaConfig && cantosLigaConfig.mostra_recomendacao === false ? (
              <motion.div
                {...anim}
                transition={{ ...anim.transition, delay: 0.38 }}
                className="card-bet p-4 border border-dashed border-border/60 text-xs text-muted-foreground"
              >
                Sinal de escanteios ainda não calibrado com confiança pra {cantosLigaConfig.liga_nome}.
              </motion.div>
            ) : (
              <motion.div
                {...anim}
                transition={{ ...anim.transition, delay: 0.38 }}
                className={`card-bet p-5 border-l-4 ${
                  over9Reco.verdict === "APOSTAR" ? "border-l-green-500" : "border-l-red-500"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp
                    className={`w-5 h-5 ${over9Reco.verdict === "APOSTAR" ? "text-green-500" : "text-red-500"}`}
                  />
                  <h2 className="text-sm font-semibold">Over 9 Cantos — Recomendação (H2H)</h2>
                  <span className="ml-auto flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {over9Reco.confidence}% ({over9Reco.confidenceLevel})
                    </span>
                    <VerdictBadge verdict={over9Reco.verdict} />
                  </span>
                </div>
                <div className="space-y-2">
                  {over9Reco.signals.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {s.positive ? (
                        <Check className="w-4 h-4 text-green-400 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span className="text-muted-foreground">{s.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Baseado apenas na média de escanteios do H2H direto (amostra maior, generaliza melhor entre ligas).
                </p>
              </motion.div>
            ))}

          {/* Recommendation */}
          {recommendation && (
            <motion.div
              {...anim}
              transition={{ ...anim.transition, delay: 0.4 }}
              className={`card-bet p-5 border-l-4 ${
                recommendation.verdict === "APOSTAR"
                  ? "border-l-green-500"
                  : recommendation.verdict === "CAUTELOSO"
                    ? "border-l-yellow-500"
                    : "border-l-red-500"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp
                  className={`w-5 h-5 ${
                    recommendation.verdict === "APOSTAR"
                      ? "text-green-500"
                      : recommendation.verdict === "CAUTELOSO"
                        ? "text-yellow-500"
                        : "text-red-500"
                  }`}
                />
                <h2 className="text-sm font-semibold">Recomendação Automática</h2>
                <span className="ml-auto">
                  <VerdictBadge verdict={recommendation.verdict} />
                </span>
              </div>
              <div className="space-y-2">
                {recommendation.signals.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {s.positive ? (
                      <Check className="w-4 h-4 text-green-400 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className="text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {recommendation.positives}/{recommendation.total} sinais positivos — baseado em H2H + mando de campo
              </p>
            </motion.div>
          )}

          {/* H2H Enhanced (SQL View) */}
          {h2hEnhanced && h2hEnhanced.length > 0 && (
            <motion.div {...anim} transition={{ ...anim.transition, delay: 0.45 }} className="card-bet p-5">
              <h2 className="text-sm font-semibold mb-4">📈 Análise Avançada (SQL)</h2>
              {h2hEnhanced.map((row, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] uppercase tracking-wider text-white/60 mb-1">O5 Cantos</p>
                      <p className="font-mono font-bold" style={{ color: "#34d399" }}>
                        {row.pct_o5.toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] uppercase tracking-wider text-white/60 mb-1">O6 Cantos</p>
                      <p className="font-mono font-bold text-white">{row.pct_o6.toFixed(0)}%</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] uppercase tracking-wider text-white/60 mb-1">U3.5 Gols</p>
                      <p className="font-mono font-bold text-white">{row.pct_u35_gols.toFixed(0)}%</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] uppercase tracking-wider text-white/60 mb-1">U7 Cart.</p>
                      <p className="font-mono font-bold text-white">{row.pct_u7_cart.toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="flex justify-center py-2">
                    <VerdictStamp verdict={row.recomendacao} label={row.recomendacao} />
                  </div>
                </div>
              ))}
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
      <p className={`text-xl font-mono font-bold ${highlight ? "text-bet-green" : ""}`}>{value}</p>
    </div>
  );
}

function CompareRow({ label, a, b, decimals = 0 }: { label: string; a: number; b: number; decimals?: number }) {
  const fmtA = decimals ? a.toFixed(decimals) : a;
  const fmtB = decimals ? b.toFixed(decimals) : b;
  return (
    <tr>
      <td className="text-muted-foreground">{label}</td>
      <td className={`text-center font-mono ${a > b ? "text-bet-green font-bold" : ""}`}>{fmtA}</td>
      <td className={`text-center font-mono ${b > a ? "text-bet-green font-bold" : ""}`}>{fmtB}</td>
    </tr>
  );
}
