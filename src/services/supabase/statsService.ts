import { fetchAllJogos, type JogoComTimesRaw } from './jogosService';
import type { StatsAcumulado, StatsPorRodada, StatsPorTime, StatsCasaFora, StatsH2H } from '@/types/database';

const TEMPORADA_2026 = 1;

/** Compute accumulated stats from raw jogos */
export async function fetchStatsAcumulado(): Promise<StatsAcumulado | null> {
  const jogos = await fetchAllJogos(TEMPORADA_2026);
  if (jogos.length === 0) return null;

  const n = jogos.length;
  const rodadas = new Set(jogos.map(j => j.rodada));

  return {
    total_jogos: n,
    total_rodadas: rodadas.size,
    media_gols: jogos.reduce((s, j) => s + j.gols_total, 0) / n,
    media_escanteios: jogos.reduce((s, j) => s + j.escanteios_total, 0) / n,
    media_cartoes: jogos.reduce((s, j) => s + j.cartoes_total, 0) / n,
    pct_o5_cantos: (jogos.filter(j => j.o5_cantos).length / n) * 100,
    pct_o6_cantos: (jogos.filter(j => j.o6_cantos).length / n) * 100,
    pct_o7_cantos: (jogos.filter(j => j.o7_cantos).length / n) * 100,
    pct_o8_cantos: (jogos.filter(j => j.o8_cantos).length / n) * 100,
    pct_o9_cantos: (jogos.filter(j => j.o9_cantos).length / n) * 100,
    pct_u35_gols: (jogos.filter(j => j.u35_gols).length / n) * 100,
    pct_u25_gols: (jogos.filter(j => j.u25_gols).length / n) * 100,
    pct_u7_cartoes: (jogos.filter(j => j.u7_cartoes).length / n) * 100,
  };
}

/** Stats grouped by rodada */
export async function fetchStatsPorRodada(): Promise<StatsPorRodada[]> {
  const jogos = await fetchAllJogos(TEMPORADA_2026);
  if (jogos.length === 0) return [];

  const grouped = new Map<number, JogoComTimesRaw[]>();
  for (const j of jogos) {
    const arr = grouped.get(j.rodada) || [];
    arr.push(j);
    grouped.set(j.rodada, arr);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rodada, games]) => {
      const n = games.length;
      return {
        rodada,
        total_jogos: n,
        media_gols: games.reduce((s, j) => s + j.gols_total, 0) / n,
        media_escanteios: games.reduce((s, j) => s + j.escanteios_total, 0) / n,
        media_cartoes: games.reduce((s, j) => s + j.cartoes_total, 0) / n,
        pct_o5_cantos: (games.filter(j => j.o5_cantos).length / n) * 100,
        pct_o6_cantos: (games.filter(j => j.o6_cantos).length / n) * 100,
        pct_o7_cantos: (games.filter(j => j.o7_cantos).length / n) * 100,
        pct_u35_gols: (games.filter(j => j.u35_gols).length / n) * 100,
        pct_u25_gols: (games.filter(j => j.u25_gols).length / n) * 100,
      };
    });
}

