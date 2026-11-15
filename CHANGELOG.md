# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
The Space Apps submission is released as `v1.0.0`.

## [Unreleased]

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
- Web interface: 3D Moon (three.js, loaded only when opened) with a 2D/3D switch on the map and a panel in Explore and Classroom; sites and candidate regions on a grey globe lit from the server's sub-solar point, with the sub-Earth point marked.
- Example payload for every endpoint and contract tests against them.
- IM-2 Athena lander 3D model built by a Blender script.
- Illustration media: pre-rendered Unreal Engine images of three kinds of lunar terrain and of the Deep Space Network ground stations, labelled as illustrations in the interface, with credits in `frontend/public/media/CREDITS.md`.
- Light theme, switched from the top bar and remembered in the browser; the dark theme stays the default and is unchanged. Text and data colours are tested for contrast (4.5:1 and 3:1).
- Project page text, README with set-up, data sources, licences and the AI use statement.
- Repository setup: licence, contribution guidelines, agent instructions, PR and issue templates, PR checks.

### Fixed

- Corrupt SPICE kernels that load without an error now report the data as unavailable instead of being used.

[Unreleased]: https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/releases/tag/v1.0.0
