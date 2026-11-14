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
- Validation run against the reference tests, with a report (`backend/scripts/run_validation.py`, `/api/validation`).
- Web interface (React, TypeScript, Vite): scenario set-up, horizon strip, timeline with playback, countdown, map, power, comms and comparison panels; Plan, Explore and Classroom entry points; "why" cards with one-input counterfactuals; event markers for eclipses.
- Example payload for every endpoint and contract tests against them.
- IM-2 Athena lander 3D model built by a Blender script.
- Project page text, README with set-up, data sources, licences and the AI use statement.
- Repository setup: licence, contribution guidelines, agent instructions, PR and issue templates, PR checks.

### Fixed

- Corrupt SPICE kernels that load without an error now report the data as unavailable instead of being used.

[Unreleased]: https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/releases/tag/v1.0.0
