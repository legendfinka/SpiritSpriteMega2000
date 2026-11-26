# CLAUDE.md — SpiritSpriteMega2000

Browser app (`spirit-sprite-mega-2000`) for building visual-novel sprites from layered
SVG parts and exporting an expression set as transparent PNGs for Ren'Py.
No backend; deploys as a static site.

## 1. Goal
Users with no drawing skills can pick and recolour parts, preview all expressions
(also on a background), export a `.zip`, and save/load the character as JSON.

Not in v1: free-hand drawing, in-app AI, animation, accounts.

## 2. Stack
Vite, React + TypeScript (strict), Zustand (one store, persisted to localStorage),
inline SVG rendering, SVG → `Image` → `<canvas>` → `toBlob()`, JSZip, CSS modules,
Vitest + React Testing Library, ESLint + Prettier.

## 3. Commands
`npm install`, `npm run dev`, `npm run build`, `npm run test`, `npm run lint`

## 4. Structure (`src/`)
- `canvas/`: rendering, colours; `layerOrder.ts` is the only definition of draw order
- `parts/`: `registry.ts` + folders `body outfit hair-back face hair-front eyes brows mouth extras accessories`
- `expressions/presets.ts`, `store/`, `types.ts` (source of truth for data types)
- `ui/`: PartPicker, ColorPanel, Stage (sprite/scene preview), ExpressionStrip,
  ExportDialog, `useShortcuts`
- `export/`: svgToPng, exportZip, renpySnippet, characterJson
- Outside `src/`: `public/backgrounds/*.svg` (1920×1080), `public/templates/alignment-guide.svg`,
  `.github/workflows/ci.yml` (lint, test, build). Hosted on Vercel; Vite `base: './'`

## 5. Core concepts
- **Canvas:** all parts share an 800×1080 viewBox, head centre ≈ (400, 200).
  Sprites are bottom-aligned. `Part.offset` is for fine-tuning only.
- **Part files:** standalone SVGs with fallback colours for editor previews:
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1080">`,
  `fill="var(--hair, #6b4428)"`. The registry strips the wrapper and fallbacks.
- **Tokens:** `--skin --skin-shade --hair --hair-shade --hair-hi --iris --outfit-main
  --outfit-shade --outfit-accent --pants --pants-shade --outline`. Shades/highlights
  derive from the base (HSL −15 % / +12 % lightness) unless overridden.
- **Layer order (back → front):** hairBack → body → outfit → face → eyes → brows →
  hairFront → mouth → extras → accessory
- **Expressions:** override only eyes, brows, mouth, extras. 5 fixed presets
  (neutral = the character's own face parts) plus `Character.customExpressions`.
  Ids are Ren'Py attributes: `[a-z][a-z0-9_]*`. Face tabs edit the selected custom
  expression (extras combine) or, on neutral, the character.
- **Saved data:** always load through `store/parseCharacter.ts`, which fills fields
  added later. Keep new `Character` fields backward compatible.
- **History:** every character edit goes through the store's `commit`, so it can be
  undone. Quick repeats with the same merge key (colour drags, typing) are one step.

## 6. Export
- One standalone SVG per expression with hex colours inlined (no CSS variables).
- Files: `"<name> <expression>.png"`, lowercase, in `<name>_sprites.zip`.
- Zip also holds `character.json` and `README.txt` with a Ren'Py snippet
  (`define` + `show <name> neutral`).
- Options: scale 0.5×/1×/2×, PNG/WebP, include JSON.
- Export code is pure (Character + Expression[] → Blob) and testable.

## 7. UI layout
- Top: name, undo/redo, reset, load/save JSON, Export
- Middle: part picker (tab per slot, thumbnails) | stage (sprite or scene on a
  background, left/center/right) | colour pickers
- Bottom: expression strip (windows + "new") and the selected expression's name plate
- Keys: `Mod+Z` / `Mod+Shift+Z` / `Mod+Y`, `Mod+S` save JSON, `Mod+E` export,
  `1`–`9` and `←`/`→` pick expressions (ignored while typing or in a dialog)

## 8. Milestones
- [x] **M1 Skeleton:** setup, layered rendering, base parts (drawn from scratch;
  `gen_guy.py` was unavailable)
- [x] **M2 Editing:** store, part picker, colour panel
- [x] **M3 Expressions:** preset strip, custom expressions
- [x] **M4 Export:** export dialog, zip + README, single image, JSON save/load.
  Rasterising is injected (`Rasterize`) so `buildSpriteZip` is tested without canvas.
- [ ] **M5 Polish** (written, needs passing test/lint/build and an eye on the art):
  undo/redo, shortcuts, scene preview with 3 backgrounds, CI workflow + Vercel hosting,
  hairBack moved behind the body, female base + soft face, 6 front / 5 back hairstyles,
  6 outfits, extra eyes/mouths/brows/extras, 4 accessories, starter characters.

## 9. Conventions
- No `any` without a comment. One function component per file.
- Part files: kebab-case, tokenised colours only (hex only as fallback or pure
  black/white), aligned to the guide.
- Import part files only in `parts/registry.ts`.
- UI style: rough, cozy 90s Soviet panel block. Panels use `composes: rough-slab from global`
  (fill via `--slab-bg`), colours from `index.css` variables.
- Art style: 4–5 px `--outline` strokes on main shapes, flat fills, one shade,
  at most one highlight.
- Commits: Conventional Commits (`feat:`, `fix(web):` …), short subject.
  **Never add `Co-Authored-By` or any AI attribution** (commits or PRs).

## 10. Testing priorities
1. Layer order for every slot combination
2. No `var(` in exported SVG
3. Exact export file names
4. JSON save/load round-trip
5. Deterministic derived shades

## 11. Rules
- Ask before changing the 800×1080 template or layer order.
- Small, reviewable changes that follow the milestones.
