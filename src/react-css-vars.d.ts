import 'react';

declare module 'react' {
  interface CSSProperties {
    /** CSS custom properties, e.g. { '--hair': '#6b4428' }. */
    [key: `--${string}`]: string | number | undefined;
  }
}
