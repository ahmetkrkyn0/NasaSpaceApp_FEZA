"""Ay yükseklik haritasından (16 ppd, eşdikdörtgen) küre için normal haritası üretir.

Girdi : data/unreal/textures/moon_height_16ppd.png   (yükseklik_m = değer/2 - 10000)
Çıktı : data/unreal/textures/moon_normal_8k.png      (8192x4096, OpenGL/Unreal tarzı: +Y yukarı)

Boylam yönündeki piksel aralığı enleme göre cos(lat) ile küçülür; kutuplarda 1/cos sınırlanır.
"""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
TEX = ROOT / "data" / "unreal" / "textures"
MOON_R_M = 1_737_400.0
OUT_W, OUT_H = 8192, 4096
STRENGTH = 4.0  # 16 ppd çözünürlüğünde eğimler zayıf; görsel için büyütülür (sadece görünüm)


def main() -> None:
    raw = np.asarray(Image.open(TEX / "moon_height_16ppd.png"), dtype=np.float32)
    h = raw / 2.0 - 10000.0                          # metre
    # Önce yüksekliği hedef boyuta büyüt (bikübik), sonra eğimi hesapla
    h_img = Image.fromarray(h, mode="F").resize((OUT_W, OUT_H), Image.BICUBIC)
    h = np.asarray(h_img, dtype=np.float32)

    lat = (0.5 - (np.arange(OUT_H) + 0.5) / OUT_H) * np.pi          # +90 .. -90
    dy = np.pi * MOON_R_M / OUT_H                                    # m / piksel (kuzey-güney)
    dx = 2.0 * np.pi * MOON_R_M / OUT_W * np.maximum(np.cos(lat), 0.02)  # m / piksel (doğu-batı)

    # Boylamda döngüsel, enlemde kenar farkı
    dzdx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) / (2.0 * dx[:, None])
    dzdy = np.empty_like(h)
    dzdy[1:-1] = (h[:-2] - h[2:]) / (2.0 * dy)       # +y = kuzey (satır azalır)
    dzdy[0] = dzdy[1]
    dzdy[-1] = dzdy[-2]

    nx = -dzdx * STRENGTH
    ny = dzdy * STRENGTH
    nz = np.ones_like(h)
    inv = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz)
    rgb = np.stack([nx * inv, ny * inv, nz * inv], axis=-1) * 0.5 + 0.5
    Image.fromarray((rgb * 255.0 + 0.5).astype(np.uint8)).save(TEX / "moon_normal_8k.png")
    print("yazıldı:", TEX / "moon_normal_8k.png", "| eğim (derece) maks:",
          float(np.degrees(np.arctan(np.hypot(dzdx, dzdy).max()))))


if __name__ == "__main__":
    main()
