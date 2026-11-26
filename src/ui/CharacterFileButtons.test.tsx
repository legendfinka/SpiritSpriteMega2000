import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { characterToJson } from '../export/characterJson';
import { downloadBlob } from '../export/download';
import { createDefaultCharacter } from '../store/defaultCharacter';
import { useCharacterStore } from '../store/useCharacterStore';
import { CharacterFileButtons } from './CharacterFileButtons';

vi.mock('../export/download', () => ({ downloadBlob: vi.fn() }));

const pickFile = (contents: string, name = 'mira.json') =>
  fireEvent.change(screen.getByTestId('load-json'), {
    target: { files: [new File([contents], name, { type: 'application/json' })] },
  });

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CharacterFileButtons', () => {
  it('saves the character as <name>.json', () => {
    render(<CharacterFileButtons />);
    fireEvent.click(screen.getByRole('button', { name: 'Save JSON' }));
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'guy.json');
  });

  it('loads a saved character', async () => {
    const onLoaded = vi.fn();
    render(<CharacterFileButtons onLoaded={onLoaded} />);
    pickFile(characterToJson({ ...createDefaultCharacter(), name: 'Mira' }));

    await waitFor(() => expect(useCharacterStore.getState().character.name).toBe('Mira'));
    expect(onLoaded).toHaveBeenCalled();
  });

  it('refuses a file that is not a character', async () => {
    render(<CharacterFileButtons />);
    pickFile('{"nope": true}', 'other.json');

    const notice = await screen.findByRole('alertdialog', { name: "Can't load that" });
    expect(notice).toHaveTextContent('other.json');
    expect(useCharacterStore.getState().character.name).toBe('guy');

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
