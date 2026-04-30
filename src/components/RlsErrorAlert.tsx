import { AlertTriangle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

type Props = {
  message: string;
  operation: 'UPDATE' | 'DELETE' | 'INSERT';
};

const SQL_SNIPPETS: Record<Props['operation'], string> = {
  UPDATE: `DROP POLICY IF EXISTS "Authenticated can update jogos" ON public.jogos;
CREATE POLICY "Authenticated can update jogos" ON public.jogos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);`,
  DELETE: `DROP POLICY IF EXISTS "Authenticated can delete jogos" ON public.jogos;
CREATE POLICY "Authenticated can delete jogos" ON public.jogos
  FOR DELETE TO authenticated USING (true);`,
  INSERT: `DROP POLICY IF EXISTS "Authenticated can insert jogos" ON public.jogos;
CREATE POLICY "Authenticated can insert jogos" ON public.jogos
  FOR INSERT TO authenticated WITH CHECK (true);`,
};

export default function RlsErrorAlert({ message, operation }: Props) {
  const [copied, setCopied] = useState(false);
  const sql = SQL_SNIPPETS[operation];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      data-testid="rls-error-alert"
      role="alert"
      className="border border-destructive/40 bg-destructive/10 rounded-lg p-3 space-y-2 text-xs"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-destructive">Operação bloqueada pela política RLS</p>
          <p className="text-muted-foreground">{message}</p>
          <p className="text-muted-foreground">
            Rode o SQL abaixo no <span className="font-mono">SQL Editor</span> do projeto Supabase externo
            (<span className="font-mono">ycnbcsxlnjhdnwvmufgj</span>) e tente novamente.
          </p>
        </div>
      </div>

      <div className="relative">
        <pre className="bg-card border border-border rounded p-2 overflow-x-auto text-[11px] font-mono whitespace-pre">
{sql}
        </pre>
        <button
          type="button"
          onClick={copy}
          className="absolute top-1.5 right-1.5 p-1.5 rounded hover:bg-accent text-muted-foreground"
          title="Copiar SQL"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
