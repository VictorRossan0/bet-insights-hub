/**
 * games.service.ts — Business logic for game import and validation.
 */
import { fetchExistingGameKeys, insertJogosBulk } from '@/services/api/games.api';
import type { Jogo } from '@/types/database';

/** Parse CSV text into array of partial Jogo objects */
export function parseCSV(text: string): Partial<Jogo>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const results: Partial<Jogo>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx]; });

    const golsCasa = Number(row.gols_casa) || 0;
    const golsFora = Number(row.gols_fora) || 0;
    const golsTotal = golsCasa + golsFora;
    const escCasa = Number(row.escanteios_casa) || 0;
    const escFora = Number(row.escanteios_fora) || 0;
    const escTotal = escCasa + escFora;
    const cartoesTotal = Number(row.cartoes_total) || 0;

    const resultado = golsCasa > golsFora ? 'casa' : golsFora > golsCasa ? 'fora' : 'empate';

    results.push({
      temporada_id: Number(row.temporada_id) || 1,
      rodada: Number(row.rodada) || 1,
      data_jogo: row.data_jogo || new Date().toISOString().slice(0, 10),
      time_casa_id: Number(row.time_casa_id) || 0,
      time_fora_id: Number(row.time_fora_id) || 0,
      gols_casa: golsCasa,
      gols_fora: golsFora,
      gols_total: golsTotal,
      resultado: resultado as 'casa' | 'fora' | 'empate',
      escanteios_casa: escCasa,
      escanteios_fora: escFora,
      escanteios_total: escTotal,
      cartoes_total: cartoesTotal,
      o5_cantos: escTotal > 5,
      o6_cantos: escTotal > 6,
      o7_cantos: escTotal > 7,
      o8_cantos: escTotal > 8,
      o9_cantos: escTotal > 9,
      u35_gols: golsTotal < 3.5,
      u25_gols: golsTotal < 2.5,
      u7_cartoes: cartoesTotal < 7,
    });
  }
  return results;
}

/** Import games with duplicate validation */
export async function importJogosValidated(jogos: Partial<Jogo>[]): Promise<{ inserted: number; duplicates: number }> {
  if (jogos.length === 0) return { inserted: 0, duplicates: 0 };

  const temporadaId = jogos[0].temporada_id ?? 1;
  const existingKeys = await fetchExistingGameKeys(temporadaId);

  const unique: Partial<Jogo>[] = [];
  let duplicates = 0;

  for (const j of jogos) {
    const key = `${j.temporada_id}-${j.rodada}-${j.time_casa_id}-${j.time_fora_id}`;
    if (existingKeys.has(key)) {
      duplicates++;
    } else {
      unique.push(j);
      existingKeys.add(key);
    }
  }

  if (unique.length > 0) {
    await insertJogosBulk(unique);
  }

  return { inserted: unique.length, duplicates };
}
