"""UE 5.8 icinde calisir (Python Script Plugin). Doku/mesh ice aktarir, materyalleri ve ana seviyeyi kurar.

Calistirma (editor kapaliyken):
  UnrealEditor-Cmd.exe <proje>.uproject -ExecutePythonScript="<bu dosya>" -unattended -nosplash

Olcek: 1 km = 10 cm (UE birimi). Ay yaricapi 1737,4 km -> 17374 cm.
Koordinat: MOON_ME (x,y,z) dogrudan UE (x,y,z); ters cikarsa Y aynalanir (bkz. MIRROR_Y).
"""
import json, math
import unreal

ROOT = r"C:\Users\Berke\FEZA_Unreal"
TEX = ROOT + r"\data\unreal\textures"
MESH = ROOT + r"\data\unreal\meshes\uvsphere.glb"
KM = 10.0                      # cm / km
MOON_R_KM, EARTH_R_KM = 1737.4, 6371.0
MIRROR_Y = True
SUN_LUX = 120000.0

at = unreal.AssetToolsHelpers.get_asset_tools()
mel = unreal.MaterialEditingLibrary


def import_file(src, dest_dir, name):
    t = unreal.AssetImportTask()
    t.filename = src
    t.destination_path = dest_dir
    t.destination_name = name
    t.automated = True
    t.replace_existing = True
    t.replace_existing_settings = True
    t.save = True
    at.import_asset_tasks([t])
    paths = list(t.get_editor_property("imported_object_paths"))
    a = unreal.load_asset(paths[0]) if paths else None
    unreal.log(f"import {name}: {'OK ' + paths[0] if a else 'BASARISIZ'}")
    return a


def tex(name, file, normal=False, srgb=True):
    t = import_file(f"{TEX}\\{file}", "/Game/Textures", name)
    if normal:
        t.set_editor_property("compression_settings", unreal.TextureCompressionSettings.TC_NORMALMAP)
        t.set_editor_property("srgb", False)
    else:
        t.set_editor_property("srgb", srgb)
    t.set_editor_property("never_stream", False)
    unreal.EditorAssetLibrary.save_loaded_asset(t)
    return t


def new_material(name):
    p = f"/Game/Materials/{name}"
    if unreal.EditorAssetLibrary.does_asset_exist(p):
        unreal.EditorAssetLibrary.delete_asset(p)
    return at.create_asset(name, "/Game/Materials", unreal.Material, unreal.MaterialFactoryNew())


def node(m, cls, x, y):
    return mel.create_material_expression(m, cls, x, y)


def sample(m, texture, x, y, normal=False):
    n = node(m, unreal.MaterialExpressionTextureSample, x, y)
    n.set_editor_property("texture", texture)
    if normal:
        n.set_editor_property("sampler_type", unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL)
    return n


def const(m, v, x, y):
    c = node(m, unreal.MaterialExpressionConstant, x, y)
    c.set_editor_property("r", v)
    return c


def build_moon_material(color, normal):
    m = new_material("M_Moon")
    mel.connect_material_property(sample(m, color, -600, -100), "RGB", unreal.MaterialProperty.MP_BASE_COLOR)
    mel.connect_material_property(sample(m, normal, -600, 200, True), "RGB", unreal.MaterialProperty.MP_NORMAL)
    mel.connect_material_property(const(m, 0.95, -300, 100), "", unreal.MaterialProperty.MP_ROUGHNESS)
    mel.recompile_material(m)
    unreal.EditorAssetLibrary.save_loaded_asset(m)
    return m


def build_sun_mpc(sun_dir):
    p = "/Game/Materials/MPC_Sun"
    if unreal.EditorAssetLibrary.does_asset_exist(p):
        unreal.EditorAssetLibrary.delete_asset(p)
    mpc = at.create_asset("MPC_Sun", "/Game/Materials", unreal.MaterialParameterCollection,
                          unreal.MaterialParameterCollectionFactoryNew())
    vp = unreal.CollectionVectorParameter()
    vp.set_editor_property("parameter_name", "SunDir")
    vp.set_editor_property("default_value", unreal.LinearColor(sun_dir[0], sun_dir[1], sun_dir[2], 0))
    mpc.set_editor_property("vector_parameters", [vp])
    unreal.EditorAssetLibrary.save_loaded_asset(mpc)
    return mpc


