"""Uzay sahnesi dokulari (prosedurel): yildiz alani (equirect RGB) ve Dunya bulut maskesi (equirect, gri).

Cikti: data/unreal/textures/stars_8k.png (8192x4096, sRGB), clouds_8k.png (8192x4096, gri maske)
Yildizlar: kutle fonksiyonuna benzer buyukluk dagilimi, sicakliga gore renk, ince Samanyolu bandi (egik duzlem, fraktal gurultu).
Bulutlar : iki olcekli fraktal gurultu + enleme gore kusaklar (ekvator yogun, ozel enlemler seyrek, 50-60 derece firtina kusagi). Boylamda dikissiz.
Kullanim: python tools/make_stars_clouds.py
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_site_terrain import fractal_noise  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "unreal" / "textures"
W, H = 8192, 4096
Image.MAX_IMAGE_PIXELS = None


def stars():
    rng = np.random.default_rng(2026)
    img = np.zeros((H, W, 3), np.float32)
    # Samanyolu: galaktik duzlem (egik buyuk daire) etrafinda yumusak bant
    lon = (np.arange(W)[None, :] / W) * 2 * np.pi
    lat = (0.5 - np.arange(H)[:, None] / H) * np.pi
    nx, ny, nz = np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat)
    pole = np.array([0.0, -np.sin(np.radians(62.0)), np.cos(np.radians(62.0))])
    d = nx * pole[0] + ny * pole[1] + nz * pole[2]                        # galaktik duzleme uzaklik
    band = np.exp(-(d / 0.11) ** 2)
    cloud = fractal_noise((H // 4, W // 4), 1.0, rng, rms=1.0, lmin=3.0, lmax=400.0, amp_exp=1.6)
    cloud = np.array(Image.fromarray(cloud).resize((W, H), Image.BICUBIC))
    mw = np.clip(band * (0.55 + 0.45 * np.tanh(cloud * 1.3)), 0, 1)
    img += (mw[..., None] * np.array([0.022, 0.020, 0.018], np.float32))     # soluk sicak parilti
    # yildizlar: parlak az, sonuk cok; bant icinde daha yogun
    n = 26000
    ys = rng.integers(0, H, n)
    xs = rng.integers(0, W, n)
    keep = rng.random(n) < (0.45 + 0.55 * band[ys, xs])
    ys, xs = ys[keep], xs[keep]
    m = rng.random(len(xs)) ** 6.5                                           # buyukluk: cogu sonuk
    bright = 0.30 + 0.70 * m
    temp = rng.random(len(xs))
    col = np.stack([np.where(temp < 0.2, 1.0, 0.82 + 0.18 * temp), 0.9 + 0.1 * (1 - np.abs(temp - 0.5) * 2), np.where(temp > 0.75, 1.0, 0.78 + 0.3 * (1 - temp))], 1)
    layer = np.zeros((H, W, 3), np.float32)
    layer[ys, xs] = col * bright[:, None]
    sharp = gaussian_filter(layer, sigma=(1.1, 1.1, 0)) * 4.0
    big = np.argsort(-bright)[:900]                                           # en parlaklar: daha genis
    L2 = np.zeros_like(layer)
    L2[ys[big], xs[big]] = (col * bright[:, None])[big]
    sharp += gaussian_filter(L2, sigma=(2.2, 2.2, 0)) * 14.0
    img += sharp * 1.0
    return (np.clip(img, 0, 1) ** (1 / 2.2) * 255 + 0.5).astype(np.uint8)


def clouds():
    rng = np.random.default_rng(77)
    base = fractal_noise((H // 2, W // 2), 1.0, rng, rms=1.0, lmin=6.0, lmax=700.0, amp_exp=1.9)
    fine = fractal_noise((H // 2, W // 2), 1.0, rng, rms=1.0, lmin=3.0, lmax=60.0, amp_exp=1.2)
    n = base + 0.3 * fine
    lat = np.degrees((0.5 - (np.arange(H // 2)[:, None] + 0.5) / (H // 2)) * np.pi)
    # enleme gore kusaklar: ekvator (ITCZ) ve 55 derece firtina kusagi yogun, 25 derece civari seyrek
    dens = 0.55 + 0.30 * np.exp(-((lat / 10.0) ** 2)) + 0.30 * np.exp(-(((np.abs(lat) - 55.0) / 14.0) ** 2)) - 0.25 * np.exp(-(((np.abs(lat) - 25.0) / 9.0) ** 2))
    t = -0.55 - 0.9 * (dens - 0.5)                                         # esik: yogun kusakta dusuk
    x = np.clip((n - t) / 2.6, 0.0, 1.0)
    c = x * x * (3 - 2 * x)                                               # yumusak kenar
    c = np.array(Image.fromarray((c * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), np.float32) / 255.0
    c = gaussian_filter(c, 0.8)
    return (np.clip(c, 0, 1) * 255 + 0.5).astype(np.uint8)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    Image.fromarray(stars()).save(OUT / "stars_8k.png")
    Image.fromarray(clouds()).save(OUT / "clouds_8k.png")
    print("stars_8k.png, clouds_8k.png yazildi")


if __name__ == "__main__":
    main()
