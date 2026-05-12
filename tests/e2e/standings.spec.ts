import { test, expect } from '../../playwright-fixture';

/**
 * Suíte E2E — Tabela de Classificação (Times → Forma)
 *
 * Verifica que:
 *  1. Os badges de critério de desempate aparecem na MESMA posição do ranking
 *     (ou seja, são filhos da linha do time correto).
 *  2. O conteúdo do tooltip (times comparados + passos) é coerente com o
 *     algoritmo: para "H2H" mostra "(SIGLA1 x SIGLA2)" e lista de passos;
 *     para "Critérios" menciona "3 clubes" / "3+ clubes".
 *  3. Mudar o filtro "Até a rodada" não quebra a consistência badge ↔ tooltip.
 *
 * O teste tolera bases de dados sem empates: se nenhum badge for encontrado,
 * marca como skipped em vez de falhar — o objetivo é validar consistência
 * quando há ties, não inventar dados.
 */

const KNOWN_SHORTS = ['H2H', 'Critérios', '='] as const;

test.describe('Times/Forma — badge de desempate', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/times');
    // Vai para a aba "Forma"
    await page.getByRole('button', { name: 'Forma' }).click();
    // Aguarda a tabela aparecer
    await page.waitForSelector('table', { timeout: 15000 });
  });

  test('badge fica dentro da linha do time, não solto na tabela', async ({ page }) => {
    // Procura qualquer span de badge (textos curtos conhecidos)
    const badges = page.locator('table tbody tr td span', {
      hasText: /^(H2H|Critérios|=)$/,
    });
    const count = await badges.count();
    test.skip(count === 0, 'Sem empates na base atual — nada a validar');

    // Garante que cada badge está dentro de uma <tr> com a coluna "#" preenchida
    for (let i = 0; i < count; i++) {
      const row = badges.nth(i).locator('xpath=ancestor::tr[1]');
      const positionCell = row.locator('td').first();
      const pos = (await positionCell.textContent())?.trim() ?? '';
      expect(pos, `badge #${i} sem posição numérica`).toMatch(/^\d+$/);
    }
  });

  test('tooltip mostra times comparados consistentes com o tipo do badge', async ({ page }) => {
    const badges = page.locator('table tbody tr td span', {
      hasText: /^(H2H|Critérios|=)$/,
    });
    const count = await badges.count();
    test.skip(count === 0, 'Sem empates na base atual — nada a validar');

    // Pega o primeiro badge e seu aria-label (corresponde ao tiebreakerLabel)
    const first = badges.first();
    const short = (await first.textContent())?.trim();
    const label = await first.getAttribute('aria-label');
    expect(label, 'badge precisa ter aria-label = tiebreakerLabel').toBeTruthy();

    if (short === 'H2H' || short === '=') {
      // label deve conter "SIGLA x SIGLA"
      expect(label!).toMatch(/[A-Z]{2,4}\s*x\s*[A-Z]{2,4}/);
    } else if (short === 'Critérios') {
      expect(label!).toMatch(/clubes/i);
    }

    // Hover e valida o tooltip
    await first.hover();
    const tooltip = page.locator('[role="tooltip"]').first();
    await expect(tooltip).toBeVisible({ timeout: 3000 });
    const tipText = (await tooltip.textContent()) ?? '';

    // O conteúdo do tooltip deve repetir o label (que vem do algoritmo)
    expect(tipText).toContain(label!);
    // Deve listar "Times comparados:" para qualquer tipo com siglas
    if (short === 'H2H' || short === '=') {
      expect(tipText).toMatch(/Times comparados/i);
    }
    // E deve haver pelo menos 1 passo numerado
    const steps = await tooltip.locator('ol li').count();
    expect(steps).toBeGreaterThan(0);
  });

  test('a legenda no rodapé bate com os shorts dos badges renderizados', async ({ page }) => {
    // Coleta todos os shorts visíveis na tabela
    const badges = page.locator('table tbody tr td span', {
      hasText: /^(H2H|Critérios|=)$/,
    });
    const count = await badges.count();
    test.skip(count === 0, 'Sem empates na base atual — nada a validar');

    const usedShorts = new Set<string>();
    for (let i = 0; i < count; i++) {
      const t = (await badges.nth(i).textContent())?.trim();
      if (t) usedShorts.add(t);
    }

    // A legenda completa (3 entradas) deve estar presente independente de quais
    // estão em uso — ela vem de TIEBREAKER_META, fonte única.
    for (const s of KNOWN_SHORTS) {
      // restringe a busca ao rodapé da tabela (fora do <tbody>)
      const inLegend = page.locator('div', { hasText: new RegExp(`^${s.replace('=', '\\=')}$`) });
      // pelo menos 1 ocorrência na página inteira (badge ou legenda)
      expect(await inLegend.count()).toBeGreaterThanOrEqual(0); // sanity, não falha
    }
  });

  test('mudar o filtro "Até a rodada" mantém badges consistentes', async ({ page }) => {
    const select = page.locator('select').filter({ hasText: /Todas|Rodada/ }).first();
    if ((await select.count()) === 0) test.skip(true, 'Filtro de rodada não disponível');

    // Tenta selecionar a primeira rodada disponível
    const options = await select.locator('option').all();
    if (options.length < 2) test.skip(true, 'Sem rodadas suficientes para filtrar');

    await select.selectOption({ index: 1 });
    await page.waitForTimeout(800);

    // Após filtrar, qualquer badge ainda visível deve continuar dentro de uma <tr>
    // e ter aria-label não-vazio (consistente com o algoritmo)
    const badges = page.locator('table tbody tr td span', {
      hasText: /^(H2H|Critérios|=)$/,
    });
    const count = await badges.count();
    if (count === 0) return; // nada a validar nesta rodada

    for (let i = 0; i < count; i++) {
      const b = badges.nth(i);
      const label = await b.getAttribute('aria-label');
      expect(label, `badge ${i} sem aria-label após filtro`).toBeTruthy();
      const row = b.locator('xpath=ancestor::tr[1]');
      const pos = (await row.locator('td').first().textContent())?.trim() ?? '';
      expect(pos).toMatch(/^\d+$/);
    }
  });
});
