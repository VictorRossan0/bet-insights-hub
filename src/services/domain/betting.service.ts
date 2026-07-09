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
 * Over 9 Cantos recommendation — recalibrada via backtest.
 * Sinal com edge real: quando média combinada (H2H + casa/fora) >= 9,
 * acerta 63.3% vs baseline de 56.3%.
 */
export function calculateOver9CantosRecommendation(
  h2h: StatsH2H,
  cfA: StatsCasaFora,
  cfB: StatsCasaFora
): BetRecommendation {
  const mediaCasaFora = (cfA.media_esc_casa + cfB.media_esc_fora) / 2;
  const mediaCombinada = (h2h.media_escanteios + mediaCasaFora) / 2;

  const signals: { label: string; positive: boolean }[] = [
    { label: `Média H2H: ${h2h.media_escanteios.toFixed(1)}`, positive: h2h.media_escanteios >= 9 },
    { label: `Média Casa/Fora: ${mediaCasaFora.toFixed(1)}`, positive: mediaCasaFora >= 9 },
    { label: `Média Combinada: ${mediaCombinada.toFixed(1)}`, positive: mediaCombinada >= 9 },
  ];

  const hasEdge = mediaCombinada >= 9;
  const confidence = hasEdge ? 63 : 30;

  return {
    market: 'Over 9 Cantos',
    probability: hasEdge ? 63.3 : 0,
    confidence,
    confidenceLevel: getConfidenceLevel(confidence),
    recommendation: 'over',
    signals,
    verdict: hasEdge ? 'APOSTAR' : 'EVITAR',
  };
}

export { DEFAULT_WEIGHTS };

