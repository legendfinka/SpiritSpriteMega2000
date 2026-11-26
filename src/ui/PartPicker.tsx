import { LAYER_ORDER } from '../canvas/layerOrder';
import { partsForSlot } from '../parts/registry';
import { useCharacterStore } from '../store/useCharacterStore';
import type { Slot } from '../types';
import styles from './PartPicker.module.css';
import { PartThumbnail } from './PartThumbnail';
import { OPTIONAL_SLOTS, SLOT_LABELS } from './slots';

const TABS = LAYER_ORDER.filter((slot) => partsForSlot(slot).length > 0);

interface PartPickerProps {
  slot: Slot;
  onSlotChange: (slot: Slot) => void;
}

export function PartPicker({ slot, onSlotChange }: PartPickerProps) {
  const selected = useCharacterStore((s) => s.character.parts[slot]);
  const colors = useCharacterStore((s) => s.character.colors);
  const setPart = useCharacterStore((s) => s.setPart);

  return (
    <section className={styles.picker} aria-label="Parts">
      <div className={styles.tabs} role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            className={styles.tab}
            aria-selected={tab === slot}
            onClick={() => onSlotChange(tab)}
          >
            {SLOT_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className={styles.grid} role="tabpanel" aria-label={SLOT_LABELS[slot]}>
        {OPTIONAL_SLOTS.includes(slot) && (
          <button
            type="button"
            className={styles.item}
            aria-pressed={selected === undefined}
            onClick={() => setPart(slot, undefined)}
          >
            None
          </button>
        )}
        {partsForSlot(slot).map((part) => (
          <button
            key={part.id}
            type="button"
            className={styles.item}
            aria-label={part.label}
            aria-pressed={selected === part.id}
            onClick={() => setPart(slot, part.id)}
          >
            <PartThumbnail part={part} colors={colors} />
            <span>{part.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
