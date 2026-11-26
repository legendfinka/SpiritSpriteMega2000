import { isHex } from '../canvas/colors';
import type { Character } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Runtime check for untrusted data (localStorage now, JSON import later). */
export function isCharacter(value: unknown): value is Character {
  if (!isRecord(value)) return false;
  const { name, parts, colors, expressions, version } = value;
  return (
    version === 1 &&
    typeof name === 'string' &&
    isRecord(parts) &&
    Object.values(parts).every((id) => typeof id === 'string') &&
    isRecord(colors) &&
    Object.values(colors).every((hex) => typeof hex === 'string' && isHex(hex)) &&
    Array.isArray(expressions) &&
    expressions.every((id) => typeof id === 'string')
  );
}