/** Stats per team */
export async function fetchStatsPorTime(): Promise<StatsPorTime[]> {
  const jogos = await fetchAllJogos(TEMPORADA_2026);
  if (jogos.length === 0) return [];

  const teamMap = new Map<string, { nome: string; sigla: string; gols: number; esc: number; cart: number; jogos: number; o5: number; o6: number; u35: number }>();

  const addGame = (nome: string, sigla: string, gols: number, esc: number, cart: number, o5: boolean, o6: boolean, u35: boolean) => {
    const existing = teamMap.get(nome) || { nome, sigla, gols: 0, esc: 0, cart: 0, jogos: 0, o5: 0, o6: 0, u35: 0 };
    existing.gols += gols;
    existing.esc += esc;
    existing.cart += cart;
    existing.jogos += 1;
    if (o5) existing.o5 += 1;
    if (o6) existing.o6 += 1;
    if (u35) existing.u35 += 1;
    teamMap.set(nome, existing);
  };

  for (const j of jogos) {
    if (j.time_casa) addGame(j.time_casa.nome, j.time_casa.sigla, j.gols_total, j.escanteios_total, j.cartoes_total, j.o5_cantos, j.o6_cantos, j.u35_gols);
    if (j.time_fora) addGame(j.time_fora.nome, j.time_fora.sigla, j.gols_total, j.escanteios_total, j.cartoes_total, j.o5_cantos, j.o6_cantos, j.u35_gols);
  }

  return [...teamMap.values()]
    .map(t => ({
      time_id: 0,
      nome: t.nome,
      sigla: t.sigla,
      total_jogos: t.jogos,
      media_gols_jogo: t.gols / t.jogos,
      media_escanteios_jogo: t.esc / t.jogos,
      media_cartoes_jogo: t.cart / t.jogos,
      pct_o5: (t.o5 / t.jogos) * 100,
      pct_o6: (t.o6 / t.jogos) * 100,
      pct_u35: (t.u35 / t.jogos) * 100,
    }))
    .sort((a, b) => b.media_gols_jogo - a.media_gols_jogo);
}

/** Stats casa/fora per team */
export async function fetchStatsCasaFora(): Promise<StatsCasaFora[]> {
  const jogos = await fetchAllJogos(TEMPORADA_2026);
  if (jogos.length === 0) return [];

  const teamMap = new Map<string, StatsCasaFora & { _gc: number; _ec: number; _cc: number; _jc: number; _gf: number; _ef: number; _cf: number; _jf: number }>();

  for (const j of jogos) {
    if (j.time_casa) {
      const nome = j.time_casa.nome;
      const t = teamMap.get(nome) || { time_id: 0, nome, sigla: j.time_casa.sigla, jogos_casa: 0, media_gols_casa: 0, media_esc_casa: 0, media_cart_casa: 0, jogos_fora: 0, media_gols_fora: 0, media_esc_fora: 0, media_cart_fora: 0, _gc: 0, _ec: 0, _cc: 0, _jc: 0, _gf: 0, _ef: 0, _cf: 0, _jf: 0 };
      t._gc += j.gols_total;
      t._ec += j.escanteios_total;
      t._cc += j.cartoes_total;
      t._jc += 1;
      teamMap.set(nome, t);
    }
    if (j.time_fora) {
      const nome = j.time_fora.nome;
      const t = teamMap.get(nome) || { time_id: 0, nome, sigla: j.time_fora.sigla, jogos_casa: 0, media_gols_casa: 0, media_esc_casa: 0, media_cart_casa: 0, jogos_fora: 0, media_gols_fora: 0, media_esc_fora: 0, media_cart_fora: 0, _gc: 0, _ec: 0, _cc: 0, _jc: 0, _gf: 0, _ef: 0, _cf: 0, _jf: 0 };
      t._gf += j.gols_total;
      t._ef += j.escanteios_total;
      t._cf += j.cartoes_total;
      t._jf += 1;
      teamMap.set(nome, t);
    }
  }

  return [...teamMap.values()].map(t => ({
    time_id: t.time_id,
    nome: t.nome,
    sigla: t.sigla,
    jogos_casa: t._jc,
    media_gols_casa: t._jc ? t._gc / t._jc : 0,
    media_esc_casa: t._jc ? t._ec / t._jc : 0,
    media_cart_casa: t._jc ? t._cc / t._jc : 0,
    jogos_fora: t._jf,
    media_gols_fora: t._jf ? t._gf / t._jf : 0,
    media_esc_fora: t._jf ? t._ef / t._jf : 0,
    media_cart_fora: t._jf ? t._cf / t._jf : 0,
  })).sort((a, b) => a.nome.localeCompare(b.nome));
}

