export type Time = {
  id: number;
  nome: string;
  sigla: string;
  criado_em?: string;
};

export type Jogo = {
  id: number;
  rodada: number;
  data_jogo: string;
  time_casa_id: number;
  time_fora_id: number;
  gols_casa: number;
  gols_fora: number;
  gols_total: number;
  resultado?: 'casa' | 'fora' | 'empate';
  escanteios_casa: number;
  escanteios_fora: number;
  escanteios_total: number;
  cartoes_amarelos: number;
  cartoes_vermelhos: number;
  cartoes_total: number;
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

/** Jogo with team names resolved via join */
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
  time_nome: string;
  total_jogos: number;
  media_gols: number;
  media_escanteios: number;
  media_cartoes: number;
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
