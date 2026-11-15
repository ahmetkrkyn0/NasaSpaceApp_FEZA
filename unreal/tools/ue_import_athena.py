"""UE icinde calisir: Athena (athena_lander.glb) ice aktarir, olusan varliklari ve sinirlarini yazdirir. /Game/Athena
Girdi: data/raw/athena/athena_lander.glb (ekip deposu shipmodel/export'tan kopya; depo degistirilmez)
"""
import unreal

at = unreal.AssetToolsHelpers.get_asset_tools()
t = unreal.AssetImportTask()
t.filename = r"C:\Users\Berke\FEZA_Unreal\data\raw\athena\athena_lander.glb"
t.destination_path = "/Game/Athena"
t.automated, t.replace_existing, t.replace_existing_settings, t.save = True, True, True, True
at.import_asset_tasks([t])
paths = list(t.get_editor_property("imported_object_paths"))
unreal.log("ATHENA import: %d varlik" % len(paths))
for p in paths:
    a = unreal.load_asset(p)
    extra = ""
    if isinstance(a, unreal.StaticMesh):
        b = a.get_bounds()
        extra = " origin=%s ext=%s slots=%d" % (b.origin, b.box_extent, len(a.static_materials))
    unreal.log("ATHENA %s | %s%s" % (type(a).__name__, p, extra))
