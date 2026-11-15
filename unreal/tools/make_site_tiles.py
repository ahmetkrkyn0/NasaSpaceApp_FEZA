"""Inis sahasi arazisini Nanite mesh karolarina (GLB) boler.

Girdi : data/unreal/terrain/<site>/height_focus.png, height_full.png, terrain.json
Cikti : data/unreal/meshes/site/focus_<i>_<j>.glb  (4x4 karo, 1009x1009 kose, ~1 m aralik)
        data/unreal/meshes/site/outer.glb          (16 km, ~16 m aralik, odak bolge altinda 2 m asagida)
        data/unreal/meshes/site/layout.json        (her mesh icin UE konumu, cm)

Sahne cercevesi (UE, cm): X = grid kuzey (goruntu yukari), Y = grid dogu (goruntu sag), Z = yukari. Z sifiri = Z_REF m.
glTF konumu (X, Z, Y) metre -> Unreal ice aktarimi UE=(gx, gz, gy) x100 yapar. UV: u=sutun/(N-1), v=satir/(N-1).
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from glb_writer import write_glb

ROOT = Path(__file__).resolve().parent.parent
SITE = sys.argv[1] if len(sys.argv) > 1 else "leibnitz-beta-plateau"      # kullanim: make_site_tiles.py [saha-kimligi]
T = ROOT / "data" / "unreal" / "terrain" / SITE
OUT = ROOT / "data" / "unreal" / "meshes" / ("site" if SITE == "leibnitz-beta-plateau" else SITE)
Z_REF = 5400.0
TILE = 1009          # kose / karo kenari (1008 hucre)
OUTER_DROP = 2.0     # dis mesh odak bolgenin altina bu kadar m indirilir


def load_height(fname, spec):
    a = np.asarray(Image.open(T / fname), dtype=np.float32)
    return spec["z_min_m"] + a / 65535.0 * (spec["z_max_m"] - spec["z_min_m"])


def grid_arrays(x, y, z, nrm, u, v):
    """x,y,z,u,v: (R,C); nrm: (R,C,3) (X,Y,Z). Dondurur: glTF pos, nrm, uv, idx."""
    R, C = x.shape
    pos = np.stack([x, z, y], axis=-1).reshape(-1, 3)          # glTF (X, Z, Y)
    nr = np.stack([nrm[..., 0], nrm[..., 2], nrm[..., 1]], axis=-1).reshape(-1, 3)
    uv = np.stack([u, v], axis=-1).reshape(-1, 2)
    rr, cc = np.meshgrid(np.arange(R - 1), np.arange(C - 1), indexing="ij")
    i0 = (rr * C + cc).ravel()
    i1, i2, i3 = i0 + 1, i0 + C, i0 + C + 1
    a = np.stack([i0, i2, i1], -1)
    b = np.stack([i1, i2, i3], -1)
    idx = np.concatenate([a, b], axis=0)
    # sarimi dogrula: ilk ucgenin glTF normalinin y bileseni > 0 olmali (yukari)
    p0, p1, p2 = pos[idx[0, 0]], pos[idx[0, 1]], pos[idx[0, 2]]
    if np.cross(p1 - p0, p2 - p0)[1] < 0:
        idx = idx[:, ::-1]
    return pos, nr, uv, idx


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta = json.loads((T / "terrain.json").read_text(encoding="utf-8"))
    global Z_REF
    f, fu = meta["focus"], meta.get("full")
    Z_REF = float(f.get("z_ref_m", Z_REF))
    layout = {"z_ref_m": Z_REF, "meshes": []}
    drop = float(meta.get("core", {}).get("outer_drop_m", 0.0))     # ayrintili cekirdek varsa kaba mesh bu kadar alcaltilir (z-fight yok)

    # ---------------- odak (1 m) ----------------
    h = load_height("height_focus.png", f)
    N = h.shape[0]
    px = f["pixel_m"]
    dr, dc = np.gradient(h, px)                       # dh/dsatir, dh/dsutun (metre basina)
    nrm_all = np.stack([dr, -dc, np.ones_like(h)], axis=-1)
    nrm_all /= np.linalg.norm(nrm_all, axis=-1, keepdims=True)
    rows = np.arange(N)[:, None] * np.ones((1, N))
    cols = np.ones((N, 1)) * np.arange(N)[None, :]
    X_all = (N - 1 - rows) * px
    Y_all = cols * px
    U_all = cols * px                                 # UV metre cinsinden (iyi kosullanmis tangent icin)
    V_all = rows * px
    step = TILE - 1
    ntile = (N - 1) // step
    for ti in range(ntile):
        for tj in range(ntile):
            r0, c0 = ti * step, tj * step
            sl = (slice(r0, r0 + TILE), slice(c0, c0 + TILE))
            Xo, Yo = X_all[r0 + step, c0], Y_all[r0, c0]          # karo min kose (X min = en guney satir)
            pos, nr, uv, idx = grid_arrays(X_all[sl] - Xo, Y_all[sl] - Yo, h[sl] - Z_REF - drop, nrm_all[sl], U_all[sl], V_all[sl])
            name = f"focus_{ti}_{tj}"
            write_glb(OUT / f"{name}.glb", pos, nr, uv, idx, name=name)
            layout["meshes"].append({"name": name, "origin_cm": [float(Xo * 100), float(Yo * 100), 0.0]})
            print(name, "yazildi", len(pos), "kose")

    if fu is not None:
        # ---------------- dis alan (16 km, 4'te 1 ornek) ----------------
        hf = load_height("height_full.png", fu)
        sub = 4
        hs = hf[::sub, ::sub]
        Nf = hf.shape[0]
        pxo = fu["pixel_m"] * sub
        n = hs.shape[0]
        rr = (np.arange(n)[:, None] * np.ones((1, n))) * sub
        cc = (np.ones((n, 1)) * np.arange(n)[None, :]) * sub
        # tam alan grid konumlari -> odak bolgeyle ortak cerceve (X: kuzey, Y: dogu)
        fx0, fy0 = f["origin_xy_m"]
        win = f["window_in_full_px"][2]
        fy_bottom = fy0 - win * fu["real_pixel_m"]
        gx = fu["origin_xy_m"][0] + cc * fu["pixel_m"]
        gy = fu["origin_xy_m"][1] - rr * fu["pixel_m"]
        Xw, Yw = gy - fy_bottom, gx - fx0
        dro, dco = np.gradient(hs, pxo)
        nrm_o = np.stack([dro, -dco, np.ones_like(hs)], axis=-1)
        nrm_o /= np.linalg.norm(nrm_o, axis=-1, keepdims=True)
        Xo, Yo = float(Xw.min()), float(Yw.min())
        pos, nr, uv, idx = grid_arrays(Xw - Xo, Yw - Yo, hs - Z_REF - OUTER_DROP, nrm_o, Yw, (N - 1) * px - Xw)      # ayni metre-UV cercevesi (odakla surekli)
        write_glb(OUT / "outer.glb", pos, nr, uv, idx, name="outer")
        layout["meshes"].append({"name": "outer", "origin_cm": [Xo * 100, Yo * 100, 0.0]})
        print("outer yazildi", len(pos), "kose; X", Xo, "Y", Yo)

    layout["focus_size_m"] = (N - 1) * px
    layout["focus_pixel_m"] = px
    # makro albedo, dunya konumundan ornekleniyor: u=(Y-Y0)/S, v=(Xtop-X)/S (cm)
    layout["macro_focus"] = {"y0_cm": 0.0, "xtop_cm": (N - 1) * px * 100, "size_cm": (N - 1) * px * 100}
    if fu is not None:
        layout["macro_outer"] = {"y0_cm": float(Yw.min() * 100), "xtop_cm": float(Xw.max() * 100),
                                 "size_cm": float(fu["pixel_m"] * (Nf - 1) * 100)}
    (OUT / "layout.json").write_text(json.dumps(layout, indent=2), encoding="utf-8")
    print("layout.json yazildi")


if __name__ == "__main__":
    main()
