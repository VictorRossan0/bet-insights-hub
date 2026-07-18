import SEO from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FlaskConical, Target, TrendingUp, Info } from "lucide-react";
import { supabase } from "@/services/supabase/client";
import { useLiga } from "@/contexts/LigaContext";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

type BacktestSummary = {
  linha?: number | null;
  total_jogos?: number | null;
  jogos_sinalizados?: number | null;
  taxa_acerto?: number | null;
  taxa_acerto_quando_over?: number | null;
  taxa_acerto_quando_under?: number | null;
  taxa_over_real_baseline?: number | null;
};

type BaselineRow = {
  competicao_id: number;
  liga: string | null;
  linha: number;
  taxa_over: number | null;
};

const BASELINE_LINHAS = [5, 7, 9, 10, 12] as const;
const LINHA_LABEL: Record<number, string> = {
  5: "Over 5 Cantos",
  7: "Over 7 Cantos",
  9: "Over 9 Cantos",
  10: "Over 10 Cantos",
  12: "Over 12 Cantos",
};

async function fetchBacktestCantos9(competicaoId: number) {
  const { data, error } = await supabase
    .from("backtest_cantos_summary")
    .select("*")
    .eq("linha", 9)
    .eq("competicao_id", competicaoId)
    .maybeSingle();
  if (error) throw error;
  return data as BacktestSummary | null;
}

async function fetchBacktestOver5(competicaoId: number) {
  const { data, error } = await supabase
    .from("backtest_over5_summary")
    .select("*")
    .eq("competicao_id", competicaoId)
    .maybeSingle();
  if (error) throw error;
  return data as BacktestSummary | null;
}

async function fetchBaselinesPorLiga(competicaoId: number): Promise<BaselineRow[]> {
  const { data, error } = await supabase
    .from("escanteios_taxas_por_liga")
    .select("competicao_id, liga, linha, taxa_over")
    .eq("competicao_id", competicaoId)
    .in("linha", BASELINE_LINHAS as unknown as number[]);
  if (error) throw error;
  return (data ?? []) as BaselineRow[];
}

