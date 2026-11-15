# Project page text

Text for the NASA Space Apps 2026 project page, one section per form field (submission guide (docs/challenge/project-submission-guide.pdf), "Project page form field instructions"). The form must be filled in English.

Every number below either comes from the product's own validation run (data/validation_report.json, produced by `python backend/scripts/run_validation.py`) or from a row marked "doğrulandı" (verified) in the docs/research/dogrulama/ tables. The source is named next to each number.

Fields that are not text (demo link, final project link) are filled by the team when the links exist; they are not part of this file. The text has no tables and no links into the repository, so it can be pasted into the form as it is: files are named by their path in the repository, and every link points to a public page.

---

## Project Name

Lunar Landing Site Navigator

## High-Level Project Summary

At the lunar south pole the Sun never climbs high: in December 2026 it reaches only 6.47° above the horizon at Mons Mouton, and Earth drops out of sight for 27.7% of the month. A landing site moved a short distance, or a launch slipped by a few days, can decide whether a lander has power and a voice home. Lunar Landing Site Navigator makes that decision visible in one screen.

Pick a site and a date, and the tool shows where the Sun and Earth stand against the real terrain horizon, how long sunlight and direct-to-Earth contact last, and how much power a solar panel would collect. Up to four site and date scenarios sit side by side, so a schedule slip or a moved landing point can be judged in minutes instead of across several expert tools. On Mons Mouton it goes one step further: it finds candidate regions in NASA's slope and shadow maps, ranks them with weights the user chooses, shows every part of each score, and tells when a Deep Space Network station can see the Moon and when a relay would be needed. The same answers come alive on a 2D map, a textured 3D Moon, a 3D view of the Mons Mouton terrain and an Earth–Moon scene with the three ground stations.

It answers the challenge point by point: curated and custom sites, any date the ephemeris covers, Sun and Earth against a real terrain horizon, time to sunset and Earthset, power and communication windows, a timeline and a comparison table, and views for three audiences. Every number is computed from NASA data, every result carries a reliability label, and the engine is checked against JPL Horizons in a validation run anyone can repeat. One engine serves mission planners, teachers and the public, so the same answer can be studied in a comparison table, played in a classroom task or felt in a landing-window game.

## Detailed Project Description

### The problem

NASA's Artemis program and commercial landers of the CLPS program, such as IM-2 Athena, are aiming for the lunar south pole, where craters that never see the Sun may hold water ice. The same geometry that keeps the ice makes landing hard: the Sun skims the horizon, so the surrounding terrain can block it and cut a lander's power, and Earth can sink below the local horizon and cut the direct link. Answering "when is the Sun up here, and can we talk to Earth?" today means combining ephemeris tools, terrain maps and ground station tables by hand. Lunar Landing Site Navigator puts these answers in one place, computed from NASA data and open to anyone with a browser.

### What it does

