/**
 * Extrai uma mensagem legível de qualquer erro, incluindo PostgrestError
 * do Supabase (que não é instância de Error e possui { message, code, details, hint }).
 */
export function extractErrorMessage(err: unknown, fallback = 'Erro inesperado'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object') {
    const e = err as { message?: unknown; error_description?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    if (typeof e.message === 'string' && e.message) return e.message;
    if (typeof e.error_description === 'string' && e.error_description) return e.error_description;
    if (typeof e.details === 'string' && e.details) return e.details;
    if (typeof e.hint === 'string' && e.hint) return e.hint;
    if (typeof e.code === 'string' && e.code) return `Erro (${e.code})`;
  }
  return fallback;
}

/** Heurística para detectar erros relacionados a RLS / policies do Postgres. */
export function isRlsError(err: unknown): boolean {
  const msg = extractErrorMessage(err, '').toLowerCase();
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: unknown }).code ?? '') : '';
  return (
    code === '42501' ||
    /rls|row-level|row level|violates .*security|0 rows|bloqueada/i.test(msg)
  );
}
