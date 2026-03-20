import { supabase } from './client';
import type { Jogo } from '@/types/database';

export type JogosFilters = {
  rodada?: number;
  time?: string;
  page?: number;
  pageSize?: number;
};

export async function fetchJogos(filters: JogosFilters = {}) {
  const { page = 1, pageSize = 10, rodada, time } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('jogos')
    .select('*', { count: 'exact' })
    .order('rodada', { ascending: false })
    .order('data_hora', { ascending: false })
    .range(from, to);

  if (rodada) {
    query = query.eq('rodada', rodada);
  }

  if (time) {
    query = query.or(`time_casa_nome.ilike.%${time}%,time_fora_nome.ilike.%${time}%`);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data: (data as Jogo[]) || [], count: count || 0 };
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

export async function fetchTimes(): Promise<string[]> {
  const { data, error } = await supabase.from('times').select('nome').order('nome');
  if (error) throw error;
  return (data || []).map((t: { nome: string }) => t.nome);
}
