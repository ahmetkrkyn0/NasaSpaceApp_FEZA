"""UE icinde calisir (editor kapali): Poly Haven bitki/kaya glTF modellerini /Game/Nature/<ad>/ altina aktarir, Nanite'i acar.

Cagiran : elle (bir kez); ue_build_stations.py sahnelerde /Game/Nature/<ad> altindaki StaticMesh'leri ada gore bulur.
Girdi   : data/raw/polyhaven/nature/<ad>/<ad>_2k.gltf (fetch_polyhaven_nature.py)
Cikti   : /Game/Nature/<ad>/... ; data/scratch/nature_import.txt (ad -> StaticMesh sayisi)
Calistirma: UnrealEditor-Cmd.exe <proje> -ExecutePythonScript="<bu dosya>" -unattended -nosplash
"""
import json
import os

import unreal

ROOT = r"C:\Users\Berke\FEZA_Unreal"
SRC = ROOT + r"\data\raw\polyhaven\nature"
at = unreal.AssetToolsHelpers.get_asset_tools()
eal = unreal.EditorAssetLibrary


def import_one(name):
    gltf = [f for f in os.listdir(SRC + "\\" + name) if f.endswith(".gltf")][0]
    t = unreal.AssetImportTask()
    t.filename = SRC + "\\" + name + "\\" + gltf
    t.destination_path, t.destination_name = "/Game/Nature/" + name, name
    t.automated, t.replace_existing, t.replace_existing_settings, t.save = True, True, True, True
    at.import_asset_tasks([t])
    meshes = []
    for p in eal.list_assets("/Game/Nature/" + name, recursive=True, include_folder=False):
        a = unreal.load_asset(p)
        if isinstance(a, unreal.StaticMesh):
            ns = a.get_editor_property("nanite_settings")
            ns.set_editor_property("enabled", True)
            a.set_editor_property("nanite_settings", ns)
            eal.save_loaded_asset(a)
            meshes.append(p)
    return meshes


def main():
    names = sorted(json.load(open(SRC + r"\manifest.json", encoding="utf-8"))["assets"])
    only = os.environ.get("NATURE_ONLY")
    log = []
    for n in names:
        if only and n != only:
            continue
        try:
            m = import_one(n)
            log.append("%s: %d mesh" % (n, len(m)))
        except Exception as e:        # noqa: BLE001
            log.append("%s: HATA %s" % (n, e))
        with open(ROOT + r"\data\scratch\nature_import.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(log) + "\n")


main()