- **Site and date:** choose one of ten catalogue sites or enter any lunar latitude and longitude, and choose any date the ephemeris covers. The catalogue holds Apollo 11; the NASA CLPS landers IM-1 Odysseus, IM-2 Athena and Blue Ghost 1; landers of other countries (Chang'e 4, Chang'e 6, Chandrayaan-3, SLIM); the commercial Hakuto-R M2 impact point; and the IM-2 target point on Mons Mouton.
- **Sun and Earth on the horizon:** a horizon strip shows both bodies as disks against the horizon profile of the site, with their azimuth and elevation.
- **Events and windows:** sunrise, sunset, earthrise and earthset are searched to the second, with a sensitivity range that shows how much each event moves when the horizon is one arcminute higher or lower. Sunlit and dark windows, Earth-visible and Earth-hidden windows, and a live countdown to the next change.
- **Power:** hourly power for four panel set-ups (flat, fixed vertical, vertical tracking, two-axis), with mean power, energy, sunlit share and longest dark period.
- **Communication:** whether Earth is above the horizon now and for how long; a "relay required" label where Earth never rises in the chosen period.
- **Earth link view:** when each Deep Space Network complex (Goldstone, Madrid, Canberra) sees the Moon, and a band over the period that marks a direct link, no station in view, or "relay needed" when Earth is below the site's horizon. A schematic shows the state at the selected moment; engineers get the station shares and assumptions, the public and classroom a short summary.
- **Eclipses:** times when Earth passes in front of the Sun as seen from the site, with the share of the Sun covered, and the drop they cause in panel power.
- **Comparison:** two to four scenarios side by side, with the best value per metric and "why" cards that change one input at a time to show which input caused a difference.
- **Map layers:** hillshade, elevation, slope and permanently shadowed regions around the south pole. The Mons Mouton layers ship with the repository at 40 m, so the map works on a fresh copy.
- **3D Moon:** the map can switch to a globe (also a panel in Explore and Classroom) that shows the catalogue sites and candidate regions, with the top three of the last recommendation marked larger. It is wrapped in NASA's CGI Moon Kit colour map (SVS 4720), lit from the Sun direction the server computes for the selected moment, and the point where Earth is overhead is marked. An "Even light" choice lights the whole globe and says that it is not the computed illumination. The globe is drawn with three.js and only loaded when a 3D view opens.
- **3D terrain:** for a site or candidate region of the Mons Mouton region, the map can show the region as a surface built from the elevation layer, with heights exaggerated three times (the factor is shown). It is coloured by hillshade, slope or permanent shadow, lit from the Sun direction at the selected site and moment, and the sites and candidate regions are marked on it.
- **Space view:** the Moon and Earth together (a map view in Plan, the "Earth and Moon" panel in Explore and Classroom). Earth sits in the direction the server gives for the selected moment and is turned with the server's Earth-fixed points, so the three Deep Space Network stations are where they really are. A line joins the site to the stations that see the Moon when the link is direct; with no station in view there is no line and a note says why; when Earth is below the site's horizon a dashed relay path appears, labelled "Illustration". The team's Athena model stands at the site. Distances and sizes are labelled "Not to scale" and the stars are decorative. Buttons move the camera to the Moon, Earth or the whole link; without WebGL the 2D link schematic stays.
- **Research scenarios:** five ready-made questions (a low Sun at Mons Mouton, Chang'e 4 beyond direct Earth view, the lunar night at Apollo 11, Athena's target and landing point, a recommended region against the target). One click loads the site, period, mast and door; each shows its question, three things to watch, the server's answers for the preset and its sources.
- **Candidate regions:** twelve 200 m regions on Mons Mouton picked from the 20 m slope and permanent shadow maps: mean slope within 12°, centre outside permanent shadow, at least 2 km apart. Each has a terrain horizon at 2 m and 10 m masts and can be used like any catalogue site. They are called candidate regions, not safe landing sites.
- **Site recommendation:** the user sets weights for sunlit time, the longest dark period, Earth in view, slope, roughness and distance to permanent shadow, a slope limit and a permanent shadow preference. The candidate regions and the catalogue sites of the region are ranked for the active period and mast; every score is shown with its components and validity labels, and sites whose steepest slope is over the limit are listed apart with the reason. A ranked site can become the scenario, or the top three can go to the comparison.
- **Three entry points on one engine:** Plan (engineers), Explore (public) and Classroom (educators) share the same site, date and time. Explore adds a landing window game with three levels (pick a landing date so that the Sun and Earth stay up long enough); Classroom adds four guided tasks (why go to a pole, craters that never see the Sun, why Earth stays in one part of the sky, what changes without air) and the past missions.
- **Light theme:** dark by default, with a light theme from the top bar; text and data colours are tested for contrast.
- **Works without the server:** in example mode the interface shows answers recorded from the live server for every catalogue site and candidate region in December 2026 (2 m mast, vertical tracking panel). Example mode does not compute anything; any other choice shows a general example with a note that it does not match the selection.
- **Trust labels:** every result carries a validity label. Results computed with a flat horizon are marked as assumed ("terrain not included"); panel profiles are marked as assumptions.
- **Illustrations:** pre-rendered images and short loops made with Unreal Engine illustrate three kinds of landing terrain (mare plain, cratered highland, mountain massif) and a deep-space antenna for each of the three Deep Space Network sites. They always carry an "Illustration" label. They are pictures, not the product's calculation: the Sun, shadows, stars and lander in them belong to each scene's own recorded moment (Sun and Earth directions from JPL DE421), not to the chosen site and moment, and the computed Sun and Earth positions are in the horizon strip. Credits are in frontend/public/media/CREDITS.md.

