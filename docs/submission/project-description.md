# Project page text

Text for the NASA Space Apps 2026 project page, one section per form field ([submission guide](../challenge/project-submission-guide.pdf), "Project page form field instructions"). The form must be filled in English.

Every number below either comes from the product's own validation run ([`data/validation_report.json`](../../data/validation_report.json), produced by `python backend/scripts/run_validation.py`) or from a row marked "doğrulandı" (verified) in the [`docs/research/dogrulama/`](../research/dogrulama/) tables. The source is named next to each number.

Fields that are not text (demo link, final project link) are filled by the team when the links exist; they are not part of this file.

---

## Project Name

Lunar Landing Site Navigator

## High-Level Project Summary

Lunar Landing Site Navigator lets you pick a landing site and a date on the Moon and see, in one screen, where the Sun and Earth sit above the local horizon, how long sunlight and direct-to-Earth contact last, and how much power a solar panel would collect. Several site and date scenarios can be compared side by side, so a schedule slip or a moved landing point can be judged in minutes instead of by working through several expert tools. On Mons Mouton it also picks candidate regions from NASA's slope and shadow maps and ranks them with weights the user chooses, showing every part of the score, and it shows when the Deep Space Network can see the Moon and when a lander would need a relay.

It addresses the challenge directly: curated and custom sites, free choice of dates, Sun and Earth positions against a real terrain horizon at the south pole, time to sunset and Earthset, power and communication windows, a timeline and a comparison table. It matters because near the lunar south pole the Sun stays close to the horizon, so a small change in place or date can decide whether a mission has power and a link to Earth. The tool makes that sensitivity visible and explains why it happens, for mission planners, educators and the public alike.

## Detailed Project Description

### What it does

