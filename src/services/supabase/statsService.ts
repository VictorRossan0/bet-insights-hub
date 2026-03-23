import { supabase } from './client';
import type { StatsAcumulado, StatsPorRodada, StatsPorTime, StatsCasaFora, StatsPorTemporada, StatsH2H } from '@/types/database';

export async function fetchStatsAcumulado(): Promise<StatsAcumulado | null> {
  const { data, error } = await supabase
    .from('stats_acumulado')
    .select('*')
    .maybeSingle();

  if (error) {
    if (error.code === '22012') return null;
    throw error;
  }
  return data as StatsAcumulado | null;
}

export async function fetchStatsPorRodada(): Promise<StatsPorRodada[]> {
  const { data, error } = await supabase
    .from('stats_por_rodada')
    .select('*')
    .order('rodada', { ascending: true });

  if (error) throw error;
  return (data as StatsPorRodada[]) || [];
}

export async function fetchStatsPorTime(): Promise<StatsPorTime[]> {
  const { data, error } = await supabase
    .from('stats_por_time')
    .select('*')
    .order('media_gols_jogo', { ascending: false });

  if (error) throw error;
  return (data as StatsPorTime[]) || [];
}

export async function fetchStatsCasaFora(): Promise<StatsCasaFora[]> {
  const { data, error } = await supabase
    .from('stats_casa_fora')
    .select('*')
    .order('nome');

  if (error) throw error;
  return (data as StatsCasaFora[]) || [];
}

export async function fetchStatsPorTemporada(): Promise<StatsPorTemporada[]> {
  const { data, error } = await supabase
    .from('stats_por_temporada')
    .select('*')
    .order('ano', { ascending: true });

  if (error) throw error;
  return (data as StatsPorTemporada[]) || [];
}

export async function fetchStatsH2H(idA: number, idB: number): Promise<StatsH2H | null> {
  const { data, error } = await supabase
    .from('stats_h2h')
    .select('*')
    .or(`and(time_a_id.eq.${idA},time_b_id.eq.${idB}),and(time_a_id.eq.${idB},time_b_id.eq.${idA})`)
    .maybeSingle();

  if (error) throw error;
  return data as StatsH2H | null;
}
