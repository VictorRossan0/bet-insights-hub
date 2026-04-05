/**
 * bets.api.ts — Pure data access for apostas_sugeridas / sugestoes_apostas_view.
 */
import { supabase } from '@/services/supabase/client';

/** Fetch suggested bets (prefers the view with team names) */
export async function fetchApostasSugeridas() {
  // Try the view first (has team names already joined)
  const { data, error } = await supabase
    .from('sugestoes_apostas_view')
    .select('*')
    .order('criado_em', { ascending: false });

  if (!error && data) return data;

  // Fallback: query apostas_sugeridas directly
  const { data: plain, error: err2 } = await supabase
    .from('apostas_sugeridas')
    .select('*')
    .order('criado_em', { ascending: false });
  if (err2) throw err2;
  return plain || [];
}
