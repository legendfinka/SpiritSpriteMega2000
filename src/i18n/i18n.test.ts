import { afterEach, describe, expect, it } from 'vitest';
import { SWATCHES } from '../canvas/palettes';
import { PARTS } from '../parts/registry';
import { STARTERS } from '../store/starters';
import { LANG_KEY, MESSAGES, partLabel, setLang, swatchLabel, t } from '.';
import { PART_NAMES, SWATCH_NAMES } from './partNames';

afterEach(() => {
  setLang('en');
  localStorage.removeItem(LANG_KEY);
});

const placeholders = (text: string) => [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();

describe.each(['uk', 'ru'] as const)('%s', (lang) => {
  it('keeps the same placeholders as English and leaves nothing empty', () => {
    for (const [key, text] of Object.entries(MESSAGES.en)) {
      const translated = MESSAGES[lang][key as keyof typeof MESSAGES.en];
      expect(translated.trim(), key).not.toBe('');
      expect(placeholders(translated), key).toEqual(placeholders(text));
    }
  });
});

describe('names', () => {
  it('covers every bundled part', () => {
    expect(Object.keys(PART_NAMES).sort()).toEqual(PARTS.map((p) => p.id).sort());
  });

  it('covers every swatch', () => {
    for (const swatch of Object.values(SWATCHES).flat()) {
      expect(SWATCH_NAMES[swatch.label], swatch.label).toBeDefined();
    }
  });

  it('covers every starter', () => {
    for (const { id } of STARTERS) {
      expect(MESSAGES.en[`starter.${id}` as keyof typeof MESSAGES.en], id).toBeDefined();
    }
  });
});

describe('t', () => {
  it('fills placeholders and follows the language', () => {
    expect(t('export.saved', { name: 'a.zip' })).toBe('Saved a.zip');
    setLang('uk');
    expect(t('export.saved', { name: 'a.zip' })).toBe('Збережено a.zip');
    expect(partLabel({ id: 'bottom/jeans', label: 'Jeans' })).toBe('Джинси');
    expect(partLabel({ id: 'custom/hat', label: 'My hat' })).toBe('My hat');
    setLang('ru');
    expect(swatchLabel('Blonde')).toBe('Блонд');
    expect(localStorage.getItem(LANG_KEY)).toBe('ru');
    expect(document.documentElement.lang).toBe('ru');
  });
});
