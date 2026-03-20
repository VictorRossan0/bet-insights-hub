export type Time = {
  id: number;
  nome: string;
  escudo_url?: string;
  sofascore_id?: number;
};

export type Jogo = {
  id: number;
  rodada: number;
  data_hora: string;
  time_casa_id: number;
  time_fora_id: number;
  time_casa_nome: string;
  time_fora_nome: string;
  gols_casa: number;
  gols_fora: number;
  gols_total: number;
  escanteios_casa: number;
  escanteios_fora: number;
  escanteios_total: number;
  cartoes_casa: number;
  cartoes_fora: number;
  cartoes_total: number;
  cartoes_amarelos_casa: number;
  cartoes_amarelos_fora: number;
  cartoes_vermelhos_casa: number;
  cartoes_vermelhos_fora: number;
  o5_cantos: boolean;
  o6_cantos: boolean;
  o7_cantos: boolean;
  u35_gols: boolean;
  u25_gols: boolean;
  u7_cartoes: boolean;
  o8_escanteios: boolean;
  o9_escanteios: boolean;
  fonte?: string;
  sofascore_id?: number;
  created_at?: string;
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
  pct_o8_escanteios: number;
  pct_o9_escanteios: number;
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
  mercado: string;
  tipo: string;
  descricao: string;
  confianca: number;
  odd_sugerida: number;
  status?: 'pendente' | 'green' | 'red';
  created_at: string;
};

export type MarketData = {
  nome: string;
  percentual: number;
  classificacao: string;
};
