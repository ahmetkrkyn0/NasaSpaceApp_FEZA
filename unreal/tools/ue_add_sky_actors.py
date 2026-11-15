"""UE icinde calisir (editor kapali): (ayrica DSN istasyon haritalarinda canak/Ay/Gunes aktorlarini Movable yapar) 3 inis sahasi haritasina HER ZAMAN Dunya/bulut/atmosfer/Gunes diski + iletisim hatti aktorlari ekler.

Neden : calisma zamani, uygulamada secilen saha/zamana gore Gunes ve Dunya'yi tasir (feza_runtime._sky_apply); aktorlar bastan var olmali, ufkun altindaysa gizlenir.
Girdi : data/unreal/terrain/<saha>/terrain.json (sun/sky), /Game/Space/Materials (M_EarthOrbit, M_EarthClouds, M_EarthAtmo), /Game/Moon/Materials/M_SunDisc
Eklenen: Earth, EarthClouds, EarthAtmosphere, SunDisc, CommLink (M_CommLink: aydinlatmasiz acik mavi). "Stars" aktorunun konumu = zemin merkezi.
Calistirma: UnrealEditor-Cmd.exe <proje> -ExecutePythonScript="<bu dosya>" -unattended -nosplash
"""
import json
import math

import unreal

ROOT = r"C:\Users\Berke\FEZA_Unreal"
SITES = [("site-craters", "Site_Craters"), ("site-plains", "Site_Plains"), ("site-ridges", "Site_Ridges")]
BIAS = -3.0
D = 2.0e8

at = unreal.AssetToolsHelpers.get_asset_tools()
mel = unreal.MaterialEditingLibrary
eal = unreal.EditorAssetLibrary


def az_el_dir(az, el):
    a, e = math.radians(az), math.radians(el)
    return unreal.Vector(math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e))


def make_mic(name, parent_path, sun_dir, gain):
    eal.make_directory("/Game/Moon/SkyInstances")
    p = "/Game/Moon/SkyInstances/" + name
    mic = unreal.load_asset(p) if eal.does_asset_exist(p) else at.create_asset(name, "/Game/Moon/SkyInstances", unreal.MaterialInstanceConstant, unreal.MaterialInstanceConstantFactoryNew())
    mic.set_editor_property("parent", unreal.load_asset(parent_path))
    mel.set_material_instance_vector_parameter_value(mic, "SunDir", unreal.LinearColor(sun_dir.x, sun_dir.y, sun_dir.z, 0))
    mel.set_material_instance_scalar_parameter_value(mic, "EmissiveGain", gain)
    eal.save_loaded_asset(mic)
    return mic


