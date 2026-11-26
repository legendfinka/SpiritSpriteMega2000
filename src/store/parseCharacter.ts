import { isHex } from '../canvas/colors';
import type { Character, Expression } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function isExpression(value: unknown): value is Expression {
  if (!isRecord(value)) return false;
  const { id, eyes, brows, mouth, extras } = value;
  return (
    typeof id === 'string' &&
    typeof eyes === 'string' &&
    typeof brows === 'string' &&
    typeof mouth === 'string' &&
    (extras === undefined || isStringArray(extras))
  );
}

/**
 * Validate untrusted data (localStorage, JSON import) and fill fields added
 * after a save was made. Returns null if it isn't a character.
 */
export function parseCharacter(value: unknown): Character | null {
  if (!isRecord(value)) return null;
  const { name, parts, colors, expressions, customExpressions = [], version } = value;
  if (
    version !== 1 ||
    typeof name !== 'string' ||
    !isRecord(parts) ||
    !Object.values(parts).every((id) => typeof id === 'string') ||
    !isRecord(colors) ||
    !Object.values(colors).every((hex) => typeof hex === 'string' && isHex(hex)) ||
    !isStringArray(expressions) ||
    !Array.isArray(customExpressions) ||
    !customExpressions.every(isExpression)
  ) {
    return null;
  }
  return {
    name,
    parts: parts as Character['parts'],
    colors: colors as Character['colors'],
    expressions,
    customExpressions,
    version,
  };
}
