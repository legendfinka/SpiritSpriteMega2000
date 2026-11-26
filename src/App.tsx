import { useState } from 'react';
import styles from './App.module.css';
import { CharacterSvg } from './canvas/CharacterSvg';
import { getExpression, getPresetExpression, isPresetId } from './expressions/presets';
import { useCharacterStore } from './store/useCharacterStore';
import type { ExpressionId, Slot } from './types';
import { CharacterFileButtons } from './ui/CharacterFileButtons';
import { ColorPanel } from './ui/ColorPanel';
import { ExportDialog } from './ui/ExportDialog';
import { ExpressionStrip } from './ui/ExpressionStrip';
import { type FaceTarget, PartPicker } from './ui/PartPicker';
import { FACE_SLOTS } from './ui/slots';
import { Wordmark } from './ui/Wordmark';

const guideUrl = `${import.meta.env.BASE_URL}templates/alignment-guide.svg`;
const logoUrl = `${import.meta.env.BASE_URL}logo.svg`;

export function App() {
  const character = useCharacterStore((s) => s.character);
  const setName = useCharacterStore((s) => s.setName);
  const resetCharacter = useCharacterStore((s) => s.resetCharacter);
  const [activeId, setActiveId] = useState<ExpressionId>('neutral');
  const [slot, setSlot] = useState<Slot>('hairFront');
  const [showGuide, setShowGuide] = useState(false);
  const [exporting, setExporting] = useState(false);

  // deleted or reset? fall back to neutral
  const active =
    getExpression(activeId, character) ?? getPresetExpression('neutral', character);

  const faceTarget: FaceTarget =
    active.id === 'neutral'
      ? { kind: 'character' }
      : isPresetId(active.id)
        ? { kind: 'preset', expression: active }
        : { kind: 'custom', expression: active };

  const changeSlot = (next: Slot) => {
    setSlot(next);
    // presets are read-only, so face tabs jump to neutral
    if (FACE_SLOTS.includes(next) && faceTarget.kind === 'preset') setActiveId('neutral');
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src={logoUrl} alt="" className={styles.logo} />
          {/* faux-Cyrillic is just for looks, screen readers get the real name */}
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
        <CharacterFileButtons onLoaded={() => setActiveId('neutral')} />
        <button type="button" className={styles.exportButton} onClick={() => setExporting(true)}>
          Export ▸
        </button>
      </header>
      {exporting && <ExportDialog active={active} onClose={() => setExporting(false)} />}

      <main className={styles.main}>
        <PartPicker slot={slot} onSlotChange={changeSlot} faceTarget={faceTarget} />
        <div className={styles.stage}>
          <div className={styles.preview}>
            <CharacterSvg
              character={character}
              expression={active}
              className={styles.sprite}
              title="Preview"
            />
            {showGuide && <img src={guideUrl} alt="" className={styles.guide} />}
          </div>
        </div>
        <ColorPanel />
      </main>

      <ExpressionStrip active={active} onSelect={setActiveId} />
    </div>
  );
}
