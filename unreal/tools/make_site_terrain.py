"""Bir inis sahasi icin Unreal arazi paketi uretir (gercek SfS DEM + sentetik krater/kaya detayi).

Girdi : data/raw/sites/<site>/extracted/<...>/A310_GLDELEV_005.tif, A310_GLDOMOS_005.tif (PGDA SfS, 5 m/px)
Cikti : data/unreal/terrain/<site>/
  height_full.png    16 bit, 4033x4033, tum 16x16 km (gercek DEM, sentetik detay YOK)
  height_focus.png   16 bit, 4033x4033, ~4 km odak bolge, ~1 m/px (gercek DEM buyutulmus + sentetik kraterler)
  albedo_full.png / albedo_focus.png   8 bit gri (ortomozaik)
  rocks.csv          col,row,x_m,y_m,diameter_m,seed (odak bolge, sentetik)
  terrain.json       olcek/konum/z araliklari, kaynak ve atif
Yukseklik kodlamasi: h_m = z_min + v/65535 * (z_max - z_min)  (terrain.json'daki z_min/z_max)

Sentetik detay SADECE gorseldir; ufuk/aydinlanma hesaplari height_full / gercek DEM'den yapilir.
"""
import argparse
import csv
import json
import math
from pathlib import Path

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.windows import from_bounds
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
R_MOON = 1737400.0
N_OUT = 4033                      # Unreal Landscape icin gecerli boyut
CITATION = ("Bertone S. et al. (2026), Enhanced Topography Models for selected Lunar South Pole regions "
            "with Shape-from-Shading, Planetary Science Journal; Zenodo doi:10.5281/zenodo.17954508 (CC-BY-4.0)")


def lonlat(x, y):
    rho = math.hypot(x, y)
    c = 2 * math.atan2(rho, 2 * R_MOON)
    return math.degrees(math.atan2(x, y)), -math.degrees(math.asin(math.cos(c)))


def resize_f(a, n):
    return np.array(Image.fromarray(a.astype(np.float32), mode="F").resize((n, n), Image.BICUBIC), dtype=np.float32)


def save16(a, path, zmin, zmax):
    v = np.clip((a - zmin) / (zmax - zmin), 0.0, 1.0)
    Image.fromarray((v * 65535.0 + 0.5).astype(np.uint16)).save(path)


def slope_deg(z, px):
    gy, gx = np.gradient(z, px)
    return np.degrees(np.arctan(np.hypot(gx, gy)))


def pick_focus(z, px, win_px, min_mean_elev):
    """Ortalama egimi en dusuk, yeterince yuksek (plato) win_px x win_px pencereyi bulur."""
    s = slope_deg(z, px)
    stride = 40
    best = None
    ii = np.pad(np.cumsum(np.cumsum(s, 0), 1), ((1, 0), (1, 0)))
    ie = np.pad(np.cumsum(np.cumsum(z, 0), 1), ((1, 0), (1, 0)))
    margin = 40                                   # DEM kenarindan uzak dur (kenar artefaktlari)
    for r in range(margin, z.shape[0] - win_px - margin, stride):
        for c in range(margin, z.shape[1] - win_px - margin, stride):
            area = win_px * win_px
            ms = (ii[r + win_px, c + win_px] - ii[r, c + win_px] - ii[r + win_px, c] + ii[r, c]) / area
            me = (ie[r + win_px, c + win_px] - ie[r, c + win_px] - ie[r + win_px, c] + ie[r, c]) / area
            if me >= min_mean_elev and (best is None or ms < best[0]):
                best = (ms, me, r, c)
    return best


