# CLAUDE.md — SpiritSpriteMega2000

Browser app (`spirit-sprite-mega-2000`) for building visual-novel sprites from layered
SVG parts and exporting an expression set as transparent PNGs for Ren'Py.
No backend; deploys as a static site.

## 1. Goal
Users with no drawing skills can pick and recolour parts, preview all expressions
(also on a background), export a `.zip`, and save/load the character as JSON.

Not in v1: free-hand drawing, in-app AI, animation (beyond Ren'Py blink & talk), accounts.

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
- **Layer order (back → front):** hairBack → body → bottom → top → outfit → face → eyes →
  brows → hairFront → mouth → extras → accessory
- **Clothes:** `top` + `bottom` mix freely; `outfit` is a one-piece (dress, overalls) and
  the store keeps it exclusive with top/bottom. Bottoms start at the waist (y 740) and
  use `--pants`; tops reach at least y 760 so they cover it. Old two-piece outfit ids
  are converted on load (`parts/outfitSplits.ts`).
- **Expressions:** override eyes, brows, mouth; their extras are drawn on top of the
  character's own extras (freckles stay on every expression). 5 fixed presets
  (neutral = the character's own face parts) plus `Character.customExpressions`.
  Ids are Ren'Py attributes: `[a-z][a-z0-9_]*`. Face tabs edit the selected custom
  expression (extras combine) or, on neutral, the character.
- **Saved data:** always load through `store/parseCharacter.ts`, which fills fields
  added later. Keep new `Character` fields backward compatible.
- **History:** every character edit goes through the store's `commit`, so it can be
  undone. Quick repeats with the same merge key (colour drags, typing) are one step.
  Snapshots hold the whole cast, so adding/removing characters undoes too.
- **Cast (`store/cast.ts`):** `character` is the selected one and the source of truth;
  `cast` holds everyone (the selected entry may be stale, use `castWithActive`).
  Persisted as `{cast, activeId}` (store version 2); `restoreCast` also reads old
  single-character saves. Loaded files and share links join the cast.
- **Uploads (`parts/sanitizeSvg.ts`):** untrusted, rendered via innerHTML. Rebuilt from
  an allowlist (plain shapes, known attributes, checked values, no url/style/href),
  must be 800×1080, tokens must exist. Stored in `Character.customParts` and
  re-sanitised in `parseCharacter`. Look parts up with `findPart(character, id)`.

- **Analytics:** countmetrics tag at the end of `index.html`. It sends only the path (no
  query or hash), sets no cookies and respects Do Not Track. As a safeguard it stays after
  the app script, where `ui/sharedLink.ts` removes `#c=` from the URL.

- **Languages (`i18n/`):** every UI string goes through `t()`; `en.ts` is the source and
  `uk.ts`/`ru.ts` must match its keys. New parts and swatches need names in
  `partNames.ts` (tests check). Expression ids and exported files stay English; presets
  are shown translated via `expressionLabel`. Flags are inline SVG (`LanguagePicker`).
- **Fonts:** bundled with fontsource (Russo One, PT Sans, IBM Plex Mono) for Cyrillic.
- **Offline:** `pwa/serviceWorkerSource.ts` + the plugin in `vite.config.ts` write
  `dist/sw.js` (production only). New files in `public/` go into `PUBLIC_FILES`.

## 6. Export
- One standalone SVG per expression with hex colours inlined (no CSS variables).
- Files: `"<name> <expression>.png"`, lowercase, in `<name>_sprites.zip`.
- Zip also holds `character.json` and `README.txt` with a Ren'Py snippet
  (`define` + `show <name> neutral`).
- Options: scale 0.5×/1×/2×, PNG/WebP, include JSON, side images, Sprites or Layered.
- Side images: `"side <name> <expr>.png"` + plain `"side <name>.png"`, crop `SIDE_CROP`;
  the define gets `image="<name>"`.
- Layered (`export/layered.ts`): fixed slots merged where they touch (`<name>_base`,
  `_hair`, `_marks`, `_accessory`), face parts as `images/<name>_<slot>_<part>.png`,
  and `<name>_layered.rpy`. Expression ids are attributes, repeated across groups.
  Blink & talk use ATL images plus `if_any`/`if_not ["talking"]` (not `when`, which
  needs Ren'Py 8.4) and `config.speaking_attribute`. Side image = `LayeredImageProxy`.
- Export code is pure (Character + Expression[] → Blob) and testable. `exportPlan`
  is the single list of files; names shown in the dialog come from it.

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
- [x] **M5 Polish:** undo/redo, shortcuts, scene preview with 3 backgrounds, CI workflow + Vercel hosting,
  hairBack moved behind the body, female base + soft face, 6 front / 5 back hairstyles,
  6 outfits, extra eyes/mouths/brows/extras, 4 accessories, starter characters.
- [x] **M6 Content & mobile:** stacked layout under 900px with a sticky preview,
  own popups (`ui/ConfirmDialog`) instead of `confirm`/`alert`, 4 faces, 10/9 hairstyles,
  12 outfits, 11 eyes, 12 mouths, 8 brows, 9 extras, 8 accessories, 5 backgrounds,
  8 starters, demo GIF in `docs/demo.gif`.
- [x] **M7 Quick wins:** randomise button
  (`store/randomCharacter`), colour swatches (`canvas/palettes`), share link
  (`export/shareLink`, `#c=` hash, asks before replacing your character).
  Imported data is untrusted: `parseCharacter` checks expression ids and flattens names.
- [x] **M8 Ren'Py extras:** side images, layered export, blink & talk (lifts "no
  animation" from v1 scope).
  Also in M8:
  - Phones: no SVG filter or blend mode (lag), readable text on yellow, day/night switch.
  - Underwear on both base bodies (briefs + bandeau on female), coloured with the outfit.
  - Random names (`store/randomNames.ts`) behind a name lock, locked by default.
  - Base font 15px (all sizes are rem, nothing below 0.72rem); stronger alignment guide.
- [x] **M9 Bigger:** cast library (several characters, 2–3 together in scene view),
  custom part upload, tops/bottoms split (11 tops, 8 bottoms, 6 one-pieces), offline
  PWA, Ukrainian/Russian UI with Cyrillic fonts and a flag picker.

## 9. Conventions
- No `any` without a comment. One function component per file.
- Part files: kebab-case, tokenised colours only (hex only as fallback or pure
  black/white), aligned to the guide.
- Import part files only in `parts/registry.ts`.
- UI style: rough, cozy 90s Soviet panel block. Panels use `composes: rough-slab from global`
  (fill via `--slab-bg`), colours from `index.css` variables.
- Day/night: `html[data-theme]`, set before paint by the inline script in `index.html`,
  toggled by `ui/theme.ts`. Text on yellow (`--mustard`, `--lit`) is always `--line`.
- Phones: no SVG `filter` on panels or blend modes over the page; they make it lag.
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
