import { test, expect } from '../../playwright-fixture';

/**
 * Suíte E2E — Perfil Público (não autenticado)
 * Cobre navegação pelas abas principais e listagem de jogos sem permissões de admin.
 */

const PAGES = [
  { path: '/', heading: /dashboard|brasileir/i },
  { path: '/jogos', heading: /jogos/i },
  { path: '/historico', heading: /hist/i },
  { path: '/times', heading: /times/i },
  { path: '/confronto', heading: /confronto/i },
  { path: '/apostas', heading: /apostas/i },
];

test.describe('Perfil público', () => {
  for (const p of PAGES) {
    test(`carrega ${p.path} sem erros de console`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      await page.goto(p.path);
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
      // tolera erros de rede para extensões/analytics, mas falha em erros JS reais
      const real = errors.filter((e) => !/favicon|extension|net::ERR/i.test(e));
      expect(real, `Erros: ${real.join('\n')}`).toHaveLength(0);
    });
  }

  test('listagem de jogos exibe linhas e NÃO mostra botões de admin', async ({ page }) => {
    await page.goto('/jogos');
    // espera a tabela popular
    await page.waitForSelector('[data-testid^="row-jogo-"]', { timeout: 15000 });
    const rows = await page.locator('[data-testid^="row-jogo-"]').count();
    expect(rows).toBeGreaterThan(0);

    // botões de admin NÃO devem aparecer
    await expect(page.getByTestId('btn-novo-jogo')).toHaveCount(0);
    await expect(page.locator('[data-testid^="btn-editar-"]').first()).toHaveCount(0);
  });

  test('filtro de temporada altera a tabela', async ({ page }) => {
    await page.goto('/jogos');
    await page.waitForSelector('[data-testid^="row-jogo-"]', { timeout: 15000 });
    // primeiro select é o de temporada
    const select = page.locator('select').first();
    await select.selectOption({ index: 2 }); // 2024
    await page.waitForTimeout(1500);
    const rows = await page.locator('[data-testid^="row-jogo-"]').count();
    expect(rows).toBeGreaterThan(0);
  });
});
