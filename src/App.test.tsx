import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { shareHash } from './export/shareLink';
import { LANG_KEY } from './i18n';
import { freshCast } from './store/cast';
import { THEME_KEY } from './ui/theme';
import { useCharacterStore } from './store/useCharacterStore';

const character = () => useCharacterStore.getState().character;
const strip = () => within(screen.getByRole('contentinfo'));
const preview = () => screen.getByRole('img', { name: 'Preview' });

const cast = () => within(screen.getByRole('navigation', { name: 'Cast' }));

beforeEach(() => {
  useCharacterStore.setState({ ...freshCast(), past: [], future: [] });
});

describe('shortcuts and history', () => {
  const key = (k: string, extra: KeyboardEventInit = {}) =>
    fireEvent.keyDown(document, { key: k, ...extra });

  it('picks expressions with number and arrow keys', () => {
    render(<App />);
    key('3');
    expect(preview().querySelector('[data-part="eyes/sad"]')).not.toBeNull();
    key('ArrowRight');
    expect(preview().querySelector('[data-part="eyes/narrow"]')).not.toBeNull();
    key('ArrowLeft');
    key('ArrowLeft');
    key('ArrowLeft');
    // wraps from neutral back to the last one
    key('ArrowLeft');
    expect(preview().querySelector('[data-part="eyes/wide"]')).not.toBeNull();
  });

  it('undoes with the button and Ctrl+Z, redoes with Ctrl+Shift+Z', () => {
    render(<App />);
    const undoButton = screen.getByRole('button', { name: 'Undo' });
    expect(undoButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'None' }));
    expect(character().parts.hairFront).toBeUndefined();
    key('z', { ctrlKey: true });
    expect(character().parts.hairFront).toBe('hair-front/messy-fringe');
    key('z', { ctrlKey: true, shiftKey: true });
    expect(character().parts.hairFront).toBeUndefined();

    fireEvent.click(undoButton);
    expect(character().parts.hairFront).toBe('hair-front/messy-fringe');
  });

  it('leaves Ctrl+Z to text fields while typing', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'None' }));
    fireEvent.keyDown(screen.getByLabelText('Name'), { key: 'z', ctrlKey: true });
    expect(character().parts.hairFront).toBeUndefined();
  });

  it('loads a starter character, and undo brings the old one back', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Start from'), { target: { value: 'mira' } });
    expect(character().parts.body).toBe('body/base-female');
    expect(preview().querySelector('[data-part="outfit/dress"]')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(character().parts.body).toBe('body/base-male');
  });

  it('opens export with Ctrl+E and ignores other keys while it is open', () => {
    render(<App />);
    key('e', { ctrlKey: true });
    expect(screen.getByRole('dialog', { name: 'Export' })).toBeInTheDocument();
    key('3');
    expect(preview().querySelector('[data-part="eyes/normal"]')).not.toBeNull();
  });

  it('asks before resetting, Keep and Escape leave the character alone', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'None' }));
    const reset = () => fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    reset();
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
    reset();
    key('Escape');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(character().parts.hairFront).toBeUndefined();

    reset();
    const dialog = within(screen.getByRole('alertdialog', { name: 'Start over?' }));
    fireEvent.click(dialog.getByRole('button', { name: 'Reset' }));
    expect(character().parts.hairFront).toBe('hair-front/messy-fringe');
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('quick wins', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  const openLink = () => {
    window.history.replaceState(
      null,
      '',
      shareHash({ ...character(), name: 'friend', parts: { body: 'body/base-female' } }),
    );
    render(<App />);
    return within(screen.getByRole('alertdialog', { name: 'Shared character' }));
  };

  it('asks before adding a shared character to the cast, then clears the hash', () => {
    const dialog = openLink();
    expect(window.location.hash).toBe('');
    expect(character().name).toBe('guy');
    fireEvent.click(dialog.getByRole('button', { name: 'Add to cast' }));
    expect(character().name).toBe('friend');
    // yours is still there
    expect(cast().getByRole('button', { name: /guy/ })).toBeInTheDocument();
  });

  it('leaves the cast alone if you say so', () => {
    fireEvent.click(openLink().getByRole('button', { name: 'Not now' }));
    expect(character().name).toBe('guy');
    expect(useCharacterStore.getState().cast).toHaveLength(1);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('adds, switches and removes cast members', () => {
    render(<App />);
    fireEvent.click(cast().getByRole('button', { name: 'New character' }));
    expect(character().name).toBe('guy 2');
    fireEvent.click(cast().getByRole('button', { name: /^guy$/ }));
    expect(character().name).toBe('guy');

    fireEvent.click(cast().getByRole('button', { name: 'Remove character' }));
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove' }),
    );
    expect(useCharacterStore.getState().cast).toHaveLength(1);
    expect(character().name).toBe('guy 2');
    expect(cast().getByRole('button', { name: 'Remove character' })).toBeDisabled();
  });

  it('puts another cast member on stage in the scene view', () => {
    useCharacterStore.getState().addCharacter({ ...character(), name: 'mira' });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'scene' }));
    expect(screen.queryAllByTestId('scene-companion')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: '+ guy' }));
    expect(screen.getAllByTestId('scene-companion')).toHaveLength(1);
  });

  it('switches the whole interface to Ukrainian and Russian and back', () => {
    render(<App />);
    const pickLanguage = (name: string) =>
      fireEvent.click(screen.getByRole('button', { name }));

    pickLanguage('Українська');
    expect(screen.getByRole('button', { name: 'Випадково' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Очі' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Скуйовджена чубка' })).toBeInTheDocument();
    // preset names are translated on screen
    expect(strip().getByText('радість')).toBeInTheDocument();

    pickLanguage('Русский');
    expect(screen.getByRole('tab', { name: 'Глаза' })).toBeInTheDocument();

    pickLanguage('English');
    expect(screen.getByRole('tab', { name: 'Eyes' })).toBeInTheDocument();
    expect(strip().getByText('happy')).toBeInTheDocument();
    localStorage.removeItem(LANG_KEY);
  });

  it('switches day and night and remembers the choice', () => {
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('day');
    fireEvent.click(screen.getByRole('button', { name: 'Switch to night' }));
    expect(document.documentElement.dataset.theme).toBe('night');
    expect(localStorage.getItem(THEME_KEY)).toBe('night');
    fireEvent.click(screen.getByRole('button', { name: 'Switch to day' }));
    expect(document.documentElement.dataset.theme).toBe('day');
    localStorage.removeItem(THEME_KEY);
  });

  it('randomises in one undoable step', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    render(<App />);
    const before = character();
    fireEvent.click(screen.getByRole('button', { name: 'Random' }));
    expect(character().parts).not.toEqual(before.parts);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(character()).toEqual(before);
  });

  it('keeps the name on Random until the lock is opened', () => {
    render(<App />);
    const random = screen.getByRole('button', { name: 'Random' });
    const lock = screen.getByRole('button', { name: 'Keep name on Random' });
    expect(lock).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(random);
    expect(character().name).toBe('guy');

    fireEvent.click(lock);
    expect(lock).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(random);
    expect(character().name).not.toBe('guy');
  });

  it('applies a swatch and puts the shade back to auto', () => {
    useCharacterStore.getState().setColor('hair-shade', '#ff0000');
    render(<App />);
    const swatch = screen.getByRole('button', { name: 'Hair: Blonde' });
    fireEvent.click(swatch);
    expect(character().colors.hair).toBe('#e8c46a');
    expect(character().colors['hair-shade']).toBeUndefined();
    expect(swatch).toHaveAttribute('aria-pressed', 'true');
  });
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
    const dialog = within(screen.getByRole('alertdialog', { name: 'Delete expression?' }));
    fireEvent.click(dialog.getByRole('button', { name: 'Keep' }));
    expect(character().customExpressions).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }),
    );
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
