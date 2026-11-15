"""Odak penceresindeki aday noktalar icin 30 gunluk gunes gorunurlugunu hesaplar (DEM ufku, Ay egriligi dahil).

Girdi : DEM (5 m), terrain.json, ephemeris/<site>.json (sun_az_deg, sun_el_deg)
Cikti : data/unreal/horizon/<site>_spots.json  (aday noktalar: konum, gorunur kare sayisi, en iyi kareler)
"""
import json
import math
from pathlib import Path

import numpy as np
import rasterio

ROOT = Path(__file__).resolve().parent.parent
SITE = "leibnitz-beta-plateau"
SRC = ROOT / "data/raw/sites/mons-mouton/extracted/A3CLR22_10_Leibnitz_Beta_Plateau"
R_MOON = 1_737_400.0
NG = 9                              # NG x NG aday


def horizon(z, r0, c0, L, obs_h=1.7, max_km=8.0, px=5.0):
    north = (-math.sin(L), -math.cos(L))
    east = (math.cos(L), -math.sin(L))
    z0 = z[r0, c0] + obs_h
    ks = np.arange(1, int(max_km * 1000 / px))
    d = ks * px
    drop = d ** 2 / (2 * R_MOON)
    hor = np.empty(360)
    for a in range(360):
        ar = math.radians(a)
        hx = math.sin(ar) * east[0] + math.cos(ar) * north[0]
        hy = math.sin(ar) * east[1] + math.cos(ar) * north[1]
        x, y = c0 + hx * ks, r0 - hy * ks
        ok = (x >= 0) & (x < z.shape[1] - 1) & (y >= 0) & (y < z.shape[0] - 1)
        ang = np.degrees(np.arctan2(z[np.round(y[ok]).astype(int), np.round(x[ok]).astype(int)] - drop[ok] - z0, d[ok]))
        hor[a] = ang.max() if ang.size else -5.0
    return hor


def main():
    meta = json.loads((ROOT / "data/unreal/terrain" / SITE / "terrain.json").read_text(encoding="utf-8"))
    f = meta["focus"]
    with rasterio.open(SRC / "A310_GLDELEV_005.tif") as s:
        z = s.read(1).astype(np.float64)
    e = json.loads((ROOT / "data/unreal/ephemeris" / f"{SITE}.json").read_text(encoding="utf-8"))
    az, el = np.array(e["sun_az_deg"]), np.array(e["sun_el_deg"])
    wc, wr, ww, _ = f["window_in_full_px"]
    L = math.radians(f["center_lonlat_deg"][0])
    N_OUT, px_f = f["size_px"], f["pixel_m"]
    spots = []
    for gi in range(NG):
        for gj in range(NG):
            fr_ = (gi + 0.5) / NG
            fc_ = (gj + 0.5) / NG
            r0, c0 = int(wr + fr_ * ww), int(wc + fc_ * ww)
            hor = horizon(z, r0, c0, L)
            i0 = np.floor(az).astype(int) % 360
            h = hor[i0] * (1 - (az % 1)) + hor[(i0 + 1) % 360] * (az % 1)
            vis = el > h
            row_f, col_f = fr_ * (N_OUT - 1), fc_ * (N_OUT - 1)
            spots.append({"gi": gi, "gj": gj, "dem_rc": [r0, c0], "elev_m": float(z[r0, c0]),
                          "x_cm": float((N_OUT - 1 - row_f) * px_f * 100), "y_cm": float(col_f * px_f * 100),
                          "frames_visible": int(vis.sum()), "max_el_visible": float(el[vis].max()) if vis.any() else None,
                          "frames_el_pos_visible": int((vis & (el > 0)).sum())})
    spots.sort(key=lambda s: -s["frames_visible"])
    (ROOT / "data/unreal/horizon" / f"{SITE}_spots.json").write_text(json.dumps(spots, indent=1), encoding="utf-8")
    print("en cok gunes goren noktalar (721 kare = 30 gun):")
    for s in spots[:8]:
        print("  (%d,%d) yukseklik %.0f m  gorunur %3d kare (%.0f%%)  el>0 iken %3d kare  maks el %s" % (
            s["gi"], s["gj"], s["elev_m"], s["frames_visible"], 100 * s["frames_visible"] / len(el),
            s["frames_el_pos_visible"], "%.2f" % s["max_el_visible"] if s["max_el_visible"] is not None else "-"))
    print("en az:", spots[-1]["frames_visible"], "| ortalama: %.0f" % np.mean([s["frames_visible"] for s in spots]))


if __name__ == "__main__":
    main()
