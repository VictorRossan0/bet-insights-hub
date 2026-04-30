/**
 * Backward-compatible re-exports from new api/domain layers.
 * Existing imports from '@/services/supabase/jogosService' still work.
 */
export { fetchJogosPaginated as fetchJogosResumo, fetchAllJogos, fetchRodadas, createJogo, updateJogo, deleteJogo, insertJogosBulk as importJogos } from '@/services/api/games.api';
export { fetchTimes, getTemporadas as fetchTemporadas } from '@/services/api/teams.api';
export type { JogosFilters, JogoComTimesRaw } from '@/services/api/games.api';
