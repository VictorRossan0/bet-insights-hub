import { useState } from "react";
import type { JogoComTimesRaw } from "@/services/api/games.api";
import { ChevronLeft, ChevronRight, Pencil, Database, Info } from "lucide-react";
import FormEditarJogo from "@/components/FormEditarJogo";
import { SkeletonTable } from "@/components/ui/skeleton-loaders";
import EmptyState from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  jogos: JogoComTimesRaw[];
  isLoading: boolean;
  page: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onUpdate?: () => void;
};

function BoolBadge({ value }: { value: boolean }) {
  return <span className={value ? "badge-green" : "badge-red"}>{value ? "✅" : "❌"}</span>;
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (status === "ao_vivo") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500">
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        AO VIVO
      </span>
    );
  }
  if (status === "agendado") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
        Agendado
      </span>
    );
  }
  return null;
}

export default function GamesTable({ jogos, isLoading, page, totalCount, pageSize, onPageChange, onUpdate }: Props) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const [editingJogo, setEditingJogo] = useState<JogoComTimesRaw | null>(null);
  const { isAdmin } = useAuth();

  if (isLoading) {
    return <SkeletonTable rows={pageSize} cols={14} />;
  }

  if (jogos.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title="Nenhum jogo encontrado"
        description="Ajuste os filtros ou importe dados para começar a analisar."
      />
    );
  }

  return (
    <div>
      <div className="overflow-x-auto scrollbar-thin rounded-lg border border-border">
        <table className="table-bet">
          <thead>
            <tr className="bg-secondary/30">
              <th>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 cursor-help">
                      Rod.
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    Rodada calculada automaticamente por data. Pode conter pequenas imprecisões em temporadas com jogos
                    remarcados (ex: 2024, 2025).
                  </TooltipContent>
                </Tooltip>
              </th>
              <th>Jogo</th>
              <th>Gols</th>
              <th>Esc.</th>
              <th>Cart.</th>
              <th>O5</th>
              <th>O6</th>
              <th>O7</th>
              <th>U3.5G</th>
              <th>U2.5G</th>
              <th>U7 Cart.</th>
              <th>O8C</th>
              <th>O9C</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {jogos.map((j) => (
              <tr key={j.id} data-testid={`row-jogo-${j.id}`}>
                <td className="font-mono text-xs text-muted-foreground">{j.rodada}</td>
                <td className="whitespace-nowrap">
                  <span className="font-medium text-sm">{j.time_casa?.nome ?? "—"}</span>
                  <span className="badge-score mx-2">
                    {j.gols_casa}x{j.gols_fora}
                  </span>
                  <StatusBadge status={j.status} />
                  <span className="font-medium text-sm">{j.time_fora?.nome ?? "—"}</span>
                </td>
                <td className="font-mono text-sm">{j.gols_total}</td>
                <td className="font-mono text-sm">{j.escanteios_total}</td>
                <td className="font-mono text-sm">
                  {j.cartoes_amarelos != null && j.cartoes_vermelhos != null ? (
                    <span>
                      🟨{j.cartoes_amarelos} 🟥{j.cartoes_vermelhos}
                    </span>
                  ) : (
                    j.cartoes_total
                  )}
                </td>
                <td>
                  <BoolBadge value={j.o5_cantos} />
                </td>
                <td>
                  <BoolBadge value={j.o6_cantos} />
                </td>
                <td>
                  <BoolBadge value={j.o7_cantos} />
                </td>
                <td>
                  <BoolBadge value={j.u35_gols} />
                </td>
                <td>
                  <BoolBadge value={j.u25_gols} />
                </td>
                <td>
                  <BoolBadge value={j.u7_cartoes} />
                </td>
                <td>
                  <BoolBadge value={j.o8_cantos} />
                </td>
                <td>
                  <BoolBadge value={j.o9_cantos} />
                </td>
                {isAdmin && (
                  <td>
                    <button
                      onClick={() => setEditingJogo(j)}
                      className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                      title="Editar jogo"
                      data-testid={`btn-editar-${j.id}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} de {totalCount}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs">
              {page}/{totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {editingJogo && (
        <FormEditarJogo jogo={editingJogo} onSuccess={() => onUpdate?.()} onClose={() => setEditingJogo(null)} />
      )}
    </div>
  );
}
