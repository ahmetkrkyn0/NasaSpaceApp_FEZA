"""DEM'den bir noktanin 360 derece ufuk maskesini hesaplar ve efemeriste Gunes/Dunya gorunurlugunu gunceller.

Girdi : data/raw/sites/.../A310_GLDELEV_005.tif (5 m), terrain.json, data/unreal/ephemeris/<site>.json
Cikti : data/unreal/horizon/<site>.json  { az_step_deg, elev_deg[360], observer ... }
        ephemeris/<site>.json icine: sun_vis_horizon, earth_vis_horizon (0-1), horizon_model="dem_5m_curvature"
Ay egriligi dahil (d^2 / 2R dusme). Gozlemci: odak bolgenin merkezi, yerden obs_h metre yukarida.
"""
import argparse
import json
import math
from pathlib import Path

import numpy as np
import rasterio

ROOT = Path(__file__).resolve().parent.parent
R_MOON = 1_737_400.0
SUN_R_DEG, EARTH_R_DEG = 0.267, 0.95


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site-id", default="leibnitz-beta-plateau")
    ap.add_argument("--src", default=str(ROOT / "data/raw/sites/mons-mouton/extracted/A3CLR22_10_Leibnitz_Beta_Plateau"))
    ap.add_argument("--obs-h", type=float, default=1.7)
    ap.add_argument("--max-km", type=float, default=8.0)
    args = ap.parse_args()

    meta = json.loads((ROOT / "data/unreal/terrain" / args.site_id / "terrain.json").read_text(encoding="utf-8"))
    f = meta["focus"]
    with rasterio.open(Path(args.src) / "A310_GLDELEV_005.tif") as s:
        z = s.read(1).astype(np.float64)
    px = 5.0
    wc, wr, ww, _ = f["window_in_full_px"]
    r0, c0 = wr + ww // 2, wc + ww // 2
    L = math.radians(f["center_lonlat_deg"][0])
    north = (-math.sin(L), -math.cos(L))
    east = (math.cos(L), -math.sin(L))
    z0 = z[r0, c0] + args.obs_h
    ks = np.arange(1, int(args.max_km * 1000 / px))
    d = ks * px
    drop = d ** 2 / (2 * R_MOON)

    hor = np.empty(360)
    for a in range(360):
        ar = math.radians(a)
        hx = math.sin(ar) * east[0] + math.cos(ar) * north[0]
        hy = math.sin(ar) * east[1] + math.cos(ar) * north[1]
        x = c0 + hx * ks
        y = r0 - hy * ks
        ok = (x >= 0) & (x < z.shape[1] - 1) & (y >= 0) & (y < z.shape[0] - 1)
        xi, yi = np.round(x[ok]).astype(int), np.round(y[ok]).astype(int)
        ang = np.degrees(np.arctan2(z[yi, xi] - drop[ok] - z0, d[ok]))
        hor[a] = ang.max() if ang.size else -5.0
    out = ROOT / "data/unreal/horizon"
    out.mkdir(parents=True, exist_ok=True)
    (out / f"{args.site_id}.json").write_text(json.dumps({
        "schema": "feza.unreal.horizon/1", "site_id": args.site_id, "az_step_deg": 1,
        "az_convention": "north=0, east=90 (local)", "elev_deg": [round(float(v), 3) for v in hor],
        "observer": {"lonlat_deg": f["center_lonlat_deg"], "height_above_ground_m": args.obs_h,
                     "pixel_rc_in_full_dem": [int(r0), int(c0)]},
        "model": "DEM 5 m SfS, Moon curvature d^2/2R, max range %.0f km" % args.max_km}, indent=1), encoding="utf-8")

    def at(az):                                           # dogrusal interpolasyon
        a = np.asarray(az) % 360.0
        i = np.floor(a).astype(int) % 360
        t = a - np.floor(a)
        return hor[i] * (1 - t) + hor[(i + 1) % 360] * t

    ep = ROOT / "data/unreal/ephemeris" / f"{args.site_id}.json"
    e = json.loads(ep.read_text(encoding="utf-8"))
    for body, rad in (("sun", SUN_R_DEG), ("earth", EARTH_R_DEG)):
        az, el = np.array(e[f"{body}_az_deg"]), np.array(e[f"{body}_el_deg"])
        h = at(az)
        vis = np.clip((el - h) / (2 * rad) + 0.5, 0.0, 1.0)      # disk, ufuk cizgisini dogrusal kesiyor (yaklasik)
        e[f"{body}_vis_horizon"] = [round(float(v), 4) for v in vis]
        e[f"{body}_horizon_deg"] = [round(float(v), 3) for v in h]
    e["horizon_model"] = "dem_5m_curvature (observer at focus centre)"
    ep.write_text(json.dumps(e, ensure_ascii=False), encoding="utf-8")

    sv = np.array(e["sun_vis_horizon"])
    ev = np.array(e["earth_vis_horizon"])
    print("ufuk maks %.2f, ort %.2f, min %.2f derece" % (hor.max(), hor.mean(), hor.min()))
    print("Gunes gorunur kare: %d / %d (duz ufuk modeli: %d)" % ((sv > 0.5).sum(), len(sv), (np.array(e["sun_vis"]) > 0.5).sum()))
    print("Dunya gorunur kare: %d / %d" % ((ev > 0.5).sum(), len(ev)))
    el = np.array(e["sun_el_deg"])
    h = np.array(e["sun_horizon_deg"])
    margin = el - h
    cand = np.where((margin > 0.8) & (margin < 3.0) & (el > 1.0))[0]
    print("iyi aday kareler (Gunes ufkun 0.8-3 derece ustunde):", len(cand), cand[:12].tolist())
    if len(cand):
        k = int(cand[len(cand) // 2])
        print("onerilen kare:", k, "az %.1f el %.2f ufuk %.2f marj %.2f" % (e["sun_az_deg"][k], el[k], h[k], margin[k]))


if __name__ == "__main__":
    main()
