// ids end up in Ren'Py and file names, so: one lowercase word
const NAME_RE = /^[a-z][a-z0-9_]*$/;
export const MAX_NAME_LENGTH = 32;

/** "Very Happy!" -> "very_happy" */
export function toExpressionName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, MAX_NAME_LENGTH);
}

/** error message, or null if it's fine */
export function expressionNameError(name: string, taken: readonly string[]): string | null {
  if (name === '') return 'Enter a name';
  if (!NAME_RE.test(name)) return 'Must start with a letter';
  if (taken.includes(name)) return 'Name already used';
  return null;
}

/** `base` if free, otherwise `base_2`, `base_3`, … */
export function uniqueExpressionName(base: string, taken: readonly string[]): string {
  const clean = toExpressionName(base) || 'custom';
  const root = NAME_RE.test(clean) ? clean : `x_${clean}`;
  if (!taken.includes(root)) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root.replace(/_\d+$/, '')}_${n}`;
    if (!taken.includes(candidate)) return candidate;
  }
}
