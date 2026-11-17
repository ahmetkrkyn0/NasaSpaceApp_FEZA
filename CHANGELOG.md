# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
The Space Apps submission is released as `v1.0.0`.

## [Unreleased]

### Fixed

- Web interface: the five severity-3 findings of the heuristic evaluation (`docs/design/HEURISTIC_EVAL_lunar-landing-site-navigator.md`). Arrow, Home and End keys move between the right-rail result tabs. The countdown no longer reads every playback step aloud. The "no scenario" prompt no longer shows a button that does nothing in Explore, Classroom and Plan PLAN mode. Recommend shows the example-data note when the recorded answer does not match the request. The landing game keeps keyboard focus on the result and on the Land button.

## [1.0.0] - 2026-11-15

First release, submitted to the NASA Space Apps Challenge 2026.

### Added

- Server (FastAPI): Sun and Earth positions from SPICE (DE440, `MOON_ME`) seen from the site, with light-time and aberration corrections (`/api/sky-series`, `/api/health`).
- Site catalogue with coordinate sources, panel profiles and past-mission records (`/api/sites`, `/api/panel-profiles`, `/api/reference-missions`).
- Rise and set events searched to one second with a one-arcminute sensitivity range, windows and summary metrics (`/api/events`), state at an instant (`/api/now`) and direct-to-Earth window (`/api/comm-window`).
- Hourly solar panel power for four panel set-ups (`/api/power`) and comparison of two to four scenarios (`/api/compare`).
- Terrain horizon profiles for the four south polar catalogue sites at 2 m and 10 m masts, from LOLA height maps (`/api/horizon`), and map layers: hillshade, elevation, slope, permanently shadowed regions (`/api/layers/{name}`).
- Relay label (`relay_status`, `relay_required`) and eclipses with the covered share of the Sun (`/api/eclipses`, also in `/api/events`); eclipses lower the panel power.
- Sub-solar and sub-Earth points on the Moon and the Earth distance over time (`/api/body-series`), checked against JPL Horizons (T8); sub-lunar and sub-solar points on the Earth (`IAU_EARTH`) in the same series, checked against JPL Horizons (T10).
- Map layers bundled at 40 m in `data/layers/`, so the map works on a clean checkout; full-resolution layers in `data/raw/layers/` are used when present.
- Candidate regions on Mons Mouton: twelve 200 m windows of the 20 m slope and permanent shadow maps, mean slope within 12°, centre outside permanent shadow, at least 2 km apart, each with a terrain horizon at 2 m and 10 m masts (`/api/candidates`, `backend/scripts/make_candidates.py`); candidate ids work as `site_id` on every site endpoint (T9).
- Site recommendation: candidate regions and catalogue sites of the region scored with user weights and a slope limit, every score with its components and eliminated sites with the reason (`/api/recommend`). The score ranks; it does not certify a landing site.
- Deep Space Network ground stations with coordinates from DSN 810-005 (`/api/ground-stations`) and direct-to-Earth link windows: `direct`, `no_station` or `relay_needed` (`/api/earth-link`).
- API smoke test over every endpoint, catalogue site and candidate region (`backend/scripts/smoke_api.py`).
- Validation run against the reference tests, with a report (`backend/scripts/run_validation.py`, `/api/validation`).
- Web interface (React, TypeScript, Vite): scenario set-up, horizon strip, timeline with playback, countdown, map, power, comms and comparison panels; Plan, Explore and Classroom entry points; "why" cards with one-input counterfactuals; event markers for eclipses.
- Web interface: site recommendation panel in the Plan door (weights, slope limit, permanent shadow preference, ranked sites with score components, "use this site" and "add top three to compare"); Earth link view with the three stations, a band of link windows over the period and a schematic of the state at the selected moment (full view in Plan, summary in Explore and Classroom); typed client and example payloads for the new endpoints.
- Web interface: 3D Moon (three.js, loaded only when opened) with a 2D/3D switch on the map and a panel in Explore and Classroom; sites and candidate regions on a globe wrapped in the NASA SVS 4720 colour map, lit from the server's sub-solar point, with the sub-Earth point marked and an "Even light" choice labelled as not the computed illumination. Picking a site no longer resets the camera.
- Web interface: 3D terrain of the Mons Mouton region from the elevation layer (heights exaggerated three times), coloured by hillshade, slope or permanent shadow, lit from the Sun direction at the site, with sites and candidate regions marked and a keyboard place list.
- Web interface: space view of the Moon and Earth (Plan map view, "Earth and Moon" panel in Explore and Classroom): Earth placed and turned from the server's points, the three DSN stations, the Athena model at the site, the link line or the relay path labelled "Illustration", camera buttons, "Not to scale"; NASA Blue Marble Earth image.
- Web interface: five research scenarios that load a site, period, mast and door, with their question, observations, recorded answers and sources; the door site picker lists candidate regions.
- Web interface: role pages at `#/start`, `#/public`, `#/educator` and `#/engineer`: a start page with three role cards and one overview page per role, showing recorded example answers for December 2026 (labelled as recorded) and linking to the matching door of the console.
- Example mode answers from recorded live server responses for every catalogue site and candidate region in December 2026 (`data/examples/recorded/`), with a note when a choice falls back to a general example.
- Example payload for every endpoint and contract tests against them.
- IM-2 Athena lander 3D model built by a Blender script.
- Illustration media: pre-rendered Unreal Engine images of three kinds of lunar terrain and of the Deep Space Network ground stations, labelled as illustrations in the interface, with credits in `frontend/public/media/CREDITS.md`.
- Opening screen background: NASA SVS 14992 "Lunar Near and Far Side Phases" animation, labelled "Illustration", dark in both themes, a still frame with reduced motion, credited in `frontend/public/media/CREDITS.md`.
- Light theme, switched from the top bar and remembered in the browser; the dark theme stays the default and is unchanged. Text and data colours are tested for contrast (4.5:1 and 3:1).
- Project page text, README with set-up, data sources, licences and the AI use statement.
- Repository setup: licence, contribution guidelines, agent instructions, PR and issue templates, PR checks.

### Removed

- AI-generated concept images without a watermark (`public/assets/grok-*.jpg`, the PDF copy of the rover modelling note) and the unused images, models and video of the design export in `frontend-migrate/design-export/assets/`; only the fonts the interface uses are kept.

### Fixed

- Corrupt SPICE kernels that load without an error now report the data as unavailable instead of being used.

[Unreleased]: https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/releases/tag/v1.0.0
