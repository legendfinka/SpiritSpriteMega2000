import { parseCharacter } from '../store/parseCharacter';
import type { Character } from '../types';
import { downloadBlob } from './download';
import { jsonFileName } from './fileNames';

export function characterToJson(character: Character): string {
  return `${JSON.stringify(character, null, 2)}\n`;
}

/** null if it's not a character file */
export function characterFromJson(text: string): Character | null {
  try {
    return parseCharacter(JSON.parse(text));
  } catch {
    return null;
  }
}

export function downloadCharacterJson(character: Character): void {
  const blob = new Blob([characterToJson(character)], { type: 'application/json' });
  downloadBlob(blob, jsonFileName(character.name));
}
