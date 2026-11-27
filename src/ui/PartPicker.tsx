import { useState } from 'react';
import { LAYER_ORDER } from '../canvas/layerOrder';
import { expressionLabel, partLabel, t } from '../i18n';
import { partsFor } from '../parts/customParts';
import { partsForSlot } from '../parts/registry';
import { useCharacterStore } from '../store/useCharacterStore';
import type { Expression, Part, Slot } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import styles from './PartPicker.module.css';
import { PartThumbnail } from './PartThumbnail';
import { UploadPart } from './UploadPart';
import { FACE_SLOTS, OPTIONAL_SLOTS } from './slots';

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
  const customParts = useCharacterStore((s) => s.character.customParts);
  const setPart = useCharacterStore((s) => s.setPart);
  const updateExpression = useCharacterStore((s) => s.updateExpression);
  const removeCustomPart = useCharacterStore((s) => s.removeCustomPart);
  const [deleting, setDeleting] = useState<Part | null>(null);
  const slotUploads = (customParts ?? []).filter((p) => p.slot === slot);

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
    <section className={styles.picker} aria-label={t('picker.label')}>
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
            {t(`slot.${tab}`)}
          </button>
        ))}
      </div>

      {FACE_SLOTS.includes(slot) && (
        <p className={locked ? styles.noteLocked : styles.note}>
          {target.kind === 'character' && t('picker.editingNeutral')}
          {target.kind === 'custom' && t('picker.editing', { id: target.expression.id })}
          {target.kind === 'preset' &&
            t('picker.locked', { id: expressionLabel(target.expression.id) })}
        </p>
      )}

      <div className={styles.grid} role="tabpanel" aria-label={t(`slot.${slot}`)}>
        {OPTIONAL_SLOTS.includes(slot) && (
          <button
            type="button"
            className={styles.item}
            aria-pressed={isSelected(undefined)}
            disabled={locked}
            onClick={() => pick(undefined)}
          >
            {t('picker.none')}
          </button>
        )}
        {partsFor({ customParts }, slot).map((part) => (
          <button
            key={part.id}
            type="button"
            className={styles.item}
            aria-label={partLabel(part)}
            aria-pressed={isSelected(part.id)}
            disabled={locked}
            onClick={() => pick(part.id)}
          >
            <PartThumbnail part={part} colors={colors} />
            <span>{partLabel(part)}</span>
          </button>
        ))}
        <UploadPart
          slot={slot}
          disabled={locked}
          onAdded={(id) => pick(id)}
        />
      </div>
      {slotUploads.length > 0 && (
        <div className={styles.uploads}>
          <span>{t('picker.uploads')}</span>
          {slotUploads.map((part) => (
            <button
              key={part.id}
              type="button"
              className={styles.removeUpload}
              aria-label={t('picker.deleteUpload', { label: part.label })}
              onClick={() => setDeleting(part)}
            >
              {part.label} ✕
            </button>
          ))}
        </div>
      )}
      {deleting && (
        <ConfirmDialog
          title={t('picker.deleteTitle')}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.keep')}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            removeCustomPart(deleting.id);
            setDeleting(null);
          }}
        >
          <p>{t('picker.deleteText', { label: deleting.label })}</p>
          <small>{t('picker.deleteHint')}</small>
        </ConfirmDialog>
      )}
    </section>
  );
}
