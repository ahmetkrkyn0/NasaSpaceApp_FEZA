"""Prosedurel inis sahasinin ayrintili cekirdegi (1 km, 0.5 m aralik) + yogun, acisal kaya mesh'leri.

Girdi : make_procedural_landscape.py ciktisi (data/unreal/terrain/<saha>/height_focus.png + terrain.json)
Cikti : height_core.npy (2017^2 float32), terrain.json'a "core" anahtari, rocks_ue.csv (tarama kayalari),
        data/unreal/meshes/<saha>/{focus_i_j.glb (kaba, 0.3 m alcaltilmis), core_i_j.glb, rocks*_i_j.glb, rockso_i_j.glb, layout.json}
Kayalar: dis bukey (convex hull) ile uretilmis acisal tas sablonlari; her kaya olcekli/doner ornek; parcalar birlestirilip
         126 m'lik hucreler halinde tek mesh (COLOR_0 = kaya basina ton). Duz golgeleme (Apollo fotograflarindaki acisal kayalar).
Cerceve: glTF (X, Y yukari, Z) = UE (X kuzey, Z yukari, Y dogu); metre. UV metre cinsinden (mutlak).
Kullanim: python make_site_detail.py site-craters
"""
import csv
import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates
from scipy.spatial import ConvexHull

sys.path.insert(0, str(Path(__file__).resolve().parent))
from glb_writer import write_glb  # noqa: E402
from make_site_terrain import add_craters, fractal_noise  # noqa: E402
from make_site_tiles import grid_arrays  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
N_OUT, PX_OUT = 3025, 2.0
CORE_PX, CORE_N = 0.5, 2017
WIN0 = 1260                       # cekirdek penceresi: dis grid satir/sutun 1260..1764 (505 px = 1008 m)
OUTER_DROP = 0.3
TILE = 1009
SEEDS = {"site-craters": 7, "site-plains": 8, "site-ridges": 9}

# tur -> (ince rms m, krater n10 /km^2, krater dmax, b, kaya yogunlugu n0 (D>=10cm, 1/m^2), gunes el)
KINDS = {
    "craters": dict(drms=0.14, n10=260.0, dmax=50.0, b=1.5, n0=1.0, sun_el=11.0),
    "plains": dict(drms=0.07, n10=110.0, dmax=40.0, b=1.7, n0=0.6, sun_el=13.0),
    "ridges": dict(drms=0.12, n10=200.0, dmax=45.0, b=1.6, n0=1.2, sun_el=11.0),
}
Q = 2.2                           # kumulatif boyut-frekans ussu
TIERS = [(0.05, 0.10, 28.0), (0.10, 0.25, 75.0), (0.25, 0.70, 210.0), (0.70, 3.0, 520.0)]   # Dlo, Dhi, yaricap m
HULL_BY_D = ((14, 0.0, 0.12), (20, 0.12, 0.40), (32, 0.40, 1.00), (48, 1.00, 99.0))       # D'ye gore hull nokta sayisi (az nokta = piramit gorunur)
CHUNK = 126.0


def smoothstep(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def make_template(rng, npts):
    d = rng.normal(size=(npts, 3))
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    r = np.ones(npts)
    for k, amp in ((2.0, 0.16), (3.5, 0.10), (6.0, 0.06)):             # yumusak dalgalar: tek tepeli (piramit) olmayan, duzensiz acisal govde
        u = rng.normal(size=3)
        u /= np.linalg.norm(u)
        r += amp * np.cos(k * (d @ u) * np.pi + rng.uniform(0, 2 * np.pi))
    r *= 1.0 + 0.07 * rng.standard_normal(npts)                          # ince yuzey kirintisi
    pts = d * np.clip(r, 0.55, 1.5)[:, None] * np.array([1.0, rng.uniform(0.42, 0.78), rng.uniform(0.62, 1.0)])   # (x, y yukari, z)
    pts[:, 1] = np.where(pts[:, 1] < -0.10, -0.10 - 0.25 * (-0.10 - pts[:, 1]), pts[:, 1])      # alt taraf duzlesir (gomulu)
    tri = ConvexHull(pts).simplices.copy()
    c = pts.mean(0)
    p0, p1, p2 = pts[tri[:, 0]], pts[tri[:, 1]], pts[tri[:, 2]]
    out = np.einsum("ij,ij->i", np.cross(p1 - p0, p2 - p0), (p0 + p1 + p2) / 3 - c) < 0
    tri[out] = tri[out][:, ::-1]                       # CCW-dis (glTF sagak el)
    lo, hi = pts.min(0), pts.max(0)
    pts = (pts - (lo + hi) / 2) / max(hi[0] - lo[0], hi[2] - lo[2])
    P = pts[tri]                                       # (F, 3, 3)
    nrm = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0])
    ax = np.argmax(np.abs(nrm), axis=1)                # kutu izdusumu UV (birim; D ile carpilir)
    uv = np.empty((len(P), 3, 2), np.float32)
    for a in range(3):
        m = ax == a
        o = [i for i in range(3) if i != a]
        uv[m] = P[m][:, :, o]
    return P.astype(np.float32), uv


