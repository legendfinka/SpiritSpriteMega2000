import { memo, useState } from 'react';
import { CharacterSvg, HEAD_VIEWBOX } from '../canvas/CharacterSvg';
import { toImageTag } from '../export/fileNames';
import { t } from '../i18n';
import { type CastMember, castWithActive, MAX_CAST } from '../store/cast';
import { useCharacterStore } from '../store/useCharacterStore';
import type { Character } from '../types';
import styles from './CastBar.module.css';
import { ConfirmDialog } from './ConfirmDialog';

// heads only redraw when that character changes
const Head = memo(function Head({ character }: { character: Character }) {
  return (
    <span aria-hidden="true">
      <CharacterSvg character={character} viewBox={HEAD_VIEWBOX} className={styles.head} />
    </span>
  );
});

interface CastBarProps {
  /** another character is now selected */
  onSwitched: () => void;
}

export function CastBar({ onSwitched }: CastBarProps) {
  const character = useCharacterStore((s) => s.character);
  const storedCast = useCharacterStore((s) => s.cast);
  const activeId = useCharacterStore((s) => s.activeId);
  const { selectCharacter, addCharacter, duplicateCharacter, removeCharacter } =
    useCharacterStore.getState();
  const [removing, setRemoving] = useState<CastMember | null>(null);

  const cast = castWithActive({ character, cast: storedCast, activeId });
  const full = cast.length >= MAX_CAST;
  const tags = cast.map((m) => toImageTag(m.character.name));
  const clash = tags.some((t, i) => tags.indexOf(t) !== i);
  const active = cast.find((m) => m.id === activeId);

  const run = (action: () => void) => {
    action();
    onSwitched();
  };

  return (
    <nav className={styles.bar} aria-label={t('cast.label')}>
      <span className={styles.label}>{t('cast.label')}</span>
      <div className={styles.members}>
        {cast.map((m) => (
          <button
            key={m.id}
            type="button"
            className={styles.member}
            aria-pressed={m.id === activeId}
            onClick={() => m.id !== activeId && run(() => selectCharacter(m.id))}
          >
            <Head character={m.character} />
            <span className={styles.name}>{m.character.name || t('common.unnamed')}</span>
          </button>
        ))}
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          aria-label={t('cast.newLabel')}
          disabled={full}
          onClick={() => run(() => addCharacter())}
        >
          + {t('cast.new')}
        </button>
        <button
          type="button"
          aria-label={t('cast.duplicateLabel')}
          disabled={full}
          onClick={() => run(duplicateCharacter)}
        >
          {t('common.duplicate')}
        </button>
        <button
          type="button"
          aria-label={t('cast.removeLabel')}
          disabled={cast.length <= 1}
          onClick={() => active && setRemoving(active)}
        >
          {t('common.remove')}
        </button>
      </div>
      {clash && (
        <p className={styles.warning} role="status">
          {t('cast.clash')}
        </p>
      )}
      {removing && (
        <ConfirmDialog
          title={t('cast.removeTitle')}
          confirmLabel={t('common.remove')}
          cancelLabel={t('common.keep')}
          onCancel={() => setRemoving(null)}
          onConfirm={() => {
            run(() => removeCharacter(removing.id));
            setRemoving(null);
          }}
        >
          <p>
            {t('cast.removeText', { name: removing.character.name || t('common.unnamed') })}
          </p>
          <small>{t('cast.removeHint')}</small>
        </ConfirmDialog>
      )}
    </nav>
  );
}
