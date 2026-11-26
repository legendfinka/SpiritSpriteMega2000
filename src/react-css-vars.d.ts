import 'react';

declare module 'react' {
  interface CSSProperties {
    // lets style take CSS vars like '--hair'
    [key: `--${string}`]: string | number | undefined;
  }
}
