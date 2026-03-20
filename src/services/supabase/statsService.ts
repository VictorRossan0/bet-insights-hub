import { supabase } from './client';
import type { StatsAcumulado, StatsPorRodada } from '@/types/database';

export async function fetchStatsAcumulado(): Promise<StatsAcumulado | null> {
  const { data, error } = await supabase
    .from('stats_acumulado')
    .select('*')
    .maybeSingle();

  if (error) {
    // division by zero when tables are empty
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
