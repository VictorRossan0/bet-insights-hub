import { supabase } from './client';
import type { Jogo } from '@/types/database';

type JogoInput = Partial<Jogo>;

/** Parse CSV text into array of jogo objects */
export function parseCSV(text: string): JogoInput[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV vazio ou sem dados');

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredFields = ['rodada', 'time_casa_id', 'time_fora_id'];
  for (const f of requiredFields) {
    if (!headers.includes(f)) throw new Error(`Campo obrigatório ausente no CSV: ${f}`);
  }

  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const val = values[i];
      if (val === '' || val === undefined) return;

      const boolFields = ['o5_cantos', 'o6_cantos', 'o7_cantos', 'o8_cantos', 'o9_cantos', 'u35_gols', 'u25_gols', 'u7_cartoes'];
      const numFields = ['rodada', 'temporada_id', 'time_casa_id', 'time_fora_id', 'gols_casa', 'gols_fora', 'gols_total', 'escanteios_casa', 'escanteios_fora', 'escanteios_total', 'cartoes_total'];

      if (boolFields.includes(h)) {
        obj[h] = val === 'true' || val === '1';
      } else if (numFields.includes(h)) {
        obj[h] = Number(val);
      } else {
        obj[h] = val;
      }
    });
    return obj as JogoInput;
  });
}

/** Auto-compute derived fields if missing */
function enrichJogo(j: JogoInput): JogoInput {
  const gols_casa = j.gols_casa ?? 0;
  const gols_fora = j.gols_fora ?? 0;
  const esc_casa = j.escanteios_casa ?? 0;
  const esc_fora = j.escanteios_fora ?? 0;
  const cartoes = j.cartoes_total ?? 0;
  const resultado = j.resultado ?? (gols_casa > gols_fora ? 'casa' : gols_fora > gols_casa ? 'fora' : 'empate');

  // Remover colunas GERADAS no banco — não devem ser enviadas:
  // gols_total, escanteios_total, o5/o6/o7/o8/o9_cantos, u35/u25_gols, u7_cartoes
  const {
    gols_total: _gt,
    escanteios_total: _et,
    o5_cantos: _o5,
    o6_cantos: _o6,
    o7_cantos: _o7,
    o8_cantos: _o8,
    o9_cantos: _o9,
    u35_gols: _u35,
    u25_gols: _u25,
    u7_cartoes: _u7,
    ...rest
  } = j;

  return {
    ...rest,
    gols_casa,
    gols_fora,
    resultado,
    escanteios_casa: esc_casa,
    escanteios_fora: esc_fora,
    cartoes_total: cartoes,
  };
}

/** Check for duplicates by rodada + time_casa_id + time_fora_id + temporada_id */
async function filterDuplicates(jogos: JogoInput[]): Promise<{ unique: JogoInput[]; duplicates: number }> {
  if (jogos.length === 0) return { unique: [], duplicates: 0 };

  const temporadaIds = [...new Set(jogos.map(j => j.temporada_id).filter(Boolean))];
  const rodadas = [...new Set(jogos.map(j => j.rodada).filter(Boolean))];

  let query = supabase
    .from('jogos')
    .select('rodada, time_casa_id, time_fora_id, temporada_id');

  if (temporadaIds.length > 0) {
    query = query.in('temporada_id', temporadaIds);
  }
  if (rodadas.length > 0) {
    query = query.in('rodada', rodadas);
  }

  const { data: existing } = await query;
  const existingKeys = new Set(
    (existing || []).map((e: { rodada: number; time_casa_id: number; time_fora_id: number; temporada_id: number }) =>
      `${e.temporada_id}-${e.rodada}-${e.time_casa_id}-${e.time_fora_id}`
    )
  );

  const unique: JogoInput[] = [];
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

  return { unique, duplicates };
}

/** Import jogos with enrichment and duplicate validation */
export async function importJogosValidated(rawJogos: JogoInput[]): Promise<{ inserted: number; duplicates: number }> {
  const enriched = rawJogos.map(enrichJogo);
  const { unique, duplicates } = await filterDuplicates(enriched);

  if (unique.length > 0) {
    const { insertJogosBulk } = await import('@/services/api/games.api');
    await insertJogosBulk(unique);
  }

  return { inserted: unique.length, duplicates };
}

