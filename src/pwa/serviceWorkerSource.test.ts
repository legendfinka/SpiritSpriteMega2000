import { describe, expect, it } from 'vitest';
import { PUBLIC_FILES, serviceWorkerSource } from './serviceWorkerSource';

describe('service worker', () => {
  it('precaches every file in public/', () => {
    // only the paths are used, nothing gets imported
    const found = Object.keys(import.meta.glob('../../public/**/*.{svg,webmanifest}')).map((path) =>
      path.replace('../../public/', ''),
    );
    expect([...PUBLIC_FILES].sort()).toEqual(found.sort());
  });

  it('is valid JavaScript that lists the given files', () => {
    const source = serviceWorkerSource(['assets/app-abc.js'], '1');
    expect(source).toContain('"./","./assets/app-abc.js"');
    expect(source).toContain('"spirit-sprite-1"');
    // without this, crossorigin scripts miss the cache and offline is a blank page
    expect(source).toContain('ignoreVary: true');
    // throws on a syntax error, without running it
    expect(() => new Function(source)).not.toThrow();
  });
});
