/**
 * Skeleton loaders for professional loading states.
 * Replaces generic pulse divs with contextual, recognizable shapes.
 */
import { motion } from 'framer-motion';

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.04] before:to-transparent';

function Bone({ className = '' }: { className?: string }) {
  return <div className={`rounded bg-secondary/60 ${shimmer} ${className}`} />;
}

/** KPI card skeleton — icon row + large number */
export function SkeletonKPI() {
  return (
    <div className="kpi-card min-w-[140px] snap-start flex-shrink-0 md:min-w-0 md:flex-shrink space-y-3">
      <div className="flex items-center gap-2">
        <Bone className="w-4 h-4 rounded-full" />
        <Bone className="h-3 w-20" />
      </div>
      <Bone className="h-8 w-16" />
    </div>
  );
}

/** Market card skeleton — title + number + progress bar */
export function SkeletonMarketCard() {
  return (
    <div className="card-bet p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Bone className="h-4 w-24" />
        <Bone className="h-5 w-5 rounded-full" />
      </div>
      <Bone className="h-8 w-20" />
      <Bone className="h-2 w-full rounded-full" />
    </div>
  );
}

/** Table row skeleton */
export function SkeletonTableRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <Bone className={`h-4 ${i === 1 ? 'w-32' : 'w-12'}`} />
        </td>
      ))}
    </tr>
  );
}

/** Table skeleton — header + rows */
export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="table-bet w-full">
        <thead>
          <tr className="bg-secondary/30">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><Bone className={`h-3 ${i === 1 ? 'w-20' : 'w-10'}`} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Chart skeleton — axes + area placeholder */
export function SkeletonChart({ height = 280 }: { height?: number }) {
  return (
    <div className={`relative rounded-lg overflow-hidden`} style={{ height }}>
      {/* Y-axis */}
      <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between py-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-2 w-6 ml-1" />
        ))}
      </div>
      {/* X-axis */}
      <div className="absolute bottom-0 left-10 right-0 h-6 flex justify-between items-center px-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-2 w-6" />
        ))}
      </div>
      {/* Chart area */}
      <div className="absolute left-10 top-0 right-0 bottom-6 bg-secondary/20 rounded">
        <svg className="w-full h-full opacity-10" viewBox="0 0 200 100" preserveAspectRatio="none">
          <path d="M0,80 Q25,60 50,65 T100,45 T150,55 T200,30" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

/** Bet suggestion card skeleton */
export function SkeletonBetCard() {
  return (
    <div className="card-bet p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Bone className="w-4 h-4 rounded-full" />
            <Bone className="h-4 w-40" />
            <Bone className="h-4 w-8" />
          </div>
          <div className="flex gap-2">
            <Bone className="h-5 w-20 rounded-md" />
            <Bone className="h-5 w-16 rounded-md" />
            <Bone className="h-5 w-14 rounded-full" />
          </div>
        </div>
        <div className="space-y-1 text-right">
          <Bone className="h-3 w-8 ml-auto" />
          <Bone className="h-6 w-12 ml-auto" />
        </div>
      </div>
      <div>
        <Bone className="h-3 w-16 mb-1" />
        <Bone className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  );
}

/** Radar chart skeleton — circular placeholder */
export function SkeletonRadar({ size = 260 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height: size }}>
      <div className={`relative ${shimmer}`} style={{ width: size * 0.7, height: size * 0.7 }}>
        {[1, 0.7, 0.4].map((scale, i) => (
          <div
            key={i}
            className="absolute border border-secondary/60 rounded-full"
            style={{
              width: `${scale * 100}%`,
              height: `${scale * 100}%`,
              top: `${(1 - scale) * 50}%`,
              left: `${(1 - scale) * 50}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