### How it works

A Python server does all the computation, so every view shows the same numbers; the web interface only presents them.

1. **Sun and Earth positions** come from NASA NAIF's SPICE toolkit (through SpiceyPy) with the DE440 planetary ephemeris and the Moon's high-accuracy orientation (`MOON_ME` frame). Positions are computed from the site itself, not from the Moon's centre, with light-time and stellar aberration corrections.
2. **Horizon:** for the four catalogue sites inside the south polar height maps (Mons Mouton, IM-2 Athena, IM-1 Odysseus, Chandrayaan-3) and the twelve candidate regions, a terrain horizon was precomputed from NASA LOLA height maps (PGDA product 90) by casting 720 rays out to 150 km, for panel masts of 2 m and 10 m. Elsewhere a flat horizon on a 1737.4 km sphere is used and labelled as such.
3. **Events** are found on a coarse time grid and refined by bisection with a fresh SPICE position at every step, down to one second, treating the Sun and Earth as disks.
4. **Power** is efficiency × area × 1361 W/m² scaled for the Sun's distance × the panel's angle to the Sun × the visible part of the Sun's disk (above the horizon and not covered by Earth).
5. **Ground stations and link:** the Moon's elevation at the three Deep Space Network complexes (coordinates from the DSN handbook 810-005) is found the same way as the site events. A direct link needs Earth above the site's horizon and the Moon above one station's minimum elevation (10° by default, an assumption).
6. **Candidate regions and score:** a 200 m window slides over the 20 m maps in 100 m steps; windows are ranked by their share of cells with slope within 12° outside permanent shadow. The score is the weighted mean of six measures, each scaled to 0 to 1, shown from 0 to 100; the method is in docs/design/saha-puani.md.
7. **Directions for the 3D views:** `/api/body-series` gives the sub-solar and sub-Earth points on the Moon (`MOON_ME`) and the sub-lunar and sub-solar points on the Earth (`IAU_EARTH`) over time from the same SPICE kernels. The 3D Moon and the space view take the hourly sample nearest the selected moment; the space view turns Earth so that its sub-lunar point faces the Moon and its sub-solar point faces the Sun, a change of frame rather than a model of Earth's rotation. The 3D terrain takes its light from the Sun's azimuth and elevation at the site (`/api/sky-series`). The browser does no ephemeris work of its own.
8. **No atmosphere, libration included, small changes made visible:** the Moon has no air, so no refraction correction is applied; the horizon is set by the terrain and the edge of the 1737.4 km sphere. Earth's position comes from the Moon's measured orientation (`MOON_ME`, DE440), so libration, Earth's slow wobble in the lunar sky, is part of the calculation. The "why" cards change one input at a time, and every event time carries its one-arcminute sensitivity range.
9. **Validation:** a script runs the reference tests against the live endpoints and writes a report.

The validation report (data/validation_report.json in the repository, readable version docs/validation-report.md) has 85 passing reference checks, no failures, and one approximate comparison:

- **T1:** Sun and Earth azimuth and elevation at six past landings against JPL Horizons. Result: all 15 within 0.01°; largest difference 0.0049°.
- **T2a, T2b:** Mons Mouton, December 2026: highest Sun 6.47°, Earth set 3 Dec 10:03 UTC, rise 11 Dec 04:41 UTC, set 30 Dec 11:02 UTC, Earth hidden 27.7% of the month. Result: all within 0.01°, 2 minutes and 0.5 percentage points.
- **T3:** Mean panel power per m² at Mons Mouton, December 2026, flat horizon: tracking panel 768.8 W, fixed vertical 423.4 W, flat 54.3 W. Result: all within 0.5%.
- **T4:** Horizon dip for a mast: 0.087° at 2 m, 0.194° at 10 m. Result: within 0.001°.
- **T5:** Apollo 11 site, 20 and 21 February 2027: Earth covers the Sun from 22:09 to 00:36 UTC, at most 34.3%. Result: within 2 minutes and 0.5 percentage points.
- **T6 (approximate):** Sunlit share at Mons Mouton: this product 44.98%, NASA's 18.6-year average map 46.46%. Result: reported, not scored: the map averages 18.6 years over a 120 m cell, this run one year at one point.
- **T7:** Sunrise shift for a one-arcminute horizon change: 1.98 minutes at Apollo 11, 23.1 minutes at Mons Mouton. Result: passes.
- **T8:** Sub-solar and sub-Earth points and Earth distance at four instants (2025 to 2027) against JPL Horizons. Result: all 20 pass; largest angle difference 0.0056° (limit 0.01°), largest distance difference 0.0035 km (limit 1 km).
- **T9:** Candidate regions: largest mean slope 1.19° (limit 12°), no centre in permanent shadow, closest pair 2.15 km apart (at least 2 km), regenerated from the 20 m maps with no field changed. Result: all 4 pass.
- **T10:** Sub-lunar and sub-solar points on the Earth (`IAU_EARTH`) at four instants (2025 to 2027) against JPL Horizons. Result: all 16 pass; largest longitude difference 0.091° (limit 0.1°), largest latitude difference 0.0031° (limit 0.01°).

