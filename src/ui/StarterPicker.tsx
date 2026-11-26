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
      aria-label="Start from"
      value=""
      onChange={(e) => {
        const starter = STARTERS.find((s) => s.id === e.target.value);
        if (!starter) return;
        loadCharacter(starter.create());
        onPicked?.();
      }}
    >
      <option value="" disabled>
        Start from…
      </option>
      {STARTERS.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
