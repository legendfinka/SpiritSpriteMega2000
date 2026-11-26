import { useRef } from 'react';
import { characterFromJson, downloadCharacterJson } from '../export/characterJson';
import { useCharacterStore } from '../store/useCharacterStore';
import { MOD } from './useShortcuts';

interface CharacterFileButtonsProps {
  onLoaded?: () => void;
}

export function CharacterFileButtons({ onLoaded }: CharacterFileButtonsProps) {
  const character = useCharacterStore((s) => s.character);
  const loadCharacter = useCharacterStore((s) => s.loadCharacter);
  const input = useRef<HTMLInputElement>(null);

  const load = async (file: File) => {
    const loaded = characterFromJson(await file.text());
    if (!loaded) {
      window.alert(`“${file.name}” is not a SpiritSprite character file.`);
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
    </>
  );
}
