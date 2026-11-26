import { describe, expect, it } from 'vitest';
import { COLOR_TOKENS } from '../types';
import {
  hexToHsl,
  hslToHex,
  inlineTokens,
  resolveColors,
  shiftLightness,
} from './colors';

describe('hex <-> hsl', () => {
  it.each(['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#6b4428', '#f4cfae'])(
    'round-trips %s',
    (hex) => {
      const [h, s, l] = hexToHsl(hex);
      expect(hslToHex(h, s, l)).toBe(hex);
    },
  );

  it('accepts 3-digit hex', () => {
    expect(hslToHex(...hexToHsl('#f00'))).toBe('#ff0000');
  });
});

describe('derived shades', () => {
  it('are deterministic for a given base colour', () => {
    const a = resolveColors({ hair: '#6b4428' });
    const b = resolveColors({ hair: '#6b4428' });
    expect(a).toEqual(b);
  });

  it('darken by 15% and lighten by 12% in HSL', () => {
    const c = resolveColors({ hair: '#6b4428' });
    const [, , l] = hexToHsl('#6b4428');
    expect(hexToHsl(c['hair-shade'])[2]).toBeCloseTo(l - 0.15, 2);
    expect(hexToHsl(c['hair-hi'])[2]).toBeCloseTo(l + 0.12, 2);
  });

  it('clamps at black and white', () => {
    expect(shiftLightness('#050505', -0.15)).toBe('#000000');
    expect(shiftLightness('#fafafa', 0.12)).toBe('#ffffff');
  });

  it('respects explicit overrides', () => {
    const c = resolveColors({ skin: '#f0c0a0', 'skin-shade': '#123456' });
    expect(c['skin-shade']).toBe('#123456');
  });

  it('fills every token', () => {
    const c = resolveColors({});
    for (const token of COLOR_TOKENS) expect(c[token]).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('inlineTokens', () => {
  it('replaces every var(--token) with hex', () => {
    const colors = resolveColors({});
    const out = inlineTokens('<path fill="var(--hair)" stroke="var( --outline )"/>', colors);
    expect(out).toBe(`<path fill="${colors.hair}" stroke="${colors.outline}"/>`);
    expect(out).not.toContain('var(');
  });

  it('throws on an unknown token', () => {
    expect(() => inlineTokens('fill="var(--nope)"', resolveColors({}))).toThrow(/--nope/);
  });
});
