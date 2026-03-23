import { supabase } from './client';
import type { JogoResumo, Jogo } from '@/types/database';

export type JogosFilters = {
  rodada?: number;
  time?: string;
  temporada?: number;
  page?: number;
  pageSize?: number;
};

/** Fetch games using jogos_resumo view (totals already resolved) */
export async function fetchJogosResumo(filters: JogosFilters = {}) {
  const { page = 1, pageSize = 10, rodada, time, temporada } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('jogos_resumo')
    .select('*', { count: 'exact' })
    .order('rodada', { ascending: false })
    .order('data_jogo', { ascending: false })
    .range(from, to);

  if (temporada) {
    query = query.eq('temporada', temporada);
  }

  if (rodada) {
    query = query.eq('rodada', rodada);
  }

  if (time) {
    query = query.or(`time_casa.ilike.%${time}%,time_fora.ilike.%${time}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data as JogoResumo[]) || [], count: count || 0 };
}

/** Legacy: fetch from jogos table with joins */
export async function fetchJogos(filters: JogosFilters = {}) {
  const { page = 1, pageSize = 10, rodada, time } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('jogos')
    .select('*, time_casa:times!jogos_time_casa_id_fkey(nome, sigla), time_fora:times!jogos_time_fora_id_fkey(nome, sigla)', { count: 'exact' })
    .order('rodada', { ascending: false })
    .order('data_jogo', { ascending: false })
    .range(from, to);

  if (rodada) {
    query = query.eq('rodada', rodada);
  }

  if (time) {
    query = query.or(`time_casa.nome.ilike.%${time}%,time_fora.nome.ilike.%${time}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
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

export async function fetchRodadas(): Promise<number[]> {
  const { data, error } = await supabase
    .from('jogos')
    .select('rodada')
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
  const { data, error } = await supabase.from('temporadas').select('id, ano').order('ano', { ascending: false });
  if (error) throw error;
  return data || [];
}
