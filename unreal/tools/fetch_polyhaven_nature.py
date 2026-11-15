"""Poly Haven (CC0) bitki/kaya modellerini indirir (DSN istasyon sahneleri icin dogal ortam: calilar, agaclar, kayalar, ot).

Cagiran : elle (bir kez); sonra tools/ue_import_nature.py ve tools/make_station_props.py bu adlari kullanir.
Cikti   : data/raw/polyhaven/nature/<ad>/ (gltf + bin + dokular, 2k), data/raw/polyhaven/nature/manifest.json
Kaynak  : https://polyhaven.com (API: api.polyhaven.com), lisans CC0.
"""
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "raw" / "polyhaven" / "nature"
API = "https://api.polyhaven.com"
UA = {"User-Agent": "FEZA-asset-fetch/1.0"}
RES = "2k"
NAMES = ["wild_rooibos_bush", "searsia_lucida", "namaqualand_boulder_05", "namaqualand_boulder_06", "namaqualand_rocks_01", "stone_01",
         "namaqualand_boulder_02", "island_tree_02", "pine_sapling_small", "shrub_02", "grass_medium_02", "rock_07", "boulder_01",
         "jacaranda_tree", "island_tree_01", "searsia_burchellii", "grass_bermuda_01"]


def get_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return json.load(r)


def download(url, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return dest.stat().st_size
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=300) as r, open(dest, "wb") as f:
        while True:
            b = r.read(1 << 20)
            if not b:
                break
            f.write(b)
    return dest.stat().st_size


def main():
    man = {"license": "CC0", "source": "https://polyhaven.com", "assets": {}}
    total = 0
    for a in NAMES:
        files = get_json(f"{API}/files/{a}")
        info = get_json(f"{API}/info/{a}")
        res = RES if RES in files["gltf"] else sorted(files["gltf"])[0]
        g = files["gltf"][res]["gltf"]
        base = OUT / a
        n = download(g["url"], base / f"{a}_{res}.gltf")
        for rel, spec in g.get("include", {}).items():
            n += download(spec["url"], base / rel)
        total += n
        man["assets"][a] = {"res": res, "bytes": n, "dimensions_mm": info.get("dimensions"), "polycount": info.get("polycount"), "authors": info.get("authors")}
        print(f"{a}: {n / 1e6:.1f} MB (toplam {total / 1e6:.0f} MB)", flush=True)
    (OUT / "manifest.json").write_text(json.dumps(man, indent=1), encoding="utf-8")
    print("BITTI")


if __name__ == "__main__":
    main()
