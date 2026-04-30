# Testes E2E (Playwright)

Suíte cobrindo perfil **público** e **admin** das telas de jogos.

## Estrutura

- `tests/e2e/public.spec.ts` — Navegação pública (Dashboard, Jogos, Histórico, Times, Confronto, Apostas) e listagem read-only.
- `tests/e2e/admin.spec.ts` — Login, abrir/editar/excluir jogos, validar alerta RLS.

## Como rodar

```bash
# Variáveis (opcional — já tem fallback nos specs)
export ADMIN_EMAIL=victorrca2010@gmail.com
export ADMIN_PASSWORD='Acesso@23'

# Roda toda a suíte
bunx playwright test

# Apenas público
bunx playwright test public

# Apenas admin
bunx playwright test admin

# Modo UI (debug visual)
bunx playwright test --ui
```

## Pré-requisitos para testes Admin de UPDATE/DELETE

A tabela `jogos` no Supabase **externo** (`ycnbcsxlnjhdnwvmufgj`) precisa ter as policies RLS abaixo. Se não tiver, o teste de edição passa em "modo degradado" (verifica que o `RlsErrorAlert` aparece em vez de falhar).

```sql
-- UPDATE
DROP POLICY IF EXISTS "Authenticated can update jogos" ON public.jogos;
CREATE POLICY "Authenticated can update jogos" ON public.jogos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- DELETE
DROP POLICY IF EXISTS "Authenticated can delete jogos" ON public.jogos;
CREATE POLICY "Authenticated can delete jogos" ON public.jogos
  FOR DELETE TO authenticated USING (true);

-- INSERT
DROP POLICY IF EXISTS "Authenticated can insert jogos" ON public.jogos;
CREATE POLICY "Authenticated can insert jogos" ON public.jogos
  FOR INSERT TO authenticated WITH CHECK (true);
```

## Log de auditoria

Toda ação admin (criar / editar / excluir jogo) é registrada no console do navegador via `src/lib/audit.ts`:

```
[AUDIT] editar_jogo · victorrca2010@gmail.com · 2026-04-30T14:30:00.000Z
  Alvo:  #1234 Criciúma vs Juventude
  Motivo: corrigir cartões
  ┌──────────────┬────────┬─────────┐
  │ (index)      │ antes  │ depois  │
  ├──────────────┼────────┼─────────┤
  │ cartoes_total│   7    │   10    │
  └──────────────┴────────┴─────────┘
```

Para persistir os logs futuramente, basta plugar uma chamada de insert dentro de `logAudit()`.
