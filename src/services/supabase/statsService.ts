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

export type StatsCasaFora = {
  time: string;
  sigla: string;
  casa: { jogos: number; media_gols: number; media_esc: number; media_cart: number };
  fora: { jogos: number; media_gols: number; media_esc: number; media_cart: number };
};

export async function fetchStatsCasaFora(): Promise<StatsCasaFora[]> {
  const { data: jogos, error } = await supabase
    .from('jogos')
    .select('time_casa_id, time_fora_id, gols_casa, gols_fora, escanteios_casa, escanteios_fora, cartoes_total, time_casa:times!jogos_time_casa_id_fkey(nome, sigla), time_fora:times!jogos_time_fora_id_fkey(nome, sigla)');

  if (error) throw error;
  if (!jogos) return [];

  const map = new Map<string, { sigla: string; casa: number[]; fora: number[]; casaEsc: number[]; foraEsc: number[]; casaCart: number[]; foraCart: number[] }>();

  for (const j of jogos as any[]) {
    const casaNome = j.time_casa?.nome;
    const casaSigla = j.time_casa?.sigla;
    const foraNome = j.time_fora?.nome;
    const foraSigla = j.time_fora?.sigla;
    if (!casaNome || !foraNome) continue;

    if (!map.has(casaNome)) map.set(casaNome, { sigla: casaSigla, casa: [], fora: [], casaEsc: [], foraEsc: [], casaCart: [], foraCart: [] });
    if (!map.has(foraNome)) map.set(foraNome, { sigla: foraSigla, casa: [], fora: [], casaEsc: [], foraEsc: [], casaCart: [], foraCart: [] });

    const c = map.get(casaNome)!;
    c.casa.push(j.gols_casa);
    c.casaEsc.push(j.escanteios_casa);
    c.casaCart.push(j.cartoes_total / 2);

    const f = map.get(foraNome)!;
    f.fora.push(j.gols_fora);
    f.foraEsc.push(j.escanteios_fora);
    f.foraCart.push(j.cartoes_total / 2);
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return Array.from(map.entries()).map(([time, d]) => ({
    time,
    sigla: d.sigla,
    casa: { jogos: d.casa.length, media_gols: avg(d.casa), media_esc: avg(d.casaEsc), media_cart: avg(d.casaCart) },
    fora: { jogos: d.fora.length, media_gols: avg(d.fora), media_esc: avg(d.foraEsc), media_cart: avg(d.foraCart) },
  })).sort((a, b) => (b.casa.media_gols + b.fora.media_gols) - (a.casa.media_gols + a.fora.media_gols));
}
