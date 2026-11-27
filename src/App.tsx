import { useState } from 'react';
import styles from './App.module.css';
import { downloadCharacterJson } from './export/characterJson';
import {
  getExpression,
  getPresetExpression,
  isPresetId,
  listExpressions,
} from './expressions/presets';
import { t, useLang } from './i18n';
import { randomCharacter } from './store/randomCharacter';
import { useCharacterStore } from './store/useCharacterStore';
import type { ExpressionId, Slot } from './types';
import { CastBar } from './ui/CastBar';
import { CharacterFileButtons } from './ui/CharacterFileButtons';
import { ColorPanel } from './ui/ColorPanel';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { ExportDialog } from './ui/ExportDialog';
import { ExpressionStrip } from './ui/ExpressionStrip';
import { LanguagePicker } from './ui/LanguagePicker';
import { LockButton } from './ui/LockButton';
import { type FaceTarget, PartPicker } from './ui/PartPicker';
import { FACE_SLOTS } from './ui/slots';
import { ShareButton } from './ui/ShareButton';
import { SharedLinkPrompt } from './ui/SharedLinkPrompt';
import { Stage } from './ui/Stage';
import { StarterPicker } from './ui/StarterPicker';
import { useTheme } from './ui/theme';
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
  const [theme, toggleTheme] = useTheme();
  // subscribed here so everything below redraws in the new language
  useLang();
  // locked by default: Random keeps the name you typed
  const [nameLocked, setNameLocked] = useState(true);

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
        <LanguagePicker />
        <button
          type="button"
          className={styles.themeButton}
          aria-label={t(theme === 'night' ? 'header.toDay' : 'header.toNight')}
          title={t(theme === 'night' ? 'header.dayMode' : 'header.nightMode')}
          onClick={toggleTheme}
        >
          {/* ︎: draw as text, not a colour emoji */}
          {theme === 'night' ? '☀︎' : '☾︎'}
        </button>
        <div className={styles.nameField}>
          <label className={styles.control}>
            {t('header.name')}
            <input value={character.name} onChange={(e) => setName(e.target.value)} />
          </label>
          <LockButton locked={nameLocked} onToggle={() => setNameLocked(!nameLocked)} />
        </div>
        <div className={styles.history}>
          <button
            type="button"
            aria-label={t('header.undo')}
            title={`${t('header.undo')} (${MOD}+Z)`}
            disabled={!canUndo}
            onClick={undo}
          >
            ↶
          </button>
          <button
            type="button"
            aria-label={t('header.redo')}
            title={`${t('header.redo')} (${MOD}+Shift+Z)`}
            disabled={!canRedo}
            onClick={redo}
          >
            ↷
          </button>
        </div>
        <button
          type="button"
          title={t('header.randomHint')}
          onClick={() => {
            const current = useCharacterStore.getState().character;
            loadCharacter(randomCharacter(current, Math.random, { name: !nameLocked }));
            setActiveId('neutral');
          }}
        >
          {t('header.random')}
        </button>
        <button type="button" onClick={() => setResetting(true)}>
          {t('common.reset')}
        </button>
        <StarterPicker onPicked={() => setActiveId('neutral')} />
        <CharacterFileButtons onLoaded={() => setActiveId('neutral')} />
        <ShareButton />
        <button
          type="button"
          className={styles.exportButton}
          title={`${t('header.export')} (${MOD}+E)`}
          onClick={() => setExporting(true)}
        >
          {t('header.export')} ▸
        </button>
      </header>
      <SharedLinkPrompt onOpened={() => setActiveId('neutral')} />
      {exporting && <ExportDialog active={active} onClose={() => setExporting(false)} />}
      {resetting && (
        <ConfirmDialog
          title={t('reset.title')}
          confirmLabel={t('common.reset')}
          cancelLabel={t('common.keep')}
          onCancel={() => setResetting(false)}
          onConfirm={() => {
            resetCharacter();
            setActiveId('neutral');
            setResetting(false);
          }}
        >
          <p>{t('reset.text', { name: character.name || t('reset.thisCharacter') })}</p>
          <small>{t('reset.hint')}</small>
        </ConfirmDialog>
      )}

      <div className={styles.cast}>
        <CastBar onSwitched={() => setActiveId('neutral')} />
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
