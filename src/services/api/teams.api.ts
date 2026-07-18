/**
 * teams.api.ts — Pure data access for times table.
 */
import { supabase } from "@/services/supabase/client";

export async function fetchTimes(competicaoId?: number): Promise<{ id: number; nome: string; sigla: string }[]> {
  let query = supabase.from("times").select("id, nome, sigla").order("nome");
  if (competicaoId) {
    query = query.eq("competicao_id", competicaoId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchTimeById(id: number): Promise<{ nome: string } | null> {
  const { data, error } = await supabase.from("times").select("nome").eq("id", id).single();
  if (error) return null;
  return data;
}

/**
 * @deprecated Temporadas agora vêm de `competicoes` via LigaContext + RPC `get_temporada_atual`.
 * Este helper permanece como fallback vazio para não quebrar imports legados.
 */
export function getTemporadas(): { id: number; ano: number }[] {
  return [];
}
