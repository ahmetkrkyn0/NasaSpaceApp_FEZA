# LunaPath frontend: DESIGN.md

Design and behaviour specification of the LunaPath Mission Workstation frontend, written so that the
interface can be rebuilt from scratch, in any technology, and look and behave like the reference build.

## Contents

- [0. About this document](#0-about-this-document)
  - [0.1 Scope](#01-scope)
  - [0.2 How this document was produced, and how exact it is](#02-how-this-document-was-produced-and-how-exact-it-is)
  - [0.3 Fidelity policy](#03-fidelity-policy)
  - [0.4 Reference environment](#04-reference-environment)
  - [0.5 Conventions](#05-conventions)
  - [0.6 Document map](#06-document-map)
- [1. Foundations](#1-foundations)
  - [1.1 Design principles](#11-design-principles)
  - [1.2 Colour and custom-property tokens](#12-colour-and-custom-property-tokens)
  - [1.3 Typography](#13-typography)
  - [1.4 Shape and elevation](#14-shape-and-elevation)
  - [1.5 Z-index ladder](#15-z-index-ladder)
  - [1.6 Breakpoints and media queries](#16-breakpoints-and-media-queries)
  - [1.7 Motion](#17-motion)
  - [1.8 Icons](#18-icons)
  - [1.9 Data colour ramps and fixed colours](#19-data-colour-ramps-and-fixed-colours)
  - [1.10 Feature registry: placement of every panel](#110-feature-registry-placement-of-every-panel)
  - [1.11 Assets](#111-assets)
- [2. Entry flow, fleet hangar and top bar](#2-entry-flow-fleet-hangar-and-top-bar)
  - [2.1 Pre-cockpit UI inventory (LunaPath frontend)](#21-pre-cockpit-ui-inventory-lunapath-frontend)
- [3. Cockpit shell and 2-D map](#3-cockpit-shell-and-2-d-map)
  - [3.1 Cockpit layout](#31-cockpit-layout)
  - [3.2 Plan mode vs Analyze mode](#32-plan-mode-vs-analyze-mode)
  - [3.3 Interactions](#33-interactions)
  - [3.4 MapCanvas drawing](#34-mapcanvas-drawing)
  - [3.5 View modes](#35-view-modes)
  - [3.6 RailTabs and SystemsDrawer](#36-railtabs-and-systemsdrawer)
  - [3.7 Instrument component (components/Instrument)](#37-instrument-component-componentsinstrument)
  - [3.8 Loading, empty and error states](#38-loading-empty-and-error-states)
  - [3.9 Design rationale (brief quotes)](#39-design-rationale-brief-quotes)
  - [3.10 Gray points (cannot be settled from code alone, or contradict each other)](#310-gray-points-cannot-be-settled-from-code-alone-or-contradict-each-other)
  - [3.11 Size estimate](#311-size-estimate)
- [4. 3-D terrain view](#4-3-d-terrain-view)
  - [4.1 Scene setup](#41-scene-setup)
  - [4.2 Lights](#42-lights)
  - [4.3 Terrain mesh](#43-terrain-mesh)
  - [4.4 Overlays in 3-D](#44-overlays-in-3-d)
  - [4.5 Rover, rocks and LiDAR](#45-rover-rocks-and-lidar)
  - [4.6 Sky](#46-sky)
  - [4.7 Interactions and DOM](#47-interactions-and-dom)
  - [4.8 Performance decisions](#48-performance-decisions)
  - [4.9 Cesium and unused assets](#49-cesium-and-unused-assets)
  - [4.10 Gray points](#410-gray-points)
  - [4.11 Rough size](#411-rough-size)
- [5. Feature panels, assistant and mission report](#5-feature-panels-assistant-and-mission-report)
  - [5.1 Where each panel mounts (from `selectFeatures` / `selectSystemsFeatures`, registry.ts:317-347)](#51-where-each-panel-mounts-from-selectfeatures--selectsystemsfeatures-registryts317-347)
  - [5.2 Per-feature inventory](#52-per-feature-inventory)
  - [5.3 Assistant (F/assistant/*, api/assistant.ts, intent/*)](#53-assistant-fassistant-apiassistantts-intent)
  - [5.4 Mission report (F/mission-report/*, i18n/reportCopy.ts)](#54-mission-report-fmission-report-i18nreportcopyts)
  - [5.5 Language of the UI](#55-language-of-the-ui)
  - [5.6 Design-rationale comments worth keeping](#56-design-rationale-comments-worth-keeping)
  - [5.7 Gray points (cannot be settled from the frontend code alone)](#57-gray-points-cannot-be-settled-from-the-frontend-code-alone)
  - [5.8 Rough size](#58-rough-size)
  - [5.99 Mission report copy (English and Turkish)](#599-mission-report-copy-english-and-turkish)
  - [5.98 UI string catalogue (remaining strings by source file)](#598-ui-string-catalogue-remaining-strings-by-source-file)
- [6. Data and API contract](#6-data-and-api-contract)
  - [6.1 Endpoint catalogue](#61-endpoint-catalogue)
  - [6.2 Fetches with a computed URL](#62-fetches-with-a-computed-url)
  - [6.3 Binary terrain transport](#63-binary-terrain-transport)
  - [6.4 Boot sequence](#64-boot-sequence)
  - [6.5 Backend-sourced content](#65-backend-sourced-content)
- [7. Browser evidence](#7-browser-evidence)
  - [7.1 Environment](#71-environment)
  - [7.2 Screens](#72-screens)
  - [7.3 Measurements (raw)](#73-measurements-raw)
  - [7.4 Verdicts on §3c](#74-verdicts-on-3c)
  - [7.5 New deviations and surprises (not in §3c)](#75-new-deviations-and-surprises-not-in-3c)
  - [7.6 Appendix A. Raw notes (appended during the session)](#76-appendix-a-raw-notes-appended-during-the-session)
- [8. Not rendered: dead code and unused assets](#8-not-rendered-dead-code-and-unused-assets)
  - [8.1 Unused keyframes](#81-unused-keyframes)
  - [8.2 Registered but never shown](#82-registered-but-never-shown)
  - [8.3 Unused assets](#83-unused-assets)
  - [8.4 CSS classes defined but never referenced from script](#84-css-classes-defined-but-never-referenced-from-script)
- [A. design-export/ index and regeneration](#a-design-export-index-and-regeneration)
  - [A.1 Files](#a1-files)
  - [A.2 Asset paths](#a2-asset-paths)
  - [A.3 Regeneration and checking](#a3-regeneration-and-checking)
  - [A.4 Version control warning](#a4-version-control-warning)

## 0. About this document

### 0.1 Scope

This document covers the browser frontend only: screens, states, interactions, visual values, text
strings, assets and the backend calls the interface depends on. The backend, the data pipeline and the
ROS 2 shell are out of scope except where the interface consumes them (chapter 6).

| Item | Value |
|---|---|
| Product | LunaPath Mission Workstation, lunar south pole rover route planning console |
| Reference build | branch `berke/backend-review`, commit `5aec750` |
| Document date | 2026-11-14 |
| Machine-readable companion | `design-export/` (next to this file) |
| Original implementation (informative only) | React 18.2, TypeScript 5.3, Vite 5, three.js r183, no router, no CSS framework, no UI component library |
| UI languages | cockpit English, assistant Turkish, mission report English or Turkish by user choice |

### 0.2 How this document was produced, and how exact it is

- Chapter 1 (foundations), chapter 6 (API contract) and chapter 8 (not rendered) are generated by script
  from the source and from `design-export/*.json`. Their values are exact.
- Chapters 2 to 5 are code-reading inventories of every screen, panel and interaction, with a
  `path:line` citation for each fact. Values were read from the source; file aliases are defined at the
  top of each chapter. They describe the interface in full but are denser than a narrative spec.
- Chapter 7 is browser evidence: what Chrome actually rendered at 1600 x 1000, with screenshots in
  `design-export/screens/`, and a verdict for every place where the code and the screen disagree.

Exact source values, verbatim, are always in `design-export/`: `tokens.css`, `fonts.css`, `motion.css`,
`colormaps.json`, `icons/`, `strings.json`, `registry.json`, `assets/`, `api-contract/`.

### 0.3 Fidelity policy

Where the rendered result differs from the intent stated in the source (a comment, a design rule or a
contract document), the rendered result is what the reference build shows. Chapter 7.4 and 7.5 list
these deviations with evidence. A 1:1 rebuild reproduces the rendered behaviour; a rebuild that fixes a
deviation does so deliberately.

### 0.4 Reference environment

| Item | Value |
|---|---|
| Viewport | 1600 x 1000 CSS px (primary); breakpoint bands 1240, 980 and 640 px wide |
| Device pixel ratio | 1.05 (1 px and 2 px borders measure 0.952 px and 1.905 px; at DPR 1 they are whole numbers) |
| Browser | Chrome 157 on Windows 11 (10.0.26300) |
| Fonts | self-hosted variable WOFF2 files (1.4); no network font requests |
| Backend | reference FastAPI service on `127.0.0.1:8000`, reached through the `/api` proxy, local 500 x 500 grid at 5 m/px |

### 0.5 Conventions

- Colours are given as token and literal where both exist: `var(--lavender)` `#baaff5`.
- CSS values, durations and easing curves are quoted as written in the reference stylesheet.
- User-visible strings are quoted verbatim in their original language and never translated.
- In string templates an interpolated value is written `{…}` or `{name}`.
- Citations are `path:line` against commit `5aec750`; chapter-local aliases (for example `TC` for
  `frontend/src/TerrainCanvas3D.tsx`) are defined at the top of each inventory chapter.
- Registry placement uses `(all)` for "every cockpit mode", `(none)` for "never" or "no tab", and
  `primary` for "rails, not the Systems drawer".

### 0.6 Document map

| Chapter | Content |
|---|---|
| 1 | Foundations: principles, colour tokens, typography, shape, elevation, z-index, breakpoints, motion, icons, data colour ramps, assets |
| 2 | Entry flow, fleet hangar and top bar: phase model, URL, backdrop, boot splash, landing, transition curtain, hangar, rover data, mission profiles |
| 3 | Cockpit shell and 2-D map: layout grid, PLAN and ANALYZE modes, slots and registry, rails, Systems drawer, HUD, toasts, map canvas, view modes, ramps, overlays |
| 4 | 3-D terrain view: renderer, cameras, lights, terrain, overlays, rover, rocks, LiDAR, sky |
| 5 | Feature panels, assistant and mission report (including the full report copy in English and Turkish) |
| 6 | Data and API contract |
| 7 | Browser evidence: environment, captured screens, measurements, verdicts, new deviations |
| 8 | Not rendered: dead code, unused styles and unused assets |
| A | `design-export/` index and regeneration |

Read chapter 1 first, then chapter 2 for the flow into the cockpit, chapter 3 for the cockpit frame, and
chapter 7 to see where the screen differs from the code.

## 1. Foundations

Generated from `design-export/*.json`. Verbatim blocks: `design-export/tokens.css`, `fonts.css`, `motion.css`.

### 1.1 Design principles

Stated by the design system itself at the top of the main stylesheet (`frontend/src/App.css:1-16`):

```css
/* ── LUNAPATH DESIGN SYSTEM ─────────────────────────────────────────────────
   The one palette, taken value-for-value from the Mission Workstation design
   canvas. NASA/JPL mission control, not a cyberpunk HUD: flat opaque surfaces,
   1px hairlines, one restrained lavender accent, and colour that only ever
   means one thing.

   Three rules the canvas enforces and this file has to keep:
     - No glassmorphism. Surfaces are opaque; depth comes from the hairline
       between two flat greys, never from blur or a drop shadow.
     - 2px radius. Engineering software, not a consumer app.
     - Mono is for measured data only -- coordinates, IDs, timestamps,
       telemetry -- never for labels or prose.

   Legacy names (--surface-*, --glass*, --terminator, --umbra, --primary) are
   kept as aliases onto the new values so every rule written against them
   retones with the palette instead of being edited one at a time. */
```

Further rules stated in the token comments: colour is never the only channel (the route also carries a dash pattern per risk level); 12px is the minimum font size; only two shadows exist, both plain black and only for layers that float over the map; floating panels are near-opaque and never blurred.

### 1.2 Colour and custom-property tokens

93 declarations (81 on `:root`, 12 scoped). The comment above each group in `tokens.css` states its role and the contrast reasoning.

| Token | Value | Resolved | Selector | Uses | Source |
|---|---|---|---|---|---|
| `--void` | `#05070d` |  | `:root` | 18 | frontend/src/App.css:94 |
| `--bg-surface` | `#080b12` |  | `:root` | 11 | frontend/src/App.css:95 |
| `--bg-card` | `#0c1018` |  | `:root` | 21 | frontend/src/App.css:96 |
| `--bg-inset` | `#0a0e16` |  | `:root` | 18 | frontend/src/App.css:97 |
| `--bg-raised` | `#0e131d` |  | `:root` | 9 | frontend/src/App.css:98 |
| `--line` | `#161b27` |  | `:root` | 10 | frontend/src/App.css:101 |
| `--line-card` | `#1d2432` |  | `:root` | 24 | frontend/src/App.css:102 |
| `--line-inner` | `#1a202c` |  | `:root` | 23 | frontend/src/App.css:103 |
| `--line-button` | `#58658a` |  | `:root` | 35 | frontend/src/App.css:108 |
| `--line-accent` | `#322b57` |  | `:root` | 1 | frontend/src/App.css:109 |
| `--line-accent-hover` | `#4a4276` |  | `:root` | 9 | frontend/src/App.css:110 |
| `--text` | `#e7eaf1` |  | `:root` | 83 | frontend/src/App.css:113 |
| `--text-2` | `#c8cddb` |  | `:root` | 105 | frontend/src/App.css:114 |
| `--text-3` | `#98a1b4` |  | `:root` | 17 | frontend/src/App.css:115 |
| `--text-muted` | `#8b94a6` |  | `:root` | 87 | frontend/src/App.css:116 |
| `--text-muted-2` | `#7b8497` |  | `:root` | 10 | frontend/src/App.css:117 |
| `--text-dim` | `#808a9d` |  | `:root` | 31 | frontend/src/App.css:129 |
| `--text-dim-2` | `#7b8497` |  | `:root` | 95 | frontend/src/App.css:130 |
| `--text-dimmest` | `#757f92` |  | `:root` | 49 | frontend/src/App.css:135 |
| `--lavender` | `#baaff5` |  | `:root` | 53 | frontend/src/App.css:143 |
| `--lavender-bright` | `#cfc7ff` |  | `:root` | 14 | frontend/src/App.css:144 |
| `--mint` | `#5fe3b0` |  | `:root` | 28 | frontend/src/App.css:145 |
| `--mint-text` | `#93dcc4` |  | `:root` | 5 | frontend/src/App.css:146 |
| `--cyan` | `#4fd8f0` |  | `:root` | 34 | frontend/src/App.css:147 |
| `--cyan-text` | `#8fe6f5` |  | `:root` | 10 | frontend/src/App.css:148 |
| `--coral` | `#ed856e` |  | `:root` | 21 | frontend/src/App.css:149 |
| `--coral-text` | `#ffa48d` |  | `:root` | 10 | frontend/src/App.css:150 |
| `--risk-low` | `#4a8fd8` |  | `:root` | 11 | frontend/src/App.css:177 |
| `--risk-med` | `#e3d548` |  | `:root` | 37 | frontend/src/App.css:178 |
| `--risk-high` | `#d69770` |  | `:root` | 7 | frontend/src/App.css:179 |
| `--risk-crit` | `#ed4b3d` |  | `:root` | 14 | frontend/src/App.css:180 |
| `--radius` | `2px` |  | `:root` | 172 | frontend/src/App.css:182 |
| `--shadow-pop` | `0 12px 28px rgba(0, 0, 0, 0.55)` |  | `:root` | 3 | frontend/src/App.css:188 |
| `--shadow-float` | `0 20px 46px rgba(0, 0, 0, 0.6)` |  | `:root` | 13 | frontend/src/App.css:189 |
| `--fs-micro` | `12px` |  | `:root` | 213 | frontend/src/App.css:216 |
| `--fs-small` | `12px` |  | `:root` | 112 | frontend/src/App.css:217 |
| `--fs-body` | `13px` |  | `:root` | 65 | frontend/src/App.css:218 |
| `--fs-strong` | `15px` |  | `:root` | 22 | frontend/src/App.css:219 |
| `--fs-value` | `16px` |  | `:root` | 15 | frontend/src/App.css:220 |
| `--fs-title` | `18px` |  | `:root` | 10 | frontend/src/App.css:221 |
| `--fs-display` | `24px` |  | `:root` | 2 | frontend/src/App.css:222 |
| `--fs-hero` | `30px` |  | `:root` | 3 | frontend/src/App.css:225 |
| `--track-tight` | `0.02em` |  | `:root` | 8 | frontend/src/App.css:237 |
| `--track-normal` | `0.04em` |  | `:root` | 52 | frontend/src/App.css:238 |
| `--track-label` | `0.06em` |  | `:root` | 39 | frontend/src/App.css:239 |
| `--track-caps` | `0.08em` |  | `:root` | 37 | frontend/src/App.css:240 |
| `--track-hero` | `0.24em` |  | `:root` | 4 | frontend/src/App.css:243 |
| `--font-body` | `'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif` |  | `:root` | 51 | frontend/src/App.css:256 |
| `--font-display` | `'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif` |  | `:root` | 23 | frontend/src/App.css:257 |
| `--font-label` | `'Archivo Narrow', 'Archivo', system-ui, sans-serif` |  | `:root` | 54 | frontend/src/App.css:258 |
| `--font-data` | `'Azeret Mono', ui-monospace, 'Cascadia Code', monospace` |  | `:root` | 140 | frontend/src/App.css:259 |
| `--surface-dim` | `var(--void)` | `#05070d` | `:root` | 0 | frontend/src/App.css:262 |
| `--surface-lowest` | `var(--bg-surface)` | `#080b12` | `:root` | 7 | frontend/src/App.css:263 |
| `--surface-low` | `var(--bg-card)` | `#0c1018` | `:root` | 2 | frontend/src/App.css:264 |
| `--surface-container` | `var(--bg-raised)` | `#0e131d` | `:root` | 0 | frontend/src/App.css:265 |
| `--surface-high` | `#141924` |  | `:root` | 1 | frontend/src/App.css:266 |
| `--surface-highest` | `#1c2230` |  | `:root` | 0 | frontend/src/App.css:267 |
| `--outline` | `var(--line-button)` | `#58658a` | `:root` | 0 | frontend/src/App.css:268 |
| `--outline-soft` | `var(--line-card)` | `#1d2432` | `:root` | 0 | frontend/src/App.css:269 |
| `--hairline` | `var(--line)` | `#161b27` | `:root` | 5 | frontend/src/App.css:270 |
| `--primary` | `var(--lavender)` | `#baaff5` | `:root` | 0 | frontend/src/App.css:271 |
| `--primary-container` | `var(--lavender-bright)` | `#cfc7ff` | `:root` | 9 | frontend/src/App.css:272 |
| `--secondary` | `#8fa0c0` |  | `:root` | 1 | frontend/src/App.css:273 |
| `--safe` | `var(--risk-low)` | `#4a8fd8` | `:root` | 4 | frontend/src/App.css:274 |
| `--warning` | `var(--risk-med)` | `#e3d548` | `:root` | 0 | frontend/src/App.css:275 |
| `--danger` | `var(--risk-high)` | `#d69770` | `:root` | 0 | frontend/src/App.css:276 |
| `--critical` | `var(--risk-crit)` | `#ed4b3d` | `:root` | 3 | frontend/src/App.css:277 |
| `--terminator` | `var(--risk-med)` | `#e3d548` | `:root` | 2 | frontend/src/App.css:281 |
| `--terminator-dim` | `rgba(227, 213, 72, 0.14)` |  | `:root` | 0 | frontend/src/App.css:282 |
| `--umbra` | `var(--cyan)` | `#4fd8f0` | `:root` | 4 | frontend/src/App.css:283 |
| `--umbra-dim` | `rgba(79, 216, 240, 0.14)` |  | `:root` | 1 | frontend/src/App.css:284 |
| `--glass` | `rgba(8, 11, 18, 0.92)` |  | `:root` | 1 | frontend/src/App.css:288 |
| `--glass-strong` | `rgba(8, 11, 18, 0.96)` |  | `:root` | 3 | frontend/src/App.css:289 |
| `--backdrop-scale` | `1.06` |  | `.space-backdrop--ambient .space-backdrop-media` | 1 | frontend/src/App.css:451 |
| `--accent-lavender` | `var(--lavender)` | `#baaff5` | `:root` | 16 | frontend/src/App.css:2432 |
| `--accent-cyan` | `var(--cyan)` | `#4fd8f0` | `:root` | 4 | frontend/src/App.css:2433 |
| `--accent-mint` | `var(--mint)` | `#5fe3b0` | `:root` | 5 | frontend/src/App.css:2434 |
| `--accent-coral` | `var(--coral)` | `#ed856e` | `:root` | 8 | frontend/src/App.css:2435 |
| `--bg-workstation` | `var(--void)` | `#05070d` | `:root` | 0 | frontend/src/App.css:2436 |
| `--bg-panel-trans` | `var(--bg-surface)` | `#080b12` | `:root` | 0 | frontend/src/App.css:2437 |
| `--border-line` | `var(--line)` | `#161b27` | `:root` | 32 | frontend/src/App.css:2438 |
| `--border-focus` | `var(--line-accent-hover)` | `#4a4276` | `:root` | 7 | frontend/src/App.css:2439 |
| `--profile-color` | `var(--accent-lavender)` | `#baaff5` | `.lp-profile-card` | 4 | frontend/src/App.css:3107 |
| `--text` | `#111` |  | `.lp-report-modal` | 83 | frontend/src/features/mission-report/report.css:877 |
| `--text-2` | `#111` |  | `.lp-report-modal` | 105 | frontend/src/features/mission-report/report.css:878 |
| `--text-3` | `#333` |  | `.lp-report-modal` | 17 | frontend/src/features/mission-report/report.css:879 |
| `--text-muted` | `#555` |  | `.lp-report-modal` | 87 | frontend/src/features/mission-report/report.css:880 |
| `--text-muted-2` | `#555` |  | `.lp-report-modal` | 10 | frontend/src/features/mission-report/report.css:881 |
| `--text-dim` | `#555` |  | `.lp-report-modal` | 31 | frontend/src/features/mission-report/report.css:882 |
| `--text-dim-2` | `#555` |  | `.lp-report-modal` | 95 | frontend/src/features/mission-report/report.css:883 |
| `--text-dimmest` | `#666` |  | `.lp-report-modal` | 49 | frontend/src/features/mission-report/report.css:884 |
| `--line` | `#ddd` |  | `.lp-report-modal` | 10 | frontend/src/features/mission-report/report.css:887 |
| `--border-line` | `#ddd` |  | `.lp-report-modal` | 32 | frontend/src/features/mission-report/report.css:888 |

Custom properties set inline from script:

| Property | Value expression | Component | Source |
|---|---|---|---|
| `--backdrop-opacity` | `STAGE_OPACITY[stage]` | SpaceBackdrop | frontend/src/SpaceBackdrop.tsx:71 |
| `--profile-color` | `profile.color` | RoutePriorities | frontend/src/features/mission-setup/RoutePriorities.tsx:202 |
| `--profile-color` | `result.color` | ProfileComparePanel | frontend/src/features/profile-compare/ProfileComparePanel.tsx:72 |
| `--verdict-color` | `riskToHex(overallRisk)` | RouteAnalysisInspector | frontend/src/features/route-analysis/RouteAnalysisInspector.tsx:157 |

Declared but never used: `--bg-panel-trans`, `--bg-workstation`, `--danger`, `--outline`, `--outline-soft`, `--primary`, `--surface-container`, `--surface-dim`, `--surface-highest`, `--terminator-dim`, `--warning`.

Colour meaning, as used across the interface: lavender is the single interactive accent (selection, active mode, primary button); mint marks the start point and positive states; coral marks the goal point and negative states; cyan marks permanent shadow (umbra) and the LOW-risk route segment; the risk ramp `--risk-low` / `--risk-med` / `--risk-high` / `--risk-crit` is reserved for risk readings.

### 1.3 Typography

Four role tokens: `--font-body` and `--font-display` (Archivo) for interface text and headings, `--font-label` (Archivo Narrow) for labels in the fixed-width rails, `--font-data` (Azeret Mono) for measured values only: coordinates, identifiers, timestamps, telemetry. Never mono for labels.

Font faces (`design-export/fonts.css`, files under `design-export/assets/fonts/`):

| Family | Weight range | Style | Display | File | Source |
|---|---|---|---|---|---|
| Archivo | 300,800 | normal | swap | `/fonts/archivo-latin.woff2` | frontend/src/App.css:33 |
| Archivo | 300,800 | normal | swap | `/fonts/archivo-latin-ext.woff2` | frontend/src/App.css:43 |
| Archivo Narrow | 400,700 | normal | swap | `/fonts/archivo-narrow-latin.woff2` | frontend/src/App.css:53 |
| Archivo Narrow | 400,700 | normal | swap | `/fonts/archivo-narrow-latin-ext.woff2` | frontend/src/App.css:63 |
| Azeret Mono | 400,500 | normal | swap | `/fonts/azeret-mono-latin.woff2` | frontend/src/App.css:73 |
| Azeret Mono | 400,500 | normal | swap | `/fonts/azeret-mono-latin-ext.woff2` | frontend/src/App.css:83 |

Scale tokens:

| Token | Value | Source |
|---|---|---|
| `--fs-micro` | `12px` | frontend/src/App.css:216 |
| `--fs-small` | `12px` | frontend/src/App.css:217 |
| `--fs-body` | `13px` | frontend/src/App.css:218 |
| `--fs-strong` | `15px` | frontend/src/App.css:219 |
| `--fs-value` | `16px` | frontend/src/App.css:220 |
| `--fs-title` | `18px` | frontend/src/App.css:221 |
| `--fs-display` | `24px` | frontend/src/App.css:222 |
| `--fs-hero` | `30px` | frontend/src/App.css:225 |
| `--track-tight` | `0.02em` | frontend/src/App.css:237 |
| `--track-normal` | `0.04em` | frontend/src/App.css:238 |
| `--track-label` | `0.06em` | frontend/src/App.css:239 |
| `--track-caps` | `0.08em` | frontend/src/App.css:240 |
| `--track-hero` | `0.24em` | frontend/src/App.css:243 |
| `--font-body` | `'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif` | frontend/src/App.css:256 |
| `--font-display` | `'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif` | frontend/src/App.css:257 |
| `--font-label` | `'Archivo Narrow', 'Archivo', system-ui, sans-serif` | frontend/src/App.css:258 |
| `--font-data` | `'Azeret Mono', ui-monospace, 'Cascadia Code', monospace` | frontend/src/App.css:259 |

Font sizes actually declared in CSS (values outside the token scale are deviations from the stated 12px floor and seven-step scale):

| Value | Count |
|---|---|
| `var(--fs-micro)` | 213 |
| `var(--fs-small)` | 112 |
| `var(--fs-body)` | 65 |
| `var(--fs-strong)` | 22 |
| `var(--fs-value)` | 15 |
| `15px` | 12 |
| `12px` | 11 |
| `var(--fs-title)` | 10 |
| `17px` | 7 |
| `13px` | 5 |
| `14px` | 5 |
| `16px` | 5 |
| `11px` | 3 |
| `var(--fs-hero)` | 3 |
| `8px` | 2 |
| `var(--fs-display)` | 2 |
| `10px` | 1 |
| `18px` | 1 |
| `26px` | 1 |
| `30px` | 1 |
| `7px` | 1 |
| `9.5px` | 1 |
| `9px` | 1 |
| `clamp(1.7rem, 6vw, 2.4rem)` | 1 |
| `clamp(2rem, 3.2vw, 50px)` | 1 |

Font weights:

| Value | Count |
|---|---|
| `600` | 60 |
| `700` | 52 |
| `500` | 17 |
| `400` | 6 |
| `800` | 3 |
| `300` | 2 |
| `300 800` | 2 |
| `400 500` | 2 |
| `400 700` | 2 |
| `750` | 1 |

Line heights:

| Value | Count |
|---|---|
| `1.5` | 41 |
| `1.45` | 20 |
| `1.55` | 13 |
| `1.6` | 5 |
| `1.35` | 4 |
| `1.4` | 3 |
| `1` | 2 |
| `1.15` | 2 |
| `0` | 1 |
| `1.08` | 1 |
| `1.65` | 1 |
| `14px` | 1 |

Letter spacing:

| Value | Count |
|---|---|
| `var(--track-normal)` | 52 |
| `var(--track-label)` | 39 |
| `var(--track-caps)` | 37 |
| `var(--track-tight)` | 8 |
| `0` | 6 |
| `-0.01em` | 4 |
| `var(--track-hero)` | 4 |
| `0.04em` | 2 |
| `-0.005em` | 1 |
| `-0.015em` | 1 |
| `-0.02em` | 1 |
| `0.025em` | 1 |
| `0.02em` | 1 |
| `0.035em` | 1 |
| `0.08em` | 1 |
| `0.09em` | 1 |
| `0.1em` | 1 |

### 1.4 Shape and elevation

Border radius values:

| Value | Count |
|---|---|
| `border-radius: var(--radius)` | 172 |
| `border-radius: 50%` | 20 |
| `border-radius: 2px` | 6 |
| `border-radius: 0` | 5 |
| `border-radius: 1px 1px 0 0` | 3 |
| `border-radius: 3px` | 2 |
| `border-radius: 7px` | 2 |
| `border-radius: 12px` | 1 |
| `border-radius: 18px` | 1 |
| `border-radius: 24px` | 1 |
| `border-radius: 8px` | 1 |
| `border-radius: 999px` | 1 |

Box shadows:

| Value | Count |
|---|---|
| `var(--shadow-float)` | 13 |
| `none` | 3 |
| `var(--shadow-pop)` | 3 |
| `0 0 0 0 rgba(186, 175, 245, 0.45)` | 1 |
| `0 0 0 0 rgba(237, 133, 110, 0.4)` | 1 |
| `0 0 0 0 rgba(95, 227, 176, 0.4)` | 1 |
| `0 0 0 1px rgba(0, 0, 0, 0.4), 0 0 8px rgba(255, 82, 82, 0.35)` | 1 |
| `0 0 0 3px rgba(186, 175, 245, 0.16)` | 1 |
| `0 0 0 3px rgba(186, 175, 245, 0.18)` | 1 |
| `0 0 0 4px rgba(237, 133, 110, 0.15)` | 1 |
| `0 0 0 4px rgba(95, 227, 176, 0.15)` | 1 |
| `0 0 0 5px rgba(186, 175, 245, 0.06)` | 1 |
| `0 0 12px rgba(56, 189, 248, 0.25)` | 1 |
| `0 0 13px rgba(46, 229, 157, 0.12)` | 1 |
| `0 0 4px rgba(255, 255, 255, 0.25)` | 1 |
| `0 0 6px currentColor` | 1 |
| `0 14px 34px rgba(0, 0, 0, 0.5), inset 0 0 24px rgba(34, 211, 238, 0.035)` | 1 |
| `0 8px 24px rgba(0, 0, 0, 0.65), 0 0 15px rgba(56, 189, 248, 0.15)` | 1 |
| `inset 0 0 0 1px rgba(186, 175, 245, 0.4)` | 1 |

### 1.5 Z-index ladder

| z-index | Selector | Context | Source |
|---|---|---|---|
| 0 | `.space-backdrop` |  | frontend/src/App.css:418 |
| 1 | `.app-shell` |  | frontend/src/App.css:512 |
| 1 | `.landing-screen::before` |  | frontend/src/App.css:566 |
| 1 | `.map-stage` |  | frontend/src/App.css:1536 |
| 1 | `.splash-content` |  | frontend/src/App.css:5910 |
| 1 | `.lp-io-origin` |  | frontend/src/components/Instrument/instrument.css:92 |
| 2 | `.landing-content` |  | frontend/src/App.css:579 |
| 2 | `.map-overlay` |  | frontend/src/App.css:1571 |
| 2 | `.map-overlay-top-right` |  | frontend/src/App.css:1639 |
| 2 | `.lp-card-photo-badges` |  | frontend/src/App.css:5069 |
| 2 | `.lp-card-photo-footer` |  | frontend/src/App.css:5102 |
| 2 | `.lp-io-marker` |  | frontend/src/components/Instrument/instrument.css:131 |
| 2 | `.map-overlay-analysis` |  | frontend/src/features/analysis-layers/analysis-layers.css:15 |
| 3 | `.terrain3d-controls` |  | frontend/src/App.css:2261 |
| 3 | `.map-overlay-bottom-right` |  | frontend/src/App.css:2299 |
| 3 | `.map-overlay-bottom-center` |  | frontend/src/features/map-legend/map-legend.css:13 |
| 4 | `.lp-rail-tabs` |  | frontend/src/shell/shell.css:63 |
| 10 | `.terrain3d-rockbox-layer` |  | frontend/src/App.css:6052 |
| 24 | `.terrain3d-lidar` |  | frontend/src/App.css:6185 |
| 24 | `.lp-analysis-dock` |  | frontend/src/features/analysis-layers/analysis-layers.css:20 |
| 25 | `.lp-map-controls-dock` |  | frontend/src/App.css:2639 |
| 25 | `.terrain3d-camera-switch` |  | frontend/src/App.css:6141 |
| 30 | `.lp-solving-overlay` |  | frontend/src/App.css:2815 |
| 50 | `.lp-topbar` |  | frontend/src/App.css:2457 |
| 100 | `.lp-layer-dropdown-panel` |  | frontend/src/App.css:2720 |
| 100 | `.lp-analysis-layers` |  | frontend/src/features/analysis-layers/analysis-layers.css:57 |
| 100 | `.chat-launcher` |  | frontend/src/features/assistant/assistant.css:19 |
| 100 | `.chat-window` |  | frontend/src/features/assistant/assistant.css:114 |
| 120 | `.lp-modal-backdrop` |  | frontend/src/App.css:3583 |
| 130 | `.space-backdrop--ambient` |  | frontend/src/App.css:425 |
| 130 | `.space-backdrop--feature` |  | frontend/src/App.css:429 |
| 131 | `.landing-screen` |  | frontend/src/App.css:544 |
| 131 | `.cinematic-screen` |  | frontend/src/App.css:818 |
| 131 | `.fleet-screen` |  | frontend/src/App.css:4782 |
| 150 | `.toast-stack` |  | frontend/src/App.css:1395 |
| 200 | `.lp-systems-backdrop` |  | frontend/src/App.css:4348 |
| 200 | `.splash-screen` |  | frontend/src/App.css:5859 |
| 201 | `.lp-systems-drawer` |  | frontend/src/App.css:4377 |
| 300 | `.lp-report-scrim` |  | frontend/src/features/mission-report/report.css:92 |

Stacking contexts: root (backdrop 0 or 130, app shell 1, landing and hangar 131, splash 200); inside `.app-shell` (top bar 50, assistant 100, toasts 150, Systems drawer 200/201, report 300); inside `.map-stage` (map overlays 2-30). See 3.1 for the full grouping.

### 1.6 Breakpoints and media queries

| Query | Blocks | Sites |
|---|---|---|
| `(prefers-reduced-motion: reduce)` | 10 | frontend/src/App.css:805, frontend/src/App.css:5944, frontend/src/App.css:6032, frontend/src/App.css:6283, frontend/src/features/analysis-job/analysis-job.css:109, frontend/src/features/assistant/assistant.css:147 … |
| `(max-width: 900px)` | 5 | frontend/src/App.css:4974, frontend/src/App.css:5616, frontend/src/features/analysis-layers/analysis-layers.css:174, frontend/src/features/map-legend/map-legend.css:69, frontend/src/features/mission-report/report.css:370 |
| `(max-width: 980px)` | 3 | frontend/src/App.css:2012, frontend/src/features/assistant/assistant.css:1059, frontend/src/shell/shell.css:37 |
| `(max-width: 1180px)` | 1 | frontend/src/App.css:1998 |
| `(max-width: 1200px)` | 1 | frontend/src/App.css:4283 |
| `(max-width: 1240px)` | 1 | frontend/src/App.css:5461 |
| `(max-width: 1440px)` | 1 | frontend/src/App.css:6125 |
| `(max-width: 640px)` | 1 | frontend/src/App.css:2086 |
| `(max-width: 720px)` | 1 | frontend/src/App.css:4460 |
| `(max-width: 760px)` | 1 | frontend/src/App.css:6404 |
| `(max-width: 820px)` | 1 | frontend/src/App.css:5472 |
| `print` | 1 | frontend/src/features/mission-report/report.css:840 |

### 1.7 Motion

14 keyframes (10 used), 79 transitions, 27 animation declarations, 10 reduced-motion blocks. Verbatim: `design-export/motion.css`.

| Keyframes | Used | Used by | Source |
|---|---|---|---|
| `landing-rise` | yes | .landing-topline, .landing-copy > *, .landing-footline (animation: landing-rise 0.72s cubic-bezier(0.22, 0.61, 0.36, 1) both) | frontend/src/App.css:762 |
| `lp-pulse` | no |  | frontend/src/App.css:4290 |
| `lp-spin` | yes | .lp-radar-spinner (animation: lp-spin 0.8s linear infinite) | frontend/src/App.css:4295 |
| `lp-scan-motion` | yes | .lp-scan-sweep (animation: lp-scan-motion 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite) | frontend/src/App.css:4300 |
| `lpSlideInLeft` | no |  | frontend/src/App.css:4306 |
| `lpPulseBorderStart` | no |  | frontend/src/App.css:4317 |
| `lpPulseBorderGoal` | no |  | frontend/src/App.css:4328 |
| `splash-draw` | yes | .splash-screen.is-entering (animation: splash-draw 0.3s ease both) | frontend/src/App.css:5915 |
| `splash-timed-bar` | yes | .loading-bar-fill.is-timed (animation: splash-timed-bar 1.5s cubic-bezier(0.33, 0.9, 0.5, 1) both) | frontend/src/App.css:5930 |
| `splash-rise` | yes | .splash-identity, .splash-progress (animation: splash-rise 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) both) | frontend/src/App.css:6012 |
| `terrain3d-radar-sweep` | yes | .terrain3d-radar-icon span (animation: terrain3d-radar-sweep 2s linear infinite) | frontend/src/App.css:6279 |
| `lp-job-spin` | yes | .lp-job-spinner (animation: lp-job-spin 900ms linear infinite) | frontend/src/features/analysis-job/analysis-job.css:58 |
| `chat-dot` | yes | .chat-dots i (animation: chat-dot 1.1s infinite ease-in-out) | frontend/src/features/assistant/assistant.css:900 |
| `lp-report-waiting` | yes | .lp-report-launcher.is-waiting (animation: lp-report-waiting 1.6s ease-in-out infinite) | frontend/src/features/mission-report/report.css:61 |

Animation declarations:

| Selector | Value | Source |
|---|---|---|
| `.landing-topline, .landing-copy > *, .landing-footline` | `landing-rise 0.72s cubic-bezier(0.22, 0.61, 0.36, 1) both` | frontend/src/App.css:776 |
| `.landing-topline` | `0.05s` | frontend/src/App.css:780 |
| `.landing-copy > .landing-kicker` | `0.24s` | frontend/src/App.css:784 |
| `.landing-copy > h1` | `0.34s` | frontend/src/App.css:788 |
| `.landing-copy > .landing-description` | `0.46s` | frontend/src/App.css:792 |
| `.landing-copy > .landing-actions` | `0.58s` | frontend/src/App.css:796 |
| `.landing-footline` | `0.7s` | frontend/src/App.css:800 |
| `.landing-topline, .landing-copy > *, .landing-footline` | `none` | frontend/src/App.css:809 |
| `.lp-scan-sweep` | `lp-scan-motion 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite` | frontend/src/App.css:2828 |
| `.lp-radar-spinner` | `lp-spin 0.8s linear infinite` | frontend/src/App.css:2855 |
| `.splash-screen.is-entering` | `splash-draw 0.3s ease both` | frontend/src/App.css:5925 |
| `.loading-bar-fill.is-timed` | `splash-timed-bar 1.5s cubic-bezier(0.33, 0.9, 0.5, 1) both` | frontend/src/App.css:5941 |
| `.splash-screen.is-entering` | `none` | frontend/src/App.css:5946 |
| `.loading-bar-fill.is-timed` | `none` | frontend/src/App.css:5950 |
| `.splash-identity, .splash-progress` | `splash-rise 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) both` | frontend/src/App.css:6025 |
| `.splash-progress` | `0.16s` | frontend/src/App.css:6029 |
| `.splash-identity, .splash-progress` | `none` | frontend/src/App.css:6035 |
| `.terrain3d-radar-icon span` | `terrain3d-radar-sweep 2s linear infinite` | frontend/src/App.css:6276 |
| `.terrain3d-radar-icon span` | `none` | frontend/src/App.css:6285 |
| `.lp-job-spinner` | `lp-job-spin 900ms linear infinite` | frontend/src/features/analysis-job/analysis-job.css:55 |
| `.lp-job-spinner` | `none` | frontend/src/features/analysis-job/analysis-job.css:109 |
| `.chat-dots i` | `chat-dot 1.1s infinite ease-in-out` | frontend/src/features/assistant/assistant.css:889 |
| `.chat-dots i:nth-child(2)` | `0.18s` | frontend/src/features/assistant/assistant.css:893 |
| `.chat-dots i:nth-child(3)` | `0.36s` | frontend/src/features/assistant/assistant.css:897 |
| `.chat-dots i` | `none` | frontend/src/features/assistant/assistant.css:915 |
| `.lp-report-launcher.is-waiting` | `lp-report-waiting 1.6s ease-in-out infinite` | frontend/src/features/mission-report/report.css:74 |
| `.lp-report-launcher.is-waiting` | `none` | frontend/src/features/mission-report/report.css:82 |

Transition declarations:

| Selector | Value | Source |
|---|---|---|
| `.space-backdrop-media` | `opacity 0.75s ease, transform 1.2s ease` | frontend/src/App.css:443 |
| `.space-backdrop-vignette` | `opacity 0.75s ease` | frontend/src/App.css:457 |
| `.app-shell` | `opacity 0.6s ease, transform 0.6s ease, filter 0.6s ease` | frontend/src/App.css:520 |
| `.landing-screen` | `opacity 0.75s ease, transform 0.75s ease, filter 0.75s ease` | frontend/src/App.css:547 |
| `.landing-explore-button` | `background 140ms ease` | frontend/src/App.css:721 |
| `.cinematic-screen` | `opacity 0.45s ease, visibility 0.45s ease` | frontend/src/App.css:825 |
| `.cinematic-cta` | `background 0.2s ease, opacity 0.2s ease` | frontend/src/App.css:859 |
| `.loading-bar-fill` | `width 0.45s ease` | frontend/src/App.css:883 |
| `.rover-card` | `border-color 0.18s ease, background 0.18s ease, transform 0.18s ease` | frontend/src/App.css:1188 |
| `.profile-button` | `background 0.18s ease, color 0.18s ease` | frontend/src/App.css:1250 |
| `.battery-progress` | `stroke-dashoffset 0.25s ease` | frontend/src/App.css:1830 |
| `.lp-mode-btn` | `background 140ms ease, color 140ms ease` | frontend/src/App.css:2500 |
| `.lp-systems-toggle` | `color 140ms ease, border-color 140ms ease, background 140ms ease` | frontend/src/App.css:2592 |
| `.lp-dim-btn` | `all 140ms ease` | frontend/src/App.css:2660 |
| `.lp-layer-trigger` | `border-color 160ms ease` | frontend/src/App.css:2683 |
| `.lp-layer-item` | `background 140ms ease` | frontend/src/App.css:2752 |
| `.lp-profile-card` | `border-color 140ms ease, background 140ms ease` | frontend/src/App.css:3118 |
| `.lp-info-btn` | `color 140ms ease` | frontend/src/App.css:3280 |
| `.lp-weight-input` | `border-color 140ms ease` | frontend/src/App.css:3319 |
| `.lp-range-input::-webkit-slider-thumb` | `transform 120ms ease` | frontend/src/App.css:3354 |
| `.lp-coord-field` | `border-color 140ms ease` | frontend/src/App.css:3438 |
| `.lp-pick-btn` | `border-color 140ms ease, color 140ms ease, background 140ms ease` | frontend/src/App.css:3492 |
| `.lp-pick-btn .lp-icon` | `color 140ms ease` | frontend/src/App.css:3501 |
| `.lp-rover-select-card` | `all 160ms ease` | frontend/src/App.css:3644 |
| `.lp-select-btn` | `all 140ms ease` | frontend/src/App.css:3739 |
| `.lp-replan-btn` | `all 160ms ease` | frontend/src/App.css:3793 |
| `.lp-play-btn` | `border-color 140ms ease, color 140ms ease` | frontend/src/App.css:4185 |
| `.lp-systems-backdrop` | `opacity 0.25s ease` | frontend/src/App.css:4347 |
| `.lp-systems-drawer` | `transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.28s` | frontend/src/App.css:4374 |
| `.lp-systems-close` | `all 0.15s ease` | frontend/src/App.css:4424 |
| `.lp-rover-tab` | `all 0.15s ease` | frontend/src/App.css:4488 |
| `.lp-panel-clear-btn` | `all 0.15s ease` | frontend/src/App.css:4566 |
| `.lp-change-vehicle-btn` | `color 140ms ease, border-color 140ms ease, background 140ms ease` | frontend/src/App.css:4597 |
| `.lp-panel-plan-btn` | `background 140ms ease, opacity 140ms ease` | frontend/src/App.css:4618 |
| `.lp-hud-btn` | `all 0.15s ease` | frontend/src/App.css:4693 |
| `.lp-hud-minimized` | `all 0.2s ease` | frontend/src/App.css:4711 |
| `.lp-hud-dock-btn` | `all 0.15s ease` | frontend/src/App.css:4755 |
| `.lp-carousel-arrow` | `color 140ms ease, border-color 140ms ease` | frontend/src/App.css:4884 |
| `.lp-fleet-thumb` | `color 140ms ease, border-color 140ms ease` | frontend/src/App.css:4926 |
| `.lp-fleet-thumb img` | `opacity 140ms ease` | frontend/src/App.css:4935 |
| `.lp-fleet-card` | `border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1)` | frontend/src/App.css:5004 |
| `.lp-card-photo` | `transform 0.4s ease` | frontend/src/App.css:5044 |
| `.lp-card-select-btn` | `all 0.15s ease` | frontend/src/App.css:5230 |
| `.lp-deploy-btn` | `background 140ms ease` | frontend/src/App.css:5538 |
| `.lp-deploy-arrow` | `transform 0.2s ease` | frontend/src/App.css:5557 |
| `.splash-screen` | `opacity 0.52s ease, visibility 0.52s ease` | frontend/src/App.css:5864 |
| `.lp-scale-btn` | `border-color 140ms ease, color 140ms ease` | frontend/src/App.css:6109 |
| `.terrain3d-cam-btn` | `all 0.15s ease` | frontend/src/App.css:6165 |
| `.lp-job-run` | `all 0.15s ease` | frontend/src/features/analysis-job/analysis-job.css:25 |
| `.lp-analysis-trigger` | `border-color 160ms ease` | frontend/src/features/analysis-layers/analysis-layers.css:33 |
| `.lp-analysis-item` | `background 140ms ease` | frontend/src/features/analysis-layers/analysis-layers.css:74 |
| `.chat-launcher` | `border-color 0.16s ease, color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease` | frontend/src/features/assistant/assistant.css:35 |
| `.chat-launcher.is-dragging` | `none` | frontend/src/features/assistant/assistant.css:43 |
| `.chat-launcher.is-open` | `opacity 0.15s ease` | frontend/src/features/assistant/assistant.css:90 |
| `.chat-window` | `opacity 0.15s ease, transform 0.15s ease, visibility 0s linear 0.15s` | frontend/src/features/assistant/assistant.css:130 |
| `.chat-window.is-open` | `opacity 0.15s ease, transform 0.15s ease, visibility 0s` | frontend/src/features/assistant/assistant.css:141 |
| `.chat-window, .chat-window.is-open` | `none` | frontend/src/features/assistant/assistant.css:150 |
| `.chat-window.is-dragging` | `none` | frontend/src/features/assistant/assistant.css:202 |
| `.chat-reset-position` | `border-color 0.16s ease, background 0.16s ease` | frontend/src/features/assistant/assistant.css:228 |
| `.chat-minimize` | `border-color 0.16s ease, color 0.16s ease` | frontend/src/features/assistant/assistant.css:253 |
| `.chat-new` | `border-color 0.16s ease, color 0.16s ease` | frontend/src/features/assistant/assistant.css:305 |
| `.chat-level-option` | `background 0.14s ease, color 0.14s ease` | frontend/src/features/assistant/assistant.css:369 |
| `.chat-suggestion` | `background 0.14s ease, color 0.14s ease` | frontend/src/features/assistant/assistant.css:493 |
| `.lp-assistant-field` | `border-color 0.16s ease, box-shadow 0.16s ease` | frontend/src/features/assistant/assistant.css:958 |
| `.chat-send` | `background 0.16s ease, border-color 0.16s ease` | frontend/src/features/assistant/assistant.css:1034 |
| `.cf-field-btn` | `border-color 140ms ease, color 140ms ease` | frontend/src/features/coarse-fields/coarse-fields.css:64 |
| `.ev-bar` | `background 140ms ease` | frontend/src/features/earth-visibility/earth-visibility.css:91 |
| `.ic-field-btn` | `border-color 140ms ease, color 140ms ease` | frontend/src/features/illumination-corridor/illumination-corridor.css:39 |
| `.lp-mc-switch` | `border-color 120ms linear, background 120ms linear` | frontend/src/features/mission-constraints/mission-constraints.css:50 |
| `.lp-mc-switch::after` | `transform 120ms linear, background 120ms linear` | frontend/src/features/mission-constraints/mission-constraints.css:62 |
| `.lp-mc-switch, .lp-mc-switch::after` | `none` | frontend/src/features/mission-constraints/mission-constraints.css:148 |
| `.lp-report-launcher` | `background 140ms ease, border-color 140ms ease` | frontend/src/features/mission-report/report.css:34 |
| `.lp-report-lang` | `background 140ms ease, color 140ms ease` | frontend/src/features/mission-report/report.css:219 |
| `.lp-hbar-fill` | `width 160ms ease-out` | frontend/src/features/mission-report/report.css:582 |
| `.lp-report-toggle-icon` | `transform 140ms ease` | frontend/src/features/mission-report/report.css:749 |
| `.lp-report-toggle-icon` | `none` | frontend/src/features/mission-report/report.css:758 |
| `.sh-view-btn` | `border-color 140ms ease, color 140ms ease` | frontend/src/features/safe-haven/safe-haven.css:39 |
| `.lp-time-constraint` | `border-color 140ms ease, color 140ms ease` | frontend/src/features/time-axis/time-axis.css:104 |
| `.lp-rail-tab` | `color 140ms ease, background 140ms ease` | frontend/src/shell/shell.css:84 |

Reduced motion: the CSS blocks disable the landing and splash keyframes and the backdrop video is replaced by the poster image `/starimg.jpeg`; transitions (landing exit blur, app-shell reveal, backdrop opacity and scale, hover scales) and the 1.5 s transition curtain still run.

### 1.8 Icons

51 Material Symbols Outlined glyphs drawn inline as SVG paths (`frontend/src/components/Fleet/SpecIcons.tsx`), `viewBox="0 -960 960 960"`, `fill="currentColor"`, class `lp-icon` sized 1em with `vertical-align: -0.125em`. Standalone files: `design-export/icons/<name>.svg`. No icon font, no network request.

| Name | Duplicate of | Source |
|---|---|---|
| `battery` |  | frontend/src/components/Fleet/SpecIcons.tsx:96 |
| `speed` |  | frontend/src/components/Fleet/SpecIcons.tsx:98 |
| `climb` |  | frontend/src/components/Fleet/SpecIcons.tsx:100 |
| `mass` |  | frontend/src/components/Fleet/SpecIcons.tsx:101 |
| `slope` |  | frontend/src/components/Fleet/SpecIcons.tsx:102 |
| `energy` |  | frontend/src/components/Fleet/SpecIcons.tsx:103 |
| `shadow` |  | frontend/src/components/Fleet/SpecIcons.tsx:104 |
| `thermal` |  | frontend/src/components/Fleet/SpecIcons.tsx:106 |
| `balance` |  | frontend/src/components/Fleet/SpecIcons.tsx:108 |
| `eco` |  | frontend/src/components/Fleet/SpecIcons.tsx:110 |
| `map` |  | frontend/src/components/Fleet/SpecIcons.tsx:111 |
| `tune` |  | frontend/src/components/Fleet/SpecIcons.tsx:112 |
| `location` |  | frontend/src/components/Fleet/SpecIcons.tsx:113 |
| `undo` |  | frontend/src/components/Fleet/SpecIcons.tsx:115 |
| `clear` |  | frontend/src/components/Fleet/SpecIcons.tsx:116 |
| `info` |  | frontend/src/components/Fleet/SpecIcons.tsx:117 |
| `restart` |  | frontend/src/components/Fleet/SpecIcons.tsx:119 |
| `add` |  | frontend/src/components/Fleet/SpecIcons.tsx:121 |
| `close` |  | frontend/src/components/Fleet/SpecIcons.tsx:122 |
| `send` |  | frontend/src/components/Fleet/SpecIcons.tsx:124 |
| `spark` |  | frontend/src/components/Fleet/SpecIcons.tsx:126 |
| `levels` |  | frontend/src/components/Fleet/SpecIcons.tsx:128 |
| `guide` |  | frontend/src/components/Fleet/SpecIcons.tsx:131 |
| `engineering` |  | frontend/src/components/Fleet/SpecIcons.tsx:133 |
| `analytics` |  | frontend/src/components/Fleet/SpecIcons.tsx:135 |
| `warning` |  | frontend/src/components/Fleet/SpecIcons.tsx:138 |
| `target` | `location` | frontend/src/components/Fleet/SpecIcons.tsx:140 |
| `chart` |  | frontend/src/components/Fleet/SpecIcons.tsx:142 |
| `help` |  | frontend/src/components/Fleet/SpecIcons.tsx:143 |
| `rover` |  | frontend/src/components/Fleet/SpecIcons.tsx:145 |
| `layers` |  | frontend/src/components/Fleet/SpecIcons.tsx:147 |
| `pin` |  | frontend/src/components/Fleet/SpecIcons.tsx:149 |
| `cube` |  | frontend/src/components/Fleet/SpecIcons.tsx:151 |
| `error` |  | frontend/src/components/Fleet/SpecIcons.tsx:154 |
| `evidence` |  | frontend/src/components/Fleet/SpecIcons.tsx:156 |
| `limits` |  | frontend/src/components/Fleet/SpecIcons.tsx:158 |
| `report` |  | frontend/src/components/Fleet/SpecIcons.tsx:161 |
| `pdf` |  | frontend/src/components/Fleet/SpecIcons.tsx:163 |
| `download` |  | frontend/src/components/Fleet/SpecIcons.tsx:165 |
| `back` |  | frontend/src/components/Fleet/SpecIcons.tsx:167 |
| `language` |  | frontend/src/components/Fleet/SpecIcons.tsx:168 |
| `expand` |  | frontend/src/components/Fleet/SpecIcons.tsx:170 |
| `check` |  | frontend/src/components/Fleet/SpecIcons.tsx:172 |
| `route` |  | frontend/src/components/Fleet/SpecIcons.tsx:175 |
| `clock` |  | frontend/src/components/Fleet/SpecIcons.tsx:177 |
| `batterylow` |  | frontend/src/components/Fleet/SpecIcons.tsx:179 |
| `plug` |  | frontend/src/components/Fleet/SpecIcons.tsx:181 |
| `nodes` |  | frontend/src/components/Fleet/SpecIcons.tsx:183 |
| `shield` |  | frontend/src/components/Fleet/SpecIcons.tsx:185 |
| `terrain` | `slope` | frontend/src/components/Fleet/SpecIcons.tsx:187 |
| `flag` |  | frontend/src/components/Fleet/SpecIcons.tsx:189 |

### 1.9 Data colour ramps and fixed colours

Used by the 2-D map, overlays, panels and the 3-D view. Stops are listed as written in the source (RGB triples or hex).

| Name | Kind | Value / stops | Source |
|---|---|---|---|
| `COOLWARM_STOPS` | ramp | [59, 76, 192],[98, 130, 234],[141, 176, 254],[184, 208, 249],[221, 221, 221],[243, 199, 166],[237, 156, 122],[214, 96, 77],[180, 4, 38] | frontend/src/colormap.ts:4 |
| `MAGMA_STOPS` | ramp | [0, 0, 4],[27, 16, 69],[80, 18, 123],[129, 37, 129],[181, 54, 122],[229, 80, 100],[251, 135, 97],[254, 194, 135],[252, 253, 191] | frontend/src/colormap.ts:16 |
| `VIRIDIS_STOPS` | ramp | [68, 1, 84],[71, 44, 122],[59, 81, 139],[44, 113, 142],[33, 144, 141],[39, 173, 129],[92, 200, 99],[170, 220, 50],[253, 231, 37] | frontend/src/colormap.ts:28 |
| `RDYLGN_STOPS` | ramp | [165, 0, 38],[215, 48, 39],[244, 109, 67],[253, 174, 97],[254, 224, 139],[217, 239, 139],[166, 217, 106],[102, 189, 99],[26, 150, 65] | frontend/src/colormap.ts:40 |
| `REGOLITH_STOPS` | ramp | [5, 5, 6],[21, 21, 23],[42, 41, 40],[69, 66, 62],[92, 88, 82],[122, 116, 108],[154, 146, 136],[184, 175, 164],[212, 205, 195] | frontend/src/colormap.ts:52 |
| `START_MINT` | color |  | frontend/src/colormap.ts:69 |
| `GOAL_CORAL` | color |  | frontend/src/colormap.ts:70 |
| `ROUTE_CYAN` | color |  | frontend/src/colormap.ts:72 |
| `LAVENDER_ACCENT` | color |  | frontend/src/colormap.ts:73 |
| `riskToHex` | table |  | frontend/src/colormap.ts:82 |
| `riskToDash` | table |  | frontend/src/colormap.ts:114 |
| `batteryToHex` | table |  | frontend/src/colormap.ts:144 |
| `thermalToRgb#return@159` | color |  | frontend/src/colormap.ts:159 |
| `lunarRegolithToRgb#return@196` | color |  | frontend/src/colormap.ts:196 |
| `magmaToRgb#return@203` | color |  | frontend/src/colormap.ts:203 |
| `viridisToRgb#return@210` | color |  | frontend/src/colormap.ts:210 |
| `rdYlGnToRgb#return@217` | color |  | frontend/src/colormap.ts:217 |
| `grayReverseToRgb#return@224` | color |  | frontend/src/colormap.ts:224 |
| `ROUGHNESS_STOPS` | ramp | [26, 42, 58],[37, 92, 112],[88, 148, 130],[176, 178, 106],[226, 160, 74],[232, 118, 62] | frontend/src/colormap.ts:246 |
| `EARTH_VISIBILITY_STOPS` | ramp | [14, 18, 28],[24, 54, 78],[34, 104, 132],[58, 164, 186],[110, 216, 232] | frontend/src/colormap.ts:262 |
| `TIME_TO_HAVEN_STOPS` | ramp | [95, 227, 176],[140, 208, 140],[206, 200, 104],[226, 150, 84],[214, 96, 77] | frontend/src/colormap.ts:279 |
| `P_TRAVERSABLE_STOPS` | ramp | [70, 32, 44],[140, 70, 62],[214, 158, 84],[140, 152, 96],[58, 122, 96] | frontend/src/colormap.ts:296 |
| `SIGMA_STOPS` | ramp | [18, 24, 36],[40, 66, 96],[92, 106, 140],[168, 142, 148],[232, 196, 140] | frontend/src/colormap.ts:314 |
| `P_SAFE_STOPS` | ramp | [214, 76, 66],[222, 132, 78],[216, 186, 96],[150, 180, 112],[88, 176, 132] | frontend/src/colormap.ts:329 |
| `DWELL_STOPS` | ramp | [206, 86, 74],[220, 146, 84],[200, 190, 108],[128, 176, 148],[78, 150, 186] | frontend/src/colormap.ts:338 |
| `ACTION_SAFE_RGB` | color |  | frontend/src/colormap.ts:356 |
| `ACTION_DRIVE_RGB` | color |  | frontend/src/colormap.ts:358 |
| `ACTION_WAIT_RGB` | color |  | frontend/src/colormap.ts:360 |
| `ACTION_NONE_RGB` | color |  | frontend/src/colormap.ts:362 |
| `SIDE_INSIDE_RGB` | color |  | frontend/src/colormap.ts:365 |
| `SIDE_COLD_RGB` | color |  | frontend/src/colormap.ts:367 |
| `SIDE_HOT_RGB` | color |  | frontend/src/colormap.ts:369 |
| `CORRIDOR_RGB` | color |  | frontend/src/colormap.ts:379 |
| `LIT_SAFE_RGB` | color |  | frontend/src/colormap.ts:380 |
| `PSR_MASK_RGB` | color |  | frontend/src/colormap.ts:391 |
| `aspectToRgb#return@395` | color |  | frontend/src/colormap.ts:395 |
| `DARK_HOURS_STOPS` | ramp | [24, 40, 58],[42, 92, 116],[104, 138, 132],[196, 168, 96],[214, 120, 78] | frontend/src/features/safe-haven/overlays.ts:15 |
| `RAMP_STOPS` | table |  | frontend/src/features/time-axis/overlays.ts:15 |
| `SURFACE_ALBEDO` | color |  | frontend/src/TerrainCanvas3D.tsx:85 |
| `RAMP` | table |  | frontend/src/TerrainCanvas3D.tsx:92 |
| `FALLBACK_RAMP` | ramp |  | frontend/src/TerrainCanvas3D.tsx:101 |
| `ROCK_DISTANCE_STOPS` | ramp | [0xee, 0x5a, 0x52],[0xf0, 0x9a, 0x4a],[0xe8, 0xc8, 0x5a],[0x4f, 0xd0, 0x8a] | frontend/src/TerrainCanvas3D.tsx:742 |

### 1.10 Feature registry: placement of every panel

The cockpit renders panels from one ordered registry. Registration order is paint order within a slot. `modes` omitted means every cockpit mode `(all)`; an empty list means never `(none)`. Group `systems` moves a panel from the rails into the Systems drawer; `tab` places a right-rail panel in one of the four analyze tabs (Route, Safety, Analysis, Compare). Details in chapter 3.

| Order | id | slot | modes | group | tab | Source |
|---|---|---|---|---|---|---|
| 1 | mission-context | rightRail | analyze | primary | route | frontend/src/features/registry.ts:144 |
| 2 | mission-setup | leftRail | plan | primary | (none) | frontend/src/features/registry.ts:146 |
| 3 | mission-snapshot | leftRail | (none) | primary | (none) | frontend/src/features/registry.ts:156 |
| 4 | route-analysis | rightRail | analyze | primary | route | frontend/src/features/registry.ts:157 |
| 5 | safety-margins | rightRail | analyze | primary | safety | frontend/src/features/registry.ts:163 |
| 6 | route-model | rightRail | analyze | primary | safety | frontend/src/features/registry.ts:174 |
| 7 | playback | statusBar | analyze | primary | (none) | frontend/src/features/registry.ts:184 |
| 8 | time-axis | bottomDock | analyze | primary | (none) | frontend/src/features/registry.ts:187 |
| 9 | layer-picker | canvasOverlay | (all) | primary | (none) | frontend/src/features/registry.ts:193 |
| 10 | map-legend | canvasOverlay | (all) | primary | (none) | frontend/src/features/registry.ts:197 |
| 11 | analysis-layers | canvasOverlay | (all) | primary | (none) | frontend/src/features/registry.ts:203 |
| 12 | solving-indicator | canvasOverlay | (all) | primary | (none) | frontend/src/features/registry.ts:204 |
| 13 | ros-showcase | leftRail | (all) | systems | (none) | frontend/src/features/registry.ts:215 |
| 14 | layer-provenance | leftRail | (all) | systems | (none) | frontend/src/features/registry.ts:216 |
| 15 | replan | leftRail | plan | systems | (none) | frontend/src/features/registry.ts:219 |
| 16 | mission-constraints | leftRail | plan | systems | (none) | frontend/src/features/registry.ts:224 |
| 17 | psr-validation | leftRail | (all) | systems | (none) | frontend/src/features/registry.ts:229 |
| 18 | safe-haven | leftRail | (all) | systems | (none) | frontend/src/features/registry.ts:239 |
| 19 | earth-visibility | leftRail | (all) | systems | (none) | frontend/src/features/registry.ts:243 |
| 20 | coarse-fields | leftRail | (all) | systems | (none) | frontend/src/features/registry.ts:253 |
| 21 | thermal-envelope | leftRail | (all) | systems | (none) | frontend/src/features/registry.ts:259 |
| 22 | illumination-corridor | leftRail | (all) | systems | (none) | frontend/src/features/registry.ts:268 |
| 23 | mission-validation | rightRail | (all) | systems | (none) | frontend/src/features/registry.ts:276 |
| 24 | corridor | rightRail | (all) | systems | (none) | frontend/src/features/registry.ts:277 |
| 25 | pose-loop | rightRail | (all) | systems | (none) | frontend/src/features/registry.ts:278 |
| 26 | uncertainty | rightRail | analyze | primary | analysis | frontend/src/features/registry.ts:283 |
| 27 | stress-test | rightRail | analyze | primary | analysis | frontend/src/features/registry.ts:284 |
| 28 | risk-sweep | rightRail | analyze | primary | analysis | frontend/src/features/registry.ts:285 |
| 29 | benchmark | rightRail | analyze | primary | compare | frontend/src/features/registry.ts:289 |
| 30 | cost-explain | rightRail | analyze | primary | route | frontend/src/features/registry.ts:293 |
| 31 | assistant | globalOverlay | (all) | primary | (none) | frontend/src/features/registry.ts:296 |
| 32 | mission-report | globalOverlay | analyze | primary | (none) | frontend/src/features/registry.ts:301 |
| 33 | profile-compare | rightRail | analyze | primary | compare | frontend/src/features/registry.ts:304 |

### 1.11 Assets

Used assets are copied to `design-export/assets/` at their public path (22 files, 29.9 MB) with sha256 in `assets-manifest.json`.

| URL | Bytes | Used at |
|---|---|---|
| `/data/bsc5.bin` | 145536 | frontend/src/sky.ts:27 |
| `/fonts/archivo-latin-ext.woff2` | 32608 | frontend/src/App.css:48 |
| `/fonts/archivo-latin.woff2` | 34928 | frontend/src/App.css:38 |
| `/fonts/archivo-narrow-latin-ext.woff2` | 16536 | frontend/src/App.css:68 |
| `/fonts/archivo-narrow-latin.woff2` | 18692 | frontend/src/App.css:58 |
| `/fonts/azeret-mono-latin-ext.woff2` | 14844 | frontend/src/App.css:88 |
| `/fonts/azeret-mono-latin.woff2` | 26164 | frontend/src/App.css:78 |
| `/models/nasa_rocks/rock-15016.json` | 86254 | frontend/src/TerrainCanvas3D.tsx:421 |
| `/models/nasa_rocks/rock-15556.json` | 81454 | frontend/src/TerrainCanvas3D.tsx:422 |
| `/models/viper-rover-textured.glb` | 10062376 | frontend/src/TerrainCanvas3D.tsx:1445 |
| `/models/viper-rover.glb` | 9770808 | frontend/src/TerrainCanvas3D.tsx:1445 |
| `/rovers/cnsa_yutu_2.jpg` | 953095 | frontend/src/components/Fleet/roverMeta.ts:82, frontend/src/components/Fleet/roverMeta.ts:92 |
| `/rovers/lpr_1.jpg` | 1005035 | frontend/src/components/Fleet/roverMeta.ts:32 |
| `/rovers/luvmi_m.jpg` | 950987 | frontend/src/components/Fleet/roverMeta.ts:42, frontend/src/components/Fleet/roverMeta.ts:52 |
| `/rovers/nasa_viper.jpg` | 1005798 | frontend/src/components/Fleet/roverMeta.ts:62, frontend/src/components/Fleet/roverMeta.ts:72 |
| `/starimg.jpeg` | 91669 | frontend/src/SpaceBackdrop.tsx:79, frontend/src/SpaceBackdrop.tsx:90 |
| `/textures/earth_disc.jpg` | 928457 | frontend/src/TerrainCanvas3D.tsx:222 |
| `/textures/nac-site11-2048.jpg` | 1049139 | frontend/src/TerrainCanvas3D.tsx:145, frontend/src/App.css:4788 |
| `/textures/nac-site11-detail-2048.jpg` | 799465 | frontend/src/TerrainCanvas3D.tsx:170 |
| `/ui/chatbot_hero.png` | 250224 | frontend/src/features/assistant/ChatPanel.tsx:830 |
| `/ui/chatbot_logo.png` | 49667 | frontend/src/features/assistant/index.tsx:116 |
| `/videos/moon-backdrop-1080.mp4` | 4028441 | frontend/src/SpaceBackdrop.tsx:21 |

## 2. Entry flow, fleet hangar and top bar

### 2.1 Pre-cockpit UI inventory (LunaPath frontend)

**File aliases.** Every path sits under ``:
- `SB` = frontend\src\SpaceBackdrop.tsx
- `SS` = frontend\src\SplashScreen.tsx
- `LP` = frontend\src\LandingPage.tsx
- `FSV` = frontend\src\components\Fleet\FleetSelectionView.tsx
- `RM` = frontend\src\components\Fleet\roverMeta.ts
- `SI` = frontend\src\components\Fleet\SpecIcons.tsx
- `TB` = frontend\src\components\TopBar\TopBar.tsx
- `LPM` = frontend\src\components\LunaPathMark.tsx
- `LRM` = frontend\src\components\LunaPathRouteMark.tsx
- `PU` = frontend\src\shell\phaseUrl.ts
- `APP` = frontend\src\App.tsx
- `CSS` = frontend\src\App.css
- `RP` = frontend\src\features\mission-setup\RoutePriorities.tsx (rendered inside the hangar dock)
- `UMP` = frontend\src\features\mission-setup\useMissionProfiles.ts
- `BC` = backend\app\constants.py
- `BS` = backend\app\scenarios.py
- `VR` = frontend\public\videos\README.md

**There is no design canvas in the repo.** LP:15, TB:35 and CSS:2 all cite a "design canvas" as the source. A grep of the whole repo finds no file for it, so it is a missing external input.

#### 0. Global frame

| Item | Fact |
|---|---|
| Mount model | One React tree, mounted once. `SpaceBackdrop` is always mounted (APP:998). Landing and fleet mount only in their phase (APP:1023, 1028). `.app-shell` (TopBar and cockpit) is always mounted and hidden by class (APP:1047). There is no router (PU:4-14). |
| Phase state | `phase` comes from `phaseFromHref` on load (APP:136-138). `missionMode` comes from the URL (APP:152-154). The boot splash shows while `splashOpen` is true (APP:143). `crossing` is `{caption, then}` or null (APP:146). |
| z-stack | splash-screen 200 (CSS:5859) > landing 131 (CSS:544) = fleet 131 (CSS:4782) > backdrop 130 in ambient/feature (CSS:424-430), 0 in deck (CSS:418) > app-shell 1 (CSS:512). `.lp-topbar` is 50 inside the shell (CSS:2457). |
| Fonts | Archivo 300-800, Archivo Narrow 400-700, Azeret Mono 400-500, self-hosted woff2 (CSS:33-90). Tokens: `--font-body/display/label/data` (CSS:256-259). |
| Key tokens | `--void #05070d`, `--bg-card #0c1018`, `--bg-raised #0e131d`, `--text #e7eaf1`, `--text-2 #c8cddb`, `--text-3 #98a1b4`, `--text-muted #8b94a6`, `--text-dim #808a9d`, `--text-dim-2 #7b8497`, `--text-dimmest #757f92`, `--lavender #baaff5`, `--lavender-bright #cfc7ff`, `--mint #5fe3b0`, `--mint-text #93dcc4`, `--cyan #4fd8f0`, `--cyan-text #8fe6f5`, `--coral #ed856e`, `--risk-med #e3d548`, `--radius 2px`, `--shadow-float 0 20px 46px rgba(0,0,0,.6)` (CSS:92-290) |
| Type scale | micro and small 12, body 13, strong 15, value 16, title 18, display 24, hero 30 (CSS:216-225). Tracking: tight .02em, normal .04em, label .06em, caps .08em, hero .24em (CSS:237-243). |
| Global CSS | `body{overflow:hidden; line-height:1.5; background: var(--void)}` (CSS:372-382). All scrollbars hidden (CSS:397-406). `:focus-visible` is a 2px lavender outline at 2px offset (CSS:319-323). index.html sets an inline body bg `#05070d`. React StrictMode is on (main.tsx). |

#### 1. Screens in user-flow order

**S0 — Boot splash** (`mode="boot"`, APP:1005-1012). It sits over everything until the bootstrap finishes.
- **DOM** (SS:197-210, 121-145):
  - `section.splash-screen[role=status][aria-live=polite]` (+`.is-leaving`) > `div.splash-content`
  - `div.splash-content` holds:
    - `div.splash-identity`: `<LunaPathMark size=128 class="splash-mark">`, `span.loading-brand`, `span.splash-tagline`
    - `div.splash-progress`: `div.loading-copy-row` (`span.loading-copy`, `span.loading-percent`), then `div.loading-bar-track > div.loading-bar-fill(.is-failed)` with inline width
    - optional `p.splash-error`
- **Text:**
  - `LunaPath`, which renders as "LUNAPATH" via `text-transform:uppercase` (CSS:613)
  - `Lunar south pole mission planning`
  - Stage labels and percents (SS:28-34):
    - health: `Contacting mission backend` 12%
    - dem: `Loading lunar elevation model` 34%. Only shown if `!health.dem_loaded` (APP:343).
    - rovers: `Reading rover catalogue` 52%
    - layers: `Fetching terrain layers` 88%
    - ready: `Mission systems ready` 100%
  - Error state: `Boot failed`, `--`, bar at 100% coral, `<p>` = layerError ?? `Bootstrap failed.` (APP:1009)
  - Stall state (SS:119,143): `Still waiting on {label lowercased}. Check that the API is running on port 8000.`
- **Visuals:**
  - LunaPathMark SVG, viewBox 200 (LPM:31-98):
    - coral ring r91, stroke 5
    - coral upper arc, stroke 2.4
    - `var(--text)` lunar surface cut by a mask: 2 road triangles and 8 crater ellipses
    - lavender arrow
  - Starfield `::before`: 8 tiled radial gradients, opacity .85 (CSS:5876-5893)
  - Lavender glow `::after`, at 50% 42%, .13 (CSS:5896-5906)
- **CSS:**
  - `.splash-screen`: grid centred, padding 32, opaque void, opacity/visibility .52s (CSS:5856-5865)
  - `.splash-content`: column, gap 34, width min(420px,100%) (CSS:5960-5965)
  - `.splash-identity`: gap 8; `.splash-mark`: mb 14 (CSS:5967-5977)
  - brand: 30px, weight 600, .24em (CSS:606-614, 5979)
  - tagline: text-dim-2, label font, 12px (CSS:5983)
  - progress: gap 9 (CSS:5990)
  - copy and percent: lavender, label font, 12px (CSS:661-668)
  - track: 3px, `rgba(70,76,120,.36)` (CSS:874)
  - fill: lavender→text-2 gradient, width .45s ease (CSS:880-884)
  - failed: coral (CSS:5997); error text: coral mono 12/1.55 (CSS:6001)

**S1 — Landing** (`phase==='landing'`, APP:1023). It is already mounted under S0 on first load.
- **DOM** (LP:27-76):
  - `section.landing-screen(.is-exiting)` > `div.landing-content`, a grid with rows auto/1fr/auto
  - `header.landing-topline`:
    - `div.landing-brand`: `span.landing-brand-mark` and `span.landing-brand-sub`
    - `div.landing-status`: a plain `span`, and `span.landing-link` containing `i.landing-link-dot`
  - `div.landing-main > div.landing-copy`: `p.landing-kicker`, `h1`, `p.landing-description`, `div.landing-actions > button.landing-explore-button`
  - `footer.landing-footline > div.landing-capabilities[aria-label="Key mission planning features"]` with 3 spans
- **Text, verbatim:**
  - `LUNAPATH` · `Mission Workstation` · `Lunar south pole, 89.15°S` · `Data link active`
  - `Lunar south pole mission planning`
  - `Plan and analyze rover routes across the lunar south pole.`
  - `LunaPath combines terrain, slope, shadow, thermal and energy-aware route planning with 2D/3D mission analysis.`
  - `Launch Mission Workstation`
  - `Terrain analysis` · `Energy-aware routing` · `3-D mission simulation`
- **Images:** none of its own. The backdrop clip shows through the transparent screen, under a scrim `::before` (100deg gradient: .97 / .88 at 34% / .3 at 66% / .55) (CSS:562-575).
- **CSS** (CSS:541-811):
  - topline: padding 22/40, bottom hairline `rgba(199,205,219,.06)`
  - brand-mark: 16px, 600, .24em, uppercase
  - brand-sub: text-dim-2, label font, 12px
  - status: gap 22, text-dim, label font, 12px
  - link dot: 5px, mint
  - main: padding 0 40; copy: max-width 620
  - kicker: lavender, margin-bottom 26
  - h1: `clamp(2rem,3.2vw,50px)`, weight 300, lh 1.08, ls -.015em, `text-wrap:pretty`
  - description: mt 26, max-width 520, text-3, 16px, 300, lh 1.65
  - actions: mt 40, gap 18
  - button: padding 13/26, lavender fill, ink #0a0c14, 15px, 600, .04em
  - footline: padding 20/40, top hairline; capabilities: gap 28, text-muted, 12px
- **Responsive:**
  - ≤980: content padding 24/20 (CSS:2012-2019)
  - ≤640: topline/footline padding 16/18, status hidden, brand 18px, h1 `clamp(1.7rem,6vw,2.4rem)`, button full width up to 320 (CSS:2086-2138)

**S2 — Transition curtain**, Landing→Hangar (APP:1014-1021, SS:149-184).
- **DOM:** the same SplashFrame with `.is-entering`. `div.splash-progress` holds `div.loading-copy-row > span.loading-copy` and `div.loading-bar-track > div.loading-bar-fill.is-timed`. There is no percent.
- **Text:** the brand block plus caption `Opening fleet hangar` (APP:450).

**S3 — Fleet hangar** (`phase==='fleet'`, APP:1028-1045).
- **Wrapper:** `div.fleet-screen`: fixed, overflow-y auto, bg `url('/textures/nac-site11-2048.jpg') center/cover` plus void (CSS:4779-4789).
- **Fallback** when `rovers.length===0`: `div.fleet-screen-loading` showing `Loading rover catalogue…`, or on error layerError ?? `The rover catalogue could not be loaded.` (APP:1038-1042, CSS:4791-4802).
- **Main DOM** (FSV:76-280), inside `div.lp-fleet-view`:
  - `header.lp-fleet-header > div.lp-fleet-header-content`:
    - `h1.lp-fleet-headline` `Select Mission Exploration Rover`
    - `p.lp-fleet-subhead` `Each rover possesses distinct mass, climbing capabilities, battery storage, and scientific payloads. Select a vehicle to configure kinematic routing parameters before deploying to the lunar surface map.`
  - `div.lp-fleet-carousel`: `button.lp-carousel-arrow[aria-label="Previous rover"]` (svg path `M15 4 7 12l8 8`, stroke 1.6), then `article.lp-fleet-card(.is-selected)`, then a Next arrow (`m9 4 8 8-8 8`)
  - `article.lp-fleet-card`:
    - `div.lp-card-photo-box`:
      - `img.lp-card-photo`, `div.lp-card-photo-gradient`
      - `div.lp-card-photo-badges`: `span.lp-card-agency` (inline border/colour = agencyColor), plus `span.lp-card-active-pill` (`span.lp-pulse-dot` + `SELECTED VEHICLE`) when selected
      - `div.lp-card-photo-footer > span.lp-card-highlight`
    - `div.lp-card-body`:
      - `div.lp-card-title-row`: `h2.lp-card-name`, `span.lp-card-code` = `id.toUpperCase()`
      - `p.lp-card-description`
      - `div.lp-card-specs-grid`, 4× `div.lp-card-spec-item`, each `span.lp-card-spec-k` (Icon + label) and `strong.lp-card-spec-v`
      - `div.lp-card-payload-box`: `span.lp-card-payload-title` `Science and sensor suite`, `p.lp-card-payload-text`
    - `div.lp-card-action-bar > button.lp-card-select-btn(.is-selected)`: `Select Rover` / `✓ Assigned For Mission`
  - `div.lp-fleet-thumbs[aria-label="Rover catalogue"]`: one `button.lp-fleet-thumb(.is-current)(.is-assigned)` per rover, holding `img[loading=lazy]` and `span.lp-fleet-thumb-name`
  - `section.lp-fleet-bottom-dock`:
    - `header.lp-dock-header`:
      - `h2.lp-dock-title`: Icon `tune` + `Mission Configuration`
      - `p.lp-dock-subtitle` `Set your exploration profile and route priorities for the selected rover.`
      - `span.lp-dock-tagline` `Real science. A brighter tomorrow.`, rendered uppercase (CSS:5299)
    - `div.lp-dock-body`:
      - `div.lp-dock-priorities-col` > `<RoutePriorities/>`
      - `div.lp-dock-action-col`:
        - `div.lp-dock-ready`: `span.lp-dock-ready-state(.is-ready)` (dot + `Mission ready` / `Awaiting rover`), `span.lp-meta-label` `Selected rover`, `div.lp-dock-rover-id` (agency pill + `strong.lp-dock-rover-name`), `span.lp-dock-rover-facts` `{roverClass} · {mass} kg · {cap} Wh`. If nothing is selected it shows `strong.lp-dock-rover-name.is-empty` `Choose a vehicle above`.
        - `button.lp-deploy-btn`: `Deploy Rover & Open Surface Map` + `span.lp-deploy-arrow` `→`
        - `p.lp-dock-deploy-note`: Icon `map` + `Configure the rover and generate an optimal route on the lunar surface map.`
- **RoutePriorities DOM** (RP:173-328), inside `div.lp-priorities`:
  - Step 1, `div.lp-priorities-presets`:
    - `.lp-dock-step`: `span.lp-step-index` `1`, `span.lp-step-name` `Mission profile`
    - `p.lp-step-hint` `Choose an operational profile. This sets the base behaviour for the A* route solver.`
    - `.lp-profile-block > .lp-profile-cards[role=group]`: `button.lp-profile-card(.is-active)[aria-pressed]` with inline `--profile-color`, holding Icon `.lp-profile-card-icon`, `.lp-profile-card-name`, `.lp-profile-card-desc`
    - `.lp-profile-constraints`: 4× `.lp-profile-constraint` (label, value, badge `IN SEARCH`/`POST-SIM` with title tooltips at RP:229-233)
    - Loading text: `Loading mission profiles…`
  - Step 2, `div.lp-priorities-weights`:
    - `2` `Route priorities`
    - hint `Adjust the relative importance of each factor. Higher values make the A* solver work harder to avoid that hazard.`
    - `.lp-priority-sliders`: per weight a `.lp-slider-block > .lp-slider-row`, holding `span.lp-slider-label` (Icon + label + `button.lp-info-btn` with Icon `info`), `input[type=range].lp-range-input` (0–2, step .01) and `input[type=number].lp-weight-input` (step .001, shows `toFixed(3)`). An optional `p.lp-info-pop[role=note]` holds the description (RP:52-76).
    - Weight labels: `Slope Safety`, `Energy Use`, `Shadow Exposure`, `Thermal Risk`, and `Surface Roughness` only if the roughness layer is loaded (RP:73-79, 117-119).
- **CSS:** fleet CSS:4804-5562 and 5616-5643; RP CSS:3091-3359, 5309-5497. Details in §5.

**S4 — Transition curtain**, Hangar→Cockpit. Same as S2 with caption `Deploying to surface map` (APP:454).

**S5 — Cockpit entry.** `.app-shell.is-visible` (APP:1047), then the TopBar (§6). The backdrop switches to `deck`.

**Return paths:**
- `Change vehicle` (frontend\src\features\mission-setup\MissionSetupPanel.tsx:393-400) calls `setPhase('fleet')` with **no curtain** (APP:446-448, 457-459).
- Browser Back/Forward goes through popstate and sets phase and mode directly, also with no curtain (APP:406-414).

#### 2. Interactions

| Where | Trigger | Effect | file:line |
|---|---|---|---|
| Landing | click button | `setIsExploring(true)` (adds `.is-exiting`, disables button), then `onExplore` → `cross('Opening fleet hangar')` | LP:56-60, APP:449-451 |
| Landing button | hover / active / disabled | bg→lavender-bright 140ms / scale .985 / opacity .4 | CSS:721-735 |
| Hangar | Prev/Next arrows | `step(±1)` wraps modulo; disabled if <2 rovers | FSV:46-52, 90-100, 170-180 |
| Hangar | window keydown ArrowLeft/Right | step; ignored when an INPUT/TEXTAREA is focused | FSV:57-66 |
| Hangar | thumbnail click | `setViewIndex(i)`; view only, no selection | FSV:194 |
| Hangar | `Select Rover` | `handleRoverSelect`: no-op if same id; else set id, **overwrite weights with rover.default_weights**, clear plan/execution/error, stop playback, mode `plan` | FSV:163, APP:612-625 |
| Hangar | Deploy (disabled if `!selectedRover`) | `cross('Deploying to surface map', setPhase('app'))` | FSV:263-271, APP:453-455 |
| Hangar | viewIndex guard | resets to 0 if out of range | FSV:42-44 |
| Dock | profile card click | `applyProfile`: copies only the 4 core weights | RP:203, UMP:69-75 |
| Dock | info button | toggles one panel at a time; Escape or mousedown outside the sliders closes it | RP:124, 136-150, 277-286 |
| Dock | range drag / number typing | set weight; typed values parsed and clamped to [0,2]; draft string kept until blur | RP:152-170, 288-315 |
| Hangar | scroll | `.fleet-screen` overflow-y auto; the background image stays on the fixed container | CSS:4783-4788 |
| TopBar | brand `LUNAPATH` | `onModeChange('plan')`; does not go to landing | TB:57-64 |
| TopBar | PLAN / ANALYZE / Systems | mode switch; ANALYZE guarded by `hasRoute`; Systems toggles drawer | TB:67-114 |
| Global | phase/mode change | `history.pushState` unless the URL already parses to the same location | APP:395-404 |
| Global | popstate | `setPhase` + `setMissionMode` from URL | APP:406-414 |
| Global | `?stage=analysis` without a route | falls back to `plan`, and the URL is rewritten | APP:431-435 |
| Global | Ctrl/Cmd+Z | window listener active in every phase; acts only if a placement exists | APP:593-610 |

**How `cross()` works:**
- `cross` is `useCallback((caption, then) => setCrossing(cur => cur ? cur : {caption, then}))` (APP:442-444).
- While a cross is in flight, a second call is **dropped, not queued**.
- Rendering: `{crossing && <SplashScreen mode="transition" caption onMidpoint={crossing.then} onDone={() => setCrossing(null)}/>}` (APP:1014-1021).
- TransitionSplash sets its timers in a mount-only effect (SS:156-168): `setTimeout(onMidpoint, 620)`, `setTimeout(setLeaving(true), 1500)`, `setTimeout(onDone, 2020)`.

**Cross timeline:**

| t (ms) | Event |
|---|---|
| 0 | Curtain mounts (z200, opaque). `splash-draw` fades opacity 0→1 over .3s. identity/progress `splash-rise` .6s (progress +.16s). Timed bar 4%→100% over 1.5s. Landing `.is-exiting` starts its .75s fade/scale/blur underneath. |
| 620 | `then()` → `setPhase`. Old screen unmounts, new one mounts. URL is pushed (`?stage=hangar` / `?stage=planner`). For deploy: app-shell reveal .6s (done at 1220); backdrop deck: z 130→0 instantly, opacity .95→.55 over .75s, scale 1.06→1 over 1.2s. |
| 1500 | `.is-leaving` (opacity 0 / visibility hidden over .52s; see G4) |
| 2020 | `setCrossing(null)` → unmount |

**Boot timing:**
- `MIN_VISIBLE_MS` 3000 (SS:37). It leaves only when error is null, the floor has passed, and stage is `ready`.
- Exit takes `EXIT_MS` 520 and then `onDone` → `setSplashOpen(false)` (SS:111-116, APP:928).
- `STALL_MS` 9000, restarted per stage (SS:66, 101-106).
- An error keeps the splash open forever (SS:108-112).
- Bootstrap order: health → dem (conditional) → rovers → 7 layers in parallel → ready (APP:337-385).

**Deep links** (PU:92-143):

| URL | Result |
|---|---|
| (none) | landing |
| `?stage=hangar` | fleet |
| `?stage=planner` | app/plan |
| `?stage=analysis` | app/analyze |
| `?app` or a hash containing `planner` | app/plan |
| unknown | landing |

Landing removes `stage`. Legacy flags are stripped when the URL is next written, and a trailing `?` is trimmed.

#### 3. Animations and keyframes

| Name | Def | Duration / easing / fill | What moves | Used on | Reduced motion |
|---|---|---|---|---|---|
| landing-rise | CSS:762-771 | .72s cubic-bezier(.22,.61,.36,1) both | opacity 0→1, translateY 14→0 | topline (delay .05), kicker .24, h1 .34, description .46, actions .58, footline .7 (CSS:773-801) | none (CSS:805-811) |
| splash-rise | CSS:6012-6021 | .6s same easing, both | opacity, translateY 10→0 | identity; progress delay .16 (CSS:6023-6030) | none (CSS:6032-6037) |
| splash-draw | CSS:5915-5922 | .3s ease both | opacity 0→1 | `.splash-screen.is-entering` (transition mode only) | none (CSS:5944-5947) |
| splash-timed-bar | CSS:5930-5937 | 1.5s cubic-bezier(.33,.9,.5,1) both | width 4%→100% | `.loading-bar-fill.is-timed` | none → static width 100% (CSS:5940, 5949) |
| lp-pulse | CSS:4290 | — | opacity .4→1 | **never applied** | — |

**Transitions:**
- backdrop media: opacity .75s ease, transform 1.2s ease (CSS:443)
- vignette: opacity .75s (CSS:457)
- `.app-shell`: opacity/transform/filter .6s ease. Hidden state = opacity 0, visibility hidden, `translateY(18px) scale(.985)`, `blur(18px)` (CSS:520-537).
- `.landing-screen`: .75s. Exiting = opacity 0, scale 1.03, blur 10px (CSS:547-556).
- `.splash-screen`: opacity/visibility .52s (CSS:5864)
- loading fill: width .45s (CSS:883)
- fleet card: border .25s cubic-bezier(.16,1,.3,1) (CSS:5004)
- card photo: transform .4s, hover scale 1.04 (CSS:5044-5049)
- select button: `all .15s` (CSS:5230)
- deploy arrow: .2s, translateX 4px on hover (CSS:5557-5562)
- 140ms colour/border/background on arrows, thumbs, thumb img opacity, landing and deploy buttons, profile cards, info button, weight input, mode buttons, Systems (CSS:4884, 4926, 4935, 721, 5538, 3118, 3280, 3319, 2500, 2592)
- range thumb: scale 1.25 over 120ms (CSS:3354-3358)

**Reduced motion:**
- SB swaps the `<video>` for `<img src="/starimg.jpeg">` and listens live for changes (SB:45-51, 74-91). The CSS keyframes above are disabled.
- All transitions above, and the JS curtain timing, are unchanged.

#### 4. SpaceBackdrop

- **DOM** (SB:68-101): `div.space-backdrop.space-backdrop--{stage}[aria-hidden]` with style `--backdrop-opacity`, containing `video|img.space-backdrop-media`, `div.space-backdrop-vignette` and `div.space-backdrop-terminator`.
- **Video:**
  - `src=/videos/moon-backdrop-1080.mp4`, `poster=/starimg.jpeg`, `autoPlay muted loop playsInline preload="metadata"` (SB:21, 75-88)
  - `frozen` → `pause()`; otherwise `play().catch(()=>{})` (SB:53-66)
  - `.space-backdrop` is fixed, inset 0, pointer-events none, bg void (CSS:415-422)
  - Media: object-fit cover, `opacity: var(--backdrop-opacity)`, `scale(var(--backdrop-scale,1))` (CSS:432-444)
- **Stage per phase:** `phase==='app' ? 'deck' : 'ambient'` (APP:999). So landing and fleet are both ambient. `frozen={planningEngaged}` (APP:1000) latches true once `clickMode!=='idle'` (APP:461-465) and is never reset.

| Stage | Opacity (SB:24-31) | z | Scale | Vignette |
|---|---|---|---|---|
| ambient | .95 | 130 | 1.06 (CSS:450-452) | 100deg (.94 / .82@26 / .32@52 / .08@72 / .28) + 180deg (.55 → transparent 22–74% → .7) (CSS:471-488) |
| feature | 1 | 130 | 1 | opacity .45 but no background (CSS:462) — **never used** |
| deck | .55 | 0 | 1 | no background at all |

- **Terminator:** bottom 38vh, `radial-gradient(120% 100% at 50% 100%, rgba(227,213,72,.14), transparent 70%)`, all stages (CSS:493-502).
- **No blur** on the backdrop itself.
- **Persistence:** one element at the App root. It is never remounted; only class and CSS variable change.

#### 5. Fleet hangar data

**Rover cards.** Order = backend dict order BC:230-396. The default rover is `lpr_1` (BC:398). The spec format comes from FSV:20-23.

| id / code | name (backend) | Battery | Max speed | Climb | Mass |
|---|---|---|---|---|---|
| lpr_1 / LPR_1 | LPR-1 (Default) | 5420 Wh | 0.20 m/s | 25° | 450 kg |
| luvmi_m / LUVMI_M | LUVMI-M | 1400 Wh | 0.05 m/s | 25° | 40 kg |
| nasa_viper / NASA_VIPER | NASA VIPER | 4000 Wh | 0.06 m/s | 20° | 450 kg |
| cnsa_yutu_2 / CNSA_YUTU_2 | CNSA Yutu-2 | 1500 Wh | 0.05 m/s | 20° | 140 kg |

Spec labels and icons: `Battery capacity` (battery), `Max speed` (speed), `Max climb slope` (climb), `Total mass` (mass).

**roverMeta, verbatim** (RM:25-96). Aliases: `luvm_m` = luvmi_m, `viper` = nasa_viper, `yutu_2` = cnsa_yutu_2. Lookup falls back by substring and then to lpr_1 (RM:98-106).

- **lpr_1:**
  - Agency and colour: `ESA / LUNAPATH`, `#4fd8f0`
  - Class: `Exploration`
  - Highlight: `Flagship Autonomous Polar Explorer`
  - Payload: `360° LiDAR Turret, Panoramic Stereo NavCam, Deep Regolith Temperature Probes`
  - Image: `/rovers/lpr_1.jpg`
  - Description: `High-endurance heavy science explorer engineered for long-distance polar traverses. Features dual solar arrays and regenerative cryogenic battery packs.`
- **luvmi_m:**
  - Agency and colour: `LUNAPATH EXP`, `#b3a5ff`
  - Class: `Scout`
  - Highlight: `Agile Crater Descent Micro-Rover`
  - Payload: `High-Torque Mesh Wheels, Micro-LiDAR, Stereo Camera Mast, Rock Abrasion Tool`
  - Image: `/rovers/luvmi_m.jpg`
  - Description: `Ultra-compact robotic scout specifically designed to descend steep crater slopes and explore narrow shadowed terrain inaccessible to larger vehicles.`
- **nasa_viper:**
  - Agency and colour: `NASA`, `#e8c85a`
  - Class: `Prospector`
  - Highlight: `Subsurface Volatiles Prospector`
  - Payload: `The TRIDENT 1-Meter Hammer Drill, Neutron Spectrometer System (NSS), NIRVSS`
  - Image: `/rovers/nasa_viper.jpg`
  - Description: `NASA premier volatile prospecting rover equipped with a heavy hammer drill and spectrometers to hunt for sub-surface water ice inside permanently shadowed regions.`
- **cnsa_yutu_2:**
  - Agency and colour: `CNSA`, `#ee5a52`
  - Class: `Endurance`
  - Highlight: `Far-Side Lunar Endurance Rover`
  - Payload: `Lunar Penetrating Radar (LPR), Visible & Near-Infrared Imaging Spectrometer (VNIS)`
  - Image: `/rovers/cnsa_yutu_2.jpg`
  - Description: `Lightweight solar-powered lunar rover holding world records for lunar surface operational longevity on the rugged terrain of the Moon.`

**Profiles** (BS:18-91). Badges: only `max_slope_deg` shows IN SEARCH; the other three show POST-SIM (BS:99-104, 186-192). Constraint format at RP:104-107.

| Name | Description | Colour | Max Slope / Max Shadow / Energy Budget / Min SoC |
|---|---|---|---|
| Balanced Recon | Standard mode; weighs every risk evenly. | #3B82F6 | 25° / 40 h / 4000 Wh / 20% |
| Energy Saver | Accepts a longer route to protect the battery. | #22C55E | 20° / 30 h / 2500 Wh / 35% |
| Fast Recon | More aggressive; prefers the shorter route. | #EF4444 | 25° / 50 h / 5000 Wh / 10% |
| Shadow Traverse | Crossing shadow is unavoidable; thermal safety is critical. | #A855F7 | 25° / 45 h / 4000 Wh / 25% |

- Icons: balance, eco, speed, shadow (RP:85-90).
- Balanced weights = the lpr_1 defaults 0.409 / 0.259 / 0.142 / 0.190 (BC:262-265, 555-558). So **Balanced Recon renders active on the first visit** (match within ±0.011, UMP:16).

**States:**
- **Card:**
  - Base: 1px border `rgba(79,216,240,.16)`, `--shadow-float`
  - Hover: border .3, photo scale 1.04
  - `.is-selected`: 2px cyan border, bg raised→card gradient, photo gradient retinted, pill shown, button mint (CSS:4987-5059, 5239-5244)
- **Thumbs:**
  - Base: 136px wide, img 62px tall at opacity .55
  - Hover: opacity .85
  - `.is-current`: lavender border, opacity 1
  - `.is-assigned`: `::after ' ✓'` in mint (CSS:4915-4972)
- **Arrows:** 44px (34px at ≤900); disabled at opacity .3 (CSS:4872-4900, 4974-4984)
- **Dock dot:** grey (text-dimmest) → mint when ready (CSS:5408-5420)
- **Deploy:** disabled at .4 with not-allowed cursor (CSS:5550)
- **Card layout:** 2 columns (.95fr / 1.05fr), photo min-height 360. At ≤900 one column with photo height 200 (CSS:4995-4997, 5025, 5616-5643).
- **Dock layout:** at ≤1240 the action column drops below; at ≤820 priorities go to one column (CSS:5461-5497).

**SpecIcons:** 49 Material Symbols Outlined paths. viewBox `0 -960 960 960`, `fill=currentColor`, `aria-hidden`, class `lp-icon` (SI:95-213). `.lp-icon` is 1em×1em with vertical-align -.125em (CSS:3261-3266). The hangar uses battery, speed, climb, mass, tune, map, info, slope, energy, shadow, thermal, terrain, balance and eco.

#### 6. TopBar (lives in app-shell; mounted always, visible only in `app`)

- **Left side:**
  - `button.lp-brand` `LUNAPATH`, title `Back to mission planning`
  - `div.lp-mode-switch[role=group][aria-label="Mission mode"]` with `PLAN` and `ANALYZE`
    - PLAN is disabled while solving.
    - ANALYZE is disabled when there is no route or while solving. Its title is `Inspect trajectory engineering metrics` with a route, else `Generate a route first to unlock Mission Analysis`.
  - `span.lp-route-required` `Route required` when there is no route (TB:55-91)
- **Right side:**
  - `div#lp-topbar-report-slot` (`display:contents`, Mission Report portal)
  - `button.lp-systems-toggle` `Systems`, title `ROS bridge, reality check, provenance, corridor, pose loop and replan triggers`
  - `Mission {SOLVING | missionStatus}`
  - `Data link` + dot + `ACTIVE`/`SYNCING` (TB:93-130)
- **Inputs:**
  - `missionStatus` = `ATTN` if layerError, else `SOLVING`, else `LOCKED` if a plan exists, else `NOMINAL` (APP:817)
  - `dataLinkActive` = all 7 layers loaded (APP:749-757)
- **State on first cockpit entry:** PLAN active, ANALYZE disabled, "Route required", NOMINAL, ACTIVE.
- **CSS** (CSS:2447-2604):
  - bar: 52px, bg-surface, bottom hairline, padding 0 18
  - left gap 26; right gap 24, mono 12px, .08em
  - active mode: lavender fill with dark ink; disabled at opacity .38
  - status: `.is-nominal` mint-text, `.is-solving` lavender
  - link dot: mint, offline risk-med
  - Systems: hover border `--line-button`; active lavender-bright with `--line-accent`

#### 7. Design rationale (brief quotes)

- **SB:6-9:** "never remounted between phases -- swapping it in and out would restart playback and re-buffer"
- **SB:15-17:** "A missing file is not a failure state -- the poster is `starimg.jpeg`"
- **SB:84-86:** "Not "auto": that fetches all 3.8 MB before the page fires `load`"
- **SS:13-15:** "A bar that fills on a timer … is a progress bar in the same sense that a drawn thermometer is a temperature."
- **SS:21-22:** "The stage swaps at the midpoint, while the screen is opaque"
- **SS:43-46:** a curtain, not a boot. 1.5s is "the shortest beat that still reads as deliberate"
- **SS:56-64:** the stall note exists because a dead uvicorn worker "accepts the connection and never answers"
- **LP:10-13:** the Three.js moon was removed: "two of them on one screen read as a mistake"
- **APP:439-441:** "The landing button used to call this twice" (the reason for the cross guard)
- **APP:446-448:** "Change vehicle" has no curtain: "a correction, not a departure"
- **PU:4-9:** "Not routing … A router … would restart the video". PU:20-23: a query param, so static hosts don't 404. PU:25-28: no mission state in the URL.
- **FSV:33-37:** "You look with the arrows; you commit with the button."
- **TB:40-42:** ANALYZE is "Disabled rather than hidden … a mode that vanishes reads as a bug"
- **CSS:7-12:** "No glassmorphism … 2px radius … Mono is for measured data only"
- **CSS:705-706 / 5506-5509:** one solid-lavender surface per screen
- **CSS:4848-4852:** one rover at a time. CSS:4999-5003: the card is not a click target.
- **CSS:5850-5855:** the boot screen is opaque so the moon doesn't look like it has already started
- **CSS:5867-5875:** a drawn starfield, with no request
- **SI:6-12:** inline icons so a jury laptop with no wifi still renders them
- **LPM:18-22:** the wordmark is deliberately not in the emblem

#### 8. Gray points (things a re-implementer cannot settle from the code alone)

**What actually renders**

1. **The backdrop is hidden in the cockpit.** `.app-shell` is declared `background: transparent` (CSS:519) and later `background: var(--void)` (CSS:5568). The later rule wins, so in deck (z 0) the clip sits behind an opaque shell and the .55 deck opacity is likely never seen.
2. **The backdrop is hidden in the hangar.** `.fleet-screen` (z131) has an opaque NAC photo background (CSS:4788) over the ambient backdrop (z130). In practice the clip is visible on the landing only.
3. **The deck vignette draws nothing.** SB:93-95 describes a "vertical vignette" for topbar legibility, but no CSS gives `.space-backdrop-vignette` a background outside `--ambient`. The `feature` stage (SB:28, CSS:428-430, 462-464) is never passed (APP:999). The "Tailwind utility" comment (CSS:470) is stale: package.json has no Tailwind.
4. **The curtain exit fade probably never plays. Verify this in a browser.** TransitionSplash always sets `entering` (SS:171). By the CSS cascade, the finished `splash-draw … both` fill keeps `opacity:1` over `.is-leaving{opacity:0}` (CSS:5925 vs 5954). The likely result is a hard cut at ~2020ms. With reduced motion the animation is none, so it does fade.
5. **The landing entrance is never seen on first load.** The stagger ends at about 1.42s, under the opaque boot splash (≥3000+520ms). It is only seen after a Back/popstate remount.
6. **The app-shell reveal is hidden too.** The .6s reveal and the backdrop settle finish under the curtain (620→1220ms, before 1500). They are visible only on popstate paths. `visibility` is not in the shell's transition list (CSS:520), so hiding is instant.

**Bugs and code that contradicts its comments**

7. **Wrong text after a stall.** SS:102 returns on `ready` without clearing `stalled`, so a boot that stalled and then succeeded shows "Still waiting on mission systems ready. Check that the API…" with a coral bar during the exit.
8. **The pulse dot doesn't pulse.** `.lp-pulse-dot` (CSS:2621-2627) has no animation, and `@keyframes lp-pulse` (CSS:4290) is unused.
9. **Mission status colours don't match the comment.** CSS:2551 says "Cyan once a route exists", but there is no cyan rule. `LOCKED` and `ATTN` get `.is-nominal` mint-text (TB:118).
10. **"Route required" isn't uppercase.** TB:41 says "ROUTE REQUIRED", but `.lp-route-required` has no text-transform (CSS:2518-2524), so it renders mixed-case.
11. **The landing coordinate isn't in a mono span.** CSS:628-629 says it "keeps the data face on its own span", but LP:35 has no span or class around `89.15°S`.
12. **The landing "Data link active" is static text** (LP:36-39). It is not wired to `hasData`.
13. **Token comments don't match usage:**
    - `--fs-hero` is "The landing headline only" (CSS:223-225), but the landing h1 uses `clamp(…,50px)` (CSS:680). fs-hero is actually used by the splash brand (CSS:5980) and the fleet headline (CSS:4833).
    - `--track-hero` is "The landing eyebrow only" (CSS:241-243), but the kicker uses track-normal. track-hero is used on the brand marks (CSS:612, 2478).
    - `.lp-step-index` is 11px (CSS:5330), below the stated "12px is the FLOOR" (CSS:199).
14. **The scroll-to-dock FSV:35 refers to doesn't exist.** Nothing in src calls scrollIntoView or scrollTo.
15. **Comments assume "four" rovers** (FSV:183-185, CSS:4849). The count comes from the backend.
16. **"Custom" is never rendered.** It is mentioned at UMP:26-27 and RP:293-295. A profile fetch error is returned by UMP but not rendered by RP, so step 1 shows only the heading and hint.

**State and flow edge cases**

17. **"Change vehicle" doesn't open on the assigned rover.** `viewIndex` starts at 0 on every remount (FSV:38), so the hangar opens on rover #1.
18. **The hangar empty states are effectively unreachable.** `selectedRoverId` defaults to `'lpr_1'` and the boot sets the backend default (APP:190, 367), so `Awaiting rover`, `Choose a vehicle above` and the disabled Deploy can't normally appear. `.fleet-screen-loading` only renders under the boot splash, and a boot error holds the splash forever.
19. **Choosing a rover discards weight tuning.** Selecting a different rover overwrites the weights (APP:616). There is no deselect.
20. **Several paths skip the curtain.** Back/Forward and "Change vehicle" bypass it. A legacy `?app` / `#planner` URL is not rewritten until the next phase or mode change (APP:398).
21. **The curtain doesn't block input.** It isn't focus-trapped or inert: ArrowLeft/Right still flip the carousel under it before the swap. Ctrl+Z is global (APP:593-610).
22. **`frozen` never resets** (APP:461-465), even after going back to landing. This matches VR.

**Missing or stale assets and docs**

23. **`*.mp4` is gitignored** (.gitignore:29). A fresh clone shows only `starimg.jpeg`. The scrim and vignette are tuned for a moon disc right of centre (CSS:466-470, 558-561), and that composition can't be checked without the clip. Loop seam, frame content and duration are unknown.
24. **VR is stale.** It says ambient is 0.4 at 2.1× zoom, describes a "cinematic → feature" phase and an "interactive moon". The code has .95 at 1.06× and no cinematic phase.

**Dead code and unused assets**

25. **Dead code and duplicates:**
    - `LunaPathRouteMark` (LRM) is never imported.
    - Dead CSS: `.cinematic-*` (CSS:815-871); `.topbar`, `.brand-mark`, `.topbar-status`, `.status-line` (CSS:893-951, 2140-2149).
    - `public/rovers/luvm_m.jpg`, `viper.jpg` and `yutu_2.jpg` are byte-identical duplicates and unreferenced. RM alias keys `luvm_m`, `viper` and `yutu_2` don't exist in the backend catalogue. Unknown ids silently get LPR-1 meta (RM:105).

**Rendering details**

26. **Reduced motion is only partial.** The landing exit blur, app-shell blur, backdrop opacity/scale, photo hover scale, deploy-arrow nudge and splash fade still animate, and the curtain still takes 1500ms.
27. **Rendering differs across browsers:**
    - The slider thumb is styled for WebKit only (CSS:3347); Firefox gets the default.
    - `text-wrap:pretty` (CSS:684, 694) and `color-mix()` (CSS:3145) aren't supported everywhere.
28. **The selected card shifts by 1px.** `.is-selected` uses a 2px border against a 1px base (CSS:4989 vs 5013).
29. **Magic numbers with no stated reason:**
    - Boot percents 12/34/52/88 are fixed, not measured.
    - Timed bar starts at 4%.
    - Exit/hide transforms: scale .985, translateY 18px, blur 18px and 10px, scale 1.03.
    - Vignette and scrim gradient stops.
    - Layout sizes: thumb 136×62, card max-width 1500, photo min-height 360, .95fr/1.05fr columns, action column 300px.
    - Breakpoints 1240/980/900/820/640.
30. **Content that depends on the backend:**
    - rover names, specs and order
    - profile names, descriptions, colours and constraints
    - Roughness slider visibility, which depends on the `/api/terrain` manifest
    - whether the `dem` boot step appears

#### 9. Rough size

- **Screens: 5.** Boot splash, Landing, Transition curtain (2 captions), Hangar (with a loading/error fallback), Cockpit entry with the TopBar.
- **States: about 20.**
  - Boot: 5 stages, stalled, failed, leaving
  - Landing: entering, idle, exiting
  - Curtain: entering, holding, leaving
  - Hangar: card selected/unselected and hover; thumb current/assigned; dock ready/awaiting; info panel open; profile active/none; roughness row present/absent; narrow layouts
  - TopBar: plan/analyze, route/no route, solving, 4 status values, 2 link values, Systems open
  - Backdrop: 3 stages × frozen × reduced motion
- **Interactions: about 22** distinct handlers, listed in §2.
- **Keyframes:** 4 used plus 1 unused. About 20 transition rules. 5 JS timing constants (3000, 520, 1500, 620, 9000 ms).

## 3. Cockpit shell and 2-D map

I read the code in full: App.tsx, everything in shell/, registry.ts, MapCanvas.tsx, colormap.ts, overlay/*, the mission files that matter (geo, selectors, types, MissionContext, playbackClock), Instrument/*, SpecIcons.tsx and TopBar.tsx, the slot-filling features (layer-picker, map-legend, solving-indicator, playback, time-axis, mission-setup, analysis-layers) and FRONTEND_MODULAR_SHELL.md. App.css is 6418 lines, so I grepped it and read only the shell-relevant ranges; rules I didn't read are not covered.

**How to read references.** `file:line` is relative to `frontend\src\`. "DOC §n" is `docs\frontend\FRONTEND_MODULAR_SHELL.md`. Main files: `...\frontend\src\App.tsx`, `App.css`, `MapCanvas.tsx`, `colormap.ts`, `shell\{FeatureHost,slots,RailTabs,SystemsDrawer}.tsx`, `shell\shell.css`, `shell\phaseUrl.ts`, `features\registry.ts`, `overlay\{types,draw2d,OverlayProvider,useOverlays,OverlayContext}.ts(x)`, `mission\{geo,selectors,types,MissionContext,playbackClock}.ts`, `components\Instrument\{index.tsx,instrument.css}`, `components\Fleet\SpecIcons.tsx` (this is the icon component), `components\TopBar\TopBar.tsx`, `features\{layer-picker\LayerDropdown,map-legend\index,solving-indicator\RouteSolvingOverlay,playback\PlaybackBar,mission-setup\MissionSetupPanel,analysis-layers\index}.tsx`.

**Biggest findings for a pixel-identical rebuild:**
- **The 2-D map is stretched, not square.**
- **Route and markers sit on the cell corner, overlays on the cell centre.**
- **The backdrop video can't be seen behind the cockpit.**
- **The legend's "Safe" colour (blue `#4a8fd8`) differs from the route's LOW colour (cyan `#4fd8f0`).**
- **The plan rail is 530px and the analyze rail 584px, though comments say they match.**
- **There is no colour legend for any of the 7 view modes.**
- **There is no pan, zoom or wheel.**
- **A failed boot leaves the splash up forever, with no retry.**

Details are in §4 and §10.

---

### 3.1 Cockpit layout

**Structure (App.tsx:1047-1309)**
- `.app-shell` is a flex column, `height: 100vh`, `overflow: hidden` (App.css:510-522).
  - `TopBar` (`.lp-topbar`): 52px, `flex: none`, padding `0 18px`, `gap: 18px`, z 50 (App.css:2447-2460).
  - `main.content-grid`, a grid with `flex: 1` (App.css:958-969), holding:
    - `aside.left-rail`, rendered only if the registry has leftRail features (App.tsx:1082-1086).
    - `section.center-stage`, a flex column (App.css:1507-1522). It has a 38px dot-grid `::before` at opacity 0.12 (1524-1532) and contains:
      - `.map-stage` (flex 1, padding `8px 12px 14px`, z 1; App.css:1534-1544). Inside it: the HUD, then `.map-canvas-shell` (position relative, overflow hidden; 1546-1557) containing CanvasOverlaySlot and then MapCanvas or TerrainCanvas3D, then the 3-D controls.
      - BottomDock: in flow, a bare fragment.
      - `footer.lp-status-bar`: 44px, `justify-content: flex-end`, padding `0 16px`, top hairline (App.css:5600-5614).
    - `aside.right-rail`, rendered only if the registry has rightRail features (App.tsx:1259-1263).
  - GlobalOverlaySlot, then SystemsDrawer, then `.toast-stack`, all siblings (App.tsx:1269-1308).
- Rails: `background: var(--bg-surface)`, a 1px `--line` border, `overflow-y: auto`, flex column (App.css:995-1018). Scrollbars are hidden globally (App.css:397-406).

**Grid tracks**

| Condition | `grid-template-columns` | Ref |
|---|---|---|
| Base (both rails; never happens with today's registry) | `300px minmax(0,1fr) 584px` | App.css:967 |
| `.no-right-rail` (= PLAN) | `530px minmax(0,1fr)` | App.css:977-979 |
| `.no-left-rail` (= ANALYZE) | `minmax(0,1fr) 584px` | App.css:991-993 |
| ≤1180px | base `264/1fr/300`; plan `264 1fr`; analyze `1fr 300` | App.css:1998-2010 |
| ≤980px | `1fr`; rows `minmax(0,1fr) auto auto`; order: center 1 (min-height 50vh), left 2, right 3 | App.css:2024-2046 |

**Other `@media` rules that touch the shell**

| Query | Effect | Ref |
|---|---|---|
| ≤980 | map-stage padding 16; HUD top/left 12px, max-width 240; top-right overlay at 12/12 | App.css:2048-2083 |
| ≤980 | Toast stack with assistant open moves to top 92, left/right 16 | shell.css:37-48 |
| ≤1440 | Hides the last playback readout (SLOPE) | App.css:6125-6129 |
| ≤1200 | Hides the playback scrubber | App.css:4283-4287 |
| ≤900 | Hides the map-key risk legend | map-legend.css:135-137 |
| ≤720 | Systems drawer grid goes to 1 column | App.css:4460-4464 |
| `prefers-reduced-motion` | Backdrop video replaced by a poster image (SpaceBackdrop.tsx:45-51); only splash and landing animations are disabled | App.css:805,5944,6032 |

**Absolute positions on the map**
- HUD: top/left 24, padding 14, max-width 280 (App.css:1577-1585).
- Layer picker: top/right 24 (1635-1642).
- Analysis trigger: top 68, right 24 (analysis-layers.css:9-16).
- Map key: bottom 18, centred (map-legend.css:74-81).
- 3-D controls: right/bottom 24 (App.css:2293-2300).
- Solving overlay: `inset: 0` (2811-2819).
- `CanvasOverlaySlot` wrapper: inline `position: absolute; inset: 0; pointer-events: none` (slots.tsx:55-58). Each child re-enables `pointer-events: auto`.

**Z-index ladder, grouped by stacking context**

| Context | Layer | z | Ref |
|---|---|---|---|
| root | `.space-backdrop` (deck) | 0 | App.css:418 |
| root | `.app-shell` | 1 | App.css:512 |
| root | `.space-backdrop--ambient/--feature` | 130 | 425,429 |
| root | `.landing-screen`, `.cinematic-screen`, `.fleet-screen` | 131 | 544,818,4782 |
| root | `.splash-screen` | 200 | 5859 |
| inside `.app-shell` | `.lp-topbar` | 50 | 2457 |
| inside `.app-shell` | `.chat-launcher`, `.chat-window` | 100 | assistant.css:19,114 |
| inside `.app-shell` | `.lp-modal-backdrop` (dead CSS) | 120 | 3583 |
| inside `.app-shell` | `.toast-stack` (fixed) | 150 | 1395 |
| inside `.app-shell` | `.lp-systems-backdrop` | 200 | 4348 |
| inside `.app-shell` | `.lp-systems-drawer` | 201 | 4377 |
| inside `.app-shell` | `.lp-report-scrim` | 300 | report.css:92 |
| inside `.map-stage` (z 1) | `.map-overlay` (HUD), `.map-overlay-top-right`, `.map-overlay-analysis` | 2 | 1571, 1639, analysis-layers.css:15 |
| inside `.map-stage` (z 1) | `.map-overlay-bottom-right`, `.map-overlay-bottom-center` | 3 | 2299, map-legend.css:79 |
| inside `.map-stage` (z 1) | `.lp-analysis-dock` / `.lp-map-controls-dock` | 24 / 25 | analysis-layers.css:20, App.css:2639 |
| inside `.map-stage` (z 1) | `.lp-solving-overlay` | 30 | 2815 |
| inside `.map-stage` (z 1) | layer dropdown / analysis panel | 100 (local only) | 2720, analysis-layers.css:57 |
| right rail | `.lp-rail-tabs` (sticky) | 4 | shell.css:63 |

Notes on the ladder:
- `.map-stage` traps every map overlay, so a dropdown at 100 can never cover the topbar at 50.
- `.app-shell.is-visible` has `transform: translateY(0) scale(1)` (App.css:532-537), which makes it the containing block for its `position: fixed` children. It covers the viewport, so this has no visual effect.

---

### 3.2 Plan mode vs Analyze mode

| | PLAN | ANALYZE |
|---|---|---|
| Left rail | `mission-setup` (530px) | none (column removed) |
| Right rail | none | RailTabs with 10 panels in 4 tabs (584px) |
| Bottom dock | empty | `time-axis` |
| Status strip (44px) | empty strip (it still renders) | `playback`; `.is-analyze` class added (App.tsx:1245) |
| Canvas overlay | layer-picker, map-legend, analysis-layers, solving-indicator | same |
| Global overlay | assistant | assistant, mission-report (launcher portalled into the TopBar slot) |
| Systems drawer | 13 panels | 11 panels (replan and mission-constraints are plan-only) |

Membership comes from `selectFeatures` (registry.ts:317-329) and `selectSystemsFeatures` (338-347). App only checks whether the list is empty (App.tsx:825-832, 1064-1070).

**How the switch happens**

| Trigger | Result | Ref |
|---|---|---|
| TopBar PLAN button | plan; disabled while solving | TopBar.tsx:67-74 |
| TopBar ANALYZE button | analyze; disabled while there is no route or while solving; title changes with state | TopBar.tsx:75-87 |
| "Route required" text | shown while there is no route | TopBar.tsx:90 |
| Brand "LUNAPATH" button | plan, even while solving | TopBar.tsx:57-64 |
| Plan request succeeds | after an extra 750ms: set result, switch to analyze; 100ms later autoplay from 0 | App.tsx:651-661 |
| Analyze with no route and not solving | forced back to plan (affects URL loads, undo, reset) | App.tsx:431-435 |
| Rover change, Reset | plan | App.tsx:622, 744 |
| URL `?stage=analysis` / `?stage=planner` | sets mode; history push/pop is kept in sync | phaseUrl.ts:56-111; App.tsx:395-414 |

**Transitions**
- The grid columns, the 54px width difference and the rail swap are **not animated**.
- Mode buttons: 140ms background/colour (App.css:2500).
- Phase fade of `.app-shell`: 0.6s on opacity/transform/filter; the hidden state is `translateY(18px) scale(.985) blur(18px)` (App.css:520-537).
- Stage changes use a curtain: 1500ms, with the swap at 620ms and a 520ms exit (SplashScreen.tsx:40-51). Captions are "Opening fleet hangar" and "Deploying to surface map" (App.tsx:449-455).

---

### 3.3 Interactions

**2-D map (MapCanvas.tsx)**

| Input | Behaviour | Feedback | Ref |
|---|---|---|---|
| Click | Ignored when `clickMode === 'idle'`. In `start`: set start and arm goal. In `goal`: set goal and go idle. Every click also clears the route, the error and playback. | Marker drawn | MapCanvas:200-215; App.tsx:525-544 |
| Pointer move | Sets the hover cell; HUD fetches that cell's telemetry after 90ms | Crosshair; HUD values | MapCanvas:217-233; App.tsx:771-808 |
| Pointer leave | Clears hover | | :235-237 |
| Arrow / Shift+Arrow | Moves the cursor 1 / 10 cells, clamped; default scrolling prevented | Crosshair | :256-283 |
| Enter / Space | Places at the cursor if a picker is armed | | :285-293 |
| Focus | Seeds the cursor at the grid centre if none | Global `:focus-visible` ring: 2px lavender, offset 2 (App.css:319-323) | :305-310 |
| Cursor | Start armed: 26px SVG ring+cross in mint `#5fe3b0` with a dark `#05070d` under-stroke, hotspot 13 13. Goal armed: same in coral `#ed856e`. Fallback `crosshair`; idle: default cursor | | App.css:5655-5661; MapCanvas:356-362 |
| Wheel, drag, pan, zoom | **None.** Only click, move, leave, keydown and focus are bound | | MapCanvas:336-340 |
| Screen reader | `role="application"`, a dynamic aria-label, and a live region "Cursor at row R, column C." | | :347-352, 373-375 |

In 3-D, clicks also place points: `clickMode` and `onCellClick` are passed through (App.tsx:1179-1180).

**Shell controls**

| Control | Action | Ref |
|---|---|---|
| Ctrl/Cmd+Z (no Shift; ignored in inputs, textareas, selects and contentEditable) | Undo the last placement. Undoing the goal clears it and re-arms goal. Undoing the start clears both and re-arms start. Also clears the route, so in analyze it falls back to plan. | App.tsx:564-610 |
| Esc | Closes the Systems drawer. Other window-level Esc listeners: assistant (useAssistant.ts:84, skips if defaultPrevented), report modal (MissionReportModal.tsx:191), RoutePriorities info popover (:139). They can fire together. | SystemsDrawer.tsx:26-33 |
| TopBar "Systems" | Toggles the drawer | TopBar.tsx:105-114 |
| HUD "–" | Minimises to a chip; clicking the chip (a div with no keyboard access) expands it | App.tsx:1092-1128 |
| Layer picker 2D / 3D buttons | `setDimension` | LayerDropdown.tsx:78-93 |
| Layer trigger | Opens the menu (closes on outside mousedown); choosing an item sets the view mode and closes | :59-141 |
| "Analysis" trigger | Panel of overlay toggles (`aria-pressed`) | analysis-layers/index.tsx:80-100 |
| Toast ✕ / action | Dismiss / switch to traversability and dismiss; auto-dismiss after 5200ms | App.tsx:85, 1284-1304 |
| 3-D "Photographic Overlay" checkbox, Solar Ephemeris slider | photoDrape / sliceIndex | App.tsx:1201-1238 |
| Playback | Play/Pause (from the end it restarts), scrubber, 1× 10× 60× 300× | PlaybackBar.tsx:47-121 |

**Mission setup panel (left rail, plan)**
- "Select Start" / "Select Goal" are toggle pickers. Goal is disabled until a start exists.
- Typed row/col fields commit on blur or Enter and are clamped to the grid (MissionSetupPanel.tsx:40-79, 166-226).
- Undo and Clear are disabled while solving or when nothing is placed (288-307).
- The plan button is disabled unless both points are set and no solve is running (310-323). Its label is "Generate Route", "Computing Route..." or "Re-plan with new weights".
- "Change vehicle" returns to the hangar (393-400).
- **There is no swap button and no button labelled "Plan route".**

---

### 3.4 MapCanvas drawing

**Canvas**
- Bitmap is 500×500 (`CANVAS_SIZE`, :35), `DOWNSAMPLE = 1` (:42).
- Inline style `width: 100%; height: 100%` with no aspect ratio, so the bitmap stretches unevenly.
- Border `1px rgba(186,175,245,.2)`, background `#05070d`, shadow `0 24px 64px rgba(0,0,0,.45)`.
- `imageRendering: pixelated` for cost and traversability (:363-370).

**Paint order in `redraw` (:403-534)**
1. Base image, or `#05070d` fill if none.
2. Overlays (drawOverlays).
3. Route.
4. Rover.
5. Start marker, then goal marker.
6. Hover crosshair.

**Route**
- Revealed over a fixed 1100ms via requestAnimationFrame, whatever the route length (:33, 125-144). Drawn up to `max(revealStep, roverStep)`.
- Stroke 2.8px, round caps and joins, shadow `rgba(0,0,0,.55)` blur 12 (:433-446).
- Drawn as one path per run of equal risk level, so dash patterns continue across segments.
- Colour: LOW uses `ROUTE_CYAN #4fd8f0`; the others use `riskToHex` (:470).
- Ground the rover hasn't covered yet is drawn at alpha 0.42 (:472).
- A solid marker at the start of each HIGH or CRITICAL run: HIGH is a 3.8px square, CRITICAL a triangle of size 4.6. Fill is the risk colour, stroke `#05070d` 1px (:483-505).

**Risk encoding (colormap.ts:82-127)**

| Level | Colour | Dash |
|---|---|---|
| LOW | `#4a8fd8` (route uses cyan instead) | none |
| MEDIUM | `#e3d548` | [10,5] |
| HIGH | `#d69770` | [4,4] |
| CRITICAL | `#ed4b3d` | [1.5,3.5] |
| other | `#8b94a6` | none |

`batteryToHex` thresholds: >50 / >25 / >10 (:144-155).

**Markers**
- Rover: circle r 4.8, fill `#e7eaf1`, cyan glow blur 14, cyan stroke 1.6 (:514-528).
- Start / Goal: **both are filled discs** of r 7. Mint `#5fe3b0` and coral `#ed856e`, glow blur 16 in the same colour. Label "S" / "G" in `bold 8px "Azeret Mono"`, colour `#05070d`, centred at row+0.5 (:764-792).
- Hover crosshair: full-length lines `rgba(186,175,245,.18)` 1px; a ±8px cross `rgba(231,234,241,.92)` 1.2px; centre dot r 1.8 `#e7eaf1`; centred on the cell (+0.5) (:554-590).

**Base layer per view mode (:592-633)**
- Value range is the grid's finite min/max; a flat or empty grid falls back to 0..1 (:744-762).
- Cells are painted at `cellPx = 500 / rows` (:716-742).

| viewMode | Ramp | No-data colour |
|---|---|---|
| surface | REGOLITH × hillshade (azimuth 292°, altitude 6.5°, vertical exaggeration 2.2; shade = s·0.65 + 0.35; lighten ×0.42, darken ×0.55) | `[8,8,11]` |
| thermal | COOLWARM | `[12,14,20]` |
| cost | VIRIDIS | `[8,8,11]` |
| shadow | grey reversed, 255·(1−t) | `[8,8,11]` |
| traversability | RdYlGn, fixed domain 0..1 | `[8,8,11]` |
| slope | MAGMA | `[8,8,11]` |
| aspect | HSV, hue = degrees, s = v = 1 | `[8,8,11]` |

Refs: colormap.ts:157-228, 393-439, 563-568.

**Ramp stops, verbatim (colormap.ts)**
- COOLWARM (:4-14): [59,76,192] [98,130,234] [141,176,254] [184,208,249] [221,221,221] [243,199,166] [237,156,122] [214,96,77] [180,4,38]
- MAGMA (:16-26): [0,0,4] [27,16,69] [80,18,123] [129,37,129] [181,54,122] [229,80,100] [251,135,97] [254,194,135] [252,253,191]
- VIRIDIS (:28-38): [68,1,84] [71,44,122] [59,81,139] [44,113,142] [33,144,141] [39,173,129] [92,200,99] [170,220,50] [253,231,37]
- RDYLGN (:40-50): [165,0,38] [215,48,39] [244,109,67] [253,174,97] [254,224,139] [217,239,139] [166,217,106] [102,189,99] [26,150,65]
- REGOLITH (:52-62): [5,5,6] [21,21,23] [42,41,40] [69,66,62] [92,88,82] [122,116,108] [154,146,136] [184,175,164] [212,205,195]
- ROUGHNESS (:246-253): [26,42,58] [37,92,112] [88,148,130] [176,178,106] [226,160,74] [232,118,62]
- EARTH_VISIBILITY (:262-268): [14,18,28] [24,54,78] [34,104,132] [58,164,186] [110,216,232]
- TIME_TO_HAVEN (:279-285): [95,227,176] [140,208,140] [206,200,104] [226,150,84] [214,96,77]
- P_TRAVERSABLE (:296-302): [70,32,44] [140,70,62] [214,158,84] [140,152,96] [58,122,96]
- SIGMA (:314-320): [18,24,36] [40,66,96] [92,106,140] [168,142,148] [232,196,140]
- P_SAFE (:329-335): [214,76,66] [222,132,78] [216,186,96] [150,180,112] [88,176,132]
- DWELL (:338-344): [206,86,74] [220,146,84] [200,190,108] [128,176,148] [78,150,186]

Single colours (colormap.ts):
- ACTION_SAFE [95,227,176], ACTION_DRIVE [79,216,240], ACTION_WAIT [186,175,245], ACTION_NONE [196,88,82] (:356-362)
- SIDE_INSIDE [110,186,150], SIDE_COLD [92,152,226], SIDE_HOT [226,128,76] (:365-369)
- CORRIDOR [120,214,196], LIT_SAFE [72,138,132] (:379-380); PSR_MASK [126,122,214] (:391)
- START_MINT `#5fe3b0`, GOAL_CORAL `#ed856e`, ROUTE_CYAN `#4fd8f0`, LAVENDER_ACCENT `#baaff5` (:69-73)

Stops outside colormap.ts: `DARK_HOURS_STOPS` (safe-haven/overlays.ts:15) and time-axis `RAMP_STOPS` (time-axis/overlays.ts:15).

**Overlay command kinds (overlay/types.ts:13-90; draw2d.ts)**
- Drawn in registration order, after the base layer and before the route (OverlayProvider.tsx:53-58; MapCanvas:426-428).
- Coordinates are fine-grid cells, drawn at `(col+0.5)·scale` with `scale = 500 / gridRows`.

| Kind | Defaults | Registrants and their styles |
|---|---|---|
| polyline | width 2, opacity 1, round caps, dash [] (draw2d:43-67) | pose-loop `#e3d548` w1.5 dash[4,3] op.9; profile-compare `result.color` w2 op.85; time-axis `#baaff5` w2.5 op.95 |
| ribbon | fill only, opacity .25, one polygon; **never stroked**, so `widthPx` is ignored (:152-176) | corridor `#4fd8f0` op.22 |
| points | r 4, opacity 1, filled circle, no stroke (:69-82) | corridor `#4a8fd8` r2.5 op.7; cost-explain `#e7eaf1` r5 op.95; pose-loop r5 (colour computed) |
| field | null or NaN cells transparent; ramp stops evenly spaced; image smoothing off; scaled to 500 (:187-286) | analysis-layers (mask or ramp, per-spec opacity); coarse-fields; illumination-corridor op.6/.55; safe-haven op.6/.58; time-axis op.35 (COOLWARM for temperature) |

Registrant files: `features/{corridor,cost-explain,pose-loop,profile-compare,time-axis,analysis-layers,safe-haven,coarse-fields,illumination-corridor}/overlays.ts`.

---

### 3.5 View modes

`MapViewMode` has 7 ids (MapCanvas.tsx:45-52; `ViewModeId` alias in mission/types.ts:38). Labels and descriptions are from LayerDropdown.tsx:16-39. Default is `surface` (App.tsx:173).

| Group | id | Label | Description (verbatim) | Backend layer (App.tsx:357-363) |
|---|---|---|---|---|
| Terrain | surface | Surface | Lunar Regolith Topography & Hillshade | elevation |
| Terrain | slope | Slope | Terrain Incline (Degrees) | slope |
| Terrain | aspect | Aspect | Surface Facing Direction | aspect |
| Environment | thermal | Thermal | Surface Temperature (Kelvin / °C) | thermal |
| Environment | shadow | Shadow | Permanent Shadow Region Ratio | shadow_ratio |
| Planning | cost | Cost | A* Multi-Factor Weighted Cost Grid | cost (re-fetched 120ms after a weight change, App.tsx:491-513) |
| Planning | traversability | Traverse | Rover Incline & Obstacle Mask | traversable (re-fetched on rover change, App.tsx:468-488) |

**Legends:** the only one is the map key (map-legend/index.tsx:24-65).
- Scale: a fixed 46px rule plus the text `0 – {spanKm} km · {resolutionM} m/px`.
- "RISK" key: Safe, Caution, High, Critical, each an SVG line 20×8 with stroke 2.4 using `riskToHex` and the dash pattern.
- **No feature renders a colour-ramp legend for any view mode.** The ramp functions are used only by MapCanvas and time-axis.
- Trigger: "Layer" plus the current label plus ▾/▴. The selected item shows ✓ (LayerDropdown.tsx:97-133).

---

### 3.6 RailTabs and SystemsDrawer

**RailTabs** (RailTabs.tsx; styles in shell.css:60-143)
- `RAIL_TABS` (registry.ts:90-95):

| Tab | Label | Icon | Panels (registration order) |
|---|---|---|---|
| route | Route | `route` | mission-context, route-analysis, cost-explain |
| safety | Safety | `shield` | safety-margins, route-model |
| analysis | Analysis | `analytics` | uncertainty, stress-test, risk-sweep |
| compare | Compare | `balance` | benchmark, profile-compare |

- Untabbed ("pinned") features would render above the bar; there are none today (:40-43).
- `role="tablist"`, `aria-label="Analysis"`. Each tab is an icon (15px) over its label in a 4-column grid, padding `9px 4px 8px`.
- Active tab: `--text` colour and a 2px lavender underline inset 6px. Disabled (no panels): opacity .3.
- Safety tab only: coral badge (14px, 10px font) showing the number of violated requirements; tab text turns `--coral-text` (:48-51, 64-79; shell.css:115-132).
- Active tab state lives in the component (default `route`). It resets only when the rail unmounts, i.e. on switching to plan.
- The panel area has `padding-bottom: 56px` to clear the assistant launcher (shell.css:142).

**SystemsDrawer** (SystemsDrawer.tsx; styles App.css:4341-4464)
- Opened by the TopBar toggle "Systems". Its title, verbatim: "ROS bridge, reality check, provenance, corridor, pose loop and replan triggers".
- Closed by ✕, backdrop click or Esc.
- Backdrop `rgba(3,6,14,.55)`, 0.25s fade. Drawer: fixed right, `width: min(820px, 94vw)`, `--glass-strong`, left border `rgba(79,216,240,.2)`, slides in with `translateX` over 0.28s `cubic-bezier(.16,1,.3,1)`; `visibility` hidden when closed.
- Labels verbatim:
  - Kicker: "DIAGNOSTICS & PROOF" (`.lp-meta-label`).
  - Heading: "Systems & Evidence" (24px, weight 800).
  - Close button: "✕", aria-label "Close systems and evidence".
  - Subtitle: "The ROS bridge, provenance, reality check, corridor, pose loop and replan triggers behind this cockpit. Not part of placing a route — kept one click away."
- Grid: `repeat(auto-fill, minmax(340px, 1fr))`, gap 16. Panels mount only while open (:78-83), so their state is lost on close.
- Plan-mode order: ros-showcase, layer-provenance, replan, mission-constraints, psr-validation, safe-haven, earth-visibility, coarse-fields, thermal-envelope, illumination-corridor, mission-validation, corridor, pose-loop.
- It sets `aria-modal="true"`, but there is no focus trap and focus is not restored on close.

**Icon component** (`components/Fleet/SpecIcons.tsx`)
- Material Symbols Outlined path data; SVG `viewBox="0 -960 960 960"`, `fill="currentColor"`, `aria-hidden`, class `lp-icon` (:203-213). Sized 1em with `vertical-align: -0.125em` (App.css:3261-3266).
- 51 names (:25-93): battery, speed, climb, mass, slope, energy, shadow, thermal, balance, eco, info, map, tune, restart, add, close, send, spark, levels, guide, engineering, analytics, warning, target, chart, help, rover, layers, pin, cube, error, evidence, limits, report, pdf, download, back, language, expand, check, route, clock, batterylow, plug, nodes, shield, terrain, flag, undo, clear, location.

---

### 3.7 Instrument component (components/Instrument)

| Piece | Props | Visual |
|---|---|---|
| `Readout` (:28-52) | label, value, unit?, sub?, tone='data' | Inset box, 2px left border, padding 9×11; mono 16px weight 600 value; 12px uppercase label (instrument.css:10-61) |
| `Meter` (:61-125) | fraction (−1..1), from?, origin 0 or 0.5, tone, ticks=4, low?, high?, marker?, clamped? | 8px track; ticks are 1px `--line-card`; fill in cyan by default; centre line when origin is 0.5; negative fill coral; clamped adds a 4px hatched cap; marker 2px `--text-2`; low/high scale labels (:65-141) |
| `Field` / `FieldRow` (:128-151) | label, value, hint?, tone | `dl` grid `auto-fit minmax(72px, 1fr)`, gap 9/10 (:145-175) |
| `Divide` (:154-160) | label | Uppercase label plus a 1px rule (:179-195) |

Tones: `data`, `ok` (mint), `warn` (**cyan**, not yellow), `bad` (coral), `muted` (instrument.css:54-61, 102-106, 170-173). Used by 7 features: benchmark, mission-report EvidenceSections, risk-sweep, route-model, safety-margins, stress-test, uncertainty.

---

### 3.8 Loading, empty and error states

| State | What shows | Ref |
|---|---|---|
| Boot | Full-screen splash at z 200. Stages: "Contacting mission backend" 12%, "Loading lunar elevation model" 34%, "Reading rover catalogue" 52%, "Fetching terrain layers" 88%, "Mission systems ready" 100%. Shown at least 3000ms; 520ms exit. | SplashScreen.tsx:28-37; App.tsx:337-385 |
| Boot stall (9000ms) | "Still waiting on {stage}. Check that the API is running on port 8000." | SplashScreen.tsx:66, 119, 143 |
| Boot failure | "Boot failed", "--", red bar, error text. **The splash never dismisses and there is no retry** (`onDone` requires no error). The layer-error toast (z 150) renders behind it. | SplashScreen.tsx:112-141; App.tsx:378-381 |
| 503 or "no grids" | **No status-specific handling.** A layer failure becomes "Layer fetch failed: {name} ({status})" and goes down the boot-failure path | api.ts:323 |
| Fleet with no rovers | "Loading rover catalogue…" or the error / "The rover catalogue could not be loaded." | App.tsx:1038-1042 |
| Grid for the current view not loaded | "Loading lunar grid..." over the map: `rgba(5,7,13,.86)`, `#c8cddb`, mono 12px, 0.14em tracking, uppercase | MapCanvas:312-319, 377-395 |
| Solving | Overlay at z 30 (details below) | RouteSolvingOverlay.tsx; App.css:2811-2902 |
| TopBar status | Mission ATTN / SOLVING / LOCKED / NOMINAL; Data link ACTIVE / SYNCING (dot mint or `--risk-med`) | App.tsx:817; TopBar.tsx:116-128 |
| Toasts | "Selected point is unavailable" (action: "Show traversable cells"); "Route could not be generated"; "Terrain data warning" (error tone); "LiDAR local detour"; "LiDAR replan"; "LiDAR replan failed"; "3D Terrain". Full messages at App.tsx:1365-1397, 681-724, 1193-1195 | |
| Setup panel | "Select a Start point on the terrain first." / "Select a Goal point on the terrain to enable routing." / stale-route note (shown in `--risk-med`) / "Loading rover specifications..." | MissionSetupPanel:140-144, 326-333, 387 |
| Empty slots | No element. The playback bar renders null with no waypoints (PlaybackBar:53). The plan-mode status strip stays as an empty 44px bar. | |

**Solving overlay detail:** a 2px cyan scan line sweeping over 2.4s; a 22px spinner turning every 0.8s; a card (max-width 440) with the kicker "A* PATHFINDER · KINEMATIC SOLVER", the title "Computing route", a detail sentence, and tags "START: [r, c]", "GOAL: [r, c]", "Optimising path"; plus a screen-reader live message.

---

### 3.9 Design rationale (brief quotes)

| Ref | Quote |
|---|---|
| App.css:2-12 | "NASA/JPL mission control, not a cyberpunk HUD: flat opaque surfaces, 1px hairlines, one restrained lavender accent"; "No glassmorphism"; "2px radius"; "Mono is for measured data only" |
| App.css:199 | "12px is the FLOOR." |
| App.css:173-176 | Risk ramp: "colour is never the only channel. See riskToDash" |
| colormap.ts:106-109 | "the line breaks up more as the risk rises" |
| MapCanvas:116-124 | "This is a ROUTE REVEAL, not the drive" |
| MapCanvas:450-453 | "Ground already covered reads at full strength, the road ahead is held back." |
| MapCanvas:492-493 | "Triangle for CRITICAL, square for HIGH" |
| App.css:5646-5650 | Picker cursors "carry the marker's own colour" |
| registry.ts:139-143 | Plan gets no right rail so "plan gets the wider map" |
| TopBar.tsx:40-42 | ANALYZE is "Disabled rather than hidden... a mode that vanishes reads as a bug" |
| RailTabs.tsx:16-20 | "Anything that can be missed behind a tab has to be announced by it." |
| shell.css:55-58 | Underline tabs versus the filled PLAN/ANALYZE block |
| App.tsx:1077-1081 | "Neither rail collapses any more." |
| SystemsDrawer.tsx:14-15 | "lets the default cockpit be task + context" |
| App.tsx:650 | The 750ms delay is to "Display the radar scanning search animation briefly for authentic mission control feedback" |
| App.tsx:224-235 | One mission clock, so at 1× the rover moves at the 0.2 m/s the planner charged for |
| App.css:5835-5844 | Risk key dropped from the strip in analyze |

---

### 3.10 Gray points (cannot be settled from code alone, or contradict each other)

**Pixel-identity blockers**
1. **The map stretches unevenly.** The 500×500 bitmap fills the container with no aspect ratio (MapCanvas:363-370), so markers and the rover dot render as ellipses. Click mapping uses separate X and Y scales (:542-545). The comment at :353-355 says the stretch is deliberate.
2. **Half-cell offset between route and overlays.** The route, rover and S/G markers use raw `col,row` with no +0.5 and no `cellPx` scaling (:474-476, 521, 782). The crosshair and draw2d use cell centres. The geo.ts helpers that state the "centre, not corner" rule (geo.ts:31-56) are **unused**. Raw `col,row` only works because the grid is 500 = CANVAS_SIZE.
3. **The backdrop is hidden behind the cockpit.** `.app-shell` is `background: transparent` at App.css:519 but overridden to `var(--void)` at :5568. So the deck's 0.55 opacity and `frozen` (App.tsx:998-1001) have no visible effect, and the "backdrop reads through" comments (App.css:517, 1518) are moot.
4. **LOW risk colour mismatch.** The legend's "Safe" is `#4a8fd8` (map-legend/index.tsx:55); the route draws LOW in `#4fd8f0` (MapCanvas:470).
5. **Goal marker shape mismatch.** The canvas draws a filled disc (:782). The rail's `.lp-endpoint-marker.is-goal` is a ring, and its comment claims these are "the same two marks the canvas draws" (App.css:5699-5716).
6. **Some elements have no CSS and fall back to browser defaults:** `.toast-body`, `.toast-action` (an unstyled native button), `.lp-status-right`, `.lp-slot-canvas`. `.toast-copy` has CSS but nothing uses it (App.css:1425).
7. **Platform-dependent glyphs:** 📍 (App.tsx:1099), `– ▾ ▴ ✕ ✓ ▶ ❚❚ ◼ ◻ ×`. The canvas S/G labels use "Azeret Mono" and are not redrawn when the font loads.
8. **Breaks the stated type and radius rules:** `.lp-scale-btn` is 9.5px with a 3px radius (App.css:6099-6110); `.lp-rail-tab-badge` is 10px.
9. **The scale bar is not a real scale.** The rule is a fixed 46px but the label states the full span (map-legend.css:102; index.tsx:39). Before telemetry arrives it shows the defaults 2.5 km / 5 m/px (App.tsx:110-111).
10. **Picker icon colours.** `.lp-pick-btn:first-child .lp-icon` is mint and `:last-child` uses `--risk-high`, not coral (App.css:3509-3515). Each button is the first child of its own row, so both icons are probably mint and the goal rule never applies.
11. **Possible overlap between the two map triggers.** The analysis trigger (top 68, z 2, later in the DOM) may cover the open layer dropdown (which opens at about 64px inside a z 2 sibling). Verify in a browser.
12. **Stacked layout at ≤980px.** The rails are stacked inside `overflow: hidden` parents (App.css:521, 968, 2024-2046). Whether they can be reached needs a browser.

**Layout and comment contradictions**
13. **Rail widths.** Plan is 530px and analyze 584px, so the map changes width by 54px on mode switch. Comments that disagree:
    - "the same 584px" (App.css:974-976).
    - "Plan: 300px" (:971) and "Analyze: 340px" (:981).
    - 288px (App.tsx:1256; registry.ts:292), 250px (App.css:250), "left rail 230px" (shell.css:32).
    - The 584 derivation assumes "24px right padding" on the topbar; the real padding is 18px (App.css:985 vs 2456).
14. **Status strip in plan is an empty 44px bar.** `.lp-status-bar.is-analyze .lp-risk-legend` (App.css:5845) targets an element that no longer exists; the risk key moved onto the map.
15. **The HUD can't be closed.** `hudOpen` and `toggleHud` are published, but nothing calls `toggleHud` (App.tsx:158, 747).
16. **Stale line references:**
    - slots.tsx:44 says App sets an inline `position: relative`; it actually comes from CSS (App.css:1556).
    - App.tsx:1148 cites `App.css:1208`; draw2d.ts:9 cites `MapCanvas.tsx:459` (the real line is :647).
17. **"Eleven panels" (slots.tsx:18; RailTabs.tsx:10; shell.css:51) is actually 10.** The "does not persist across a re-plan" claim (RailTabs.tsx:22-24) fails for the in-analyze LiDAR replan.
18. **Registry comments that contradict their code:**
    - route-model (:168-173) and uncertainty (:279) say "in the drawer"; both are primary rail tabs.
    - benchmark (:286-288) says "no mission mode"; it is analyze-only.
    - mission-validation (:274-275) says "Plan only"; it has no `modes`.
    - The replan comment is duplicated.
19. **Systems drawer** subtitle names 6 panels; there are 13 in plan and 11 in analyze.
20. **Mission status colour.** The CSS comment says "Cyan once a route exists" (App.css:2551), but only `.is-solving` (lavender) and `.is-nominal` (mint) exist, so ATTN and LOCKED both render mint (TopBar.tsx:118). "SYNCING" stays up indefinitely after a load error.
21. **Ribbon `widthPx`** is documented as an outline (overlay/types.ts:17) but is never stroked. An overlay keeps its first-insertion paint position when re-registered (Map order).
22. **The rover is always shown once a route exists.** `stepIndex` is never null with a route (playbackClock.ts:131-158), so the rover dot always shows and the "null shows the route at rest" doc (mission/types.ts:277) can't happen.
23. **PlaybackBar counts the wrong waypoints after a detour.** It counts `planResult.waypoints` (PlaybackBar:42), while the clock and map use `executionWaypoints ?? planResult.waypoints` (App.tsx:246). They diverge after a LiDAR local detour.
24. **The assistant window is draggable** (assistant/index.tsx:36-38), but the toast offset in shell.css assumes it sits in its resting corner (and the 442px figure assumes a 404px footprint; the window is 394px + 16px).
25. **"Generate Route" during a solve** is impossible, but "Change vehicle" and the LUNAPATH brand button stay active.
26. **"Re-plan with new weights" appears unreachable from the cockpit.** The weights are read-only there (MissionSetupPanel:409-421), so the button needs a weight change made elsewhere (in the hangar, I assume).

**Dead code**
- CSS with no element: `.map-canvas`, `.map-switch`, `.route-control-inline*`, `.map-overlay-top-center`, `.map-status-tag`, `.lp-modal-backdrop/-drawer`, `.lp-hud-dock-btn`, `.lp-dock-icon`, `.toast-copy`, and keyframes `lpSlideInLeft`, `lpPulseBorderStart`, `lpPulseBorderGoal`.
- Unused exports: `colormap.ts` `elevationToRegolith`, `tintRgb`, `buildEqualizationLut`, `pixelToApproxLonLat`, `LAVENDER_ACCENT`; all of `geo.ts`.
- `mission-snapshot` is registered with `modes: []`.
- The `setPlanning` state is set but never read (App.tsx:197-200).
- SpaceBackdrop's `feature` stage is never used by App.
- Two icon pairs share identical paths: location = target, slope = terrain. The SpecIcons.tsx:11 comment says "Forty-nine" glyphs; there are 51.

**Magic numbers:** 750ms and 100ms (App.tsx:651-661); 120ms cost debounce (:507); 90ms hover delay (:780); 250ms frame clamp (:267); 5200ms toast; 1100ms reveal; default point [250,250]; default weights .409/.259/.142/.19 (:77-84); `sliceIndex / 2` "Day" (:1224); hillshade 292° / 6.5° / 2.2; Shift step 10; `TIME_SCALES` [1,10,60,300]; `NOMINAL_ROVER_SPEED_MS` 0.2.

**FRONTEND_MODULAR_SHELL.md vs code**

| DOC | Doc says | Code |
|---|---|---|
| §1, §4 | five slots | six (`statusBar`): slots.tsx:5; registry.ts:51-57 |
| §4 table | leftRail "below the existing controls"; rightRail "below Mission Snapshot" | App renders no rail panels itself; Mission Snapshot is retired (`modes: []`) |
| §4 | one-entry `FEATURES` example; no `modes`/`group`/`tab` | 33 entries with `modes`, `group`, `tab`, plus `RAIL_TABS` and `selectSystemsFeatures` |
| §2 | `TerrainView3D.tsx`; `MissionContext.tsx`; `OverlayContext.tsx`; shell/ = 3 files | `TerrainCanvas3D.tsx`; `.ts` + `*Provider.tsx`; shell/ also has RailTabs, SystemsDrawer, phaseUrl |
| §5 | 9 fields, "No setter crosses this boundary" | `MissionValue` has 17 fields (types.ts:84-185; its own comment says 15); `MissionActions` with 19 writers exists (types.ts:238-306) |
| §5, MissionContext.ts:43 | focus telemetry updates "every 33 ms" | requestAnimationFrame mission clock (App.tsx:258-287) |
| §10 | `handleCellClick` is the only start/goal writer | also `placeEndpoint`, undo, reset, and LiDAR `setStart` (App.tsx:550-588, 710, 734) |
| §11 | assistant works "with both rails collapsed" | rails no longer collapse (App.tsx:1077-1081) |
| §13 | panels stay in App.tsx; "No test framework" | App keeps only the HUD, 3-D controls and toasts; vitest 2.1.9 is installed (package.json:10, 31) |
| §6 | example colour `#38bdf8` | not in the palette |

---

### 3.11 Size estimate

- **Registry:** 33 registrations (1 retired), 6 slots, 2 groups, 4 tabs; 13 systems panels.
- **Visible panels:**
  - PLAN: 1 rail panel + 4 canvas overlays + 1 global overlay.
  - ANALYZE: 10 tabbed rail panels + 1 dock + 1 status-bar occupant + 4 canvas overlays + 2 global overlays.
- **Chrome App.tsx renders itself:** TopBar, HUD (card and chip), 3-D photo/solar box, toast stack, status strip shell, Systems drawer shell, splash and transition curtain, fleet wrapper (8).
- **Interactions:** about 12 on the map (click, move, leave, 4 arrows, Shift, Enter/Space, focus, 2 picker cursors). About 25 shell controls: 2 mode buttons, brand, Systems, HUD minimise/expand, 2D/3D, layer menu with 7 items, analysis trigger and toggles, toast dismiss and action, playback with 4 scales and a scrubber, 3-D checkbox and slider, Ctrl+Z, Esc, plus about 8 setup-panel buttons and 4 coordinate inputs.
- **Shell-level states:** about 20 (5 boot stages, stall, boot-fail, fleet loading/error, grid loading, solving, 4 mission statuses, 2 link states, 7 toast templates, empty slots, ANALYZE disabled, picker idle/armed/set).
- **Drawing:** 7 base ramps, 12 overlay ramps plus 10 single-colour masks, 4 overlay kinds, 4 risk styles, 6 marker/glyph types (S, G, rover, HIGH square, CRITICAL triangle, crosshair), 51 icons.

## 4. 3-D terrain view

Everything here comes from reading the code. Three things were checked by running something, all read-only:
- **GLB node trees**: dumped with `node -e`.
- **Wheel-pivot traversal**: simulated in memory with the repo's own `three` r183. The simulation leaves out the bounding-box recentring, but the tree mutation is the same as in the real code.
- **Git tracking**: checked with `git ls-files` and `git check-ignore`.

**Path abbreviations** (all under ``):

| Abbrev. | Path |
|---|---|
| TC | `frontend\src\TerrainCanvas3D.tsx` |
| SKY | `frontend\src\sky.ts` |
| LID | `frontend\src\lidarSimulation.ts` |
| LPC | `frontend\src\localPerception.ts` |
| LPL | `frontend\src\localPlanner.ts` |
| APP | `frontend\src\App.tsx` |
| CSS | `frontend\src\App.css` |
| CLK | `frontend\src\mission\playbackClock.ts` |
| DOC | `docs\frontend\3b-veri-sozlesmesi.md` |

**Data fetching:** TC does not use `net/terrain.ts`. It calls `fetch('/api/terrain')` directly (TC:1546) and has its own `fetchF32` (TC:191-195). `/api` is proxied to `127.0.0.1:8000` (`frontend\vite.config.*:25-27`).

**Mounting:** APP:1172-1196, only when `dimension==='3d'`. The 2D/3D toggle is in `frontend\src\features\layer-picker\LayerDropdown.tsx:78-93`. App always passes `exaggeration={null}` (APP:1181).

### 4.1 Scene setup
| Item | Value | Where |
|---|---|---|
| Renderer | `WebGLRenderer({antialias:true})`, no alpha | TC:1122 |
| Pixel ratio | `min(devicePixelRatio, 2)` | TC:1123 |
| Output colour space | `SRGBColorSpace` | TC:1138 |
| Tone mapping | `NoToneMapping`, on purpose ("a filmic curve lifts the black side off zero") | TC:1139-1141 |
| Shadows / fog | None. No `shadowMap`, `castShadow` or `scene.fog` anywhere (checked by grep). Cast shadows come from the API horizon cube instead. | TC:16-21 |
| Background | `Color(0x020308)` | TC:1119 |
| Sizing | `ResizeObserver` → `setSize(w, h, false)`. CSS sizes the canvas to 100%. | TC:1535-1543; CSS:2228-2241 |
| Camera | `PerspectiveCamera(fov 45, aspect 1, near 0.1, far 100000)` | TC:1121 |
| Initial pose (after the manifest loads) | pos = `(span*0.72, max(relief*0.35 + span*0.75, relief + span*0.45), span*0.75)`, target = `(0, relief*0.35, 0)`. For Site11 (span 2500, relief 425.65) that is about (1800, 2024, 1875). | TC:1609-1616 |
| Controls | `OrbitControls`, damping on with factor 0.08 | TC:1144-1146 |
| | `zoomToCursor=true` | TC:1622 |
| | min/max distance 12 / span*4 at build | TC:1617, 1623 |
| | On orbit entry: min 150, max span*4, `maxPolarAngle = π/2 - 0.02`, fov reset to 45, camera re-posed | TC:2852-2874 |
| | Keyboard never enabled (`listenToKeyEvents` is not called) | — |
| Camera modes | Two: `'fps'` (the default) and `'orbit'`, held in React state | TC:1001 |
| | Switched by two DOM buttons | TC:3094-3116 |
| | A ref mirrors the mode for the render loop | TC:1033-1034 |
| FPS camera | Orbit controls disabled | TC:2776 |
| | Eye = nearest grid node (row/col clamped to 1..n-2) at raw height + 3.2 m, lerped to the next node by `roverFraction` | TC:2778-2806 |
| | Look target is 60 m away along the downhill gradient, at target height + 1.6 m | TC:2817-2836 |
| | Re-runs on every `activeWaypoint` / `roverFraction` change | TC:2841 |
| Vertical exaggeration | FPS forces `mesh.scale.z = 1.0`. Orbit uses `exaggeration ?? manifest.vertical_exaggeration_suggested`. | TC:2174-2181 |

### 4.2 Lights
| Light | Type | Colour / intensity | Position / other | Where |
|---|---|---|---|---|
| Ambient | `AmbientLight` | `0xc8cede` / 0.1 ("earthshine") | — | TC:1148-1151 |
| Sun | `DirectionalLight` | `0xfff6ee` / 3.6. The high value compensates for Lambert under-predicting regolith brightness. | Target is the default origin. No shadow. | TC:1153-1165 |
| Rover-only IBL | 64×32 float equirect → PMREM. Value `0.012 + smoothstep * 0.17`, with RGB scaled ×(1, .975, .94). | — | Bound as `envMap` on rover materials only. Deliberately not set as `scene.environment`. | TC:809-853, 1273-1281, 1409-1413 |

**Sun direction** (TC:2116-2139):
- Read from `series.sun[slice]` using `azimuth_grid_deg` and `elevation_deg`.
- Elevation is floored: `e = max(el, 20°)` (`SHADING_ELEVATION_FLOOR_DEG`).
- `pos = (sin a·cos e, sin e, -cos a·cos e) * span*4`.
- With no series, the fallback is `(0.6, 0.36, -0.8).normalize() * span*4` (TC:2105-2114).
- The sun flare sprite follows the light at a distance of 55000 (TC:1605, 2112, 2138).

### 4.3 Terrain mesh
| Item | Value | Where |
|---|---|---|
| Geometry | `PlaneGeometry(cols*res, rows*res, cols-1, rows-1)`, giving 250k vertices for 500×500 | TC:1559 |
| | Vertex z = `h - minM`. A NaN height is pinned to the base. | TC:1561-1566 |
| | `computeVertexNormals`, plus an empty `color` attribute | TC:1567-1571 |
| | `rotation.x = -π/2`, so row 0 lands at -Z (north) | TC:1580 |
| Material | `MeshStandardMaterial({vertexColors:true, roughness:0.97, metalness:0})` | TC:1573-1577 |
| Final colour | CPU product `baseColors × lightMask` written into the colour attribute | TC:1890-1908 |
| Shadow mask | Shadow cube slice, nearest-neighbour sampled from 250² onto the 500² mesh | TC:2149-2163 |
| | `mask = 0.13 + 0.87*(1 - shadow)` (`SHADOW_FLOOR`) | TC:2159, 2166 |
| | Skipped in photo mode | TC:2144 |
| `surface` view | Vertex base colour is white | TC:2060-2067 |
| | `map` = `nac-site11-detail-2048.jpg` (sRGB, anisotropy 16) | TC:170, 2015-2028 |
| | If the DEM window is not aligned: procedural regolith canvas, 256², seed `0x5245474f`, repeat 18 | TC:329-358, 2024-2025 |
| | If the detail texture fails: `map = null`, `color = SURFACE_ALBEDO 0x7a746c` | TC:85, 2028-2035 |
| Data views | `LAYER_FOR_VIEW` maps the 7 `MapViewMode` values to layers | TC:59-67; `frontend\src\MapCanvas.tsx:45-52` |
| | Linear lerp of the `RAMP` pair over the manifest's `min..max` | TC:92-99, 2046-2073 |
| | `FALLBACK_RAMP` 0x2c2a26 → 0xe8e4dc | TC:101-104 |
| | NaN → raw (0.16, 0.15, 0.17) | TC:2053-2058 |
| | Fetch failure → `SURFACE_ALBEDO`, plus a toast | TC:2077-2090 |
| Ramp colours (lo → hi) | slope 0x1d3a1f→0xd94f3d; thermal 0x2b4a99→0xd94f3d; shadow_ratio 0xe8e4dc→0x0a0a0c; cost 0x243b6b→0xe8d54a; traversable 0x8a2c22→0x2f7d46; aspect 0x3b2f6b→0xe0c060 | TC:93-98 |
| Photo mode | Active only when `photo && cameraMode==='orbit'` | TC:1074 |
| | Only on the aligned window (origin -32500/11000, 500², 5 m) | TC:172-189 |
| | `map` = `emissiveMap` = `nac-site11-2048.jpg`, colour black, emissive white ×1 (unlit) | TC:1965-1970 |
| | Vertex colours filled with 1 | TC:1974-1976 |
| Shader changes | None on the terrain. `onBeforeCompile` is used only for rock triplanar mapping (below). | — |
| Brightest slice | argmax over slices of the count of cells with shadow < 0.5. Reported via `onReady`. | TC:1696-1719 |

### 4.4 Overlays in 3-D
| Element | Geometry | Style | Height | Where |
|---|---|---|---|---|
| Route ribbon | Two triangles per segment, half-width 0.9 m, perpendicular to world-up, seams at turns | `MeshBasic 0x39ff6a`, opacity 0.5, DoubleSide, no depthWrite | waypoint `(altitude_m - minM)*vx + 4` m | TC:2694-2739 |
| Centerline | `Line` | `LineDashed 0xd6ffde`, dash 3, gap 2 | ribbon + 0.12 m | TC:2740-2746 |
| Start / goal markers | `Sphere(r = res*0.6 = 3 m, 12×12)` | `MeshBasic` 0x2ee59d (start), 0xff5252 (goal) | first / last waypoint | TC:2752-2758 |
| Terrain net | Polar: 9 rings × 48 azimuths out to 60 m | `LineBasic 0x8fd8ff`, opacity 0.35, renderOrder 3 | DEM + 0.15 m | TC:690-736, 1495-1504 |
| Rock boxes (DOM) | Up to 6 nearest rocks within 60 m. Projected Box3 corners, rebuilt every frame. | Border and glow colour from `ROCK_DISTANCE_STOPS` (TC:742-760). CSS default red. | screen space | TC:1506-1514, 1733-1821; CSS:6049-6077 |

- The route rebuilds on `[waypoints, exaggeration, cameraMode, status]` (TC:2759).
- Rock box label is `ROCK {d.toFixed(1)} m`. Minimum box size is 4 px.
- There are no corridor, hazard or text-label overlays in 3-D.
- Start/goal markers exist only as route endpoints. TC has no start/goal props (TC:936-979).

### 4.5 Rover, rocks and LiDAR
**Rover model**
- **No rover-id mapping.** TC always loads `/models/viper-rover-textured.glb` and falls back to `/models/viper-rover.glb` (TC:1425-1445), whatever `selectedRoverId` is.
- **Placeholder** if both GLBs fail (TC:855-908): box chassis 1.45×0.42×1.85 in `0xd5d9dc`, 4 tyres r 0.34 in `0x171717`. The mast and LiDAR head (aperture `0x44ddff`) are always hidden (TC:1228-1229).

**Fit**
- Recentred, with the lowest point at y = 0.
- Uniform scale so the longest horizontal size is 1.5 m (TC:1238, 1250-1261).
- `rotation.y = π/2` if the model is longer in x than z (TC:1269-1271).

**Pose** (TC:2189-2332)
- Position lerps between grid nodes by `roverFraction`. Y comes from bilinear `sampleTerrainHeight` × `verticalScale`.
- Tilt follows the terrain normal (central differences, step `max(res*0.5, 0.5)`, LID:168-178).
- Heading chases `atan2(dx, dz)` at most 1.2 rad per metre driven (TC:793, 2260-2284).
- Steer uses the bicycle model, clamped to ±34° and eased ×0.25 per effect run (TC:796, 2291-2297).
- Wheel roll = `signedDistance / radiusM` via `rotateOnAxis` (TC:2321-2331).
- Orbit scale: `clamp(camDist / 45, 1, 10)` per frame (TC:800-801, 1837-1842).

**Speed**
- Comes from App's mission clock on the planner's `elapsed_hours`. Nominal speed is 0.2 m/s × the user `timeScale` (CLK:22, 97-109; APP:236-297).
- Recharge stops are compressed to 4 s of wall time (CLK:33).

**Cockpit overlay PNG:** not used anywhere. Only a CSS section header mentions "cockpit" (CSS:6133).

**Rocks**
- Fixed boulder garden: 47 entries in 6 patches (LID:523-606). Anchored once at the rover node of the first scan (TC:2390-2395).
- 3× scale in orbit (TC:2553-2558).
- Material: `0x9a938a`, roughness 1, metalness 0, DoubleSide. Canvas grain texture is 128², seed `0x4c554e41`, anisotropy 16 (TC:287-326, 1174-1196).
- Triplanar `onBeforeCompile` mapping (TC:439-486):
  - It adds the uniform `uTriplanarScale` (1.6 repeats per metre).
  - It also adds two varyings, world position and world normal, with instancing supported.
  - The three projections are blended by `|n|³`.
  - The program cache key is `triplanar-1.6`.
- Shapes: NASA scan JSON templates (TC:420-423) or icospheres. Four families: scan, cobble, breccia, slab (TC:562-657; LID:352-373).

**Gravel**
- 8 `InstancedMesh` variants × 1024 instances, `frustumCulled=false` (TC:668-688, 1204-1215).
- Size tiers: 0-18 m ≥ 0.10, 18-40 m ≥ 0.13, 40-70 m ≥ 0.22 (LID:617-621).
- Rebuilt after more than 4 m of movement. Hidden in orbit (TC:2450-2492).

**LiDAR**

| Item | Value | Where |
|---|---|---|
| Config | 60 m max range, 1.5 m min, σ 0.02, 270 azimuths × 16 channels (-16..14°), 5 Hz, 0.5 m march step | LID:3-15 |
| Points | `PointsMaterial`: size 5.5 px, no size attenuation, vertex colours, opacity 0.92, normal blending, no depthWrite, renderOrder 4. The dot texture is a 32² solid disc. | TC:360-375, 1470-1488 |
| Point colour | Jet ramp over the scan's min..max Y | LID:86-92, 777-788 |
| Sweep | One line from the origin to the nearest return at the current azimuth. Phase = `(now % 200 ms) / 200` (5 Hz). | TC:1843-1864 |
| Sweep style | `0x5ff4ff`, opacity 0.34, additive | TC:1516-1532 |
| Scan source | Backend `/api/lidar-scan` when stopped; local raycast while playing | TC:2515-2541 |
| Refresh | Every 150 ms while playing, 500 ms otherwise | TC:2355 |
| Noise | Dropout `0.008 + 0.055·(d/60)²`, seeded | LID:101-110 |
| Backend point height | Snapped to DEM + 0.15 m | LID:915-920 |
| Visibility | Points and net follow the toggle. The sweep shows only in FPS. | TC:2651-2665 |

### 4.6 Sky
- **Rotation:** the sky group is rotated so the ecliptic south pole (RA 90°, Dec -66.561°) is the +Y zenith. Rotation about the zenith is "not calibrated" (SKY:39-47, 274-280).
- **Radius:** 70000 (SKY:56).
- **Stars:** `/data/bsc5.bin`, float32 ×4 per star (ra, dec, vmag, B-V), 9096 stars (145536 B / 16) (SKY:27, 326-390).
  - `unit = clamp((6.5 - vmag) / 8, 0, 1)` (SKY:33-36, 120-122).
  - Colour: Ballesteros temperature, then Helland RGB, peak-normalised (SKY:79-117).
  - Intensity `0.46 + 0.54·unit^1.3`; size `2.6 + unit²·16` px (SKY:361-365).
  - Halo for vmag ≤ 3.0: intensity `0.10 + 0.34·unit^2.4`, size `12 + unit²·34` px, 4-spike sprite (SKY:161-198, 323, 367-379).
- **Milky Way:** 42000 points. 72% thin disc (σ 0.055 rad) and 28% skirt (σ 0.20). Density `0.34 + 0.66·exp(-l²/1.445)`. Warm (1, .96, .88) × 0.07-0.27, size 1.1-2.6 px (SKY:405-459).
- **Point shader:** custom `ShaderMaterial` with uniforms `starSprite` and `pixelRatio`; `gl_PointSize = aSize·pixelRatio`. Additive, depthTest on, depthWrite off, renderOrder -1, never culled (SKY:208-255).
- **Earth:** `earth_disc.jpg` drawn on a 1024² canvas, alpha cut by a radial fade from r 462 to 500 (TC:199-257).
  - Sprite diameter `span·0.36 / 0.836` (about 1077 m), at a fixed `(1.5, 1.05, -2.4)·span` (TC:249-254).
- **Sun:** 128² canvas radial gradient sprite, additive, scale 6500 at distance 55000 (TC:259-285).

### 4.7 Interactions and DOM
| Interaction | Binding | Where |
|---|---|---|
| FPS look | Left-drag; yaw/pitch 0.003 rad/px; pitch clamped -0.45..0.65; pointer capture; ignores buttons, inputs and `.terrain3d-lidar` / `.terrain3d-camera-switch` | TC:2876-2955 |
| FPS zoom | Wheel → fov `clamp(fov + dY·0.03, 28, 65)`, non-passive | TC:2936-2940 |
| Orbit | `OrbitControls` default mouse and touch (rotate / pan / dolly-to-cursor) | TC:1144, 1622 |
| Pick start/goal | `clickMode` start or goal; tap if moved ≤ 6 px; raycast the mesh → `onCellClick(row, col)`; crosshair cursor | TC:2963-3019; CSS:6045 |
| Camera buttons | "First person" (title "First-person view from the surface, at rover eye height"); "Orbit" (title "Orbit view, looking down on the site") | TC:3097-3114 |
| LiDAR toggle | Button shows `LIVE` / `OFF` | TC:3041-3048 |
| Keyboard / touch-specific | None in TC | — |

**DOM classes**
- Root: `terrain3d-root` (+ `is-picking`)
- Status: `terrain3d-status`
- LiDAR panel: `terrain3d-lidar` (`is-live` / `is-off`), `-head`, `-title`, `terrain3d-radar-icon`, `-toggle`, `-grid`, `-footer`, `-ramp-label`, `-ramp`, `is-danger`
- Camera switch: `terrain3d-camera-switch`, `terrain3d-cam-btn`, `is-active`, `cam-icon`
- Rock boxes: `terrain3d-rockbox-layer`, `terrain3d-rockbox`, `terrain3d-rockbox-label`
- TSX: TC:3021-3117. CSS: CSS:2228-2253, 6045-6418.

**Verbatim text in TC**
- `Loading terrain…` and `3-D terrain failed to load — is the API running?` (TC:3026-3028)
- `LiDAR perception`, `FIRST RETURN · 16 CH · 5 HZ`
- Grid labels: `RANGE` (60 m), `RETURNS`, `ROCK HITS`, `OCCUPIED`, `NEAREST` (`--` or `x.x m`; danger below 12 m)
- Footer: `LOW → HIGH (elev.)`, `{n} rocks tracked`, `{n} observed · {FOLLOW|LOCAL_DETOUR|STOP_AND_REPLAN}` (TC:3037-3087)
- Toasts: `NAC texture failed to load` and `` `${layer} layer failed to load` `` (TC:1986, 2089)

**App-level controls** (APP:1200-1237)
- Photo checkbox: `Photographic Overlay (LROC NAC, 1 m/px)`, or `(not aligned with current DEM window)` when unavailable.
- Note: `2010 solstice acquisition. Native shadows are fixed to acquisition epoch.`
- Slider: `Solar Ephemeris · Day {slice/2}`.

### 4.8 Performance decisions
| Decision | Where |
|---|---|
| Horizon-cube texture lookup instead of a shadow map | TC:16-21 |
| Rock/LiDAR work throttled to 500 ms, not debounced ("a pure debounce never fires until the rover stops") | TC:1044-1050, 2334-2359 |
| Local raycast while playing, because the backend scan takes about 4.7 s | TC:948-959, 2516-2522 |
| Only rocks within 60 + 4.5 m are raycast | TC:2494-2505 |
| DEM height-field march instead of raycasting 500k triangles | LID:698-702 |
| 8 instanced draw calls for gravel "instead of the three and a half thousand" | TC:659-679 |
| Gravel `frustumCulled=false`; hidden in orbit | TC:1208-1212, 2447-2453 |
| Scratch quaternions ("pure garbage at 60 Hz") | TC:803-807 |
| Rover pose effect split from the heavy effect | TC:2183-2188 |
| Orbit setup not keyed on playback | TC:2843-2851 |
| `controls.update()` only when enabled | TC:1825-1829 |
| DOM rock boxes pooled; updated after render | TC:1728-1732, 1866-1870 |
| Shared welded icosphere cache | TC:532-547 |
| Template welding done once | TC:408-414 |
| Continuous rAF loop with no idle throttling; no LOD or chunking on the terrain (one mesh) | TC:1823-1872 |
| Disposal on unmount | TC:1658-1689, 1874-1885 |

**Not disposed on unmount:** the sun flare texture and material, and the route group's meshes.

### 4.9 Cesium and unused assets
- **Cesium:** confirmed unused.
  - Zero hits in `frontend\src`, `package.json`, `index.html` and the vite config.
  - `public/cesium` (372 files) is gitignored (`.gitignore:83`, 0 tracked files). The `.gitignore` comment says it is "copied from the CesiumJS package by build", but no build step does that (the build script is `tsc && vite build`).
  - The only mentions are research and spec docs (`docs\final\frontend-and-simulation-decision-report.md`, `docs\superpowers\specs\*`).

| Asset | Used? | Notes |
|---|---|---|
| `viper-rover-textured.glb` | Yes, primary (TC:1445) | Tracked. Nodes: `rover_body` > `wheel_fl` / `rl` / `fr` / `rr`. 1 material, 3 JPEG textures. |
| `viper-rover.glb` | Fallback only | Tracked. Untextured; wheels `wheel_1`/`2`/`4`/`wheek_3`. |
| `yutu-rover.glb` | No references | Tracked (force-added; `*.glb` is ignored at `.gitignore:82`) |
| `space-exploration-vehicle.glb` | No references | Untracked and ignored |
| `rover_cockpit_overlay.png` | No references | Tracked |
| `moon-lroc-wac-global-1024.jpg` | No references | — |
| `nac-site11-2048.jpg` | Yes (TC:145) | Also used as a CSS background at CSS:4788 |
| `nac-site11-detail-2048.jpg`, `earth_disc.jpg`, `nasa_rocks/*.json`, `bsc5.bin` | Yes | — |

### 4.10 Gray points
1. **Wheel pivot bug (strongest finding; confirmed by in-memory simulation).** The pivot loop (TC:1306-1380) mutates the tree during `traverse`. The new `*_steer` groups also match `/whee[lk]/`. Simulated on the textured GLB's tree, the result is:
   - 8 wheel entries.
   - `wheel_rl` and `wheel_rr` never get a pivot, so they never spin or steer.
   - `wheel_fl` ends up wrapped in 7 nested pivots and is spun by several entries.
   - The front/rear split and the wheelbase are computed from these skewed entries (TC:1384-1397).
   - The legacy GLB has the same parent/child shape.
2. **Forward sign likely reversed (unverified).** The fit only aligns the long axis. The textured GLB's front wheels sit at +X, and after `rotation.y = π/2` +X maps to -Z, while the heading maths assumes +Z forward. The rover may drive rear-first.
3. **3-D colouring ignores the rover and weights.** The manifest fetch carries no `rover_id` or `w_*` (TC:1546), so cost and traversable layers always show backend defaults. DOC:66-70 says they depend on both.
4. **Photo toggle mismatch.** App defaults `photoDrape` to true when available (APP:1191). It then shows the 2010 note and hides the ephemeris slider (APP:1216-1236). But the default FPS view renders the simulated mask, because photo needs orbit (TC:1074).
5. **2D↔3D remount resets state** (APP:1152): camera mode, LiDAR toggle and the boulder anchor. The anchor is the rover node, or the grid centre with no route (TC:2362-2395). So rock placement depends on the session. The comment "starts ahead and to one side" (TC:2391) only holds because of the table offsets.
6. **FPS gaze and stacking**
   - The gaze follows the downhill gradient, not the route or heading (TC:2822).
   - It is reset on every playback tick, which overrides drag-look.
   - The initial `fpsAngles` value (0.35, 0.02) is dead (TC:2762).
   - FOV persists across mode switches; only orbit resets it.
7. **Height stack.** Route at node altitude + 4 m; eye at nearest node + 3.2 m (not bilinear); LiDAR origin at + 1.6 m; rover on bilinear height. In FPS the ribbon floats about 0.8 m above eye level.
8. **Origin mismatch.** The terrain net, pebbles and scan seed use the non-interpolated node (TC:2369-2370, 2506, 2565). `lidarOrigin` is interpolated (TC:2314).
9. **Rock scale leak (code reading).** The 3× orbit scale persists into later orbit scans, so LiDAR raycasts hit scaled rocks. This contradicts the comment at TC:2547-2548. Rebuilds only happen when `verticalScale` changes (TC:2384-2386).
10. **Steer easing is update-rate dependent.** The 0.25 factor applies per React effect run, not per distance or frame (TC:2297).
11. **Sun and Earth placement**
    - The drawn sun sits at the 20° floor, not the true ~1.2°.
    - Before the first sun effect, the flare starts at (0, 55000, 0) from the light's default position (TC:1605).
    - The Earth is a fixed offset, not taken from `/api/earth-series`. Its derived angular size is about 8.2° from the origin (the real value is about 1.9°).
    - Star azimuth is uncalibrated.
12. **Randomness.** The Milky Way uses unseeded `Math.random`, so it differs on every load (SKY:421-452). Seeded sources:
    - Rock texture `0x4c554e41`
    - Regolith `0x5245474f`
    - Pebble variants `0x9e3779b1 + i*0x85ebca6b`
    - Boulder seeds `0x4f11..0x4f68`
    - Scan seed hashed from row/col
13. **Colour space.** Canvas textures for the sun flare, LiDAR dot and star sprites set no `colorSpace`. The star shader writes colour with no colour-space conversion. Hex `THREE.Color` values are linearised, so the ramp lerps happen in linear space. The NaN colour is raw linear floats.
14. **Asset-dependent visuals.**
    - Earth limb measured at r = 428 / 512 (TC:243-249).
    - The NAC detail texture was preprocessed offline with no script in the repo.
    - `frontend/simplify_rock.mjs` is cited (TC:394, 1010) but does not exist. `frontend\scripts\split_rover_glb.mjs` does exist.
15. **Pick handler has no HUD exclusion** (TC:2977-3011), unlike the FPS handler. A HUD click in pick mode may also pick a cell.
16. **Stale or dead code.**
    - `generateRockField` is used only by tests, so the comments at LID:300-303 and TC:2494-2498 ("field runs to 500 m") are stale.
    - Same for TC:1170-1172.
    - The sweep buffer holds 32 vertices but only 2 are drawn (TC:1519, 1863).
    - Hidden mast and head are still rotated.
    - `minDistance` is 12 at build vs 150 on orbit entry.
17. **Contract doc vs code**

| Topic | DOC | Code |
|---|---|---|
| Sun colour / intensity | 0xfff6e5 / 3.0 (DOC:240) | 0xfff6ee / 3.6 (TC:1164) |
| Sun distance | ×20000 (DOC:253) | ×span·4 (TC:2135) |
| Sun elevation | true value (DOC:247) | floored to 20° (TC:2129-2130) |
| Series query | 09-01, 24 slices × 1 h (DOC:103, 237) | 09-07, 12 slices × 12 h (TC:129-130); App's "Day = slice/2" depends on this |
| Shadow application | DataTexture (DOC:264) | nearest-sampled vertex colours (TC:2160-2166) |
| vx suggestion | 1.5 (DOC:48) vs "1.0" in a comment (DOC:232); the doc contradicts itself | manifest value in orbit, 1.0 in FPS |
| Example ramp | (t, 1-t, 0.35) (DOC:219-223) | `RAMP` table |
| Route height | `(alt - min)·vx` (DOC:274-275) | +4 m (TC:2698) |
| `/api/lidar-scan` | absent from DOC | used (LID:825-842) |

    Row axis, NaN pinning and the 250² downsample agree between doc and code.

### 4.11 Rough size
| Measure | Count |
|---|---|
| Lines | TC 3119, SKY 466, LID 990, LPC 162, LPL 141 |
| `useEffect` blocks in TC | 13 |
| Camera modes | 2 |
| Distinct visual elements | About 20: terrain, stars, halos, Milky Way, Earth, sun flare, ribbon, centerline, 2 markers, boulders (47), gravel (8 variants), rover GLB, hidden placeholder, LiDAR points, sweep, net, rock boxes, LiDAR HUD, camera switch, status text |
| Interactions | About 10: FPS drag, FPS wheel, orbit mouse/touch, pick, 2 camera buttons, LiDAR toggle, plus App-level photo checkbox, slice slider, 2D/3D toggle and playback |
| Named constants | TC 27, SKY 11, LID 5 objects (`LIDAR_CONFIG` 8 fields, `ROCK_FIELD` 9 fields, 47-entry boulder table, 3 tiers) |
| Colour literals | 38 hex in TC (30 unique); 26 rgba strings in TC + SKY |
| Inline magic numbers | Roughly 150 or more |

## 5. Feature panels, assistant and mission report

Root: `frontend\src`. Paths below are relative to it; `F/` = `features/`.

**What this covers:** all 33 registrations, plus the two non-rendering contributors (`analysis-job`, `plan-request`).

**Not verified:**
- Pixel values for the six panels styled only in global `App.css`. I give line pointers, not full rules.
- Backend response contents.

**Key facts:**
- **The assistant does not stream.** One JSON response per request. The "typing indicator" is a three-dot line under the stage text.
- **The pixel spec needs `App.css` as well as the feature stylesheets** (tokens and legacy rules).

---

### 5.1 Where each panel mounts (from `selectFeatures` / `selectSystemsFeatures`, registry.ts:317-347)

| Surface | Plan mode | Analyze mode |
|---|---|---|
| leftRail (primary) | `mission-setup` | *(empty, so the left rail is hidden, App.tsx:1066/1082)* |
| rightRail (primary), `RailTabs` | *(empty, so the right rail is hidden)* | **Route:** mission-context, route-analysis, cost-explain · **Safety:** safety-margins, route-model · **Analysis:** uncertainty, stress-test, risk-sweep · **Compare:** benchmark, profile-compare (10 total) |
| canvasOverlay | layer-picker, map-legend, analysis-layers, solving-indicator | same 4 |
| statusBar | – | playback |
| bottomDock | – | time-axis |
| globalOverlay | assistant | assistant, mission-report (renders null without a plan) |
| Systems drawer | 13: ros-showcase, layer-provenance, replan, mission-constraints, psr-validation, safe-haven, earth-visibility, coarse-fields, thermal-envelope, illumination-corridor, mission-validation, corridor, pose-loop | 11: the same minus replan and mission-constraints |
| Nowhere | `mission-snapshot` (`modes: []`, registry.ts:156) | same |

**Rail tabs** (shell/RailTabs.tsx):
- Tabs are Route/Safety/Analysis/Compare with icons route/shield/analytics/balance (registry.ts:90-95).
- The default tab is `route`. It is not persisted.
- A tab with no panels is disabled (opacity .3, shell.css:91).
- The Safety tab shows a badge with the number of violated requirements (`has-finding` turns the label `--coral-text`, shell.css:115-132).
- The "pinned" path for untabbed features (RailTabs.tsx:40-59) is never used today, because no rightRail feature lacks a tab.

**Systems drawer** (shell/SystemsDrawer.tsx; CSS in App.css:4341-4465):
- Opened by the top-bar button "Systems" (TopBar.tsx:105-113). Its title text: "ROS bridge, reality check, provenance, corridor, pose loop and replan triggers".
- Slides in from the right, width `min(820px,94vw)`, background `--glass-strong` rgba(8,11,18,.96), left border rgba(79,216,240,.2).
- The backdrop is rgba(3,6,14,.55). z-index is 200 for the backdrop and 201 for the drawer.
- Header: kicker "DIAGNOSTICS & PROOF", title "Systems & Evidence" (24px, weight 800), close button "✕" (32×32).
- Subtitle: "The ROS bridge, provenance, reality check, corridor, pose loop and replan triggers behind this cockpit. Not part of placing a route — kept one click away."
- Grid: `repeat(auto-fill,minmax(340px,1fr))`, gap 16; one column at ≤720px. Esc closes.
- **Panels mount only while the drawer is open** (`open &&`, SystemsDrawer.tsx:78).

**Stacking order** (per CSS comments):
- Map overlays: up to 3
- Assistant: 100
- Loading / landing screens: 110 / 120
- Toasts: 150
- Systems drawer: 200 / 201
- Report scrim: 300

---

### 5.2 Per-feature inventory

Shared building blocks:
- `rail-section` and `panel-kicker` come from App.css:1053/1085.
- Instrument components (`components/Instrument`):
  - **Readout:** mono figure at `--fs-value`, with a coloured left border.
  - **Meter:** 8px track with ticks. `origin .5` makes it diverge from the centre; it can carry a marker.
  - **Field / FieldRow / Divide:** small label-value pairs and a labelled rule.
- **Tone colours:** data = cyan, ok = mint (value `--mint-text` #93dcc4), **warn = cyan (not amber)**, bad = coral, muted = `--text-dim` (instrument.css:54-106).

#### Primary / overlay features

| id · slot · modes · group · tab | What it renders (verbatim strings) | States | Interactions → calls / overlays | Visuals & styling |
|---|---|---|---|---|
| **mission-setup** · leftRail · plan · primary (registry:146; F/mission-setup/MissionSetupPanel.tsx) | **Sections:**<br>1. "Mission targets": button "Select Start" / "Pick on map…" / "START r, c" (pin icon), plus `row`/`col` number inputs (placeholder "--", clamped 0..rows-1, falling back to a 500×500 grid, :95-96). Same pattern for Goal ("Select Goal" / "GOAL r, c", flag icon); Goal is disabled until Start is set.<br>2. "Mission sequence", 4 steps:<br>&nbsp;&nbsp;• Rover → rover id uppercased, or "SET"<br>&nbsp;&nbsp;• Start → "r, c" / "PICKING" / "SELECT"<br>&nbsp;&nbsp;• Goal → "r, c" / "PICKING" / "WAITING"<br>&nbsp;&nbsp;• Route → "LOCKED" / "NOT GENERATED"<br>&nbsp;&nbsp;Below the steps: "Undo" (title "Undo the last point placed (Ctrl+Z)"), "Clear" (title "Clear start and goal points"), and the main button "Generate Route" / "Computing Route..." / "Re-plan with new weights".<br>3. "Assigned vehicle": rover card with photo, name, ID, class, and Battery Wh / Speed m/s / Max slope ° / Mass kg; button "Change vehicle".<br>4. "Route priorities": read-only Slope Safety / Energy Use / Shadow Exposure / Thermal Risk, to 3 decimals. | **Hints:**<br>• "Select a Start point on the terrain first."<br>• "Select a Goal point on the terrain to enable routing."<br>• Stale: "Route priorities changed. The route on the map still reflects the previous weights."<br>• No rover yet: "Loading rover specifications..."<br>**Disabled:** Undo/Clear while solving or with no points; Generate without both points or while solving. | MissionActions: `setClickMode`, `placeEndpoint`, `planRoute` (→ POST /api/plan, App-level), `resetMission`, `undoPlacement`, `openFleetSelect`. No overlay. | Styled only in App.css: `.lp-pick-btn` 3477, `.lp-coord-field` 3429, `.lp-sequence-item` 3367, `.lp-panel-plan-btn` 4606, `.lp-panel-hint(.is-stale)` 4541/4548, `.lp-selected-rover-card` 2943/5588, `.lp-change-vehicle-btn` 4585. |
| *(RoutePriorities, in the same folder but not a slot feature; rendered in the hangar, components/Fleet/FleetSelectionView.tsx:226)* | **Step "1 Mission profile":** profile cards from GET /api/profiles; icons balanced→balance, energy_saver→eco, fast_recon→speed, shadow_traverse→shadow; `--profile-color` comes from the backend.<br>**Constraint chips:** Max Slope / Max Shadow / Energy Budget / Min SoC, each badged "IN SEARCH" or "POST-SIM".<br>**Step "2 Route priorities":** 4 or 5 weights (Surface Roughness only if the roughness layer is loaded; fallback 0.15). Each row has an info button, a range 0–2 step .01, and a number input step .001. | "Loading mission profiles…". The fetch error is captured (useMissionProfiles.ts:46) but **never rendered**. | `setWeights`. A profile counts as active if every weight is within 0.011. | App.css `.lp-profile-card` 3106, `.lp-range-input` 3338. |
| **mission-snapshot** · leftRail · `modes: []` (**unreachable**) (MissionSnapshotPanel.tsx) | "Mission snapshot" + "LOCKED" pill; "Active mission telemetry and route trajectory are locked for analysis."; button "↺ Edit & Replan"; "Active rover" (Wh Cap / m/s Vmax / Max °); "Trajectory waypoints" START/GOAL `[r, c]`; "SOLVER WEIGHTS (READ-ONLY)"; footer "To modify solver weights or select new endpoints, use **Edit & Replan**." | – | `setMissionMode('plan')` | App.css `.lp-snapshot-card` 3800, `.lp-replan-btn` 3778. |
| **mission-context** · rightRail · analyze · tab route (MissionContextPanel.tsx) | **"Surface picker telemetry"** grid: Pixel [row, col] · Latitude (4dp °) · Longitude · Elevation (1dp m) · Surface temp (1dp °C).<br>**Optional "Measured products"** (+ chip "MEASURED"): Roughness m / Roughness criterion / In PSR Yes/No, plus note "LOLA LDRM, a 100 m baseline posted at 50 m/px: this is the covering pixel's statistic, not the cell's own roughness. PSR is NASA's measured mask — evidence, not a forbidden region."<br>**Optional "Safe haven":** Is a haven / Time to haven ("No reachable haven" if null) / Longest dark, no DTE / Earth below horizon / Rover shadow limit.<br>**Optional "Survival"** (+ "MODEL"): P(safe) ("Cannot reach safety" when 0) / Best action / Coarse block / Horizon, plus note "A {k}x block, not this 5 m cell…".<br>**Optional "Thermal dwell"** (+ "UNCALIBRATED"): Max dwell ("≥ x h" when open-ended) / Limit reached ("None in window") / Envelope / Starting inner.<br>Haven-reason fallback: the backend's sentence. | No loading or error text. Each section appears only when data exists. Missing values show "--". | `useFocusTelemetry` (pointer, then goal, then start) and GET /api/cell-telemetry, debounced 220ms (useCellDetail.ts:34). Survival/thermalDwell flags are sent only when an epoch (and a goal) exist. | mission-context.css:<br>• MEASURED chip `--risk-low` (blue), MODEL chip `--lavender`, UNCALIBRATED chip `--risk-med`<br>• `.is-unreachable` `--risk-med` in the label font<br>• grid from App.css 3762 |
| **route-analysis** · rightRail · analyze · tab route (RouteAnalysisInspector.tsx) | **"Route":** rover name plus the **hard-coded "South Pole Traverse"** (:121); START/GOAL `[r, c]` with lat/lon as "88.9025° S, 73.9967° W".<br>**Overall-risk block:** "Overall risk" + LOW/MEDIUM/HIGH/CRITICAL + a 5-segment meter (filled 2/3/4/5) + a meaning sentence (:18-23).<br>**"Mission decision summary"** KPIs: Route distance, End battery (`batteryToHex`), Route speed, Estimated duration, Route nodes, Recharges "N stops".<br>**"Engineering analysis":** Steepest segment, Planner effort "N nodes", Total energy, Compute time ("< 50 ms" fallback).<br>**"RISK DISTRIBUTION"** segmented bar + legend "LEVEL n%".<br>**"LiDAR payload cost"** "{n} W Draw": "Simulate optional science payloads against transit battery capacity."; inputs Instrument W (0–300, step 5, **default 35**, App.tsx:181) and Survival Heater W (0–150, step 5, **default 10**); results Overhead Wh / Battery cost % / Arrives with %.<br>**"Route milestones"** timeline: START, then WP 0xx at 25/50/75% (only if >10 waypoints), then GOAL; each row "[col, row] · m", "Slope: x° \| Temp: x°C" + risk chip. | null without a plan. | `setPayloadW` / `setHeaterW` (also feed the report donut). | App.css: `.lp-verdict-block` 5763, `.lp-decision-kpi-grid` 3924, `.lp-risk-segmented-bar` 3984, `.lp-milestone-entry` 4087. Risk colours from `riskToHex`: LOW #4a8fd8 (**blue**), MEDIUM #e3d548, HIGH #d69770, CRITICAL #ed4b3d. |
| **safety-margins** · rightRail · analyze · tab safety (index.tsx; SafetyMarginsPanel.tsx) | Kicker "Formal Safety Margins".<br>**Readout:** label "All requirements met" / "Requirements violated" / "Verdict pending" / "Not evaluated"; value "met/n" with unit "met"; sub "Tightest **Rx** ±0.00 unit".<br>Divide "Robustness"; axis labels "violation · 0 · margin".<br>**One row per requirement:** icon, id, name, value (or Margin / At limit / Violated / Undecided / Not checked), diverging Meter.<br>**Footer:** "{n} untested — which is not passed." and "Requirement text and claim in the mission report." | null when the plan has no safety block. | Reads the plan only (no fetch). Also drives the Safety tab badge. | safety-margins.css: satisfied icon mint; violated coral / `--coral-text`; boundary `--cyan-text`; untested opacity .55; row grid 15px 48px 1fr auto. |
| **route-model** · rightRail · analyze · tab safety (index.tsx; RouteModelPanel.tsx) | Kicker "Route Cost Model". Lede: "What the planner charged this route, and how sure each figure is."<br>**Sections** (each has a validity chip):<br>• "Mobility · slip": Mean slip / Max slip (hint "at x°") / Wheel dist. ×; "x h  y Wh added by slip"; explanation line<br>• "Risk appetite": Alpha / Tail mult. / Slip μ → tail; "ranking only h → h"<br>• "Roughness": Mean / Max / In PSR ("not checked")<br>• "Execution survival": Failure prob. / β / Moves refused<br>• "Thermal dwell": Min margin / Inner temp / Open-ended<br>Footer: "Claims and sources in the mission report." | **Absent texts:**<br>• "**Not applied.** This rover profile declares no slip curve…"<br>• "**Nominal.** The cost grid is the ordinary one, bit for bit. Switch on **Risk appetite** under Advanced Constraints (Systems, in plan mode)…"<br>• roughness: "…`scripts/setup_caches.py` builds it…"<br>• survival/thermal: "Not requested — …" / "Requested but not applied…"<br>null when every block is empty. | Plan only. | route-model.css: chips with a solid border for MEASURED, dashed for MODEL, dashed + dimmest for UNCALIBRATED. No risk colour. |
| **playback** · statusBar · analyze (PlaybackBar.tsx) | Button "▶ Play" / "❚❚ Pause"; "Waypoint 001 / 123"; range slider over steps.<br>Clock: "MISSION TIME T+hh:mm:ss"; "SPEED x m/s" or "RECHARGING"; time-scale buttons 1× 10× 60× 300× (**default 1**, App.tsx:238). 1× title: "Real time: one second on screen is one second of mission".<br>Readouts: COVERED km / BATTERY % (`batteryToHex`: >50 blue, >25 yellow, >10 orange, else red) / SLOPE °. | null with 0 waypoints. | `setPlaybackStep`, `setPlaying`, `setTimeScale`. Pressing play at the end restarts from step 0. | App.css `.lp-playback-dock` 4159, `.lp-play-btn` 4174, `.lp-scale-btn` 6099. |
| **time-axis** · bottomDock · analyze (TimeAxisPanel.tsx; useTimeAxis.ts) | **Row of controls:** play ▶/❚❚ (disabled unless the cube varies with time); slider 0..slices-1; "+x.x h"; checkbox "Layer" (**default off**); select Shadow / Surface temp (default shadow); button "Plan through time" / "Planning…".<br>**"Require" toggles:** "Earth link", "Haven deadline", "Stay lit" (all default off), each with a title tooltip.<br>**Reason notes**, deduplicated: "The illumination series has not loaded yet." · "The shadow series came back static, so there is no time axis to enforce this against.…" · "The earth_visibility layer is not loaded on this deployment."<br>**Notes:** "No time series — this cube does not vary with time, so it is not animated." · "Sun: x° elevation · y° grid azimuth · utc".<br>**Verdict:** "**The planner chose to wait.** n wait step(s), m move step(s); arrival at h over a H h window." or "No waiting: …". Errors pass through `cleanShadowReason` (cuts SPICE banners, max 160 chars). | Error text, e.g. "Pick a start and a goal first." | GET illumination-series manifest + cube (24 slices × 6h, downsample 2) → POST /api/plan-4d (n_slices 256, coarsen 4, plus contributors). Overlay `time-axis`: field ramp (shadow white→black, or COOLWARM) at **opacity .35**; 4-D route polyline **#baaff5, 2.5px, .95**. Animation tick every 120ms. | time-axis.css: plan button cyan-tint (border rgba(79,216,240,.4), bg .12, text `--cyan-text`); slider `accent-color: --cyan`. |
| **layer-picker** · canvasOverlay · all (LayerDropdown.tsx) | 2D/3D toggle (**default 2d**). Trigger "Layer" + current name + ▾/▴.<br>Menu groups:<br>• Terrain: Surface "Lunar Regolith Topography & Hillshade" / Slope "Terrain Incline (Degrees)" / Aspect "Surface Facing Direction"<br>• Environment: Thermal "Surface Temperature (Kelvin / °C)" / Shadow "Permanent Shadow Region Ratio"<br>• Planning: Cost "A* Multi-Factor Weighted Cost Grid" / Traverse "Rover Incline & Obstacle Mask"<br>Selected item shows ✓. Default view: surface. | Closes on outside click. | `setViewMode`, `setDimension`. | App.css `.map-overlay-top-right` 1635, `.lp-map-controls-dock` 2634, `.lp-dim-btn` 2650, `.lp-layer-trigger` 2673. |
| **map-legend** · canvasOverlay · all (index.tsx) | "0 – {spanKm} km · {res} m/px" with a 46px rule; separator; "RISK" + Safe / Caution / High / Critical, each an SVG line 20×8, stroke 2.4, risk colour **plus dash pattern** (none / 10 5 / 4 4 / 1.5 3.5). | – | none | map-legend.css: bottom-centre 18px, blur 6px, pointer-events none; risk part hidden at ≤900px. |
| **analysis-layers** · canvasOverlay · all (index.tsx; AnalysisLayersPanel.tsx; layers.ts) | Trigger "Analysis" + "None" / "N on". Panel "Analysis overlays", 7 toggles (◼/◻), each with label + validity badge + blurb + limit line:<br>• Roughness<br>• PSR mask<br>• Earth visibility<br>• P(traversable)<br>• Slope σ (ours)<br>• Elevation σ (NASA)<br>• Slope σ (NASA)<br>Full blurbs and limits are in layers.ts:71-155. | " loading…" · "Not available on this deployment. {backend reason}" + remedy `python scripts/…py` · error message (is-error). | GET /api/layers/{name} binary (downsample 2) → overlay `analysis-layers`. Ramps use the layer's own min/max; PSR is a mask ≥0.5 in rgb(126,122,214). Opacities .55–.62. | analysis-layers.css: at top 68 / right 24; `.is-on` bg rgba(186,175,245,.12); validity colours MEASURED blue / MODEL lavender / DERIVED cyan / SYNTHETIC yellow. |
| **solving-indicator** · canvasOverlay · all (RouteSolvingOverlay.tsx) | Scan sweep + radar spinner; kicker "A* PATHFINDER · KINEMATIC SOLVER"; title "Computing route"; "Evaluating terrain slope, thermal constraints, shadow exposure, and energy consumption for **{rover}**."; tags "START: [r, c]", "GOAL: [r, c]", "Optimising path". Screen-reader text: "Computing route for {rover}. This may take a few seconds." | Only while `isSolving`. | none | App.css `.lp-solving-overlay` 2811, `.lp-scan-sweep` 2821, `.lp-radar-spinner` 2849. |
| **cost-explain** · rightRail · analyze · tab route | Kicker "Cost Breakdown". "row r · col c" + total (3dp) or "Impassable" / "unknown". Bars Slope / Energy / Shadow / Thermal / (Roughness), each with "w 0.000", a fill, and a value or ∞. Impassable texts: "Closed by **X**. This cell costs infinity — no route can cross it." / "Closed by the traversability gate, not by a cost component…" | Empty: "Hover a cell on the map to see what makes it expensive." (also shown on fetch failure). | GET /api/cell-telemetry on every focus change (**no debounce**). Overlay `cost-explain-hover`: point #e7eaf1, r5, .95. | cost-explain.css: fill `--cyan`; infinite = hatched `--risk-crit`. |
| **uncertainty** · rightRail · analyze · tab analysis | Kicker "DEM Uncertainty". Fields "P traversable" (hint "min x") / "Clones". JobState run button "Price on the clone ensemble" (levels icon).<br>Result: key "p5–p95" / "surface DEM"; per metric (Drive time / Drive energy / Lowest SOC / Longest shadow) a Divide + band Meter (tone warn = cyan) + "p50 …"; "Route stayed traversable in **n/N** clones". | JobState (see analysis-job row): busy "Pricing on 100 clones…"; stale "This band is for the previous route." | POST /api/dem-uncertainty (coarsen 1, per-step slices, start_utc). | uncertainty.css |
| **stress-test** · rightRail · analyze · tab analysis | Kicker "Monte Carlo Stress Test". Run "Run 1,000 executions".<br>Result: headline Readout "Reached the goal" % with sub "N runs · 95% CI a–b%" and an interval Meter; "Full success" rate bar; backend verdict sentence; Divides "Duration" / "Lowest battery" (histogram bars) / "First failure cause" (Battery depleted / Shadow endurance / Horizon exceeded).<br>Note: "A completion rate is not a safety verdict. The planner returned this route; this is how often a perturbed execution of it finishes." | busy "Executing…"; stale "This test is for the previous route." Tone: ≥.95 ok, ≥.5 warn (cyan), else bad. | POST /api/stress-test (n_runs 1000, seed 0, coarsen 1). | stress-test.css: histogram bars cyan. |
| **risk-sweep** · rightRail · analyze · tab analysis | Kicker "Risk Appetite Sweep". Run "Plan at α 0.5, 0.9, 0.99" (balance icon).<br>Result: "Nominal **h** · **Wh**"; rows "α x" + "route unchanged" / "n% new cells" + Meter + "±h · ±Wh"; backend note verbatim. | busy "Planning 3 more routes…"; stale "This sweep is for the previous **mission**." | POST /api/risk-sweep | risk-sweep.css |
| **benchmark** · rightRail · analyze · tab compare | Kicker "External Benchmark". "Independent slope-thresholded occupancy benchmark, 36 maps."<br>Rows 10° / 15° / 20°: "**33.3%** vs 100%" + Meter with a benchmark marker + "8 of 12 maps are connected only by cutting a corner…" or "No map depends on cutting a corner; the two models agree."<br>Match line: "Under the benchmark's own motion model, LunaPath reproduces … (651.81 · 636.16 · 620.24)."<br>Framed "Claim boundary" (MOONPLANBENCH_CLAIM); source line. | Static data, no states. | none | benchmark.css: match line mint left border; claim icon lavender. |
| **profile-compare** · rightRail · analyze · tab compare | Kicker "Profile Comparison". Button "Compare all profiles" / "Comparing…"; backend recommendation sentence.<br>One card per profile: colour swatch, name, "RECOMMENDED" (safest); Distance m / Cost / Max slope ° / Nodes; status "Violates: …" or "No violations · Safest envelope \| Lowest weighted cost \| Shortest path"; "Not checked: …"; a failed profile shows its error. | Error "Pick a start and a goal first." / message | POST /api/compare. Overlay `profile-{id}` polylines in the backend colour, 2px, .85. | profile-compare.css: run button cyan-tint. |
| **assistant** · globalOverlay · all | See section C. | | POST /api/ai/chat | assistant.css |
| **mission-report** · globalOverlay · analyze | See section D. | | none (reads the plan already in state); CSV is a client-side blob | report.css |

#### Systems-drawer features (group `systems`; every one renders inside a `rail-section` with a `panel-kicker`)

| id · slot · modes | What it renders (verbatim strings) | States | Calls / overlays | Style notes |
|---|---|---|---|---|
| **ros-showcase** · leftRail · all | "ROS 2 Integration".<br>Disclaimer: "Not a live connection. These run in a ROS 2 Jazzy environment beside the backend; the browser has no bridge to them."<br>Groups Nodes (4) / Interfaces (5) / Tooling (3), each item = name + detail + code path (RosShowcasePanel.tsx:11-46).<br>Note: "…of the 35 modules in backend/app/, only main.py imports fastapi…" | static | none | ros-showcase.css: disclaimer amber rgba(227,…) |
| **layer-provenance** · leftRail · all | "Layer Provenance". Layer code name + badge Measured / Modelled / Derived / Synthetic / Unknown + explanation; description; Range "a – b units" or "unknown"; No-data cells.<br>Optional "DEM uncertainty" card: Clones / Site / Near-field fill / Slope limit used; "Held fixed across every clone: …"; link "PGDA product".<br>Optional "Illumination uncertainty" card: 40px per-slice bar strip; Mean P(lit) / Uncertain now / Worst slice; explanation text. | "Reading layer provenance…" · error · "No manifest entry for `x`." | GET /api/terrain manifest (shared hook); GET /api/uncertainty-series (8×6h). | Badge colours as analysis-layers; current slice in strip marked. |
| **replan** · leftRail · plan | "Replan Triggers". Hint "Leave a field blank to report that value as unavailable — the check that needs it comes back "Not checked", not "Clear"."<br>**11 number inputs** (placeholder "not reported"), defaults from mission/triggers.ts:16-60: Actual SoC .62, Planned SoC .7, Actual inner °C -8, Predicted inner °C -5, Drift (min) 12, Lateral offset (m) 12, Corridor half-width (m) 20, Earth visibility left (min) 45, Position 1σ (m) 6, Map progress (m) 180, Odometer claim (m) 210.<br>Buttons "Evaluate triggers" / "Evaluating…", "Force replan".<br>Verdict "Replanned — n trigger(s) fired" or backend reason / "No replan trigger fired". 7 trigger rows Fired / Clear / Not checked + detail "Missing telemetry: …". | Error "Pick a start and a goal first — a replan starts from where the rover is." | POST /api/replan | replan.css |
| **mission-constraints** · leftRail · plan | "Advanced Constraints". **Only one row renders**: STORE_CONTRIBUTORS evaluates to `[risk]`; roughness drops out because there is no context (contributors.ts:265-275). Row: switch + "Risk appetite" + hint "Ranks routes on the adverse tail…"; when on, a range 0.5–0.999 step .001, initial 0.9, shown to 3dp.<br>Footer: "None enabled — the plan request is unchanged." or "1 field added to the plan request." | – | Writes the plan-request store (consumed by POST /api/plan) | mission-constraints.css: lavender switch |
| **psr-validation** · leftRail · all | "PSR validation". "Our shadow model against {product link}, at shadow_ratio ≥ 0.99."; Jaccard / PSR recall / Dark precision / PSR cells "n of N" / Median coldest inside / outside; backend reading + claim; per-layer validity. | "Loading…" · reason + remedy · error | GET /api/psr-validation?0.99 | psr-validation.css |
| **safe-haven** · leftRail · all | "Safe haven". Checkbox "Show on map" (default off); view buttons Havens / Time to haven / Longest dark / Earth below, with blurbs (useSafeHaven.ts:36-61).<br>Facts: Havens / Earth below / Rover shadow limit / Sampling / Epoch; "x% of cells can reach no haven at all…"; backend rule. | needsEpoch text "Needs a mission epoch. A safe haven is defined against…"; backend messages / remedy / error | GET /api/safe-haven + binary field. Overlay: mask #5fe3b0 at .6, or ramp TIME_TO_HAVEN / DARK_HOURS at .58. | safe-haven.css |
| **earth-visibility** · leftRail · all | "Earth visibility". Headline "Earth in view" (cyan) / "Earth below the horizon" (yellow) + detail (format.ts:29-66); Earth elevation / Terrain horizon / Azimuth / Cell; "Bounded by a N-day search…".<br>"Link fraction across the site from YYYY-MM-DD": 28 bars, current bar lavender; detail sentence; "Static model: …". | needsEpoch text; errors | GET /api/earth-series (28×24h); GET /api/comm-window debounced 260ms. No overlay. | earth-visibility.css: bars rgba(79,216,240,.42) |
| **coarse-fields** · leftRail · all | "Survival & dwell". Badges "MODEL", "LAG UNCALIBRATED". "Show on map" (default off); field buttons P(safe) / Best action / Max dwell / Envelope side (fields.ts:125-164); blurb, limit, "At T+x h on the mission clock."<br>Categorical legend with counts (Already safe / Drive / Wait / No action helps; Stays inside / Cold limit / Hot limit; "Unrecognised code").<br>Survival facts: Mean P(safe) / At least 0.95 / Exactly zero (alarm) / Blocks. Dwell facts: Median / Cold-limited / Hot-limited / Open-ended. | needsEpoch / needsGoal texts ("Survival needs a goal…"); messages | GET /api/survival, /api/thermal-dwell (coarsen 4). Overlay: ramps P_SAFE / DWELL, or one mask per category, opacity .6/.62. | coarse-fields.css |
| **thermal-envelope** · leftRail · all | "Thermal envelope". Badges {validity} + "LAG {x}"; lede "{rover} inside lo–hi °C (component), starting from x °C, no heater".<br>CSS-grid **bin matrix** (rows = Sun elevation, columns = slope along the Sun's azimuth). Cell colours: unlimited rgb(110,186,150), cold rgb(92,152,226), hot rgb(226,128,76), unsampled transparent, absent hatched. Cell tooltips from matrix.ts:77-90.<br>Legend Stays inside / Cold limit / Hot limit / Not sampled with counts; "x% of bins are blank because the heat1d trace never reached that geometry…"; claim. | "Loading…" · message + remedy | GET /api/thermal-envelope | thermal-envelope.css:75-92 |
| **illumination-corridor** · leftRail · all | "Illumination corridor". "Show on map"; field buttons Corridor / Lit & passable / Dwell hours.<br>"Not enforced. The planner was not gated on this corridor — the route on the map may leave it." (yellow).<br>Facts: Corridor voxels / Pruned away / Components / Slice; "n blocks in this slice…"; Lit rule / Pruning (backend text). | needsEpoch; "Loading cube…"; errors | GET /api/illumination-corridor (8×6h, coarsen 4). Overlay masks CORRIDOR rgb(120,214,196) / LIT_SAFE rgb(72,138,132) at .55; dwell ramp at .6. | illumination-corridor.css |
| **mission-validation** · rightRail · all | "Reality Check". Table Mission / Distance / Rate / As of + a "This route" row ("driving only"); backend note; caveat paragraph; "Slope distribution" bars; "Risk mix"; "Surface temperature along route: …". | "Loading published mission figures…" · error · "Plan a route to compare it against these missions." | GET /api/reference-missions | mission-validation.css |
| **corridor** · rightRail · all | "Corridor". Corridor id (title "Echo this back to /api/pose") + "N segments"; "Narrowest point: **x m** of lateral room at segment i"; scrolling table # / Half-width / Slope cap / Energy / Thermal (K·s). | "No corridor. Plan a route first — …" · "Grid has no georeference; corridor cannot be placed." | Plan + manifest. Overlay: ribbon #4fd8f0 at .22; haven points #4a8fd8 r2.5 .7. | corridor.css |
| **pose-loop** · rightRail · all | "Pose Loop". Inputs: Easting x_m (step 5, default 0) / Northing y_m (0) / Heading (grid °) (0) / Position 1σ (m) (3) / Heading 1σ (°) (5) / Odometer claim (m) (0); Source select dead_reckoning, visual_odometry, lidar_odometry, "skyline_fix (absolute)", "sun_sensor (absolute)".<br>Buttons "Seed from route", "Evaluate pose" / "Locating…".<br>Result: verdict = recommended_action with "_" → " "; Lateral offset / Half-width here / Along track / Segment; trigger rows. | "No active corridor. Plan a route first — …" | POST /api/pose. Overlay: pose point white #e7eaf1, yellow #e3d548 (stop_and_localize) or red #ed4b3d (fired); deviation line #e3d548, dash 4 3. | pose-loop.css |

#### Non-rendering contributors

**analysis-job** (F/analysis-job/JobState.tsx, useAnalysisJob.ts): the shared run shell used by uncertainty, stress-test and risk-sweep.
- **Run states:**
  - idle / failure: cyan-tinted full-width run button.
  - running: 12px spinner + busy label + "Cancel".
  - success: result.
  - stale: "{staleLabel}" with clock icon, result at opacity .45, and "Re-run for this route".
- **Failure messages** (net/errors.ts:328-342):
  - "Cannot reach the mission backend. Check that the API is running."
  - "No feasible route under the selected mission constraints. …"
  - "This data is not available on this deployment. …" (dashed, not an error colour)
  - "The backend refused the request as invalid. …"
  - "This analysis could not be completed; the route is unaffected. …"
- Job lifecycle:
  - No progress percentage.
  - A run is tied to the route identity it started for.
  - A second start while one is in flight is ignored.

**plan-request**: the contributor registry (5 contributors; 3 are 4-D-only: earth-visibility, safe-haven, illumination-corridor).

---

### 5.3 Assistant (F/assistant/*, api/assistant.ts, intent/*)

**Launcher** (index.tsx:74-118; css:14-105):
- Fixed `right:16px; bottom:56px` (clears the 44px status strip), 46×46, z-index 100.
- Border rgba(186,175,245,.4); background rgba(14,19,32,.94); `--shadow-pop`; cursor grab.
- **Content:** `<img src="/ui/chatbot_logo.png">` at 34px wide. The comment says the transparent mark replaced an inline SVG (index.tsx:103-115).
- **Hover:** border `--accent-lavender`, background rgba(28,34,54,.96). No transform, because the drag offset uses transform.
- **Unread dot:** 8px, bottom-right 7px, colour `--safe` (= #4a8fd8 blue), border 2px #11121b.
- **Accessible text:** aria `Open {label} (Turkish-language assistant)`; title `Open {label} — this assistant answers in Turkish. Drag to move it.`
- **Drag:** draggable while closed, with a 4px threshold separating click from drag (useDraggableWindow.ts:65). A drag suppresses the click.
- **When open:** opacity 0 and pointer-events none, but kept in layout so focus can return to it. At ≤980px it is `display:none`.

**Window** (css:107-153):
- 394px wide (one comment says 404px, css:1056).
- Height `min(640px,100vh-120px)`, min-height `min(480px,100vh-92px)`, max-height `100vh-92px`.
- **Closed:** opacity 0, translateY(8px), scale(.985), visibility hidden.
- **Open:** 0.15s ease. Reduced motion disables the transition.
- **Drag:** by the header, clamped so 64px stays visible (top edge clamped to 0); re-clamps on resize.
- **≤980px:** full screen with `inset:10px`.
- **Opening rules:**
  - Escape minimizes from anywhere and ignores IME composition (useAssistant.ts:81-91). It never clears the chat.
  - It never auto-opens on a new route (useAssistant.ts:124-136).
  - It does open on an "ask" from the mission report.
- **Hidden ≠ unmounted:** minimizing is a CSS state; conversation, level, draft and any in-flight request survive.

**Panel** (`.chat-panel`):
- Padding 14px 16px, gap 10, background `--bg-inset`, border `--line-card`, `--shadow-float`.
- **Header (also the drag handle):**
  - Product mark "LunaPath" with a crescent icon (`shadow` glyph), label font at micro size.
  - Title `<h2>` "Görev Rehberi" (planning) or "Analiz Asistanı" (analysis), set at 12px weight 500, followed by a **"TR"** badge (mono, button-line border, title "This assistant answers in Turkish").
  - Identity tooltip: "Asistan görevi yalnızca okur; rotayı değiştiremez."
- **Header buttons:**
  - "Yerine al": restart icon, lavender tint; only appears after the window has been moved; title "Pencereyi eski yerine getir".
  - "Yeni sohbet": add icon; disabled while the chat is empty (opacity .4).
  - Minimize: 26×26 close icon; aria "Görev Rehberini küçült" / "Analiz Asistanını küçült".
- **Mode:**
  - Derived, not user-set: `planning` when there is no plan, `analysis` once one exists (useAssistant.ts:121).
  - When the mode changes mid-chat, a divider is appended: "Rota temizlendi · Planlama modu" / "Rota oluşturuldu · Analiz modu".
  - Turns before the divider are not sent to the server.

**Explanation level** (ChatPanel.tsx:93-112, 777-806):
- Label "Nasıl anlatayım?", followed by " · seçim bekleniyor" in lavender until a level is chosen.
- Three-way segmented radio group:
  - Basit (hint "Sade dil, en fazla üç büyüklük")
  - Mühendislik ("İlgili büyüklükler ve gerekçe")
  - Teknik ("Veri yoğun, provenance ayrıntılı")
- L2 is pre-selected **only visually**: `.is-suggested` draws an inset ring rgba(186,175,245,.4).
- **Nothing can be sent until the user clicks a level.**
- Active level: background rgba(186,175,245,.14), text `--lavender-bright`. Arrow keys cycle.

**Empty state** (in this order):
1. Hero `/ui/chatbot_hero.png`: centred, max-width 300px, removes itself on load error.
2. Spark badge (26px box, lavender) next to the intro.
   - Planning: "Göreve nereden başlamak istersin?" + "Rover seçimi, rota öncelikleri, arazi katmanları, Start ve Goal seçimi, 2D/3D görünüm ve rota üretme akışı hakkında yardımcı olabilirim."
   - Analysis: "Bu görev hakkında ne öğrenmek istiyorsun?" + "Mevcut rotayı, seçili arazi noktasını ve görev profillerini deterministik LunaPath analizleri üzerinden açıklayabilirim."
3. A grouped list of suggestion chips (single outline, 9px 11px padding, icon 18px coloured by tone).
4. Blocked hints:
   - "Önce bir rota oluştur veya haritada bir başlangıç/hedef noktası seç."
   - "Soru göndermeden önce bir anlatım seviyesi seç."

**Quick prompts.** Chip label ≠ the question actually sent.

| Mode / condition | Label (shown) | Query (sent) | Icon · tone |
|---|---|---|---|
| planning | Bu ekranı nasıl kullanırım? | Bu ekranı nasıl kullanacağım? | help · guide (`--text-3`) |
| planning | Rover seçimlerini açıkla | Rover seçimi neyi değiştiriyor? | rover · guide |
| planning | Route priorities ne işe yarıyor? *(mixed EN/TR)* | Rota öncelikleri ne işe yarıyor? | tune · guide |
| planning | Katmanları açıkla | Harita katmanları ne gösteriyor? | layers · guide |
| planning | Start ve Goal nasıl seçilir? | Start ve Goal nasıl seçiliyor? | pin · guide |
| planning | 2D ve 3D farkı nedir? | 2D ve 3D görünüm arasındaki fark ne? | cube · guide |
| analysis, plan exists | Rotayı özetle | Mevcut rotayı özetle. | map · route (`--text-2`) |
| analysis, plan exists | Enerji ve bataryayı açıkla | Bu rotanın enerji tüketimini ve batarya durumunu açıkla. | battery · energy (`--mint`) |
| analysis, plan exists | Riskleri açıkla | Bu rotadaki riskleri açıkla. | warning · risk (`--risk-high`) |
| analysis, focused cell | Hedef hücreyi analiz et / Başlangıç hücresini analiz et | Satır {row}, sütun {col} hücresini analiz et. | target · cell (`--lavender`) |
| analysis, start + goal | Görev profillerini karşılaştır | Dört görev profilini karşılaştır. | chart · compare (`--cyan`); note "Profil karşılaştırmaları yaklaşık 20 saniye sürebilir." |

**Messages:**
- **User bubble:** right-aligned, max 88% width (92% on narrow screens), padding 8px 12px, border rgba(186,175,245,.24), background rgba(38,38,60,.55); role label "Sen".
- **Assistant bubble:** full width, padding 10px 12px, border rgba(29,36,50,.24), background rgba(8,11,18,.55).
  - Role "LunaPath Görev Rehberi" / "LunaPath Analiz Asistanı", plus a context label from the first evidence source: Planlama rehberi / Mevcut rota / Hücre telemetrisi / Profil karşılaştırması.
  - Body text: 15px, line-height 1.6, `pre-wrap`. **Plain text, no markdown.**
- **Order inside an assistant turn:**
  1. Grounding-blocked notice: "Yanıt doğrulama kontrolünden geçmedi." / "Doğrulanmış analiz sonucu gösteriliyor."
  2. Warnings list (E-GROUNDING filtered out). Each has a tag Bilgi / Dikkat / Kritik with icon info / warning / error and a 3px left border:
     - info rgba(143,160,192)
     - caution rgba(214,151,112)
     - critical `--critical`, background rgba(64,14,24,.36)
  3. Error headline:
     - E-SCOPE "Bu asistan yalnızca mevcut LunaPath görev analiziyle ilgili soruları yanıtlıyor."
     - E-UNSUPPORTED "Bu analiz mevcut sürümde desteklenmiyor."
     - E-CONTEXT "Bu soru için önce gerekli görev bağlamını oluştur."
     - E-BUDGET "Bu istek mevcut analiz bütçesini aşıyor."
     - When a headline is present, the server text is shown smaller as secondary.
  4. Answer text.
  5. "Sınırlamalar" list.
  6. "Kanıtlar" rows, with pedigree chips:
     - Ölçüm: border rgba(74,143,216,.4), text rgba(140,240,190,.9)
     - Model: rgba(190,210,255,.9)
     - Demo: rgba(240,225,150,.9)
     - Plus "Profil karşılaştırması çalıştırıldı" when a comparison ran.
- **Transport failure:** amber caution box, error icon, "Analiz asistanı şu anda kullanılamıyor." / "Bu istek tamamlanamadı; ana görev ekranı açık kalmaya devam ediyor." The raw error detail is never shown.

**Waiting indicator (there is no streaming):**
- A dashed-border assistant bubble with the stage text, in lavender at .88:
  - generic: "Görev verileri inceleniyor…"
  - cell: "Seçili nokta analiz ediliyor…"
  - compare: "Görev profilleri karşılaştırılıyor…"
  - guide: "Ürün bilgisi hazırlanıyor…"
- Followed by three 4px dots animated `chat-dot` 1.1s with delays 0 / .18 / .36s (opacity .25→1, translateY -2px). Reduced motion keeps them static at opacity .6.
- A screen-reader-only live region announces the stage, then "Yanıt hazır." or "İstek tamamlanamadı."
- Scroll behaviour:
  - It follows new messages only if the user is within 48px of the bottom.
  - A long answer (taller than 75% of the viewport) is shown from its top.

**Composer:**
- One frame containing a spark icon, the textarea and the send button. On focus the frame gets a lavender border and a ring `0 0 0 3px rgba(186,175,245,.16)`.
- Textarea: aria "Görev sorusu"; placeholder "Görev hakkında sor…" or "Önce anlatım seviyesini seç"; max 4000 characters; auto-grows up to 122px.
- Send button "Gönder": flat lavender fill, text `--void`.
- Enter sends; Shift+Enter adds a new line.
- Footer hint "Enter gönder · Shift+Enter yeni satır", which becomes "{n} karakter kaldı" once the draft reaches 3600 characters.

**Transport** (api/assistant.ts):
- POST `/api/ai/chat` with body `{messages, mission, explanationLevel}`.
- Limits: 12 messages (older ones are trimmed off the front) and 4000 characters.
- Response fields: answer, evidence, limitations, warnings, toolUsage.comparisonUsed, errorCode, groundingStatus.
- The mission snapshot is sanitized before sending (aiContext.ts:72-157).

**Ask channel** (intent/types.ts, intent/AssistantAskProvider.tsx):
- The only allowed origin is `'mission-report'`.
- An ask opens the window and fills the composer. **It never sends.** The caret moves to the end.

---

### 5.4 Mission report (F/mission-report/*, i18n/reportCopy.ts)

**Launcher** (index.tsx:97-114; css:19-85):
- Portalled into the top-bar anchor `#lp-topbar-report-slot` (TopBar.tsx:17,103), next to "Systems". If the anchor is missing it renders in place.
- Text "Mission Report" / "Görev Raporu", title "Open the post-drive mission report". The language is read **once at mount**.
- Size: 34px tall; lavender tint rgba(186,175,245,.1); border `--line-accent-hover`; text `--lavender-bright`; 600 weight.
- **Waiting state:** when playback crosses onto the last waypoint, the button pulses: a box-shadow ring animating 0→5px over 1.6s. Reduced motion shows a static 3px ring.
  - Cleared on open; reset when a new plan arrives.
  - **The report never auto-opens.**
- Hidden while the modal is open. Renders nothing at all without a plan.

**Modal** (MissionReportModal.tsx):
- Portalled to `<body>`. Esc closes; focus starts on the close button; no focus trap; unmounted on close.
- Scrim: fixed, inset 0, rgba(3,5,9,.82), z-index 300, padding 24. Darkens only, no blur.
- Modal box: `min(1180px,100%)`, background `--bg-surface`. Body scrolls with padding 18px 22px 28px and gap 14. Two-column rows collapse to one at ≤900px.

**Header:**
- Kicker "Mission report" / "Görev raporu".
- Title "Route complete" / "Rota tamamlandı" (16px, weight 600).
- Subtitle sentence: "{rover} drove {km} km over {n} waypoints." / "{rover}, {n} ara noktada {km} km sürdü."
- Meta list (mono, micro): Rover / Region ("w × h km · res m/px", from the terrain manifest; the row is absent until it loads) / Report ("YYYY-MM-DD HH:MM UTC", the moment the report was opened).
- Controls:
  - **EN | TR** buttons, each labelled with its own language. Min width 58px; the active one is lavender-tinted with a `language` icon.
  - "Save as PDF" (pdf icon) and "Download data" (download icon).
  - "Back to map" (back icon); aria "Close the report and return to the map".

**Verdict panel:**
- Full width; 3px left border in the verdict colour (GO `--risk-low` blue, GO-WITH-RISK `--risk-med` yellow, NO-GO `--risk-crit` red).
- 30px icon: check / warning / error.
- Token GO / GO-WITH-RISK / NO-GO in mono, 18px, weight 700. **The token is never translated.**
- Meaning line (reportCopy.ts:150-161), e.g. "Route is safe as planned." / "Rota planlandığı hâliyle güvenli."
- Verdict rules (report.ts:91-134):
  - NO-GO if any of: stranded, truncated execution, shadow limit exceeded, or any critical step.
  - GO-WITH-RISK if any of: high-risk steps, minimum battery below 30%, peak power exceeded, recharges needed.

**Sections in order** (each card: icon + label in the header, optional note on the right, optional action):
1. **Decision summary / Karar özeti** (evidence icon).
   - Action button "Ask the assistant" / "Asistana sor" (spark icon). In EN mode it also shows a "TR" badge and the title "The assistant answers in Turkish".
   - It sends one of three fixed Turkish questions (report.ts:144-149) through the ask channel, then closes the report.
   - Reason bullets: 5px dot in the verdict colour; sentences from reportCopy.ts:88-140.
   - 8 KPI tiles (`auto-fit minmax(130px)`, 1px gaps): Distance km (2dp), Duration h (1dp), End battery % and Lowest battery % (shown in `--risk-high` when under 30), Energy used Wh, Max slope °, Recharges, Route nodes.
2. **Battery profile** (battery icon).
   - Note: "{n} recharge stops (dashed green)" or "No recharge stops".
   - Chart: LineArea in mint, y fixed 0–100, 200px tall.
   - Recharge markers: vertical mint lines, dash 2 3, opacity .4.
   - Reference lines (dash 3 4, opacity .55): "RESERVE 30%" (`--risk-high`) and "MIN x%" (`--text-dim`).
3. **Row of two:**
   - **Slope distribution** (note "Steepest step x°"): horizontal bars (columns 58px / 1fr / 46px / 30px, 7px track). Bin colour by lower edge: <10° blue, 10–15° yellow, 15–20° orange, ≥20° red.
   - **Risk distribution** (note "Risk level per step"): a single 20px stacked bar coloured by risk level, with a legend showing each share in mono at 16px bold.
4. **Row of two:**
   - **Thermal envelope** (note "min°C … max°C"): LineArea in coral, no fill, 168px tall, reference lines MIN (cyan) and MAX (yellow).
   - **Shadow exposure**:
     - Limit gauge: label "Continuous shadow", value "x / y h". Colour is red if exceeded, yellow if over 75% used, otherwise blue. 7px track.
     - Gauge notes: no limit → "No shadow limit…"; exceeded → "Limit exceeded — …"; otherwise "x% of the limit used."
     - LineArea in cyan, y 0–1, 120px tall.
5. **Energy breakdown** (note "Drive energy from the simulation; payload and heater from the operator setting").
   - Donut: 128px, radius 48, ring width 9, base ring `--line-card`.
   - Slices: Drive lavender, Payload cyan, Heater coral. Payload and heater energy = watts × elapsed hours.
   - Centre: total (16px) over "Total Wh" (12px).
   - Legend as tiles showing Wh and percentage share.
6. **Toggle button**: "Technical detail (terrain cut, planner evidence, milestones)" / "Hide technical detail". The expand icon rotates 180°.
7. *(details)* **Terrain cut**: elevation drawn as separate segments coloured by risk, stroke 1.8, 200px tall.
8. *(details)* **Row of two:**
   - **Planner evidence**: Nodes expanded, Solve time ms, Total weighted cost, Barrier share, and one "Edges rejected · {raw backend key}" line per rejection reason.
   - **Milestones** table: Point / Step / KM / Battery / Slope / Temp / Risk. Rows: START, GOAL, 25% / 50% / 75% (only when there are more than 8 waypoints), STEEPEST, LOWEST BATTERY.
9. *(details)* **Formal safety requirements** (EvidenceSections.tsx:56-143).
   - Readout plus a meta line: "Monitor: … · cross-check Δ … · incomplete".
   - Table: requirement id + FRETISH sentence / Margin / meter / Tightest at.
   - "Claim boundary" note.
10. *(details)* **Cost model evidence**: blocks Slip / Risk appetite (CVaR) / Roughness / Execution survival / Thermal dwell, each with validity chips and notes Where it applies / Not applied / Claim boundary / Sources.

**Charts** (charts.tsx):
- Hand-drawn inline SVG, no charting library.
- **Drawn in measured CSS pixels**: a ResizeObserver supplies the width (fallback 640). Not a stretched viewBox, except the donut, which uses viewBox 128.
- Padding: top 14, right 16, bottom 26, left 48. Tick font 12px in `--font-data`.
- Axis line `var(--line)`; tick text `var(--text-dim-2)`.
- Ticks: 3 on y; on x, 5 / 4 / 3 depending on width (>820 / >520 / smaller). Step sizes rounded to 1, 2, 2.5, 5 or 10 × a power of ten.
- Y headroom: 8% for line charts, 10% for the terrain profile.
- Area fill opacity .07; line width 1.5.
- Fewer than 2 points shows the empty label: "Not enough points to plot." / "No elevation data."

**Print** (report.css:840-1024):
- "Save as PDF" first opens the technical detail, then calls `window.print()` two animation frames later.
- Page: A4, 14mm margins. Everything except the scrim is hidden (`body > *:not(.lp-report-scrim)` set to `display:none`).
- White page. Text tokens are retoned to dark (#111 / #333 / #555 / #666) and lines to #ddd. Risk colours are left untouched.
- Bar tracks become #eee.
- `print-color-adjust: exact` on the risk marks, the verdict panel and the charts.
- Charts stretch to 100% width with auto height.
- Hidden on paper: close, toggle, export actions, language buttons, ask button, launcher.
- Cards avoid page breaks inside them; the verdict panel avoids a break after it; rows stay two columns.

**CSV export** (exportCsv.ts):
- Columns: step, row, col, longitude_deg, latitude_deg, distance_m, elapsed_hours, altitude_m, slope_deg, surface_temp_c, shadow_ratio, battery_pct, step_energy_wh, node_cost, risk_level, recharged_this_step.
- RFC 4180 quoting, CRLF line endings, UTF-8 BOM.
- Filename `lunapath-{roverId}-{YYYY-MM-DD-HH-MM}.csv`.

**Language toggle** (reportCopy.ts):
- Stored in localStorage key `lunapath.report.lang`; default `en`. These are the only localStorage reads/writes in the frontend.
- Numbers use Intl with en-GB or tr-TR. Turkish percentages are written `%70,0`. Values ≥1000 lose their decimals. Negative zero is fixed to 0.
- Only the modal changes language. The launcher keeps the language it read at mount.

---

### 5.5 Language of the UI

**The cockpit is English. Only the assistant (always) and the report (when TR is chosen) are Turkish.**

Turkish characters appear in only 6 source files:
- i18n/reportCopy.ts (77 matches)
- F/assistant/ChatPanel.tsx (72)
- F/assistant/index.tsx (2)
- F/assistant/useAssistant.ts (1)
- F/mission-report/report.ts (3)
- intent/types.ts (1)

**Examples:**
- **English cockpit:** MissionSetupPanel.tsx:141 "Select a Start point on the terrain first."; SystemsDrawer.tsx:52 "Systems & Evidence"; registry.ts:91-94 "Route/Safety/Analysis/Compare".
- **Turkish assistant:** ChatPanel.tsx:139 "Görev Rehberi", :963 "Gönder".
- **Mixed:** ChatPanel.tsx:204 chip label "Route priorities ne işe yarıyor?"; ChatPanel.tsx:222 "Start ve Goal nasıl seçilir?". The assistant's aria/title text is English (index.tsx:80-81).
- **Report EN/TR:** reportCopy.ts:290-517.

**Why it is split** (index.tsx:54-63; reportCopy.ts:9-13):
> "The cockpit is English and the assistant is Turkish, which is a real inconsistency (HCI review F8)… the grounding layer that blocks fabricated numbers matches Turkish morphology (backend/app/ai_grounding.py)…"

**Text that stays English even in TR mode:**
- EvidenceSections: "All requirements met", "Requirements violated", unit "met", block titles, "cross-check Δ", "incomplete".
- The modal aria-label "Mission report" (MissionReportModal.tsx:315).
- Risk-level words LOW…CRITICAL in the stacked bar and the table.
- Backend-supplied claims and reasons.

---

### 5.6 Design-rationale comments worth keeping

- registry.ts:59-70: the `systems` group exists so the default cockpit "is task + context", not "nine competing cards".
- registry.ts:104-110: an omitted `modes` means every mode; `[]` means hidden everywhere.
- charts.tsx:4-17 and useChartSize.ts:6-14: draw in CSS pixels so tick text stays 12px in every card.
- charts.tsx:36-48: axis colours go through tokens so the print stylesheet can retone them.
- report.css:2-4: "darkens what is behind a modal, it never blurs it… flat surfaces, 2px radius, mono for measured data only."
- report.css:57-60: the waiting pulse uses box-shadow only, because the slot is `display:contents` and anything else would move the neighbouring buttons.
- MissionReportModal.tsx:46-49: verdict glyphs escalate in shape so the verdict survives a monochrome print.
- MissionReportModal.tsx:362-365 and report.css:190-192: one button per language, never a single toggle labelled with the other language.
- ChatPanel.tsx:39-46 and assistant.css:510-511: chip colours match each quantity's colour on the map; guide chips are neutral.
- ChatPanel.tsx:81-88: severity is shown three ways (word, colour, shape).
- ChatPanel.tsx:90-92: "a visual default never passes for a decision the operator made."
- assistant.css:1015-1018: the accent is spent in only two places (Send and the chosen level); "two shadows… neither is coloured."
- JobState.tsx:54-56 and useAnalysisJob.ts:17-22: no fake progress.
- capability.ts:11-25: "unavailable" must never look like "error".
- colormap.ts (riskToDash): risk is carried by dash pattern as well as colour.
- time-axis/overlays.ts:78-81: the 4-D route is lavender because yellow means MEDIUM risk everywhere else.
- route-model.css:3-5: confidence is not a safety verdict, so no risk colour is used.

---

### 5.7 Gray points (cannot be settled from the frontend code alone)

**1. Content that depends on the backend.** The frontend prints these verbatim, so their exact text cannot be known from code:
- Assistant: answer, evidence labels, limitations, warning messages.
- Stress test verdict sentence; risk-sweep note.
- Profile-compare recommendation, profile names and colours.
- PSR reading and claim; safe-haven rule; corridor lit rule and pruning text.
- Thermal-envelope claim and axis labels.
- Requirement FRETISH sentences and claims in the report; reference-mission note.
- Every capability "reason" and remedy; `edges_rejected` keys.

**2. Unreachable or unused code:**
- `mission-snapshot` (`modes: []`).
- The RailTabs pinned path.
- `.lp-report-figure` CSS (report.css:146) is never used.
- `RoutePriorities` lives in a feature folder but only renders in the hangar.

**3. Registry comments that contradict the registrations:**
- `route-model`: comment says it is in the drawer (registry.ts:168-173); it is primary, tab safety.
- `uncertainty`: comment (registry.ts:279) and the index docstrings for uncertainty / stress-test / risk-sweep / benchmark say "systems drawer"; they are primary-rail tabs.
- `benchmark`: comment says "belongs to no mission mode" (registry.ts:286-288); it has `modes:['analyze']`.
- `mission-validation`: carries a pasted "Plan only" comment (registry.ts:274-276) but has no `modes`, so it shows in both.
- `mission-context`: comment lists "sector, resolution, extent" (registry.ts:139-143); the panel says those were removed (MissionContextPanel.tsx:9-22).
- The comment "These six are the Systems & Evidence set", the drawer subtitle and the TopBar Systems title all name 6 panels; there are 13.
- ChatPanel's comment mentions "Eleven separate boxes"; at most 6 chips exist.

**4. What happens when the drawer closes:**
- Drawer panels unmount, and the overlay `register` cleanup removes their map overlays (overlay/useOverlays.ts:20-22).
- So corridor ribbon, pose, safe-haven, coarse-fields and illumination-corridor layers **disappear from the map when the drawer closes**, and "Show on map" resets to off when it reopens.
- While the drawer is open, the map sits behind the .55 backdrop.

**5. Results that never go stale.** Profile-compare results and their polylines, the time-axis plan4d result, and replan/pose results are not reset when the route changes. Only the three analysis-job panels have stale handling.

**6. route-analysis oddities:**
- Hard-coded "South Pole Traverse" (:121), contradicting the report's "no site name" rule (MissionReportModal.tsx:67-70).
- Milestone coordinates printed `[col, row]` (:387) while everything else uses `[row, col]`.
- Magic fallbacks: 5420 Wh capacity, 0.2 m/s speed, "< 50 ms" compute time.
- Its LOW–CRITICAL overall-risk rule (HIGH if >5% high-risk steps; MEDIUM if any high or >25% medium) is a separate verdict system from the report's GO / NO-GO.
- Milestones appear at >10 waypoints labelled "WP 025"; the report uses >8 labelled "25%".
- The section label "LiDAR payload cost" sits over inputs named Instrument / Survival Heater.

**7. Inconsistent thresholds and magic numbers:**
- Battery colouring: `batteryToHex` 50/25/10 vs report KPI and reserve line at 30.
- Slope-bin colour cuts 10/15/20; gauge >75%; stress tone .95/.5.
- Debounces 220ms (mission-context) and 260ms (comm-window); cost-explain has none and fires a second cell-telemetry request for the same cell.
- 500×500 fallback grid; risk-sweep alphas .5/.9/.99; 1000 runs with seed 0.
- Time axis 24×6h slices, 256 plan slices; epoch `2026-09-07T00:00:00Z` (missionTime.ts:62); `SESSION_MISSION_TIME` span 144h.
- Default weights .409 / .259 / .142 / .19 (App.tsx:77-82).

**8. Text and wording issues:**
- CoarseFieldsPanel.tsx:176-180 says "{fraction_zero} of traversable blocks can reach the safe set with no action at all", while `fraction_zero` means they *cannot* (compare fields.ts:104-108).
- risk-sweep's stale text says "previous mission"; the others say "previous route".
- COMPARE_NOTE says ~20 s; the code comment says ~21 s.
- An assistant.css comment says 404px; the window is 394px.
- report.ts:139 says "the rest of the report is English", which is outdated now that TR exists.

**9. Errors that are hidden or blurred:**
- The `useMissionProfiles` error is never rendered.
- cost-explain shows the same empty-state text whether nothing is hovered or the fetch failed.
- mission-context has no loading or error UI at all.

**10. Mission constraints renders only "Risk appetite".** This comes from a load-time probe (contributors.ts:265-275); the panel's docstring talks about "seven" constraints.

**11. Hidden layout contracts:**
- `shell.css:28/41` moves the toast stack using `.chat-window.is-open ~ .toast-stack`.
- So the window id and class names are fixed, and `GlobalOverlaySlot` must come before `.toast-stack` in the DOM.

**12. Styles not in feature CSS.** mission-setup, mission-snapshot, route-analysis, playback, layer-picker and solving-indicator are styled only in global App.css (line pointers in section B). Tokens are at App.css:94-289.

---

### 5.8 Rough size

- **Panels:** 33 registrations → 32 reachable surfaces, plus RoutePriorities (hangar), the drawer shell, rail tabs, and the report modal (10 cards).
- **Controls:** about 150 interactive controls, including roughly 15 in the assistant, 8 in the report, 13 in replan and 19 in RoutePriorities.
- **States:**
  - 7 capability states, 5 analysis-job states.
  - Per-panel loading / empty / error / needs-epoch states: about 90 distinct state renderings.
- **User-visible strings:**
  - Report copy: about 150 keys × 2 languages.
  - Assistant: about 75 Turkish strings.
  - Other panels: roughly 450 English strings.
  - Total: about 800–900, not counting backend text.

### 5.99 Mission report copy (English and Turkish)

Every key of the report copy table (`frontend/src/i18n/reportCopy.ts`), English and Turkish, verbatim. The last column gives the source lines of the English and Turkish entries.

| Key | English | Turkish | Lines EN / TR |
|---|---|---|---|
| `kicker` | `Mission report` | `Görev raporu` | 292 / 405 |
| `title` | `Route complete` | `Rota tamamlandı` | 293 / 406 |
| `subtitle` | `{…} drove {…} km over {…} waypoints.` | `{…}, {…} ara noktada {…} km sürdü.` | 295 / 408 |
| `metaRover` | `Rover` | `Rover` | 296 / 409 |
| `metaRegion` | `Region` | `Bölge` | 297 / 410 |
| `metaGenerated` | `Report` | `Rapor` | 298 / 411 |
| `regionValue` | `{…} × {…} km · {…} m/px` | `{…} × {…} km · {…} m/px` | 300 / 413 |
| `langSwitchLabel` | `Report language` | `Rapor dili` | 301 / 414 |
| `savePdf` | `Save as PDF` | `PDF olarak kaydet` | 302 / 415 |
| `downloadData` | `Download data` | `Veriyi indir` | 303 / 416 |
| `backToMap` | `Back to map` | `Haritaya dön` | 304 / 417 |
| `backToMapAria` | `Close the report and return to the map` | `Raporu kapat ve haritaya dön` | 305 / 418 |
| `askAssistant` | `Ask the assistant` | `Asistana sor` | 306 / 419 |
| `askAssistantTurkishHint` | `The assistant answers in Turkish` | `Asistan Türkçe yanıtlar` | 307 / 420 |
| `sections.decision` | `Decision summary` | `Karar özeti` | 309 / 422 |
| `sections.battery` | `Battery profile` | `Batarya profili` | 310 / 423 |
| `sections.slope` | `Slope distribution` | `Eğim dağılımı` | 311 / 424 |
| `sections.risk` | `Risk distribution` | `Risk dağılımı` | 312 / 425 |
| `sections.thermal` | `Thermal envelope` | `Termal zarf` | 313 / 426 |
| `sections.shadow` | `Shadow exposure` | `Gölge maruziyeti` | 314 / 427 |
| `sections.energy` | `Energy breakdown` | `Enerji dağılımı` | 315 / 428 |
| `sections.terrain` | `Terrain cut` | `Arazi kesiti` | 316 / 429 |
| `sections.planner` | `Planner evidence` | `Planlayıcı kanıtları` | 317 / 430 |
| `sections.milestones` | `Milestones` | `Kilometre taşları` | 318 / 431 |
| `sections.safety` | `Formal safety requirements` | `Formal güvenlik gereksinimleri` | 319 / 432 |
| `sections.costModel` | `Cost model evidence` | `Maliyet modeli kanıtı` | 320 / 433 |
| `evidence.requirement` | `Requirement` | `Gereksinim` | 323 / 436 |
| `evidence.margin` | `Margin` | `Marj` | 324 / 437 |
| `evidence.worstAt` | `Tightest at` | `En dar nokta` | 325 / 438 |
| `evidence.untested` | `Could not be tested on this trace. Untested is not passed.` | `Bu izde test edilemedi. Test edilmemiş, geçmiş değildir.` | 326 / 439 |
| `evidence.claimBoundary` | `Claim boundary` | `İddia sınırı` | 327 / 440 |
| `evidence.monitor` | `Monitor` | `İzleyici` | 328 / 441 |
| `evidence.scope` | `Where it applies` | `Nereye giriyor` | 329 / 442 |
| `evidence.notApplied` | `Not applied` | `Uygulanmadı` | 330 / 443 |
| `evidence.sources` | `Sources` | `Kaynaklar` | 331 / 444 |
| `notes.recharges` | `{…} recharge stops (dashed green)` | `{…} şarj molası (kesikli yeşil)` | 334 / 447 |
| `notes.noRecharges` | `No recharge stops` | `Şarj molası yok` | 335 / 448 |
| `notes.steepest` | `Steepest step {…}°` | `En dik adım {…}°` | 336 / 449 |
| `notes.riskPerStep` | `Risk level per step` | `Adım başına risk seviyesi` | 337 / 450 |
| `notes.thermalRange` | `{…}°C … {…}°C` | `{…}°C … {…}°C` | 338 / 451 |
| `notes.shadowLimit` | `Continuous shadow against the rover limit` | `Kesintisiz gölge, rover sınırına karşı` | 339 / 452 |
| `notes.energySource` | `Drive energy from the simulation; payload and heater from the operator setting` | `Sürüş enerjisi simülasyondan; faydalı yük ve ısıtıcı operatör ayarından` | 341 / 454 |
| `notes.terrainPainted` | `Elevation, painted by step risk` | `Yükseklik, adım riskine göre renklendirilmiş` | 342 / 455 |
| `notes.plannerEvidence` | `A* really did apply constraints` | `A* kısıtları gerçekten uyguladı` | 343 / 456 |
| `kpi.distance` | `Distance` | `Mesafe` | 346 / 459 |
| `kpi.duration` | `Duration` | `Süre` | 347 / 460 |
| `kpi.endBattery` | `End battery` | `Varış bataryası` | 348 / 461 |
| `kpi.lowestBattery` | `Lowest battery` | `En düşük batarya` | 349 / 462 |
| `kpi.energyUsed` | `Energy used` | `Tüketilen enerji` | 350 / 463 |
| `kpi.maxSlope` | `Max slope` | `En yüksek eğim` | 351 / 464 |
| `kpi.recharges` | `Recharges` | `Şarj molası` | 352 / 465 |
| `kpi.routeNodes` | `Route nodes` | `Rota düğümü` | 353 / 466 |
| `charts.batteryTitle` | `Battery percentage against distance` | `Mesafeye göre batarya yüzdesi` | 356 / 469 |
| `charts.batteryReserve` | `RESERVE {…}` | `REZERV {…}` | 357 / 470 |
| `charts.batteryMin` | `MIN {…}` | `EN DÜŞÜK {…}` | 358 / 471 |
| `charts.thermalTitle` | `Surface temperature against distance` | `Mesafeye göre yüzey sıcaklığı` | 359 / 472 |
| `charts.thermalMin` | `MIN {…}°C` | `EN DÜŞÜK {…}°C` | 360 / 473 |
| `charts.thermalMax` | `MAX {…}°C` | `EN YÜKSEK {…}°C` | 361 / 474 |
| `charts.shadowGaugeLabel` | `Continuous shadow` | `Kesintisiz gölge` | 362 / 475 |
| `charts.shadowTitle` | `Shadow ratio against distance` | `Mesafeye göre gölge oranı` | 363 / 476 |
| `charts.elevationTitle` | `Elevation against distance` | `Mesafeye göre yükseklik` | 364 / 477 |
| `charts.donutTotal` | `Total Wh` | `Toplam Wh` | 365 / 478 |
| `charts.drive` | `Drive` | `Sürüş` | 366 / 479 |
| `charts.payload` | `Payload` | `Faydalı yük` | 367 / 480 |
| `charts.heater` | `Heater` | `Isıtıcı` | 368 / 481 |
| `charts.notEnoughPoints` | `Not enough points to plot.` | `Çizim için yeterli nokta yok.` | 369 / 482 |
| `charts.noElevation` | `No elevation data.` | `Yükseklik verisi yok.` | 370 / 483 |
| `charts.noShadowLimit` | `No shadow limit is defined for this rover.` | `Bu rover için tanımlı gölge sınırı yok.` | 371 / 484 |
| `charts.limitExceeded` | `Limit exceeded — the route is not safe as planned.` | `Sınır aşıldı — rota planlandığı hâliyle güvenli değil.` | 372 / 485 |
| `charts.limitUsed` | `{…} of the limit used.` | `Sınırın {…} kadarı kullanıldı.` | 373 / 486 |
| `details.show` | `Technical detail (terrain cut, planner evidence, milestones)` | `Teknik ayrıntı (arazi kesiti, planlayıcı kanıtları, kilometre taşları)` | 376 / 489 |
| `details.hide` | `Hide technical detail` | `Teknik ayrıntıyı gizle` | 377 / 490 |
| `planner.nodesExpanded` | `Nodes expanded` | `Genişletilen düğüm` | 380 / 493 |
| `planner.solveTime` | `Solve time` | `Çözüm süresi` | 381 / 494 |
| `planner.totalCost` | `Total weighted cost` | `Toplam ağırlıklı maliyet` | 382 / 495 |
| `planner.barrierShare` | `Barrier share` | `Bariyer payı` | 383 / 496 |
| `planner.edgesRejected` | `Edges rejected · {…}` | `Reddedilen kenar · {…}` | 384 / 497 |
| `table.point` | `Point` | `Nokta` | 387 / 500 |
| `table.step` | `Step` | `Adım` | 388 / 501 |
| `table.km` | `KM` | `KM` | 389 / 502 |
| `table.battery` | `Battery` | `Batarya` | 390 / 503 |
| `table.slope` | `Slope` | `Eğim` | 391 / 504 |
| `table.temp` | `Temp` | `Sıcaklık` | 392 / 505 |
| `table.risk` | `Risk` | `Risk` | 393 / 506 |
| `milestone.START` | `START` | `BAŞLANGIÇ` | 396 / 509 |
| `milestone.GOAL` | `GOAL` | `HEDEF` | 397 / 510 |
| `milestone.STEEPEST` | `STEEPEST` | `EN DİK` | 398 / 511 |
| `milestone.LOWEST BATTERY` | `LOWEST BATTERY` | `EN DÜŞÜK BATARYA` | 399 / 512 |
| `launcher` | `Mission Report` | `Görev Raporu` | 401 / 514 |
| `launcherTitle` | `Open the post-drive mission report` | `Sürüş sonrası görev raporunu aç` | 402 / 515 |

### 5.98 UI string catalogue (remaining strings by source file)

Every user-visible string the interface renders that is not already quoted in chapters 2 to 5, verbatim, grouped by the file that renders it. `{…}` marks an interpolated value. Full records with kind and language: `design-export/strings.json`.

#### frontend/src/App.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 684 | literal | en | `A bounded local trajectory was inserted and rejoins the global corridor. Playback is paused for review.` |
| 717 | template | en | `{…} observed obstacle(s) applied. Playback is paused for review.` |
| 1097 | attr:title | en | `Click to expand Surface Telemetry HUD` |
| 1116 | jsxText | en | `Surface telemetry` |
| 1123 | attr:title | en | `Minimize HUD to compact chip` |
| 1136 | jsxText | en | `ALT` |
| 1138 | jsxText | en | `TMP` |
| 1213 | literal | en | `Photographic Overlay (not aligned with current DEM window)` |
| 1277 | attr:aria-label | en | `System notifications` |
| 1357 | template | en | `{…}{…} m` |
| 1362 | template | en | `{…}{…} °C` |
| 1374 | literal | en | `That cell cannot be traversed by the rover envelope. Switch to the traversability layer to see which cells are drivable, then pick one.` |
| 1386 | literal | en | `The planner could not resolve a continuous safe corridor. Tweak start/goal or relax route priority weights.` |
| 1394 | literal | en | `Some terrain data could not be synchronized from the backend raster server.` |

#### frontend/src/MapCanvas.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 351 | attr:aria-label | en | `Terrain map. Arrow keys move the cursor, hold Shift to move ten cells at a time. Press Enter to place {…} at the cursor.` |
| 374 | template | en | `Cursor at row {…}, column {…}.` |

#### frontend/src/SplashScreen.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 119 | template | en | `Still waiting on {…}.` |
| 126 | template | en | `{…}%` |

#### frontend/src/TerrainCanvas3D.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 1818 | template | en | `ROCK {…} m` |

#### frontend/src/components/Fleet/FleetSelectionView.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 20 | template | en | `{…} Wh` |
| 21 | template | en | `{…} m/s` |
| 23 | template | en | `{…} kg` |
| 175 | attr:aria-label | en | `Next rover` |
| 196 | attr:aria-label | en | `{…} (selected for mission)` |

#### frontend/src/features/analysis-layers/index.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 53 | template | en | `{…} on` |

#### frontend/src/features/assistant/ChatPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 675 | template | tr | `Satır {…}, sütun {…} hücresini analiz et.` |
| 969 | template | tr | `{…} karakter kaldı` |

#### frontend/src/features/assistant/index.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 80 | attr:aria-label | tr | `Open {…} (Turkish-language assistant)` |
| 81 | attr:title | en | `Open {…} — this assistant answers in Turkish. Drag to move it.` |

#### frontend/src/features/benchmark/index.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 57 | template | en | `{…} of {…} maps are connected only by cutting a corner between two blocked cells.` |
| 69 | jsxText | en | `Under the benchmark’s own motion model, LunaPath reproduces the paper’s shortest-path lengths exactly (` |
| 89 | jsxText | en | `(quoted)` |

#### frontend/src/features/coarse-fields/CoarseFieldsPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 67 | jsxText | en | `Needs a mission epoch. Both are computed against where the Sun is, so there is nothing to compute until the mission clock is set.` |
| 73 | attr:aria-label | en | `Coarse field` |
| 137 | jsxText | en | `The backend returned a code this build does not know. Reported rather than dropped.` |
| 169 | jsxText | en | `traversable, 20 m blocks` |
| 177 | jsxText | en | `of traversable blocks can reach the safe set with no action at all — drawn as “No action helps”, not as a low probability.` |
| 187 | jsxText | en | `Median dwell` |
| 191 | jsxText | en | `· p95` |
| 208 | jsxText | en | `clipped to` |
| 216 | jsxText | en | `Open-ended blocks never leave the envelope inside the` |
| 217 | jsxText | en | `h lookahead, so their dwell reads` |
| 218 | jsxText | en | `h as a floor — “at least”, not “exactly”.` |
| 225 | jsxText | en | `Survival needs a goal: the safe set is the leg to it. Place a goal on the map and P(safe) and Best action will load. Thermal dwell does not need one and is shown already.` |

#### frontend/src/features/corridor/CorridorPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 29 | jsxText | en | `No corridor. Plan a route first — a corridor needs at least two waypoints.` |

#### frontend/src/features/cost-explain/CostExplainPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 52 | jsxText | en | `Closed by the traversability gate, not by a cost component — the cell is off-limits or a source layer has no value here. No route can cross it.` |

#### frontend/src/features/earth-visibility/index.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 35 | jsxText | en | `Needs a mission epoch. Where the Earth sits depends on when you ask, so there is nothing to compute until the mission clock is set.` |
| 75 | jsxText | en | `-day search at` |
| 76 | jsxText | en | `-minute steps. A change beyond that horizon is not reported — it is not ruled out.` |
| 101 | attr:aria-label | en | `Earth link fraction per day` |
| 107 | attr:title | en | `{…} — {…}%` |
| 114 | jsxText | en | `of the site has a link on` |
| 115 | jsxText | en | `, with the Earth at` |
| 124 | jsxText | en | `Static model: no epoch behind these slices, so every one repeats the long-run layer.` |

#### frontend/src/features/illumination-corridor/index.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 65 | jsxText | en | `Needs a mission epoch. A corridor is defined slice by slice against where the Sun is, so there is nothing to compute until the mission clock is set.` |
| 72 | attr:aria-label | en | `Corridor field` |
| 120 | jsxText | en | `of lit & passable` |
| 128 | jsxText | en | `largest` |
| 138 | literal | en | `, derived` |
| 148 | jsxText | en | `blocks in this slice, from the` |
| 149 | jsxText | en | `h horizon.` |
| 155 | jsxText | en | `Static shadow model: the cube still arrives, and it carries no guarantee.` |
| 163 | jsxText | en | `Lit rule (` |
| 166 | jsxText | en | `Pruning:` |

#### frontend/src/features/layer-provenance/DemUncertaintyCard.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 40 | literal | en | `NASA clones` |
| 68 | jsxText | en | `. A band read off these layers is uncertainty in the terrain, not in the mission.` |

#### frontend/src/features/layer-provenance/LayerProvenancePanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 66 | literal | en | `This layer carries no provenance label.` |

#### frontend/src/features/layer-provenance/UncertaintySeriesCard.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 111 | attr:aria-label | en | `Illumination uncertainty per slice` |
| 116 | attr:title | en | `Slice {…}: mean P {…}, {…}% uncertain` |
| 143 | jsxText | en | `“Uncertain” is a cell where the clones disagree — 0.05 < P < 0.95. The mean alone cannot distinguish a confident answer from a divided one.` |
| 147 | template | en | `The far field was not cloned; the horizon shift that ignores is bounded at {…}°.` |

#### frontend/src/features/mission-constraints/MissionConstraintsPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 110 | template | en | `{…} field{…} added to the plan request.` |

#### frontend/src/features/mission-context/MissionContextPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 84 | template | en | `{…} °C` |
| 124 | jsxText | en | `LOLA LDRM, a 100 m baseline posted at 50 m/px: this is the covering pixel’s statistic, not the cell’s own roughness. PSR is NASA’s measured mask — evidence, not a forbidden region.` |
| 159 | template | en | `{…} h` |
| 230 | jsxText | en | `x block, not this 5 m cell: the policy is solved at` |
| 231 | jsxText | en | `m. Safe set “` |
| 231 | jsxText | en | `”, at` |
| 232 | jsxText | en | `% charge.` |
| 256 | template | en | `≥ {…} h` |
| 265 | template | en | `{…} · {…}` |
| 282 | template | en | `Never leaves the envelope inside the {…} h lookahead, so the figure is a floor.` |
| 283 | template | en | `Measured against a {…} h lookahead at {…} h steps.` |
| 284 | jsxText | en | `The regolith lag behind it is` |
| 284 | jsxText | en | `— no hardware measurement stands behind the time constant.` |

#### frontend/src/features/mission-report/EvidenceSections.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 75 | template | en | `· cross-check Δ {…}` |
| 128 | template | en | `· {…},{…}` |
| 204 | template | en | `lag {…}` |

#### frontend/src/features/mission-report/charts.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 415 | attr:title | en | `{…}: {…}` |

#### frontend/src/features/mission-report/report.ts

| Line | Kind | Lang | Text |
|---|---|---|---|
| 24 | literal | en | `STRANDED` |
| 145 | literal | tr | `Görev raporundaki karar özetini açıkla: GO kararı hangi bulgulara dayanıyor?` |
| 147 | literal | mixed | `Görev raporundaki karar özetini açıkla: GO-WITH-RISK kararının risk bulguları neler?` |
| 148 | literal | tr | `Görev raporundaki karar özetini açıkla: bu rota neden NO-GO?` |

#### frontend/src/features/mission-setup/MissionSetupPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 175 | template | en | `START {…}, {…}` |
| 205 | template | en | `GOAL {…}, {…}` |
| 397 | attr:title | en | `Return to the fleet hangar to pick a different rover or change route priorities` |

#### frontend/src/features/mission-setup/RoutePriorities.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 194 | attr:aria-label | en | `Mission profile presets` |
| 231 | attr:title | en | `Enforced in search: the A* solver refuses cells that violate this limit.` |
| 232 | attr:title | en | `Verified after simulation: checked against the simulated route; a plan can exceed it.` |
| 283 | attr:aria-label | en | `What {…} controls` |
| 299 | attr:aria-label | en | `{…} weight` |
| 314 | attr:aria-label | en | `{…} weight, exact value` |

#### frontend/src/features/mission-snapshot/MissionSnapshotPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 63 | template | en | `[{…}, {…}]` |

#### frontend/src/features/mission-validation/MissionValidationPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 37 | jsxText | en | `m/day` |
| 48 | template | en | `{…} m/day` |
| 65 | jsxText | en | `This route’s rate is its simulated traverse clock only — it excludes the lunar nights the published rates are averaged over, so the two columns are not the same measurement and the larger number is not a faster rover.` |
| 105 | template | en | `{…} °C to {…} °C` |

#### frontend/src/features/playback/PlaybackBar.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 64 | attr:aria-label | en | `Pause simulation playback` |
| 64 | attr:aria-label | en | `Play simulation playback` |
| 105 | attr:aria-label | en | `Simulation time scale` |
| 115 | attr:title | en | `{…} seconds of mission per second on screen` |

#### frontend/src/features/pose-loop/PoseLoopPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 40 | jsxText | en | `No active corridor. Plan a route first — a pose is only meaningful against the route the rover is driving.` |

#### frontend/src/features/psr-validation/index.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 116 | jsxText | en | `Median coldest, inside` |
| 120 | jsxText | en | `Median coldest, outside` |

#### frontend/src/features/replan/ReplanPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 36 | jsxText | en | `Leave a field blank to report that value as unavailable — the check that needs it comes back “Not checked”, not “Clear”.` |
| 86 | template | en | `Replanned — {…} trigger(s) fired` |

#### frontend/src/features/risk-sweep/index.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 31 | template | en | `{…}% new cells` |
| 89 | attr:runLabel | en | `Plan at α {…}` |
| 90 | attr:busyLabel | en | `Planning {…} more routes…` |
| 91 | attr:staleLabel | en | `This sweep is for the previous mission.` |

#### frontend/src/features/ros-showcase/RosShowcasePanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 84 | jsxText | en | `The core is shell-independent: of the 35 modules in` |
| 85 | jsxText | en | `imports fastapi and none imports rclpy, so the HTTP API and the ROS 2 nodes call the same functions and cannot drift apart.` |

#### frontend/src/features/route-analysis/RouteAnalysisInspector.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 163 | attr:aria-label | en | `Risk {…}, {…} of 5` |
| 246 | template | en | `{…} nodes` |
| 260 | template | en | `{…} ms` |
| 284 | attr:title | en | `{…}: {…} ({…}%)` |

#### frontend/src/features/route-model/RouteModelPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 95 | attr:hint | en | `at {…}°` |
| 112 | jsxText | en | `Slip is the share of wheel rotation that does not become forward motion. At` |
| 113 | jsxText | en | `mean, the wheels turn` |
| 114 | jsxText | en | `× the ground distance.` |
| 119 | jsxText | en | `This rover profile declares no slip curve, so travel time and energy are the planner's nominal figures.` |
| 155 | jsxText | en | `under Advanced Constraints (Systems, in plan mode) to rank routes on the adverse tail instead.` |
| 193 | template | en | `{…} m baseline` |
| 195 | template | en | `· weight {…}` |
| 203 | jsxText | en | `This deployment has no measured roughness layer, so the criterion steers nothing and its weight is inert.` |
| 205 | jsxText | en | `builds it; the full reason is in the mission report.` |
| 242 | jsxText | en | `/km is an assumption` |
| 242 | jsxText | en | `Failure rate` |
| 250 | template | en | `Requested but not applied{…}` |
| 251 | literal | en | `Not requested — no chance constraint on this plan.` |
| 276 | attr:hint | en | `envelope {…}–{…}°C` |
| 292 | jsxText | en | `Heater model` |
| 292 | jsxText | en | `· dwell limits are uncalibrated` |
| 300 | literal | en | `Requested but not applied on this plan.` |
| 301 | literal | en | `Not requested — no dwell constraint on this plan.` |

#### frontend/src/features/safe-haven/SafeHavenPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 52 | jsxText | en | `Needs a mission epoch. A safe haven is defined against the Earth’s and the Sun’s motion over a synodic month, so there is nothing to compute until the mission clock is set.` |
| 59 | attr:aria-label | en | `Safe haven field` |
| 88 | jsxText | en | `% of traversable` |
| 142 | jsxText | en | `% of cells can reach no haven at all. Those are drawn blank on the time-to-haven view — not as zero hours, which would mean the opposite.` |

#### frontend/src/features/stress-test/StressTestPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 183 | attr:runLabel | en | `Run {…} executions` |

#### frontend/src/features/thermal-envelope/index.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 94 | template | en | `{…} / {…}` |
| 96 | template | en | `, heater {…}` |
| 108 | attr:aria-label | en | `Thermal envelope, {…} Sun elevation bins by {…} slope bins` |
| 158 | jsxText | en | `% of bins are blank because the heat1d trace never reached that geometry — no result, not a benign one.` |
| 161 | template | en | `A further {…} bin(s) were absent from the response entirely.` |

#### frontend/src/features/time-axis/TimeAxisPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 230 | jsxText | en | `move step(s).` |
| 232 | literal | en | `The cube was static, so waiting could not have helped.` |
| 233 | literal | en | `Waiting would not have paid off on this route.` |

#### frontend/src/features/uncertainty/UncertaintyPanel.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 125 | attr:hint | en | `min {…}` |

#### frontend/src/i18n/reportCopy.ts

| Line | Kind | Lang | Text |
|---|---|---|---|
| 96 | template | tr | `Rover {…}. adımda enerjisiz kaldı — rota tamamlanamıyor.` |
| 97 | template | en | `Rover ran out of energy at step {…} — the route cannot be completed.` |
| 106 | template | tr | `Rota kısaldı: {…} düğüm sürülebilir{…}.` |
| 107 | template | en | `Route truncated: {…} nodes are drivable{…}.` |
| 112 | template | tr | `Kesintisiz gölge {…} h; rover sınırı {…} h.` |
| 113 | template | en | `Continuous shadow {…} h against a rover limit of {…} h.` |
| 117 | template | tr | `{…} adım KRİTİK risk seviyesinde.` |
| 118 | template | en | `{…} steps at CRITICAL risk.` |
| 121 | template | tr | `{…} adım YÜKSEK risk seviyesinde veya üzerinde.` |
| 122 | template | en | `{…} steps at HIGH risk or above.` |
| 125 | template | tr | `Batarya en düşük noktada {…} seviyesine indi.` |
| 126 | template | en | `Battery fell to {…} at its lowest.` |
| 129 | template | tr | `{…} adımda tepe güç bütçesi aşıldı.` |
| 130 | template | en | `Peak power budget exceeded on {…} steps.` |
| 133 | template | tr | `Rota {…} şarj molası gerektiriyor.` |
| 134 | template | en | `The route needs {…} recharge stops.` |
| 137 | literal | tr | `Hiçbir sürüş kısıtı ihlal edilmedi.` |
| 153 | literal | en | `Route is drivable, with findings to review.` |
| 154 | literal | en | `Route is not safe as planned.` |
| 158 | literal | tr | `Rota sürülebilir, ancak incelenmesi gereken bulgular var.` |
| 159 | literal | tr | `Rota planlandığı hâliyle güvenli değil.` |

#### frontend/src/shell/SystemsDrawer.tsx

| Line | Kind | Lang | Text |
|---|---|---|---|
| 46 | attr:aria-label | en | `Systems and evidence` |

## 6. Data and API contract

All calls go to the same origin under `/api`; the dev server proxies them to the backend (`design-export/api-contract/vite-proxy.txt`). Response and request types are copied verbatim in `design-export/api-contract/types/`; recorded responses for the main states are in `design-export/api-contract/fixtures/`.

### 6.1 Endpoint catalogue

29 endpoints, 42 call sites.

| Method | Path | Query | Binary | Response type | Callers |
|---|---|---|---|---|---|
| POST | `/api/ai/chat` |  |  | AiChatResponse | frontend/src/api/assistant.ts:94 |
| GET | `/api/cell-telemetry` | col, goal_col, goal_row, rover_id, row, start_utc, survival, thermal_dwell |  | CellTelemetryResponse | frontend/src/api.ts:495 |
| GET | `/api/comm-window` | col, row, utc |  | CommWindow | frontend/src/net/analysis.ts:168 |
| POST | `/api/compare` |  |  | CompareResponse | frontend/src/net/compare.ts:16 |
| POST | `/api/dem-uncertainty` |  |  | UncertaintyResponse | frontend/src/net/uncertainty.ts:58 |
| GET | `/api/earth-series` | downsample, n_slices, slice_hours, start_utc |  | EarthSeriesManifest | frontend/src/net/analysis.ts:218 |
| GET | `/api/health` |  |  | { dem_loaded: boolean } | frontend/src/api.ts:504 |
| GET | `/api/illumination-corridor` | coarsen, lit_rule, n_slices, rover_id, slice_hours, start_utc |  | CorridorManifest | frontend/src/net/analysis.ts:535 |
| GET | `/api/illumination-series` | downsample, n_slices, slice_hours, start_utc |  | IlluminationSeries \| SeriesManifest | frontend/src/TerrainCanvas3D.tsx:1589, frontend/src/api.ts:383, frontend/src/net/series.ts:26 |
| GET | `/api/layers/{name}` | downsample, format, rover_id, w_energy, w_shadow, w_slope, w_thermal | yes | LayerResponse \| BinaryField | frontend/src/api.ts:320, frontend/src/net/layers.ts:134 |
| GET | `/api/lidar-scan` | col, elevation_angles_deg, max_range_m, n_azimuth, row, sensor_height_m |  | BackendLidarScanResponse | frontend/src/lidarSimulation.ts:839 |
| POST | `/api/load-preprocessed` |  |  | void | frontend/src/api.ts:510 |
| POST | `/api/plan` |  |  | PlanResponse | frontend/src/api.ts:421 |
| POST | `/api/plan-4d` |  |  | Plan4DResponse | frontend/src/net/plan4d.ts:22 |
| POST | `/api/plan-multi` |  |  | PlanMultiResponse | frontend/src/net/compare.ts:27 |
| POST | `/api/pose` |  |  | PoseResponse | frontend/src/net/pose.ts:55 |
| GET | `/api/profiles` |  |  | Record<string, Omit<ProfileEntry, 'id'>> \| MissionProfiles | frontend/src/api.ts:441, frontend/src/net/profiles.ts:12 |
| GET | `/api/psr-validation` | threshold |  | PsrValidation | frontend/src/net/analysis.ts:55 |
| GET | `/api/reference-missions` |  |  | ReferenceMissions | frontend/src/net/missions.ts:7 |
| POST | `/api/replan` |  |  | ReplanResponse | frontend/src/net/replan.ts:32 |
| POST | `/api/risk-sweep` |  |  | RiskSweepResponse | frontend/src/net/riskSweep.ts:50 |
| GET | `/api/rovers` |  |  | RoverCatalogResponse | frontend/src/api.ts:448 |
| GET | `/api/safe-haven` | downsample, rover_id, span_hours, start_utc, step_hours |  | SafeHavenManifest | frontend/src/net/analysis.ts:127 |
| POST | `/api/stress-test` |  |  | StressTestResponse | frontend/src/net/stressTest.ts:83 |
| GET | `/api/survival` | coarsen, goal_col, goal_row, rover_id, soc_pct, start_utc, t_hours |  | SurvivalManifest | frontend/src/net/analysis.ts:292 |
| GET | `/api/terrain` | rover_id, w_energy, w_shadow, w_slope, w_thermal |  | TerrainManifest | frontend/src/TerrainCanvas3D.tsx:1546, frontend/src/api.ts:368, frontend/src/net/terrain.ts:25 |
| GET | `/api/thermal-dwell` | coarsen, lookahead_hours, rover_id, start_utc, t_hours |  | ThermalDwellManifest | frontend/src/net/analysis.ts:362 |
| GET | `/api/thermal-envelope` | heater_model, initial_inner_c, rover_id |  | ThermalEnvelope | frontend/src/net/analysis.ts:436 |
| GET | `/api/uncertainty-series` | n_clones, n_slices, slice_hours, start_utc |  | UncertaintySeriesManifest | frontend/src/net/analysis.ts:606 |

### 6.2 Fetches with a computed URL

| Method | URL expression | Source |
|---|---|---|
| GET | `url` | frontend/src/TerrainCanvas3D.tsx:192 |
| GET | `url` | frontend/src/TerrainCanvas3D.tsx:402 |
| GET | `url` | frontend/src/api.ts:397 |
| GET | `path` | frontend/src/features/illumination-corridor/useIlluminationCorridor.ts:114 |
| GET | `path` | frontend/src/net/layers.ts:156 |
| GET | `path` | frontend/src/net/series.ts:89 |
| GET | `CATALOGUE_URL` | frontend/src/sky.ts:296 |

### 6.3 Binary terrain transport

Layers are fetched as `GET /api/layers/{name}?format=f32`: a headerless little-endian `Float32Array` (decode with `new Float32Array(await response.arrayBuffer())`). Rows, columns, validity and value range travel in response headers. Missing cells are `NaN`; the `X-Layer-Nodata` header is a count of such cells, not a sentinel value. The JSON form of `/api/layers/{name}` is a capped preview and is used only where noted in chapter 3. Header names the frontend reads:

| Header | Read at |
|---|---|
| `X-Layer-Cols` | frontend/src/api.ts:326, frontend/src/net/layers.ts:82 |
| `X-Layer-Downsample` | frontend/src/net/layers.ts:101 |
| `X-Layer-Max` | frontend/src/api.ts:345, frontend/src/net/layers.ts:94 |
| `X-Layer-Min` | frontend/src/api.ts:344, frontend/src/net/layers.ts:93 |
| `X-Layer-Name` | frontend/src/net/layers.ts:106 |
| `X-Layer-Nodata` | frontend/src/api.ts:346, frontend/src/net/layers.ts:105 |
| `X-Layer-Resolution-M` | frontend/src/api.ts:342, frontend/src/net/layers.ts:100 |
| `X-Layer-Rows` | frontend/src/api.ts:325, frontend/src/net/layers.ts:81 |
| `X-Layer-Validity` | frontend/src/api.ts:343, frontend/src/net/layers.ts:61 |

### 6.4 Boot sequence

On load the boot splash (2.1) calls, in order: health, then the DEM loader only if the health response reports no DEM, then the rover catalogue, then the seven terrain layers in parallel. Any failure keeps the splash on screen in its failed state; there is no retry control.

### 6.5 Backend-sourced content

Rover names and specifications, mission profile names, descriptions, colours and constraints come from the backend (`backend/app/constants.py`, `backend/app/scenarios.py`); the values the reference build shows are tabulated in 2.5. Assistant answers, verdict sentences, requirement texts and capability reasons are backend text rendered verbatim and are therefore not fixed in this document.

## 7. Browser evidence

Pass: browser evidence for the DESIGN.md export (plan `.omc/plans/design-md-export.md` §3c, §5 step 4). Source of truth commit 5aec750 (working branch `berke/backend-review`). Everything below is what Chrome rendered; where it disagrees with source comments or the inventories, the browser value is the one recorded.

### 7.1 Environment

| Item | Value |
|---|---|
| Date | 2026-11-14, about 14:00-14:50 local |
| Browser | Chrome 157.0.0.0, UA `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36` |
| OS | Windows 11 Home Single Language 10.0.26300 (navigator.platform `Win32`) |
| Native tab viewport | 1830x857 CSS px (1830x884 in the second window), devicePixelRatio 1.05, outer window 1463x823, page zoom for localhost about 80 %. Window maximized; `resize_window` had no effect (tried 1600x1000, 1280x823, 1000x700). |
| Measurement viewport | Same-origin harness: tab at `http://localhost:3000/starimg.jpeg`, body replaced by one `<iframe>` of exactly 1600x1000 CSS px (`transform: scale(.857)`, origin 0 0). Inside it: innerWidth 1600, innerHeight 1000, DPR 1.05, media queries evaluate against 1600. Bands: same iframe at 1240x1000, 980x1000, 640x1000 (`(max-width:1240px)` and `(max-width:980px)` verified true at those widths). All numbers are read through `iframe.contentWindow`. |
| URLs | `/` (landing, after the boot splash), `/?stage=hangar`, `/?stage=planner`; analyze reached by planning a route (URL became `?stage=analysis`). Backend: local, proxied at `/api`, grids loaded (`/api/layers/traversable?format=f32` 200, 500x500). |
| Screenshots | `save_to_disk` works. Scale 1 gives a 1568x734 JPEG of the whole tab; each was converted to PNG (PIL) and cropped to the iframe: 1175x734 px for 1600x1000 (0.734 image px per CSS px). Zoom captures are PNG (18 is 1440x152; 21-27 are 534x415 of the map). Band crops: 911x734 (1240), 720x734 (980), 470x734 (640). The pointer the tool draws is visible in some shots (05, 10, 13); it is the tool's arrow, not the CSS cursor. |
| Caveats | (a) The first tab group vanished mid-session (the user was using the same Chrome); a new window and the same harness were used from capture 07 on. (b) From the hangar->cockpit transition on, rendering in the automation window was throttled to 1-8 frames/s while timers ran normally (probably the window was not in the foreground). CSS animation timing measured after that point is unreliable; the curtain timing below comes from the first run, when frames were normal. Static screenshots are unaffected. |

### 7.2 Screens

All files are in `design-export/screens/`. "Not captured" items have their evidence in §3.

| NN | State | File | What is visible |
|---|---|---|---|
| 01 | Boot splash | 01-boot-splash.png | Opaque near-black screen, faint dotted starfield, soft lavender glow above centre. Centred LunaPath mark (coral ring and arc, white cratered disc cut by a road wedge, lavender arrow), "LUNAPATH" wide-tracked caps, grey tagline "Lunar south pole mission planning", lavender row "Mission systems ready … 100%" over a full 3 px lavender bar. Captured at the 100 % stage. |
| 02 | Landing | 02-landing.png | Backdrop video visible: grey moon disc left of centre, Earth crescent to its right, brown Milky Way band top right, under a left-heavy dark scrim. Top line "LUNAPATH  Mission Workstation" / "Lunar south pole, 89.15°S  • Data link active" (mint dot). Lavender kicker, 50 px light two-line headline, grey description, solid lavender "Launch Mission Workstation", footer "Terrain analysis · Energy-aware routing · 3-D mission simulation" between hairlines. |
| 03 | Curtain landing->hangar | not captured | The screenshot itself blocked the page for about 450 ms and landed after the curtain was gone (curtain lives 2.1 s); a retry did not reload the frame, and later the window was throttled. The 50 ms sampler data (M3) is the evidence. |
| 04 | Hangar default | 04-hangar-default.png | NAC regolith photo fills the background (no video). "Select Mission Exploration Rover" bold white, grey subhead. Selected card with 2 px cyan border: photo left with "ESA / LUNAPATH" cyan pill, "• SELECTED VEHICLE" mint pill, caption "Flagship Autonomous Polar Explorer"; right "LPR-1 (Default)" + cyan "LPR_1", description, mono spec box (5420 Wh, 0.20 m/s, 25°, 450 kg), cyan "Science and sensor suite" box, mint-tinted "✓ Assigned For Mission". Square prev/next arrows, 4 thumbnails (first lavender-bordered "LPR-1 (Default) ✓"). "Mission Configuration" dock starts below the fold (y≈690). |
| 05 | Card hover | 05-hangar-card-hover.png | Same, photo zoomed to 1.04 under the pointer; border unchanged (already 2 px cyan because the card is selected). |
| 06 | Info popover | 06-hangar-info-popover.png | Slope Safety info open: an inline dark box under the slider row with the help sentence; the rows below are pushed down (not a floating popover). |
| 07 | Other profile active | 07-hangar-profile-energy-saver.png | Dock scrolled into view. "Energy Saver" card active: green border, green-tinted fill. Weights read "0,250 / 0,450 / 0,150 / 0,150 / 0,150" (comma decimals). Constraints: Max Slope 20° IN SEARCH (green chip), Max Shadow 30 h, Energy Budget 2500 Wh, Min SoC 35 % with yellow POST-SIM chips. Right column: "• Mission ready", agency pill + "LPR-1 (Default)" in mint, "Exploration · 450 kg · 5420 Wh", lavender "Deploy Rover & Open Surface Map". |
| 08 | Curtain hangar->cockpit | not captured | Frames were throttled; the only capture showed the bare deck video with the curtain still at opacity 0 and the shell at opacity 0 (an artifact, discarded). Sampler data in Appendix A. |
| 09 | Cockpit PLAN, no route | 09-cockpit-plan-initial.png | 52 px topbar: "LUNAPATH", PLAN (solid lavender), ANALYZE (dim), "Route required" in mixed case; right "Systems", "Mission NOMINAL" (mint), "Data link • ACTIVE". 530 px left rail: Mission targets (Select Start + ROW/COL "--", Select Goal disabled), Mission sequence (Rover LPR_1 mint chip, Start SELECT, Goal WAITING, Route NOT GENERATED), disabled Undo/Clear/Generate Route, hint, Assigned vehicle card, Change vehicle. Map: grey hillshade stretched to 1046x882, HUD card "SURFACE TELEMETRY" top left, 2D/3D + "Layer Surface ▾" + "Analysis None ▾" top right, map key bottom centre, assistant launcher bottom right. An empty 44 px strip under the map. |
| 10 | Start picker armed | 10-start-picker-armed.png | Start button reads "Pick on map…" with lavender border; sequence "Start PICKING"; hover crosshair lines across the map. |
| 11 | Start placed, goal armed | 11-start-placed-goal-armed.png | Mint "S" disc on the map; "START 143, 79" in mint, ROW 143 COL 79; goal button "Pick on map…"; hint "Select a Goal point on the terrain to enable routing." |
| 12 | Both placed | 12-both-placed.png | Coral "G" disc; "GOAL 398, 391" coral; Generate Route solid lavender; "Route priorities" heading appears at the rail bottom. |
| 13 | Solving | 13-solving-overlay.png | Card centred on the map: spinner, cyan kicker "A* PATHFINDER · KINEMATIC SOLVER", "Computing route", detail sentence naming LPR-1 (Default), tags "START: [143, 79]", "GOAL: [398, 391]", cyan "Optimising path". A cyan scan line crosses the map top. "Mission SOLVING" lavender; PLAN/ANALYZE dimmed; button "Computing Route...". |
| 14 | ANALYZE, Route tab | 14-analyze-route-tab.png | Map 1016 px column, right rail 584 px with tabs Route (active, lavender underline), Safety (coral, badge "2"), Analysis, Compare. Route tab: "Surface picker telemetry" table, "Route" block (filled mint dot START, coral ring GOAL with coordinates), "Overall risk LOW" (blue, 2 of 5 blue blocks), decision summary tiles (2.31 km, 88.2 %, 0.17 m/s, 3.7 h, 385, 0 stops). Topbar gains "Mission Report". Route drawn cyan at reduced alpha. Bottom: time-axis dock (play, slider, "+0.0 h", Layer checkbox, Shadow select, cyan "Plan through time", REQUIRE chips, sun line) and the status strip, clipped (see N1). |
| 15 | Safety tab | 15-analyze-safety-tab.png | "Formal Safety Margins", coral "REQUIREMENTS VIOLATED 7/9 met", "Tightest LP-R05 -61.90 degC", robustness rows LP-R01..R12 with margin bars (mint), violations R04/R05 coral, R08/R09/R12 grey "Not checked", R10 cyan "0.00 m"; footnotes; "Route Cost Model" panel begins below. |
| 16 | Analysis tab | 16-analyze-analysis-tab.png | DEM Uncertainty (P traversable 1.00, Clones 20, "Price on the clone ensemble"), Monte Carlo Stress Test ("Run 1,000 executions"), Risk Appetite Sweep ("Plan at α 0.5, 0.9, 0.99"); the rest of the rail is empty. |
| 17 | Compare tab | 17-analyze-compare-tab.png | External Benchmark bars (10° 33.3 %, 15° 91.7 %, 20° 100.0 % vs 100 %), mint note, "CLAIM BOUNDARY" text block, doc reference line, Profile Comparison "Compare all profiles". |
| 18 | Playback + time axis (zoom) | 18-playback-timeaxis-zoom.png | Time-axis dock fully visible. Status strip starts with a scrubber fragment at the far left (Pause and waypoint counter are off-screen), then MISSION TIME, SPEED, scale buttons 1× (boxed) 10× 60× 300×, COVERED, BATTERY (blue), and "SLOPE" cut at the right edge. |
| 19 | Layer dropdown open | 19-layer-dropdown-open.png | Dark menu with lavender group headers Terrain / Environment / Planning, seven items with grey descriptions, ✓ on Surface. The "Analysis None ▾" trigger is painted on top of the menu's first row. |
| 20 | Analysis-layers panel | 20-analysis-layers-panel-open.png | Tall dark "Analysis overlays" list with square toggles and indented caveats (Roughness, PSR mask, Earth visibility, P(traversable), Slope σ (ours), Elevation σ (NASA)…), overlapping the map key and clipped by the map frame. |
| 21 | Surface | 21-view-surface.png | Grey hillshade, dark crater bowls. |
| 22 | Slope | 22-view-slope.png | Magma ramp: deep purple flats, orange-cream crater walls. |
| 23 | Aspect | 23-view-aspect.png | Full-saturation HSV hue wheel; craters read as rainbow pinwheels. S/G markers and route look desaturated over it. |
| 24 | Thermal | 24-view-thermal.png | Coolwarm: salmon/red warm slopes, pale lilac flats, saturated blue cold traps. |
| 25 | Shadow | 25-view-shadow.png | Grey ramp, near-black permanently shadowed bowls, white ridges. |
| 26 | Cost | 26-view-cost.png | Viridis (blue to yellow) with black impassable blobs; pixelated. |
| 27 | Traverse | 27-view-traverse.png | Flat green with crimson impassable blobs; pixelated. |
| 28 | 3-D first person | 28-3d-first-person.png | Ground-level view: large semi-transparent green LiDAR wedge in the upper middle, orange "ROCK nn.n m" labelled boxes, cyan dot grid, "LIDAR PERCEPTION … LIVE" card bottom left covering half the map key, "First person / Orbit" pill top centre, "Photographic Overlay (LROC NAC, 1 m/px)" checked by default with caption. Rover body not visible. |
| 29 | 3-D orbit, overlay off | 29-3d-orbit-photo-overlay-off.png | Terrain block floating on a starfield, synthetic light/dark patches, thin teal route, green rock label at the start; "Solar Ephemeris · Day 1.0" slider appears under the unchecked overlay box. |
| 30 | 3-D orbit, overlay on (default) | 30-3d-orbit-photo-overlay-on-default.png | Same view with the LROC photo drape (grey, realistic craters); slider hidden. |
| 31 | Systems drawer, PLAN | 31-systems-drawer-plan.png | Dimmed cockpit; 820 px drawer from the right: "DIAGNOSTICS & PROOF", bold "Systems & Evidence", subtitle, ✕; ROS 2 Integration card with a yellow "Not a live connection…" box, Layer Provenance cards (elevation MEASURED, DEM uncertainty NASA CLONES, Illumination uncertainty 20 CLONES). |
| 32 | Systems drawer, ANALYZE | 32-systems-drawer-analyze.png | Same drawer; behind it the map shows the Corridor overlay (thick cyan ribbon, blue points) that the drawer's mounting added. |
| 33 | Assistant idle | 33-assistant-window-idle.png | 394x640 window over the map's right third: "LunaPath / Analiz Asistanı TR", "+ Yeni sohbet", level chips Basit / Mühendislik / Teknik, rover illustration, question prompt, five suggestion rows, disabled input "Önce anlatım seviyesini seç" and "Gönder". Nothing was sent. |
| 34 | Mission report EN | 34-mission-report-en.png | 1180x952 modal: "Mission report / Route complete", meta block, EN|TR, Save as PDF, Download data, Back to map (focus ring); blue "GO / Route is safe as planned."; decision summary tiles; battery profile chart (MIN 88.2 %, RESERVE 30 %); slope and risk distributions; thermal and shadow cards below. |
| 35 | Mission report TR | 35-mission-report-tr.png | Same in Turkish ("Görev raporu / Rota tamamlandı", "%88,2", "2,31 km", "Haritaya dön"); "LOW" stays English. |
| 36 | Toast | 36-toast-selected-point-unavailable.png | Bottom-right card over the map key and launcher: coral title "Selected point is unavailable", white message, mono detail "start (164, 306) is not traversable for LPR-1 (Default) (slope limit or extreme thermal).", a light-grey OS-style button "Show traversable cells", ✕. |
| B | Bands | band-{1240,980,640}-{landing,hangar,cockpit-analyze}.png | Landing reflows cleanly at all three (640: status hidden, 38.4 px headline, 320 px button, moon sits behind the description). Hangar: 1240 two-column card; 980 card narrows, "Shadow Exposure" label wraps; 640 single column, photo 200 px, thumbnails wrap 3+1. Cockpit: 1240 map 632x770 (taller than wide), playback controls off-screen; 980 and 640 the right rail is painted over the map; at 640 PLAN/ANALYZE disappear and "Mission Report" covers the brand. |

Saved: 43 PNG files (34 state captures + 9 band captures). Not captured: 03, 08.

### 7.3 Measurements (raw)

**M1 (3c#1) cockpit backdrop.** `.app-shell` background-color rgb(5,7,13), z-index 1, opacity 1. `.space-backdrop--deck` z-index 0, media opacity 0.55, video playing (`/videos/moon-backdrop-1080.mp4`, 1920x1080, 14.97 s, readyState 4). The video is not visible anywhere in the cockpit screenshots.

**M2 (3c#2) hangar.** `.fleet-screen` position fixed, z-index 131, background-image `url(/textures/nac-site11-2048.jpg)` over rgb(5,7,13). `.space-backdrop--ambient` z-index 130, media opacity 0.95, playing underneath, fully covered. The mp4 exists on this machine and plays on the landing (ambient, scale matrix 1.06).

**M3 (3c#3) curtain.** Landing->hangar, frames normal, t = ms after click:
```
53    is-entering           opacity 0      splash-draw running (fill both)
151   is-entering           opacity 0.220
201   is-entering           opacity 0.575
351   is-entering           opacity 0.983
452   is-entering           opacity 1      splash-draw FINISHED, fill both
1123  is-entering           opacity 1      fleet mounted, URL ?stage=hangar
1556  is-leaving is-entering opacity 1     only a `visibility` transition exists (0 ms)
2053  is-leaving            opacity 1      visibility transition at 466 ms, still visible
2157  splash removed from DOM
```
No opacity transition is ever created during `.is-leaving`; the curtain is a hard cut at about 2.1 s. For comparison the boot splash (no `splash-draw`) does fade: opacity 1 -> 0.91 -> 0.51 -> 0.07 -> 0.0009 over 4655-5154 ms, removed at 5205 ms.

**M4 (3c#4) landing entrance vs boot splash.** Splash first sampled at t=1594 ms (after module load); landing h1 opacity 0.10 at 1828, 0.92 at 2223, 1.00 at 2815; splash `.is-leaving` at 4655 (3061 ms after first sample), gone at 5205. The entrance finished 1.84 s before the splash began to leave. Stages seen: 12 % "Contacting mission backend", 52 % "Reading rover catalogue", 88 % "Fetching terrain layers", 100 % "Mission systems ready" (34 % DEM stage skipped).

**M5 (3c#6) status and pulse.** `.lp-pulse-dot`: animation-name none, duration 0s, 5x5, bg rgb(95,227,176), opacity 1. Mission status: NOMINAL `lp-mission-status is-nominal` rgb(147,220,196); SOLVING `is-solving` rgb(186,175,245); LOCKED `is-nominal` rgb(147,220,196) (same mint as NOMINAL; no cyan). ATTN not observed. `.lp-route-required`: Azeret Mono 12px/400, letter-spacing 0.96px, text-transform none, colour rgb(123,132,151), rendered "Route required".

**M6 (3c#7) canvas stretch.** Bitmap 500x500. PLAN: 1046.01x882.04 CSS px (x 2.092, y 1.764 per bitmap px; 18.6 % wider than tall). ANALYZE: 992.02x770.39 (x 1.984, y 1.541; 28.8 %). Band 1240 ANALYZE: 632x770 (0.82, taller than wide). A 14-px marker disc renders about 27.8x21.6 CSS px in ANALYZE.

**M7 (3c#8, #9) route colour and cell offset.** Legend SVG strokes: Safe `#4a8fd8` solid, Caution `#e3d548` "10 5", High `#d69770` "4 4", Critical `#ed4b3d` "1.5 3.5". Route pixels on Surface: no pixel within ±12 of either `#4fd8f0` or `#4a8fd8` because the route was drawn at the "not yet covered" alpha; dominant route colours rgb(88-96,144-152,152-160), which un-mix exactly to `#4fd8f0` at alpha 0.42 over the grey ground (≈94,92,88); `#4a8fd8` cannot produce them from a grey ground. Offset: start-disc centroid (78.96, 142.92) for cell (row 143, col 79); goal centroid (390.96, 397.88) for (398, 391): markers centre on the cell's top-left corner. Hover crosshair centre dot for cell (274, 248) is centred on pixel column 248 / row 274, i.e. at the cell centre (248.5, 274.5).

**M8 (3c#10) goal marker.** Canvas: filled coral disc rgb(237,133,110), 14x14 bitmap px, dark "G" in the middle. Rail `.lp-endpoint-marker.is-goal`: background transparent, border 2.857px solid rgb(237,133,110), radius 50 %, 12.99x12.99 (a ring). `.is-start`: filled rgb(95,227,176), no border.

**M9 (3c#11) widths at 1600.** PLAN: grid "530px 1070px", left rail 530, center-stage 1070. ANALYZE: grid "1016.01px 583.988px", center-stage 1016.01, right rail 583.99. Map column changes by 54 px; canvas height also changes 882.04 -> 770.39 (the time-axis dock appears).

**M10 (3c#12) plan strip and HUD.** `.lp-status-bar` in PLAN: x530 y956 1070x43.99, one child `.lp-status-right` with 0 children and empty text. HUD (`.map-overlay`, 232x162 at 554,76) has a single button "–" aria-label "Minimize HUD"; no close control.

**M11 (3c#13) unstyled elements.** `.toast-action`: bg rgb(240,240,240), colour rgb(0,0,0), border 1.905px outset rgb(0,0,0), padding 0, radius 0, display inline-block, Archivo 16px/400 (font inherited from a reset) = native button look. `.toast-body`: no own declarations (block, Archivo 16px, line-height 24px, transparent). `.lp-status-right`: Archivo 16px, block, no padding. For contrast, `.toast-card--warning`: bg rgba(14,15,24,.94), border 0.952px solid rgba(214,151,112,.28), padding 14px 14px 14px 16px, radius 2px; `.toast-title` Archivo 16px/600 rgb(255,164,141). Toast lifetime measured 5277 ms.

**M12 (3c#14) overlays vs drawer.** Drawer open (ANALYZE): canvas had 143 px within tolerance of `#4a8fd8` (corridor points) and 1846 cyan-ish px (route + corridor ribbon). Safe haven "Show on map" checked. After ✕: 0 blue px, 1088 cyan-ish px; the corridor ribbon and points were gone. Reopening: Safe haven checkbox unchecked again.

**M13 fonts.** document.fonts: Archivo 300-800 (2 faces, loaded), Archivo Narrow 400-700 (2, loaded), Azeret Mono 400-500 (1 loaded, 1 unloaded).

| Element | family / size / weight / letter-spacing / transform / colour |
|---|---|
| Landing h1 | Archivo / 50px / 300 / -0.75px / none / rgb(231,234,241); line-height 54px |
| Landing kicker | Archivo Narrow / 12px / 400 / 0.48px / none / rgb(186,175,245) |
| Landing brand mark | Archivo / 16px / 600 / 3.84px / uppercase / rgb(231,234,241) |
| Landing button | Archivo / 15px / 600 / 0.6px / none / rgb(10,12,20) on rgb(186,175,245) |
| TopBar brand | Archivo / 15px / 600 / 3.6px / none / rgb(231,234,241) |
| PLAN (active) | Archivo / 12px / 600 / 0.96px / none / rgb(10,12,20) on rgb(186,175,245) |
| ANALYZE (disabled) | Archivo / 12px / 400 / 0.96px / none / rgb(152,161,180), opacity 0.38 |
| Rail panel label "Mission targets" | Archivo / 12px / 500 / 0.48px / none / rgb(139,148,166) |
| HUD mono readout "88.9205° S" | Azeret Mono / 13px / 600 / 0.52px / none / rgb(231,234,241) |
| RailTabs label | Archivo / 12px / 400 / 0.72px / none; active rgb(231,234,241), inactive rgb(123,132,151), Safety rgb(255,164,141) |
| Systems toggle | Azeret Mono / 12px / 400 / 0.96px / none / rgb(200,205,219) |

**M14 console.** First tab: not captured (group lost). Second tab, 14:23-14:45: only warnings, all the same: `THREE.WebGLProgram: Program Info Log: … warning X4122: sum of 0.996094 and -2.98545e-017 cannot be represented accurately in double precision` (9 times, once or twice per 3-D mount). No errors. The 422 from `POST /api/plan` produced no console error entry in this tool.

**M15 3-D rover.** First person: the rover body is not in frame. Orbit: the rover sits under a "ROCK nn m" label at the start; heading and wheel spin could not be judged (rendering throttled to 1-8 fps, rover a few pixels wide). UNVERIFIABLE. Extra: with CNSA Yutu-2 selected, the 3-D view requested `GET /models/viper-rover-textured.glb` (200), the only GLB request.

### 7.4 Verdicts on §3c

| # | Verdict | Evidence |
|---|---|---|
| 1 | CONFIRMED | `.app-shell` rgb(5,7,13) at z 1 over the deck backdrop (z 0, opacity 0.55, playing); no video pixels in any cockpit capture. |
| 2 | CONFIRMED | `.fleet-screen` fixed z 131 with the NAC jpg over void; ambient backdrop z 130 underneath. |
| 3 | CONFIRMED | Opacity stays 1 for the whole `.is-leaving` window; `splash-draw` finished with fill both; only `visibility` transitions; hard cut at ~2.1 s. |
| 4 | CONFIRMED | Landing h1 reached opacity 1 at 2815 ms; the opaque splash began leaving at 4655 ms. |
| 5 | UNVERIFIABLE | Needs a ≥9 s stall followed by success; the backend answered every stage within ~1.3 s and was not stalled. |
| 6 | CONFIRMED | Pulse dot animation none; LOCKED uses `.is-nominal` mint rgb(147,220,196); "Route required" rendered mixed case (text-transform none). ATTN not observed. |
| 7 | CONFIRMED | 500x500 bitmap shown at 1046x882 (PLAN) and 992x770 (ANALYZE); discs render as ellipses. |
| 8 | CONFIRMED | Marker centroids on the cell corner (78.96, 142.92); crosshair centred on the cell centre. |
| 9 | CONFIRMED | Legend Safe stroke `#4a8fd8`; route pixels un-mix to `#4fd8f0` at alpha 0.42. |
| 10 | CONFIRMED | Canvas goal = filled coral disc; rail goal = 2.857 px coral ring on transparent. |
| 11 | CONFIRMED | 530 px vs 584 px rails; map column 1070 vs 1016 (54 px). |
| 12 | CONFIRMED | Empty 44 px strip in PLAN; HUD has only "Minimize HUD". |
| 13 | CONFIRMED | `.toast-action` native button (rgb(240,240,240), black, outset border); `.toast-body` and `.lp-status-right` carry no styles of their own. |
| 14 | CONFIRMED | Corridor overlay and Safe haven toggle disappear when the drawer closes; toggle state resets on reopen. |
| 15 | UNVERIFIABLE | Rear wheel spin not visible at the available scale and frame rate. |
| 16 | UNVERIFIABLE | Rover orientation covered by a label in orbit; not visible in first person. |
| 17 | CONFIRMED | Yutu-2 selected -> only `/models/viper-rover-textured.glb` requested. (Colouring vs weights not checked.) |
| 18 | CONFIRMED (weak) | Two reloads, same first-person sky crop (PNG, lossless): bright stars identical (max diff 14 levels), but 248 of 60,630 px differ by >3 levels and 58 by >6, consistent with the random faint Milky Way points (`sky.ts` uses Math.random only in `buildMilkyWay`). |
| 19 | UNVERIFIABLE | Sun and Earth were not in any captured 3-D frame; angular size needs camera FOV data. |
| 20 | UNVERIFIABLE | Document vs code question; not observable in a browser. |

Totals: 15 CONFIRMED, 0 REFUTED, 5 UNVERIFIABLE.

### 7.5 New deviations and surprises (not in §3c)

- **N1. Playback controls are off-screen at 1600 (and 1240).** `.lp-status-bar.is-analyze` is 1016 px wide (scrollWidth 1044), `justify-content: flex-end`, `overflow: hidden`; its child `.lp-status-right` is 1262 px wide and starts at x = -262. The "❚❚ Pause" button (x -262), "Waypoint 003 / 385" (x -176) and most of the scrubber (x -29..187) are clipped on the left; the SLOPE value (x 1013-1044) is clipped on the right. At 1240 the Pause button is at x -527. Playback cannot be paused or scrubbed from the strip at the primary viewport.
- **N2. ≤980 px the cockpit layout breaks.** Grid rows compute to "0px 948px 0px"; `.center-stage` (y 52, h 500) and `.right-rail` (y 52, h 948) start at the same y, so the rail's tab bar and text paint over the map and the time-axis dock. At 640 the topbar left group is 64 px wide, `.lp-mode-switch` collapses to 2 px (PLAN/ANALYZE invisible), and the two-line "Mission Report" button sits on top of the brand.
- **N3. Mission report contradicts the Safety tab.** Report: "GO / Route is safe as planned.", "No driving constraint was violated.", "Route complete … drove 2.31 km". Safety tab at the same time: "REQUIREMENTS VIOLATED 7/9 met" (LP-R04 electronics thermal -51.90 degC, LP-R05 battery thermal -61.90 degC) with a "2" badge, while playback had covered about 0.04 km.
- **N4. The "Selected point is unavailable" toast does not come from the map click.** Clicking a non-traversable cell (164, 306; value 0 in `/api/layers/traversable`) with the picker armed places the S marker silently. The toast appears only after "Generate Route" returns HTTP 422, and it covers the assistant launcher and the right end of the map key.
- **N5. The "Analysis None" trigger draws over the open layer dropdown** (shell inventory gray point 11): `elementFromPoint` at the trigger centre returns the trigger while the menu is open.
- **N6. Opening the Systems drawer draws an overlay by itself.** The Corridor panel registers its ribbon and points on mount, with no "Show on map" toggle; the map changes behind the drawer.
- **N7. The goal picker icon is mint, not coral** (shell gray point 10): GOAL button icon rgb(95,227,176), text rgb(255,164,141).
- **N8. Locale-dependent number inputs.** Hangar weight inputs render "0,409" (comma) in this Turkish-locale Chrome while the value is "0.409"; everything else in the UI uses a dot.
- **N9. 3-D defaults.** The photographic overlay is ON by default (so the Solar Ephemeris slider is hidden on entry); the LIDAR PERCEPTION card covers the left half of the map key; a large green LiDAR wedge dominates the first-person view; rock labels can cover the rover in orbit.
- **N10. At 1240 the map distorts the other way** (632x770, taller than wide).
- **N11. Info popover is inline**, pushing the next slider rows down, not a floating popover.
- **N12. Device-pixel snapping at DPR 1.05.** 2 px borders compute as 1.905 px and 1 px as 0.952 px; anyone re-measuring at DPR 1 will see whole numbers.
- **N13. PLAN after a route** shows "Route LOCKED" in the sequence and keeps the route drawn; the topbar status stays "LOCKED".
- **N14. Solving overlay duration.** 6168 ms on this machine for a 2.31 km, 385-node route (750 ms of that is the deliberate hold).
- **N15. Landing at 640.** The video crop places the moon disc directly behind the description text, reducing its contrast.
- **N16. Hangar at 980/640.** "Shadow Exposure" wraps to two lines at 980; at 640 the thumbnails wrap 3 + 1 and the page scrolls to 2334 px.
- **N17. Azeret Mono** has one face left "unloaded" after the full session.

### 7.6 Appendix A. Raw notes (appended during the session)

#### Environment
- Chrome 157.0.0.0 (UA `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36`), Windows 11 (platform Win32).
- Native tab viewport: 1830x857 CSS px (visualViewport 1829.52x857.14), devicePixelRatio 1.05, outer window 1463x823, page zoom for localhost:3000 about 80% (outerWidth/innerWidth 0.7995). Window is maximized; `resize_window` is ignored (tried 1600x1000, 1280x823, 1000x700: no change).
- Harness: tab navigated to `http://localhost:3000/starimg.jpeg` (same origin), body replaced by an `<iframe>` of exactly 1600x1000 CSS px, `transform: scale(.857)` origin 0 0. Inside the iframe: innerWidth 1600, innerHeight 1000, DPR 1.05, `(max-width:1240px)` false, `(max-width:980px)` false. All measurements are read through `iframe.contentWindow`.
- Screenshots: JPEG 1568x734 for the whole 1830x857 tab, converted to PNG with PIL and cropped to the iframe area (1175x734 px for the 1600x1000 frame, i.e. about 0.734 image px per CSS px).

#### 01 Boot splash timeline (poll every 50 ms from the parent, t = ms since iframe src set)
- t=1594 splash first seen, text `Contacting mission backend 12%`, bar 12%, landing already mounted (h1 opacity 0)
- t=1767 `Reading rover catalogue 52%` (the 34% `Loading lunar elevation model` stage was NOT shown: DEM already loaded)
- t=1828 `Fetching terrain layers 88%`; landing h1 opacity already 0.10 and rising under the splash
- t=2223 h1 opacity 0.92; t=2815 h1 opacity 1 and `Mission systems ready 100%`
- t=4655 `.is-leaving` added (3061 ms after first splash sample); opacity 0.91 @4704, 0.51 @4806, 0.22 @4906, 0.07 @5003, 0.0009 @5154
- t=5205 splash removed from the DOM
- Conclusion: boot splash exit fade plays (about 500 ms). The landing entrance animation finished (h1 opacity 1 at t=2815) about 1.84 s before the splash started leaving.

#### Session note: tab group reset
- After capture 06 the original tab group disappeared (the user was browsing other sites in the same Chrome; tabs_context reported the group gone). A new tab (new window, also maximized, 1830x884 native, DPR 1.05, zoom 80%) was created and the harness rebuilt with the same 1600x1000 iframe.
- From the hangar->cockpit transition on, the window rendered at a throttled frame rate: iframe rAF 7-8 frames/s, then 1 frame/s, parent rAF 1 frame/s, while setInterval in the parent ran normally at 50 ms (main thread idle). visibilityState stayed "visible". Most likely the Chrome window was not in the foreground. Consequence: CSS animations sampled after this point did not advance in real time (splash-draw stayed at currentTime 0 for 2 s). Timing data for the curtain therefore comes from the first run (landing->hangar, frames normal). Static screenshots are unaffected (capture forces a frame).

#### 03 curtain landing->hangar sampler (run 1, frames normal; t = ms since click; screenshot capture blocked the parent between 666 and 1123)
```
53   S is-entering        op 0        splash-draw running fill=both t=0     landing is-exiting
151  S is-entering        op 0.220    splash-draw running both 50
201  S is-entering        op 0.575    splash-draw running both 100
254  S is-entering        op 0.802
351  S is-entering        op 0.983
452  S is-entering        op 1        splash-draw FINISHED fill=both
666  S is-entering        op 1        landing-screen is-exiting still mounted
1123 S is-entering        op 1        fleet-screen mounted, URL ?stage=hangar
1511 S is-entering        op 1
1556 S is-leaving is-entering  op 1  visibility transition running (0 ms), splash-draw finished both
1652 S is-leaving         op 1        visibility transition 67 ms
1852 S is-leaving         op 1        visibility transition 266 ms
2053 S is-leaving         op 1  vis visible  visibility transition 466 ms
2157 splash removed from DOM
```
- Computed opacity stays exactly 1 for the whole `.is-leaving` window (1556-2053 ms): no opacity transition is created at all, only a `visibility` transition. The curtain disappears in one frame at about 2.1 s (hard cut). The finished `splash-draw` animation with fill `both` pins opacity to 1.

#### 08 curtain hangar->cockpit (runs 2 and 3, frames throttled)
- `.splash-screen.is-entering` mounted, splash-draw currentTime stuck at 0 (opacity 0) until unmount; fleet unmounted at ~676 ms, URL `?stage=planner` at ~711 ms, `.app-shell.is-visible` from ~689 ms. Throttled rendering made the curtain invisible in the capture (the capture showed the bare deck video, curtain at opacity 0, shell at opacity 0). That capture is an artifact and was not saved.

#### Measurements so far
- Landing (iframe 1600x1000): h1 Archivo 50px/300, letter-spacing -0.75px, line-height 54px, color rgb(231,234,241). Kicker "Archivo Narrow" 12px/400, ls 0.48px, color rgb(186,175,245). Brand mark Archivo 16px/600 ls 3.84px uppercase. Brand sub "Archivo Narrow" 12px rgb(123,132,151). Status "Archivo Narrow" 12px rgb(128,138,157); markup `<span>Lunar south pole, 89.15°S</span><span class="landing-link"><i class="landing-link-dot"></i>Data link active</span>` (coordinate in a plain span in the body font, not mono). Description Archivo 16px/300 lh 26.4px rgb(152,161,180). Button Archivo 15px/600 ls 0.6px ink rgb(10,12,20) on rgb(186,175,245). Capabilities "Archivo Narrow" 12px rgb(139,148,166).
- Backdrop on landing: `.space-backdrop--ambient`, z 130, VIDEO currentSrc /videos/moon-backdrop-1080.mp4, readyState 4, 1920x1080, duration 14.97 s, playing, media opacity 0.95, transform matrix(1.06,...). The mp4 IS present on this machine. Landing bg transparent, z 131.
- document.fonts: Archivo 300-800 (2 faces loaded), Archivo Narrow 400-700 (2 loaded), Azeret Mono 400-500 (1 loaded, 1 unloaded).
- Hangar: `.fleet-screen` position fixed, z 131, background-image url(/textures/nac-site11-2048.jpg) + void rgb(5,7,13); backdrop still ambient z 130, media opacity 0.95 and playing underneath (fully covered). `.fleet-screen` scrollHeight 1212 for clientHeight 1000.
- `.lp-pulse-dot` (hangar SELECTED VEHICLE pill): animation-name none, 0s, bg rgb(95,227,176), 5x5, opacity 1.
- Card hover: border 1.90476px solid rgb(79,216,240) (2px snapped to device pixels at DPR 1.05), photo transform matrix(1.04...). Card rect x 104, y 153, w 1392, h 391.
- Info popover (Slope Safety): inline block that pushes the rows below (not floating); rect x 636 y 908 w 563 h 55; bg rgb(14,19,29), Archivo 12px rgb(152,161,180); text "How hard the solver works to avoid steep ground. Raise it and the route detours around inclines and crater rims; lower it and it takes the shorter, steeper line."
- Energy Saver active: weights 0.250/0.450/0.150/0.150 (+ roughness 0.150 unchanged); active card border rgb(34,197,94), bg color(srgb 0.133 0.773 0.369 / 0.1), no shadow. Number inputs render "0,250" (comma decimal) in this Turkish-locale browser although value is "0.250".
- Cockpit PLAN (1600x1000): `.app-shell` bg rgb(5,7,13), z 1; backdrop `--deck`, z 0, media opacity 0.55, playing, fully hidden behind the opaque shell. grid-template-columns "530px 1070px" (`content-grid no-right-rail`). left rail x0 y52 w530 h948; center-stage x530 w1070 h948; `.map-canvas-shell` and canvas x542 y60 w1046.01 h882.04; canvas bitmap 500x500. Topbar h 51.99. Status bar x530 y956 w1070 h43.99 with one child `.lp-status-right` that has 0 children and no text. HUD rect x554 y76 w232 h162, one button "–" aria-label "Minimize HUD" (no close).
- Cockpit type: brand Archivo 15px/600 ls 3.6px; PLAN Archivo 12px/600 ls 0.96px ink rgb(10,12,20) on rgb(186,175,245); ANALYZE Archivo 12px/400 rgb(152,161,180) opacity 0.38; "Route required" Azeret Mono 12px/400 ls 0.96px, text-transform none, rendered "Route required" in rgb(123,132,151); mission status `.lp-mission-status.is-nominal` Azeret Mono 12px rgb(147,220,196) "NOMINAL"; rail label "Mission targets" Archivo 12px/500 ls 0.48px rgb(139,148,166); HUD readout "88.9205° S" Azeret Mono 13px/600 ls 0.52px rgb(231,234,241); Systems toggle Azeret Mono 12px rgb(200,205,219).

#### Cockpit interaction measurements
- Start picker armed: button text changes to "Pick on map…" (class `lp-pick-btn is-picking`), sequence row "Start PICKING"; canvas class `lp-map-pick-start`, computed cursor = `url("data:image/svg+xml,...stroke %2305070d width 3.4 ... ")` (26x26 SVG ring+cross; the mint copy follows), canvas aria-label "Terrain map. Arrow keys move the cursor, hold Shift to move ten cells at a time. Press Enter to place Start at the cursor." Hover crosshair lines visible on the map. The screenshot tool draws its own arrow pointer, not the CSS cursor.
- Start placed at row 143 col 79 (click); goal armed: canvas class `lp-map-pick-goal`, cursor SVG contains `ed856e`. Start button text "START 143, 79"; sequence "Start 143, 79 / Goal PICKING"; hint "Select a Goal point on the terrain to enable routing."
- Goal placed at row 398 col 391; canvas class "" and cursor auto. "Generate Route" button turns solid lavender; "Route priorities" section appears at the bottom of the left rail.
- Picker button styles with both placed: START icon rgb(95,227,176), text rgb(147,220,196), border rgba(95,227,176,.4), bg rgba(16,22,36,.7). GOAL icon rgb(95,227,176) (MINT, not coral/risk-high), text rgb(255,164,141), border rgba(237,133,110,.4).
- Solving: MutationObserver saw `.lp-solving-overlay` appear together with `.lp-mission-status.is-solving` "SOLVING" and disappear 6168 ms later (includes the 750 ms hold); LOCKED appeared at the same mutation, URL switched to `?stage=analysis` 52 ms later. SOLVING colour lavender (screenshot). Card text: "A* PATHFINDER · KINEMATIC SOLVER", "Computing route", "Evaluating terrain slope, thermal constraints, shadow exposure, and energy consumption for LPR-1 (Default).", tags "START: [143, 79]", "GOAL: [398, 391]", "Optimising path". Plan button label "Computing Route...", PLAN/ANALYZE both dimmed.
- After route: `.lp-mission-status is-nominal` "LOCKED" color rgb(147,220,196) (mint-text, same as NOMINAL). `.lp-route-required` removed.
- ANALYZE layout: grid "1016.01px 583.988px" (`content-grid no-left-rail`); right rail x1016 w583.99 h948; center-stage w1016.01; canvas x12 y60 w992.02 h770.39. PLAN canvas was 1046.01x882.04. Map width changes by 54 px, height by 111.65 px between modes.
- Canvas stretch: bitmap 500x500. PLAN 1046.01x882.04 CSS px (x scale 2.092, y scale 1.764, aspect 1.186 = 18.6% wider than tall). ANALYZE 992.02x770.39 (x 1.984, y 1.541, aspect 1.288 = 28.8% distortion). The S/G discs (14 bitmap px) render about 27.8x21.6 CSS px in ANALYZE: ellipses.
- Status bar ANALYZE: `.lp-status-bar.is-analyze` clientWidth 1016, scrollWidth 1044, justify-content flex-end, overflow hidden. Child `.lp-status-right` x=-262 width 1262. Pause button "❚❚ Pause" at x=-262 (off-screen), "Waypoint 003 / 385" at x=-176..-43 (off-screen), range input x=-29..187 (mostly off-screen), MISSION TIME at 214, SPEED 415, scale buttons 1×/10×/60×/300× at 539-680, COVERED 707, BATTERY 842, SLOPE label 963, SLOPE value x1013 w31 (ends at 1044 > 1016, clipped). At 1600x1000 the Play/Pause control, waypoint counter and most of the scrubber are not visible or reachable.
- RailTabs: "Route*" active by default, "Safety" with badge "2" and coral text, "Analysis", "Compare".
- Rail endpoint markers (Route tab, mission context): `.lp-endpoint-marker.is-start` bg rgb(95,227,176), no border, radius 50%, 12.99x12.99; `.is-goal` bg transparent, border 2.857px solid rgb(237,133,110) (ring). Canvas goal: filled coral disc (pixels across the disc are rgb(237,133,110) with the dark "G" glyph in the middle), bbox 14x14 bitmap px.
- Marker position: mint disc centroid on the bitmap = (78.96, 142.92) for start cell col 79 row 143; coral centroid (390.96, 397.88) for goal col 391 row 398. The disc centre sits on the cell's top-left corner (79.0, 143.0), not on the cell centre (79.5, 143.5).
- Route colour: no pixel within ±12 of #4fd8f0 nor of #4a8fd8 at capture time because the whole route was drawn at the "not yet covered" alpha (covered 0.00 km). The dominant route pixels on the Surface view were rgb(88-96,144-152,152-160); un-mixing against the grey ground (about 94,92,88) at alpha 0.42 gives #4fd8f0 exactly, while #4a8fd8 would need a green-tinted ground. Legend SVG lines: Safe `#4a8fd8` solid, Caution `#e3d548` dash "10 5", High `#d69770` "4 4", Critical `#ed4b3d` "1.5 3.5".
- Layer dropdown open: menu wrapper `.lp-layer-menu-wrapper`; items exactly: Terrain: Surface "Lunar Regolith Topography & Hillshade" ✓, Slope "Terrain Incline (Degrees)", Aspect "Surface Facing Direction"; Environment: Thermal "Surface Temperature (Kelvin / °C)", Shadow "Permanent Shadow Region Ratio"; Planning: Cost "A* Multi-Factor Weighted Cost Grid", Traverse "Rover Incline & Obstacle Mask". The "Analysis None ▾" trigger (x844 y128 w136 h33) paints ON TOP of the open menu: elementFromPoint at its centre returns `.lp-layer-current-name` "None" of the analysis trigger, and the screenshot shows it covering the menu's "Terrain" header row.
- Analysis panel open: `.lp-analysis-dock`, heading "Analysis overlays", toggles Roughness, PSR mask, Earth visibility, P(traversable), Slope σ (ours), Elevation σ (NASA)… each with a description and an indented caveat; the panel overlaps the map key at the bottom and is clipped by the map frame.
- View modes: canvas `image-rendering: pixelated` in Traverse (and Cost per code). Surface = grey hillshade; Slope = magma (purple to cream, crater rims bright); Aspect = full-saturation HSV wheel; Thermal = blue/white/red coolwarm with saturated blue PSR blobs; Shadow = grey ramp, dark craters; Cost = viridis with black (no-data/impassable) blobs; Traverse = green with crimson impassable blobs.

#### 3-D, drawer, assistant, report, toast, bands (raw)
- 3-D first person (ANALYZE, after route): WebGL canvas bitmap 1041x808 for 992x770 CSS (DPR 1.05). Camera pill top-centre "First person" (active) / "Orbit". A large semi-transparent GREEN wedge (LiDAR fan) fills the upper middle of the frame; orange rock labels "ROCK 21.0 m" etc. with orange boxes; cyan dot grid on the ground; "LIDAR PERCEPTION / FIRST RETURN · 16 CH · 5 HZ / LIVE" card bottom-left (RANGE 60 m, RETURNS, ROCK HITS, OCCUPIES, NEAREST, "LOW → HIGH (dist.)", "11 rocks tracked", "16 observed · FOLLOW") which covers the left half of the map key; "Photographic Overlay (LROC NAC, 1 m/px)" checkbox is CHECKED by default with caption "2010 solstice acquisition. Native shadows are fixed to acquisition epoch."; the Solar Ephemeris slider is hidden while the overlay is on. The rover body is not visible in first person.
- 3-D orbit: terrain block floating on a starfield, route a thin teal line, a green "ROCK 55.3 m" label at the rover/start position covering the rover. Overlay off: terrain shows synthetic dark/light patches, "Solar Ephemeris · Day 1.0" slider appears under the checkbox. Mouse-wheel zoom works in orbit. Rover heading and wheel spin could not be judged (label covers the rover; frame rate throttled to 1-8 fps).
- GLB check: resource timing buffer was already full (Vite dev modules), and network tracking started after the 3-D scene loaded; no .glb request was observed. #17 not settled in the browser.
- Systems drawer ANALYZE: `.lp-systems-drawer.is-open` x780 y0 w820 h1000, bg rgba(8,11,18,.96), backdrop-filter none. 11 panels in order: ROS 2 Integration, Layer Provenance, PSR validation, Safe haven, Earth visibility, Survival & dwell, Thermal envelope, Illumination corridor, Reality Check, Corridor, Pose Loop. "Show on map" checkboxes (labels) exist on Safe haven, Survival & dwell, Illumination corridor. Opening the drawer alone draws the Corridor overlay on the map (thick cyan ribbon + blue #4a8fd8 points along the route, visible through the backdrop).
- Systems drawer PLAN: 13 panels: ROS 2 Integration, Layer Provenance, Replan Triggers, Advanced Constraints, PSR validation, Safe haven, Earth visibility, Survival & dwell, Thermal envelope, Illumination corridor, Reality Check, Corridor, Pose Loop. Route row in the PLAN sequence reads "LOCKED" when a route exists.
- M12: with the drawer open the 500x500 canvas had 143 pixels within tolerance of #4a8fd8 and 1846 cyan-ish pixels; Safe haven "Show on map" checked; after closing the drawer (✕): 0 blue pixels and 1088 cyan-ish (the corridor ribbon and points vanished). Reopening the drawer: Safe haven checkbox back to unchecked.
- Assistant (opened from launcher `.chat-launcher` x1538 y898 46x46, aria-label "Open Analiz Asistanı (Turkish-language assistant)"): `.chat-window.is-open` x1190 y304 w394 h640, overlapping the map's right third and the map key. Content: "LunaPath / Analiz Asistanı TR / + Yeni sohbet / Nasıl anlatayım? · seçim bekleniyor / Basit | Mühendislik | Teknik / Bu görev hakkında ne öğrenmek istiyorsun? / Mevcut rotayı, seçili arazi noktasını ve görev profillerini deterministik LunaPath analizleri üzerinden açıklayabilirim. / Rotayı özetle / Enerji ve bataryayı açıkla / Riskleri açıkla / Hedef hücreyi analiz et / Görev profillerini karşılaştır / Profil karşılaştırmaları yaklaşık 20 saniye sürebilir. / Soru göndermeden önce bir anlatım seviyesi seç. / Gönder / Enter gönder · Shift+Enter yeni satır". Close control is "Analiz Asistanını küçült" (minimise). Nothing was sent.
- Mission report (EN): `.lp-report-modal` x210 y24 w1180 h952. Header "Mission report / Route complete / LPR-1 (Default) drove 2.31 km over 385 waypoints." Rover/Region "2.5 × 2.5 km · 5 m/px"/Report "2026-11-14 11:29 UTC". Buttons EN | TR, Save as PDF, Download data, Back to map (has initial focus ring). Verdict "GO / Route is safe as planned." Decision summary "No driving constraint was violated." tiles Distance 2.31 km, Duration 3.7 h, End battery 88.2%, Lowest battery 88.2%, Energy used 1,237 Wh, Max slope 13.1°, Recharges 0, Route nodes 385; Battery profile chart (MIN 88.2%, RESERVE 30%), Slope distribution, Risk distribution "LOW 100.0%", Thermal envelope "-147°C … -30°C", Shadow exposure "3.68 / 50.0 h". TR: "Görev raporu / Rota tamamlandı / … 385 ara noktada 2,31 km sürdü", numbers with comma decimals and "%88,2" prefix percent, "Asistana sor" (the EN version shows "Ask the assistant" + "TR" chip), "LOW" stays English. Language choice persists in localStorage key `lunapath.report.lang` (reset to EN afterwards).
- Toast: appears only after "Generate Route" returns HTTP 422 (start 164,306), NOT on the map click (the click on a non-traversable cell is accepted silently and the S marker is placed). `.toast-card.toast-card--warning` x1218 y695 w360 h227 (covers the assistant launcher and the right end of the map key); bg rgba(14,15,24,.94), border 0.95px solid rgba(214,151,112,.28), padding 14 14 14 16, radius 2px, Archivo 16px. `.toast-title` (STRONG) Archivo 16px/600 rgb(255,164,141), inline. `.toast-body` has no own styling (block, Archivo 16px, line-height 24px, inherited). `.toast-action` is an unstyled native button: bg rgb(240,240,240), text rgb(0,0,0), border 1.905px outset rgb(0,0,0), padding 0, radius 0, Archivo 16px (font inherited from a reset) -> renders as a light-grey OS-style button "Show traversable cells". `.toast-dismiss` "✕" aria-label "Dismiss notification". Detail text in mono: "start (164, 306) is not traversable for LPR-1 (Default) (slope limit or extreme thermal)." Lifetime measured 5277 ms.
- `.lp-status-right` (plan, empty): Archivo 16px, block, no padding: inherits defaults.
- Bands (cockpit ANALYZE): 1240 -> grid "656.012px 583.988px", canvas 632x770 (now taller than wide: aspect 0.82), status bar client 656 / scroll 684, Pause button at x=-527 (off-screen). 980 -> grid "980px", rows "0px 948.006px 0px", center-stage y52 h500 and right rail y52 h948: the rail is painted OVER the map (tab bar on the map's top, rail text over the time-axis dock); canvas 948x312. 640 -> same overlap; topbar left group 64 px wide, brand overflows to x126, `.lp-mode-switch` squeezed to 2 px wide (PLAN/ANALYZE invisible), "Mission Report" button (x100 w98, wraps to 2 lines) sits on top of the brand; map key loses the RISK part.
- Console (new tab, from 14:23): only one warning, THREE.WebGLProgram "warning X4122: sum of 0.996094 and -2.98545e-017 cannot be represented accurately in double precision" (ANGLE/D3D shader compiler). No errors captured. The first tab's console was lost with its group.

## 8. Not rendered: dead code and unused assets

Present in the reference build, never on screen. A rebuild omits them.

### 8.1 Unused keyframes

- `lp-pulse` (frontend/src/App.css:4290)
- `lpSlideInLeft` (frontend/src/App.css:4306)
- `lpPulseBorderStart` (frontend/src/App.css:4317)
- `lpPulseBorderGoal` (frontend/src/App.css:4328)

### 8.2 Registered but never shown

- `mission-snapshot`: slot leftRail, modes (none) (frontend/src/features/registry.ts:156)
- `LunaPathRouteMark` component: never imported (`frontend/src/components/LunaPathRouteMark.tsx`).
- SpaceBackdrop `feature` stage: defined, never passed by the app.

### 8.3 Unused assets

- `frontend/public/fonts/README.md` (3079 bytes), byte-identical to ``
- `frontend/public/models/space-exploration-vehicle.glb` (22431576 bytes), byte-identical to ``
- `frontend/public/models/yutu-rover.glb` (21686960 bytes), byte-identical to ``
- `frontend/public/rovers/luvm_m.jpg` (950987 bytes), byte-identical to `frontend/public/rovers/luvmi_m.jpg`
- `frontend/public/rovers/viper.jpg` (1005798 bytes), byte-identical to `frontend/public/rovers/nasa_viper.jpg`
- `frontend/public/rovers/yutu_2.jpg` (953095 bytes), byte-identical to `frontend/public/rovers/cnsa_yutu_2.jpg`
- `frontend/public/textures/NAC_SITE11_PROVENANCE.md` (3672 bytes), byte-identical to ``
- `frontend/public/textures/moon-lroc-wac-global-1024.jpg` (151314 bytes), byte-identical to ``
- `frontend/public/textures/rover_cockpit_overlay.png` (928707 bytes), byte-identical to ``
- `frontend/public/videos/README.md` (2927 bytes), byte-identical to ``
- `frontend/public/cesium/`: 372 files, 6682446 bytes, Cesium static build output, not hashed per file. No frontend source references /cesium/; nothing in the current UI loads it.

### 8.4 CSS classes defined but never referenced from script

123 classes. Classes that may be built at run time from template strings are excluded.

`alert-card`, `avatar-tile`, `battery-card`, `battery-copy`, `battery-progress`, `battery-ring`, `battery-track`, `brand-lockup`, `brand-mark`, `card-head`, `card-meta`, `cinematic-cta`, `cinematic-frame`, `cinematic-screen`, `coord-card`, `coord-chip`, `coord-chip-grid`, `coord-label`, `coord-readout`, `coord-value`, `footer-copy`, `footer-live`, `ghost-btn`, `left-actions`, `lp-active-pill`, `lp-agency-badge`, `lp-check-mark`, `lp-compare-violated`, `lp-dock-icon`, `lp-hud-dock-btn`, `lp-kpi-sub`, `lp-layer-item-name`, `lp-modal-backdrop`, `lp-modal-close`, `lp-modal-drawer`, `lp-modal-header`, `lp-modal-subtitle`, `lp-modal-title`, `lp-overall-risk-badge`, `lp-report-figure`, `lp-risk-legend`, `lp-rover-card-badge-row`, `lp-rover-card-name-row`, `lp-rover-desc`, `lp-rover-grid`, `lp-rover-header`, `lp-rover-id-code`, `lp-rover-name`, `lp-rover-segmented-tabs`, `lp-rover-select-card`, `lp-rover-specs-table`, `lp-rover-tab`, `lp-rs`, `lp-select-btn`, `lp-seq-info`, `lp-seq-sub`, `lp-spec-cell`, `map-canvas`, `map-mode-card`, `map-overlay-top-center`, `map-status-tag`, `map-switch`, `map-switch--dimension`, `milestone-stat`, `milestone-stats`, `panel-description`, `payload-card`, `payload-empty`, `payload-inputs`, `payload-note`, `payload-readout`, `payload-unit`, `primary-btn`, `rail-scroll`, `rail-section-header`, `risk-bar`, `risk-card`, `risk-count-card`, `risk-count-grid`, `risk-head`, `risk-state`, `route-control-actions`, `route-control-inline`, `rover-card`, `rover-card-head`, `rover-card-specs`, `rover-list`, `rover-summary-grid`, `section-note`, `signal-dot`, `slider-head`, `slider-name`, `slider-row`, `slider-stack`, `slider-value`, `status-line`, `status-line-muted`, `status-pill`, `status-pill--critical`, `status-pill--idle`, `status-pill--neutral`, `status-pill--ready`, `status-pill--safe`, `telemetry-grid`, `telemetry-header`, `telemetry-label`, `telemetry-scroll`, `telemetry-value`, `telemetry-well`, `terrain3d-canvas`, `terrain3d-controls`, `terrain3d-shell`, `toast-copy`, `topbar`, `topbar-status`, `waypoint-card`, `waypoint-detail`, `waypoint-index`, `waypoint-list`, `waypoint-main`, `waypoint-meta`, `waypoint-row`, `waypoint-status`

## A. design-export/ index and regeneration

### A.1 Files

`design-export/README.md` is the authoritative index; this table summarises it.

| Path | Content |
|---|---|
| `design-export/README.md` | Index of the folder, source commit, regeneration commands, commit warning |
| `design-export/tokens.css` | Every `:root` custom-property block verbatim, then scoped custom properties with their selectors |
| `design-export/tokens.json` | Every custom-property declaration: name, value, selector, source line, alias target, resolved literal, usage count |
| `design-export/fonts.css` | The six `@font-face` blocks verbatim, `url()` rewritten to `assets/fonts/` |
| `design-export/fonts.json` | Family, style, weight range, display, unicode-range and file per face |
| `design-export/motion.css` | Every `@keyframes` block verbatim (unused ones marked) and every `prefers-reduced-motion` block |
| `design-export/motion.json` | Keyframes with the selectors that use them, every `transition` and `animation` declaration |
| `design-export/css-inventory.json` | Media queries, z-index ladder, colour literals with use sites, font sizes, radii, shadows, every class selector with a referenced / unreferenced flag |
| `design-export/colormaps.json` | Every colour ramp (stops as written), single colours, risk colour and dash tables, battery thresholds, 3-D ramps, every hex literal in script code |
| `design-export/icons/` | 51 icons as standalone SVG files, `viewBox="0 -960 960 960"`, `fill="currentColor"` |
| `design-export/icons.json` | Icon name, path data, source line, duplicate-of |
| `design-export/registry.json` | The 33 feature registrations in order, with slot, modes, group, tab and the comment above each |
| `design-export/strings.json` | Every user-visible string with kind, language, source line and enclosing component |
| `design-export/strings-coverage-set.json` | The subset of strings the coverage check requires in this document |
| `design-export/assets-manifest.json` | Every file under the original `public/` folder: bytes, sha256, used or unused, use sites |
| `design-export/assets/` | Copies of every used asset at its original public path (fonts, rover photos, textures, 3-D models, star catalogue, UI images, backdrop video, poster) |
| `design-export/api-contract/` | Endpoint catalogue (`endpoints.json`; summarised in chapter 6), request and response types copied verbatim (`types/`), 28 recorded responses (`fixtures/`), dev proxy configuration (`vite-proxy.txt`) |
| `design-export/screens/` | Browser screenshots of the captured states at 1600 x 1000 and at the 1240, 980 and 640 px bands |
| `design-export/extract/` | The extraction scripts that produced the JSON and CSS files, and `coverage.mjs`, which checks this document against them |

### A.2 Asset paths

Assets are served from the web root at the same paths they have under `design-export/assets/`: for
example `design-export/assets/fonts/archivo-latin.woff2` is requested as `/fonts/archivo-latin.woff2`,
and `design-export/assets/videos/moon-backdrop-1080.mp4` as `/videos/moon-backdrop-1080.mp4`. A rebuild
must keep these URLs, or change every reference listed under `usedAt` in `assets-manifest.json`.

### A.3 Regeneration and checking

Run from the original repository root at commit `5aec750`:

```
node design-export/extract/run-all.mjs          # regenerate every JSON/CSS file, copy assets
node design-export/extract/coverage.mjs DESIGN.md   # check this document against the extracted data
```

`run-all.mjs` refuses to run when `HEAD` is not `5aec750` or tracked frontend files are modified, unless
`DESIGN_EXPORT_ALLOW_DRIFT=1` is set. `coverage.mjs` exits non-zero when a token, keyframe, ramp,
registry row, icon, required string or asset hash is missing or wrong.

### A.4 Version control warning

The original repository's `.gitignore` excludes `*.mp4` and `*.glb` everywhere, including under
`design-export/assets/`. Committing this folder without force-adding those files silently drops the
backdrop video and both rover models. Ship the folder as an archive, force-add the binaries, or use
Git LFS.
