import { type MessageKey, t } from '../i18n';
import { STARTERS } from '../store/starters';
import { useCharacterStore } from '../store/useCharacterStore';

interface StarterPickerProps {
  onPicked?: () => void;
}

/** swap in a ready-made character (undoable) */
export function StarterPicker({ onPicked }: StarterPickerProps) {
  const loadCharacter = useCharacterStore((s) => s.loadCharacter);

  return (
    <select
      aria-label={t('starter.label')}
      value=""
      onChange={(e) => {
        const starter = STARTERS.find((s) => s.id === e.target.value);
        if (!starter) return;
        // keep this character's uploads, they'd be lost otherwise
        const { customParts } = useCharacterStore.getState().character;
        loadCharacter({ ...starter.create(), customParts });
        onPicked?.();
      }}
    >
      <option value="" disabled>
        {t('starter.placeholder')}
      </option>
      {STARTERS.map((s) => (
        <option key={s.id} value={s.id}>
          {/* a test keeps a message for every starter */}
          {t(`starter.${s.id}` as MessageKey)}
        </option>
      ))}
    </select>
  );
}