T7 is the core of the "why small changes matter" story: the same tiny horizon change moves sunrise about twelve times more at the south pole than near the equator, because the Sun climbs so slowly there.

### What makes it different

- **It explains, not only computes.** "Why" cards change one input at a time (site, dates, mast height, panel, Earth criterion) and show which one caused a difference, and every event time carries the range it would move by if the horizon were one arcminute off. This is how the tool shows that the same small horizon change moves sunrise 23.1 minutes at Mons Mouton but 1.98 minutes at Apollo 11 (T7).
- **Power and contact together.** Sunlight, panel power, Earth in view and the Deep Space Network stations are computed for the same site, period and mast, so one view tells whether a lander can both charge and call home.
- **Candidate regions with an open score.** Regions are picked from NASA's 20 m slope and permanent shadow maps, and the user's weights rank them with every component shown; a site over the slope limit is listed apart with the reason, never hidden.
- **One engine, three doors.** Plan, Explore and Classroom share one site, date and moment: an engineer's ranking, a landing-window game and a guided classroom task all read the same computed answer.
- **Honest by design.** Every value carries a reliability label (measured, model, derived or assumed); flat horizons, panel profiles and illustrations say so on screen, and limits are written down instead of hidden.

### Built on NASA data

NASA data is the core of every answer, not decoration:

- Sun and Earth positions come from NASA NAIF's SPICE kernels (DE440 and the Moon's measured orientation).
- Terrain horizons, map layers, the 3D terrain and the candidate regions come from LOLA height, slope, hillshade and permanent shadow maps (NASA GSFC PGDA product 90).
- Ground station visibility uses the Deep Space Network antenna coordinates from NASA/JPL's DSN handbook 810-005.
- Landing site coordinates come from NASA NSSDC and the LRO Camera (LROC) site releases; the 12° slope limit comes from the Apollo lunar module report NASA TN D-6850.
- The 3D Moon wears NASA SVS's CGI Moon Kit and the Earth–Moon scene NASA's Blue Marble.
- JPL Horizons and NASA's LOLA illumination map are the references the validation run checks the results against.

### Benefits

- **For mission planners:** one screen and one shared state instead of several expert interfaces; a what-if comparison in minutes when a launch slips or a landing point moves; candidate regions ranked with weights they control.
- **For educators:** guided tasks and ready-made research questions that turn real ephemeris and terrain data into a lesson on why the poles are different.
- **For the public:** a sky view, a 3D Moon, an Earth–Moon scene and a landing-window game that show, without equations, why landing near the south pole is hard.
- **For everyone:** honest numbers, with a reliability label, a sensitivity range for event times and a source for every value, and a validation run that anyone can repeat.

### What we hope to achieve

We want a first-look tool that a mission team, a classroom or a curious visitor can open in a browser and, within a minute, understand why the south pole is hard: when the Sun and Earth are up, for how long, and what that means for power and contact. Because the engine is open, validated against JPL Horizons and built on public NASA data, it can grow with the missions it describes: new sites, new dates and new candidate regions only need data, not a new tool.

### Tools, languages and software

