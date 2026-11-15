"""UE icinde calisir: arazi mesh'lerinde yuksek hassasiyetli teget tabani + tam hassasiyetli UV'yi acar.

Neden: Nanite'siz static mesh'te normal/teget 8 bit paketlenir; alcak Gunes'te (4 derece) kuantalama satir satir serit yapar.
Kullanim: UnrealEditor-Cmd.exe <proje> -ExecutePythonScript="<bu dosya>" -unattended -nosplash
"""
import json

import unreal

LAYOUT = r"C:\Users\Berke\FEZA_Unreal\data\unreal\meshes\site\layout.json"
sub = unreal.get_editor_subsystem(unreal.StaticMeshEditorSubsystem)

layout = json.load(open(LAYOUT, encoding="utf-8"))
for m in layout["meshes"]:
    name = m["name"]
    sm = unreal.load_asset("/Game/Site/Meshes/%s/StaticMeshes/%s" % (name, name))
    bs = sub.get_lod_build_settings(sm, 0)
    bs.set_editor_property("use_high_precision_tangent_basis", True)
    bs.set_editor_property("use_full_precision_u_vs", True)
    sub.set_lod_build_settings(sm, 0, bs)
    unreal.EditorAssetLibrary.save_loaded_asset(sm)
    unreal.log("PRECISION %s ok" % name)
unreal.log("PRECISION BITTI")
