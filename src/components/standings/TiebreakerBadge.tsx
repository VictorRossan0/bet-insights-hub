/**
 * TiebreakerBadge — fonte única de verdade para cores, rótulos e mensagens
 * dos badges de critério de desempate na tabela de classificação.
 */
import type { TiebreakerKind } from '@/lib/standings';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export type TiebreakerMeta = {
  short: string;
  className: string;
  legend: string;
};

export const TIEBREAKER_META: Record<Exclude<TiebreakerKind, 'none'>, TiebreakerMeta> = {
  h2h: {
    short: 'H2H',
    className: 'bg-bet-green/15 text-bet-green border-bet-green/30',
    legend: 'Confronto direto aplicado (2 clubes empatados)',
  },
  criteria: {
    short: 'Critérios',
    className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    legend: 'Sem confronto direto — empate com 3+ clubes',
  },
  unresolved: {
    short: '=',
    className: 'bg-destructive/15 text-destructive border-destructive/30',
    legend: 'Empate persistente após confronto direto',
  },
};

type Props = {
  kind: TiebreakerKind;
  label: string;
  steps?: string[];
  tiedWith?: string[];
};

export function TiebreakerBadge({ kind, label, steps, tiedWith }: Props) {
  if (kind === 'none') return null;
  const meta = TIEBREAKER_META[kind];
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded border cursor-help ${meta.className}`}
            aria-label={label}
          >
            {meta.short}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs space-y-1.5">
          <div className="text-xs font-semibold">{label}</div>
          {tiedWith && tiedWith.length > 0 && (
            <div className="text-[11px] text-muted-foreground">
              Times comparados: {tiedWith.join(' x ')}
            </div>
          )}
          {steps && steps.length > 0 && (
            <ol className="text-[11px] space-y-0.5 list-decimal list-inside">
              {steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function TiebreakerLegend() {
  return (
    <>
      {(Object.keys(TIEBREAKER_META) as Array<keyof typeof TIEBREAKER_META>).map(k => {
        const m = TIEBREAKER_META[k];
        return (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${m.className}`}>{m.short}</span>
            {m.legend}
          </span>
        );
      })}
    </>
  );
}
