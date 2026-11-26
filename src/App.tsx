import { useState } from 'react';
import styles from './App.module.css';
import { CharacterSvg, HEAD_VIEWBOX } from './canvas/CharacterSvg';
import { getPresetExpression, PRESET_IDS } from './expressions/presets';
import { useCharacterStore } from './store/useCharacterStore';
import type { PresetExpressionId, Slot } from './types';
import { ColorPanel } from './ui/ColorPanel';
import { PartPicker } from './ui/PartPicker';
import { FACE_SLOTS } from './ui/slots';
import { Wordmark } from './ui/Wordmark';

const guideUrl = `${import.meta.env.BASE_URL}templates/alignment-guide.svg`;
const logoUrl = `${import.meta.env.BASE_URL}logo.svg`;

export function App() {
  const character = useCharacterStore((s) => s.character);
  const setName = useCharacterStore((s) => s.setName);
  const resetCharacter = useCharacterStore((s) => s.resetCharacter);
  const [active, setActive] = useState<PresetExpressionId>('neutral');
  const [slot, setSlot] = useState<Slot>('hairFront');
  const [showGuide, setShowGuide] = useState(false);

  const changeSlot = (next: Slot) => {
    setSlot(next);
    // Face choices only show on neutral, so jump there to make them visible.
    if (FACE_SLOTS.includes(next)) setActive('neutral');
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src={logoUrl} alt="" className={styles.logo} />
          {/* Faux-Cyrillic is decoration; screen readers get the real name. */}
          <h1 className={styles.title} aria-label="SpiritSprite Mega 2000">
            <Wordmark className={styles.wordmark} />
            <span aria-hidden="true" className={styles.badge}>
              Mega 2000
            </span>
          </h1>
        </div>
        <label className={styles.control}>
          Name
          <input value={character.name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className={styles.control}>
          <input
            type="checkbox"
            checked={showGuide}
            onChange={(e) => setShowGuide(e.target.checked)}
          />
          Alignment guide
        </label>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset the character to the default?')) resetCharacter();
          }}
        >
          Reset
        </button>
      </header>

      <main className={styles.main}>
        <PartPicker slot={slot} onSlotChange={changeSlot} />
        <div className={styles.stage}>
          <div className={styles.preview}>
            <CharacterSvg
              character={character}
              expression={getPresetExpression(active, character)}
              className={styles.sprite}
              title="Preview"
            />
            {showGuide && <img src={guideUrl} alt="" className={styles.guide} />}
          </div>
        </div>
        <ColorPanel />
      </main>

      <footer className={styles.strip}>
        <div className={styles.windows}>
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
                expression={getPresetExpression(id, character)}
                viewBox={HEAD_VIEWBOX}
                className={styles.thumbSvg}
              />
              <span>{id}</span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