def rot_mats(yaw, tx, tz):
    cy, sy, cx, sx, cz, sz = np.cos(yaw), np.sin(yaw), np.cos(tx), np.sin(tx), np.cos(tz), np.sin(tz)
    n = len(yaw)
    Ry = np.zeros((n, 3, 3)); Ry[:, 0, 0] = cy; Ry[:, 0, 2] = sy; Ry[:, 1, 1] = 1; Ry[:, 2, 0] = -sy; Ry[:, 2, 2] = cy
    Rx = np.zeros((n, 3, 3)); Rx[:, 0, 0] = 1; Rx[:, 1, 1] = cx; Rx[:, 1, 2] = -sx; Rx[:, 2, 1] = sx; Rx[:, 2, 2] = cx
    Rz = np.zeros((n, 3, 3)); Rz[:, 2, 2] = 1; Rz[:, 0, 0] = cz; Rz[:, 0, 1] = -sz; Rz[:, 1, 0] = sz; Rz[:, 1, 1] = cz
    return Ry @ Rx @ Rz


def build_chunk(path, name, rocks, templates, origin, zref, rng):
    """rocks: x,y (mutlak m), z (zemin m), dy, D, tid, yaw dizileri. Tek GLB yazar; kose sayisi dondurur."""
    n = len(rocks["D"])
    if n == 0:
        return 0
    pos_l, nrm_l, uv_l, col_l = [], [], [], []
    tone = np.clip(rng.lognormal(0.0, 0.30, n), 0.5, 1.7)
    for t in range(len(templates)):
        sel = np.flatnonzero(rocks["tid"] == t)
        if len(sel) == 0:
            continue
        P, UV = templates[t]
        F = len(P)
        D = rocks["D"][sel]
        s = np.stack([D, D * rng.uniform(0.75, 1.2, len(sel)), D * rng.uniform(0.8, 1.15, len(sel))], 1)
        R = rot_mats(rocks["yaw"][sel], rng.uniform(-0.35, 0.35, len(sel)), rng.uniform(-0.35, 0.35, len(sel)))
        loc = P[None] * s[:, None, None, :]                              # (r, F, 3, 3)
        w = np.einsum("rij,rfvj->rfvi", R, loc)
        base = np.stack([rocks["x"][sel] - origin[0], rocks["z"][sel] - zref + rocks["dy"][sel], rocks["y"][sel] - origin[1]], 1)
        tri = (w + base[:, None, None, :]).reshape(-1, 3, 3)
        nn = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
        nn /= np.maximum(np.linalg.norm(nn, axis=1, keepdims=True), 1e-9)
        pos_l.append(tri.reshape(-1, 3))
        nrm_l.append(np.repeat(nn, 3, axis=0))
        uv_l.append((UV[None] * D[:, None, None, None]).reshape(-1, 2) + 0.37 * np.repeat(sel, F * 3)[:, None])
        c = tone[sel]
        col_l.append(np.repeat(np.stack([c, c * 0.97, c * 0.93, np.ones_like(c)], 1), F * 3, axis=0))
    pos = np.concatenate(pos_l).astype(np.float32)
    idx = np.arange(len(pos), dtype=np.uint32).reshape(-1, 3)
    write_glb(path, pos, np.concatenate(nrm_l), np.concatenate(uv_l), idx, name=name, color=np.concatenate(col_l))
    return len(pos)


