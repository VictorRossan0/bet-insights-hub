import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TiebreakerBadge, TiebreakerLegend, TIEBREAKER_META } from './TiebreakerBadge';
import type { TiebreakerKind } from '@/lib/standings';

const KINDS = Object.keys(TIEBREAKER_META) as Array<Exclude<TiebreakerKind, 'none'>>;

describe('TIEBREAKER_META — fonte única de verdade', () => {
  it('cobre exatamente os 3 tipos de desempate (h2h, criteria, unresolved)', () => {
    expect(KINDS.sort()).toEqual(['criteria', 'h2h', 'unresolved']);
  });

  for (const k of KINDS) {
    it(`tipo "${k}": short, className e legend são strings não-vazias`, () => {
      const m = TIEBREAKER_META[k];
      expect(typeof m.short).toBe('string');
      expect(m.short.length).toBeGreaterThan(0);
      expect(typeof m.className).toBe('string');
      expect(m.className).toMatch(/border/);
      expect(typeof m.legend).toBe('string');
      expect(m.legend.length).toBeGreaterThan(0);
    });
  }
});

describe('TiebreakerBadge — sem divergência com legenda', () => {
  it('não renderiza nada quando kind = "none"', () => {
    const { container } = render(<TiebreakerBadge kind="none" label="x" />);
    expect(container).toBeEmptyDOMElement();
  });

  for (const k of KINDS) {
    it(`renderiza o "short" e a className de TIEBREAKER_META para ${k}`, () => {
      render(<TiebreakerBadge kind={k} label={`label-${k}`} />);
      const el = screen.getByLabelText(`label-${k}`);
      expect(el).toHaveTextContent(TIEBREAKER_META[k].short);
      // toda classe declarada em meta.className deve estar no elemento
      for (const cls of TIEBREAKER_META[k].className.split(/\s+/)) {
        expect(el.className).toContain(cls);
      }
    });
  }
});

describe('TiebreakerLegend — usa exatamente os mesmos shorts/legends/cores', () => {
  it('renderiza cada short e cada legend de TIEBREAKER_META, sem extras', () => {
    const { container } = render(<TiebreakerLegend />);
    for (const k of KINDS) {
      const m = TIEBREAKER_META[k];
      // legend
      expect(container.textContent).toContain(m.legend);
      // short aparece em um <span> com a className correta
      const shortNodes = Array.from(container.querySelectorAll('span')).filter(
        n => n.textContent === m.short
      );
      expect(shortNodes.length).toBeGreaterThan(0);
      const node = shortNodes[0];
      for (const cls of m.className.split(/\s+/)) {
        expect(node.className).toContain(cls);
      }
    }
  });
});
