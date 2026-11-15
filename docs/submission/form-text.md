# Project page form text

The text to paste into the NASA Space Apps 2026 project page, field by field. It is the short version of [project-description.md](project-description.md), which stays as the full reference. Every number comes from the final validation run (`data/validation_report.json`, 15 November 2026) or from the product's own recorded answers (`data/examples/recorded/`).

The text has no tables. Paths such as `data/validation_report.json` name files in the repository; link them to the repository once it is public.

## Before submitting

- Project Demonstration: the full address of the seven-slide PDF. Project: the full address of the repository. Open both in a private window, signed out.
- NASA Data: 18 rows. Space Agency Partner and Other Data: 38 rows; the first one points into the repository and works once it is public. Both lists are at the end of this file.
- Use of Super Intelligence: tick only the boxes that are true for the team. "Ideation or Brainstorming" stays ticked only if an AI tool was used to come up with ideas.
- Add at least four images to Project Details: the horizon strip, the Earth–Moon scene, the recommendation panel and the role start page. An Unreal Engine image must show the word "Illustration".
- "Save Progress" makes the page public. Paste the corrected Summary before saving.

## Project Name

Lunar Landing Site Navigator

## Summary

At the lunar south pole the Sun never climbs high: in December 2026 it reaches only 6.47° at Mons Mouton, and Earth drops out of sight for about five days at a time. A small change in landing site or date can decide whether a lander has power and a link home. Lunar Landing Site Navigator makes that visible in one screen.

Pick a site and a date to see the Sun and Earth against the horizon (the real terrain horizon at the south polar sites), how long sunlight and direct-to-Earth contact last, and how much power a solar panel collects. Compare up to four scenarios side by side, so a slipped launch or a moved landing point is judged in minutes, not across several expert tools. On Mons Mouton it finds candidate regions in NASA's slope and shadow maps, ranks them with user-chosen weights and shows every part of the score, and it tells when a Deep Space Network station can see the Moon and when a relay is needed. Answers appear on a 2D map, a textured 3D Moon, a 3D terrain view and an Earth–Moon scene.

It covers every goal of the challenge: curated and custom sites, any date, time to sunset and Earthset, power and communication windows, a timeline and a comparison. Sun and Earth positions are computed from NASA data (SPICE, LOLA) and checked against JPL Horizons; every result carries a label that says whether it is derived or assumed. One engine serves mission planners, teachers and the public.

## Project Details

### The problem

NASA's Artemis program and commercial landers of the CLPS program, such as IM-2 Athena, are aiming for the lunar south pole, where craters that never see the Sun may hold water ice. The same geometry that keeps the ice makes landing hard: the Sun skims the horizon, so the surrounding terrain can block it and cut a lander's power, and Earth can sink below the local horizon and cut the direct link. Answering "when is the Sun up here, and can we talk to Earth?" today means combining ephemeris tools, terrain maps and ground station tables by hand. Lunar Landing Site Navigator puts these answers in one place, computed from NASA data and open to anyone with a browser.

### What makes it different

- It explains, not only computes. "Why" cards change one input at a time and show which one caused a difference. The same one-arcminute change in the horizon moves sunrise 23.1 minutes at Mons Mouton but 1.98 minutes at Apollo 11, and the tool shows that range next to every event time.
- Power and contact together. Sunlight, panel power, Earth in view and the Deep Space Network stations are computed for the same site, period and mast, so one view tells whether a lander can both charge and call home.
- Candidate regions with an open score. Regions are picked from NASA's 20 m slope and permanent shadow maps, and the user's weights rank them with every part of the score shown.
- One engine, three audiences. An engineer's ranking, a landing-window game and a guided classroom task all read the same computed answer.
- Honest by design. Every value carries a label (measured, model, derived or assumed); flat horizons, panel profiles and illustrations say so on screen.

### What it does

