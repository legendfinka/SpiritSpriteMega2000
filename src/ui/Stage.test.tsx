import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getPresetExpression } from '../expressions/presets';
import { createDefaultCharacter } from '../store/defaultCharacter';
import { Stage } from './Stage';

const character = createDefaultCharacter();

function renderStage() {
  render(<Stage character={character} expression={getPresetExpression('neutral', character)} />);
}

describe('Stage', () => {
  it('shows the alignment guide on request', () => {
    const { container } = render(
      <Stage character={character} expression={getPresetExpression('neutral', character)} />,
    );
    expect(container.querySelector('img[src*="alignment-guide"]')).toBeNull();
    fireEvent.click(screen.getByLabelText('Guide'));
    expect(container.querySelector('img[src*="alignment-guide"]')).not.toBeNull();
  });

  it('previews the sprite on a background', () => {
    renderStage();
    fireEvent.click(screen.getByRole('button', { name: 'scene' }));
    expect(screen.getByTestId('scene-background')).toHaveAttribute(
      'src',
      expect.stringContaining('backgrounds/room.svg'),
    );

    fireEvent.change(screen.getByLabelText('Background'), { target: { value: 'kitchen' } });
    expect(screen.getByTestId('scene-background')).toHaveAttribute(
      'src',
      expect.stringContaining('backgrounds/kitchen.svg'),
    );
    expect(screen.getByRole('img', { name: 'Preview' })).toBeInTheDocument();
  });

  it('places the sprite like Ren\'Py left / center / right', () => {
    renderStage();
    fireEvent.click(screen.getByRole('button', { name: 'scene' }));
    const sprite = () => screen.getByTestId('scene-sprite');

    expect(sprite().style.left).toMatch(/^29\.16/);
    fireEvent.click(screen.getByRole('button', { name: 'left' }));
    expect(sprite().style.left).toBe('0%');
    fireEvent.click(screen.getByRole('button', { name: 'right' }));
    expect(sprite().style.left).toMatch(/^58\.33/);
  });
});
