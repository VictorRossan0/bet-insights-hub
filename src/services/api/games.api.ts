/**
 * games.api.ts — Pure data access layer for jogos table.
 * No business logic here, only Supabase communication.
 */
import { supabase } from '@/services/supabase/client';
import { supabase as cloudSupabase } from '@/integrations/supabase/client';
import type { Jogo } from '@/types/database';

/**
 * Client-side defense-in-depth: block mutations unless the current Lovable Cloud
 * user has the `admin` role. The authoritative check must live in the external
 * Supabase RLS policies (see docs) — this only prevents accidental calls from
 * the app. Server-side RLS on the external project MUST also enforce admin.
 */
async function assertAdmin(): Promise<void> {
  const { data: { user } } = await cloudSupabase.auth.getUser();
  if (!user) {
    throw new Error('Você precisa estar autenticado para executar esta ação.');
  }
  const { data, error } = await cloudSupabase
    .from('user_roles' as never)
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  if (error) {
    throw new Error('Não foi possível validar suas permissões.');
  }
  if (!data) {
    throw new Error('Ação restrita a administradores.');
  }
}

export type JogosFilters = {
  rodada?: number;
  time?: string;
  temporada_id?: number;
  page?: number;
  pageSize?: number;
};

export type JogoComTimesRaw = {
  id: number;
  rodada: number;
  data_jogo: string;
  temporada_id: number;
  gols_casa: number;
  gols_fora: number;
  gols_total: number;
  resultado: string | null;
  escanteios_casa: number;
  escanteios_fora: number;
  escanteios_total: number;
  cartoes_total: number;
  status: string | null;
  cartoes_amarelos: number;
  cartoes_vermelhos: number;
  o5_cantos: boolean;
  o6_cantos: boolean;
  o7_cantos: boolean;
  o8_cantos: boolean;
  o9_cantos: boolean;
  u35_gols: boolean;
  u25_gols: boolean;
  u7_cartoes: boolean;
  time_casa: { nome: string; sigla: string } | null;
  time_fora: { nome: string; sigla: string } | null;
};

const JOGOS_SELECT = `
  id, rodada, data_jogo, temporada_id,
  gols_casa, gols_fora, gols_total, resultado,
  escanteios_casa, escanteios_fora, escanteios_total,
  cartoes_total, status,
  cartoes_amarelos, cartoes_vermelhos,
  o5_cantos, o6_cantos, o7_cantos, o8_cantos, o9_cantos,
  u35_gols, u25_gols, u7_cartoes,
  time_casa:times!jogos_time_casa_id_fkey(nome, sigla),
  time_fora:times!jogos_time_fora_id_fkey(nome, sigla)
`.replace(/\n/g, '');

function assertTemporada(temporada_id: number | undefined): number {
  if (!temporada_id) {
    throw new Error('temporada_id é obrigatório — selecione uma liga/temporada antes de consultar jogos.');
  }
  return temporada_id;
}

/** Fetch paginated games with team joins */
export async function fetchJogosPaginated(filters: JogosFilters = {}) {
  const { page = 1, pageSize = 10, rodada, time } = filters;
  const temporada_id = assertTemporada(filters.temporada_id);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('jogos')
    .select(JOGOS_SELECT, { count: 'exact' })
    .eq('temporada_id', temporada_id)
    .order('rodada', { ascending: false })
    .order('data_jogo', { ascending: false })
    .range(from, to);

  if (rodada) query = query.eq('rodada', rodada);

  const { data, error, count } = await query;
  if (error) throw error;

  let results = ((data as unknown) as JogoComTimesRaw[]) || [];

  if (time) {
    const lower = time.toLowerCase();
    results = results.filter(j =>
      j.time_casa?.nome?.toLowerCase().includes(lower) ||
      j.time_fora?.nome?.toLowerCase().includes(lower)
    );
  }

  return { data: results, count: time ? results.length : (count || 0) };
}

/** Fetch ALL games for a season (for stats aggregation) */
export async function fetchAllJogos(temporada_id: number): Promise<JogoComTimesRaw[]> {
  const allData: JogoComTimesRaw[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('jogos')
      .select(JOGOS_SELECT)
      .eq('temporada_id', temporada_id)
      .order('rodada', { ascending: true })
      .range(from, from + batchSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    allData.push(...((data as unknown) as JogoComTimesRaw[]));
    if (data.length < batchSize) break;
    from += batchSize;
  }

  return allData;
}

/** Fetch distinct rodadas for a season */
export async function fetchRodadas(temporada_id: number = DEFAULT_TEMPORADA): Promise<number[]> {
  const { data, error } = await supabase
    .from('jogos')
    .select('rodada')
    .eq('temporada_id', temporada_id)
    .order('rodada', { ascending: true });

  if (error) throw error;
  return [...new Set((data || []).map((d: { rodada: number }) => d.rodada))];
}

/** Create a single game */
export async function createJogo(jogo: Partial<Jogo>) {
  await assertAdmin();
  const { data, error } = await supabase.from('jogos').insert(jogo).select().single();
  if (error) throw error;
  return data as Jogo;
}

/** Update a single game */
export async function updateJogo(id: number, updates: Partial<Jogo>) {
  await assertAdmin();
  const { data, error } = await supabase.from('jogos').update(updates).eq('id', id).select();
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Atualização bloqueada pelo banco. Verifique suas permissões.');
  }
  return data[0] as Jogo;
}

/** Delete a single game */
export async function deleteJogo(id: number) {
  await assertAdmin();
  const { data, error } = await supabase.from('jogos').delete().eq('id', id).select();
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Exclusão bloqueada pelo banco. Verifique suas permissões.');
  }
  return true;
}

/** Bulk insert games */
export async function insertJogosBulk(jogos: Partial<Jogo>[]) {
  await assertAdmin();
  const { data, error } = await supabase.from('jogos').insert(jogos).select();
  if (error) throw error;
  return data as Jogo[];
}

/** Check existing games by composite key */
export async function fetchExistingGameKeys(temporada_id: number): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('jogos')
    .select('temporada_id, rodada, time_casa_id, time_fora_id')
    .eq('temporada_id', temporada_id);

  if (error) throw error;

  const keys = new Set<string>();
  for (const row of data || []) {
    keys.add(`${row.temporada_id}-${row.rodada}-${row.time_casa_id}-${row.time_fora_id}`);
  }
  return keys;
}

/** Fetch H2H games between two teams */
export async function fetchH2HGames(idA: number, idB: number) {
  const { data, error } = await supabase
    .from('jogos')
    .select('id, gols_total, escanteios_total, cartoes_total, time_casa_id, time_fora_id')
    .or(`and(time_casa_id.eq.${idA},time_fora_id.eq.${idB}),and(time_casa_id.eq.${idB},time_fora_id.eq.${idA})`);

  if (error) throw error;
  return data || [];
}
