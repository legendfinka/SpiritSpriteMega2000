import { useId } from 'react';

/**
 * Hand-drawn stencil glyphs, stroked at 11 px on a 52 px cap height.
 * Gaps in the paths and the mask band give the stencil bridges.
 */
const GLYPHS: Record<string, { width: number; d: string }> = {
  S: { width: 36, d: 'M36 5.5 H12 L5.5 12 V20 L11.5 26 H24.5 L30.5 32 V40 L24 46.5 H0' },
  P: { width: 36, d: 'M5.5 52 V5.5 H24 L30.5 12 V22 L24 28.5 H13' },
  Я: { width: 36, d: 'M30.5 52 V5.5 H12 L5.5 12 V22 L12 28.5 H23 M15 30 L4 52' },
  I: { width: 11, d: 'M5.5 0 V52' },
  T: { width: 36, d: 'M0 5.5 H36 M18 13 V52' },
  E: { width: 32, d: 'M32 5.5 H5.5 V46.5 H32 M13 26 H27' },
  ' ': { width: 4, d: '' },
};

const GAP = 6;
const TOP = -4;
const HEIGHT = 64;

function layout(text: string) {
  let x = 0;
  const glyphs = [...text].map((char) => {
    const glyph = GLYPHS[char];
    if (!glyph) throw new Error(`Wordmark has no glyph for "${char}"`);
    const placed = { x, d: glyph.d };
    x += glyph.width + GAP;
    return placed;
  });
  return { glyphs, width: x - GAP };
}

interface WordmarkProps {
  text?: string;
  className?: string;
}

/** Decorative faux-Cyrillic stencil title. Hidden from screen readers. */
export function Wordmark({ text = 'SPIЯIT SPЯITE', className }: WordmarkProps) {
  // useId output contains characters that are awkward inside url(#…).
  const id = `wm${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { glyphs, width } = layout(text);
  const letters = `${id}-letters`;
  const stencil = `${id}-stencil`;

  return (
    <svg
      className={className}
      viewBox={`-6 ${TOP} ${width + 14} ${HEIGHT}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={stencil} maskUnits="userSpaceOnUse">
          <rect x={-6} y={TOP} width={width + 14} height={HEIGHT} fill="white" />
          <rect x={-6} y={36} width={width + 14} height={2.5} fill="black" />
        </mask>
        <g id={letters} mask={`url(#${stencil})`}>
          {glyphs.map((g, i) => (
            <path
              key={i}
              d={g.d}
              transform={`translate(${g.x} 0)`}
              fill="none"
              stroke="currentColor"
              strokeWidth={11}
              strokeLinejoin="miter"
            />
          ))}
        </g>
      </defs>
      {/* misregistered print: black shadow, teal offset, cream ink */}
      <use href={`#${letters}`} x={3} y={3} style={{ color: 'var(--line)' }} />
      <use href={`#${letters}`} x={-2} y={-1} style={{ color: 'var(--teal)' }} />
      <use href={`#${letters}`} style={{ color: '#f7eedb' }} />
    </svg>
  );
}