def build_earth_material(day, night, sun_dir, mpc):
    m = new_material("M_Earth")
    mel.connect_material_property(sample(m, day, -900, -200), "RGB", unreal.MaterialProperty.MP_BASE_COLOR)
    mel.connect_material_property(const(m, 0.55, -600, 0), "", unreal.MaterialProperty.MP_ROUGHNESS)
    # Gece isiklari: yalnizca Gunes'e bakmayan yarida gorunur
    nrm = node(m, unreal.MaterialExpressionVertexNormalWS, -1100, 300)
    sun = node(m, unreal.MaterialExpressionCollectionParameter, -1100, 450)
    sun.set_editor_property("collection", mpc)
    sun.set_editor_property("parameter_name", "SunDir")
    dot = node(m, unreal.MaterialExpressionDotProduct, -850, 380)
    mel.connect_material_expressions(nrm, "", dot, "A")
    mel.connect_material_expressions(sun, "", dot, "B")
    mul = node(m, unreal.MaterialExpressionMultiply, -650, 380)
    mel.connect_material_expressions(dot, "", mul, "A")
    mul.set_editor_property("const_b", -6.0)
    sat = node(m, unreal.MaterialExpressionSaturate, -480, 380)
    mel.connect_material_expressions(mul, "", sat, "")
    ns = sample(m, night, -900, 600)
    gain = node(m, unreal.MaterialExpressionMultiply, -300, 520)
    mel.connect_material_expressions(ns, "RGB", gain, "A")
    mel.connect_material_expressions(sat, "", gain, "B")
    em = node(m, unreal.MaterialExpressionMultiply, -150, 520)
    mel.connect_material_expressions(gain, "", em, "A")
    em.set_editor_property("const_b", 2500.0)   # gunes isigina (120000 lux, EV -6) gore gorunur gece isiklari
    mel.connect_material_property(em, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    mel.recompile_material(m)
    unreal.EditorAssetLibrary.save_loaded_asset(m)
    return m


def ue_vec(v):
    return unreal.Vector(v[0], -v[1] if MIRROR_Y else v[1], v[2])


def main():
    bodies = json.load(open(ROOT + r"\data\unreal\bodies.json", encoding="utf-8"))
    sun_km = bodies["sun_pos_km"][0]
    earth_km = bodies["earth_pos_km"][0]
    n = math.dist(sun_km, (0, 0, 0))
    sun_dir = [c / n for c in sun_km]

    unreal.EditorAssetLibrary.make_directory("/Game/Textures")
    unreal.EditorAssetLibrary.make_directory("/Game/Materials")
    unreal.EditorAssetLibrary.make_directory("/Game/Meshes")
    moon_c = tex("T_Moon_Color_8k", "moon_color_8k.png")
    moon_n = tex("T_Moon_Normal_8k", "moon_normal_8k.png", normal=True)
    earth_d = tex("T_Earth_Day_16k", "earth_day_16k.png")
    earth_n = tex("T_Earth_Night_8k", "earth_night_8k.png")
    sphere = import_file(MESH, "/Game/Meshes", "SM_UVSphere")
    if not sphere:
        raise RuntimeError("kure mesh'i ice aktarilamadi")
    ns = sphere.get_editor_property("nanite_settings")
    ns.set_editor_property("enabled", True)
    ns.set_editor_property("fallback_relative_error", 0.0)
    sphere.set_editor_property("nanite_settings", ns)
    unreal.EditorAssetLibrary.save_loaded_asset(sphere)
    sub = unreal.get_editor_subsystem(unreal.StaticMeshEditorSubsystem)
    unreal.log("MESH verts=%d" % sub.get_number_verts(sphere, 0))

    m_moon = build_moon_material(moon_c, moon_n)
    mpc = build_sun_mpc(sun_dir)
    m_earth = build_earth_material(earth_d, earth_n, sun_dir, mpc)

    les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    unreal.EditorAssetLibrary.make_directory("/Game/Maps")
    les.new_level("/Game/Maps/Main")
    eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)

    def sphere_actor(label, loc, radius_km, mat):
        a = eas.spawn_actor_from_class(unreal.StaticMeshActor, loc)
        a.set_actor_label(label)
        c = a.static_mesh_component
        c.set_static_mesh(sphere)
        s = radius_km * KM / 100.0          # birim kure yaricapi 100 cm
        a.set_actor_scale3d(unreal.Vector(s, s, s))
        c.set_material(0, mat)
        return a

    sphere_actor("Moon", unreal.Vector(0, 0, 0), MOON_R_KM, m_moon)
    e = ue_vec(earth_km)
    sphere_actor("Earth", unreal.Vector(e.x * KM, e.y * KM, e.z * KM), EARTH_R_KM, m_earth)

    sd = ue_vec(sun_dir)
    far = unreal.Vector(sd.x * 1e8, sd.y * 1e8, sd.z * 1e8)
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
    st.set_editor_property("auto_exposure_bias", -6.0)
    ppv.set_editor_property("settings", st)

    # Test kamerasi: Ay'dan 3.2 yaricap uzakta, Gunes yonune dik; yari aydinlik Ay gorunur
    perp = (sd.y, -sd.x, 0.0)
    L = math.hypot(perp[0], perp[1]) or 1.0
    d = MOON_R_KM * KM * 3.2
    cam_loc = unreal.Vector(perp[0] / L * d, perp[1] / L * d, 0)
    cam = eas.spawn_actor_from_class(unreal.CineCameraActor, cam_loc)
    cam.set_actor_label("Cam_Moon")
    cam.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(cam_loc, unreal.Vector(0, 0, 0)), False)

    les.save_current_level()
    unreal.log("SAHNE HAZIR: /Game/Maps/Main")


main()
