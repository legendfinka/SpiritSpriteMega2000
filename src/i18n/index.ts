import { useSyncExternalStore } from 'react';
import type { Part } from '../types';
import { en, type MessageKey, type Messages } from './en';
import { PART_NAMES, SWATCH_NAMES } from './partNames';
import { ru } from './ru';
import { uk } from './uk';

export type { MessageKey };
export type Lang = 'en' | 'uk' | 'ru';

/** each language named in itself */
export const LANGUAGES: readonly { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'uk', label: 'Українська' },
  { id: 'ru', label: 'Русский' },
];

export const LANG_KEY = 'spirit-sprite-lang';
export const MESSAGES: Record<Lang, Messages> = { en, uk, ru };

const isLang = (value: unknown): value is Lang =>
  LANGUAGES.some((language) => language.id === value);

/** the saved choice, else the first browser language we have */
function detect(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // storage can be blocked
  }
  const preferred = typeof navigator === 'undefined' ? [] : (navigator.languages ?? []);
  for (const tag of preferred) {
    const short = tag.slice(0, 2).toLowerCase();
    if (isLang(short)) return short;
  }
  return 'en';
}

let current: Lang = detect();
const listeners = new Set<() => void>();
const applyToDocument = () => {
  if (typeof document !== 'undefined') document.documentElement.lang = current;
};
applyToDocument();

export const getLang = (): Lang => current;

export function setLang(lang: Lang): void {
  current = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // still switches, just won't be remembered
  }
  applyToDocument();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** App calls this, so the whole tree redraws on a language change */
export const useLang = (): Lang => useSyncExternalStore(subscribe, getLang);

/** UI text in the current language; {name} placeholders come from `vars` */
export function t(key: MessageKey, vars: Record<string, string | number> = {}): string {
  return MESSAGES[current][key].replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * preset names on screen; the id itself stays English in files and Ren'Py.
 * Custom expressions show whatever the user called them.
 */
export function expressionLabel(id: string): string {
  const key = `preset.${id}`;
  return Object.hasOwn(en, key) ? t(key as MessageKey) : id;
}

const column = () => (current === 'uk' ? 0 : 1);

/** bundled parts are translated; uploads keep their file name */
export function partLabel(part: Pick<Part, 'id' | 'label'>): string {
  return current === 'en' ? part.label : (PART_NAMES[part.id]?.[column()] ?? part.label);
}

export function swatchLabel(label: string): string {
  return current === 'en' ? label : (SWATCH_NAMES[label]?.[column()] ?? label);
}
