import type { BaseToken } from '../canvas/colors';
import type { Swatch } from '../canvas/palettes';
import { swatchLabel, t } from '../i18n';
import type { ColorToken, Hex } from '../types';
import styles from './ColorPanel.module.css';

/** hard-edged stripes, one per colour */
function chip(colors: Hex[]): string {
  if (colors.length === 1) return colors[0] as Hex;
  const step = 100 / colors.length;
  const stops = colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`);
  return `linear-gradient(135deg, ${stops.join(', ')})`;
}

interface SwatchesProps {
  /** e.g. "Skin" */
  name: string;
  swatches: Swatch[];
  current: Record<ColorToken, Hex>;
  onPick: (colors: Swatch['colors']) => void;
}

export function Swatches({ name, swatches, current, onPick }: SwatchesProps) {
  return (
    <div className={styles.swatches} role="group" aria-label={t('colors.presets', { name })}>
      {swatches.map((s) => {
        const entries = Object.entries(s.colors) as [BaseToken, Hex][];
        return (
          <button
            key={s.label}
            type="button"
            className={styles.swatch}
            style={{ background: chip(entries.map(([, hex]) => hex)) }}
            aria-label={`${name}: ${swatchLabel(s.label)}`}
            aria-pressed={entries.every(([token, hex]) => current[token] === hex)}
            title={swatchLabel(s.label)}
            onClick={() => onPick(s.colors)}
          />
        );
      })}
    </div>
  );
}