export default function Backtesting() {
  const { ligaAtual } = useLiga();
  const ligaId = ligaAtual?.id ?? null;
  const ligaNome = ligaAtual?.nome ?? "Liga";
  const mostraRec = ligaAtual?.mostra_recomendacao_cantos === true;

  const {
    data: over9,
    isLoading: loading9,
    error: err9,
  } = useQuery({
    queryKey: ["backtest-cantos-9", ligaId],
    queryFn: () => fetchBacktestCantos9(ligaId!),
    enabled: !!ligaId,
  });
  const {
    data: over5,
    isLoading: loading5,
    error: err5,
  } = useQuery({
    queryKey: ["backtest-over5", ligaId],
    queryFn: () => fetchBacktestOver5(ligaId!),
    enabled: !!ligaId,
  });
  const { data: baselines = [], isLoading: loadingBase } = useQuery({
    queryKey: ["escanteios-taxas-por-liga", ligaId],
    queryFn: () => fetchBaselinesPorLiga(ligaId!),
    enabled: !!ligaId,
  });

  const taxa9 = over9?.taxa_acerto ?? 0;
  const baseline9 = over9?.taxa_over_real_baseline ?? 0;
  const edge9 = taxa9 - baseline9;

  const taxa5 = over5?.taxa_acerto ?? 0;
  const baseline5 = over5?.taxa_over_real_baseline ?? 0;
  const edge5 = taxa5 - baseline5;
  const under5 = over5?.taxa_acerto_quando_under ?? 0;

  const coverage9 =
    over9?.total_jogos && over9.total_jogos > 0 ? ((over9?.jogos_sinalizados ?? 0) / over9.total_jogos) * 100 : 0;

  const totalJogos = over9?.total_jogos ?? over5?.total_jogos ?? null;
  const baselineByLinha = new Map<number, number | null>(baselines.map((b) => [b.linha, b.taxa_over]));

  return (
    <div className="page-container space-y-8">
      <SEO
        title={`Backtesting — ${ligaNome}`}
        description={`Resultados de backtest histórico dos modelos de recomendação de escanteios em ${ligaNome}.`}
        path="/backtesting"
      />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <div className="flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-bet-green" />
          <h1 className="text-2xl font-display tracking-wide">Backtesting</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Validação histórica dos modelos
          {totalJogos ? ` em ${totalJogos.toLocaleString("pt-BR")} jogos` : ""} de {ligaNome}
        </p>
      </motion.div>

      {!ligaId && <p className="text-sm text-muted-foreground">Carregando liga…</p>}

      {/* Destaque: Over 9 combinado — só quando a liga tem sinal calibrado */}
      {ligaId &&
        (mostraRec ? (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.1 }}
            className="rounded-xl border border-bet-green/40 bg-bet-green/5 p-5"
          >
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-bet-green mt-1" />
              <div className="flex-1">
                <h2 className="font-display text-lg">Sinal com edge real — Over 9 Cantos (combinado)</h2>
                {loading9 ? (
                  <p className="text-sm text-muted-foreground mt-1">Carregando backtest…</p>
                ) : over9 ? (
                  <>
                    <p className="text-sm text-muted-foreground mt-1">
                      Quando a média combinada (H2H + Casa/Fora) é ≥ 9, o modelo acerta em{" "}
                      <span className="text-bet-green font-semibold">{taxa9.toFixed(1)}%</span> das ocorrências, contra
                      baseline de {baseline9.toFixed(1)}% — edge de{" "}
                      <span className="text-bet-green font-semibold">
                        {edge9 >= 0 ? "+" : ""}
                        {edge9.toFixed(1)} p.p.
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Cobertura: {coverage9.toFixed(1)}% dos jogos{" "}
                      {over9.jogos_sinalizados != null ? `(${over9.jogos_sinalizados} jogos sinalizados)` : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Ainda não há dados de backtest para {ligaNome}.</p>
                )}
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.1 }}
            className="rounded-xl border border-yellow-500/40 bg-yellow-500/5 p-5"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-400 mt-1" />
              <p className="text-sm text-muted-foreground">
                Sinal de escanteios ainda não calibrado com confiança pra{" "}
                <span className="text-foreground font-semibold">{ligaNome}</span> — mostrando só os números reais
                abaixo.
              </p>
            </div>
          </motion.section>
        ))}

      {/* Comparação de modelos */}
      {ligaId && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.15 }}
          className="space-y-3"
        >
          <h2 className="font-display text-lg">Modelos vs. baseline real</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card text-card-foreground p-4">
              <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: "hsl(150 39% 30%)" }}>
                Over 5 Cantos (legado)
              </div>
              <div className="text-2xl font-display mt-1">{loading5 ? "…" : over5 ? `${taxa5.toFixed(1)}%` : "—"}</div>
              {over5 && (
                <>
                  <div className="text-xs text-muted-foreground mt-1" style={{ color: "hsl(150 39% 30%)" }}>
                    Baseline real: {baseline5.toFixed(1)}% —{" "}
                    <span className={edge5 > 0 ? "text-bet-green" : "text-bet-red"}>
                      {edge5 > 0 ? "+" : ""}
                      {edge5.toFixed(1)} p.p.
                    </span>
                  </div>
                  <div className="text-xs text-bet-red mt-1">
                    Quando recomenda under: só {under5.toFixed(1)}% de acerto — evite seguir esse sinal
                  </div>
                </>
              )}
              {!loading5 && !over5 && (
                <div className="text-xs text-muted-foreground mt-1">Sem dados de backtest para {ligaNome}.</div>
              )}
              {err5 && <div className="text-xs text-bet-red mt-1">Erro ao carregar backtest.</div>}
            </div>
            <div className="rounded-lg border border-border bg-card text-card-foreground p-4">
              <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: "hsl(150 39% 30%)" }}>
                Over 9 Cantos (novo)
              </div>
              <div className="text-2xl font-display mt-1 text-bet-green">
                {loading9 ? "…" : over9 ? `${taxa9.toFixed(1)}%` : "—"}
              </div>
              {over9 && (
                <div className="text-xs text-muted-foreground mt-1" style={{ color: "hsl(150 39% 30%)" }}>
                  Baseline real: {baseline9.toFixed(1)}% —{" "}
                  <span className={edge9 > 0 ? "text-bet-green" : "text-bet-red"}>
                    {edge9 > 0 ? "+" : ""}
                    {edge9.toFixed(1)} p.p.
                  </span>
                </div>
              )}
              {!loading9 && !over9 && (
                <div className="text-xs text-muted-foreground mt-1">Sem dados de backtest para {ligaNome}.</div>
              )}
              {err9 && <div className="text-xs text-bet-red mt-1">Erro ao carregar backtest.</div>}
            </div>
          </div>
        </motion.section>
      )}

      {/* Tabela: taxa real de Over por linha */}
      {ligaId && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-display text-lg">Taxa real de Over por linha</h2>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2">Mercado</th>
                  <th className="text-right px-4 py-2">Taxa real</th>
                  <th className="text-right px-4 py-2">Valor de aposta</th>
                </tr>
              </thead>
              <tbody>
                {BASELINE_LINHAS.map((linha) => {
                  const taxa = baselineByLinha.get(linha);
                  const hasData = taxa != null;
                  const semValor = hasData && (taxa! >= 85 || taxa! <= 30);
                  return (
                    <tr key={linha} className="border-t border-border">
                      <td className="px-4 py-2">{LINHA_LABEL[linha]}</td>
                      <td className="px-4 py-2 text-right font-mono">
                        {loadingBase ? "…" : hasData ? `${taxa!.toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {!hasData ? (
                          <span className="text-muted-foreground">—</span>
                        ) : linha === 9 && mostraRec ? (
                          <span className="text-bet-green">Edge com filtro</span>
                        ) : semValor ? (
                          <span className="text-muted-foreground">Sem valor</span>
                        ) : (
                          <span className="text-muted-foreground">Neutro</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Dataset: {totalJogos ? `${totalJogos.toLocaleString("pt-BR")} jogos` : "histórico"} de {ligaNome}. Linhas
            com taxa ≥ 85% ou ≤ 30% não oferecem valor prático contra as odds típicas de mercado.
          </p>
        </motion.section>
      )}
    </div>
  );
}
