import type { ReactNode } from 'react';
import { type Lang, LANGUAGES, setLang, t, useLang } from '../i18n';
import styles from './LanguagePicker.module.css';

// drawn here because Windows shows flag emoji as two letters
const FLAGS: Record<Lang, ReactNode> = {
  en: (
    <>
      <path fill="#012169" d="M0 0h30v20H0z" />
      <path stroke="#fff" strokeWidth="4" d="M0 0l30 20M30 0L0 20" />
      <path stroke="#c8102e" strokeWidth="1.6" d="M0 0l30 20M30 0L0 20" />
      <path stroke="#fff" strokeWidth="6.6" d="M15 0v20M0 10h30" />
      <path stroke="#c8102e" strokeWidth="4" d="M15 0v20M0 10h30" />
    </>
  ),
  uk: (
    <>
      <path fill="#0057b7" d="M0 0h30v10H0z" />
      <path fill="#ffd700" d="M0 10h30v10H0z" />
    </>
  ),
  ru: (
    <>
      <path fill="#fff" d="M0 0h30v7H0z" />
      <path fill="#0039a6" d="M0 6.67h30v6.66H0z" />
      <path fill="#d52b1e" d="M0 13.33h30V20H0z" />
    </>
  ),
};

export function LanguagePicker() {
  const current = useLang();

  return (
    <div className={styles.flags} role="group" aria-label={t('header.language')}>
      {LANGUAGES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={styles.flag}
          aria-label={label}
          title={label}
          lang={id}
          aria-pressed={id === current}
          onClick={() => setLang(id)}
        >
          <svg viewBox="0 0 30 20" aria-hidden="true">
            {FLAGS[id]}
          </svg>
        </button>
      ))}
    </div>
  );
}
