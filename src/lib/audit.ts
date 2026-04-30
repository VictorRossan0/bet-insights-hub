/**
 * Audit logger — registra ações de admin no console (sem persistência).
 * Pode ser plugado a uma tabela futura.
 */
export type AuditAction = 'editar_jogo' | 'excluir_jogo' | 'criar_jogo';

export type AuditEntry = {
  timestamp: string;
  action: AuditAction;
  user: string;
  target: string;
  motivo?: string;
  diff?: Record<string, { antes: unknown; depois: unknown }>;
};

export function logAudit(entry: Omit<AuditEntry, 'timestamp'>) {
  const full: AuditEntry = { ...entry, timestamp: new Date().toISOString() };
  // Console agrupado para fácil leitura
  console.groupCollapsed(`[AUDIT] ${full.action} · ${full.user} · ${full.timestamp}`);
  console.log('Alvo:', full.target);
  if (full.motivo) console.log('Motivo:', full.motivo);
  if (full.diff) console.table(full.diff);
  console.groupEnd();
  return full;
}

/** Calcula diff entre dois objetos (apenas campos que mudaram). */
export function calcDiff<T extends Record<string, unknown>>(
  antes: T,
  depois: Partial<T>,
): Record<string, { antes: unknown; depois: unknown }> {
  const diff: Record<string, { antes: unknown; depois: unknown }> = {};
  for (const k of Object.keys(depois)) {
    if (antes[k] !== depois[k as keyof T]) {
      diff[k] = { antes: antes[k], depois: depois[k as keyof T] };
    }
  }
  return diff;
}
