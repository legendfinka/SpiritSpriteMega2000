interface LockButtonProps {
  locked: boolean;
  onToggle: () => void;
}

/** padlock next to the name: locked = Random keeps the name */
export function LockButton({ locked, onToggle }: LockButtonProps) {
  return (
    <button
      type="button"
      aria-label="Keep name on Random"
      aria-pressed={locked}
      title={locked ? 'Name stays when you press Random' : 'Random picks a new name too'}
      onClick={onToggle}
    >
      <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true">
        {/* the shackle lifts and swings open when unlocked */}
        <path
          d={locked ? 'M3.5 7 V4.5 a3.5 3.5 0 0 1 7 0 V7' : 'M3.5 7 V4.5 a3.5 3.5 0 0 1 7 0 V5'}
          transform={locked ? undefined : 'translate(0 -1.5)'}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="1" y="7" width="12" height="8.5" rx="1.5" fill="currentColor" />
      </svg>
    </button>
  );
}