def fractal_noise(shape, px, rng, rms=0.15, lmin=2.0, lmax=40.0, amp_exp=1.8):
    """Dogal yuzey puruzu: bant sinirli kuvvet yasali gurultu (dalga boyu lmin..lmax m), rms m."""
    ny, nx = shape
    fy = np.fft.fftfreq(ny, d=px)[:, None]
    fx = np.fft.rfftfreq(nx, d=px)[None, :]
    f = np.hypot(fx, fy)
    f[0, 0] = 1.0
    spec = (rng.standard_normal((ny, nx // 2 + 1)) + 1j * rng.standard_normal((ny, nx // 2 + 1))) * f ** -amp_exp
    spec[(f > 1.0 / lmin) | (f < 1.0 / lmax)] = 0.0
    spec[0, 0] = 0.0
    n = np.fft.irfft2(spec, s=(ny, nx)).astype(np.float32)
    return n * (rms / float(n.std()))


def add_craters(h, px, rng, dmin=3.0, dmax=25.0, n10=80.0, b=2.0, max_age=2.6):
    """h (m) uzerine sentetik kraterler ekler. n10: D>=10 m kraterlerin km^2 basina sayisi."""
    area_km2 = (h.shape[0] * px / 1000.0) * (h.shape[1] * px / 1000.0)
    n = int(n10 * (10.0 / dmin) ** b * area_km2 * (1 - (dmin / dmax) ** b))
    u = rng.random(n)
    d = dmin * (1 - u * (1 - (dmin / dmax) ** b)) ** (-1.0 / b)          # kesik guc yasasi
    ys = rng.random(n) * h.shape[0]
    xs = rng.random(n) * h.shape[1]
    age = rng.random(n) ** 0.6 * max_age                                    # cogu yasli (asinmis) krater
    ratio = 0.2 * np.exp(-age)                                              # derinlik/cap (yaslandikca sigla)
    for i in range(n):
        D = d[i]
        Rpx = D / 2.0 / px
        depth = ratio[i] * D
        rim = 0.04 * D * (ratio[i] / 0.2)
        ext = int(math.ceil(Rpx * 3.0)) + 1
        r0, r1 = int(max(0, ys[i] - ext)), int(min(h.shape[0], ys[i] + ext + 1))
        c0, c1 = int(max(0, xs[i] - ext)), int(min(h.shape[1], xs[i] + ext + 1))
        if r1 <= r0 or c1 <= c0:
            continue
        yy, xx = np.mgrid[r0:r1, c0:c1]
        rr = np.hypot(yy - ys[i], xx - xs[i]) / Rpx
        bowl = np.where(rr < 1.0, -depth * (1.0 - rr ** 2), 0.0)
        rimz = rim * np.exp(-(((rr - 1.0) / (0.2 + 0.35 * (1 - ratio[i] / 0.2))) ** 2))   # yasli kraterde genis, yumusak kenar
        ejecta = np.where(rr > 1.0, 0.3 * rim * np.maximum(rr, 1.0) ** -3.0, 0.0) * np.clip((rr - 1.0) / 0.3, 0.0, 1.0)   # sureksizlik (halka) yok
        h[r0:r1, c0:c1] += (bowl + rimz + ejecta).astype(np.float32)
    return n


def make_rocks(h, px, slope, rng, n05=1.0e-3, b=2.6, dmin=0.5, dmax=4.0):
    """Kaya konumlari (sentetik): N(>D) ~ D^-b, egimli yerlerde daha yogun. n05: D>=0.5 m icin 1/m^2."""
    area_m2 = (h.shape[0] * px) * (h.shape[1] * px)
    n = int(n05 * area_m2)
    u = rng.random(n)
    d = dmin * (1 - u * (1 - (dmin / dmax) ** b)) ** (-1.0 / b)
    rows = rng.integers(0, h.shape[0], n)
    cols = rng.integers(0, h.shape[1], n)
    keep = rng.random(n) < np.clip(0.35 + slope[rows, cols] / 25.0, 0.0, 1.0)   # egime gore seyrelt
    rows, cols, d = rows[keep], cols[keep], d[keep]
    return rows, cols, d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site-id", default="leibnitz-beta-plateau")
    ap.add_argument("--src", default=str(ROOT / "data/raw/sites/mons-mouton/extracted/A3CLR22_10_Leibnitz_Beta_Plateau"))
    ap.add_argument("--seed", type=int, default=20261201)
    ap.add_argument("--min-mean-elev", type=float, default=5500.0, help="odak penceresi ort. yuksekligi alt siniri (m)")
    args = ap.parse_args()
    src = Path(args.src)
    out = ROOT / "data" / "unreal" / "terrain" / args.site_id
    out.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(args.seed)

    with rasterio.open(src / "A310_GLDELEV_005.tif") as s:
        z = s.read(1).astype(np.float32)
        b = s.bounds
        px = s.res[0]
    with rasterio.open(src / "A310_GLDOMOS_005.tif") as s:
        om = s.read(1, window=from_bounds(b.left, b.bottom, b.right, b.top, s.transform), out_shape=z.shape,
                    resampling=Resampling.bilinear, boundless=True, fill_value=np.nan).astype(np.float32)
    om = np.where(np.isfinite(om) & (om > 0), om, np.nan)
    om = np.where(np.isnan(om), np.nanmedian(om), om)
    lo, hi = np.percentile(om, [1, 99.5])
    alb = np.clip((om - lo) / (hi - lo), 0, 1)

    # --- tum alan (gercek DEM) ---
    zmin_f, zmax_f = float(z.min()), float(z.max())
    full = resize_f(z, N_OUT)
    save16(full, out / "height_full.png", zmin_f, zmax_f)
    Image.fromarray((resize_f(alb, N_OUT).clip(0, 1) * 255 + 0.5).astype(np.uint8)).save(out / "albedo_full.png")
    full_px = (z.shape[0] * px) / N_OUT

    # --- odak bolge (~4 km, ~1 m/px) ---
    win_px = int(round(N_OUT * 1.0 / px))            # N_OUT m / 5 m = 807 piksel
    ms, me, r, c = pick_focus(z, px, win_px, args.min_mean_elev)
    sub = z[r:r + win_px, c:c + win_px]
    focus_px = (win_px * px) / N_OUT
    focus = resize_f(sub, N_OUT)
    base_focus = focus.copy()
    base_slope = slope_deg(focus, focus_px)
    focus += fractal_noise(focus.shape, focus_px, rng)          # dogal mikro-kabarti (sentetik)
    ncr = add_craters(focus, focus_px, rng)
    z_lo, z_hi = float(focus.min()) - 1.0, float(focus.max()) + 1.0
    save16(focus, out / "height_focus.png", z_lo, z_hi)
    Image.fromarray((resize_f(alb[r:r + win_px, c:c + win_px], N_OUT).clip(0, 1) * 255 + 0.5).astype(np.uint8)).save(out / "albedo_focus.png")

    rows, cols, dia = make_rocks(focus, focus_px, base_slope, rng)
    with open(out / "rocks.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["col", "row", "x_m", "y_m", "diameter_m", "seed"])
        for rr_, cc_, dd in zip(rows, cols, dia):
            w.writerow([int(cc_), int(rr_), round(cc_ * focus_px, 2), round(rr_ * focus_px, 2), round(float(dd), 2),
                        int(rng.integers(0, 2 ** 31 - 1))])

    # --- meta ---
    fx0, fy0 = b.left + c * px, b.top - r * px                         # odak penceresi sol-ust (kutup stereo, m)
    cx, cy = fx0 + win_px * px / 2, fy0 - win_px * px / 2
    meta = {
        "schema": "feza.unreal.terrain/1", "site_id": args.site_id,
        "crs_proj4": "+proj=stere +lon_0=0 +lat_0=-90 +R=1737400 +units=m",
        "datum_radius_m": R_MOON,
        "full": {"file": "height_full.png", "size_px": N_OUT, "pixel_m": full_px, "z_min_m": zmin_f, "z_max_m": zmax_f,
                 "origin_xy_m": [b.left, b.top], "real_pixel_m": px, "synthetic_detail": False,
                 "center_lonlat_deg": lonlat((b.left + b.right) / 2, (b.top + b.bottom) / 2)},
        "focus": {"file": "height_focus.png", "size_px": N_OUT, "pixel_m": focus_px, "z_min_m": z_lo, "z_max_m": z_hi,
                  "origin_xy_m": [fx0, fy0], "real_pixel_m": px, "synthetic_detail": True,
                  "center_lonlat_deg": lonlat(cx, cy), "window_in_full_px": [int(c), int(r), win_px, win_px],
                  "mean_slope_deg_5m": float(ms), "mean_elev_m": float(me),
                  "synthetic_craters": int(ncr), "rocks": int(len(dia))},
        "encoding": "h_m = z_min_m + v/65535*(z_max_m - z_min_m); row 0 = north-most (y max) of the window",
        "sources": ["PGDA/Zenodo A3CLR22 SfS 5 m DEM + orthomosaic"], "citation": CITATION, "seed": args.seed,
    }
    (out / "terrain.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    # --- onizleme (golgeli kabartma) ---
    def hill(a, px_):
        gy, gx = np.gradient(a, px_)
        az, el = math.radians(315), math.radians(35)
        sl = np.arctan(np.hypot(gx, gy))
        asp = np.arctan2(-gx, gy)
        v = math.sin(el) * np.cos(sl) + math.cos(el) * np.sin(sl) * np.cos(az - asp)
        return (np.clip(v, 0, 1) * 255).astype(np.uint8)
    prev = out / "preview"
    prev.mkdir(exist_ok=True)
    Image.fromarray(hill(full, full_px)).resize((1024, 1024), Image.LANCZOS).save(prev / "full_hillshade.png")
    Image.fromarray(hill(focus, focus_px)[1000:2000, 1000:2000]).save(prev / "focus_hillshade_1km_crop.png")
    Image.fromarray(hill(base_focus, focus_px)[1000:2000, 1000:2000]).save(prev / "focus_hillshade_1km_crop_NO_synthetic.png")

    print(f"odak pencere: satir {r} sutun {c}, {win_px}px ({win_px * px:.0f} m), ort. egim {ms:.1f} deg, ort. yukseklik {me:.0f} m")
    print(f"odak merkez boylam/enlem: {lonlat(cx, cy)}")
    print(f"sentetik krater: {ncr}, kaya: {len(dia)}; yukseklik araligi odak: {focus.min():.1f}..{focus.max():.1f} m")


if __name__ == "__main__":
    main()
