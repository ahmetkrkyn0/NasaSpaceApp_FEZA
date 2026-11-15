"""Ekibin saha katalogunu (10 saha) Unreal isaretci verisine cevirir. Katalog kopyasi salt okunur kullanilir.

Girdi : data/raw/catalog/sites.json (ekip deposundaki data/sites.json kopyasi), export/web3d/scenes.json (katalog -> sahne eslemesi)
Cikti : data/unreal/catalog_markers.json  {"sites": [{id, name, subtitle, lat_deg, lon_deg, status, category, level, url_start, url_end}]}
        level: katalog sahasinin acacagi Unreal seviyesi (eslemeye gore 3 temsili sahneden biri)
Kullanim: python tools/make_catalog_markers.py
"""
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCENE_LEVEL = {"moon-craters": "/Game/Maps/Site_Craters", "moon-plains": "/Game/Maps/Site_Plains", "moon-ridges": "/Game/Maps/Site_Ridges"}
STATUS_TR = {"landed": "LANDED", "landed_tipped": "TIPPED OVER", "crashed": "IMPACT", "reference": "REFERENCE"}
DEFAULT_START = "2026-12-05T00:00:00Z"


def main():
    src = json.loads((ROOT / "data" / "raw" / "catalog" / "sites.json").read_text(encoding="utf-8"))
    sites = src if isinstance(src, list) else src.get("sites", src)
    cmap = json.loads((ROOT / "export" / "web3d" / "scenes.json").read_text(encoding="utf-8"))["catalog_map"]
    out = []
    for s in sites:
        scene = cmap.get(s["id"], {}).get("scene")
        level = SCENE_LEVEL.get(scene)
        if not level:
            print("ATLANDI (esleme yok):", s["id"])
            continue
        start = s.get("landing_utc") or DEFAULT_START
        t0 = datetime.strptime(start, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        out.append({"id": s["id"], "name": s["name"].split(" (")[0], "full_name": s["name"], "category": s.get("category"),
                    "status": STATUS_TR.get(s.get("status"), str(s.get("status", "")).upper()), "lat_deg": s["lat_deg"], "lon_deg": s["lon_deg"],
                    "notes": s.get("notes") or "", "validity": s.get("validity") or "", "level": level, "scene": scene, "url_start": start, "url_end": (t0 + timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%SZ")})
    dst = ROOT / "data" / "unreal" / "catalog_markers.json"
    dst.write_text(json.dumps({"sites": out}, indent=1, ensure_ascii=False), encoding="utf-8")
    print(len(out), "saha yazildi:", dst)


if __name__ == "__main__":
    main()
