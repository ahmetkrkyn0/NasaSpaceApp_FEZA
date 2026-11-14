# design-export

Machine-readable companion to `DESIGN.md`: the exact values of the LunaPath frontend (tokens, fonts,
motion, colour ramps, icons, feature registry, visible strings, assets, API contract), extracted from
source by script. Nothing in this folder is typed by hand except this README.

- **Source:** branch `berke/backend-review` at commit `5aec750`. Scope: `frontend/` only.
- **Provenance:** every record carries a repo-relative `file` and a 1-based `line` (forward slashes).
- **Regenerate:** `node design-export/extract/run-all.mjs` from the repository root. It needs Node and
  the TypeScript compiler already installed in `frontend/node_modules`, and nothing else: no network,
  no `npm install`.
- **Drift guard:** the runner aborts when `HEAD` is not `5aec750` or tracked files under `frontend/` are
  modified. `DESIGN_EXPORT_ALLOW_DRIFT=1` downgrades that to a warning; the outputs then no longer
  describe `5aec750`, so update the pinned SHA in `extract/lib.mjs` deliberately if that is the intent.
- **Deterministic:** no timestamps, stable ordering. Two runs on the same tree give byte-identical files.

## Warning: committing this folder

The root `.gitignore` rules `*.mp4` (line 29) and `*.glb` (line 82) also match files under
`design-export/assets/`. Committing with a plain `git add` silently drops:

- `design-export/assets/videos/moon-backdrop-1080.mp4` (`.gitignore:29`)
- `design-export/assets/models/viper-rover.glb` (`.gitignore:82`)
- `design-export/assets/models/viper-rover-textured.glb` (`.gitignore:82`)

These three are about 23.9 MB of the 31.4 MB in `assets/`. Committing them needs `git add -f`, Git LFS,
or a package kept outside the repository. Check with:

```bash
find design-export -type f | git check-ignore --no-index -v --stdin
```

## Files

