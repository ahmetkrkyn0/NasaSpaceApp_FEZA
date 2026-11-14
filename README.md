<div align="center">

# Lunar Landing Site Navigator

**Compare Moon landing sites and dates at a glance: where the Sun and Earth sit above the horizon, how long the power and direct-to-Earth communication windows last.**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![PR Checks](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/actions/workflows/pr-checks.yml)
![Status](https://img.shields.io/badge/status-in%20development-orange)

[Overview](#overview) · [Getting Started](#getting-started) · [Usage](#usage) · [Architecture](#architecture) · [Contributing](#contributing)

</div>

---

> [!NOTE]
> Parts of this README are still placeholders. Replace every `TODO` once the stack and scope are fixed.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running Locally](#running-locally)
- [Usage](#usage)
- [Testing](#testing)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Team](#team)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Overview

Planning a landing near the lunar south pole means juggling extreme lighting and communication conditions. Small changes in location or date can decide whether solar panels get enough sunlight and whether the lander can talk to Earth directly. Existing tools (Quickmap, Moon Trek, JPL Horizons) are built for detailed analysis and are hard to use for quick what-if comparisons.

This project turns ephemeris and terrain data into a simple tool for mission planners, educators, and the public: pick sites and dates, see Sun and Earth positions relative to the horizon, and compare power and communication windows side by side.

Built by team **FEZA** for the [NASA Space Apps Challenge](https://www.spaceappschallenge.org/) 2026. The challenge text is in [docs/challenge/lunar-landing-site-navigator.md](docs/challenge/lunar-landing-site-navigator.md), data sources in [docs/challenge/resources.md](docs/challenge/resources.md).

<!-- Screenshot or demo GIF: ![Demo](docs/assets/demo.gif) -->

## Features

- [ ] Choose a site from a curated list (Apollo, CLPS targets, other programs) or enter custom coordinates
- [ ] Pick landing date and time, step through lunar days
- [ ] Show Sun and Earth position relative to the local horizon
- [ ] Solar elevation, sunlight duration, time to sunset / Earthset
- [ ] Side-by-side comparison of several site-date scenarios
- [ ] TODO: 2D / 3D terrain view, timeline animation

## Tech Stack

| Layer          | Technology |
| -------------- | ---------- |
| Frontend       | TODO       |
| Backend        | TODO       |
| Data / Ephemeris | TODO (e.g. JPL Horizons, SPICE, LOLA DEM) |
| Mobile         | TODO       |
| Infrastructure | TODO       |

## Getting Started

### Prerequisites

- TODO: runtime / SDK and version
- TODO: package manager
- Git

### Installation

```bash
git clone https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA.git
cd NasaSpaceApp_FEZA
# TODO: install dependencies
```

### Configuration

Copy the example environment file and fill in the values:

```bash
cp .env.example .env
```

| Variable   | Description | Required | Default |
| ---------- | ----------- | -------- | ------- |
| `TODO_VAR` | TODO        | Yes      | –       |

> [!WARNING]
> Never commit `.env` or any secret. It is ignored by `.gitignore`.

### Running Locally

```bash
# TODO: command to start the app
```

## Usage

TODO: Show the main use cases with screenshots.

## Testing

```bash
# TODO: command to run tests
```

## Architecture

TODO: High-level description of components and how they interact. Design notes and decisions live in [`docs/`](docs/).

```mermaid
flowchart LR
    User --> Client[TODO: Web / Mobile client]
    Client --> API[TODO: API]
    API --> Eph[TODO: Ephemeris + terrain data]
```

## Project Structure

```text
.
├── .github/          # CI workflow, PR/issue templates, CODEOWNERS
├── docs/             # Design notes, decisions (ADR), assets
│   ├── challenge/    # Challenge statement, resources, judging and submission guides
│   └── research/     # Background research notes
├── TODO              # source code folders
├── AGENTS.md         # Rules for AI coding agents
├── CHANGELOG.md
├── CLAUDE.md
├── CONTRIBUTING.md
├── LICENSE
├── NOTICE
└── README.md
```

## Roadmap

| Milestone | Goal | Status |
| --------- | ---- | ------ |
| M1 | Data pipeline: Sun/Earth position for one site and date | Planned |
| M2 | UI: site + date picker, horizon view, key metrics | Planned |
| M3 | Comparison, timeline, polish, demo video | Planned |

## Contributing

All changes reach `main` through a pull request that is squash merged.

- Branches: `<type>/<short-name>` (e.g. `feat/sun-elevation`)
- PR titles: [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat(api): add sun position endpoint`)

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.

## Team

| Name | Role | GitHub |
| ---- | ---- | ------ |
| TODO | TODO | [@ahmetkrkyn0](https://github.com/ahmetkrkyn0) |
| TODO | TODO | [@tunadeniz1304](https://github.com/tunadeniz1304) |
| TODO | TODO | [@goktugtabak](https://github.com/goktugtabak) |
| TODO | TODO | [@OgzhnTarhn](https://github.com/OgzhnTarhn) |
| TODO | TODO | TODO |

## License

Distributed under the Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

## Acknowledgements

- NASA Space Apps Challenge and the data providers listed in [docs/challenge/resources.md](docs/challenge/resources.md)
- TODO: libraries, resources, or people to credit
