import { useState } from 'react';
import styles from '../App.module.css';
import { t } from '../i18n';
import { randomCharacter } from '../store/randomCharacter';
import { useCharacterStore } from '../store/useCharacterStore';
import { CharacterFileButtons } from './CharacterFileButtons';
import { ConfirmDialog } from './ConfirmDialog';
import { LanguagePicker } from './LanguagePicker';
import { LockButton } from './LockButton';
import { ShareButton } from './ShareButton';
import { StarterPicker } from './StarterPicker';
import { useTheme } from './theme';
import { MOD } from './useShortcuts';
import { Wordmark } from './Wordmark';

const logoUrl = `${import.meta.env.BASE_URL}logo.svg`;

interface HeaderProps {
  /** the character was swapped out (random, reset, starter, load): show neutral */
  onCharacterChanged: () => void;
  onExport: () => void;
}

export function Header({ onCharacterChanged, onExport }: HeaderProps) {
  const name = useCharacterStore((s) => s.character.name);
  const canUndo = useCharacterStore((s) => s.past.length > 0);
  const canRedo = useCharacterStore((s) => s.future.length > 0);
  const { setName, resetCharacter, loadCharacter, undo, redo } = useCharacterStore.getState();
  const [theme, toggleTheme] = useTheme();
  const [resetting, setResetting] = useState(false);
  // locked by default: Random keeps the name you typed
  const [nameLocked, setNameLocked] = useState(true);

  return (
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
          <input value={name} onChange={(e) => setName(e.target.value)} />
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
          onCharacterChanged();
        }}
      >
        {t('header.random')}
      </button>
      <button type="button" onClick={() => setResetting(true)}>
        {t('common.reset')}
      </button>
      <StarterPicker onPicked={onCharacterChanged} />
      <CharacterFileButtons onLoaded={onCharacterChanged} />
      <ShareButton />
      <button
        type="button"
        className={styles.exportButton}
        title={`${t('header.export')} (${MOD}+E)`}
        onClick={onExport}
      >
        {t('header.export')} ▸
      </button>
      {resetting && (
        <ConfirmDialog
          title={t('reset.title')}
          confirmLabel={t('common.reset')}
          cancelLabel={t('common.keep')}
          onCancel={() => setResetting(false)}
          onConfirm={() => {
            resetCharacter();
            onCharacterChanged();
            setResetting(false);
          }}
        >
          <p>{t('reset.text', { name: name || t('reset.thisCharacter') })}</p>
          <small>{t('reset.hint')}</small>
        </ConfirmDialog>
      )}
    </header>
  );
}