- **Site and date:** choose one of ten catalogue sites (past landings such as Apollo 11, Chang'e 4, Chandrayaan-3, SLIM, IM-1 and IM-2, and the IM-2 target on Mons Mouton) or enter any lunar latitude and longitude; choose any date the ephemeris covers.
- **Sun and Earth on the horizon:** a horizon strip shows both bodies as disks against the horizon profile of the site, with their azimuth and elevation.
- **Events and windows:** sunrise, sunset, earthrise and earthset are searched to the second, with a sensitivity range that shows how much each event moves when the horizon is one arcminute higher or lower. Sunlit and dark windows, Earth-visible and Earth-hidden windows, and a live countdown to the next change.
- **Power:** hourly power for four panel set-ups (flat, fixed vertical, vertical tracking, two-axis), with mean power, energy, sunlit share and longest dark period.
- **Communication:** whether Earth is above the horizon now and for how long; a "relay required" label where Earth never rises in the chosen period.
- **Earth link view:** when each Deep Space Network complex (Goldstone, Madrid, Canberra) sees the Moon, and a band over the period that marks a direct link, no station in view, or "relay needed" when Earth is below the site's horizon. A schematic shows the state at the selected moment; engineers get the station shares and assumptions, the public and classroom a short summary.
- **Eclipses:** times when Earth passes in front of the Sun as seen from the site, with the share of the Sun covered, and the drop they cause in panel power.
- **Comparison:** two to four scenarios side by side, with the best value per metric and "why" cards that change one input at a time to show which input caused a difference.
- **Map layers:** hillshade, elevation, slope and permanently shadowed regions around the south pole. The Mons Mouton layers ship with the repository at 40 m, so the map works on a fresh copy.
- **3D Moon:** the map can switch to a globe (also a panel in Explore and Classroom) that shows the catalogue sites and candidate regions, with the top three of the last recommendation marked larger. It is lit from the Sun direction the server computes for the selected moment, and the point where Earth is overhead is marked. The globe is drawn with three.js and only loaded when the 3D view opens.
- **Candidate regions:** twelve 200 m regions on Mons Mouton picked from the 20 m slope and permanent shadow maps: mean slope within 12°, centre outside permanent shadow, at least 2 km apart. Each has a terrain horizon at 2 m and 10 m masts and can be used like any catalogue site. They are called candidate regions, not safe landing sites.
- **Site recommendation:** the user sets weights for sunlit time, the longest dark period, Earth in view, slope, roughness and distance to permanent shadow, a slope limit and a permanent shadow preference. The candidate regions and the catalogue sites of the region are ranked for the active period and mast; every score is shown with its components and validity labels, and sites whose steepest slope is over the limit are listed apart with the reason. A ranked site can become the scenario, or the top three can go to the comparison.
- **Three entry points on one engine:** Plan (engineers), Explore (public) and Classroom (educators) share the same site, date and time.
- **Trust labels:** every result carries a validity label. Results computed with a flat horizon are marked as assumed ("terrain not included"); panel profiles are marked as assumptions.
- **Illustrations:** pre-rendered images and short loops made with Unreal Engine illustrate three kinds of landing terrain (mare plain, cratered highland, mountain massif) and a deep-space antenna for each of the three Deep Space Network sites. They always carry an "Illustration" label. They are pictures, not the product's calculation: the Sun, shadows, stars and lander in them belong to each scene's own recorded moment (Sun and Earth directions from JPL DE421), not to the chosen site and moment, and the computed Sun and Earth positions are in the horizon strip. Credits are in [`frontend/public/media/CREDITS.md`](../../frontend/public/media/CREDITS.md).

### How it works

A Python server does all the computation; the web interface only shows the server's numbers.

1. **Sun and Earth positions** come from NASA NAIF's SPICE toolkit (through SpiceyPy) with the DE440 planetary ephemeris and the Moon's high-accuracy orientation (`MOON_ME` frame). Positions are computed from the site itself, not from the Moon's centre, with light-time and stellar aberration corrections.
2. **Horizon:** for the four catalogue sites inside the south polar height maps (Mons Mouton, IM-2 Athena, IM-1 Odysseus, Chandrayaan-3) and the twelve candidate regions, a terrain horizon was precomputed from NASA LOLA height maps (PGDA product 90) by casting 720 rays out to 150 km, for panel masts of 2 m and 10 m. Elsewhere a flat horizon on a 1737.4 km sphere is used and labelled as such.
3. **Events** are found on a coarse time grid and refined by bisection with a fresh SPICE position at every step, down to one second, treating the Sun and Earth as disks.
4. **Power** is efficiency × area × 1361 W/m² scaled for the Sun's distance × the panel's angle to the Sun × the visible part of the Sun's disk (above the horizon and not covered by Earth).
5. **Ground stations and link:** the Moon's elevation at the three Deep Space Network complexes (coordinates from the DSN handbook 810-005) is found the same way as the site events. A direct link needs Earth above the site's horizon and the Moon above one station's minimum elevation (10° by default, an assumption).
6. **Candidate regions and score:** a 200 m window slides over the 20 m maps in 100 m steps; windows are ranked by their share of cells with slope within 12° outside permanent shadow. The score is the weighted mean of six measures, each scaled to 0 to 1, shown from 0 to 100; the method is in [saha-puani.md](../design/saha-puani.md).
7. **Sun direction for the globe:** `/api/body-series` gives the sub-solar and sub-Earth points on the Moon (`MOON_ME`) and the sub-lunar and sub-solar points on the Earth (`IAU_EARTH`) over time from the same SPICE kernels; the 3D Moon takes its light from the hourly sample nearest the selected moment and does no ephemeris work of its own.
8. **Validation:** a script runs the reference tests against the live endpoints and writes a report.

The validation report ([`data/validation_report.json`](../../data/validation_report.json)) has 85 passing reference checks, no failures, and one approximate comparison ([readable report](../validation-report.md)):

| Test | What is checked | Result |
|---|---|---|
| T1 | Sun and Earth azimuth and elevation at six past landings against JPL Horizons | all 15 within 0.01°; largest difference 0.0049° |
| T2a, T2b | Mons Mouton, December 2026: highest Sun 6.47°, Earth set 3 Dec 10:03 UTC, rise 11 Dec 04:41 UTC, set 30 Dec 11:02 UTC, Earth hidden 27.7% of the month | all within 0.01°, 2 minutes and 0.5 percentage points |
| T3 | Mean panel power per m² at Mons Mouton, December 2026, flat horizon: tracking panel 768.8 W, fixed vertical 423.4 W, flat 54.3 W | all within 0.5% |
| T4 | Horizon dip for a mast: 0.087° at 2 m, 0.194° at 10 m | within 0.001° |
| T5 | Apollo 11 site, 20 and 21 February 2027: Earth covers the Sun from 22:09 to 00:36 UTC, at most 34.3% | within 2 minutes and 0.5 percentage points |
| T6 (approximate) | Sunlit share at Mons Mouton: this product 44.98%, NASA's 18.6-year average map 46.46% | reported, not scored: the map averages 18.6 years over a 120 m cell, this run one year at one point |
| T7 | Sunrise shift for a one-arcminute horizon change: 1.98 minutes at Apollo 11, 23.1 minutes at Mons Mouton | passes |
| T8 | Sub-solar and sub-Earth points and Earth distance at four instants (2025 to 2027) against JPL Horizons | all 20 pass; largest angle difference 0.0056° (limit 0.01°), largest distance difference 0.0035 km (limit 1 km) |
| T9 | Candidate regions: largest mean slope 1.19° (limit 12°), no centre in permanent shadow, closest pair 2.15 km apart (at least 2 km), regenerated from the 20 m maps with no field changed | all 4 pass |
| T10 | Sub-lunar and sub-solar points on the Earth (`IAU_EARTH`) at four instants (2025 to 2027) against JPL Horizons | all 16 pass; largest longitude difference 0.091° (limit 0.1°), largest latitude difference 0.0031° (limit 0.01°) |

T7 is the core of the "why small changes matter" story: the same tiny horizon change moves sunrise about twelve times more at the south pole than near the equator, because the Sun climbs so slowly there.

### Benefits

- One screen and one shared state instead of several expert interfaces.
- Fast what-if comparison when a launch slips or a landing point moves.
- Honest numbers: every value has a validity label, a sensitivity range for event times, and a source.
- The same engine serves an engineer's comparison table, a public sky view and classroom tasks.

### What we hope to achieve

A quick first-look tool that mission teams, students and the public can open in a browser to understand why the south pole is hard: when the Sun and Earth are up, for how long, and what that means for power and contact.

### Tools, languages and software

- **Server:** Python 3.11, FastAPI, Uvicorn, SpiceyPy (NASA NAIF SPICE), NumPy, rasterio (GDAL).
- **Web interface:** React, TypeScript, Vite; three.js for the 3D Moon; tests with Vitest.
- **Tests:** pytest for the server, Vitest for the interface, and a validation script that runs the reference tests over HTTP.
- **3D:** a model of the IM-2 Athena lander built from scratch by a Blender script (no third-party meshes or textures).
- **Illustrations:** Unreal Engine 5.8, for offline renders only; it does not run in the product, which shows the finished images and loops.
- **Collaboration:** GitHub (issues, pull requests, checks), Slack.

### Known limits

- **Terrain horizon only at four sites and the candidate regions.** The terrain horizon exists only for the catalogue sites inside the south polar height maps (Mons Mouton, IM-2 Athena, IM-1 Odysseus, Chandrayaan-3) and the twelve candidate regions on Mons Mouton, at 2 m and 10 m masts. Every other site, every custom coordinate and every other mast height uses a flat horizon and is labelled "Assumed, terrain not included".
- **Panel profiles are assumptions.** Area, efficiency and mounting are generic values, not a real spacecraft's design, and are labelled as such.
- **Accident causes are not computed.** For past missions the tool measures the environment (Sun and Earth angles, light, contact). Causes of failures are quoted only from official sources, with an evidence label.
- **Relay satellites are not modelled.** The relay label and the link view's "relay needed" only say that Earth is not in line of sight; the relay in the link schematic is a drawing labelled "Illustration".
- **The score is not a landing safety guarantee.** It ranks sites for the weights the user chose; other weights give another order. The 12° slope limit is the Apollo lunar module's landing limit (SP-2013-605); every other threshold is an assumption and is marked as one.
- **No rocks or small craters.** Candidate regions and their scores come from 20 m maps; boulders and craters smaller than a cell are not in the data.
- **Station view is simplified.** Ground station visibility is computed for the Moon's centre, not for the site, and Earth's rotation uses the `IAU_EARTH` model (no nutation, no UT1 correction); the 10° minimum station elevation is an assumption. The sub-lunar and sub-solar points on the Earth use the same model, so their longitudes can be off by up to 0.1° (T10).
- **The 3D Moon is a plain grey sphere.** It has no surface texture yet and no terrain relief; its light comes from the server's Sun direction for the nearest hourly sample, and nothing on it casts shadows.
- **Eclipses** treat Earth as a sharp disk (no atmosphere) and the Sun as uniformly bright, so the covered share is an area ratio.
- **The terrain horizon is compared with NASA's map only approximately** (T6 above); it is not presented as validated.
- **Illustrations are not the product's calculation.** The images were rendered in Unreal Engine for one recorded moment per scene, with the Sun and Earth directions of that moment from JPL DE421; they are not computed for the chosen site and moment, and the terrain is procedural. An image shows a kind of terrain, not the ground at the chosen site, and the lander is the team's Athena model shown upright for scale, whatever happened to the mission that landed there. The 3D Moon is a globe of the whole Moon, not a view of the ground at a site.

## Use of Super Intelligence (SI)

Yes. SI tools were used as follows:

- **Code and documents:** most source code, tests and documentation were written with AI coding assistants: Claude (Anthropic) through Claude Code, one session per team member. Each task was defined in a GitHub issue with its scope and acceptance criteria. A separate Claude session coordinated the tasks and reviewed the pull requests (a few after they were merged); OpenAI Codex was used for code review on most code changes. Team members merged the pull requests by hand.
- **Research notes:** background research in `docs/research/` was drafted with AI assistance. Each claim used by the product was then checked against its source and labelled verified, partly correct, unverified or without source in the [`docs/research/dogrulama/`](../research/dogrulama/) tables. Only verified values are used in the product and in this text.
- **Images:** three AI-generated concept images of rovers (Grok) appear in one research note ([rover-modelleme-ve-unreal-gecis.md](../research/rover-modelleme-ve-unreal-gecis.md)) and their file names start with `grok-`. They are not part of the product or the demo.
- **Illustration media:** the surface, ground station and Earth globe images were rendered in Unreal Engine 5.8. Who prepared them and any other tools used in making them, AI tools included, are recorded in [`frontend/public/media/CREDITS.md`](../../frontend/public/media/CREDITS.md); that credit information is being completed.
- **Data:** no data was generated by AI. All positions come from SPICE, all terrain from LOLA height maps, and reference values from JPL Horizons and published sources.
- **No NASA branding:** no AI tool was used to create, use or modify NASA logos, flags or mission insignia, and the product contains none.

The repository README states the same in its "Use of AI tools" section.

## NASA Data

| Data | What it is used for | Source |
|---|---|---|
| SPICE kernels from NASA NAIF: `de440s.bsp` (planetary ephemeris DE440), `moon_pa_de440_200625.bpc` and `moon_de440_250416.tf` (Moon orientation and `MOON_ME` frame), `pck00011.tpc` (body sizes), `naif0012.tls` (leap seconds); about 45.8 MB in total | Sun and Earth position and apparent size at every site and time; sub-solar and sub-Earth points on the Moon and the light of the 3D Moon; Earth's rotation for the ground stations and the sub-lunar and sub-solar points on the Earth | <https://naif.jpl.nasa.gov/pub/naif/generic_kernels/> |
| LOLA height maps, PGDA product 90: `LDEM_80S_20MPP_ADJ` (20 m, 80° S to the pole) and `LDEM_60S_60MPP_ADJ` (60 m, 60° S to the pole) | Terrain horizon profiles of the four south polar sites and the twelve candidate regions; elevation map layer | <https://pgda.gsfc.nasa.gov/products/90> |
| PGDA product 90 derived maps: hillshade (`LDEM_80S_20MPP_ADJ_HILL`), slope (`LDSM_80S_20MPP_ADJ`), permanently shadowed regions (`LPSR_80S_20MPP_ADJ`) | Map layers; candidate regions and their slope and permanent shadow values | <https://pgda.gsfc.nasa.gov/products/90> |
| LOLA average visibility map `AVGVISIB_75S_120M_201608` (PGDA product 69) | Approximate comparison of the sunlit share (T6), validation only | <https://pgda.gsfc.nasa.gov/products/69> |
| JPL Horizons | Reference values for the tests (T1, T2, T5, T8, T10); never called by the running product | <https://ssd.jpl.nasa.gov/horizons/> |
| NASA/JPL DSN Telecommunications Link Design Handbook 810-005, module 301, Rev. P | Coordinates of the Goldstone (DSS 14), Madrid (DSS 63) and Canberra (DSS 43) antennas | <https://deepspace.jpl.nasa.gov/dsndocs/810-005/301/301P.pdf> |
| Apollo lunar module landing slope limit, 12° (TN D-6850, SP-2013-605) | Slope limit of the candidate regions and the default limit of the score | [gorev-araclari.md, row 89](../research/dogrulama/gorev-araclari.md) |
| NASA NSSDC lunar artifact table | Coordinates of Apollo 11, Chang'e 4, Chang'e 6, SLIM, IM-1 and Blue Ghost 1 | <https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html> |
| LRO Camera (LROC) site releases | Coordinates of Chandrayaan-3, the IM-2 Athena landing point and the IM-2 target point on Mons Mouton | <https://www.lroc.asu.edu/images/1314>, <https://www.lroc.asu.edu/images/1408>, <https://www.lroc.asu.edu/images/1401> |

## Space Agency Partner Data and Other References

- **CSA (Canadian Space Agency):** information cards on Canada's part in lunar exploration, from Apollo to Artemis, shown on the Apollo 11 and Blue Ghost 1 sites (CSA pages listed in [csa-bilgi-kartlari.md](../design/csa-bilgi-kartlari.md)).
- **Mission facts** for the past-mission cases (landing times, outcomes) come from the agencies' and operators' own publications; each fact carries its source in [`data/reference_missions.json`](../../data/reference_missions.json).
- **Software (open source):**

  | Package | Licence |
  |---|---|
  | SpiceyPy | MIT |
  | FastAPI | MIT |
  | Pydantic | MIT |
  | Uvicorn | BSD-3-Clause |
  | Starlette | BSD-3-Clause |
  | NumPy | BSD-3-Clause (bundled parts: 0BSD, MIT, Zlib, CC0-1.0) |
  | rasterio | BSD |
  | React, Vite, Vitest | MIT |
  | three.js | MIT |
  | TypeScript | Apache-2.0 |

- **Interface design:** the layout and visual tokens come from the team's own reference design export (`frontend-migrate/`).
- **3D model:** the Athena lander model was built from scratch by a Blender script; its proportions come from Intuitive Machines' published Nova-C dimensions and photos (sources in [`shipmodel/README.md`](../../shipmodel/README.md)). No logos, flags or agency marks are on it.
- **Illustration media:** the images and short loops in `frontend/public/media/` (Moon surface scenes, ground stations, Earth globe) are offline Unreal Engine renders, shown in the interface as labelled illustrations. The lander in the surface scenes is the team's own Athena model (above; no third-party parts). Who prepared each image group, the other tools used, and the source and licence of every texture and model are kept in one place, [`frontend/public/media/CREDITS.md`](../../frontend/public/media/CREDITS.md); that credit information is being completed. The images carry no NASA logo, flag or insignia.
