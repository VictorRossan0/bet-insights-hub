import { supabase } from './client';
import type { StatsAcumulado, StatsPorRodada, StatsPorTime } from '@/types/database';

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
