# Media credits

Pre-rendered images and short loops shown in the interface as **illustrations**. They are not computed data:
the Sun, shadows, stars and lander in them are placed by hand in the renders, not by the product's
calculation. The product's computed Sun and Earth positions are in the horizon strip.

Every field must be filled before submission. `pending` marks a field that is not known yet.

## Moon surface scenes

Files: `scenes/moon-craters/`, `scenes/moon-plains/`, `scenes/moon-ridges/`
(`poster.jpg`, `orbit.mp4`, `overview.jpg`, `ground.jpg`, `lander.jpg`).

| Item | Value |
| --- | --- |
| Prepared by | pending |
| Tool | Unity (offline renders; Unity is not used at run time) |
| Lander model | Team FEZA's Athena (IM-2) model, built from scratch in Blender by `shipmodel/tools/athena_build.py`; no third-party meshes or textures (`shipmodel/README.md`). Shown upright for scale |
| Terrain and surface textures | pending |
| Rocks and other scene objects | pending |
| Sky (stars) | pending |
| Licence of third-party parts | pending |

## Ground station scenes

Files: `stations/dsn-goldstone/`, `stations/dsn-madrid/`, `stations/dsn-canberra/` (`overview.jpg`, `close.jpg`).

| Item | Value |
| --- | --- |
| Prepared by | pending |
| Tool | Unity (offline renders) |
| Antenna model | pending |
| Terrain and textures | pending |
| Licence of third-party parts | pending |

## Earth globe

File: `stations/earth-globe/overview.jpg`.

| Item | Value |
| --- | --- |
| Prepared by | pending |
| Tool | Unity (offline render) |
| Earth and Moon textures | pending |
| Licence of third-party parts | pending |

## Not included

Left out on purpose: each scene's `earth.jpg` and `sun.jpg`, the stations' `moon.jpg` and `moonzoom.jpg`
(they show what the product computes at positions that were not computed), `moon-globe/moon.jpg`
(what its pins mark is not known) and the `flow/` demo video.
