"""ue_build_site.py icin hazirlik: makro dokulari 4096 yapar, kamera/gunes bilgisini site_info.json'a yazar.

Cikti: data/unreal/textures/site_macro_focus_4k.png, site_macro_full_4k.png
       data/unreal/meshes/site/site_info.json  (zemin yuksekligi, secilen gunes kareleri, grid-yerel donus)
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SITE = "leibnitz-beta-plateau"
T = ROOT / "data" / "unreal" / "terrain" / SITE
TEX = ROOT / "data" / "unreal" / "textures"
MESH = ROOT / "data" / "unreal" / "meshes" / "site"
Z_REF = 5400.0


def main():
    meta = json.loads((T / "terrain.json").read_text(encoding="utf-8"))
    f = meta["focus"]
    for src, dst in (("albedo_focus.png", "site_macro_focus_4k.png"), ("albedo_full.png", "site_macro_full_4k.png")):
        Image.open(T / src).convert("L").resize((4096, 4096), Image.BICUBIC).save(TEX / dst)

    h16 = np.asarray(Image.open(T / "height_focus.png"), dtype=np.float32)
    h = f["z_min_m"] + h16 / 65535.0 * (f["z_max_m"] - f["z_min_m"])
    N, px = h.shape[0], f["pixel_m"]

    def ground(r, c):
        return {"x_cm": float((N - 1 - r) * px * 100), "y_cm": float(c * px * 100), "z_cm": float((h[r, c] - Z_REF) * 100)}

    eph = json.loads((ROOT / "data" / "unreal" / "ephemeris" / f"{SITE}.json").read_text(encoding="utf-8"))
    el = np.array(eph["sun_el_deg"])
    az = np.array(eph["sun_az_deg"])
    lon = f["center_lonlat_deg"][0]

    # en cok gunes goren aday nokta (sunny_spots.py) ve o noktada Gunes'in ufkun net ustunde oldugu kare
    import math
    import rasterio
    from sunny_spots import SRC, horizon
    spot = json.loads((ROOT / "data" / "unreal" / "horizon" / f"{SITE}_spots.json").read_text(encoding="utf-8"))[0]
    with rasterio.open(SRC / "A310_GLDELEV_005.tif") as s:
        zf = s.read(1).astype(np.float64)
    r0, c0 = spot["dem_rc"]
    hor = horizon(zf, r0, c0, math.radians(lon))
    i0 = np.floor(az).astype(int) % 360
    hz = hor[i0] * (1 - (az % 1)) + hor[(i0 + 1) % 360] * (az % 1)
    marg = el - hz
    cand = np.where((marg > 0.7) & (el > 1.5) & (el < 5.5))[0]
    frame = int(cand[len(cand) // 2]) if len(cand) else int(np.argmax(marg))
    print("secilen nokta:", spot["gi"], spot["gj"], "gorunur kare:", spot["frames_visible"], "| aday kare sayisi:", len(cand))
    row_s = int(round(N - 1 - spot["x_cm"] / (px * 100)))
    col_s = int(round(spot["y_cm"] / (px * 100)))
    info = {
        "z_ref_m": Z_REF, "focus_pixel_m": px, "grid_lon_deg": lon,
        "ground_center": ground(row_s, col_s),
        "ground_nw": ground(N // 4, N // 4), "ground_se": ground(3 * N // 4, 3 * N // 4),
        "sun_frame_low": frame,
        "horizon_at_spot_deg": [float(v) for v in hor],
        "sun_az_deg": eph["sun_az_deg"], "sun_el_deg": eph["sun_el_deg"],
        "daylight_frames": int((el > 0).sum()),
    }
    (MESH / "site_info.json").write_text(json.dumps(info), encoding="utf-8")
    fr = info["sun_frame_low"]
    print("zemin merkez:", info["ground_center"])
    print("gunes karesi:", fr, "az", eph["sun_az_deg"][fr], "el", eph["sun_el_deg"][fr], "| gunduz kare sayisi:", info["daylight_frames"], "/", len(el))


if __name__ == "__main__":
    main()
