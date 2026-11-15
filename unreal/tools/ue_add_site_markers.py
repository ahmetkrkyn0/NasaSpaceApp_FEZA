"""UE icinde calisir (editor kapali): yorunge sahnesine (/Game/Maps/Orbit) isaretciler ekler. ETIKET YOK.

Girdi : data/unreal/catalog_markers.json (katalogdaki 10 Ay sahasi; make_catalog_markers.py) -> "Moon" aktoru uzerine, data/unreal/stations/stations.json (DSN istasyonlari) -> "Earth" aktoru uzerine
Eklenen aktorlar (her nokta icin): Marker_<id> (ince igne), MarkerHead_<id> (bas kure); ayrica Cam_Orbit (calisma aninda feza_runtime.py surer)
Konum: gezegen aktorunun donusu uygulanir (Ay/Dunya sahnede doner); yerel yon = (x, -y, z) (kure mesh'i, make_sphere.py).
Calistirma: UnrealEditor-Cmd.exe <proje> -ExecutePythonScript="<bu dosya>" -unattended -nosplash   (once ue_build_orbit.py)
"""
import json
import math

import unreal

ROOT = r"C:\Users\Berke\FEZA_Unreal"
R_M0, R_M, R_E = 17374.0, 28000.0, 63710.0      # R_M0: boyut tabani (gercek Ay), R_M: sahnedeki Ay yaricapi
LEVEL = "/Game/Maps/Orbit"

at = unreal.AssetToolsHelpers.get_asset_tools()
mel = unreal.MaterialEditingLibrary
eal = unreal.EditorAssetLibrary


def marker_material(name, color):
    p = "/Game/Materials/" + name
    if eal.does_asset_exist(p):
        eal.delete_asset(p)
    m = at.create_asset(name, "/Game/Materials", unreal.Material, unreal.MaterialFactoryNew())
    m.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_UNLIT)
    c = mel.create_material_expression(m, unreal.MaterialExpressionConstant3Vector, -300, 0)
    c.set_editor_property("constant", unreal.LinearColor(color[0], color[1], color[2], 0))
    k = mel.create_material_expression(m, unreal.MaterialExpressionMultiply, -150, 0)
    mel.connect_material_expressions(c, "", k, "A")
    k.set_editor_property("const_b", 20000.0)              # gunes isikli yuzeyler ~1e4 mertebesinde parlak; pozlama -5.5 ile ~0.8
    mel.connect_material_property(k, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return m


def local_dir(lat_deg, lon_deg):
    la, lo = math.radians(lat_deg), math.radians(lon_deg)
    return unreal.Vector(math.cos(la) * math.cos(lo), -math.cos(la) * math.sin(lo), math.sin(la))


def main():
    moon_sites = json.load(open(ROOT + r"\data\unreal\catalog_markers.json", encoding="utf-8"))["sites"]
    stations = json.load(open(ROOT + r"\data\unreal\stations\stations.json", encoding="utf-8"))["stations"]
    les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    les.load_level(LEVEL)
    eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    actors = {a.get_actor_label(): a for a in eas.get_all_level_actors()}
    for lab, a in list(actors.items()):                     # yeniden calistirilabilir
        if lab.startswith(("Marker_", "MarkerHead_", "Label_")) or lab == "Cam_Orbit":
            eas.destroy_actor(a)
    cyl = unreal.load_asset("/Engine/BasicShapes/Cylinder.Cylinder")
    sph = unreal.load_asset("/Engine/BasicShapes/Sphere.Sphere")

    def add(body_label, radius, items, mat):
        body = actors[body_label]
        k = radius / R_M0
        pin_h, pin_r, head_r = 900.0 * k, 45.0 * k, 210.0 * k
        tf = unreal.Transform(location=body.get_actor_location(), rotation=body.get_actor_rotation(), scale=unreal.Vector(1, 1, 1))
        for s in items:
            d = unreal.MathLibrary.transform_direction(tf, local_dir(s["lat_deg"], s["lon_deg"]))
            c = body.get_actor_location()
            rot = unreal.MathLibrary.make_rot_from_z(d)
            mid = unreal.Vector(c.x + d.x * (radius + pin_h / 2), c.y + d.y * (radius + pin_h / 2), c.z + d.z * (radius + pin_h / 2))
            pin = eas.spawn_actor_from_class(unreal.StaticMeshActor, mid, rot)
            pin.set_actor_label("Marker_" + s["id"])
            pin.static_mesh_component.set_static_mesh(cyl)
            pin.static_mesh_component.set_material(0, mat)
            pin.set_actor_scale3d(unreal.Vector(pin_r / 50.0, pin_r / 50.0, pin_h / 100.0))
            pin.static_mesh_component.set_editor_property("cast_shadow", False)
            hd = radius + pin_h + head_r * 0.8
            head = eas.spawn_actor_from_class(unreal.StaticMeshActor, unreal.Vector(c.x + d.x * hd, c.y + d.y * hd, c.z + d.z * hd))
            head.set_actor_label("MarkerHead_" + s["id"])
            head.static_mesh_component.set_static_mesh(sph)
            head.static_mesh_component.set_material(0, mat)
            head.set_actor_scale3d(unreal.Vector(head_r / 50.0, head_r / 50.0, head_r / 50.0))
            head.static_mesh_component.set_editor_property("cast_shadow", False)

    add("Moon", R_M, moon_sites, marker_material("M_Marker", (1.0, 0.5, 0.1)))
    add("Earth", R_E, stations, marker_material("M_MarkerEarth", (0.2, 0.8, 1.0)))

    cam = eas.spawn_actor_from_class(unreal.CineCameraActor, unreal.Vector(0, 0, 0))
    cam.set_actor_label("Cam_Orbit")                          # konumu runtime'da belirlenir
    cam.get_cine_camera_component().set_editor_property("current_focal_length", 26.0)

    les.save_current_level()
    with open(ROOT + r"\data\scratch\markers_build.txt", "w", encoding="utf-8") as f:
        f.write("MARKERS HAZIR: %d Ay, %d Dunya\n" % (len(moon_sites), len(stations)))


main()
