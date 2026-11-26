import { describe, expect, it } from 'vitest';
import { expressionNameError, toExpressionName, uniqueExpressionName } from './names';

describe('expression names', () => {
  it('turns input into one lowercase Ren\'Py word', () => {
    expect(toExpressionName('  Very Happy! ')).toBe('very_happy');
    expect(toExpressionName('half-asleep')).toBe('half_asleep');
    expect(toExpressionName('Ёлка')).toBe('');
  });

  it('rejects empty, non-letter starts and taken names', () => {
    expect(expressionNameError('', [])).toMatch(/enter/i);
    expect(expressionNameError('2cool', [])).toMatch(/letter/i);
    expect(expressionNameError('happy', ['happy'])).toMatch(/used/i);
    expect(expressionNameError('smug', ['happy'])).toBeNull();
  });

  it('finds a free name', () => {
    expect(uniqueExpressionName('custom', [])).toBe('custom');
    expect(uniqueExpressionName('happy', ['happy'])).toBe('happy_2');
    expect(uniqueExpressionName('happy_2', ['happy', 'happy_2'])).toBe('happy_3');
    expect(uniqueExpressionName('', [])).toBe('custom');
  });
});