def main():
    site = sys.argv[1]
    T = ROOT / "data" / "unreal" / "terrain" / site
    M = ROOT / "data" / "unreal" / "meshes" / site
    meta = json.loads((T / "terrain.json").read_text(encoding="utf-8"))
    kp = KINDS[meta["kind"]]
    f = meta["focus"]
    zref = float(f["z_ref_m"])
    rng = np.random.default_rng(SEEDS[site])
    a = np.asarray(Image.open(T / "height_focus.png"), dtype=np.float32)
    ho = f["z_min_m"] + a / 65535.0 * (f["z_max_m"] - f["z_min_m"])

    # ---- cekirdek yukseklik: dis alan bikubik x4 + ince detay + kenarda 0.3 m alcalma ----
    ax = WIN0 + np.linspace(0, 504, CORE_N)
    rr, cc = np.meshgrid(ax, ax, indexing="ij")
    up = map_coordinates(ho, [rr, cc], order=3, mode="nearest").astype(np.float32)
    det = fractal_noise((CORE_N, CORE_N), CORE_PX, rng, rms=kp["drms"], lmin=1.5, lmax=60.0, amp_exp=1.5)
    nc = add_craters(det, CORE_PX, rng, dmin=2.0, dmax=kp["dmax"], n10=kp["n10"], b=kp["b"], max_age=2.0)
    ii = np.arange(CORE_N)
    edge = np.minimum(ii, CORE_N - 1 - ii) * CORE_PX
    e = np.minimum(edge[:, None], edge[None, :])
    w = smoothstep(e / 45.0).astype(np.float32)
    core = (up + det * w - OUTER_DROP * (1 - w)).astype(np.float32)
    X0 = (N_OUT - 1 - (WIN0 + 504)) * PX_OUT        # cekirdek guney kenari (m)
    Y0 = WIN0 * PX_OUT
    lander = meta.get("lander")
    if lander:                                                     # Athena altinda zemini duzlestir (r<2.8 m duz, 7 m'de dogal arazi)
        yy_, xx_ = np.meshgrid(np.arange(CORE_N), np.arange(CORE_N), indexing="ij")
        gx_ = Y0 + xx_ * CORE_PX
        gxn = X0 + (CORE_N - 1 - yy_) * CORE_PX
        dl = np.hypot(gxn - lander["x_m"], gx_ - lander["y_m"])
        base = float(core[dl < 2.8].mean())
        wl = 1.0 - smoothstep((dl - 2.8) / 4.2)
        core = (core * (1 - wl) + base * wl).astype(np.float32)
        lander["z_cm"] = (base - float(f["z_ref_m"])) * 100.0
    np.save(T / "height_core.npy", core)
    cx_, cy_ = X0 + 504.0, Y0 + 504.0
    print(f"{site}: cekirdek {CORE_N}^2, {nc} ince krater, X0 {X0} Y0 {Y0}, z {core.min():.1f}..{core.max():.1f}")

    def hcore(x, y):
        x, y = np.atleast_1d(x), np.atleast_1d(y)
        return map_coordinates(core, [(CORE_N - 1) - (x - X0) / CORE_PX, (y - Y0) / CORE_PX], order=1, mode="nearest")

    def houter(x, y):
        return map_coordinates(ho, [(N_OUT - 1) - x / PX_OUT, y / PX_OUT], order=1, mode="nearest") - OUTER_DROP

    meta["core"] = {"file": "height_core.npy", "size_px": CORE_N, "pixel_m": CORE_PX, "origin_xy_m": [X0, Y0], "outer_drop_m": OUTER_DROP}
    meta["ground_center_cm"][2] = (float(core[CORE_N // 2, CORE_N // 2]) - zref) * 100.0
    (T / "terrain.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    # ---- kaba (dis) mesh'ler: make_site_tiles (cekirdek meta'si varken 0.3 m alcaltir) ----
    subprocess.run([sys.executable, str(Path(__file__).with_name("make_site_tiles.py")), site], check=True)
    layout = json.loads((M / "layout.json").read_text(encoding="utf-8"))

    # ---- cekirdek karolari (2 x 2, 1009 kose) ----
    gr, gc = np.gradient(core, CORE_PX)
    nrm_all = np.stack([gr, -gc, np.ones_like(core)], -1)
    nrm_all /= np.linalg.norm(nrm_all, axis=-1, keepdims=True)
    rows = np.arange(CORE_N)[:, None] * np.ones((1, CORE_N))
    cols = np.ones((CORE_N, 1)) * np.arange(CORE_N)[None, :]
    Xa = X0 + (CORE_N - 1 - rows) * CORE_PX
    Ya = Y0 + cols * CORE_PX
    Va = (N_OUT - 1) * PX_OUT - Xa
    step = TILE - 1
    for ti in range(2):
        for tj in range(2):
            r0, c0 = ti * step, tj * step
            sl = (slice(r0, r0 + TILE), slice(c0, c0 + TILE))
            Xo, Yo = Xa[r0 + step, c0], Ya[r0, c0]
            pos, nr, uv, idx = grid_arrays(Xa[sl] - Xo, Ya[sl] - Yo, core[sl] - zref, nrm_all[sl], Ya[sl], Va[sl])
            nm = f"core_{ti}_{tj}"
            write_glb(M / f"{nm}.glb", pos, nr, uv, idx, name=nm)
            layout["meshes"].append({"name": nm, "origin_cm": [float(Xo * 100), float(Yo * 100), 0.0], "kind": "core"})

    templates = {hp: [make_template(rng, hp) for _ in range(24)] for hp, _, _ in HULL_BY_D}

    # ---- kaya konumlari (boyuta gore kademeli yogunluk, kumelenmeli) ----
    g = fractal_noise((252, 252), 4.0, rng, rms=1.0, lmin=10.0, lmax=250.0, amp_exp=1.5)
    acc_field = np.clip(np.exp(1.3 * g) / np.exp(1.3 * 2.0), 0, 1)
    mean_acc = float(acc_field.mean())
    xs, ys, ds = [], [], []
    for dlo, dhi, rad in TIERS:
        dens = kp["n0"] * ((dlo / 0.1) ** -Q - (dhi / 0.1) ** -Q)
        half = min(rad, 504.0)
        ncand = int(dens * (2 * half) ** 2 / mean_acc)
        x = cx_ + rng.uniform(-half, half, ncand)
        y = cy_ + rng.uniform(-half, half, ncand)
        r = np.hypot(x - cx_, y - cy_)
        ai = (np.clip(((x - X0) / 4.0).astype(int), 0, 251), np.clip(((y - Y0) / 4.0).astype(int), 0, 251))
        keep = (r < rad) & (r > 3.0) & (rng.random(ncand) < acc_field[ai])
        if lander:
            keep &= np.hypot(x - lander["x_m"], y - lander["y_m"]) > 6.5
        x, y = x[keep], y[keep]
        u = rng.random(len(x))
        xs.append(x); ys.append(y)
        ds.append(dlo * (1 - u * (1 - (dlo / dhi) ** Q)) ** (-1.0 / Q))
    R_ = {"x": np.concatenate(xs), "y": np.concatenate(ys), "D": np.concatenate(ds)}
    print("kaya (cekirdek):", len(R_["D"]), "| D>=0.25:", int((R_["D"] >= 0.25).sum()), "| D>=1:", int((R_["D"] >= 1.0).sum()))

    # tarama kayalari (Poly Haven) icin en yakin 450 buyuk kaya: prosedurelden cikarilir
    dist = np.hypot(R_["x"] - cx_, R_["y"] - cy_)
    cand = np.flatnonzero((R_["D"] >= 0.30) & (dist < 260.0))
    scan = cand[np.argsort(dist[cand])[:1500]]       # gercek tarama kayalari (Poly Haven) yakin ve orta mesafede
    with open(T / "rocks_ue.csv", "w", newline="") as fh:
        wr = csv.writer(fh)
        wr.writerow(["x_cm", "y_cm", "z_cm", "diameter_m", "variant", "yaw_deg"])
        for i in scan:
            D = min(float(R_["D"][i]), 1.8)
            wr.writerow([round(float(R_["x"][i]) * 100, 1), round(float(R_["y"][i]) * 100, 1),
                         round((float(hcore(R_["x"][i], R_["y"][i])[0]) - zref) * 100 - D * 14, 1), round(D, 2),
                         int(rng.integers(0, 7)), round(float(rng.uniform(0, 360)), 1)])
    mask = np.ones(len(R_["D"]), bool)
    mask[scan] = False
    R_ = {k: v[mask] for k, v in R_.items()}
    n = len(R_["D"])
    R_["tid"] = rng.integers(0, 24, n)
    zs = np.stack([hcore(R_["x"] + dx * R_["D"] * 0.4, R_["y"] + dy * R_["D"] * 0.4) for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1))])
    R_["z"] = zs.min(0)
    R_["dy"] = 0.05 * R_["D"]
    R_["yaw"] = rng.uniform(0, 2 * math.pi, n)

    # ---- cekirdek kaya hucreleri ----
    nverts = 0
    ci_ = np.floor((R_["x"] - X0) / CHUNK).astype(int)
    cj_ = np.floor((R_["y"] - Y0) / CHUNK).astype(int)
    for i in range(int(ci_.max()) + 1):
        for j in range(int(cj_.max()) + 1):
            sel = np.flatnonzero((ci_ == i) & (cj_ == j))
            for hp, lo, hi in HULL_BY_D:
                s2 = sel[(R_["D"][sel] >= lo) & (R_["D"][sel] < hi)]
                if len(s2) == 0:
                    continue
                Xo, Yo = X0 + i * CHUNK, Y0 + j * CHUNK
                nm = f"rocks{hp}_{i}_{j}"
                nverts += build_chunk(M / f"{nm}.glb", nm, {k: v[s2] for k, v in R_.items()}, templates[hp], (Xo, Yo), zref, rng)
                layout["meshes"].append({"name": nm, "origin_cm": [float(Xo * 100), float(Yo * 100), 0.0], "kind": "rock"})

    # ---- dis kayalar (D >= 2 m, cekirdek disi) ----
    CELL = 1008.0
    n_out = int(kp["n0"] * 0.12 * ((2.0 / 0.1) ** -Q - (6.0 / 0.1) ** -Q) * (6048.0 ** 2))
    x = rng.uniform(0, 6048, n_out)
    y = rng.uniform(0, 6048, n_out)
    inside = (x > X0) & (x < X0 + 1008) & (y > Y0) & (y < Y0 + 1008)
    x, y = x[~inside], y[~inside]
    D = 2.0 * (1 - rng.random(len(x)) * (1 - (2.0 / 6.0) ** Q)) ** (-1.0 / Q)
    O = {"x": x, "y": y, "D": D, "tid": rng.integers(0, 24, len(x)), "dy": 0.05 * D, "yaw": rng.uniform(0, 2 * math.pi, len(x)), "z": houter(x, y)}
    oi, oj = np.floor(x / CELL).astype(int), np.floor(y / CELL).astype(int)
    for i in range(6):
        for j in range(6):
            sel = np.flatnonzero((oi == i) & (oj == j))
            if len(sel) == 0:
                continue
            nm = f"rockso_{i}_{j}"
            nverts += build_chunk(M / f"{nm}.glb", nm, {k: v[sel] for k, v in O.items()}, templates[48], (i * CELL, j * CELL), zref, rng)
            layout["meshes"].append({"name": nm, "origin_cm": [float(i * CELL * 100), float(j * CELL * 100), 0.0], "kind": "rock"})
    print("dis kaya:", len(x), "| toplam kaya kosesi:", nverts)

    (M / "layout.json").write_text(json.dumps(layout, indent=2), encoding="utf-8")
    print("layout.json guncellendi, mesh sayisi", len(layout["meshes"]))


if __name__ == "__main__":
    main()
