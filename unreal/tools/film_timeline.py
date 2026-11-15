"""Zaman cizelgesi katmani (yazisiz): 14 gunluk pencerenin Gunes (sari) ve Dunya (camgobegi) bantlari + oynatma kafasi.
Kullanim: python film_timeline.py <cekim> <pencere_bas> <pencere_son> <oynat_bas> <oynat_son> [cikti_adi]
  ornek : python film_timeline.py sim14 2026-12-12 2026-12-26 2026-12-19 2026-12-25
Girdi : Saved/Screenshots/WindowsEditor/film_<cekim>_NNNN.png ; sky servisi (127.0.0.1:5198, duz ufuk)
Cikti : ayni klasorde film_<cikti_adi>_NNNN.png  (varsayilan <cekim>T)
"""
import datetime as dt
import glob
import json
import os
import sys
import urllib.request

from PIL import Image, ImageDraw

SRC = r"C:\Users\Berke\FEZA_Unreal\unreal\FezaMoon\Saved\Screenshots\WindowsEditor"
LAT, LON = -84.78, 29.13
shot, w0, w1, p0, p1 = sys.argv[1:6]
out = sys.argv[6] if len(sys.argv) > 6 else shot + "T"


def D(s):
    return dt.datetime.strptime(s, "%Y-%m-%d").replace(tzinfo=dt.timezone.utc)


w0, w1, p0, p1 = D(w0), D(w1), D(p0), D(p1)


def sky(t):
    u = "http://127.0.0.1:5198/sky?lat=%s&lon=%s&t=%s" % (LAT, LON, t.strftime("%Y-%m-%dT%H:%M:%SZ"))
    return json.load(urllib.request.urlopen(u, timeout=10))


N = int((w1 - w0).total_seconds() // 3600 // 3)
samples = []
for k in range(N + 1):
    d = sky(w0 + dt.timedelta(hours=3 * k))
    samples.append((d["sun"]["el_deg"] > -0.27, d["earth"]["el_deg"] > -d["earth"]["ang_radius_deg"]))

W, H = 1920, 1080
BX, BW, BH = 210, 1500, 18
BY = H - 86
bar = Image.new("RGBA", (W, H), (0, 0, 0, 0))
dr = ImageDraw.Draw(bar)
dr.rounded_rectangle((BX - 24, BY - 26, BX + BW + 24, BY + 2 * BH + 22), 16, fill=(9, 14, 24, 190), outline=(120, 140, 170, 90), width=1)
for row, (idx, col) in enumerate(((0, (244, 208, 63, 255)), (1, (60, 205, 235, 255)))):
    y = BY + row * (BH + 6)
    dr.rounded_rectangle((BX, y, BX + BW, y + BH), 5, fill=(34, 44, 62, 255))
    for k, sm in enumerate(samples):
        if sm[idx]:
            x0 = BX + BW * k / len(samples)
            x1 = BX + BW * (k + 1) / len(samples)
            dr.rectangle((x0, y, x1, y + BH), fill=col)
days = (w1 - w0).days
for dday in range(0, days + 1):
    x = BX + BW * dday / days
    dr.line((x, BY + 2 * BH + 10, x, BY + 2 * BH + 16), fill=(150, 165, 190, 200), width=2)

files = sorted(glob.glob(os.path.join(SRC, "film_%s_*.png" % shot)))
n = len(files)
for i, f in enumerate(files):
    t = i / float(max(1, n - 1))
    when = p0 + (p1 - p0) * t
    px = BX + BW * (when - w0) / (w1 - w0)
    ov = bar.copy()
    d2 = ImageDraw.Draw(ov)
    d2.rectangle((px - 2, BY - 14, px + 2, BY + 2 * BH + 18), fill=(255, 255, 255, 255))
    d2.ellipse((px - 8, BY - 22, px + 8, BY - 6), fill=(255, 255, 255, 255))
    im = Image.open(f).convert("RGBA")
    if im.size != (W, H):
        im = im.resize((W, H))
    Image.alpha_composite(im, ov).convert("RGB").save(os.path.join(SRC, "film_%s_%04d.png" % (out, i)))
print(out, n, "kare")
