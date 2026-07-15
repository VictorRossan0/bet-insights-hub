/**
 * stats.service.ts — Business logic for statistics aggregation.
 * Receives raw data from api/ layer, transforms and returns domain objects.
 */
import { fetchAllJogos, fetchH2HGames, type JogoComTimesRaw } from '@/services/api/games.api';
import { fetchTimeById, fetchTimes } from '@/services/api/teams.api';
import type {
  StatsAcumulado,
  StatsPorRodada,
  StatsPorTime,
  StatsCasaFora,
  StatsH2H,
} from '@/types/database';

const DEFAULT_TEMPORADA = 1;

// ── Helpers ───────────────────────────────────────────────

function pct(arr: JogoComTimesRaw[], predicate: (j: JogoComTimesRaw) => boolean): number {
  return arr.length === 0 ? 0 : (arr.filter(predicate).length / arr.length) * 100;
}

function avg(arr: JogoComTimesRaw[], getter: (j: JogoComTimesRaw) => number): number {
  return arr.length === 0 ? 0 : arr.reduce((s, j) => s + getter(j), 0) / arr.length;
}

// ── Accumulated Stats ─────────────────────────────────────

export async function computeStatsAcumulado(temporada_id: number = DEFAULT_TEMPORADA): Promise<StatsAcumulado | null> {
  const jogos = await fetchAllJogos(temporada_id);
  if (jogos.length === 0) return null;

  return {
    total_jogos: jogos.length,
    total_rodadas: new Set(jogos.map(j => j.rodada)).size,
    media_gols: avg(jogos, j => j.gols_total),
    media_escanteios: avg(jogos, j => j.escanteios_total),
    media_cartoes: avg(jogos, j => j.cartoes_total),
    pct_o5_cantos: pct(jogos, j => j.o5_cantos),
    pct_o6_cantos: pct(jogos, j => j.o6_cantos),
    pct_o7_cantos: pct(jogos, j => j.o7_cantos),
    pct_o8_cantos: pct(jogos, j => j.o8_cantos),
    pct_o9_cantos: pct(jogos, j => j.o9_cantos),
    pct_u35_gols: pct(jogos, j => j.u35_gols),
    pct_u25_gols: pct(jogos, j => j.u25_gols),
    pct_u7_cartoes: pct(jogos, j => j.u7_cartoes),
  };
}

// ── Stats per Rodada ──────────────────────────────────────

export async function computeStatsPorRodada(temporada_id: number = DEFAULT_TEMPORADA): Promise<StatsPorRodada[]> {
  const jogos = await fetchAllJogos(temporada_id);
  if (jogos.length === 0) return [];

  const grouped = new Map<number, JogoComTimesRaw[]>();
  for (const j of jogos) {
    const arr = grouped.get(j.rodada) || [];
    arr.push(j);
    grouped.set(j.rodada, arr);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rodada, games]) => ({
      rodada,
      total_jogos: games.length,
      media_gols: avg(games, j => j.gols_total),
      media_escanteios: avg(games, j => j.escanteios_total),
      media_cartoes: avg(games, j => j.cartoes_total),
      pct_o5_cantos: pct(games, j => j.o5_cantos),
      pct_o6_cantos: pct(games, j => j.o6_cantos),
      pct_o7_cantos: pct(games, j => j.o7_cantos),
      pct_u35_gols: pct(games, j => j.u35_gols),
      pct_u25_gols: pct(games, j => j.u25_gols),
    }));
}

// ── Stats per Team ────────────────────────────────────────

export async function computeStatsPorTime(): Promise<StatsPorTime[]> {
  const [jogos, allTimes] = await Promise.all([
    fetchAllJogos(DEFAULT_TEMPORADA),
    fetchTimes(),
  ]);
  if (jogos.length === 0) return [];

  // Map nome -> id real do time
  const idByName = new Map(allTimes.map(t => [t.nome, t.id]));

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
      time_id: idByName.get(t.nome) ?? 0,
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

// ── Stats Casa/Fora ───────────────────────────────────────

export async function computeStatsCasaFora(): Promise<StatsCasaFora[]> {
  const jogos = await fetchAllJogos(DEFAULT_TEMPORADA);
  if (jogos.length === 0) return [];

  const teamMap = new Map<string, { nome: string; sigla: string; gc: number; ec: number; cc: number; jc: number; gf: number; ef: number; cf: number; jf: number }>();

  for (const j of jogos) {
    if (j.time_casa) {
      const nome = j.time_casa.nome;
      const t = teamMap.get(nome) || { nome, sigla: j.time_casa.sigla, gc: 0, ec: 0, cc: 0, jc: 0, gf: 0, ef: 0, cf: 0, jf: 0 };
      t.gc += j.gols_total; t.ec += j.escanteios_total; t.cc += j.cartoes_total; t.jc += 1;
      teamMap.set(nome, t);
    }
    if (j.time_fora) {
      const nome = j.time_fora.nome;
      const t = teamMap.get(nome) || { nome, sigla: j.time_fora.sigla, gc: 0, ec: 0, cc: 0, jc: 0, gf: 0, ef: 0, cf: 0, jf: 0 };
      t.gf += j.gols_total; t.ef += j.escanteios_total; t.cf += j.cartoes_total; t.jf += 1;
      teamMap.set(nome, t);
    }
  }

  return [...teamMap.values()].map(t => ({
    time_id: 0,
    nome: t.nome,
    sigla: t.sigla,
    jogos_casa: t.jc,
    media_gols_casa: t.jc ? t.gc / t.jc : 0,
    media_esc_casa: t.jc ? t.ec / t.jc : 0,
    media_cart_casa: t.jc ? t.cc / t.jc : 0,
    jogos_fora: t.jf,
    media_gols_fora: t.jf ? t.gf / t.jf : 0,
    media_esc_fora: t.jf ? t.ef / t.jf : 0,
    media_cart_fora: t.jf ? t.cf / t.jf : 0,
  })).sort((a, b) => a.nome.localeCompare(b.nome));
}

// ── H2H Stats ─────────────────────────────────────────────

export async function computeStatsH2H(idA: number, idB: number): Promise<StatsH2H | null> {
  const allGames = await fetchH2HGames(idA, idB);
  if (allGames.length === 0) return null;

  const n = allGames.length;
  const [teamA, teamB] = await Promise.all([fetchTimeById(idA), fetchTimeById(idB)]);

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

// ── Stats por Temporada (Histórico) ───────────────────────

const TEMPORADA_ANO_MAP: Record<number, number> = {
  2: 2025, 3: 2024, 4: 2023, 5: 2022,
};

export async function computeStatsPorTemporada() {
  const results = [];

  for (const [tidStr, ano] of Object.entries(TEMPORADA_ANO_MAP)) {
    const tid = Number(tidStr);
    const jogos = await fetchAllJogos(tid);
    if (jogos.length === 0) continue;

    results.push({
      ano,
      total_jogos: jogos.length,
      media_gols: avg(jogos, j => j.gols_total),
      media_escanteios: avg(jogos, j => j.escanteios_total),
      media_cartoes: avg(jogos, j => j.cartoes_total),
      pct_o5_cantos: pct(jogos, j => j.o5_cantos),
      pct_o6_cantos: pct(jogos, j => j.o6_cantos),
      pct_o7_cantos: pct(jogos, j => j.o7_cantos),
      pct_u35_gols: pct(jogos, j => j.u35_gols),
      pct_u7_cartoes: pct(jogos, j => j.u7_cartoes),
    });
  }

  return results.sort((a, b) => a.ano - b.ano);
}
