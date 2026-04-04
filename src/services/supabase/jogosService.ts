import { supabase } from './client';
import type { Jogo } from '@/types/database';

/** temporada_id mapping: 1=2026, 2=2025, ... 11=2016 */
const TEMPORADA_2026 = 1;

export type JogosFilters = {
  rodada?: number;
  time?: string;
  temporada_id?: number;
  page?: number;
  pageSize?: number;
};

export type JogoComTimesRaw = {
  id: number;
  rodada: number;
  data_jogo: string;
  temporada_id: number;
  gols_casa: number;
  gols_fora: number;
  gols_total: number;
  resultado: string | null;
  escanteios_casa: number;
  escanteios_fora: number;
  escanteios_total: number;
  cartoes_total: number;
  o5_cantos: boolean;
  o6_cantos: boolean;
  o7_cantos: boolean;
  o8_cantos: boolean;
  o9_cantos: boolean;
  u35_gols: boolean;
  u25_gols: boolean;
  u7_cartoes: boolean;
  time_casa: { nome: string; sigla: string } | null;
  time_fora: { nome: string; sigla: string } | null;
};

const JOGOS_SELECT = `
  id, rodada, data_jogo, temporada_id,
  gols_casa, gols_fora, gols_total, resultado,
  escanteios_casa, escanteios_fora, escanteios_total,
  cartoes_total,
  o5_cantos, o6_cantos, o7_cantos, o8_cantos, o9_cantos,
  u35_gols, u25_gols, u7_cartoes,
  time_casa:times!jogos_time_casa_id_fkey(nome, sigla),
  time_fora:times!jogos_time_fora_id_fkey(nome, sigla)
`.replace(/\n/g, '');

/** Fetch games directly from jogos table with team joins */
export async function fetchJogosResumo(filters: JogosFilters = {}) {
  const { page = 1, pageSize = 10, rodada, time, temporada_id = TEMPORADA_2026 } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('jogos')
    .select(JOGOS_SELECT, { count: 'exact' })
    .eq('temporada_id', temporada_id)
    .order('rodada', { ascending: false })
    .order('data_jogo', { ascending: false })
    .range(from, to);

  if (rodada) {
    query = query.eq('rodada', rodada);
  }

  // For time filter we need to filter after fetching since it's a joined field
  const { data, error, count } = await query;
  if (error) throw error;

  let results = ((data as unknown) as JogoComTimesRaw[]) || [];

  // Client-side team name filter
  if (time) {
    const lower = time.toLowerCase();
    results = results.filter(j =>
      j.time_casa?.nome?.toLowerCase().includes(lower) ||
      j.time_fora?.nome?.toLowerCase().includes(lower)
    );
  }

  return { data: results, count: time ? results.length : (count || 0) };
}

/** Fetch all jogos for a temporada (for stats computation) */
export async function fetchAllJogos(temporada_id: number = TEMPORADA_2026): Promise<JogoComTimesRaw[]> {
  const allData: JogoComTimesRaw[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('jogos')
      .select(JOGOS_SELECT)
      .eq('temporada_id', temporada_id)
      .order('rodada', { ascending: true })
      .range(from, from + batchSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    allData.push(...((data as unknown) as JogoComTimesRaw[]));
    if (data.length < batchSize) break;
    from += batchSize;
  }

  return allData;
}

export async function fetchRodadas(temporada_id: number = TEMPORADA_2026): Promise<number[]> {
  const { data, error } = await supabase
    .from('jogos')
    .select('rodada')
    .eq('temporada_id', temporada_id)
    .order('rodada', { ascending: true });

  if (error) throw error;
  const unique = [...new Set((data || []).map((d: { rodada: number }) => d.rodada))];
  return unique;
}

export async function fetchTimes(): Promise<{ id: number; nome: string; sigla: string }[]> {
  const { data, error } = await supabase.from('times').select('id, nome, sigla').order('nome');
  if (error) throw error;
  return data || [];
}

export async function fetchTemporadas(): Promise<{ id: number; ano: number }[]> {
  // Hardcoded since the temporadas table is empty on the external Supabase
  return [
    { id: 1, ano: 2026 },
    { id: 2, ano: 2025 },
    { id: 3, ano: 2024 },
    { id: 4, ano: 2023 },
    { id: 5, ano: 2022 },
    { id: 6, ano: 2021 },
    { id: 7, ano: 2020 },
  ];
}

export async function createJogo(jogo: Partial<Jogo>) {
  const { data, error } = await supabase.from('jogos').insert(jogo).select().single();
  if (error) throw error;
  return data as Jogo;
}

export async function importJogos(jogos: Partial<Jogo>[]) {
  const { data, error } = await supabase.from('jogos').insert(jogos).select();
  if (error) throw error;
  return data as Jogo[];
}

export async function updateJogo(id: number, updates: Partial<Jogo>) {
  const { data, error } = await supabase.from('jogos').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Jogo;
}
