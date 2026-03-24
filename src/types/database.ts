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
  time_a: string;
  time_b: string;
  total_jogos: number;
  media_gols: number;
  media_escanteios: number;
  pct_o5_cantos: number;
  pct_o6_cantos: number;
  pct_u35_gols: number;
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
