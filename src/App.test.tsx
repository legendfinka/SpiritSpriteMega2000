import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { useCharacterStore } from './store/useCharacterStore';

const parts = () => useCharacterStore.getState().character.parts;

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
});

describe('editing', () => {
  it('picks a part and shows it on the neutral preview', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /happy/ }));
    fireEvent.click(screen.getByRole('tab', { name: 'Eyes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Wide' }));

    expect(parts().eyes).toBe('eyes/wide');
    const preview = screen.getByRole('img', { name: 'Preview' });
    expect(preview.querySelector('[data-part="eyes/wide"]')).not.toBeNull();
  });

  it('empties an optional slot with "None"', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'None' }));
    expect(parts().hairFront).toBeUndefined();
  });

  it('recolours the character and derives the shade', () => {
    render(<App />);
    const before = screen.getByLabelText<HTMLInputElement>('Hair shade').value;
    fireEvent.change(screen.getByLabelText('Hair'), { target: { value: '#ff00ff' } });

    expect(useCharacterStore.getState().character.colors.hair).toBe('#ff00ff');
    expect(screen.getByLabelText<HTMLInputElement>('Hair shade').value).not.toBe(before);
  });
});
