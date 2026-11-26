# SpiritSprite Mega 2000

Make visual novel sprites without drawing. Mix hair, clothes and faces, recolour, then export every expression as PNGs that drop straight into Ren'Py.

All in the browser, nothing to sign up for.

```bash
npm install
npm run dev
```

## In Ren'Py

Unzip the export into `game/images/`, then:

```renpy
define mira = Character("Mira")

label start:
    show mira happy
    mira "Hi!"
```

The zip comes with a `README.txt` that has this filled in for your character.

## How it works

- **Every part is an SVG** on the same 800×1080 canvas, so layers just stack, no offsets.
- **Colours are tokens** like `var(--hair)`. The preview fills them with CSS variables, and the export bakes in hex, since canvas ignores CSS.
- **Shades are derived** from the base colour, so one picker recolours a whole part.
- **No backend.** State lives in localStorage, and saves are plain JSON.

## Where things are

```
src/parts/        the SVG library, one folder per slot
src/canvas/       layer order, colours, rendering
src/expressions/  presets and naming rules
src/export/       PNG, zip, Ren'Py snippet
src/store/        character state + undo
src/ui/           everything you click
```

New parts go in `src/parts/<slot>/`. Turn on the guide in the preview to line them up. More detail in `CLAUDE.md`.

Hosted on Vercel; pushing to `main` deploys.
