"""DEM'den bagimsiz, prosedurel Ay arazisi uretir (3 tur): craters (kraterli saha), plains (mare ovasi), ridges (sirtli yaylalar).

Cikti: data/unreal/terrain/<id>/height_focus.png (16 bit), terrain.json (make_site_tiles.py ile uyumlu), rocks_ue.csv,
       data/unreal/textures/moon_mask_noise.png (doku karisim maskesi, sarmal)
Cerceve: UE X = kuzey (satir 0 = kuzey), Y = dogu, Z yukari; cm. Ay egriligi (d^2/2R) yukseklige dahil: ufuk dogal kapanir.
Gorsel amaclidir (sentetik); gercek bir yere ait degildir.
"""
import argparse
import csv
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_site_terrain import add_craters, fractal_noise, make_rocks, slope_deg  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
R_MOON = 1_737_400.0
N = 3025                       # 3 x 3 karo (1009 kose, 1008 hucre)
PX = 2.0                       # m / piksel -> 6 km

KINDS = {
    "craters": dict(name="Kraterli Saha", base_rms=4.0, base_l=(180.0, 3500.0), craters=dict(dmin=14.0, dmax=1100.0, n10=42.0, b=1.4, max_age=1.7),
                    ridges=0.0, wrinkle=0.0, sun=(250.0, 7.0), rocks=0.9e-3, seed=11),
    "plains": dict(name="Mare Ovasi", base_rms=2.0, base_l=(200.0, 4500.0), craters=dict(dmin=14.0, dmax=600.0, n10=7.0, b=1.7, max_age=3.0),
                   ridges=0.0, wrinkle=4.5, sun=(235.0, 9.0), rocks=0.5e-3, seed=22),
    "ridges": dict(name="Sirtli Yaylalar", base_rms=9.0, base_l=(150.0, 4500.0), craters=dict(dmin=14.0, dmax=700.0, n10=24.0, b=1.5, max_age=2.4),
                   ridges=95.0, wrinkle=0.0, sun=(265.0, 5.5), rocks=1.2e-3, seed=33),
}


def tileable_mask(n=1024, seed=5):
    rng = np.random.default_rng(seed)
    f = np.fft.fftfreq(n)
    fr = np.hypot(f[None, :], f[:, None])
    fr[0, 0] = 1.0
    spec = (rng.standard_normal((n, n)) + 1j * rng.standard_normal((n, n))) * fr ** -1.6
    spec[(fr > 0.12) | (fr < 1.0 / 512)] = 0.0
    spec[0, 0] = 0.0
    a = np.real(np.fft.ifft2(spec))
    return (np.clip((a - a.mean()) / (4 * a.std()) + 0.5, 0, 1) * 255).astype(np.uint8)


def build(kind, site_id, lon, lat):
    k = KINDS[kind]
    rng = np.random.default_rng(k["seed"])
    h = fractal_noise((N, N), PX, rng, rms=k["base_rms"], lmin=k["base_l"][0], lmax=k["base_l"][1], amp_exp=1.7)
    if k["ridges"] > 0:                                           # sirtli yaylalar: ridged multifractal
        g = fractal_noise((N, N), PX, rng, rms=1.0, lmin=900.0, lmax=6000.0, amp_exp=1.4)      # genis, yumusak sirtlar
        h += k["ridges"] * (1.0 - np.abs(g).clip(0, 1.6) / 1.6) ** 1.8
    if k["wrinkle"] > 0:                                          # mare kirisik sirtlari: dusuk frekansli alanin sifir konturlari
        g = fractal_noise((N, N), PX, rng, rms=1.0, lmin=1500.0, lmax=7000.0, amp_exp=1.6)
        h += k["wrinkle"] * np.exp(-((g / 0.22) ** 2))                 # daha genis, yumusak kirisik sirt
    ncr = add_craters(h, PX, rng, **k["craters"])
    c = (N - 1) / 2.0
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    d = np.hypot(yy - c, xx - c) * PX
    h = (h - d ** 2 / (2 * R_MOON)).astype(np.float32)           # Ay egriligi: ufuk ~2.4 km'de kapanir
    zmin, zmax = float(h.min()) - 1.0, float(h.max()) + 1.0
    out = ROOT / "data" / "unreal" / "terrain" / site_id
    out.mkdir(parents=True, exist_ok=True)
    v = np.clip((h - zmin) / (zmax - zmin), 0, 1)
    Image.fromarray((v * 65535 + 0.5).astype(np.uint16)).save(out / "height_focus.png")

    slope = slope_deg(h, PX)
    rows, cols, dia = make_rocks(h, PX, slope, rng, n05=k["rocks"], b=2.3, dmin=0.4, dmax=5.0)
    zref = math.floor(zmin)
    variants = rng.integers(0, 7, len(dia))
    yaw = rng.uniform(0, 360, len(dia))
    with open(out / "rocks_ue.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["x_cm", "y_cm", "z_cm", "diameter_m", "variant", "yaw_deg"])
        for r_, c_, dd, vv, yw in zip(rows, cols, dia, variants, yaw):
            w.writerow([round((N - 1 - r_) * PX * 100, 1), round(c_ * PX * 100, 1), round((float(h[r_, c_]) - zref) * 100 - dd * 12, 1),
                        round(float(dd), 2), int(vv), round(float(yw), 1)])      # biraz gom (dd*12 cm)
    ci = int(c)
    sun_az, sun_el = k["sun"]
    meta = {
        "schema": "feza.unreal.terrain/1", "site_id": site_id, "kind": kind, "name": k["name"], "synthetic": True,
        "focus": {"file": "height_focus.png", "size_px": N, "pixel_m": PX, "z_min_m": zmin, "z_max_m": zmax, "z_ref_m": zref,
                  "synthetic_detail": True, "synthetic_craters": int(ncr), "rocks": int(len(dia)),
                  "center_lonlat_deg": [lon, lat]},
        "ground_center_cm": [float((N - 1) / 2 * PX * 100), float((N - 1) / 2 * PX * 100), float((h[ci, ci] - zref) * 100)],
        "sun": {"az_deg": sun_az, "el_deg": sun_el},
        "encoding": "h_m = z_min_m + v/65535*(z_max_m - z_min_m); row 0 = north",
    }
    (out / "terrain.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"{site_id}: {k['name']}, krater {ncr}, kaya {len(dia)}, yukseklik {h.min():.0f}..{h.max():.0f} m, merkez z {h[ci, ci]:.0f} m")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=None, help="craters|plains|ridges")
    a = ap.parse_args()
    (ROOT / "data" / "unreal" / "textures").mkdir(parents=True, exist_ok=True)
    Image.fromarray(tileable_mask()).save(ROOT / "data" / "unreal" / "textures" / "moon_mask_noise.png")
    sites = {"craters": ("site-craters", 31.4, -43.3), "plains": ("site-plains", 23.5, 8.5), "ridges": ("site-ridges", -11.4, 74.0)}
    for kind, (sid, lon, lat) in sites.items():
        if a.only and a.only != kind:
            continue
        build(kind, sid, lon, lat)


if __name__ == "__main__":
    main()
