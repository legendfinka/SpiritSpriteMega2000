import { useState } from 'react';
import styles from './App.module.css';
import { downloadCharacterJson } from './export/characterJson';
import {
  getExpression,
  getPresetExpression,
  isPresetId,
  listExpressions,
} from './expressions/presets';
import { useLang } from './i18n';
import { useCharacterStore } from './store/useCharacterStore';
import type { ExpressionId, Slot } from './types';
import { CastBar } from './ui/CastBar';
import { ColorPanel } from './ui/ColorPanel';
import { ExportDialog } from './ui/ExportDialog';
import { ExpressionStrip } from './ui/ExpressionStrip';
import { Header } from './ui/Header';
import { type FaceTarget, PartPicker } from './ui/PartPicker';
import { FACE_SLOTS } from './ui/slots';
import { SharedLinkPrompt } from './ui/SharedLinkPrompt';
import { Stage } from './ui/Stage';
import { useShortcuts } from './ui/useShortcuts';

export function App() {
  const character = useCharacterStore((s) => s.character);
  const { undo, redo } = useCharacterStore.getState();
  const [activeId, setActiveId] = useState<ExpressionId>('neutral');
  const [slot, setSlot] = useState<Slot>('hairFront');
  const [exporting, setExporting] = useState(false);
  // subscribed here so everything below redraws in the new language
  useLang();
  const showNeutral = () => setActiveId('neutral');

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
    if (FACE_SLOTS.includes(next) && faceTarget.kind === 'preset') showNeutral();
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
      <Header onCharacterChanged={showNeutral} onExport={() => setExporting(true)} />
      <SharedLinkPrompt onOpened={showNeutral} />
      {exporting && <ExportDialog active={active} onClose={() => setExporting(false)} />}

      <div className={styles.cast}>
        <CastBar onSwitched={showNeutral} />
      </div>

      <main className={styles.main}>
        <PartPicker slot={slot} onSlotChange={changeSlot} faceTarget={faceTarget} />
        <Stage character={character} expression={active} />
        <ColorPanel />
      </main>

      <ExpressionStrip active={active} onSelect={setActiveId} />
    </div>
  );
}
