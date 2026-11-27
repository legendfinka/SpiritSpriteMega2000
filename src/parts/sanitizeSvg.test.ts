import { describe, expect, it } from 'vitest';
import { sanitizeFragment, sanitizeSvgFile, SvgPartError } from './sanitizeSvg';

const file = (inner: string, root = 'viewBox="0 0 800 1080"') =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${root}>${inner}</svg>`;

describe('sanitizeSvgFile', () => {
  it('keeps plain shapes and turns colour tokens into bare var()', () => {
    const { svg, removed } = sanitizeSvgFile(
      file('<g transform="translate(10 0)"><path d="M0 0L10 10Z" fill="var(--hair, #6b4428)" stroke="#000" stroke-width="5"/></g>'),
    );
    expect(svg).toBe(
      '<g transform="translate(10 0)"><path d="M0 0L10 10Z" fill="var(--hair)" stroke="#000" stroke-width="5"/></g>',
    );
    expect(removed).toBe(0);
  });

  it('reads colours from style="" and rgb()', () => {
    const { svg } = sanitizeSvgFile(file('<rect width="5" height="5" style="fill:rgb(255,0,16);stroke:none"/>'));
    expect(svg).toBe('<rect width="5" height="5" fill="#ff0010" stroke="none"/>');
  });

  it('accepts width/height instead of a viewBox, and a missing xmlns', () => {
    expect(sanitizeSvgFile('<svg width="800" height="1080"><circle r="4"/></svg>').svg).toBe(
      '<circle r="4"/>',
    );
  });

  it('keeps root fill="none" (Figma) by wrapping in a group', () => {
    const { svg } = sanitizeSvgFile(file('<path d="M0 0"/>', 'viewBox="0 0 800 1080" fill="none"'));
    expect(svg).toBe('<g fill="none"><path d="M0 0"/></g>');
  });

  it.each([
    ['script', '<script>alert(1)</script><path d="M0 0"/>'],
    ['event handler', '<path d="M0 0" onclick="alert(1)" onload="alert(1)"/>'],
    ['foreignObject', '<foreignObject><div xmlns="http://www.w3.org/1999/xhtml">x</div></foreignObject><path d="M0 0"/>'],
    ['link', '<a href="javascript:alert(1)"><path d="M0 0"/></a><path d="M1 1"/>'],
    ['use', '<use href="#x"/><path d="M0 0"/>'],
    ['image', '<image href="https://example.com/x.png"/><path d="M0 0"/>'],
    ['url() fill', '<path d="M0 0" fill="url(https://example.com/#x)"/>'],
    ['style with url', '<path d="M0 0" style="fill:url(#g);behavior:url(x.htc)"/>'],
    ['style element', '<style>path{fill:url(javascript:alert(1))}</style><path d="M0 0"/>'],
    ['bad path data', '<path d="M0 0&quot; onload=&quot;alert(1)"/>'],
    ['bad transform', '<path d="M0 0" transform="url(#x)"/>'],
  ])('strips %s', (_name, inner) => {
    const { svg, removed } = sanitizeSvgFile(file(inner));
    expect(removed).toBeGreaterThan(0);
    expect(svg).not.toMatch(/script|on\w+=|href|url\(|foreignObject|<use|<image|<style|alert/i);
    // whatever is left only uses allowed tags
    for (const [, tag] of svg.matchAll(/<(\w+)/g)) {
      expect(['g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon']).toContain(tag);
    }
  });

  it('escapes nothing dangerous through attribute values', () => {
    const { svg } = sanitizeSvgFile(file('<rect width="5" height="5" fill="#fff&quot;/&gt;&lt;script&gt;"/>'));
    expect(svg).toBe('<rect width="5" height="5"/>');
  });

  it.each([
    ['not SVG', '<html><body>hi</body></html>', /doesn't look like an SVG/],
    ['broken XML', '<svg xmlns="http://www.w3.org/2000/svg"><path</svg>', /doesn't look like an SVG/],
    ['wrong size', file('<path d="M0 0"/>', 'viewBox="0 0 100 100"'), /800×1080 canvas \(this one is 100×100\)/],
    ['offset viewBox', file('<path d="M0 0"/>', 'viewBox="10 0 800 1080"'), /800×1080/],
    ['unknown token', file('<path d="M0 0" fill="var(--glow)"/>'), /Unknown colour token --glow/],
    ['nothing drawable', file('<text>hi</text>'), /Nothing drawable/],
  ])('refuses %s', (_name, text, message) => {
    expect(() => sanitizeSvgFile(text)).toThrow(SvgPartError);
    expect(() => sanitizeSvgFile(text)).toThrow(message);
  });

  it('refuses huge files', () => {
    expect(() => sanitizeSvgFile(file('<path d="M0 0"/>'.repeat(30_000)))).toThrow(/too big/);
  });
});

describe('sanitizeFragment', () => {
  it('is stable: cleaning a cleaned part changes nothing', () => {
    const once = sanitizeSvgFile(
      file('<g fill="var(--outfit-main)"><ellipse cx="1" cy="2" rx="3" ry="4" opacity="50%"/></g>'),
    ).svg;
    expect(sanitizeFragment(once)).toBe(once);
  });

  it('cleans a stored part that was tampered with', () => {
    expect(sanitizeFragment('<path d="M0 0" onmouseover="alert(1)"/>')).toBe('<path d="M0 0"/>');
  });
});