def link_material():
    p = "/Game/Materials/M_CommLink"
    if eal.does_asset_exist(p):
        eal.delete_asset(p)
    m = at.create_asset("M_CommLink", "/Game/Materials", unreal.Material, unreal.MaterialFactoryNew())
    m.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_UNLIT)
    c = mel.create_material_expression(m, unreal.MaterialExpressionConstant3Vector, -300, 0)
    c.set_editor_property("constant", unreal.LinearColor(0.25, 0.8, 1.0, 0))
    k = mel.create_material_expression(m, unreal.MaterialExpressionMultiply, -150, 0)
    mel.connect_material_expressions(c, "", k, "A")
    k.set_editor_property("const_b", 3500.0)             # saha pozlamasi -3: yorunge (-5.5) icin 20000 olan deger ~3500
    mel.connect_material_property(k, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return m


def main():
    sphere = unreal.load_asset("/Game/Meshes/uvsphere/StaticMeshes/SM_UVSphere")
    cyl = unreal.load_asset("/Engine/BasicShapes/Cylinder.Cylinder")
    link_mat = link_material()
    sun_mat = unreal.load_asset("/Game/Moon/Materials/M_SunDisc")
    les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    gain = 2.0 ** (-5.5 - BIAS)
    log = []
    for sid, lvl in SITES:
        meta = json.load(open(ROOT + "\\data\\unreal\\terrain\\" + sid + "\\terrain.json", encoding="utf-8"))
        les.load_level("/Game/Maps/" + lvl)
        acts = {a.get_actor_label(): a for a in eas.get_all_level_actors()}
        for lab in ("Earth", "EarthClouds", "EarthAtmosphere", "SunDisc", "CommLink"):
            if lab in acts:
                eas.destroy_actor(acts[lab])
        ground = acts["Stars"].get_actor_location()
        e = meta["sky"]["earth"]
        sdir = az_el_dir(meta["sun"]["az_deg"], meta["sun"]["el_deg"])
        key = sid.replace("-", "_")

        def place(label, az, el, ang_r, mat, scale=1.0):
            d = az_el_dir(az, el)
            a = eas.spawn_actor_from_class(unreal.StaticMeshActor, unreal.Vector(ground.x + d.x * D, ground.y + d.y * D, ground.z + d.z * D))
            a.set_actor_label(label)
            a.static_mesh_component.set_static_mesh(sphere)
            a.static_mesh_component.set_material(0, mat)
            a.static_mesh_component.set_editor_property("cast_shadow", False)
            s = D * math.tan(math.radians(ang_r)) / 100.0 * scale
            a.set_actor_scale3d(unreal.Vector(s, s, s))
            return a

        rot = unreal.MathLibrary.make_rot_from_xz(unreal.Vector(*e["axis_x"]), unreal.Vector(*e["axis_z"]))
        ea = place("Earth", e["az_deg"], e["el_deg"], e["ang_radius_deg"], make_mic("MI_Earth_" + key, "/Game/Space/Materials/M_EarthOrbit", sdir, gain))
        ea.set_actor_rotation(rot, False)
        cl = place("EarthClouds", e["az_deg"], e["el_deg"], e["ang_radius_deg"], unreal.load_asset("/Game/Space/Materials/M_EarthClouds"), 1.004)
        cl.set_actor_rotation(rot, False)
        place("EarthAtmosphere", e["az_deg"], e["el_deg"], e["ang_radius_deg"], make_mic("MI_Atmo_" + key, "/Game/Space/Materials/M_EarthAtmo", sdir, gain), 1.04)
        place("SunDisc", meta["sun"]["az_deg"], meta["sun"]["el_deg"], 0.2665, sun_mat)
        lk = eas.spawn_actor_from_class(unreal.StaticMeshActor, ground)
        lk.set_actor_label("CommLink")
        lk.static_mesh_component.set_static_mesh(cyl)
        lk.static_mesh_component.set_material(0, link_mat)
        lk.static_mesh_component.set_editor_property("cast_shadow", False)
        lk.set_actor_hidden_in_game(True)
        for ac in eas.get_all_level_actors():                 # calisma zamaninda tasinacaklar: Movable olmali
            lab = ac.get_actor_label()
            if lab in ("Earth", "EarthClouds", "EarthAtmosphere", "SunDisc", "CommLink", "Sun", "Stars") or lab.startswith("Athena_"):
                ac.root_component.set_mobility(unreal.ComponentMobility.MOVABLE)
        les.save_current_level()
        log.append(lvl + " tamam")
    for lvl in ("Station_Goldstone", "Station_Madrid", "Station_Canberra"):          # DSN sahneleri: canak/Ay/Gunes calisma zamaninda tasinir
        les.load_level("/Game/Maps/" + lvl)
        n = 0
        for ac in eas.get_all_level_actors():
            lab = ac.get_actor_label()
            if lab.startswith("DSN_") or lab in ("Moon", "Sun"):
                ac.root_component.set_mobility(unreal.ComponentMobility.MOVABLE)
                n += 1
        les.save_current_level()
        log.append("%s movable %d" % (lvl, n))
    with open(ROOT + r"\data\scratch\sky_actors_build.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(log) + "\n")


main()
