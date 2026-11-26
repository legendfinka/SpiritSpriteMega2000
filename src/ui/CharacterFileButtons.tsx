import { useRef } from 'react';
import { characterFromJson, characterToJson } from '../export/characterJson';
import { downloadBlob } from '../export/download';
import { jsonFileName } from '../export/fileNames';
import { useCharacterStore } from '../store/useCharacterStore';

interface CharacterFileButtonsProps {
  onLoaded?: () => void;
}

export function CharacterFileButtons({ onLoaded }: CharacterFileButtonsProps) {
  const character = useCharacterStore((s) => s.character);
  const loadCharacter = useCharacterStore((s) => s.loadCharacter);
  const input = useRef<HTMLInputElement>(null);

  const save = () => {
    const blob = new Blob([characterToJson(character)], { type: 'application/json' });
    downloadBlob(blob, jsonFileName(character.name));
  };

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
      <button type="button" onClick={save}>
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
