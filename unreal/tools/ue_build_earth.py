"""UE 5.8 icinde calisir: Dunya kuresi sahnesi (/Game/Maps/Earth_Globe): Dunya (gunduz/gece), Ay (gercek konum), TDRS role uydulari (GEO).

Girdi : data/unreal/stations/globe.json (an, Gunes/Ay yonu ITRS), data/raw/tdrs/tdrs_a.glb (NASA 3D Resources, TDRS (A)),
        /Game/Textures/T_Earth_Day_16k, T_Earth_Night_8k, T_Moon_Color_8k, T_Moon_Normal_8k, /Game/Meshes/uvsphere/StaticMeshes/SM_UVSphere
Cikti : /Game/TDRS, /Game/Maps/Earth_Globe  (isaretciler ayri betikle: MARKER_TARGET=earth ue_add_site_markers.py)
Olcek : 1 km = 10 cm (Ay ile ayni). Dunya yaricapi 63710 cm. Kure yerel UE = (x, -y, z) (ITRS -> UE).
Uydular: TDRS-East 41 W, TDRS-West 171 W, TDRS-Z 85 W boylaminda GEO (42164 km); boyut gosterim icin abartilir.
Calistirma (editor kapali): UnrealEditor-Cmd.exe <proje> -ExecutePythonScript="<bu dosya>" -unattended -nosplash
"""
import json
import math
import os

import unreal

ROOT = r"C:\Users\Berke\FEZA_Unreal"
KM = 10.0
EARTH_R = 6371.0 * KM
MOON_R = 1737.4 * KM
GEO_R = 42164.0 * KM
SUN_LUX = 120000.0
TDRS_SCALE = 80.0          # model Unreal icinde ~90 cm cikiyor; GEO olceginde gorunur (~0.12 R)
TDRS = [("TDRS-East", -41.0), ("TDRS-West", -171.0), ("TDRS-Z", -85.0)]

at = unreal.AssetToolsHelpers.get_asset_tools()
mel = unreal.MaterialEditingLibrary
eal = unreal.EditorAssetLibrary


def node(m, cls, x, y):
    return mel.create_material_expression(m, cls, x, y)


def get_or_new(name, folder="/Game/Materials"):
    p = folder + "/" + name
    if eal.does_asset_exist(p):
        m = unreal.load_asset(p)
        mel.delete_all_material_expressions(m)
        return m
    return at.create_asset(name, folder, unreal.Material, unreal.MaterialFactoryNew())


def itrs_to_ue(v):
    return unreal.Vector(v[0], -v[1], v[2])


