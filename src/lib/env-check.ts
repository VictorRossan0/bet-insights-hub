/**
 * Valida variáveis de ambiente obrigatórias no bootstrap.
 * Em dev, mostra um overlay claro listando o que está faltando.
 * Em prod, apenas loga erro no console (sem quebrar a aplicação).
 */
const REQUIRED = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_PROJECT_ID',
] as const;

export function checkEnv(): string[] {
  const env = import.meta.env as Record<string, string | undefined>;
  return REQUIRED.filter((k) => !env[k] || String(env[k]).trim() === '');
}

export function renderEnvErrorOverlay(missing: string[]) {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.setAttribute('data-env-error', 'true');
  el.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:2147483647',
    'background:rgba(10,10,12,0.96)', 'color:#fff',
    'font-family:ui-sans-serif,system-ui,sans-serif',
    'padding:32px', 'overflow:auto',
  ].join(';');
  el.innerHTML = `
    <div style="max-width:640px;margin:10vh auto;background:#18181b;border:1px solid #ef4444;border-radius:12px;padding:28px">
      <h1 style="margin:0 0 12px;font-size:20px;color:#ef4444">⚠️ Variáveis de ambiente faltando</h1>
      <p style="margin:0 0 16px;color:#d4d4d8;font-size:14px;line-height:1.5">
        A aplicação não pode iniciar porque as seguintes variáveis não estão definidas:
      </p>
      <ul style="margin:0 0 20px;padding-left:20px;color:#fca5a5;font-family:ui-monospace,monospace;font-size:13px">
        ${missing.map((k) => `<li>${k}</li>`).join('')}
      </ul>
      <div style="background:#0a0a0a;border-radius:8px;padding:14px;font-family:ui-monospace,monospace;font-size:12px;color:#a3e635">
        # Para rodar localmente:<br/>
        npm run setup:env<br/>
        npm run dev
      </div>
      <p style="margin:16px 0 0;color:#71717a;font-size:12px">
        Veja <code>SETUP_LOCAL.md</code> para detalhes. No ambiente Lovable essas variáveis são injetadas automaticamente.
      </p>
    </div>
  `;
  document.body.appendChild(el);
}