- **Server:** Python 3.11, FastAPI, Uvicorn, SpiceyPy (NASA NAIF SPICE), NumPy, rasterio (GDAL).
- **Web interface:** React, TypeScript, Vite; three.js for the 3D Moon, 3D terrain and space view; tests with Vitest.
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
- **The 3D views draw, they do not compute.** The 3D Moon's surface image is NASA's colour map, processed for appearance and shown for orientation only; the globe has no relief, its light comes from the server's Sun direction for the nearest hourly sample, and nothing on it casts shadows. The 3D terrain exaggerates heights three times, is drawn from at most 250 points per side and does not compute cast shadows. In the space view the Earth–Moon distance and the sizes are compressed, the stars are decorative, and the antennas, lander and relay are drawings; when the Sun, Earth and Moon are nearly in line, Earth's turn cannot be set and the stations are hidden.
- **Example mode is not a live calculation.** Without the server the interface shows recorded answers for December 2026, a 2 m mast and the vertical tracking panel; other choices fall back to general examples, and a note says so.
- **Eclipses** treat Earth as a sharp disk (no atmosphere) and the Sun as uniformly bright, so the covered share is an area ratio.
- **The terrain horizon is compared with NASA's map only approximately** (T6 above); it is not presented as validated.
- **Illustrations are not the product's calculation.** The images were rendered in Unreal Engine for one recorded moment per scene, with the Sun and Earth directions of that moment from JPL DE421; they are not computed for the chosen site and moment, and the terrain is procedural. An image shows a kind of terrain, not the ground at the chosen site, and the lander is the team's Athena model shown upright for scale, whatever happened to the mission that landed there. The 3D Moon is a globe of the whole Moon, not a view of the ground at a site.

## Use of Super Intelligence (SI)

Yes. SI tools were used as follows:

- **Code and documents:** most source code, tests and documentation were written with AI coding assistants: Claude (Anthropic) through Claude Code, one session per team member. Each task was defined in a GitHub issue with its scope and acceptance criteria. A separate Claude session coordinated the tasks and reviewed the pull requests (a few after they were merged); OpenAI Codex was used for code review on most code changes. Team members merged the pull requests by hand.
- **Research notes:** background research in `docs/research/` was drafted with AI assistance. Each claim used by the product was then checked against its source and labelled verified, partly correct, unverified or without source in the docs/research/dogrulama/ tables. Only verified values are used in the product and in this text.
- **Images:** three AI-generated concept images of rovers (Grok) appear in one research note (docs/research/rover-modelleme-ve-unreal-gecis.md) and their file names start with `grok-`. They are not part of the product or the demo.
- **Illustration media:** the surface, ground station and Earth globe images were rendered in Unreal Engine 5.8 from NASA imagery, CC0 assets and the team's own models and scripts. No image-generating AI tool was used for any of them, so they carry no AI watermark. Who prepared them and every tool and source are recorded in frontend/public/media/CREDITS.md.
- **Data:** no data was generated by AI. All positions come from SPICE, all terrain from LOLA height maps, and reference values from JPL Horizons and published sources.
- **No NASA branding:** no AI tool was used to create, use or modify NASA logos, flags or mission insignia, and the product contains none.

The repository README states the same in its "Use of AI tools" section.

## NASA Data

Entries for the form's "Link Text" and "Link Url" fields, one link per row ("Add New Link" for each). Every address is the full URL.

