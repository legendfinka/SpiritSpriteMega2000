import { parseCharacter } from '../store/parseCharacter';
import type { Character } from '../types';

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
