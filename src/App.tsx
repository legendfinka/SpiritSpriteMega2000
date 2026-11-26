import { useState } from 'react';
import styles from './App.module.css';
import { CharacterSvg, HEAD_VIEWBOX } from './canvas/CharacterSvg';
import { PRESET_EXPRESSIONS, PRESET_IDS } from './expressions/presets';
import { createDefaultCharacter } from './store/defaultCharacter';
import type { PresetExpressionId } from './types';

// M1: hard-coded character. Replaced by the Zustand store in M2.
const character = createDefaultCharacter();
const guideUrl = `${import.meta.env.BASE_URL}templates/alignment-guide.svg`;

export function App() {
  const [active, setActive] = useState<PresetExpressionId>('neutral');
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>SpiritSpriteMega2000</h1>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={showGuide}
            onChange={(e) => setShowGuide(e.target.checked)}
          />
          Alignment guide
        </label>
      </header>

      <main className={styles.main}>
        <div className={styles.preview}>
          <CharacterSvg
            character={character}
            expression={PRESET_EXPRESSIONS[active]}
            className={styles.sprite}
          />
          {showGuide && <img src={guideUrl} alt="" className={styles.guide} />}
        </div>
      </main>

      <footer className={styles.strip}>
        {PRESET_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={styles.thumb}
            aria-pressed={id === active}
            onClick={() => setActive(id)}
          >
            <CharacterSvg
              character={character}
              expression={PRESET_EXPRESSIONS[id]}
              viewBox={HEAD_VIEWBOX}
              className={styles.thumbSvg}
            />
            <span>{id}</span>
          </button>
        ))}
      </footer>
    </div>
  );
}
