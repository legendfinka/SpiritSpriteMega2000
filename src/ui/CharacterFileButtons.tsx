import { useRef, useState } from 'react';
import { characterFromJson, downloadCharacterJson } from '../export/characterJson';
import { useCharacterStore } from '../store/useCharacterStore';
import { ConfirmDialog } from './ConfirmDialog';
import { MOD } from './useShortcuts';

interface CharacterFileButtonsProps {
  onLoaded?: () => void;
}

export function CharacterFileButtons({ onLoaded }: CharacterFileButtonsProps) {
  const character = useCharacterStore((s) => s.character);
  const loadCharacter = useCharacterStore((s) => s.loadCharacter);
  const input = useRef<HTMLInputElement>(null);
  /** name of a file that failed to load */
  const [badFile, setBadFile] = useState<string | null>(null);

  const load = async (file: File) => {
    const loaded = characterFromJson(await file.text());
    if (!loaded) {
      setBadFile(file.name);
      return;
    }
    loadCharacter(loaded);
    onLoaded?.();
  };

  return (
    <>
      <button type="button" onClick={() => input.current?.click()}>
        Load JSON
      </button>
      <button
        type="button"
        title={`Save JSON (${MOD}+S)`}
        onClick={() => downloadCharacterJson(character)}
      >
        Save JSON
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
        <ConfirmDialog title="Can't load that" onCancel={() => setBadFile(null)}>
          <p>“{badFile}” is not a SpiritSprite character file.</p>
          <small>Use a .json saved with Save JSON.</small>
        </ConfirmDialog>
      )}
    </>
  );
}
