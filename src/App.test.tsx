import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { useCharacterStore } from './store/useCharacterStore';

const character = () => useCharacterStore.getState().character;
const strip = () => within(screen.getByRole('contentinfo'));
const preview = () => screen.getByRole('img', { name: 'Preview' });

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('editing', () => {
  it('picks a part and shows it on the neutral preview', () => {
    render(<App />);
    fireEvent.click(strip().getByRole('button', { name: /happy/ }));
    fireEvent.click(screen.getByRole('tab', { name: 'Eyes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Wide' }));

    expect(character().parts.eyes).toBe('eyes/wide');
    expect(preview().querySelector('[data-part="eyes/wide"]')).not.toBeNull();
  });

  it('empties an optional slot with "None"', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'None' }));
    expect(character().parts.hairFront).toBeUndefined();
  });

  it('recolours the character and derives the shade', () => {
    render(<App />);
    const before = screen.getByLabelText<HTMLInputElement>('Hair shade').value;
    fireEvent.change(screen.getByLabelText('Hair'), { target: { value: '#ff00ff' } });

    expect(character().colors.hair).toBe('#ff00ff');
    expect(screen.getByLabelText<HTMLInputElement>('Hair shade').value).not.toBe(before);
  });
});

describe('expressions', () => {
  it('locks face parts while a preset is selected', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'Eyes' }));
    fireEvent.click(strip().getByRole('button', { name: /happy/ }));

    expect(screen.getByRole('button', { name: 'Wide' })).toBeDisabled();
    expect(screen.getByText(/is a preset/)).toBeInTheDocument();
  });

  it('adds a custom expression and edits only it', () => {
    render(<App />);
    fireEvent.click(strip().getByRole('button', { name: 'New expression' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Eyes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Wide' }));

    expect(character().customExpressions).toEqual([
      expect.objectContaining({ id: 'custom', eyes: 'eyes/wide' }),
    ]);
    expect(character().parts.eyes).toBe('eyes/normal');
    expect(preview().querySelector('[data-part="eyes/wide"]')).not.toBeNull();
  });

  it('combines extras on a custom expression', () => {
    render(<App />);
    fireEvent.click(strip().getByRole('button', { name: 'New expression' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Extras' }));
    fireEvent.click(screen.getByRole('button', { name: 'Blush' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sweat drop' }));

    expect(character().customExpressions[0]?.extras).toEqual(['extras/blush', 'extras/sweat-drop']);
  });

  it('renames, rejects a taken name, and deletes', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App />);
    fireEvent.click(strip().getByRole('button', { name: 'New expression' }));

    const name = screen.getByLabelText('Expression name');
    fireEvent.change(name, { target: { value: 'Very Happy' } });
    fireEvent.blur(name);
    expect(character().customExpressions[0]?.id).toBe('very_happy');

    const renamed = screen.getByLabelText('Expression name');
    fireEvent.change(renamed, { target: { value: 'sad' } });
    fireEvent.blur(renamed);
    expect(screen.getByRole('alert')).toHaveTextContent('Name already used');

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(character().customExpressions).toEqual([]);
    expect(strip().getByText('preset')).toBeInTheDocument();
  });

  it('duplicates a preset', () => {
    render(<App />);
    fireEvent.click(strip().getByRole('button', { name: /angry/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));

    expect(character().customExpressions).toEqual([
      expect.objectContaining({ id: 'angry_2', eyes: 'eyes/narrow' }),
    ]);
    expect(screen.getByLabelText('Expression name')).toHaveValue('angry_2');
  });
});
