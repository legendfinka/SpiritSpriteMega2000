import { useMemo } from 'react';
import {
  type BaseToken,
  DEFAULT_BASE_COLORS,
  isDerivedToken,
  resolveColors,
} from '../canvas/colors';
import { SWATCHES } from '../canvas/palettes';
import { t } from '../i18n';
import { useCharacterStore } from '../store/useCharacterStore';
import { COLOR_TOKENS } from '../types';
import styles from './ColorPanel.module.css';
import { Swatches } from './Swatches';

export function ColorPanel() {
  const colors = useCharacterStore((s) => s.character.colors);
  const setColor = useCharacterStore((s) => s.setColor);
  const resetColor = useCharacterStore((s) => s.resetColor);
  const applyColors = useCharacterStore((s) => s.applyColors);
  const resolved = useMemo(() => resolveColors(colors), [colors]);

  return (
    <section className={styles.panel} aria-label={t('colors.title')}>
      <h2 className={styles.heading}>{t('colors.title')}</h2>
      <div className={styles.list}>
        {COLOR_TOKENS.map((token) => {
          const name = t(`color.${token}`);
          const derived = isDerivedToken(token);
          const changed = derived
            ? colors[token] !== undefined
            : resolved[token] !== DEFAULT_BASE_COLORS[token];
          const swatches = derived ? undefined : SWATCHES[token as BaseToken];
          return (
            <div key={token}>
              <div className={derived ? styles.derivedRow : styles.row}>
                <label className={styles.label}>
                  <input
                    type="color"
                    value={resolved[token]}
                    onChange={(e) => setColor(token, e.target.value)}
                  />
                  {name}
                </label>
                {changed ? (
                  <button
                    type="button"
                    className={styles.reset}
                    aria-label={t('colors.reset', { name })}
                    onClick={() => resetColor(token)}
                  >
                    {t('common.reset')}
                  </button>
                ) : (
                  derived && <span className={styles.auto}>{t('colors.auto')}</span>
                )}
              </div>
              {swatches && (
                <Swatches
                  name={name}
                  swatches={swatches}
                  current={resolved}
                  onPick={applyColors}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