- Site and date: ten catalogue sites (Apollo 11; the NASA CLPS landers IM-1 Odysseus, IM-2 Athena and Blue Ghost 1; Chang'e 4, Chang'e 6, Chandrayaan-3 and SLIM; the Hakuto-R M2 impact point; the IM-2 target on Mons Mouton) or any lunar latitude and longitude, on any date the ephemeris covers.
- Sun and Earth on the horizon: both bodies as disks against the site's horizon profile, a timeline that plays through the lunar day, and a countdown to the next sunset, sunrise, Earthset or Earthrise.
- Power: hourly power for four panel set-ups, with mean power, energy, sunlit share and the longest dark period; eclipses of the Sun by Earth are included.
- Communication: when Earth is above the site's horizon, when each Deep Space Network complex (Goldstone, Madrid, Canberra) can see the Moon, and when a relay would be needed.
- Comparison: two to four scenarios side by side, with the best value per measure.
- Candidate regions and recommendation: twelve 200 m regions on Mons Mouton with mean slope within 12°, their centre outside permanent shadow, and at least 2 km apart. The user sets weights and a slope limit; sites over the limit are listed apart with the reason. They are candidate regions, not safe landing sites.
- Four views: a 2D map with hillshade, elevation, slope and permanent shadow layers; a 3D Moon lit from the computed Sun direction; a 3D terrain of Mons Mouton; and an Earth–Moon scene that shows which station can hear the lander.
- Three audiences: Plan (engineers), Explore (public, with a landing-window game) and Classroom (educators, with guided tasks) share one site, date and moment. Five ready-made research questions load a full scenario in one click, and a start page offers the three roles as cards.

### How it works

A Python server does all the computation, so every view shows the same numbers; the web interface only presents them.

- Positions come from NASA NAIF's SPICE toolkit with the DE440 ephemeris and the Moon's measured orientation. They are computed from the site itself, with light-time and aberration corrections, so libration is included. The Moon has no air, so no refraction is applied.
- Horizon: for the four south polar catalogue sites and the twelve candidate regions, a terrain horizon is precomputed from NASA LOLA height maps by casting 720 rays out to 150 km, for masts of 2 m and 10 m. Elsewhere a flat horizon is used and labelled as an assumption.
- Events are found on a coarse time grid and refined to one second, treating the Sun and Earth as disks.
- Power is efficiency × area × 1361 W/m², scaled for the Sun's distance, the panel's angle to the Sun and the visible part of the Sun's disk.
- Link: the Moon's elevation at the three Deep Space Network complexes is found the same way. A direct link needs Earth above the site's horizon and the Moon at least 10° above one station (an assumption).

### Validation

A script runs reference tests against the endpoints and writes a report (`data/validation_report.json` in the repository). Final run, 15 November 2026: 113 checks pass, none fail, and one comparison is reported as approximate. No threshold was relaxed to make a test pass.

- Sun and Earth azimuth and elevation at six past landings against JPL Horizons: all 15 within 0.01°; largest difference 0.0049°.
- Sub-solar and sub-Earth points on the Moon at four instants against JPL Horizons: largest difference 0.0056° (limit 0.01°).
- Moon elevation at the three Deep Space Network stations at 19 instants against JPL Horizons: largest difference 0.071° (limit 0.1°).
- Approximate, not scored: sunlit share at Mons Mouton with our terrain horizon 44.98%, against 46.46% on NASA's 18.6-year average illumination map.

### Built on NASA data

