import { supabase } from '@/services/supabase/client';

export async function getProbabilidadeOver25Gols(
  timeCasaId: number,
  timeForaId: number,
  data?: string
): Promise<{ lambda: number; probabilidade: number } | null> {
  const dataRef = data ?? new Date().toISOString().slice(0, 10);
  const { data: lambda, error: e1 } = await supabase.rpc('get_lambda_gols' as never, {
    p_time_casa: timeCasaId,
    p_time_fora: timeForaId,
    p_data: dataRef,
  } as never);
  if (e1 || lambda == null) return null;
  const { data: prob, error: e2 } = await supabase.rpc('poisson_over_prob' as never, {
    p_lambda: lambda,
    p_k: 2,
  } as never);
  if (e2 || prob == null) return null;
  return { lambda: lambda as number, probabilidade: (prob as number) * 100 };
}

export async function getProbabilidadeOver7Cartoes(
  timeCasaId: number,
  timeForaId: number,
  data?: string
): Promise<{ lambda: number; probabilidade: number } | null> {
  const dataRef = data ?? new Date().toISOString().slice(0, 10);
  const { data: lambda, error: e1 } = await supabase.rpc('get_lambda_cartoes' as never, {
    p_time_casa: timeCasaId,
    p_time_fora: timeForaId,
    p_data: dataRef,
  } as never);
  if (e1 || lambda == null) return null;
  const { data: prob, error: e2 } = await supabase.rpc('poisson_over_prob' as never, {
    p_lambda: lambda,
    p_k: 7,
  } as never);
  if (e2 || prob == null) return null;
  return { lambda: lambda as number, probabilidade: (prob as number) * 100 };
}
