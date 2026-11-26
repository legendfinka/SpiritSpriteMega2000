import { describe, expect, it } from 'vitest';
import { createDefaultCharacter } from '../store/defaultCharacter';
import { renpySnippet, renpyVariable } from './renpySnippet';

const named = (name: string) => ({ ...createDefaultCharacter(), name });

describe('renpySnippet', () => {
  it('defines the character and shows each expression', () => {
    const snippet = renpySnippet(named('Oleh'), ['neutral', 'happy']);
    expect(snippet).toContain('define oleh = Character("Oleh")');
    expect(snippet).toContain('    show oleh neutral');
    expect(snippet).toContain('    show oleh happy');
    expect(snippet).toMatch(/\n {4}return$/);
  });

  it('avoids variable names Ren\'Py reserves', () => {
    expect(renpyVariable('Show')).toBe('show_char');
    expect(renpyVariable('Mira')).toBe('mira');
  });

  it('escapes quotes and text tags in the display name', () => {
    expect(renpySnippet(named('Big "B" [x] {y}'), [])).toContain(
      'Character("Big \\"B\\" [[x] {{y}")',
    );
  });
});
