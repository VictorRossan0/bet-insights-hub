import { supabase } from './client';
import type { SugestaoAposta } from '@/types/database';

export async function fetchSugestoes(): Promise<SugestaoAposta[]> {
  const { data, error } = await supabase
    .from('sugestoes_apostas')
    .select('*')
    .order('id', { ascending: false });

  if (error) throw error;
  return (data as SugestaoAposta[]) || [];
}

export async function updateSugestaoStatus(id: number, status: 'green' | 'red') {
  const { error } = await supabase
    .from('sugestoes_apostas')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function saveSugestoes(sugestoes: Partial<SugestaoAposta>[]) {
  const { data, error } = await supabase
    .from('sugestoes_apostas')
    .insert(sugestoes)
    .select();

  if (error) throw error;
  return data as SugestaoAposta[];
}
