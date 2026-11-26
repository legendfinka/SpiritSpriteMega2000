import { useEffect, useState } from 'react';

export type Theme = 'day' | 'night';

/** same key as the inline script in index.html */
export const THEME_KEY = 'spirit-sprite-theme';

const systemTheme = (): Theme =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'night' : 'day';

function savedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'day' || saved === 'night' ? saved : null;
  } catch {
    // storage can be blocked, e.g. in some private modes
    return null;
  }
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

/** day/night: the saved choice wins, otherwise it follows the system */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => savedTheme() ?? systemTheme());

  useEffect(() => apply(theme), [theme]);

  // follow the system until the user picks one
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;
    const onChange = () => {
      if (!savedTheme()) setTheme(systemTheme());
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'night' ? 'day' : 'night';
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // still switches, just won't be remembered
    }
    setTheme(next);
  };

  return [theme, toggle];
}
