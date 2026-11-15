"""Yerel gokyuzu servisi (ekibin backend'i degil): bir Ay noktasi ve UTC aninda Gunes/Dunya yonu, Dunya evresi ve yonelimi (DE421, skyfield).

Cagiran : tools/feza_runtime.py (Unreal calisma zamani, urllib ile GET /sky?lat=&lon=&t=<ISO UTC>)
Cikti   : {"sun": {"az_deg","el_deg"}, "earth": {"az_deg","el_deg","dist_km","ang_radius_deg","phase","axis_x","axis_z"}}  (saha cercevesi X=kuzey, Y=dogu, Z=yukari)
Matematik make_site_sky.py ile ayni (ITRS -> MOON_ME -> saha). Kullanim: tools\\.venv\\Scripts\\python.exe tools\\sky_service.py  (127.0.0.1:5198)
"""
import json
import math
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import numpy as np
from skyfield.api import Loader, PlanetaryConstants, wgs84
from skyfield.framelib import itrs

ROOT = Path(__file__).resolve().parent.parent
EARTH_R_KM = 6371.0
_load = Loader(str(ROOT / "data" / "kernels"))
TS = _load.timescale()
EPH = _load("de421.bsp")
PC = PlanetaryConstants()
PC.read_text(_load("moon_080317.tf"))
PC.read_text(_load("pck00008.tpc"))
PC.read_binary(_load("moon_pa_de421_1900-2050.bpc"))
FRAME = PC.build_frame_named("MOON_ME_DE421")


def compute(lat, lon, iso):
    t0 = datetime.strptime(iso.replace("Z", ""), "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
    t = TS.from_datetime(t0)
    sun, earth, moon = EPH["sun"], EPH["earth"], EPH["moon"]
    obs = (moon + PC.build_latlon_degrees(FRAME, lat, lon)).at(t)
    s_el, s_az, _ = obs.observe(sun).apparent().altaz()
    e_el, e_az, e_d = obs.observe(earth).apparent().altaz()
    va, vs = obs.observe(earth).apparent().position.km, obs.observe(sun).apparent().position.km
    ph = (1 + float(np.sum((vs - va) * (-va))) / (np.linalg.norm(vs - va) * np.linalg.norm(va))) / 2
    R = FRAME.rotation_at(t) @ itrs.rotation_at(t).T
    la, lo = math.radians(lat), math.radians(lon)
    up = np.array([math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la)])
    east = np.array([-math.sin(lo), math.cos(lo), 0.0])
    north = np.array([-math.sin(la) * math.cos(lo), -math.sin(la) * math.sin(lo), math.cos(la)])
    M = np.stack([north, east, up]) @ R @ np.diag([1.0, -1.0, 1.0])
    return {"sun": {"az_deg": round(s_az.degrees, 3), "el_deg": round(s_el.degrees, 3)},
            "earth": {"az_deg": round(e_az.degrees, 3), "el_deg": round(e_el.degrees, 3), "dist_km": round(e_d.km, 1),
                      "ang_radius_deg": round(math.degrees(math.asin(EARTH_R_KM / e_d.km)), 4), "phase": round(ph, 3),
                      "axis_x": [round(float(v), 6) for v in M[:, 0]], "axis_z": [round(float(v), 6) for v in M[:, 2]]}}


MOON_R_KM = 1737.4


def compute_station(lat, lon, alt, iso):
    """Dunya istasyonu (DSN): Gunes/Ay yonu, Ay evresi (aydinlik kesir), Ay yonelimi. make_dsn_data.py ile ayni matematik."""
    t0 = datetime.strptime(iso.replace("Z", ""), "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
    t = TS.from_datetime(t0)
    sun, earth, moon = EPH["sun"], EPH["earth"], EPH["moon"]
    obs = (earth + wgs84.latlon(lat, lon, elevation_m=alt)).at(t)
    s_el, s_az, _ = obs.observe(sun).apparent().altaz()
    m_el, m_az, m_d = obs.observe(moon).apparent().altaz()
    vm, vs = obs.observe(moon).apparent().position.km, obs.observe(sun).apparent().position.km
    ph = (1 + float(np.sum((vs - vm) * (-vm))) / (np.linalg.norm(vs - vm) * np.linalg.norm(vm))) / 2
    la, lo = math.radians(lat), math.radians(lon)
    up = np.array([math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la)])
    east = np.array([-math.sin(lo), math.cos(lo), 0.0])
    north = np.array([-math.sin(la) * math.cos(lo), -math.sin(la) * math.sin(lo), math.cos(la)])
    M = np.stack([north, east, up]) @ itrs.rotation_at(t) @ FRAME.rotation_at(t).T @ np.diag([1.0, -1.0, 1.0])
    return {"sun": {"az_deg": round(s_az.degrees, 3), "el_deg": round(s_el.degrees, 3)},
            "moon": {"az_deg": round(m_az.degrees, 3), "el_deg": round(m_el.degrees, 3), "dist_km": round(m_d.km, 1),
                     "ang_radius_deg": round(math.degrees(math.asin(MOON_R_KM / m_d.km)), 4), "illum": round(ph, 3),
                     "axis_x": [round(float(v), 6) for v in M[:, 0]], "axis_z": [round(float(v), 6) for v in M[:, 2]]}}


class H(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            q = parse_qs(urlparse(self.path).query)
            if urlparse(self.path).path == "/station":
                res = compute_station(float(q["lat"][0]), float(q["lon"][0]), float(q.get("alt", ["0"])[0]), q["t"][0])
            else:
                res = compute(float(q["lat"][0]), float(q["lon"][0]), q["t"][0])
            body = json.dumps(res).encode()
            self.send_response(200)
        except Exception as e:        # noqa: BLE001
            body = json.dumps({"error": str(e)}).encode()
            self.send_response(400)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        print(json.dumps(compute(0.67416, 23.47314, "2026-12-05T00:00:00Z")))
        print(json.dumps(compute_station(35.4267, -116.8895, 1000.0, "2026-12-15T23:00:00Z")))
    else:
        HTTPServer(("127.0.0.1", 5198), H).serve_forever()
