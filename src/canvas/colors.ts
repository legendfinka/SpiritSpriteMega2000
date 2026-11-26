import type { ColorToken, Hex } from '../types';
import { COLOR_TOKENS } from '../types';

// lightness shift for shades and highlights
const SHADE_AMOUNT = -0.15;
const HIGHLIGHT_AMOUNT = 0.12;

export type DerivedToken = 'skin-shade' | 'hair-shade' | 'hair-hi' | 'outfit-shade' | 'pants-shade';
export type BaseToken = Exclude<ColorToken, DerivedToken>;

/** derived token -> [base, lightness shift] */
export const DERIVED_TOKENS: Record<DerivedToken, readonly [BaseToken, number]> = {
  'skin-shade': ['skin', SHADE_AMOUNT],
  'hair-shade': ['hair', SHADE_AMOUNT],
  'hair-hi': ['hair', HIGHLIGHT_AMOUNT],
  'outfit-shade': ['outfit-main', SHADE_AMOUNT],
  'pants-shade': ['pants', SHADE_AMOUNT],
};

export function isDerivedToken(token: ColorToken): token is DerivedToken {
  return token in DERIVED_TOKENS;
}

export const DEFAULT_BASE_COLORS: Record<BaseToken, Hex> = {
  skin: '#f4cfae',
  hair: '#6b4428',
  iris: '#4f7fb8',
  'outfit-main': '#2f6f6a',
  'outfit-accent': '#ece4d0',
  pants: '#3e5f8f',
  outline: '#2b1d18',
};

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHex(value: string): boolean {
  return HEX_RE.test(value);
}

function normalizeHex(hex: Hex): string {
  if (!isHex(hex)) throw new Error(`Invalid hex colour: ${hex}`);
  const h = hex.slice(1).toLowerCase();
  return h.length === 3 ? [...h].map((c) => c + c).join('') : h;
}

export function hexToHsl(hex: Hex): [number, number, number] {
  const h = normalizeHex(hex);
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue: number;
  if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  return [hue * 60, s, l];
}

export function hslToHex(h: number, s: number, l: number): Hex {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const toByte = (x: number) =>
    Math.round(Math.min(1, Math.max(0, x)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toByte(f(0))}${toByte(f(8))}${toByte(f(4))}`;
}

/** shift HSL lightness, clamped */
export function shiftLightness(hex: Hex, delta: number): Hex {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(1, Math.max(0, l + delta)));
}

/** every token filled: bases default, shades derived unless overridden */
export function resolveColors(colors: Partial<Record<ColorToken, Hex>>): Record<ColorToken, Hex> {
  const out = {} as Record<ColorToken, Hex>;
  for (const token of COLOR_TOKENS) {
    const explicit = colors[token];
    if (explicit !== undefined) {
      out[token] = `#${normalizeHex(explicit)}`;
    } else if (isDerivedToken(token)) {
      const [base, delta] = DERIVED_TOKENS[token];
      out[token] = shiftLightness(colors[base] ?? DEFAULT_BASE_COLORS[base], delta);
    } else {
      out[token] = DEFAULT_BASE_COLORS[token];
    }
  }
  return out;
}

const VAR_RE = /var\(\s*--([a-z0-9-]+)\s*\)/gi;

/** var(--token) -> hex, throws on unknown tokens */
export function inlineTokens(svg: string, colors: Record<ColorToken, Hex>): string {
  return svg.replace(VAR_RE, (_match, name: string) => {
    const value = (colors as Record<string, Hex | undefined>)[name];
    if (value === undefined) throw new Error(`Unknown colour token: --${name}`);
    return value;
  });
}

/** as CSS vars, for the live preview */
export function toCssVars(colors: Record<ColorToken, Hex>): Record<`--${string}`, string> {
  const vars: Record<`--${string}`, string> = {};
  for (const token of COLOR_TOKENS) vars[`--${token}`] = colors[token];
  return vars;
}
