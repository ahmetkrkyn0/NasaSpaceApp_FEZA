"""DSN yer istasyonu sahneleri icin veri: efemeris (Ay/Gunes gokyuzu yonu, Ay yonelimi), prosedurel arazi, Dunya kuresi verisi.

Girdi : data/kernels (DE421, Ay yonelimi), istasyon tanimlari (asagida, NASA DSN kompleksleri)
Cikti : data/unreal/stations/stations.json   (her istasyon: konum, secilen an, Gunes/Ay az-el, Ay evresi, Ay yonelimi)
        data/unreal/stations/globe.json      (Dunya kuresi sahnesi: an, Gunes/Ay yonu ITRS)
        data/unreal/terrain/<istasyon>/{height_focus.png, terrain.json}  (make_site_tiles.py semasi: 8 km, 4 m aralik)
Cerceve: saha UE cercevesi X=kuzey, Y=dogu, Z=yukari; az kuzeyden dogu yonune. Kure mesh'i yerel (x,-y,z) (make_sphere.py).
Kaynak koordinatlar: NASA DSN kompleksleri (Goldstone DSS-14, Madrid DSS-63, Canberra DSS-43), yaklasik; gorsel amacli.
Kullanim: tools/.venv/Scripts/python.exe tools/make_dsn_data.py
"""
import json
import math
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
from PIL import Image
from skyfield.api import Loader, PlanetaryConstants, wgs84
from skyfield.framelib import itrs

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_site_terrain import fractal_noise  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MOON_R_KM = 1737.4
N, PX = 2017, 4.0
GLOBE_UTC = datetime(2026, 12, 15, 20, 0, tzinfo=timezone.utc)

