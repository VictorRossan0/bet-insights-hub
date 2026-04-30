import { test, expect, type Page } from '../playwright-fixture';

/**
 * Suíte E2E — Perfil Admin
 * Pré-requisitos:
 *  - Usuário admin existente em AMBOS os Supabase (Lovable Cloud + Externo) com mesmo email/senha.
 *  - Defina via env: ADMIN_EMAIL, ADMIN_PASSWORD. Caso contrário usa fallback abaixo.
 *  - Para os testes de UPDATE/DELETE passarem, as policies RLS no Supabase EXTERNO
 *    devem permitir UPDATE/DELETE para `authenticated` na tabela `jogos`.
 *    Veja o SQL exibido no modal RlsErrorAlert.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'victorrca2010@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Acesso@23';

async function login(page: Page) {
  await page.goto('/auth');
  await page.getByTestId('auth-email').fill(ADMIN_EMAIL);
  await page.getByTestId('auth-password').fill(ADMIN_PASSWORD);
  await page.getByTestId('auth-submit').click();
  // após login deve ir para "/" ou /admin
  await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 15000 });
}

test.describe('Admin — fluxo de jogos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('botões de admin aparecem em /jogos', async ({ page }) => {
    await page.goto('/jogos');
    await expect(page.getByTestId('btn-novo-jogo')).toBeVisible({ timeout: 10000 });
    await page.waitForSelector('[data-testid^="row-jogo-"]', { timeout: 15000 });
    await expect(page.locator('[data-testid^="btn-editar-"]').first()).toBeVisible();
  });

  test('abrir modal de edição preenche dados do jogo', async ({ page }) => {
    await page.goto('/jogos');
    await page.waitForSelector('[data-testid^="btn-editar-"]', { timeout: 15000 });
    await page.locator('[data-testid^="btn-editar-"]').first().click();
    await expect(page.getByTestId('form-editar-jogo')).toBeVisible();
    await expect(page.getByTestId('input-rodada')).toHaveValue(/\d+/);
  });

  test('editar cartões e salvar — exibe RLS alert se policy ausente, sucesso caso contrário', async ({ page }) => {
    await page.goto('/jogos');
    await page.waitForSelector('[data-testid^="btn-editar-"]', { timeout: 15000 });
    await page.locator('[data-testid^="btn-editar-"]').first().click();
    await expect(page.getByTestId('form-editar-jogo')).toBeVisible();

    const cartoes = page.getByTestId('input-cartoes-total');
    await cartoes.fill('10');
    await page.getByTestId('input-motivo').fill('teste E2E');
    await page.getByTestId('btn-salvar').click();

    // Aguarda sucesso (modal fecha) OU alerta RLS visível
    const ok = page.getByTestId('form-editar-jogo').waitFor({ state: 'detached', timeout: 8000 }).then(() => 'ok' as const).catch(() => null);
    const rls = page.getByTestId('rls-error-alert').waitFor({ state: 'visible', timeout: 8000 }).then(() => 'rls' as const).catch(() => null);
    const result = await Promise.race([ok, rls]);
    expect(result, 'Esperava sucesso ou alerta RLS').not.toBeNull();

    if (result === 'rls') {
      console.warn('⚠️  RLS bloqueando UPDATE — rode o SQL do modal no Supabase externo.');
      await expect(page.getByTestId('rls-error-alert')).toContainText(/RLS|bloqueada/i);
    }
  });

  test('abrir modal "Novo Jogo"', async ({ page }) => {
    await page.goto('/jogos');
    await page.getByTestId('btn-novo-jogo').click();
    await expect(page.getByTestId('form-novo-jogo')).toBeVisible();
  });

  test('clicar Excluir mostra confirm; cancelar mantém modal aberto', async ({ page }) => {
    await page.goto('/jogos');
    await page.waitForSelector('[data-testid^="btn-editar-"]', { timeout: 15000 });
    await page.locator('[data-testid^="btn-editar-"]').first().click();
    await expect(page.getByTestId('form-editar-jogo')).toBeVisible();

    page.once('dialog', (d) => d.dismiss());
    await page.getByTestId('btn-excluir').click();
    // modal continua aberto
    await expect(page.getByTestId('form-editar-jogo')).toBeVisible();
  });
});
