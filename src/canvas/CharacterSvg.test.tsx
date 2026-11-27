import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PRESET_EXPRESSIONS } from '../expressions/presets';
import { createDefaultCharacter } from '../store/defaultCharacter';
import { CharacterSvg } from './CharacterSvg';
import { LAYER_ORDER } from './layerOrder';

describe('CharacterSvg', () => {
  it('renders one group per layer, in layer order', () => {
    const { container } = render(
      <CharacterSvg character={createDefaultCharacter()} expression={PRESET_EXPRESSIONS.happy} />,
    );
    const slots = [...container.querySelectorAll('svg > g')].map((g) => g.getAttribute('data-slot'));
    // the default wears a top and bottom, so no one-piece; and no accessory
    expect(slots).toEqual(LAYER_ORDER.filter((s) => s !== 'accessory' && s !== 'outfit'));
    expect(container.querySelector('[data-part="eyes/closed-happy"]')).not.toBeNull();
    expect(container.querySelector('[data-part="extras/blush"]')).not.toBeNull();
  });

  it('exposes resolved colours as CSS variables', () => {
    const character = createDefaultCharacter();
    character.colors.hair = '#ff00ff';
    const { container } = render(<CharacterSvg character={character} />);
    const svg = container.querySelector('svg');
    expect(svg?.style.getPropertyValue('--hair')).toBe('#ff00ff');
    expect(svg?.style.getPropertyValue('--hair-shade')).toMatch(/^#[0-9a-f]{6}$/);
  });
});
