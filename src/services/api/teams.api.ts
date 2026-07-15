/**
 * teams.api.ts — Pure data access for times table.
 */
import { supabase } from '@/services/supabase/client';

export async function fetchTimes(): Promise<{ id: number; nome: string; sigla: string }[]> {
  const { data, error } = await supabase.from('times').select('id, nome, sigla').order('nome');
  if (error) throw error;
  return data || [];
}

export async function fetchTimeById(id: number): Promise<{ nome: string } | null> {
  const { data, error } = await supabase.from('times').select('nome').eq('id', id).single();
  if (error) return null;
  return data;
}

/** Hardcoded temporadas (external Supabase table is empty) */
export function getTemporadas(): { id: number; ano: number }[] {
  return [
    { id: 1, ano: 2026 },
    { id: 2, ano: 2025 },
    { id: 3, ano: 2024 },
    { id: 4, ano: 2023 },
    { id: 5, ano: 2022 },
  ];
}
