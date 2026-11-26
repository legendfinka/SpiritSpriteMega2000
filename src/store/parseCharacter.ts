import { isHex } from '../canvas/colors';
import { expressionNameError } from '../expressions/names';
import type { Character, Expression } from '../types';

const MAX_CHARACTER_NAME = 100;
// control characters, plus unicode line (Zl) and paragraph (Zp) separators
const LINE_BREAKS = /[\p{Cc}\p{Zl}\p{Zp}]+/gu;

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
    // ids become file names and Ren'Py code, so nothing odd gets in
    typeof id === 'string' &&
    expressionNameError(id, []) === null &&
    typeof eyes === 'string' &&
    typeof brows === 'string' &&
    typeof mouth === 'string' &&
    (extras === undefined || isStringArray(extras))
  );
}

/** checks saved/imported data and fills newer fields; null if it's junk */
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
    // the name gets pasted into a Ren'Py script, so keep it on one line
    name: name.replace(LINE_BREAKS, ' ').slice(0, MAX_CHARACTER_NAME),
    parts: parts as Character['parts'],
    colors: colors as Character['colors'],
    expressions,
    customExpressions,
    version,
  };
}
