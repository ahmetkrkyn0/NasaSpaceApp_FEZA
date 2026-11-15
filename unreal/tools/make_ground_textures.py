"""Prosedurel, dikisiz (tileable) ay regolit dokulari: 3 olcek (normal haritasi) + 2 albedo modulasyonu.

Cikti: data/unreal/textures/ground_L{1,2,3}_N.png (DirectX normal, UE), ground_L{1,2}_A.png (gri; 0.5 = ortalama)
Her olcek: bant sinirli fraktal yukselti + cukurlar (oyuklar, kenar halkali) + yuvarlak kucuk kaya/topak tumsekleri.
Kenarlar sarmal (wrap): FFT gurultusu periyodik, cukur/tumsekler modulo ile yazilir.
Normal (DirectX, UV v asagi): n = (-dH/dcol, -dH/drow, 1).
"""
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_site_terrain import fractal_noise  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "unreal" / "textures"
N = 2048

# tile_m, taban rms (m), taban lmin/lmax (m), cukur (adet, dmin, dmax m, derinlik/cap), tumsek (adet, dmin, dmax m, yukseklik/cap), normal kazanci
LAYERS = {
    1: dict(tile=24.0, rms=0.045, l=(0.20, 24.0), pits=(900, 0.10, 0.90, 0.14), bumps=(5000, 0.04, 0.16, 0.30), gain=1.0, seed=101),
    2: dict(tile=5.3, rms=0.008, l=(0.025, 5.3), pits=(1100, 0.03, 0.28, 0.16), bumps=(7000, 0.012, 0.06, 0.34), gain=1.0, seed=202),
    3: dict(tile=1.15, rms=0.0022, l=(0.006, 1.15), pits=(700, 0.008, 0.07, 0.18), bumps=(6000, 0.003, 0.022, 0.36), gain=1.0, seed=303),
}


def stamp(h, cy, cx, R, fn):
    """h'ye (cy, cx) merkezli R px yaricapli profili sarmal yazar; fn(r_norm)->yukselti."""
    ext = int(math.ceil(R * 1.6)) + 1
    ri = np.arange(int(cy) - ext, int(cy) + ext + 1)
    ci = np.arange(int(cx) - ext, int(cx) + ext + 1)
    yy, xx = np.meshgrid(ri, ci, indexing="ij")
    r = np.hypot(yy - cy, xx - cx) / max(R, 0.5)
    h[np.ix_(ri % h.shape[0], ci % h.shape[1])] += fn(r).astype(np.float32)


def build(k, p):
    rng = np.random.default_rng(p["seed"])
    px = p["tile"] / N
    h = fractal_noise((N, N), px, rng, rms=p["rms"], lmin=p["l"][0], lmax=p["l"][1], amp_exp=1.5)
    cnt, dmin, dmax, ratio = p["pits"]
    for _ in range(cnt):                                         # cukurlar: kucuk cap cok, buyuk az
        D = dmin * (dmax / dmin) ** (rng.random() ** 1.8)
        R = D / 2 / px
        dep = ratio * D * rng.uniform(0.5, 1.2)
        rim = 0.12 * dep

        def prof(r, dep=dep, rim=rim):
            return np.where(r < 1.0, -dep * (1 - np.minimum(r, 1.0) ** 2) ** 1.3, 0.0) + rim * np.exp(-(((r - 1.05) / 0.28) ** 2))
        stamp(h, rng.random() * N, rng.random() * N, R, prof)
    cnt, dmin, dmax, ratio = p["bumps"]
    for _ in range(cnt):                                         # yuvarlak tas/topak tumsekleri
        D = dmin * (dmax / dmin) ** (rng.random() ** 1.5)
        R = D / 2 / px
        top = ratio * D * rng.uniform(0.5, 1.3)

        def prof(r, top=top):
            return np.where(r < 1.0, top * np.sqrt(np.clip(1 - r ** 2, 0, 1)), 0.0)
        stamp(h, rng.random() * N, rng.random() * N, R, prof)

    gc = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) / (2 * px)       # sarmal merkezi fark (kenar dikisi yok)
    gr = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) / (2 * px)
    nn = np.stack([-gc * p["gain"], -gr * p["gain"], np.ones_like(gc)], -1)
    nn /= np.linalg.norm(nn, axis=-1, keepdims=True)
    Image.fromarray(((nn * 0.5 + 0.5) * 255 + 0.5).astype(np.uint8)).save(OUT / f"ground_L{k}_N.png")

    sig = max(2.0, 0.02 / px) if k == 1 else (max(2.0, 0.006 / px) if k == 2 else 3.0)
    cav = h - gaussian_filter(h, sig, mode="wrap")               # ic bukey: cukurda koyu, tumsekte acik
    a = np.clip(0.5 + 0.5 * cav / (2.2 * cav.std()), 0, 1)
    if k <= 2:
        Image.fromarray((a * 255 + 0.5).astype(np.uint8)).save(OUT / f"ground_L{k}_A.png")
    slope = np.degrees(np.arctan(np.hypot(gc, gr)))
    print(f"L{k}: tile {p['tile']} m, px {px * 1000:.2f} mm, rms {h.std() * 100:.2f} cm, egim ort {slope.mean():.1f} derece p95 {np.percentile(slope, 95):.0f}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for k, p in LAYERS.items():
        build(k, p)


if __name__ == "__main__":
    main()
