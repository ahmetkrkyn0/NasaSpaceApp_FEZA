"""Poly Haven (CC0) DSN istasyon zemin dokulari: 2k jpg (Diffuse, nor_dx, Rough). Kaynak: https://polyhaven.com , API: api.polyhaven.com
Cikti: data/raw/polyhaven/ground/<id>/<id>_<harita>_2k.jpg ve manifest.json (boyut mm, yazarlar)
Kullanim: python fetch_polyhaven_ground.py dry_ground_rocks aerial_grass_rock grass_path_3
"""
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "raw" / "polyhaven" / "ground"
UA = {"User-Agent": "FEZA-asset-fetch/1.0"}
MAPS = ("Diffuse", "nor_dx", "Rough")


def get_json(u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60))


def main():
    man = {}
    for a in sys.argv[1:]:
        files, info = get_json(f"https://api.polyhaven.com/files/{a}"), get_json(f"https://api.polyhaven.com/info/{a}")
        got = {}
        for m in MAPS:
            u = files[m]["2k"]["jpg"]["url"]
            dest = OUT / a / f"{a}_{m}_2k.jpg"
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists():
                dest.write_bytes(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=180).read())
            got[m] = dest.stat().st_size
        man[a] = {"files": got, "dimensions_mm": info.get("dimensions"), "authors": info.get("authors"), "license": "CC0"}
        print(a, got, info.get("dimensions"))
    (OUT / "manifest.json").write_text(json.dumps(man, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