| Link Text | Link Url |
|---|---|
| NASA NAIF SPICE generic kernels (DE440 ephemeris, Moon orientation, leap seconds, body constants) | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/ |
| NASA GSFC PGDA Product 90: LOLA south pole height, slope, hillshade and permanent shadow maps | https://pgda.gsfc.nasa.gov/products/90 |
| NASA GSFC PGDA Product 69: LOLA south pole average visibility map | https://pgda.gsfc.nasa.gov/products/69 |
| JPL Horizons ephemeris system (reference values for validation) | https://ssd.jpl.nasa.gov/horizons/ |
| NASA/JPL DSN Telecommunications Link Design Handbook 810-005, Module 301 (ground station coordinates) | https://deepspace.jpl.nasa.gov/dsndocs/810-005/301/301P.pdf |
| NASA NSSDC Lunar Artifact and Impact Table (landing site coordinates) | https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html |
| LRO Camera (LROC): Chandrayaan-3 landing site | https://www.lroc.asu.edu/images/1314 |
| LRO Camera (LROC): IM-2 Athena landing site | https://www.lroc.asu.edu/images/1408 |
| LRO Camera (LROC): IM-2 intended landing site on Mons Mouton | https://www.lroc.asu.edu/images/1401 |
| NASA TN D-6850, Apollo Experience Report: Lunar Module Landing Gear Subsystem (12° landing slope limit) | https://ntrs.nasa.gov/citations/19720018253 |
| NASA: Deep Space Network overview (ground station cards) | https://www.nasa.gov/communicating-with-missions/dsn/ |
| NASA NTRS 20240009717: Navigation Doppler Lidar (past mission facts) | https://ntrs.nasa.gov/citations/20240009717 |
| NASA Scientific Visualization Studio: CGI Moon Kit (3D Moon surface image) | https://svs.gsfc.nasa.gov/4720 |
| NASA Earth Observatory: Blue Marble Next Generation with topography and bathymetry (Earth image) | https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry/ |
| NASA Scientific Visualization Studio: Black Marble 2016 (Earth night image in an illustration) | https://svs.gsfc.nasa.gov/30876 |
| NASA Science: Deep Space Network 70 Meter Antenna 3D Model (ground station illustrations) | https://science.nasa.gov/resource/deep-space-network-70-meter-antenna-3d-model/ |
| NASA Science 3D Resources: TDRS satellite model (Earth globe illustration) | https://science.nasa.gov/3d-resources/ |

The last three are used only in the pre-rendered illustrations, never in a calculation; details are in frontend/public/media/CREDITS.md.

What each source is used for:

- **SPICE kernels from NASA NAIF: `de440s.bsp` (planetary ephemeris DE440), `moon_pa_de440_200625.bpc` and `moon_de440_250416.tf` (Moon orientation and `MOON_ME` frame), `pck00011.tpc` (body sizes), `naif0012.tls` (leap seconds); about 45.8 MB in total**: Sun and Earth position and apparent size at every site and time; sub-solar and sub-Earth points on the Moon and the light of the 3D Moon; Earth's rotation for the ground stations and the sub-lunar and sub-solar points on the Earth. Source: <https://naif.jpl.nasa.gov/pub/naif/generic_kernels/>
- **LOLA height maps, PGDA product 90: `LDEM_80S_20MPP_ADJ` (20 m, 80° S to the pole) and `LDEM_60S_60MPP_ADJ` (60 m, 60° S to the pole)**: Terrain horizon profiles of the four south polar sites and the twelve candidate regions; elevation map layer. Source: <https://pgda.gsfc.nasa.gov/products/90>
- **PGDA product 90 derived maps: hillshade (`LDEM_80S_20MPP_ADJ_HILL`), slope (`LDSM_80S_20MPP_ADJ`), permanently shadowed regions (`LPSR_80S_20MPP_ADJ`)**: Map layers; candidate regions and their slope and permanent shadow values. Source: <https://pgda.gsfc.nasa.gov/products/90>
- **LOLA average visibility map `AVGVISIB_75S_120M_201608` (PGDA product 69)**: Approximate comparison of the sunlit share (T6), validation only. Source: <https://pgda.gsfc.nasa.gov/products/69>
- **JPL Horizons**: Reference values for the tests (T1, T2, T5, T8, T10, T12); never called by the running product. Source: <https://ssd.jpl.nasa.gov/horizons/>
- **NASA/JPL DSN Telecommunications Link Design Handbook 810-005, module 301, Rev. P**: Coordinates of the Goldstone (DSS 14), Madrid (DSS 63) and Canberra (DSS 43) antennas. Source: <https://deepspace.jpl.nasa.gov/dsndocs/810-005/301/301P.pdf>
- **NASA SVS 4720 "CGI Moon Kit" colour map (LROC colour mosaic, LOLA albedo at the poles)**: Surface image of the 3D Moon and the space view, for orientation only; not used in any calculation. Source: <https://svs.gsfc.nasa.gov/4720>
- **NASA Blue Marble Next Generation, April 2004, with topography and bathymetry**: Earth's surface in the space view, for orientation only. Source: <https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry/>
- **Apollo lunar module landing slope limit, 12° (TN D-6850, SP-2013-605)**: Slope limit of the candidate regions and the default limit of the score. Source: <https://ntrs.nasa.gov/citations/19720018253>; verified in docs/research/dogrulama/gorev-araclari.md, row 89
- **NASA NSSDC lunar artifact table**: Coordinates of Apollo 11, Chang'e 4, Chang'e 6, SLIM, IM-1 and Blue Ghost 1. Source: <https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html>
- **LRO Camera (LROC) site releases**: Coordinates of Chandrayaan-3, the IM-2 Athena landing point and the IM-2 target point on Mons Mouton. Source: <https://www.lroc.asu.edu/images/1314>, <https://www.lroc.asu.edu/images/1408>, <https://www.lroc.asu.edu/images/1401>

