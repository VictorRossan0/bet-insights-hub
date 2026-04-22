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
  const gols_total = j.gols_total ?? gols_casa + gols_fora;
  const esc_casa = j.escanteios_casa ?? 0;
  const esc_fora = j.escanteios_fora ?? 0;
  const esc_total = j.escanteios_total ?? esc_casa + esc_fora;
  const cartoes = j.cartoes_total ?? 0;
  const resultado = j.resultado ?? (gols_casa > gols_fora ? 'casa' : gols_fora > gols_casa ? 'fora' : 'empate');

  const { gols_total: _gt, escanteios_total: _et, ...rest } = j;
  return {
    ...rest,
    gols_casa,
    gols_fora,
    // gols_total e escanteios_total são GERADAS no banco — não enviar
    resultado,
    escanteios_casa: esc_casa,
    escanteios_fora: esc_fora,
    cartoes_total: cartoes,
    o5_cantos: j.o5_cantos ?? esc_total > 5,
    o6_cantos: j.o6_cantos ?? esc_total > 6,
    o7_cantos: j.o7_cantos ?? esc_total > 7,
    o8_cantos: j.o8_cantos ?? esc_total > 8,
    o9_cantos: j.o9_cantos ?? esc_total > 9,
    u35_gols: j.u35_gols ?? gols_total < 3.5,
    u25_gols: j.u25_gols ?? gols_total < 2.5,
    u7_cartoes: j.u7_cartoes ?? cartoes < 7,
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
    const { error } = await supabase.from('jogos').insert(unique).select();
    if (error) throw error;
  }

  return { inserted: unique.length, duplicates };
}