- Sun and Earth positions: NASA NAIF SPICE kernels (DE440 and the Moon's measured orientation).
- Terrain horizons, map layers, the 3D terrain and the candidate regions: LOLA height, slope, hillshade and permanent shadow maps (NASA GSFC PGDA product 90).
- Ground stations: Deep Space Network antenna coordinates from NASA/JPL's DSN handbook 810-005.
- Landing site coordinates: NASA NSSDC and the LRO Camera (LROC) site releases. The 12° slope limit: the Apollo lunar module report NASA TN D-6850.
- Surface images: NASA SVS's CGI Moon Kit on the 3D Moon, NASA's Blue Marble on the Earth, and a NASA SVS animation behind the opening screen.
- References for the validation run: JPL Horizons and NASA's LOLA illumination map.

### Benefits

- For mission planners: one screen instead of several expert interfaces; a what-if comparison in minutes when a launch slips or a landing point moves; candidate regions ranked with weights they control.
- For educators: guided tasks and ready-made research questions that turn real ephemeris and terrain data into a lesson on why the poles are different.
- For the public: a sky view, a 3D Moon, an Earth–Moon scene and a landing-window game that show, without equations, why landing near the south pole is hard.

We want a first-look tool that a mission team, a classroom or a curious visitor can open in a browser and, within a minute, understand why the south pole is hard. Because the engine is open, checked against JPL Horizons and built on public NASA data, new sites, dates and candidate regions only need data, not a new tool.

### Tools

Server: Python 3.11, FastAPI, SpiceyPy (NASA NAIF SPICE), NumPy, rasterio. Web interface: React, TypeScript, Vite and three.js. Tests: pytest and Vitest, plus the validation script. The IM-2 Athena lander model was built from scratch with a Blender script. The illustrations are offline Unreal Engine renders made by a team member; Unreal does not run in the product. The interface's colour and size tokens, motion styles and icon set come from LunaPath, an earlier interface by the same team member.

### Known limits

- The terrain horizon exists only for four south polar catalogue sites and the twelve candidate regions, at 2 m and 10 m masts. Every other site and every custom coordinate uses a flat horizon, labelled "Assumed, terrain not included".
- Panel profiles are generic assumptions, not a real spacecraft's design.
- Relay satellites are not modelled. "Relay needed" only says that Earth is not in line of sight.
- The score ranks sites for the weights the user chose. It is not a landing safety guarantee, and the 20 m maps do not show rocks or small craters.
- Illustrations are pictures, not the product's calculation, and are labelled "Illustration" on screen.

The full list of limits is in the repository README.

### Use of AI tools

Most source code, tests and documentation were written with AI coding assistants (Claude through Claude Code), and OpenAI Codex was used for code review. Each task was defined in a GitHub issue, reviewed in a pull request (a few after merging) and merged by a team member. Background research was drafted with AI assistance, and each claim the product uses was then checked against its source. No data was generated by AI, and the product and the demo contain no AI-generated image or audio.

## NASA Data

One row per line: Link Text, then Link Url.

- NASA NAIF SPICE generic kernels (DE440 ephemeris, Moon orientation, leap seconds, body constants): https://naif.jpl.nasa.gov/pub/naif/generic_kernels/
- NASA GSFC PGDA Product 90: LOLA south pole height, slope, hillshade and permanent shadow maps: https://pgda.gsfc.nasa.gov/products/90
- NASA GSFC PGDA Product 69: LOLA south pole average visibility map: https://pgda.gsfc.nasa.gov/products/69
- JPL Horizons ephemeris system (reference values for validation): https://ssd.jpl.nasa.gov/horizons/
- NASA/JPL DSN Telecommunications Link Design Handbook 810-005, Module 301 (ground station coordinates): https://deepspace.jpl.nasa.gov/dsndocs/810-005/301/301P.pdf
- NASA NSSDC Lunar Artifact and Impact Table (landing site coordinates): https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html
- LRO Camera (LROC): Chandrayaan-3 landing site: https://www.lroc.asu.edu/images/1314
- LRO Camera (LROC): IM-2 Athena landing site: https://www.lroc.asu.edu/images/1408
- LRO Camera (LROC): IM-2 intended landing site on Mons Mouton: https://www.lroc.asu.edu/images/1401
- NASA TN D-6850, Apollo Experience Report: Lunar Module Landing Gear Subsystem (12° landing slope limit): https://ntrs.nasa.gov/citations/19720018253
- NASA: Deep Space Network overview (ground station cards): https://www.nasa.gov/communicating-with-missions/dsn/
- NASA NTRS 20240009717: Navigation Doppler Lidar (past mission facts): https://ntrs.nasa.gov/citations/20240009717
- NASA Scientific Visualization Studio: CGI Moon Kit (3D Moon surface image): https://svs.gsfc.nasa.gov/4720
- NASA Earth Observatory: Blue Marble Next Generation with topography and bathymetry (Earth image): https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry/
- NASA Scientific Visualization Studio: Lunar Near and Far Side Phases (opening screen animation): https://svs.gsfc.nasa.gov/14992/
- NASA Scientific Visualization Studio: Black Marble 2016 (Earth night image in an illustration): https://svs.gsfc.nasa.gov/30876
- NASA Science: Deep Space Network 70 Meter Antenna 3D Model (ground station illustrations): https://science.nasa.gov/resource/deep-space-network-70-meter-antenna-3d-model/
- NASA Science 3D Resources: TDRS satellite model (Earth globe illustration): https://science.nasa.gov/3d-resources/

## Space Agency Partner and Other Data

One row per line: Link Text, then Link Url.

- LunaPath interface design export by team member Berke Kuş (earlier work, used with permission: colour and size tokens, motion styles, icon set): https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/blob/main/frontend-migrate/DESIGN.md
- Canadian Space Agency: From Apollo to Artemis, the evolution of crewed lunar missions (Apollo 11 information card): https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/from-apollo-to-artemis-the-evolution-of-crewed-lunar-missions.asp
- JAXA press release, 25 January 2024: SLIM landing results (past mission facts): https://global.jaxa.jp/press/2024/01/file/jaxa_doc01_20240125_e.pdf
- JAXA press release, 26 August 2024: SLIM mission end (past mission facts): https://global.jaxa.jp/press/2024/08/20240826-1_e.html
- SpaceQ: NASA CLPS 2 and Canada (Blue Ghost 1 information card): https://spaceq.ca/nasa-clps-2-canada-canadarm3/
- Firefly Aerospace: spacecraft autonomy (Blue Ghost 1 mission facts): https://fireflyspace.com/spacecraft-autonomy/
- SpaceNews: IM-2 lunar lander mission ends (past mission facts): https://spacenews.com/im-2-lunar-lander-mission-ends/
- SpacePolicyOnline: Hardware Failure Doomed ispace's Mission 2 (Hakuto-R M2 impact point from LRO): https://spacepolicyonline.com/news/hardware-failure-doomed-ispaces-mission-2/
- Durga Prasad et al. 2023, MNRAS Letters 526, L116 (Chandrayaan-3 landing site terrain): https://academic.oup.com/mnrasl/article/526/1/L116/7236874
- Wikipedia: Mons Mouton (terrain type of the IM-2 target): https://en.wikipedia.org/wiki/Mons_Mouton
- Intuitive Machines: Nova-C lander page, archived 4 March 2025 (proportions of the Athena model): https://web.archive.org/web/20250304174546/https://www.intuitivemachines.com/nova-c
- Poly Haven: CC0 textures and models (illustration scenes): https://polyhaven.com
- SpiceyPy (SPICE in Python, MIT): https://github.com/AndrewAnnex/SpiceyPy
- FastAPI (MIT): https://fastapi.tiangolo.com
- Pydantic (MIT): https://docs.pydantic.dev
- Uvicorn (BSD-3-Clause): https://github.com/encode/uvicorn
- Starlette (BSD-3-Clause): https://github.com/encode/starlette
- NumPy (BSD-3-Clause): https://numpy.org
- rasterio (BSD): https://rasterio.readthedocs.io
- GDAL (MIT, used through rasterio): https://gdal.org
- pytest (MIT): https://pytest.org
- React (MIT): https://react.dev
- Vite (MIT): https://vite.dev
- Vitest (MIT): https://vitest.dev
- three.js (MIT): https://threejs.org
- TypeScript (Apache-2.0): https://www.typescriptlang.org
- Unreal Engine 5.8 (offline renders of the illustrations): https://www.unrealengine.com
- Blender (Athena lander model): https://www.blender.org
- FFmpeg (illustration loops): https://ffmpeg.org
- SciPy (illustration terrain scripts): https://scipy.org
- Pillow (illustration texture scripts): https://python-pillow.org
- Skyfield with JPL DE421 (Sun and Earth directions in the illustrations): https://rhodesmill.org/skyfield/
- Claude Code by Anthropic (AI coding assistant; see Use of SI): https://www.anthropic.com/claude-code
- OpenAI Codex (AI code review; see Use of SI): https://openai.com/codex/
- Archivo font (SIL Open Font License): https://fonts.google.com/specimen/Archivo
- Archivo Narrow font (SIL Open Font License): https://fonts.google.com/specimen/Archivo+Narrow
- Azeret Mono font (SIL Open Font License): https://fonts.google.com/specimen/Azeret+Mono
- Material Symbols Outlined icons (Apache-2.0): https://fonts.google.com/icons