/** H2H stats between two teams */
export async function fetchStatsH2H(idA: number, idB: number): Promise<StatsH2H | null> {
  // Fetch all jogos involving both teams across all temporadas
  const { data: allGames, error } = await (async () => {
    const selectCols = 'id, gols_total, escanteios_total, cartoes_total, time_casa_id, time_fora_id';
    
    const { data, error } = await (await import('./client')).supabase
      .from('jogos')
      .select(selectCols)
      .or(`and(time_casa_id.eq.${idA},time_fora_id.eq.${idB}),and(time_casa_id.eq.${idB},time_fora_id.eq.${idA})`);
    
    return { data, error };
  })();

  if (error) throw error;
  if (!allGames || allGames.length === 0) return null;

  const n = allGames.length;
  
  // Get team names
  const { supabase: sb } = await import('./client');
  const { data: teamA } = await sb.from('times').select('nome').eq('id', idA).single();
  const { data: teamB } = await sb.from('times').select('nome').eq('id', idB).single();

  return {
    time_a_id: idA,
    time_b_id: idB,
    time_a_nome: teamA?.nome || 'Time A',
    time_b_nome: teamB?.nome || 'Time B',
    total_jogos: n,
    media_gols: allGames.reduce((s, j) => s + (j.gols_total || 0), 0) / n,
    media_escanteios: allGames.reduce((s, j) => s + (j.escanteios_total || 0), 0) / n,
    media_cartoes: allGames.reduce((s, j) => s + (j.cartoes_total || 0), 0) / n,
  };
}

/** Stats por temporada (for Histórico page) */
export async function fetchStatsPorTemporada() {
  // temporada_id mapping: 1=2026, 2=2025, 3=2024, 4=2023, 5=2022, 6=2021, 7=2020
  const temporadaAnoMap: Record<number, number> = {
    2: 2025, 3: 2024, 4: 2023, 5: 2022, 6: 2021, 7: 2020,
  };

  const results = [];

  for (const [tidStr, ano] of Object.entries(temporadaAnoMap)) {
    const tid = Number(tidStr);
    const jogos = await fetchAllJogos(tid);
    if (jogos.length === 0) continue;

    const n = jogos.length;
    results.push({
      ano,
      total_jogos: n,
      media_gols: jogos.reduce((s, j) => s + j.gols_total, 0) / n,
      media_escanteios: jogos.reduce((s, j) => s + j.escanteios_total, 0) / n,
      media_cartoes: jogos.reduce((s, j) => s + j.cartoes_total, 0) / n,
      pct_o5_cantos: (jogos.filter(j => j.o5_cantos).length / n) * 100,
      pct_o6_cantos: (jogos.filter(j => j.o6_cantos).length / n) * 100,
      pct_o7_cantos: (jogos.filter(j => j.o7_cantos).length / n) * 100,
      pct_u35_gols: (jogos.filter(j => j.u35_gols).length / n) * 100,
      pct_u7_cartoes: (jogos.filter(j => j.u7_cartoes).length / n) * 100,
    });
  }

  return results.sort((a, b) => a.ano - b.ano);
}

/** Fetch apostas_sugeridas from external Supabase */
export async function fetchApostasSugeridas() {
  const { supabase } = await import('./client');
  const { data, error } = await supabase
    .from('apostas_sugeridas')
    .select(`
      id, temporada_id, rodada, jogo_id,
      time_casa_id, time_fora_id,
      mercado, tipo, justificativa,
      base_historica, base_h2h, base_casa_fora,
      confianca, odd_minima, odd_sugerida,
      resultado, criado_em,
      time_casa:times!apostas_sugeridas_time_casa_id_fkey(nome),
      time_fora:times!apostas_sugeridas_time_fora_id_fkey(nome)
    `)
    .order('criado_em', { ascending: false });

  if (error) {
    // If FK join fails, try without joins
    const { data: plain, error: err2 } = await supabase
      .from('apostas_sugeridas')
      .select('*')
      .order('criado_em', { ascending: false });
    if (err2) throw err2;
    return plain || [];
  }
  return data || [];
}
