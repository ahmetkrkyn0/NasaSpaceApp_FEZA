"""ephemeris.py çıktısını JPL Horizons ile karşılaştırır (Güneş ve Dünya az/el).

Horizons'a yalnızca saha koordinatı ve tarih aralığı gönderilir.

Örnek:
  .venv/Scripts/python.exe check_horizons.py --site-id mons-mouton --samples 24
"""

from __future__ import annotations

import argparse
import json
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://ssd.jpl.nasa.gov/api/horizons.api"


def horizons_azel(body: str, lon: float, lat: float, start: str, stop: str, step: str) -> list[tuple[float, float]]:
    params = {
        "format": "json", "COMMAND": f"'{body}'", "MAKE_EPHEM": "YES", "EPHEM_TYPE": "OBSERVER",
        "CENTER": "'coord@301'", "COORD_TYPE": "GEODETIC", "SITE_COORD": f"'{lon},{lat},0'",
        "START_TIME": f"'{start}'", "STOP_TIME": f"'{stop}'", "STEP_SIZE": f"'{step}'",
        "QUANTITIES": "'4'", "ANG_FORMAT": "DEG", "CSV_FORMAT": "YES",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=60) as resp:
        text = json.load(resp)["result"]
    rows = text.split("$$SOE")[1].split("$$EOE")[0].strip().splitlines()
    out = []
    for row in rows:
        cols = [c.strip() for c in row.split(",")]
        # tarih, güneş bayrağı, ay bayrağı, azimut, yükseklik
        out.append((float(cols[3]), float(cols[4])))
    return out


def angdiff(a: float, b: float) -> float:
    return (a - b + 180.0) % 360.0 - 180.0


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--site-id", default="mons-mouton")
    ap.add_argument("--samples", type=int, default=24, help="kaç örnekte bir karşılaştırılsın (adım çarpanı)")
    args = ap.parse_args()

    doc = json.loads((ROOT / "data" / "unreal" / "ephemeris" / f"{args.site_id}.json").read_text(encoding="utf-8"))
    start = datetime.fromisoformat(doc["start_utc"].replace("Z", "+00:00"))
    stride = args.samples
    idx = list(range(0, doc["n"], stride))
    stop = start + timedelta(seconds=idx[-1] * doc["step_s"])
    step_min = stride * doc["step_s"] // 60
    fmt = "%Y-%m-%d %H:%M"

    for body, key in (("10", "sun"), ("399", "earth")):
        ref = horizons_azel(body, doc["lon_deg"], doc["lat_deg"], start.strftime(fmt), stop.strftime(fmt), f"{step_min} m")
        d_az = [abs(angdiff(doc[f"{key}_az_deg"][i], ref[k][0])) for k, i in enumerate(idx[:len(ref)])]
        d_el = [abs(doc[f"{key}_el_deg"][i] - ref[k][1]) for k, i in enumerate(idx[:len(ref)])]
        print(f"{key:5s}: {len(ref)} örnek | |Δaz| maks {max(d_az):.4f}° ort {sum(d_az)/len(d_az):.4f}° | "
              f"|Δel| maks {max(d_el):.4f}° ort {sum(d_el)/len(d_el):.4f}°")


if __name__ == "__main__":
    main()
