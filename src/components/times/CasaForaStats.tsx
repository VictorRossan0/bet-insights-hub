import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Home, Plane } from "lucide-react";
import { computeStatsCasaFora as fetchStatsCasaFora } from "@/services/domain/stats.service";
import { useLiga } from "@/contexts/LigaContext";
import type { StatsCasaFora } from "@/types/database";

type Metric = "gols" | "esc" | "cart";
const metricLabels: Record<Metric, string> = { gols: "Gols", esc: "Escanteios", cart: "Cartões" };

function getCasaValue(s: StatsCasaFora, metric: Metric) {
  if (metric === "gols") return s.media_gols_casa;
  if (metric === "esc") return s.media_esc_casa;
  return s.media_cart_casa;
}

function getForaValue(s: StatsCasaFora, metric: Metric) {
  if (metric === "gols") return s.media_gols_fora;
  if (metric === "esc") return s.media_esc_fora;
  return s.media_cart_fora;
}

export default function CasaForaStats() {
  const [metric, setMetric] = useState<Metric>("gols");
  const { temporadaSelecionadaId } = useLiga();
  const temporadaId = temporadaSelecionadaId;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats-casa-fora", temporadaId],
    queryFn: () => fetchStatsCasaFora(temporadaId!),
    enabled: !!temporadaId,
  });

  const chartData = useMemo(() => {
    if (!stats) return [];
    return [...stats]
      .sort((a, b) => getCasaValue(b, metric) - getCasaValue(a, metric))
      .slice(0, 12)
      .map((s) => ({
        nome: s.nome.length > 12 ? s.nome.slice(0, 12) + "…" : s.nome,
        Casa: +getCasaValue(s, metric).toFixed(1),
        Fora: +getForaValue(s, metric).toFixed(1),
      }));
  }, [stats, metric]);

  const tableData = useMemo(() => {
    if (!stats) return [];
    return [...stats].sort((a, b) => b.media_gols_casa - a.media_gols_casa);
  }, [stats]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="card-bet p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-bet-green" />
            <h2 className="text-sm font-semibold">Casa vs Fora — {metricLabels[metric]}</h2>
          </div>
          <div className="flex gap-1.5">
            {(Object.keys(metricLabels) as Metric[]).map((key) => (
              <button
                key={key}
                onClick={() => setMetric(key)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors active:scale-95 ${
                  metric === key
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {metricLabels[key]}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="h-72 bg-secondary/30 rounded animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(0 0% 55%)" }} />
              <YAxis type="category" dataKey="nome" width={110} tick={{ fontSize: 11, fill: "hsl(160 20% 12%)" }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0 0% 7%)",
                  border: "1px solid hsl(0 0% 14%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="Casa" fill="hsl(153 100% 50%)" radius={[0, 4, 4, 0]} barSize={10} />
              <Bar dataKey="Fora" fill="hsl(213 100% 65%)" radius={[0, 4, 4, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="card-bet overflow-hidden"
      >
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Plane className="w-4 h-4 text-bet-blue" />
          <h2 className="text-sm font-semibold">Detalhamento Casa / Fora</h2>
        </div>
        <div className="overflow-auto max-h-[480px] scrollbar-thin">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 bg-secondary rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="table-bet">
              <thead className="sticky top-0 bg-card z-10">
                <tr>
                  <th rowSpan={2}>Time</th>
                  <th colSpan={3} className="text-center text-bet-green border-b border-border">
                    🏠 Casa
                  </th>
                  <th colSpan={3} className="text-center text-bet-blue border-b border-border">
                    ✈️ Fora
                  </th>
                </tr>
                <tr>
                  <th className="text-center text-[10px]">Gols</th>
                  <th className="text-center text-[10px]">Esc.</th>
                  <th className="text-center text-[10px]">Cart.</th>
                  <th className="text-center text-[10px]">Gols</th>
                  <th className="text-center text-[10px]">Esc.</th>
                  <th className="text-center text-[10px]">Cart.</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((t) => (
                  <tr key={t.sigla}>
                    <td className="font-medium text-sm">{t.nome}</td>
                    <td className="text-center font-mono text-sm text-bet-green">{t.media_gols_casa.toFixed(1)}</td>
                    <td className="text-center font-mono text-sm">{t.media_esc_casa.toFixed(1)}</td>
                    <td className="text-center font-mono text-sm">{t.media_cart_casa.toFixed(1)}</td>
                    <td className="text-center font-mono text-sm text-bet-blue">{t.media_gols_fora.toFixed(1)}</td>
                    <td className="text-center font-mono text-sm">{t.media_esc_fora.toFixed(1)}</td>
                    <td className="text-center font-mono text-sm">{t.media_cart_fora.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
