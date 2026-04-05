/**
 * Backward-compatible re-exports from new domain layer.
 */
export { computeStatsAcumulado as fetchStatsAcumulado, computeStatsPorRodada as fetchStatsPorRodada, computeStatsPorTime as fetchStatsPorTime, computeStatsCasaFora as fetchStatsCasaFora, computeStatsH2H as fetchStatsH2H, computeStatsPorTemporada as fetchStatsPorTemporada } from '@/services/domain/stats.service';
export { fetchApostasSugeridas } from '@/services/api/bets.api';
