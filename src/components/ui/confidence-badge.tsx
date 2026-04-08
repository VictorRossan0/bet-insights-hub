/**
 * Visual confidence indicator for betting suggestions.
 * Supports numeric (0-100) and categorical (HIGH/MEDIUM/LOW) levels.
 */
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';

type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

type ConfidenceBadgeProps = {
  /** Numeric confidence 0-100, or categorical level */
  value: number | ConfidenceLevel;
  showBar?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md';
};

function resolveLevel(value: number | ConfidenceLevel): { level: ConfidenceLevel; pct: number } {
  if (typeof value === 'string') {
    const pct = value === 'HIGH' ? 90 : value === 'MEDIUM' ? 65 : 35;
    return { level: value, pct };
  }
  const level: ConfidenceLevel = value >= 75 ? 'HIGH' : value >= 50 ? 'MEDIUM' : 'LOW';
  return { level, pct: Math.min(value, 100) };
}

const config: Record<ConfidenceLevel, { icon: typeof Shield; color: string; bg: string; barColor: string; label: string }> = {
  HIGH: {
    icon: ShieldCheck,
    color: 'text-bet-green',
    bg: 'bg-bet-green/15',
    barColor: 'bg-bet-green',
    label: 'Alta',
  },
  MEDIUM: {
    icon: ShieldAlert,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/15',
    barColor: 'bg-yellow-500',
    label: 'Média',
  },
  LOW: {
    icon: ShieldX,
    color: 'text-destructive',
    bg: 'bg-destructive/15',
    barColor: 'bg-destructive',
    label: 'Baixa',
  },
};

export default function ConfidenceBadge({ value, showBar = true, showLabel = true, size = 'md' }: ConfidenceBadgeProps) {
  const { level, pct } = resolveLevel(value);
  const { icon: Icon, color, bg, barColor, label } = config[level];
  const isSm = size === 'sm';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 ${isSm ? 'text-[10px]' : 'text-xs'} font-semibold px-2 py-0.5 rounded-full ${bg} ${color}`}>
          <Icon className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          {showLabel && label}
          <span className="font-mono">{pct}%</span>
        </span>
      </div>
      {showBar && (
        <div className="flex items-center gap-2">
          <div className={`flex-1 ${isSm ? 'h-1' : 'h-1.5'} bg-secondary rounded-full overflow-hidden`}>
            <div
              className={`h-full rounded-full ${barColor} transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Inline verdict badge for recommendation outcomes */
export function VerdictBadge({ verdict }: { verdict: string }) {
  const isApostar = verdict === 'APOSTAR';
  const isCauteloso = verdict === 'CAUTELOSO';

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
      isApostar
        ? 'bg-bet-green/15 text-bet-green'
        : isCauteloso
          ? 'bg-yellow-500/15 text-yellow-400'
          : 'bg-destructive/15 text-destructive'
    }`}>
      {isApostar ? <ShieldCheck className="w-3.5 h-3.5" /> : isCauteloso ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldX className="w-3.5 h-3.5" />}
      {verdict}
    </span>
  );
}
