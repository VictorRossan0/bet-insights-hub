/**
 * VerdictStamp — rubber-stamp badge for bet recommendations.
 * Purely presentational: color + slight rotation by verdict.
 *
 * APOSTAR   → gold
 * CAUTELOSO → moss green
 * EVITAR    → stamp red
 * Anything else falls back to moss (neutral).
 */
type Verdict = 'APOSTAR' | 'CAUTELOSO' | 'EVITAR' | string;

type Props = {
  verdict: Verdict;
  /** Override rotation in degrees. Defaults to a stable per-verdict tilt. */
  rotate?: number;
  className?: string;
  /** Custom label (e.g. "APOSTAR OVER 5"). Defaults to `verdict`. */
  label?: string;
};

function variantFor(verdict: string): 'gold' | 'red' | 'moss' {
  const v = verdict.toUpperCase();
  if (v.startsWith('APOSTAR')) return 'gold';
  if (v.startsWith('EVITAR')) return 'red';
  return 'moss';
}

const defaultTilt: Record<'gold' | 'red' | 'moss', number> = {
  gold: -3,
  red: 2.5,
  moss: -1.5,
};

export default function VerdictStamp({ verdict, rotate, className = '', label }: Props) {
  const variant = variantFor(verdict);
  const tilt = rotate ?? defaultTilt[variant];
  return (
    <span
      className={`verdict-stamp verdict-stamp--${variant} ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
      role="img"
      aria-label={`Veredito: ${label ?? verdict}`}
    >
      {label ?? verdict}
    </span>
  );
}
