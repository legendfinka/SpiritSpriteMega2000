import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob } from '../export/download';
import { svgToImage, svgToImageBytes } from '../export/svgToPng';
import { getPresetExpression } from '../expressions/presets';
import { useCharacterStore } from '../store/useCharacterStore';
import { ExportDialog } from './ExportDialog';

// no canvas or downloads in jsdom
vi.mock('../export/svgToPng', () => ({
  svgToImage: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
  svgToImageBytes: vi.fn(async () => new Uint8Array([1, 2, 3])),
}));
vi.mock('../export/download', () => ({ downloadBlob: vi.fn() }));

const onClose = vi.fn();

function renderDialog() {
  const character = useCharacterStore.getState().character;
  render(<ExportDialog active={getPresetExpression('neutral', character)} onClose={onClose} />);
}

const fileList = () =>
  within(screen.getByRole('list', { name: 'Files in the zip' }))
    .getAllByRole('listitem')
    .map((li) => li.textContent);

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
  vi.clearAllMocks();
});

describe('ExportDialog', () => {
  it('lists the exact files the zip will contain', () => {
    renderDialog();
    expect(fileList()).toEqual([
      'guy neutral.png',
      'guy happy.png',
      'guy sad.png',
      'guy angry.png',
      'guy surprised.png',
      'character.json',
      'README.txt',
    ]);
  });

  it('updates the list from the options', () => {
    renderDialog();
    fireEvent.click(screen.getByLabelText('sad'));
    fireEvent.click(screen.getByLabelText('WEBP'));
    fireEvent.click(screen.getByLabelText('Include character.json'));

    expect(fileList()).toEqual([
      'guy neutral.webp',
      'guy happy.webp',
      'guy angry.webp',
      'guy surprised.webp',
      'README.txt',
    ]);
    expect(useCharacterStore.getState().character.expressions).not.toContain('sad');
  });

  it('switches to a layered export with blink & talk', () => {
    renderDialog();
    const blink = screen.getByLabelText(/Blink & talk/);
    expect(blink).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/^Layered/));
    expect(blink).toBeEnabled();
    expect(blink).toBeChecked();
    expect(fileList()).toContain('guy_layered.rpy');
    expect(fileList()).toContain('images/guy_base.png');
    expect(fileList()).not.toContain('guy happy.png');
  });

  it('explains instead of crashing when a name clashes with layered keywords', () => {
    useCharacterStore.setState((s) => ({
      character: {
        ...s.character,
        customExpressions: [
          { id: 'default', eyes: 'eyes/normal', brows: 'brows/neutral', mouth: 'mouth/neutral' },
        ],
        expressions: [...s.character.expressions, 'default'],
      },
    }));
    renderDialog();
    fireEvent.click(screen.getByLabelText(/^Layered/));
    expect(screen.getByRole('alert')).toHaveTextContent('Rename the “default” expression');
    expect(screen.getByRole('button', { name: 'Download zip' })).toBeDisabled();
  });

  it('downloads the zip', async () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Download zip' }));

    await waitFor(() =>
      expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'guy_sprites.zip'),
    );
    expect(svgToImageBytes).toHaveBeenCalledTimes(5);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Saved guy_sprites.zip'),
    );
  });

  it('downloads only the current expression at the chosen size', async () => {
    renderDialog();
    fireEvent.click(screen.getByLabelText(/^2×/));
    fireEvent.click(screen.getByRole('button', { name: 'Only guy neutral.png' }));

    await waitFor(() =>
      expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'guy neutral.png'),
    );
    expect(vi.mocked(svgToImage).mock.calls[0]?.[0]).toContain('width="1600"');
  });

  it('shows errors', async () => {
    vi.mocked(svgToImageBytes).mockRejectedValueOnce(new Error("This browser can't save WEBP."));
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Download zip' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("can't save WEBP");
    expect(downloadBlob).not.toHaveBeenCalled();
  });

  it('cannot export an empty zip, and closes on Escape', () => {
    useCharacterStore.setState((s) => ({ character: { ...s.character, expressions: [] } }));
    renderDialog();
    expect(screen.getByRole('button', { name: 'Download zip' })).toBeDisabled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
