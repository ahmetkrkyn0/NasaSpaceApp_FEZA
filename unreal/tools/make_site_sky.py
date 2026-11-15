"""Prosedurel inis sahalari icin gercek Gunes/Dunya yonu (DE421 efemeris) + Dunya yonelimi + Athena yerlestirme noktasi.

Girdi : tools/sites.json (enlem/boylam), data/unreal/terrain/<saha>/terrain.json, data/kernels (DE421, Ay yonelimi)
Cikti : terrain.json'a "sun" (az/el), "sky" (Dunya yonu/boyutu/yonelimi, UTC), "lander" (x_m, y_m, yaw_deg) yazar.
Zaman  : 2026-12-01'den 30 gun saatlik taranir; Gunes ~11.5 derece (uzun golge) ve Dunya >8 derece yukarida, evresi guzel olan an secilir.
Cerceve: saha UE cercevesi X=kuzey, Y=dogu, Z=yukari; azimut kuzeyden dogu yonune. Dunya donusu: ITRS -> MOON_ME (skyfield) -> saha.
Kullanim: python make_site_sky.py site-craters [site-plains site-ridges]
"""
import json
import math
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
from skyfield.api import Loader, PlanetaryConstants
from skyfield.framelib import itrs

ROOT = Path(__file__).resolve().parent.parent
EARTH_R_KM = 6371.0
CENTER_M = 3024.0          # cekirdek merkezi (m) - make_site_detail ile ayni
LANDER_DIST_M = 16.0


def main():
    sites = {s["id"]: s for s in json.loads((Path(__file__).with_name("sites.json")).read_text(encoding="utf-8"))["sites"]}
    load = Loader(str(ROOT / "data" / "kernels"))
    ts = load.timescale()
    eph = load("de421.bsp")
    pc = PlanetaryConstants()
    pc.read_text(load("moon_080317.tf"))
    pc.read_text(load("pck00008.tpc"))
    pc.read_binary(load("moon_pa_de421_1900-2050.bpc"))
    frame = pc.build_frame_named("MOON_ME_DE421")
    start = datetime(2026, 12, 1, tzinfo=timezone.utc)
    times = [start + timedelta(hours=i) for i in range(721)]
    t = ts.from_datetimes(times)
    sun, earth, moon = eph["sun"], eph["earth"], eph["moon"]

    for sid in sys.argv[1:]:
        s = sites[sid]
        lat, lon = s["lat_deg"], s["lon_deg"]
        obs = (moon + pc.build_latlon_degrees(frame, lat, lon)).at(t)
        s_el, s_az, _ = obs.observe(sun).apparent().altaz()
        e_el, e_az, e_d = obs.observe(earth).apparent().altaz()
        va, vs = obs.observe(earth).apparent().position.km, obs.observe(sun).apparent().position.km
        ph = (1 + np.sum((vs - va) * (-va), 0) / (np.linalg.norm(vs - va, axis=0) * np.linalg.norm(va, axis=0))) / 2
        cost = np.abs(s_el.degrees - 11.5) + (e_el.degrees < 8) * 50 + (ph < 0.35) * 20 + (s_el.degrees < 3) * 100
        i = int(np.argmin(cost))
        print(f"{sid}: lat {lat} lon {lon} -> {times[i]:%Y-%m-%d %H:%M} gunes el {s_el.degrees[i]:.1f} az {s_az.degrees[i]:.0f} | dunya el {e_el.degrees[i]:.1f} az {e_az.degrees[i]:.0f} evre {ph[i]:.2f}")

        # Dunya yonelimi: yerel mesh koordinatlari -> saha (X kuzey, Y dogu, Z yukari)
        r_moon = frame.rotation_at(t)[:, :, i]
        r_itrs = itrs.rotation_at(t)[:, :, i]
        R = r_moon @ r_itrs.T                                      # ITRS -> MOON_ME
        la, lo = math.radians(lat), math.radians(lon)
        up = np.array([math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la)])
        east = np.array([-math.sin(lo), math.cos(lo), 0.0])
        north = np.array([-math.sin(la) * math.cos(lo), -math.sin(la) * math.sin(lo), math.cos(la)])
        S = np.stack([north, east, up])                           # ME -> saha (det -1)
        M = S @ R @ np.diag([1.0, -1.0, 1.0])                     # mesh yerel (x,-y,z) -> saha
        # dogrulama: Dunya yonu (ME) -> saha ile altaz uyumu
        pe = (earth - moon).at(t[i]).position.km
        e_me = r_moon @ pe
        e_site = S @ (e_me / np.linalg.norm(e_me))
        el_chk, az_chk = math.degrees(math.asin(e_site[2])), math.degrees(math.atan2(e_site[1], e_site[0])) % 360
        print(f"   dogrulama (ME->saha) dunya el {el_chk:.1f} az {az_chk:.0f}")
        ang_r = math.degrees(math.asin(EARTH_R_KM / e_d.km[i]))

        tdir = ROOT / "data" / "unreal" / "terrain" / sid / "terrain.json"
        meta = json.loads(tdir.read_text(encoding="utf-8"))
        meta["sun"] = {"az_deg": round(float(s_az.degrees[i]), 2), "el_deg": round(float(s_el.degrees[i]), 2)}
        meta["sky"] = {"utc": f"{times[i]:%Y-%m-%dT%H:%M:%SZ}",
                       "earth": {"az_deg": round(float(e_az.degrees[i]), 2), "el_deg": round(float(e_el.degrees[i]), 2),
                                 "dist_km": round(float(e_d.km[i]), 1), "ang_radius_deg": round(ang_r, 4), "phase": round(float(ph[i]), 3),
                                 "axis_x": [round(float(v), 6) for v in M[:, 0]], "axis_z": [round(float(v), 6) for v in M[:, 2]]}}
        az_cam = math.radians(meta["sun"]["az_deg"] + 100.0)
        meta["lander"] = {"x_m": CENTER_M + LANDER_DIST_M * math.cos(az_cam), "y_m": CENTER_M + LANDER_DIST_M * math.sin(az_cam),
                          "yaw_deg": 35.0}
        tdir.write_text(json.dumps(meta, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