STATIONS = [
    dict(id="dsn-goldstone", name="Goldstone (DSS-14)", subtitle="Mojave Çölü, ABD - 70 m çanak", lat=35.4267, lon=-116.8895, alt=1000.0, kind="desert", seed=41),
    dict(id="dsn-madrid", name="Madrid (DSS-63)", subtitle="Robledo de Chavela, İspanya - 70 m çanak", lat=40.4314, lon=-4.2481, alt=865.0, kind="hills", seed=42),
    dict(id="dsn-canberra", name="Canberra (DSS-43)", subtitle="Tidbinbilla, Avustralya - 70 m çanak", lat=-35.4025, lon=148.9813, alt=688.0, kind="valley", seed=43),
]


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def make_terrain(st):
    rng = np.random.default_rng(st["seed"])
    c = (N - 1) / 2
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    r = np.hypot(yy - c, xx - c) * PX
    if st["kind"] == "desert":
        h = fractal_noise((N, N), PX, rng, rms=3.5, lmin=40.0, lmax=3000.0, amp_exp=1.6)
        g = fractal_noise((N, N), PX, rng, rms=1.0, lmin=300.0, lmax=3500.0, amp_exp=1.3)
        h += 420.0 * smooth((r - 2300.0) / 1500.0) * (0.55 + 0.45 * (1 - np.abs(g).clip(0, 1.6) / 1.6) ** 1.5)
    elif st["kind"] == "hills":
        h = fractal_noise((N, N), PX, rng, rms=16.0, lmin=150.0, lmax=3500.0, amp_exp=1.7)
        h += 120.0 * smooth((r - 2500.0) / 1500.0)
    else:
        h = fractal_noise((N, N), PX, rng, rms=7.0, lmin=100.0, lmax=3000.0, amp_exp=1.6)
        h += 260.0 * smooth((r - 1800.0) / 1800.0) * (0.7 + 0.3 * rng.random())
    h += fractal_noise((N, N), PX, rng, rms=0.3, lmin=8.0, lmax=60.0, amp_exp=1.5)
    base = float(h[r < 120.0].mean())
    w = 1.0 - smooth((r - 120.0) / 220.0)                         # istasyon platosu: 120 m duz, 340 m'de dogal arazi
    h = (h * (1 - w) + base * w).astype(np.float32)
    zmin, zmax = float(h.min()) - 1.0, float(h.max()) + 1.0
    out = ROOT / "data" / "unreal" / "terrain" / st["id"]
    out.mkdir(parents=True, exist_ok=True)
    Image.fromarray((np.clip((h - zmin) / (zmax - zmin), 0, 1) * 65535 + 0.5).astype(np.uint16)).save(out / "height_focus.png")
    zref = math.floor(zmin)
    meta = {"schema": "feza.unreal.terrain/1", "site_id": st["id"], "kind": st["kind"], "name": st["name"], "synthetic": True,
            "focus": {"file": "height_focus.png", "size_px": N, "pixel_m": PX, "z_min_m": zmin, "z_max_m": zmax, "z_ref_m": zref},
            "ground_center_cm": [c * PX * 100, c * PX * 100, (float(h[int(c), int(c)]) - zref) * 100],
            "encoding": "h_m = z_min_m + v/65535*(z_max_m - z_min_m); row 0 = north"}
    (out / "terrain.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return meta


def main():
    load = Loader(str(ROOT / "data" / "kernels"))
    ts = load.timescale()
    eph = load("de421.bsp")
    pc = PlanetaryConstants()
    pc.read_text(load("moon_080317.tf"))
    pc.read_text(load("pck00008.tpc"))
    pc.read_binary(load("moon_pa_de421_1900-2050.bpc"))
    frame = pc.build_frame_named("MOON_ME_DE421")
    sun, earth, moon = eph["sun"], eph["earth"], eph["moon"]

    start = datetime(2026, 12, 1, tzinfo=timezone.utc)
    times = [start + timedelta(hours=i) for i in range(24 * 30)]
    t = ts.from_datetimes(times)
    out = []
    for st in STATIONS:
        obs = (earth + wgs84.latlon(st["lat"], st["lon"], elevation_m=st["alt"])).at(t)
        s_el, s_az, _ = obs.observe(sun).apparent().altaz()
        m_el, m_az, m_d = obs.observe(moon).apparent().altaz()
        vm, vs = obs.observe(moon).apparent().position.km, obs.observe(sun).apparent().position.km
        ph = (1 + np.sum((vs - vm) * (-vm), 0) / (np.linalg.norm(vs - vm, axis=0) * np.linalg.norm(vm, axis=0))) / 2     # aydinlik kesir
        cost = np.abs(s_el.degrees - 15) + (m_el.degrees < 25) * 40 + (m_el.degrees > 65) * 20 + (ph < 0.3) * 30 + (s_el.degrees < 3) * 60
        i = int(np.argmin(cost))
        la, lo = math.radians(st["lat"]), math.radians(st["lon"])
        up = np.array([math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la)])
        east = np.array([-math.sin(lo), math.cos(lo), 0.0])
        north = np.array([-math.sin(la) * math.cos(lo), -math.sin(la) * math.sin(lo), math.cos(la)])
        S = np.stack([north, east, up])                                  # ITRS -> saha (det -1)
        Rm = frame.rotation_at(t)[:, :, i]                               # ICRF -> MOON_ME
        Ri = itrs.rotation_at(t)[:, :, i]                                # ICRF -> ITRS
        M = S @ Ri @ Rm.T @ np.diag([1.0, -1.0, 1.0])                    # kure yerel (x,-y,z) -> saha
        ang_r = math.degrees(math.asin(MOON_R_KM / m_d.km[i]))
        print(f"{st['id']}: {times[i]:%Y-%m-%d %H:%M}Z gunes el {s_el.degrees[i]:.1f} az {s_az.degrees[i]:.0f} | ay el {m_el.degrees[i]:.1f} az {m_az.degrees[i]:.0f} aydinlik {ph[i]:.2f}")
        meta = make_terrain(st)
        out.append({"id": st["id"], "name": st["name"], "subtitle": st["subtitle"], "lat_deg": st["lat"], "lon_deg": st["lon"], "alt_m": st["alt"],
                    "level": "/Game/Maps/Station_" + st["id"].split("-")[1].capitalize(),
                    "color": [0.2, 0.8, 1.0],
                    "utc": f"{times[i]:%Y-%m-%dT%H:%M:%SZ}",
                    "sun": {"az_deg": round(float(s_az.degrees[i]), 2), "el_deg": round(float(s_el.degrees[i]), 2)},
                    "moon": {"az_deg": round(float(m_az.degrees[i]), 2), "el_deg": round(float(m_el.degrees[i]), 2), "dist_km": round(float(m_d.km[i]), 1),
                             "ang_radius_deg": round(ang_r, 4), "illum": round(float(ph[i]), 3),
                             "axis_x": [round(float(v), 6) for v in M[:, 0]], "axis_z": [round(float(v), 6) for v in M[:, 2]]},
                    "ground_center_cm": meta["ground_center_cm"]})

    # Dunya kuresi sahnesi: Gunes ve Ay yonu ITRS'de (kure yerel UE = (x,-y,z))
    tg = ts.from_datetime(GLOBE_UTC)
    sun_itrs = (sun - earth).at(tg).frame_xyz(itrs).km
    moon_itrs = (moon - earth).at(tg).frame_xyz(itrs).km
    sdir = out_dir = ROOT / "data" / "unreal" / "stations"
    sdir.mkdir(parents=True, exist_ok=True)
    (sdir / "globe.json").write_text(json.dumps({
        "utc": GLOBE_UTC.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "sun_dir_itrs": (sun_itrs / np.linalg.norm(sun_itrs)).round(6).tolist(),
        "moon_dir_itrs": (moon_itrs / np.linalg.norm(moon_itrs)).round(6).tolist(), "moon_dist_km": round(float(np.linalg.norm(moon_itrs)), 1)}, indent=1), encoding="utf-8")
    (sdir / "stations.json").write_text(json.dumps({"stations": out}, indent=1, ensure_ascii=False), encoding="utf-8")
    print("stations.json + globe.json yazildi")


if __name__ == "__main__":
    main()
