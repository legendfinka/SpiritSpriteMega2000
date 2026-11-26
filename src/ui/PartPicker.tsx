import { LAYER_ORDER } from '../canvas/layerOrder';
import { partsForSlot } from '../parts/registry';
import { useCharacterStore } from '../store/useCharacterStore';
import type { Expression, Slot } from '../types';
import styles from './PartPicker.module.css';
import { PartThumbnail } from './PartThumbnail';
import { FACE_SLOTS, OPTIONAL_SLOTS, SLOT_LABELS } from './slots';

const TABS = LAYER_ORDER.filter((slot) => partsForSlot(slot).length > 0);

/** what the face tabs are editing */
export type FaceTarget =
  | { kind: 'character' }
  | { kind: 'custom'; expression: Expression }
  | { kind: 'preset'; expression: Expression };

interface PartPickerProps {
  slot: Slot;
  onSlotChange: (slot: Slot) => void;
  faceTarget: FaceTarget;
}

export function PartPicker({ slot, onSlotChange, faceTarget }: PartPickerProps) {
  const characterPart = useCharacterStore((s) => s.character.parts[slot]);
  const colors = useCharacterStore((s) => s.character.colors);
  const setPart = useCharacterStore((s) => s.setPart);
  const updateExpression = useCharacterStore((s) => s.updateExpression);

  const target = FACE_SLOTS.includes(slot) ? faceTarget : ({ kind: 'character' } as const);
  const locked = target.kind === 'preset';

  // edits go to the character or to the selected expression
  let isSelected: (partId: string | undefined) => boolean;
  let pick: (partId: string | undefined) => void;
  if (target.kind === 'character') {
    isSelected = (id) => characterPart === id;
    pick = (id) => setPart(slot, id);
  } else {
    const { expression } = target;
    if (slot === 'extras') {
      const extras = expression.extras ?? [];
      isSelected = (id) => (id === undefined ? extras.length === 0 : extras.includes(id));
      // extras stack, so each click toggles
      pick = (id) =>
        updateExpression(expression.id, {
          extras:
            id === undefined
              ? []
              : extras.includes(id)
                ? extras.filter((e) => e !== id)
                : [...extras, id],
        });
    } else {
      const faceSlot = slot as 'eyes' | 'brows' | 'mouth';
      isSelected = (id) => expression[faceSlot] === id;
      pick = (id) => {
        if (id) updateExpression(expression.id, { [faceSlot]: id });
      };
    }
  }

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

      {FACE_SLOTS.includes(slot) && (
        <p className={locked ? styles.noteLocked : styles.note}>
          {target.kind === 'character' && 'Editing the default face (neutral)'}
          {target.kind === 'custom' && <>Editing “{target.expression.id}”</>}
          {target.kind === 'preset' && (
            <>“{target.expression.id}” is a preset. Duplicate it below to make your own.</>
          )}
        </p>
      )}

      <div className={styles.grid} role="tabpanel" aria-label={SLOT_LABELS[slot]}>
        {OPTIONAL_SLOTS.includes(slot) && (
          <button
            type="button"
            className={styles.item}
            aria-pressed={isSelected(undefined)}
            disabled={locked}
            onClick={() => pick(undefined)}
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
            aria-pressed={isSelected(part.id)}
            disabled={locked}
            onClick={() => pick(part.id)}
          >
            <PartThumbnail part={part} colors={colors} />
            <span>{part.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
