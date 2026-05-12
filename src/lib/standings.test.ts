import { describe, it, expect } from 'vitest';
import { getBrasileiraoStandings } from '@/lib/standings';
import type { JogoComTimesRaw } from '@/services/api/games.api';

const t = (nome: string, sigla = nome.slice(0, 3).toUpperCase()) => ({ nome, sigla });

let id = 0;
function game(
  rodada: number,
  casa: string,
  fora: string,
  gc: number,
  gf: number,
): JogoComTimesRaw {
  return {
    id: ++id,
    rodada,
    data_jogo: '2026-01-01',
    temporada_id: 1,
    gols_casa: gc,
    gols_fora: gf,
    gols_total: gc + gf,
    resultado: gc > gf ? 'casa' : gc < gf ? 'fora' : 'empate',
    escanteios_casa: 0,
    escanteios_fora: 0,
    escanteios_total: 0,
    cartoes_total: 0,
    o5_cantos: false, o6_cantos: false, o7_cantos: false, o8_cantos: false, o9_cantos: false,
    u35_gols: false, u25_gols: false, u7_cartoes: false,
    time_casa: t(casa, casa.slice(0, 3).toUpperCase()),
    time_fora: t(fora, fora.slice(0, 3).toUpperCase()),
  };
}

describe('getBrasileiraoStandings', () => {
  it('aplica confronto direto quando exatamente 2 clubes ficam empatados', () => {
    // A e B ficam ambos com 3pts (1V 1D), GP1, SG0. C fica com 6pts (2V).
    // Só A e B empatam em todos os 4 critérios → H2H decide.
    const jogos = [
      game(1, 'A', 'B', 1, 0), // A vence H2H
      game(2, 'A', 'C', 0, 1),
      game(3, 'B', 'C', 0, 1),
    ];
    const s = getBrasileiraoStandings(jogos);
    const a = s.find(r => r.team_nome === 'A')!;
    const b = s.find(r => r.team_nome === 'B')!;
    expect(a.pontos_total).toBe(b.pontos_total);
    expect(a.vitorias).toBe(b.vitorias);
    expect(a.saldo_gols).toBe(b.saldo_gols);
    expect(a.gp).toBe(b.gp);
    // A deve ficar à frente de B por confronto direto
    const idxA = s.findIndex(r => r.team_nome === 'A');
    const idxB = s.findIndex(r => r.team_nome === 'B');
    expect(idxA).toBeLessThan(idxB);
    expect(a.tiebreaker).toBe('h2h');
    expect(b.tiebreaker).toBe('h2h');
    expect(a.tiedWith).toEqual(b.tiedWith);
    // tiedWith não pode ter siglas duplicadas
    expect(new Set(a.tiedWith).size).toBe(a.tiedWith.length);
    expect(a.tiebreakerSteps.length).toBeGreaterThan(0);
  });

  it('marca empate persistente quando H2H também está totalmente empatado', () => {
    // A e B empatam 0x0 e 1x1. Todos os critérios + H2H ficam empatados.
    const jogos = [
      game(1, 'A', 'B', 0, 0),
      game(2, 'B', 'A', 1, 1),
    ];
    const s = getBrasileiraoStandings(jogos);
    const a = s.find(r => r.team_nome === 'A')!;
    const b = s.find(r => r.team_nome === 'B')!;
    expect(a.pontos_total).toBe(b.pontos_total);
    expect(a.tiebreaker).toBe('unresolved');
    expect(b.tiebreaker).toBe('unresolved');
    expect(a.tiebreakerLabel).toMatch(/persistente/i);
  });

  it('não aplica H2H quando 3 ou mais clubes empatam (usa "criteria")', () => {
    // A, B, C empatam tudo: ciclo de vitórias 1x0
    const jogos = [
      game(1, 'A', 'B', 1, 0),
      game(2, 'B', 'C', 1, 0),
      game(3, 'C', 'A', 1, 0),
    ];
    const s = getBrasileiraoStandings(jogos);
    const trio = s.filter(r => ['A', 'B', 'C'].includes(r.team_nome));
    expect(trio.length).toBe(3);
    for (const r of trio) {
      expect(r.pontos_total).toBe(3);
      expect(r.vitorias).toBe(1);
      expect(r.saldo_gols).toBe(0);
      expect(r.gp).toBe(1);
      expect(r.tiebreaker).toBe('criteria');
      expect(r.tiedWith.length).toBe(3);
      expect(new Set(r.tiedWith).size).toBe(3);
      expect(r.tiebreakerLabel).toMatch(/3 clubes/);
    }
  });
});
