/**
 * stats-views.api.ts — Data access for SQL views and functions on external Supabase.
 */
import { supabase } from '@/services/supabase/client';
import type {
  StatsTeamForm,
  StatsMarketProbability,
  StatsH2HEnhanced,
  MarketProbabilityRow,
} from '@/types/database';

/** View: stats_team_form — team form for current season */
export async function fetchStatsTeamForm(): Promise<StatsTeamForm[]> {
  const { data, error } = await supabase
    .from('stats_team_form')
    .select('*')
    .order('pontos_ultimos5', { ascending: false });
  if (error) throw error;
  return (data as StatsTeamForm[]) || [];
}

/** View: stats_market_probability — market probabilities per team */
export async function fetchStatsMarketProbability(): Promise<StatsMarketProbability[]> {
  const { data, error } = await supabase
    .from('stats_market_probability')
    .select('*')
    .order('prob_o5_cantos', { ascending: false });
  if (error) throw error;
  return (data as StatsMarketProbability[]) || [];
}

/** View: stats_h2h_enhanced — H2H with automatic recommendation */
export async function fetchStatsH2HEnhanced(
  timeAId?: number,
  timeBId?: number
): Promise<StatsH2HEnhanced[]> {
  let query = supabase.from('stats_h2h_enhanced').select('*');

  if (timeAId && timeBId) {
    query = query
      .or(`and(time_a_id.eq.${timeAId},time_b_id.eq.${timeBId}),and(time_a_id.eq.${timeBId},time_b_id.eq.${timeAId})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as StatsH2HEnhanced[]) || [];
}

/** RPC: get_team_form(p_team_id, p_last_n) */
export async function rpcGetTeamForm(teamId: number, lastN: number = 5) {
  const { data, error } = await supabase.rpc('get_team_form', {
    p_team_id: teamId,
    p_last_n: lastN,
  });
  if (error) throw error;
  return data || [];
}

/** RPC: calculate_market_probability(p_team_id) */
export async function rpcCalculateMarketProbability(
  teamId: number
): Promise<MarketProbabilityRow[]> {
  const { data, error } = await supabase.rpc('calculate_market_probability', {
    p_team_id: teamId,
  });
  if (error) throw error;
  return (data as MarketProbabilityRow[]) || [];
}
