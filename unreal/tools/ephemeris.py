"""Ay yüzeyindeki bir sahadan Güneş ve Dünya efemerisi + Ay merkezli cisim konumları.

Çıktılar (docs/adr-taslak/0002-unreal-veri-sozlesmesi.md biçiminde):
  data/unreal/ephemeris/<site_id>.json  sahadan az/el, mesafe, Dünya evresi, görünürlük
  data/unreal/bodies.json               MOON_ME çerçevesinde Güneş/Dünya konumu, Dünya dönüşü

Kernel'ler (DE421, Ay yönelimi) ilk çalıştırmada data/kernels/ altına indirilir.

Örnek:
  .venv/Scripts/python.exe ephemeris.py --site-id mons-mouton --lat -84.78 --lon 29.13 \
      --start 2026-12-01T00:00:00Z --hours 720 --step-s 3600
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
from skyfield.api import Loader, PlanetaryConstants
from skyfield.framelib import itrs

ROOT = Path(__file__).resolve().parent.parent
KERNELS = ROOT / "data" / "kernels"
OUT = ROOT / "data" / "unreal"

SUN_RADIUS_KM = 695_700.0
EARTH_RADIUS_KM = 6_371.0


def disk_fraction_above_horizon(el_deg: np.ndarray, radius_deg: np.ndarray) -> np.ndarray:
    """Düz ufukta, merkezi el_deg yükseklikte olan diskin ufkun üstündeki alan kesri (0–1).

    Ufuk maskesi henüz yok; arazi gölgesi bu değere sonradan çarpan olarak eklenecek.
    """
    h = np.clip(el_deg / radius_deg, -1.0, 1.0)  # merkezin ufka uzaklığı / yarıçap
    # Dairesel kesit alanı: ufkun altında kalan parça = (acos(h) - h*sqrt(1-h^2)) / pi
    below = (np.arccos(h) - h * np.sqrt(1.0 - h * h)) / np.pi
    return 1.0 - below


def matrix_to_quaternion(m: np.ndarray) -> np.ndarray:
    """(n,3,3) dönüş matrisleri → (n,4) birim kuaterniyon [w, x, y, z]."""
    q = np.empty((m.shape[0], 4))
    for i, r in enumerate(m):
        tr = np.trace(r)
        if tr > 0:
            s = np.sqrt(tr + 1.0) * 2
            q[i] = [0.25 * s, (r[2, 1] - r[1, 2]) / s, (r[0, 2] - r[2, 0]) / s, (r[1, 0] - r[0, 1]) / s]
        else:
            k = int(np.argmax(np.diag(r)))
            if k == 0:
                s = np.sqrt(1.0 + r[0, 0] - r[1, 1] - r[2, 2]) * 2
                q[i] = [(r[2, 1] - r[1, 2]) / s, 0.25 * s, (r[0, 1] + r[1, 0]) / s, (r[0, 2] + r[2, 0]) / s]
            elif k == 1:
                s = np.sqrt(1.0 + r[1, 1] - r[0, 0] - r[2, 2]) * 2
                q[i] = [(r[0, 2] - r[2, 0]) / s, (r[0, 1] + r[1, 0]) / s, 0.25 * s, (r[1, 2] + r[2, 1]) / s]
            else:
                s = np.sqrt(1.0 + r[2, 2] - r[0, 0] - r[1, 1]) * 2
                q[i] = [(r[1, 0] - r[0, 1]) / s, (r[0, 2] + r[2, 0]) / s, (r[1, 2] + r[2, 1]) / s, 0.25 * s]
    return q / np.linalg.norm(q, axis=1, keepdims=True)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site-id", default="mons-mouton")
    ap.add_argument("--lat", type=float, default=-84.78, help="planetosentrik enlem, derece")
    ap.add_argument("--lon", type=float, default=29.13, help="doğu pozitif boylam, derece")
    ap.add_argument("--start", default="2026-12-01T00:00:00Z", help="UTC, ISO 8601")
    ap.add_argument("--hours", type=float, default=720.0)
    ap.add_argument("--step-s", type=int, default=3600)
    args = ap.parse_args()

    load = Loader(str(KERNELS))
    ts = load.timescale()
    eph = load("de421.bsp")
    pc = PlanetaryConstants()
    pc.read_text(load("moon_080317.tf"))
    pc.read_text(load("pck00008.tpc"))
    pc.read_binary(load("moon_pa_de421_1900-2050.bpc"))
    moon_frame = pc.build_frame_named("MOON_ME_DE421")

    start = datetime.fromisoformat(args.start.replace("Z", "+00:00")).astimezone(timezone.utc)
    n = int(args.hours * 3600 // args.step_s) + 1
    times = [start + timedelta(seconds=i * args.step_s) for i in range(n)]
    t = ts.from_datetimes(times)

    sun, earth, moon = eph["sun"], eph["earth"], eph["moon"]
    site = moon + pc.build_latlon_degrees(moon_frame, args.lat, args.lon)
    obs = site.at(t)

    # --- Sahadan görünüm (ışık zamanı + sapınç düzeltmeli; Ay'da kırılma yok) ---
    sun_app = obs.observe(sun).apparent()
    earth_app = obs.observe(earth).apparent()
    sun_el, sun_az, sun_d = sun_app.altaz()
    earth_el, earth_az, earth_d = earth_app.altaz()

    sun_r_deg = np.degrees(np.arcsin(SUN_RADIUS_KM / sun_d.km))
    earth_r_deg = np.degrees(np.arcsin(EARTH_RADIUS_KM / earth_d.km))

    # Dünya evresi: Dünya'da, Güneş yönü ile gözlemci yönü arasındaki açı
    v_earth = earth_app.position.km              # gözlemci → Dünya
    v_sun = sun_app.position.km                  # gözlemci → Güneş
    e_to_sun = v_sun - v_earth
    e_to_obs = -v_earth
    cos_phase = np.sum(e_to_sun * e_to_obs, axis=0) / (
        np.linalg.norm(e_to_sun, axis=0) * np.linalg.norm(e_to_obs, axis=0))
    earth_phase = (1.0 + cos_phase) / 2.0

    sun_vis = disk_fraction_above_horizon(sun_el.degrees, sun_r_deg)
    earth_vis = (disk_fraction_above_horizon(earth_el.degrees, earth_r_deg) > 0).astype(int)

    # --- Ay merkezli, MOON_ME çerçevesinde konumlar ---
    r_moon = moon_frame.rotation_at(t)           # (3,3,n) ICRF → MOON_ME
    p_sun = (sun - moon).at(t).position.km       # (3,n) ICRF
    p_earth = (earth - moon).at(t).position.km
    sun_me = np.einsum("ijn,jn->ni", r_moon, p_sun)
    earth_me = np.einsum("ijn,jn->ni", r_moon, p_earth)

    # ITRS → MOON_ME: R_moon · R_itrsᵀ
    r_itrs = itrs.rotation_at(t)                 # (3,3,n) ICRF → ITRS
    r_e2m = np.einsum("ijn,kjn->nik", r_moon, r_itrs)
    earth_q = matrix_to_quaternion(r_e2m)

    common = {"start_utc": start.strftime("%Y-%m-%dT%H:%M:%SZ"), "step_s": args.step_s, "n": n}

    def r(a, k):
        return np.round(a, k).tolist()

    site_doc = {
        "schema": "feza.unreal.ephemeris/1",
        "site_id": args.site_id,
        "lat_deg": args.lat,
        "lon_deg": args.lon,
        **common,
        "horizon_model": "flat",
        "sun_az_deg": r(sun_az.degrees, 4), "sun_el_deg": r(sun_el.degrees, 4), "sun_dist_km": r(sun_d.km, 0),
        "sun_vis": r(sun_vis, 4),
        "earth_az_deg": r(earth_az.degrees, 4), "earth_el_deg": r(earth_el.degrees, 4),
        "earth_dist_km": r(earth_d.km, 1),
        "earth_phase": r(earth_phase, 4),
        "earth_vis": earth_vis.tolist(),
    }
    bodies_doc = {
        "schema": "feza.unreal.bodies/1",
        "frame": "MOON_ME",
        **common,
        "sun_pos_km": r(sun_me, 0),
        "earth_pos_km": r(earth_me, 1),
        "earth_rot_q": r(earth_q, 8),
    }

    (OUT / "ephemeris").mkdir(parents=True, exist_ok=True)
    site_path = OUT / "ephemeris" / f"{args.site_id}.json"
    bodies_path = OUT / "bodies.json"
    site_path.write_text(json.dumps(site_doc, ensure_ascii=False), encoding="utf-8")
    bodies_path.write_text(json.dumps(bodies_doc, ensure_ascii=False), encoding="utf-8")

    print(f"{n} örnek yazıldı: {site_path} , {bodies_path}")
    print(f"Güneş el: min {sun_el.degrees.min():.3f}°, max {sun_el.degrees.max():.3f}° | "
          f"Dünya el: min {earth_el.degrees.min():.3f}°, max {earth_el.degrees.max():.3f}°")
    print(f"Dünya ufkun üstünde: {earth_vis.mean() * 100:.1f}% | Güneş diski ort. görünür kesir: {sun_vis.mean():.3f}")
    print(f"İlk örnek: Güneş az {sun_az.degrees[0]:.4f}° el {sun_el.degrees[0]:.4f}° | "
          f"Dünya az {earth_az.degrees[0]:.4f}° el {earth_el.degrees[0]:.4f}° evre {earth_phase[0]:.3f}")


if __name__ == "__main__":
    main()
