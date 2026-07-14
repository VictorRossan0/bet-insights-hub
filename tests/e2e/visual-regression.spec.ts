import { test, expect } from '@playwright/test';

/**
 * Regressão visual — tira screenshot das telas públicas principais no tema
 * "Súmula Oficial" (dark chrome + paper cards) e compara com o baseline
 * salvo em `tests/e2e/visual-regression.spec.ts-snapshots/`.
 *
 * Objetivo: detectar automaticamente quebras de contraste/legibilidade
 * (ex.: filtros com texto claro sobre fundo claro, badges invisíveis,
 * tokens de cor trocados por engano).
 *
 * Gerar/atualizar baselines:
 *   npx playwright test tests/e2e/visual-regression.spec.ts --update-snapshots
 *
 * Rodar em CI/local:
 *   npx playwright test tests/e2e/visual-regression.spec.ts
 *
 * `maxDiffPixelRatio` deixa margem para variações mínimas de fonte/AA de
 * gradiente sem tolerar quebras reais de UI (ex.: um select vazio ou um
 * bloco com cor invertida gera >2% de pixels divergentes).
 */

const ROUTES: Array<{ name: string; path: string; selector?: string }> = [
  { name: 'dashboard', path: '/' },
  { name: 'jogos', path: '/jogos' },
  { name: 'times', path: '/times' },
  { name: 'confronto', path: '/confronto' },
  { name: 'historico', path: '/historico' },
  { name: 'backtesting', path: '/backtesting' },
];

test.describe('regressão visual do tema Súmula Oficial', () => {
  test.beforeEach(async ({ page }) => {
    // Desliga animações para snapshots estáveis
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });
  });

  for (const route of ROUTES) {
    test(`${route.name} — snapshot de página inteira`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(route.path, { waitUntil: 'networkidle' });
      // Deixa TanStack Query resolver e animações Framer terminarem
      await page.waitForTimeout(1200);
      await expect(page).toHaveScreenshot(`${route.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
        caret: 'hide',
      });
    });
  }

  test('dashboard mobile — snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
      caret: 'hide',
    });
  });

  test('filtros de temporada — legibilidade em todas as páginas com select', async ({ page }) => {
    // Guarda visual dedicado aos selects de temporada, que foi o bug reportado
    // (texto claro sobre fundo claro). Snapshot só do bloco de filtros.
    const pages = ['/', '/jogos'];
    for (const path of pages) {
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const select = page.locator('select').first();
      await expect(select).toBeVisible();
      const name = path === '/' ? 'filtro-dashboard' : 'filtro-jogos';
      await expect(select).toHaveScreenshot(`${name}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
      });
    }
  });
});
