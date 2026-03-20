import type { JogoComTimes } from '@/types/database';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  jogos: JogoComTimes[];
  isLoading: boolean;
  page: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

function BoolBadge({ value }: { value: boolean }) {
  return (
    <span className={value ? 'badge-green' : 'badge-red'}>
      {value ? '✅' : '❌'}
    </span>
  );
}

export default function GamesTable({ jogos, isLoading, page, totalCount, pageSize, onPageChange }: Props) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-secondary/50 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (jogos.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium mb-1">Nenhum jogo encontrado</p>
        <p className="text-sm">Ajuste os filtros ou aguarde a importação de dados.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto scrollbar-thin rounded-lg border border-border">
        <table className="table-bet">
          <thead>
            <tr className="bg-secondary/30">
              <th>Rod.</th>
              <th>Jogo</th>
              <th>Gols</th>
              <th>Escanteios</th>
              <th>Cartões</th>
              <th>O5</th>
              <th>O6</th>
              <th>O7</th>
              <th>U3.5G</th>
              <th>U2.5G</th>
              <th>U7 Cart.</th>
              <th>O8C</th>
              <th>O9C</th>
            </tr>
          </thead>
          <tbody>
            {jogos.map((j) => (
              <tr key={j.id}>
                <td className="font-mono text-xs text-muted-foreground">{j.rodada}</td>
                <td className="whitespace-nowrap">
                  <span className="font-medium text-sm">{j.time_casa?.nome ?? '—'}</span>
                  <span className="badge-score mx-2">{j.gols_casa}x{j.gols_fora}</span>
                  <span className="font-medium text-sm">{j.time_fora?.nome ?? '—'}</span>
                </td>
                <td className="font-mono text-sm">{j.gols_total}</td>
                <td className="font-mono text-sm">{j.escanteios_total}</td>
                <td className="font-mono text-sm">{j.cartoes_total}</td>
                <td><BoolBadge value={j.o5_cantos} /></td>
                <td><BoolBadge value={j.o6_cantos} /></td>
                <td><BoolBadge value={j.o7_cantos} /></td>
                <td><BoolBadge value={j.u35_gols} /></td>
                <td><BoolBadge value={j.u25_gols} /></td>
                <td><BoolBadge value={j.u7_cartoes} /></td>
                <td><BoolBadge value={j.o8_cantos} /></td>
                <td><BoolBadge value={j.o9_cantos} /></td>
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
    </div>
  );
}
