"""Poly Haven "Moon" koleksiyonunu (CC0) indirir: 20 regolit dokusu (4k jpg haritalari) + 7 ay kayasi (glTF 2k).

Kaynak: https://polyhaven.com (API: api.polyhaven.com). Lisans: CC0. Fotograf: Greg Zaal, Rico Cilliers, Jenelle van Heerden; isleme: Dario Barresi.
Cikti : data/raw/polyhaven/moon/textures/<id>/<id>_<harita>_4k.jpg ,  data/raw/polyhaven/moon/rocks/<id>/(gltf+bin+dokular)
        data/raw/polyhaven/moon/manifest.json  (indirilen dosyalar, boyutlar, lisans)
"""
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "raw" / "polyhaven" / "moon"
API = "https://api.polyhaven.com"
UA = {"User-Agent": "FEZA-asset-fetch/1.0"}
TEX_RES, ROCK_RES = "4k", "2k"
MAPS = ("Diffuse", "nor_dx", "Rough", "Displacement", "AO")


def get_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def download(url, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return dest.stat().st_size
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=180) as r, open(dest, "wb") as f:
        while True:
            b = r.read(1 << 20)
            if not b:
                break
            f.write(b)
    return dest.stat().st_size


def main():
    assets = get_json(f"{API}/assets?t=all")
    tex = sorted(k for k, v in assets.items() if "collection: moon" in v.get("categories", []) and v.get("type") == 1)
    rocks = sorted(k for k, v in assets.items() if "collection: moon" in v.get("categories", []) and v.get("type") == 2)
    print("textures:", len(tex), "rocks:", len(rocks))
    manifest = {"license": "CC0", "source": "https://polyhaven.com", "textures": {}, "rocks": {}}
    total = 0
    for a in tex:
        files = get_json(f"{API}/files/{a}")
        info = get_json(f"{API}/info/{a}")
        got = {}
        for m in MAPS:
            try:
                u = files[m][TEX_RES]["jpg"]["url"]
            except KeyError:
                continue
            got[m] = download(u, OUT / "textures" / a / f"{a}_{m}_{TEX_RES}.jpg")
            total += got[m]
        manifest["textures"][a] = {"files": got, "dimensions_mm": info.get("dimensions"), "authors": info.get("authors")}
        print(f"  tex {a}: {len(got)} harita, toplam {total / 1e6:.0f} MB", flush=True)
    for a in rocks:
        files = get_json(f"{API}/files/{a}")
        info = get_json(f"{API}/info/{a}")
        g = files["gltf"][ROCK_RES]["gltf"]
        base = OUT / "rocks" / a
        n = download(g["url"], base / f"{a}_{ROCK_RES}.gltf")
        for rel, spec in g.get("include", {}).items():
            n += download(spec["url"], base / rel)
        total += n
        manifest["rocks"][a] = {"bytes": n, "dimensions_mm": info.get("dimensions"), "polycount": info.get("polycount"), "authors": info.get("authors")}
        print(f"  rock {a}: {n / 1e6:.1f} MB, toplam {total / 1e6:.0f} MB", flush=True)
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    print("BITTI toplam %.0f MB" % (total / 1e6))


if __name__ == "__main__":
    main()
