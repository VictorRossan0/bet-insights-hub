/**
 * Calcula a tabela de classificação a partir de jogos brutos,
 * filtrando até uma rodada máxima.
 *
 * Critérios oficiais (simplificados) do Brasileirão:
 *   1) Pontos          DESC
 *   2) Vitórias        DESC
 *   3) Saldo de gols   DESC
 *   4) Gols pró        DESC
 *   5) Confronto direto — APENAS quando exatamente 2 clubes seguem empatados
 *      em todos os critérios acima. Empates de 3+ clubes não usam H2H.
 *
 * Cartões NÃO entram na ordenação (dado atual é total do jogo, não por time).
 */
import type { JogoComTimesRaw } from '@/services/api/games.api';

export type TiebreakerKind = 'none' | 'h2h' | 'criteria' | 'unresolved';

export type StandingRow = {
  team_nome: string;
  team_sigla: string;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  gp: number;
  gc: number;
  saldo_gols: number;
  pontos_total: number;
  aproveitamento: number;
  media_escanteios: number;
  forma_5jogos: string;
  /** Critério de desempate aplicado para resolver a posição deste time. */
  tiebreaker: TiebreakerKind;
  /** Siglas únicas dos times empatados nos 4 critérios principais (incluindo este). */
  tiedWith: string[];
  /** Texto curto para legenda. */
  tiebreakerLabel: string;
  /** Passos detalhados do desempate aplicado, em ordem. */
  tiebreakerSteps: string[];
};

type Acc = {
  team_nome: string;
  team_sigla: string;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  gp: number;
  gc: number;
  esc: number;
  results: { rodada: number; r: 'W' | 'D' | 'L' }[];
};

/**
 * Pontos no confronto direto entre dois times (apenas jogos entre eles).
 */
function h2hPoints(jogos: JogoComTimesRaw[], teamA: string, teamB: string): {
  a: number; b: number; sgA: number; sgB: number; gpA: number; gpB: number; jogos: number;
} {
  let a = 0, b = 0, sgA = 0, sgB = 0, gpA = 0, gpB = 0, n = 0;
  for (const j of jogos) {
    if (j.gols_casa == null || j.gols_fora == null) continue;
    if (!j.time_casa || !j.time_fora) continue;
    const casa = j.time_casa.nome;
    const fora = j.time_fora.nome;
    const isAvsB = (casa === teamA && fora === teamB) || (casa === teamB && fora === teamA);
    if (!isAvsB) continue;

    const aIsCasa = casa === teamA;
    const golsA = aIsCasa ? j.gols_casa : j.gols_fora;
    const golsB = aIsCasa ? j.gols_fora : j.gols_casa;

    n++;
    gpA += golsA; gpB += golsB;
    sgA += golsA - golsB;
    sgB += golsB - golsA;

    if (golsA > golsB) a += 3;
    else if (golsA < golsB) b += 3;
    else { a += 1; b += 1; }
  }
  return { a, b, sgA, sgB, gpA, gpB, jogos: n };
}

/** Dedup mantendo a primeira ocorrência. */
function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Função única e oficial de classificação. Use em todas as telas.
 */