| Path | What it is |
|---|---|
| `tokens.css` | Every top-level `:root` block of `frontend/src/**/*.css`, verbatim (with the comment directly above it), then the custom properties declared on other selectors as marked excerpts. |
| `tokens.json` | Every custom-property declaration: name, value, selector, enclosing at-rules, scope (`root` / `scoped`), `isAlias`, `aliasOf`, `resolved` (followed through `:root` only), `usageCount`. Also custom properties set inline from TSX, a per-name usage table, and declared-but-unused names. |
| `fonts.css` | The six `@font-face` blocks verbatim with their comment line. Only change: `url('/fonts/x.woff2')` becomes `url('assets/fonts/x.woff2')`. |
| `fonts.json` | The same faces, structured: family, style, weight range, display, unicode-range, original and rewritten `src`. |
| `motion.css` | Every `@keyframes` block verbatim (unreferenced ones marked `/* UNUSED */`), then every `@media (prefers-reduced-motion: reduce)` block verbatim. |
| `motion.json` | Keyframes with their users (`usedBy`: selector, file:line, declaration, and whether the selector's classes are referenced from TS/TSX), every `transition*` and `animation*` declaration, inline TSX animation/transition styles. |
| `css-inventory.json` | Media queries with the selectors inside, width breakpoints, the z-index ladder sorted by value, every colour literal (hex, rgb/rgba, hsl, color-mix) with counts and sites, named colours, font sizes, radii, box and text shadows, typography counts, and every class selector with its reference status (`unreferenced`, `dynamicMaybe`). Includes the inline `<style>` of `frontend/index.html`. |
| `colormaps.json` | Colour ramps (`stops` parsed, `stopsText` as written), single colours, and lookup tables (`riskToHex`, `riskToDash`, `batteryToHex` thresholds, `RAMP_STOPS`, the 3-D `RAMP`) from `colormap.ts`, `features/safe-haven/overlays.ts`, `features/time-axis/overlays.ts` and `TerrainCanvas3D.tsx`. Also every hex literal in TS/TSX (strings and six-digit `0x` numbers) with its nearest named binding, and `rgb()/rgba()` strings. |
| `icons/<name>.svg` | One SVG per glyph of `components/Fleet/SpecIcons.tsx` (Material Symbols Outlined path data, `viewBox="0 -960 960 960"`, `fill="currentColor"`). |
| `icons.json` | Icon name, path data, file:line, `duplicateOf` for byte-identical paths, and a check of the `IconName` union against the `PATHS` keys. |
| `registry.json` | `features/registry.ts` parsed: every `FEATURES` entry in order (`modes` null when absent, `[]` when empty; `group`/`tab` null when absent), the comment above each entry verbatim, `RAIL_TABS`, the slot/group/tab/mode unions, and the derived placement per mode. `modesText`, `groupText` and `tabText` are the canonical spellings coverage check 4 looks for. |
| `strings.json` | User-visible text from the TS/TSX AST with kind (`jsxText`, `attr:<name>`, `literal`, `template`, `uncertain`), language (`en` / `tr` / `mixed`), file:line, component, and source (`jsx`, `listed`, `heuristic`, `imperative`). The extraction rules are stored in the file itself under `rules`. |
| `strings-coverage-set.json` | The subset acceptance criterion 6 measures: JSX text, visible attributes, JSX-child and imperative strings, and literals/templates from the listed display files. |
| `assets-manifest.json` | Every file under `frontend/public` except `cesium/` (one aggregate entry): bytes, sha256, tracked, matching `.gitignore` rule, `used` and `usedAt`, byte-identical duplicates, copy status. |
| `assets/` | Copies of every used asset at the same relative path as under `frontend/public/`, re-hashed after copying, plus three provenance documents (`fonts/README.md`, `videos/README.md`, `textures/NAC_SITE11_PROVENANCE.md`) flagged `copiedAs: "provenance"`. |
| `api-contract/endpoints.json` | Every backend endpoint the frontend calls: method, path, query parameters, binary flag, response type and where it is declared, call sites, wrapper functions and their consumers. Also variable-URL fetches, stray `/api` literals, and the `X-*` response header names read. |
| `api-contract/types/` | Verbatim copies: `net-types.ts` (from `frontend/src/net/types.ts`), `assistant.ts` and `client.ts` (from `frontend/src/api/`). |
| `api-contract/fixtures/` | Verbatim copies of `frontend/src/net/__fixtures__/` (28 recorded responses and their README). |
| `api-contract/vite-proxy.txt` | The `server` and `preview` blocks of `frontend/vite.config.ts`, verbatim (`/api` proxied to `http://127.0.0.1:8000`). |
| `extract/` | The extraction scripts (Node ESM, read-only towards the repository). |

`screens/` and `DESIGN.md` itself come from later steps and are not produced by these scripts.

## Verbatim markers

`tokens.css`, `fonts.css`, `motion.css` and `api-contract/vite-proxy.txt` put a marker before each
copied block:

- `@src <file>:<from>-<to>`: the next `to - from + 1` lines are a byte-exact copy of those source lines
  (in `motion.css` a `/* UNUSED */` line may sit between marker and block; in `fonts.css` the url
  rewrite is the only difference).
- `@scoped <file> lines=<a,b,...>`: an excerpt; each listed source line appears verbatim, in order.

## Scripts

| Script | Output |
|---|---|
| `extract/lib.mjs` | Shared helpers: source pin, file walk (dot-directories skipped), CSS parser, TypeScript AST helpers, class-reference index. |
| `extract/tokens.mjs` | `tokens.css`, `tokens.json` |
| `extract/fonts.mjs` | `fonts.css`, `fonts.json` |
| `extract/motion.mjs` | `motion.css`, `motion.json` |
| `extract/css-inventory.mjs` | `css-inventory.json` |
| `extract/colormaps.mjs` | `colormaps.json` |
| `extract/icons.mjs` | `icons/*.svg`, `icons.json` |
| `extract/registry.mjs` | `registry.json` |
| `extract/strings.mjs` | `strings.json`, `strings-coverage-set.json` |
| `extract/assets.mjs` | `assets-manifest.json`, `assets/` |
| `extract/api.mjs` | `api-contract/` |
| `extract/run-all.mjs` | Runs all of the above in order and prints a summary of counts. |
| `extract/coverage.mjs` | Acceptance checks against a DESIGN.md (does not write anything). |

Each extractor also runs on its own, for example `node design-export/extract/icons.mjs`.

## Coverage checks

```bash
node design-export/extract/coverage.mjs DESIGN.md
# or, extraction followed by the checks:
node design-export/extract/run-all.mjs --coverage DESIGN.md
```

It prints a pass/fail table and exits 1 when any check fails:

| # | Check |
|---|---|
| 1 | Every top-level `:root` token: name and value on one DESIGN.md line, or in `tokens.css` when DESIGN.md references `tokens.css`. |
| 2 | Every `@keyframes` name appears in DESIGN.md. |
| 3 | Every ramp and table name appears in DESIGN.md; every stop row and single colour appears in DESIGN.md, or DESIGN.md references `colormaps.json`. |
| 4 | Every registry entry: one Markdown table row whose cells (backticks stripped, trimmed) are exactly its id, slot, `modesText`, `groupText` and `tabText`, in any column order. Write absent modes as `(all)`, empty modes as `(none)`, absent group as `primary`, absent tab as `(none)`. |
| 5 | Every icon name appears in DESIGN.md. |
| 6 | At least 98% of the unique texts in `strings-coverage-set.json` appear verbatim in DESIGN.md; the rest are listed. Whitespace runs (NBSP and thin spaces included) count as one space and the text is trimmed before matching. Template texts must keep the `{…}` placeholder (U+2026) exactly. |
| 11 | Every used asset is copied with a matching sha256; nothing unused is copied apart from the three provenance documents. |
| 12 | Every marked block in `tokens.css`, `fonts.css`, `motion.css` and `vite-proxy.txt` byte-matches its source span, and the `api-contract` copies match their sources. |

## Known limits

- Several response types the endpoints return are declared outside the three copied type files (for
  example in `frontend/src/net/analysis.ts`, `frontend/src/api.ts`, `frontend/src/net/stressTest.ts`).
  `endpoints.json` gives each type's declaration site under `responseTypeDeclaredAt`.
- No `X-Series-*` header is read anywhere in `frontend/src`; the name appears only in a comment in
  `frontend/src/net/client.ts`. The `X-Layer-*` names that are read are listed in `endpoints.json`.
- `strings.json` is AST-based with stated heuristics. Text built at run time from backend data (assistant
  answers, backend error details) is not in it.
- Class reference status is a token search over TS/TSX strings: a class that only appears in a comment
  counts as unreferenced, and `dynamicMaybe` lists the template fragment that might build the name.
