# Backend

FastAPI server for the Lunar Landing Site Navigator. It computes where the Sun and the Earth stand above a lunar site's horizon and serves the shared data files. Contracts: [ADR-0002](../docs/adr/0002-koordinat-sistemi-ve-zaman.md) (frames, time, angles), [ADR-0003](../docs/adr/0003-veri-sozlesmesi.md) (data shapes), [ADR-0004](../docs/adr/0004-api-uc-noktalari.md) (endpoints).

## Setup

Run from the repository root:

```bash
python -m pip install -e "backend[dev]"
python backend/scripts/download_kernels.py      # skips files that are already there; --force re-downloads
python -m uvicorn app.main:app --app-dir backend --port 8000 --reload
python -m pytest backend
```

The five SPICE kernels (`naif0012.tls`, `pck00011.tpc`, `de440s.bsp`, `moon_pa_de440_200625.bpc`, `moon_de440_250416.tf`) land in `data/raw/kernels/`, which is not committed. Without them the server still starts: `/api/health` reports `kernels_loaded: false` and `/api/sky-series` returns 503 `data_unavailable`.

Environment variables (optional): `FEZA_DATA_DIR` (default `data/`) and `FEZA_KERNEL_DIR` (default `data/raw/kernels/`).

## Layout

| Path | Content |
|---|---|
| `app/main.py` | App factory; loads every module in `app/api/` that defines `router`, under `/api` |
| `app/errors.py` | Error classes and the `{"error": {"code", "message"}}` body |
| `app/settings.py` | Paths and the kernel list |
| `app/core/ephemeris.py` | SPICE: Sun and Earth azimuth, elevation, range, apparent radius (`LT+S`, `MOON_ME`, from the site) |
| `app/core/visibility.py` | Fraction of a disk above the horizon |
| `app/core/location.py` | `resolve(site_id, lat_deg, lon_deg)`: input checks, site lookup, longitude wrapping |
| `app/core/catalog.py` | Loaders for `data/sites.json`, `panel_profiles.json`, `reference_missions.json` |
| `app/core/sphere_horizon.py` | Temporary flat-horizon provider; replaced by `app.terrain.horizon` in F2-A |
| `app/models/` | Pydantic response models |
| `app/api/` | Routers: `health`, `sky-series`, `sites`, `panel-profiles`, `reference-missions` |
| `scripts/download_kernels.py` | Kernel download |
| `tests/contract.py` | Compares a response's field names with `data/examples/<name>.json` (falls back to `tests/fixtures/examples/`) |

## Adding an endpoint

Create `app/api/<name>.py` with `router = APIRouter()` and its routes. No other file changes; the app picks it up on start.
