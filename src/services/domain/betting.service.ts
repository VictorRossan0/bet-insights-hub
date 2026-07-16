/**
 * betting.service.ts — Business logic for bet recommendations.
 */
import type { StatsCasaFora, StatsH2H } from '@/types/database';

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type BetRecommendation = {
  market: string;
  probability: number;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  recommendation: 'over' | 'under' | 'home' | 'away';
  signals: { label: string; positive: boolean }[];
  verdict: 'APOSTAR' | 'CAUTELOSO' | 'EVITAR';
};

export type RecommendationWeights = {
  form: number;
  h2h: number;
  homeAdvantage: number;
  league: number;
};

const DEFAULT_WEIGHTS: RecommendationWeights = {
  form: 0.3,
  h2h: 0.3,
  homeAdvantage: 0.25,
  league: 0.15,
};

/** Compute a confidence score from weighted factors */
function computeConfidence(
  formScore: number,
  h2hScore: number,
  homeScore: number,
  weights: RecommendationWeights = DEFAULT_WEIGHTS
): number {
  return (
    weights.form * formScore +
    weights.h2h * h2hScore +
    weights.homeAdvantage * homeScore +
    weights.league * ((formScore + h2hScore + homeScore) / 3)
  );
}

function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 70) return 'HIGH';
  if (confidence >= 45) return 'MEDIUM';
  return 'LOW';
}

// DEPRECATED: sem edge real, ver backtest (Over 5 Cantos ocorre em 92.7% dos jogos do Brasileirão)
/** Generate H2H-based recommendation (existing logic, now modular) */
export function calculateH2HRecommendation(
  h2h: StatsH2H,
  cfA: StatsCasaFora,
  cfB: StatsCasaFora,
  weights: RecommendationWeights = DEFAULT_WEIGHTS
): BetRecommendation {
  const signals: { label: string; positive: boolean }[] = [];

  // H2H corner signal
  const cornerPositive = h2h.media_escanteios >= 10;
  signals.push({ label: `Média Escanteios H2H: ${h2h.media_escanteios.toFixed(1)}`, positive: cornerPositive });

  // Goals signal
  const goalsPositive = h2h.media_gols <= 3.5;
  signals.push({ label: `Média Gols H2H: ${h2h.media_gols.toFixed(2)} (U3.5 ${goalsPositive ? 'favorável' : 'desfavorável'})`, positive: goalsPositive });

  // Casa/fora corners
  const avgEsc = (cfA.media_esc_casa + cfB.media_esc_fora) / 2;
  const homeCornerPositive = avgEsc >= 10;
  signals.push({ label: `Média Esc Casa/Fora: ${avgEsc.toFixed(1)}`, positive: homeCornerPositive });

  // Cards signal
  const cardsPositive = h2h.media_cartoes >= 4;
  signals.push({ label: `Média Cartões H2H: ${h2h.media_cartoes.toFixed(1)}`, positive: cardsPositive });

  const positives = signals.filter(s => s.positive).length;
  const verdict = positives >= 3 ? 'APOSTAR' : positives >= 2 ? 'CAUTELOSO' : 'EVITAR';

  // Compute confidence
  const h2hScore = cornerPositive ? 80 : 40;
  const homeScore = homeCornerPositive ? 75 : 35;
  const formScore = goalsPositive ? 70 : 30;

  const confidence = computeConfidence(formScore, h2hScore, homeScore, weights);

  return {
    market: 'Over 5 Cantos',
    probability: (positives / signals.length) * 100,
    confidence: Math.round(confidence),
    confidenceLevel: getConfidenceLevel(confidence),
    recommendation: cornerPositive ? 'over' : 'under',
    signals,
    verdict,
  };
}

/**
 * Over 9 Cantos recommendation — recalibrada (v3).
 *
 * Nova evidência: o sinal H2H puro (`h2h.media_escanteios`) é mais confiável
 * que o sinal combinado H2H+casa/fora que era usado antes — amostra 5-15x
 * maior e generaliza melhor entre ligas.
 *
 * - Recomendação `over` quando `h2h.media_escanteios >= 9`.
 * - Confiança pela distância até 9: `min(95, max(50, 50 + |media - 9| * 10))`.
 * - Verdict binário: APOSTAR (over) / EVITAR (não recomendamos "under").
 * - Forma recente e média casa/fora permanecem como sinais informativos,
 *   mas NÃO alteram verdict/confidence.
 */
export function calculateOver9CantosRecommendation(
  h2h: StatsH2H,
  cfA: StatsCasaFora,
  cfB: StatsCasaFora
): BetRecommendation {
  const mediaH2H = h2h.media_escanteios;
  const shouldBet = mediaH2H >= 9;

  const confidence = Math.min(95, Math.max(50, 50 + Math.abs(mediaH2H - 9) * 10));
  const confidenceLevel: ConfidenceLevel =
    confidence >= 80 ? 'HIGH' : confidence >= 60 ? 'MEDIUM' : 'LOW';

  const mediaCasaFora = (cfA.media_esc_casa + cfB.media_esc_fora) / 2;
  const recenteDisponivel =
    h2h.media_escanteios_recente !== undefined &&
    cfA.media_esc_recente !== undefined &&
    cfB.media_esc_recente !== undefined;
  const mediaCasaForaRecente = recenteDisponivel
    ? ((cfA.media_esc_recente as number) + (cfB.media_esc_recente as number)) / 2
    : undefined;
  const mediaCombinadaRecente =
    recenteDisponivel && mediaCasaForaRecente !== undefined
      ? ((h2h.media_escanteios_recente as number) + mediaCasaForaRecente) / 2
      : undefined;

  const signals: { label: string; positive: boolean }[] = [
    { label: `Média Escanteios H2H: ${mediaH2H.toFixed(1)}`, positive: shouldBet },
    { label: `Média Casa/Fora (informativo): ${mediaCasaFora.toFixed(1)}`, positive: mediaCasaFora >= 9 },
  ];
  if (mediaCombinadaRecente !== undefined) {
    signals.push({
      label: `Forma recente confirma (${mediaCombinadaRecente.toFixed(1)})`,
      positive: mediaCombinadaRecente >= 9,
    });
  }

  return {
    market: 'Over 9 Cantos',
    probability: shouldBet ? Math.min(95, 50 + (mediaH2H - 9) * 5) : 0,
    confidence: Math.round(confidence),
    confidenceLevel,
    recommendation: 'over',
    signals,
    verdict: shouldBet ? 'APOSTAR' : 'EVITAR',
  };
}


export { DEFAULT_WEIGHTS };