export function getBrasileiraoStandings(jogos: JogoComTimesRaw[], untilRodada?: number): StandingRow[] {
  const map = new Map<string, Acc>();

  const filtered = untilRodada != null
    ? jogos.filter(j => j.rodada <= untilRodada)
    : jogos;

  const ensure = (nome: string, sigla: string): Acc => {
    let a = map.get(nome);
    if (!a) {
      a = { team_nome: nome, team_sigla: sigla, jogos: 0, vitorias: 0, empates: 0, derrotas: 0, gp: 0, gc: 0, esc: 0, results: [] };
      map.set(nome, a);
    }
    return a;
  };

  for (const j of filtered) {
    if (!j.time_casa || !j.time_fora) continue;
    if (j.gols_casa == null || j.gols_fora == null) continue;
    const casa = ensure(j.time_casa.nome, j.time_casa.sigla);
    const fora = ensure(j.time_fora.nome, j.time_fora.sigla);
    casa.jogos++; fora.jogos++;
    casa.gp += j.gols_casa; casa.gc += j.gols_fora;
    fora.gp += j.gols_fora; fora.gc += j.gols_casa;
    casa.esc += j.escanteios_casa ?? 0;
    fora.esc += j.escanteios_fora ?? 0;
    if (j.gols_casa > j.gols_fora) {
      casa.vitorias++; fora.derrotas++;
      casa.results.push({ rodada: j.rodada, r: 'W' });
      fora.results.push({ rodada: j.rodada, r: 'L' });
    } else if (j.gols_casa < j.gols_fora) {
      fora.vitorias++; casa.derrotas++;
      casa.results.push({ rodada: j.rodada, r: 'L' });
      fora.results.push({ rodada: j.rodada, r: 'W' });
    } else {
      casa.empates++; fora.empates++;
      casa.results.push({ rodada: j.rodada, r: 'D' });
      fora.results.push({ rodada: j.rodada, r: 'D' });
    }
  }

  const rows: StandingRow[] = Array.from(map.values()).map(a => {
    const pontos = a.vitorias * 3 + a.empates;
    const maxPts = a.jogos * 3;
    const last5 = [...a.results].sort((x, y) => x.rodada - y.rodada).slice(-5).map(r => r.r).join('');
    return {
      team_nome: a.team_nome,
      team_sigla: a.team_sigla,
      jogos: a.jogos,
      vitorias: a.vitorias,
      empates: a.empates,
      derrotas: a.derrotas,
      gp: a.gp,
      gc: a.gc,
      saldo_gols: a.gp - a.gc,
      pontos_total: pontos,
      aproveitamento: maxPts > 0 ? Math.round((pontos / maxPts) * 100) : 0,
      media_escanteios: a.jogos > 0 ? a.esc / a.jogos : 0,
      forma_5jogos: last5.padEnd(5, '-'),
      tiebreaker: 'none' as TiebreakerKind,
      tiedWith: [] as string[],
      tiebreakerLabel: 'Sem empate',
      tiebreakerSteps: [] as string[],
    };
  });

  // 1) Ordenação base oficial: pontos > vitórias > SG > GP
  rows.sort((a, b) =>
    (b.pontos_total - a.pontos_total) ||
    (b.vitorias - a.vitorias) ||
    (b.saldo_gols - a.saldo_gols) ||
    (b.gp - a.gp)
  );

  // 2) Confronto direto: apenas para grupos com EXATAMENTE 2 times empatados
  //    em todos os 4 critérios acima.
  const sameKey = (x: StandingRow, y: StandingRow) =>
    x.pontos_total === y.pontos_total &&
    x.vitorias === y.vitorias &&
    x.saldo_gols === y.saldo_gols &&
    x.gp === y.gp;

  let i = 0;
  while (i < rows.length) {
    let j = i + 1;
    while (j < rows.length && sameKey(rows[i], rows[j])) j++;
    const groupSize = j - i;

    if (groupSize === 2) {
      const A = rows[i];
      const B = rows[i + 1];
      const h = h2hPoints(filtered, A.team_nome, B.team_nome);

      const ptsDiff = h.b - h.a;
      const sgDiff = h.sgB - h.sgA;
      const gpDiff = h.gpB - h.gpA;
      const diff = ptsDiff || sgDiff || gpDiff;

      if (diff > 0) {
        rows[i] = B;
        rows[i + 1] = A;
      }

      const top = rows[i];
      const bot = rows[i + 1];
      const tied = uniq([top.team_sigla, bot.team_sigla]);
      const pair = `${top.team_sigla} x ${bot.team_sigla}`;

      const steps: string[] = [
        `Empate em pontos (${top.pontos_total}), vitórias (${top.vitorias}), SG (${top.saldo_gols}) e GP (${top.gp}).`,
        h.jogos === 0
          ? 'Confronto direto: nenhum jogo registrado entre as equipes.'
          : `Confronto direto (${h.jogos} jogo${h.jogos > 1 ? 's' : ''}): pontos ${top === A ? h.a : h.b} x ${top === A ? h.b : h.a}.`,
      ];

      if (ptsDiff !== 0) {
        rows[i].tiebreaker = 'h2h';
        rows[i + 1].tiebreaker = 'h2h';
        const label = `Confronto direto aplicado (${pair})`;
        rows[i].tiebreakerLabel = label;
        rows[i + 1].tiebreakerLabel = label;
        rows[i].tiedWith = tied;
        rows[i + 1].tiedWith = tied;
        rows[i].tiebreakerSteps = steps;
        rows[i + 1].tiebreakerSteps = steps;
      } else if (sgDiff !== 0) {
        steps.push(`SG no confronto direto: ${top === A ? h.sgA : h.sgB} x ${top === A ? h.sgB : h.sgA}.`);
        const label = `Confronto direto (SG) aplicado (${pair})`;
        rows[i].tiebreaker = 'h2h';
        rows[i + 1].tiebreaker = 'h2h';
        rows[i].tiebreakerLabel = label;
        rows[i + 1].tiebreakerLabel = label;
        rows[i].tiedWith = tied;
        rows[i + 1].tiedWith = tied;
        rows[i].tiebreakerSteps = steps;
        rows[i + 1].tiebreakerSteps = steps;
      } else if (gpDiff !== 0) {
        steps.push(
          `SG no confronto direto igual (${h.sgA}).`,
          `GP no confronto direto: ${top === A ? h.gpA : h.gpB} x ${top === A ? h.gpB : h.gpA}.`,
        );
        const label = `Confronto direto (GP) aplicado (${pair})`;
        rows[i].tiebreaker = 'h2h';
        rows[i + 1].tiebreaker = 'h2h';
        rows[i].tiebreakerLabel = label;
        rows[i + 1].tiebreakerLabel = label;
        rows[i].tiedWith = tied;
        rows[i + 1].tiedWith = tied;
        rows[i].tiebreakerSteps = steps;
        rows[i + 1].tiebreakerSteps = steps;
      } else {
        steps.push('Pontos, SG e GP no confronto direto também empatados — desempate persistente.');
        const label = `Empate persistente após confronto direto (${pair})`;
        rows[i].tiebreaker = 'unresolved';
        rows[i + 1].tiebreaker = 'unresolved';
        rows[i].tiebreakerLabel = label;
        rows[i + 1].tiebreakerLabel = label;
        rows[i].tiedWith = tied;
        rows[i + 1].tiedWith = tied;
        rows[i].tiebreakerSteps = steps;
        rows[i + 1].tiebreakerSteps = steps;
      }
    } else if (groupSize >= 3) {
      const tied = uniq(rows.slice(i, j).map(r => r.team_sigla));
      const label = `Sem confronto direto — empate de ${groupSize} clubes (${tied.join(', ')})`;
      const steps = [
        `Empate de ${groupSize} clubes em pontos, vitórias, SG e GP.`,
        'Confronto direto não se aplica (apenas para grupos de exatamente 2 times).',
        'Ordem mantida pelos critérios principais; desempate adicional fora do escopo automático.',
      ];
      for (let k = i; k < j; k++) {
        rows[k].tiebreaker = 'criteria';
        rows[k].tiedWith = tied;
        rows[k].tiebreakerLabel = label;
        rows[k].tiebreakerSteps = steps;
      }
    }
    i = j;
  }

  return rows;
}

/** Backward-compatible alias. */
export const buildStandings = getBrasileiraoStandings;

/**
 * Retorna posição de cada time em cada rodada (para gráfico de evolução).
 */
export function buildPositionEvolution(jogos: JogoComTimesRaw[]): {
  rounds: number[];
  series: Record<string, Array<{ rodada: number; posicao: number; pontos: number }>>;
} {
  const allRounds = Array.from(new Set(jogos.map(j => j.rodada))).sort((a, b) => a - b);
  const series: Record<string, Array<{ rodada: number; posicao: number; pontos: number }>> = {};

  for (const r of allRounds) {
    const standings = getBrasileiraoStandings(jogos, r);
    standings.forEach((s, idx) => {
      if (!series[s.team_nome]) series[s.team_nome] = [];
      series[s.team_nome].push({ rodada: r, posicao: idx + 1, pontos: s.pontos_total });
    });
  }

  return { rounds: allRounds, series };
}
