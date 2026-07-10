export type Time = {
  id: number;
  nome: string;
  sigla: string;
  criado_em?: string;
};

export type Temporada = {
  id: number;
  ano: number;
  nome?: string;
};

export type Jogo = {
  id: number;
  rodada: number;
  data_jogo: string;
  temporada_id: number;
  time_casa_id: number;
  time_fora_id: number;
  gols_casa: number;
  gols_fora: number;
  gols_total: number;
  resultado?: 'casa' | 'fora' | 'empate';
  escanteios_casa: number;
  escanteios_fora: number;
  escanteios_total: number;
  escanteios_total_manual?: number;
  cartoes_amarelos: number;
  cartoes_vermelhos: number;
  cartoes_total: number;
  cartoes_total_manual?: number;
  status?: 'agendado' | 'ao_vivo' | 'finalizado';
  espn_event_id?: string;
  stats_sincronizados?: boolean;
  o5_cantos: boolean;
  o6_cantos: boolean;
  o7_cantos: boolean;
  o8_cantos: boolean;
  o9_cantos: boolean;
  u35_gols: boolean;
  u25_gols: boolean;
  u7_cartoes: boolean;
  fonte?: string;
  criado_em?: string;
};

/** Row from the jogos_resumo view — totals already resolved */
export type JogoResumo = {
  id: number;
  rodada: number;
  data_jogo: string;
  temporada_id: number;
  temporada?: number;
  time_casa: string;
  time_fora: string;
  time_casa_sigla?: string;
  time_fora_sigla?: string;
  gols_casa: number;
  gols_fora: number;
  gols_total: number;
  resultado?: 'casa' | 'fora' | 'empate';
  escanteios: number;
  cartoes: number;
  o5_cantos: boolean;
  o6_cantos: boolean;
  o7_cantos: boolean;
  o8_cantos: boolean;
  o9_cantos: boolean;
  u35_gols: boolean;
  u25_gols: boolean;
  u7_cartoes: boolean;
};

/** Jogo with team names resolved via join (legacy) */
export type JogoComTimes = Jogo & {
  time_casa: Pick<Time, 'nome' | 'sigla'>;
  time_fora: Pick<Time, 'nome' | 'sigla'>;
};

export type StatsPorRodada = {
  rodada: number;
  total_jogos: number;
  media_gols: number;
  media_escanteios: number;
  media_cartoes: number;
  pct_o5_cantos: number;
  pct_o6_cantos: number;
  pct_o7_cantos: number;
  pct_u35_gols: number;
  pct_u25_gols: number;
};

export type StatsAcumulado = {
  total_jogos: number;
  total_rodadas: number;
  media_gols: number;
  media_escanteios: number;
  media_cartoes: number;
  pct_o5_cantos: number;
  pct_o6_cantos: number;
  pct_o7_cantos: number;
  pct_u35_gols: number;
  pct_u25_gols: number;
  pct_u7_cartoes: number;
  pct_o8_cantos: number;
  pct_o9_cantos: number;
};

export type StatsPorTime = {
  time_id: number;
  nome: string;
  sigla: string;
  total_jogos: number;
  media_gols_jogo: number;
  media_escanteios_jogo: number;
  media_cartoes_jogo: number;
  pct_o5: number;
  pct_o6: number;
  pct_u35: number;
};

export type StatsCasaFora = {
  time_id: number;
  nome: string;
  sigla: string;
  jogos_casa: number;
  media_gols_casa: number;
  media_esc_casa: number;
  media_cart_casa: number;
  jogos_fora: number;
  media_gols_fora: number;
  media_esc_fora: number;
  media_cart_fora: number;
  /** Média ponderada dos escanteios nos últimos jogos naquele mando (RPC get_forma_escanteios_recente) */
  media_esc_recente?: number;
};


export type StatsPorTemporada = {
  ano: number;
  total_jogos: number;
  media_gols: number;
  media_escanteios: number;
  media_cartoes: number;
  pct_o5_cantos: number;
  pct_o6_cantos: number;
  pct_o7_cantos: number;
  pct_u35_gols: number;
  pct_u7_cartoes: number;
};

export type StatsH2H = {
  time_a_id: number;
  time_b_id: number;
  time_a_nome: string;
  time_b_nome: string;
  total_jogos: number;
  media_gols: number;
  media_escanteios: number;
  media_cartoes: number;
};

export type ApostaSugerida = {
  id: number;
  temporada_id: number;
  rodada: number;
  jogo_id?: number;
  time_casa_id?: number;
  time_fora_id?: number;
  mercado: string;
  tipo: string;
  justificativa?: string;
  base_historica?: string;
  base_h2h?: string;
  base_casa_fora?: string;
  confianca: number;
  odd_minima?: number;
  odd_sugerida?: number;
  resultado?: 'pendente' | 'ganhou' | 'perdeu' | 'void';
  enviado_telegram: boolean;
  criado_em?: string;
  // Joined
  time_casa?: { nome: string };
  time_fora?: { nome: string };
};

export type SugestaoAposta = {
  id: number;
  rodada_referencia: number;
  jogo_id?: number;
  mercado: string;
  tipo_aposta: string;
  descricao: string;
  confianca: number;
  odd_sugerida: number;
  resultado?: 'pendente' | 'ganhou' | 'perdeu';
  enviado_telegram: boolean;
  criado_em?: string;
};

export type MarketData = {
  nome: string;
  percentual: number;
  classificacao: string;
};

// ── New SQL View types ────────────────────────────────────

export type StatsTeamForm = {
  team_id: number;
  team_nome: string;
  team_sigla: string;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  media_gols_pro: number;
  media_gols_contra: number;
  media_escanteios: number;
  forma_5jogos: string;
  pontos_ultimos5: number;
};

export type StatsMarketProbability = {
  team_id: number;
  team_nome: string;
  team_sigla: string;
  total_jogos: number;
  prob_o5_cantos: number;
  prob_o6_cantos: number;
  prob_o7_cantos: number;
  prob_o8_cantos: number;
  prob_u35_gols: number;
  prob_u25_gols: number;
  prob_u7_cartoes: number;
  media_esc: number;
  media_gols: number;
  media_cart: number;
  prob_o5_casa: number;
  prob_o5_fora: number;
};

export type StatsH2HEnhanced = {
  time_a_id: number;
  time_a_nome: string;
  time_b_id: number;
  time_b_nome: string;
  total_jogos: number;
  media_esc: number;
  media_gols: number;
  media_cart: number;
  pct_o5: number;
  pct_o6: number;
  pct_o7: number;
  pct_u35_gols: number;
  pct_u7_cart: number;
  recomendacao: string;
};

export type MarketProbabilityRow = {
  mercado: string;
  ocorrencias: number;
  total_jogos: number;
  probabilidade: number | null;
  confianca: string;
};
