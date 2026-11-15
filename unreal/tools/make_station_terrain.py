"""DSN istasyonlari icin ZENGIN arazi: yukseklik haritasi + dogal ortam yerlesimi (bitki/kaya). make_dsn_data.make_terrain'in yerini alir.

Cagiran : elle (tools/.venv ile); sonra make_site_tiles.py <id> ve ue_build_stations.py (props.json'i okur: SITE_ONLY=<id>)
Girdi   : tools/make_site_terrain.fractal_noise
Cikti   : data/unreal/terrain/<id>/{height_focus.png, terrain.json (ayni sema, make_dsn_data ile uyumlu), props.json}
          props.json: {"items": [{"a": <Poly Haven adi>, "x","y","z": cm (sahne cercevesi: X kuzey, Y dogu), "yaw": derece, "s": olcek}]}
Cerceve : 2017x2017 piksel, 4 m (8 km); satir 0 = kuzey. x = (N-1-satir)*4 m, y = sutun*4 m, z = h - zref.
Kullanim: tools/.venv/Scripts/python.exe tools/make_station_terrain.py [dsn-goldstone ...]
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_site_terrain import fractal_noise  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
N, PX = 2017, 4.0
KINDS = {"dsn-goldstone": ("desert", 41), "dsn-madrid": ("hills", 42), "dsn-canberra": ("valley", 43)}

# her tur icin: (ad, adet, yaricap_m (min, max), olcek (min, max), gurultu_esigi (kume), egim_siniri derece)
PROPS = {
    "desert": [("wild_rooibos_bush", 1700, (110, 1700), (0.55, 1.15), 0.0, 18), ("searsia_lucida", 90, (160, 1500), (0.6, 1.0), 0.25, 14),
               ("namaqualand_boulder_05", 420, (100, 1900), (0.5, 1.4), -0.2, 35), ("namaqualand_boulder_06", 420, (100, 1900), (0.5, 1.4), -0.2, 35),
               ("namaqualand_rocks_01", 500, (90, 1900), (0.6, 1.5), -0.3, 40), ("stone_01", 700, (90, 1500), (0.8, 2.2), -0.4, 40),
               ("namaqualand_boulder_02", 55, (300, 2200), (0.8, 1.8), 0.1, 40)],
    "hills": [("island_tree_02", 150, (130, 1900), (0.55, 1.0), 0.1, 16), ("pine_sapling_small", 220, (120, 1700), (0.8, 1.5), 0.0, 20),
              ("shrub_02", 700, (100, 1600), (0.6, 1.2), -0.1, 22), ("grass_medium_02", 900, (90, 900), (0.8, 1.4), -0.2, 20),
              ("rock_07", 420, (90, 1900), (1.0, 3.0), -0.3, 40), ("boulder_01", 60, (200, 2200), (0.5, 1.2), 0.1, 40)],
    "valley": [("jacaranda_tree", 70, (170, 1700), (0.7, 1.2), 0.15, 14), ("island_tree_01", 55, (200, 1900), (0.7, 1.1), 0.15, 14),
               ("searsia_burchellii", 260, (140, 1500), (0.6, 1.1), -0.1, 18), ("grass_bermuda_01", 2200, (90, 800), (0.9, 1.6), -0.2, 20),
               ("rock_07", 260, (90, 1900), (1.0, 3.0), -0.3, 40), ("boulder_01", 70, (200, 2200), (0.5, 1.2), 0.1, 40)],
}


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def ridged(n):
    """0..1: iz cizgileri 1 (kivrimli sirt/dere agi)."""
    a = np.abs(n / float(n.std()))
    return np.clip(1.0 - a, 0.0, 1.0)


def make_height(kind, rng):
    c = (N - 1) / 2
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    r = np.hypot(yy - c, xx - c) * PX
    if kind == "desert":
        h = fractal_noise((N, N), PX, rng, rms=7.0, lmin=300.0, lmax=3800.0, amp_exp=1.5)                  # genis dalgalanma
        n_w = fractal_noise((N, N), PX, rng, rms=1.0, lmin=60.0, lmax=900.0, amp_exp=1.2)
        h -= 3.2 * ridged(n_w) ** 5 * smooth((r - 140.0) / 200.0)                                            # kuru dereler
        hill = np.clip(fractal_noise((N, N), PX, rng, rms=1.0, lmin=200.0, lmax=900.0, amp_exp=1.3), 0, None) ** 2
        h += 22.0 * hill * smooth((r - 450.0) / 600.0)                                                       # alcak kayalik tepecikler
        g = fractal_noise((N, N), PX, rng, rms=1.0, lmin=300.0, lmax=3500.0, amp_exp=1.3)
        ridge_m = ridged(fractal_noise((N, N), PX, rng, rms=1.0, lmin=700.0, lmax=3000.0, amp_exp=1.1)) ** 1.5
        h += 520.0 * smooth((r - 2100.0) / 1700.0) * (0.45 + 0.55 * ridge_m) + 60.0 * smooth((r - 1500.0) / 900.0) * np.abs(g).clip(0, 1.5)
        h += fractal_noise((N, N), PX, rng, rms=0.7, lmin=8.0, lmax=90.0, amp_exp=1.4)
    elif kind == "hills":
        h = fractal_noise((N, N), PX, rng, rms=24.0, lmin=220.0, lmax=3600.0, amp_exp=1.7)
        n_r = ridged(fractal_noise((N, N), PX, rng, rms=1.0, lmin=300.0, lmax=1800.0, amp_exp=1.2))
        h += 38.0 * n_r ** 2 * smooth((r - 300.0) / 700.0)
        h += 220.0 * smooth((r - 2200.0) / 1700.0)
        h += fractal_noise((N, N), PX, rng, rms=1.1, lmin=8.0, lmax=120.0, amp_exp=1.5)
    else:
        h = fractal_noise((N, N), PX, rng, rms=22.0, lmin=180.0, lmax=3000.0, amp_exp=1.6)
        h += 260.0 * smooth((np.abs(xx - c) * PX - 450.0) / 2300.0)                                          # vadi: iki yanda yukselen yamaclar
        creek = ridged(fractal_noise((N, N), PX, rng, rms=1.0, lmin=400.0, lmax=2400.0, amp_exp=1.3)) ** 4
        h -= 4.0 * creek * smooth((r - 140.0) / 240.0)
        h += fractal_noise((N, N), PX, rng, rms=0.9, lmin=8.0, lmax=100.0, amp_exp=1.4)
    base = float(h[r < 280.0].mean())
    w = 1.0 - smooth((r - 280.0) / 320.0)                                                                  # istasyon platosu
    return (h * (1 - w) + base * w).astype(np.float32), r


def write_terrain(sid, kind, h):
    zmin, zmax = float(h.min()) - 1.0, float(h.max()) + 1.0
    out = ROOT / "data" / "unreal" / "terrain" / sid
    out.mkdir(parents=True, exist_ok=True)
    Image.fromarray((np.clip((h - zmin) / (zmax - zmin), 0, 1) * 65535 + 0.5).astype(np.uint16)).save(out / "height_focus.png")
    zref = math.floor(zmin)
    c = (N - 1) / 2
    meta = {"schema": "feza.unreal.terrain/1", "site_id": sid, "kind": kind, "name": sid, "synthetic": True,
            "focus": {"file": "height_focus.png", "size_px": N, "pixel_m": PX, "z_min_m": zmin, "z_max_m": zmax, "z_ref_m": zref},
            "ground_center_cm": [c * PX * 100, c * PX * 100, (float(h[int(c), int(c)]) - zref) * 100],
            "encoding": "h_m = z_min_m + v/65535*(z_max_m - z_min_m); row 0 = north"}
    old = out / "terrain.json"
    if old.exists():
        meta["name"] = json.loads(old.read_text(encoding="utf-8")).get("name", sid)
    old.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return zref


def make_props(sid, kind, h, zref, rng):
    dh_r, dh_c = np.gradient(h, PX)
    slope = np.degrees(np.arctan(np.hypot(dh_r, dh_c)))
    dens = fractal_noise((N, N), PX, rng, rms=1.0, lmin=80.0, lmax=700.0, amp_exp=1.2)        # kumelenme
    items = []
    c = (N - 1) / 2
    for name, count, (r0, r1), (s0, s1), thr, smax in PROPS[kind]:
        got, tries = 0, 0
        while got < count and tries < count * 60:
            tries += 1
            ang, rad = rng.random() * 2 * math.pi, math.sqrt(rng.random() * (r1 ** 2 - r0 ** 2) + r0 ** 2)
            col, row = int(round(c + rad * math.cos(ang) / PX)), int(round(c + rad * math.sin(ang) / PX))
            if not (1 <= col < N - 1 and 1 <= row < N - 1) or slope[row, col] > smax or dens[row, col] < thr:
                continue
            items.append({"a": name, "x": round((N - 1 - row) * PX * 100, 1), "y": round(col * PX * 100, 1), "z": round((float(h[row, col]) - zref) * 100, 1),
                          "yaw": round(rng.random() * 360, 1), "s": round(s0 + rng.random() * (s1 - s0), 3)})
            got += 1
    (ROOT / "data" / "unreal" / "terrain" / sid / "props.json").write_text(json.dumps({"items": items}), encoding="utf-8")
    return len(items)


def sync_stations_json():
    """stations.json'daki ground_center_cm'i yeni arazinin merkez yuksekligiyle esler (ue_build_stations kamerayi/canagi buna gore koyar)."""
    p = ROOT / "data" / "unreal" / "stations" / "stations.json"
    d = json.loads(p.read_text(encoding="utf-8"))
    for st in d["stations"]:
        t = json.loads((ROOT / "data" / "unreal" / "terrain" / st["id"] / "terrain.json").read_text(encoding="utf-8"))
        st["ground_center_cm"] = t["ground_center_cm"]
    p.write_text(json.dumps(d, indent=1, ensure_ascii=False), encoding="utf-8")


def main():
    ids = sys.argv[1:] or list(KINDS)
    for sid in ids:
        kind, seed = KINDS[sid]
        rng = np.random.default_rng(seed)
        h, _ = make_height(kind, rng)
        zref = write_terrain(sid, kind, h)
        n = make_props(sid, kind, h, zref, rng)
        print(f"{sid}: yukseklik {h.min():.0f}..{h.max():.0f} m, {n} nesne")
    sync_stations_json()


if __name__ == "__main__":
    main()
