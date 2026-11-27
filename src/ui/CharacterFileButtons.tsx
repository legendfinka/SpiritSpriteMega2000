import { useRef, useState } from 'react';
import { characterFromJson, downloadCharacterJson } from '../export/characterJson';
import { t } from '../i18n';
import { MAX_CAST } from '../store/cast';
import { useCharacterStore } from '../store/useCharacterStore';
import { ConfirmDialog } from './ConfirmDialog';
import { MOD } from './useShortcuts';

interface CharacterFileButtonsProps {
  onLoaded?: () => void;
}

export function CharacterFileButtons({ onLoaded }: CharacterFileButtonsProps) {
  const character = useCharacterStore((s) => s.character);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const input = useRef<HTMLInputElement>(null);
  /** name of a file that failed to load */
  const [badFile, setBadFile] = useState<string | null>(null);
  const [castFull, setCastFull] = useState(false);

  // a loaded character joins the cast instead of replacing the current one
  const load = async (file: File) => {
    const loaded = characterFromJson(await file.text());
    if (!loaded) {
      setBadFile(file.name);
      return;
    }
    if (useCharacterStore.getState().cast.length >= MAX_CAST) {
      setCastFull(true);
      return;
    }
    addCharacter(loaded);
    onLoaded?.();
  };

  return (
    <>
      <button type="button" onClick={() => input.current?.click()}>
        {t('file.load')}
      </button>
      <button
        type="button"
        title={`${t('file.save')} (${MOD}+S)`}
        onClick={() => downloadCharacterJson(character)}
      >
        {t('file.save')}
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        data-testid="load-json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // so the same file can be picked twice
          if (file) void load(file);
        }}
      />
      {badFile !== null && (
        <ConfirmDialog title={t('file.badTitle')} onCancel={() => setBadFile(null)}>
          <p>{t('file.badText', { file: badFile })}</p>
          <small>{t('file.badHint')}</small>
        </ConfirmDialog>
      )}
      {castFull && (
        <ConfirmDialog title={t('file.fullTitle')} onCancel={() => setCastFull(false)}>
          <p>{t('file.fullText', { max: MAX_CAST })}</p>
        </ConfirmDialog>
      )}
    </>
  );
}
