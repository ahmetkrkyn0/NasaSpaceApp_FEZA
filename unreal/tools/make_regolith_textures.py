"""Regolit icin kusursuz dosenebilir detay dokulari (numpy, FFT + cakil/cukur damgalari).

Cikti (data/unreal/textures/):
  regolith_d1_n.png  2048x2048 normal (UE/DirectX: R=-dh/dsutun, G=-dh/dsatir), periyot 2.0 m  (cakil, cukur, 1 mm/px)
  regolith_d1_a.png  2048x2048 gri parlaklik varyasyonu (0.5 = degismez)
  regolith_d2_n.png  1024x1024 normal, periyot 0.30 m (kum tanesi, 0.3 mm/px)
Tum doku sarmalidir (kenar dikisi yok).
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "unreal" / "textures"
rng = np.random.default_rng(20261201)


def fractal(n, period_m, rms_m, lam_min_m, lam_max_m, amp_exp):
    """Sarmal gurultu (periyodik): dalga boyu araligi sinirli, rms_m metre."""
    f = np.fft.fftfreq(n, d=period_m / n)
    fx, fy = f[None, :], f[:, None]
    fr = np.hypot(fx, fy)
    fr[0, 0] = 1.0
    spec = (rng.standard_normal((n, n)) + 1j * rng.standard_normal((n, n))) * fr ** -amp_exp
    spec[(fr > 1.0 / lam_min_m) | (fr < 1.0 / lam_max_m)] = 0.0
    spec[0, 0] = 0.0
    a = np.real(np.fft.ifft2(spec))
    return (a * (rms_m / a.std())).astype(np.float32)


def stamp(h, n, count, r_lo_px, r_hi_px, height_ratio, sign, exp=2.0):
    """h uzerine sarmal damgalar: kubbe (sign=+1, cakil) veya cukur (sign=-1)."""
    r_px = np.exp(rng.uniform(np.log(r_lo_px), np.log(r_hi_px), count))
    cy = rng.integers(0, n, count)
    cx = rng.integers(0, n, count)
    el = rng.uniform(0.6, 1.0, count)                       # basiklik
    th = rng.uniform(0, np.pi, count)
    for i in range(count):
        r = r_px[i]
        e = int(np.ceil(r * 1.3)) + 1
        yy, xx = np.mgrid[-e:e + 1, -e:e + 1].astype(np.float32)
        c, s = np.cos(th[i]), np.sin(th[i])
        u = (xx * c + yy * s) / r
        v = (-xx * s + yy * c) / (r * el[i])
        q = np.clip(1.0 - (u * u + v * v), 0.0, None)
        patch = sign * height_ratio * r * np.power(q, 1.0 / exp)
        ys = (cy[i] + np.arange(-e, e + 1)) % n
        xs = (cx[i] + np.arange(-e, e + 1)) % n
        h[np.ix_(ys, xs)] += patch.astype(np.float32)
    return h


def normal_map(h, px_m):
    dc = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) / (2 * px_m)
    dr = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) / (2 * px_m)
    n = np.stack([-dc, -dr, np.ones_like(h)], axis=-1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return ((n * 0.5 + 0.5) * 255 + 0.5).astype(np.uint8)


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    # ---- D1: periyot 2 m, 2048 px (1 mm/px) ----
    n, period = 2048, 2.0
    px_m = period / n
    h = fractal(n, period, 0.009, 0.006, 0.8, 1.5)                 # dalgali kumsu zemin
    h = stamp(h, n, 1400, 2.0, 11.0, 0.40, +1)                     # cakillar: yaricap 2-11 mm
    h = stamp(h, n, 110, 6.0, 28.0, 0.08, -1)                      # kucuk cukurlar: yaricap 6-28 mm
    h = stamp(h, n, 14, 25.0, 60.0, 0.35, +1)                      # birkac buyuk tas: yaricap 2.5-6 cm
    Image.fromarray(normal_map(h, px_m)).save(OUT / "regolith_d1_n.png")
    a = 0.5 + 0.18 * fractal(n, period, 1.0, 0.01, 1.0, 1.2)       # parlaklik lekeleri
    a += 0.9 * (h - np.roll(h, 3, 0)) * 3.0                         # hafif yerel golge ipucu
    a = np.clip(a, 0.15, 0.85)
    Image.fromarray((a * 255 + 0.5).astype(np.uint8)).save(OUT / "regolith_d1_a.png")

    # ---- D2: periyot 0.30 m, 1024 px (0.29 mm/px) ----
    n2, period2 = 1024, 0.30
    px2 = period2 / n2
    h2 = fractal(n2, period2, 0.0018, 0.0008, 0.06, 1.3)
    h2 = stamp(h2, n2, 1500, 1.5, 6.0, 0.6, +1)                    # kum/cakil tanesi: yaricap 0.4-1.8 mm
    h2 = stamp(h2, n2, 120, 4.0, 14.0, 0.25, -1)
    Image.fromarray(normal_map(h2, px2)).save(OUT / "regolith_d2_n.png")
    print("yazildi:", [p.name for p in sorted(OUT.glob("regolith_*.png"))])


if __name__ == "__main__":
    main()