## Space Agency Partner Data and Other References

Entries for the form's "Link Text" and "Link Url" fields, one link per row ("Add New Link" for each). Every address is the full URL and opens without a login. Details of each entry follow the table.

| Link Text | Link Url |
|---|---|
| Canadian Space Agency: From Apollo to Artemis, the evolution of crewed lunar missions (Apollo 11 information card) | https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/from-apollo-to-artemis-the-evolution-of-crewed-lunar-missions.asp |
| JAXA press release, 25 January 2024: SLIM landing results (past mission facts) | https://global.jaxa.jp/press/2024/01/file/jaxa_doc01_20240125_e.pdf |
| JAXA press release, 26 August 2024: SLIM mission end (past mission facts) | https://global.jaxa.jp/press/2024/08/20240826-1_e.html |
| SpaceQ: NASA CLPS 2 and Canada (Blue Ghost 1 information card) | https://spaceq.ca/nasa-clps-2-canada-canadarm3/ |
| Firefly Aerospace: spacecraft autonomy (Blue Ghost 1 mission facts) | https://fireflyspace.com/spacecraft-autonomy/ |
| SpaceNews: IM-2 lunar lander mission ends (past mission facts) | https://spacenews.com/im-2-lunar-lander-mission-ends/ |
| SpacePolicyOnline: Hardware Failure Doomed ispace's Mission 2 (Hakuto-R M2 impact point from LRO) | https://spacepolicyonline.com/news/hardware-failure-doomed-ispaces-mission-2/ |
| Durga Prasad et al. 2023, MNRAS Letters 526, L116 (Chandrayaan-3 landing site terrain) | https://academic.oup.com/mnrasl/article/526/1/L116/7236874 |
| Wikipedia: Mons Mouton (terrain type of the IM-2 target) | https://en.wikipedia.org/wiki/Mons_Mouton |
| Intuitive Machines: Nova-C lander page, archived 4 March 2025 (proportions of the Athena model) | https://web.archive.org/web/20250304174546/https://www.intuitivemachines.com/nova-c |
| Poly Haven: CC0 textures and models (illustration scenes) | https://polyhaven.com |
| SpiceyPy (SPICE in Python, MIT) | https://github.com/AndrewAnnex/SpiceyPy |
| FastAPI (MIT) | https://fastapi.tiangolo.com |
| Pydantic (MIT) | https://docs.pydantic.dev |
| Uvicorn (BSD-3-Clause) | https://github.com/encode/uvicorn |
| Starlette (BSD-3-Clause) | https://github.com/encode/starlette |
| NumPy (BSD-3-Clause) | https://numpy.org |
| rasterio (BSD) | https://rasterio.readthedocs.io |
| GDAL (MIT, used through rasterio) | https://gdal.org |
| pytest (MIT) | https://pytest.org |
| React (MIT) | https://react.dev |
| Vite (MIT) | https://vite.dev |
| Vitest (MIT) | https://vitest.dev |
| three.js (MIT) | https://threejs.org |
| TypeScript (Apache-2.0) | https://www.typescriptlang.org |
| Unreal Engine 5.8 (offline renders of the illustrations) | https://www.unrealengine.com |
| Blender (Athena lander model) | https://www.blender.org |
| FFmpeg (illustration loops) | https://ffmpeg.org |
| SciPy (illustration terrain scripts) | https://scipy.org |
| Pillow (illustration texture scripts) | https://python-pillow.org |
| Skyfield with JPL DE421 (Sun and Earth directions in the illustrations) | https://rhodesmill.org/skyfield/ |
| Claude Code by Anthropic (AI coding assistant; see Use of SI) | https://www.anthropic.com/claude-code |
| OpenAI Codex (AI code review; see Use of SI) | https://openai.com/codex/ |


