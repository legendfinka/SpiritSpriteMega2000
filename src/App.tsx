import { useState } from 'react';
import styles from './App.module.css';
import { downloadCharacterJson } from './export/characterJson';
import {
  getExpression,
  getPresetExpression,
  isPresetId,
  listExpressions,
} from './expressions/presets';
import { randomCharacter } from './store/randomCharacter';
import { useCharacterStore } from './store/useCharacterStore';
import type { ExpressionId, Slot } from './types';
import { CharacterFileButtons } from './ui/CharacterFileButtons';
import { ColorPanel } from './ui/ColorPanel';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { ExportDialog } from './ui/ExportDialog';
import { ExpressionStrip } from './ui/ExpressionStrip';
import { type FaceTarget, PartPicker } from './ui/PartPicker';
import { FACE_SLOTS } from './ui/slots';
import { ShareButton } from './ui/ShareButton';
import { SharedLinkPrompt } from './ui/SharedLinkPrompt';
import { Stage } from './ui/Stage';
import { StarterPicker } from './ui/StarterPicker';
import { MOD, useShortcuts } from './ui/useShortcuts';
import { Wordmark } from './ui/Wordmark';

const logoUrl = `${import.meta.env.BASE_URL}logo.svg`;

export function App() {
  const character = useCharacterStore((s) => s.character);
  const canUndo = useCharacterStore((s) => s.past.length > 0);
  const canRedo = useCharacterStore((s) => s.future.length > 0);
  const { setName, resetCharacter, loadCharacter, undo, redo } = useCharacterStore.getState();
  const [activeId, setActiveId] = useState<ExpressionId>('neutral');
  const [slot, setSlot] = useState<Slot>('hairFront');
  const [exporting, setExporting] = useState(false);
  const [resetting, setResetting] = useState(false);

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

  useShortcuts({
    undo,
    redo,
    save: () => downloadCharacterJson(useCharacterStore.getState().character),
    openExport: () => setExporting(true),
    stepExpression: (delta) => {
      const ids = listExpressions(character).map((e) => e.id);
      const i = ids.indexOf(active.id);
      setActiveId(ids[(i + delta + ids.length) % ids.length] ?? 'neutral');
    },
    pickExpression: (index) => {
      const id = listExpressions(character)[index]?.id;
      if (id) setActiveId(id);
    },
  });

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
        <div className={styles.history}>
          <button
            type="button"
            aria-label="Undo"
            title={`Undo (${MOD}+Z)`}
            disabled={!canUndo}
            onClick={undo}
          >
            ↶
          </button>
          <button
            type="button"
            aria-label="Redo"
            title={`Redo (${MOD}+Shift+Z)`}
            disabled={!canRedo}
            onClick={redo}
          >
            ↷
          </button>
        </div>
        <button
          type="button"
          title="Random look and colours"
          onClick={() => {
            loadCharacter(randomCharacter(useCharacterStore.getState().character));
            setActiveId('neutral');
          }}
        >
          Random
        </button>
        <button type="button" onClick={() => setResetting(true)}>
          Reset
        </button>
        <StarterPicker onPicked={() => setActiveId('neutral')} />
        <CharacterFileButtons onLoaded={() => setActiveId('neutral')} />
        <ShareButton />
        <button
          type="button"
          className={styles.exportButton}
          title={`Export (${MOD}+E)`}
          onClick={() => setExporting(true)}
        >
          Export ▸
        </button>
      </header>
      <SharedLinkPrompt onOpened={() => setActiveId('neutral')} />
      {exporting && <ExportDialog active={active} onClose={() => setExporting(false)} />}
      {resetting && (
        <ConfirmDialog
          title="Start over?"
          confirmLabel="Reset"
          cancelLabel="Keep"
          onCancel={() => setResetting(false)}
          onConfirm={() => {
            resetCharacter();
            setActiveId('neutral');
            setResetting(false);
          }}
        >
          <p>{character.name || 'This character'} goes back to the default.</p>
          <small>Changed your mind later? Undo brings it back.</small>
        </ConfirmDialog>
      )}

      <main className={styles.main}>
        <PartPicker slot={slot} onSlotChange={changeSlot} faceTarget={faceTarget} />
        <Stage character={character} expression={active} />
        <ColorPanel />
      </main>

      <ExpressionStrip active={active} onSelect={setActiveId} />
    </div>
  );
}