def build_earth_material(sun_ue):
    m = get_or_new("M_EarthGlobe")
    day = node(m, unreal.MaterialExpressionTextureSample, -900, 0)
    day.set_editor_property("texture", unreal.load_asset("/Game/Textures/T_Earth_Day_16k"))
    night = node(m, unreal.MaterialExpressionTextureSample, -900, 300)
    night.set_editor_property("texture", unreal.load_asset("/Game/Textures/T_Earth_Night_8k"))
    mel.connect_material_property(day, "RGB", unreal.MaterialProperty.MP_BASE_COLOR)
    rough = node(m, unreal.MaterialExpressionConstant, -900, 150)
    rough.set_editor_property("r", 0.6)
    mel.connect_material_property(rough, "", unreal.MaterialProperty.MP_ROUGHNESS)
    # gece isiklari: Gunes'e ters bakan yuzde (NdotL < 0) yayici
    vn = node(m, unreal.MaterialExpressionVertexNormalWS, -900, 600)
    sd = node(m, unreal.MaterialExpressionConstant3Vector, -900, 700)
    sd.set_editor_property("constant", unreal.LinearColor(sun_ue.x, sun_ue.y, sun_ue.z, 0))
    dot = node(m, unreal.MaterialExpressionDotProduct, -700, 650)
    mel.connect_material_expressions(vn, "", dot, "A")
    mel.connect_material_expressions(sd, "", dot, "B")
    neg = node(m, unreal.MaterialExpressionMultiply, -550, 650)
    mel.connect_material_expressions(dot, "", neg, "A")
    neg.set_editor_property("const_b", -4.0)
    sat = node(m, unreal.MaterialExpressionSaturate, -420, 650)
    mel.connect_material_expressions(neg, "", sat, "")
    em = node(m, unreal.MaterialExpressionMultiply, -250, 400)
    mel.connect_material_expressions(night, "RGB", em, "A")
    mel.connect_material_expressions(sat, "", em, "B")
    em2 = node(m, unreal.MaterialExpressionMultiply, -100, 400)
    mel.connect_material_expressions(em, "", em2, "A")
    em2.set_editor_property("const_b", 2500.0)
    mel.connect_material_property(em2, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return m


def build_moon_material():
    m = get_or_new("M_MoonGlobe")
    tc = node(m, unreal.MaterialExpressionTextureCoordinate, -600, 0)
    c = node(m, unreal.MaterialExpressionTextureSample, -300, 0)
    c.set_editor_property("texture", unreal.load_asset("/Game/Textures/T_Moon_Color_8k"))
    mel.connect_material_expressions(tc, "", c, "UVs")
    n = node(m, unreal.MaterialExpressionTextureSample, -300, 250)
    n.set_editor_property("texture", unreal.load_asset("/Game/Textures/T_Moon_Normal_8k"))
    n.set_editor_property("sampler_type", unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL)
    mel.connect_material_expressions(tc, "", n, "UVs")
    mel.connect_material_property(c, "RGB", unreal.MaterialProperty.MP_BASE_COLOR)
    mel.connect_material_property(n, "RGB", unreal.MaterialProperty.MP_NORMAL)
    r = node(m, unreal.MaterialExpressionConstant, -300, 400)
    r.set_editor_property("r", 0.92)
    mel.connect_material_property(r, "", unreal.MaterialProperty.MP_ROUGHNESS)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return m


def main():
    for d in ("/Game/TDRS", "/Game/Maps", "/Game/Materials"):
        eal.make_directory(d)
    g = json.load(open(ROOT + r"\data\unreal\stations\globe.json", encoding="utf-8"))
    sun_ue = itrs_to_ue(g["sun_dir_itrs"])
    moon_dir = itrs_to_ue(g["moon_dir_itrs"])

    if not os.environ.get("SITE_REUSE_MESHES"):
        t = unreal.AssetImportTask()
        t.filename, t.destination_path, t.destination_name = ROOT + r"\data\raw\tdrs\tdrs_a.glb", "/Game/TDRS", "tdrs"
        t.automated, t.replace_existing, t.replace_existing_settings, t.save = True, True, True, True
        at.import_asset_tasks([t])
    tdrs_meshes = [unreal.load_asset(p) for p in eal.list_assets("/Game/TDRS/tdrs_a/StaticMeshes", recursive=False, include_folder=False)]
    tdrs_meshes = [m for m in tdrs_meshes if isinstance(m, unreal.StaticMesh)]

    sphere = unreal.load_asset("/Game/Meshes/uvsphere/StaticMeshes/SM_UVSphere")
    m_earth, m_moon = build_earth_material(sun_ue), build_moon_material()

    les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    path = "/Game/Maps/Earth_Globe"
    umap = ROOT + r"\unreal\FezaMoon\Content\Maps\Earth_Globe.umap"
    if os.path.exists(umap):
        les.load_level(path)
    elif not les.new_level(path):
        raise RuntimeError("new_level basarisiz")
    eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    for a in list(eas.get_all_level_actors()):
        eas.destroy_actor(a)

    def sph(label, loc, radius, mat):
        a = eas.spawn_actor_from_class(unreal.StaticMeshActor, loc)
        a.set_actor_label(label)
        a.static_mesh_component.set_static_mesh(sphere)
        a.static_mesh_component.set_material(0, mat)
        s = radius / 100.0
        a.set_actor_scale3d(unreal.Vector(s, s, s))
        return a

    sph("Earth", unreal.Vector(0, 0, 0), EARTH_R, m_earth)
    md = g["moon_dist_km"] * KM
    mloc = unreal.Vector(moon_dir.x * md, moon_dir.y * md, moon_dir.z * md)
    moon = sph("Moon", mloc, MOON_R, m_moon)
    moon.set_actor_rotation(unreal.MathLibrary.make_rot_from_xz(unreal.Vector(-moon_dir.x, -moon_dir.y, -moon_dir.z), unreal.Vector(0, 0, 1)), False)   # yakin yuz Dunya'ya

    # TDRS (GEO): boyut abartili; uzun ekseni Dunya merkezinden disari
    for name, lon in TDRS:
        lo = math.radians(lon)
        d = unreal.Vector(math.cos(lo), -math.sin(lo), 0.0)
        loc = unreal.Vector(d.x * GEO_R, d.y * GEO_R, 0.0)
        rot = unreal.MathLibrary.make_rot_from_xz(unreal.Vector(-d.y, d.x, 0.0), unreal.Vector(0.0, 0.0, 1.0))
        for i, mesh in enumerate(tdrs_meshes):
            a = eas.spawn_actor_from_class(unreal.StaticMeshActor, loc, rot)
            a.set_actor_label("%s_%d" % (name, i))
            a.static_mesh_component.set_static_mesh(mesh)
            a.set_actor_scale3d(unreal.Vector(TDRS_SCALE, TDRS_SCALE, TDRS_SCALE))

    far = unreal.Vector(sun_ue.x * 1e9, sun_ue.y * 1e9, sun_ue.z * 1e9)
    sun = eas.spawn_actor_from_class(unreal.DirectionalLight, far)
    sun.set_actor_label("Sun")
    sun.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(far, unreal.Vector(0, 0, 0)), False)
    lc = sun.get_component_by_class(unreal.DirectionalLightComponent)
    lc.set_editor_property("intensity", SUN_LUX)
    lc.set_editor_property("light_source_angle", 0.53)

    ppv = eas.spawn_actor_from_class(unreal.PostProcessVolume, unreal.Vector(0, 0, 0))
    ppv.set_actor_label("Exposure")
    ppv.set_editor_property("unbound", True)
    st = ppv.get_editor_property("settings")
    st.set_editor_property("override_auto_exposure_method", True)
    st.set_editor_property("auto_exposure_method", unreal.AutoExposureMethod.AEM_MANUAL)
    st.set_editor_property("override_auto_exposure_bias", True)
    st.set_editor_property("auto_exposure_bias", -6.5)
    ppv.set_editor_property("settings", st)

    def camera(label, loc, target, focal):
        c = eas.spawn_actor_from_class(unreal.CineCameraActor, loc)
        c.set_actor_label(label)
        c.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(loc, target), False)
        c.get_cine_camera_component().set_editor_property("current_focal_length", focal)

    la, lo = math.radians(35.4267), math.radians(-116.8895)                    # Goldstone yonunden Dunya
    gd = unreal.Vector(math.cos(la) * math.cos(lo), -math.cos(la) * math.sin(lo), math.sin(la))
    camera("Cam_Globe", unreal.Vector(gd.x * 3.2 * EARTH_R, gd.y * 3.2 * EARTH_R, gd.z * 3.2 * EARTH_R), unreal.Vector(0, 0, 0), 35.0)
    e1 = math.radians(TDRS[0][1])
    ed = unreal.Vector(math.cos(e1), -math.sin(e1), 0.0)
    tl = unreal.Vector(ed.x * GEO_R, ed.y * GEO_R, 0.0)
    camera("Cam_Geo", unreal.Vector(tl.x + ed.y * 0.0 + ed.x * 9000.0 + 22000.0 * (-ed.y), tl.y + ed.y * 9000.0 + 22000.0 * ed.x, 6000.0), tl, 35.0)

    les.save_current_level()
    with open(ROOT + r"\data\scratch\earth_build.txt", "w", encoding="utf-8") as f:
        f.write("HAZIR Earth_Globe | tdrs parca %d | gunes %s | ay %s\n" % (len(tdrs_meshes), sun_ue, mloc))


main()
