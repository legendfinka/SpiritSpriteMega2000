import { useMemo } from 'react';
import { DEFAULT_BASE_COLORS, isDerivedToken, resolveColors } from '../canvas/colors';
import { useCharacterStore } from '../store/useCharacterStore';
import type { ColorToken } from '../types';
import styles from './ColorPanel.module.css';

const TOKEN_LABELS: Record<ColorToken, string> = {
  skin: 'Skin',
  'skin-shade': 'Skin shade',
  hair: 'Hair',
  'hair-shade': 'Hair shade',
  'hair-hi': 'Hair highlight',
  iris: 'Eyes',
  'outfit-main': 'Outfit',
  'outfit-shade': 'Outfit shade',
  'outfit-accent': 'Outfit accent',
  pants: 'Pants',
  'pants-shade': 'Pants shade',
  outline: 'Outline',
};

// Object key order above is the display order.
const TOKENS = Object.keys(TOKEN_LABELS) as ColorToken[];

export function ColorPanel() {
  const colors = useCharacterStore((s) => s.character.colors);
  const setColor = useCharacterStore((s) => s.setColor);
  const resetColor = useCharacterStore((s) => s.resetColor);
  const resolved = useMemo(() => resolveColors(colors), [colors]);

  return (
    <section className={styles.panel} aria-label="Colours">
      <h2 className={styles.heading}>Colours</h2>
      <div className={styles.list}>
        {TOKENS.map((token) => {
          const derived = isDerivedToken(token);
          const changed = derived
            ? colors[token] !== undefined
            : resolved[token] !== DEFAULT_BASE_COLORS[token];
          return (
            <div key={token} className={derived ? styles.derivedRow : styles.row}>
              <label className={styles.label}>
                <input
                  type="color"
                  value={resolved[token]}
                  onChange={(e) => setColor(token, e.target.value)}
                />
                {TOKEN_LABELS[token]}
              </label>
              {changed ? (
                <button
                  type="button"
                  className={styles.reset}
                  aria-label={`Reset ${TOKEN_LABELS[token]}`}
                  onClick={() => resetColor(token)}
                >
                  Reset
                </button>
              ) : (
                derived && <span className={styles.auto}>auto</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