- **CSA (Canadian Space Agency):** information cards on Canada's part in lunar exploration, from Apollo to Artemis, shown on the Apollo 11 and Blue Ghost 1 sites (CSA pages listed in docs/design/csa-bilgi-kartlari.md).
- **Mission facts** for the past-mission cases (landing times, outcomes) come from the agencies' and operators' own publications; each fact carries its source in data/reference_missions.json.
- **Site coordinates outside NASA sources:** the Hakuto-R M2 impact point comes from the LRO crash-site location as reported by SpacePolicyOnline (June 2025); its entry in data/sites.json names that source.
- **Software (open source):**

  - SpiceyPy: MIT
  - FastAPI: MIT
  - Pydantic: MIT
  - Uvicorn: BSD-3-Clause
  - Starlette: BSD-3-Clause
  - NumPy: BSD-3-Clause (bundled parts: 0BSD, MIT, Zlib, CC0-1.0)
  - rasterio: BSD
  - React, Vite, Vitest: MIT
  - three.js: MIT
  - TypeScript: Apache-2.0

- **Interface design:** the layout and visual tokens come from the team's own reference design export (`frontend-migrate/`).
- **3D model:** the Athena lander model was built from scratch by a Blender script; its proportions come from Intuitive Machines' published Nova-C dimensions and photos (sources in shipmodel/README.md). No logos, flags or agency marks are on it.
- **Illustration media:** the images and short loops in `frontend/public/media/` (Moon surface scenes, ground stations, Earth globe) are offline Unreal Engine renders, shown in the interface as labelled illustrations. The lander in the surface scenes is the team's own Athena model (above; no third-party parts). Who prepared each image group, the other tools used, and the source and licence of every texture and model are kept in one place, frontend/public/media/CREDITS.md, and listed below. The images carry no NASA logo, flag or insignia.
- **Third-party assets in the illustrations:**
  - Poly Haven (<https://polyhaven.com>, CC0, credited although no attribution is required), Moon surface scenes: the "Moon" collection regolith textures (photography Greg Zaal, Rico Cilliers, Jenelle van Heerden; processing Dario Barresi) and the rocks `moon_rock_01` to `moon_rock_07` (Greg Zaal, Rico Cilliers, Jenelle van Heerden, Dario Barresi).
  - Poly Haven (CC0), ground station scenes: ground textures `dry_ground_rocks`, `aerial_grass_rock` and `grass_path_3` (Rob Tuytel); plant and rock models `wild_rooibos_bush`, `searsia_lucida`, `searsia_burchellii`, `namaqualand_boulder_02`, `namaqualand_boulder_05`, `namaqualand_boulder_06`, `namaqualand_rocks_01`, `stone_01`, `island_tree_01`, `island_tree_02`, `jacaranda_tree`, `pine_sapling_small`, `shrub_02`, `grass_medium_02`, `grass_bermuda_01`, `rock_07` and `boulder_01` (James Ray Cock, Jenelle van Heerden, Greg Zaal, Rico Cilliers, Rob Tuytel, Dario Barresi).
  - NASA models and imagery in the illustrations: the Deep Space Network 70 m antenna model (NASA VTAD), the TDRS-A model (NASA 3D Resources), Blue Marble Next Generation, Black Marble 2016 and the CGI Moon Kit (see NASA Data). NASA content is used under NASA's "Images and Media" guidelines (<https://www.nasa.gov/nasa-brand-center/images-and-media/>); no NASA endorsement is implied.
- **Tools used to make the illustrations:** Unreal Engine 5.8 (offline renders only), Blender (the Athena model), ffmpeg (loops), and the team's Python scripts with NumPy, SciPy and Pillow; skyfield with JPL's DE421 ephemeris set the Sun and Earth directions of each scene's one recorded moment. The procedural terrain, the generated textures, the scripts and the Athena model are the team's own work.
