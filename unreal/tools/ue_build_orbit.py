"""UE 5.8 icinde calisir: birlesik yorunge sahnesi /Game/Maps/Orbit  (Dunya + Ay + yildizlar + TDRS, ikisi de kadrajda).

Girdi : /Game/Textures/T_Earth_Day_16k, T_Earth_Night_8k, T_Moon_Color_8k, T_Moon_Normal_8k, /Game/Meshes/uvsphere/StaticMeshes/SM_UVSphere,
        /Game/TDRS/tdrs_a/StaticMeshes/*, data/unreal/textures/stars_8k.png + clouds_8k.png (make_stars_clouds.py)
Cikti : /Game/Space/Textures, /Game/Space/Materials, /Game/Maps/Orbit (+ Cam_Shot_Overview / Cam_Shot_Moon / Cam_Shot_Earth)
Olcek : Dunya yaricapi 63710 cm, Ay yaricapi 17374 cm (gercek oran); aralarindaki mesafe gosterim icin sikistirildi (Dunya-Ay 280000 cm).
Isiklandirma: tek Gunes (kameranin arkasi/solu); Dunya + Ay ikisi de aydinlik. Etiket yok.
Isaretciler ayri betikle: ue_add_site_markers.py (Ay: sites.json, Dunya: stations.json).
Calistirma (editor kapali): UnrealEditor-Cmd.exe <proje> -ExecutePythonScript="<bu dosya>" -unattended -nosplash
"""
import math
import os

import unreal

ROOT = r"C:\Users\Berke\FEZA_Unreal"
R_E, R_M = 63710.0, 28000.0                    # Ay gosterim icin ~1.6x buyutuldu (tiklamak kolay)
MOON_POS = unreal.Vector(0.0, 215000.0, 14000.0)
SUN_DIR = (-0.70, -0.55, 0.45)                    # Dunya/Ay merkezinden Gunes'e yon
EXPOSURE = -5.5
STAR_R = 4.0e8
TDRS = [("TDRS-East", -41.0), ("TDRS-West", -171.0), ("TDRS-Z", -85.0)]
TDRS_RING = 2.1 * R_E
TDRS_SCALE = 260.0

at = unreal.AssetToolsHelpers.get_asset_tools()
mel = unreal.MaterialEditingLibrary
eal = unreal.EditorAssetLibrary


def node(m, cls, x, y):
    return mel.create_material_expression(m, cls, x, y)


def get_or_new(name):
    folder = "/Game/Space/Materials"
    p = folder + "/" + name
    if eal.does_asset_exist(p):
        m = unreal.load_asset(p)
        mel.delete_all_material_expressions(m)
        return m
    return at.create_asset(name, folder, unreal.Material, unreal.MaterialFactoryNew())


def tex(path):
    return unreal.load_asset(path)


def sunvec(m, x, y):
    c = node(m, unreal.MaterialExpressionVectorParameter, x, y)
    n = math.sqrt(sum(v * v for v in SUN_DIR))
    c.set_editor_property("parameter_name", "SunDir")
    c.set_editor_property("default_value", unreal.LinearColor(SUN_DIR[0] / n, SUN_DIR[1] / n, SUN_DIR[2] / n, 0))
    return c


def gain_mul(m, src, x, y):
    """Yayici cikis x EmissiveGain parametresi (pozlama farkli sahnelerde ayni gorunum icin)."""
    g = node(m, unreal.MaterialExpressionScalarParameter, x, y + 120)
    g.set_editor_property("parameter_name", "EmissiveGain")
    g.set_editor_property("default_value", 1.0)
    n = node(m, unreal.MaterialExpressionMultiply, x + 150, y)
    mel.connect_material_expressions(src, "", n, "A")
    mel.connect_material_expressions(g, "", n, "B")
    return n


def ndotl(m, x, y):
    vn = node(m, unreal.MaterialExpressionVertexNormalWS, x, y)
    d = node(m, unreal.MaterialExpressionDotProduct, x + 150, y)
    mel.connect_material_expressions(vn, "", d, "A")
    mel.connect_material_expressions(sunvec(m, x, y + 100), "", d, "B")
    return d


def mulc(m, src, k, x, y, out=""):
    n = node(m, unreal.MaterialExpressionMultiply, x, y)
    mel.connect_material_expressions(src, out, n, "A")
    n.set_editor_property("const_b", k)
    return n


def build_earth():
    m = get_or_new("M_EarthOrbit")
    day = node(m, unreal.MaterialExpressionTextureSample, -1100, 0)
    day.set_editor_property("texture", tex("/Game/Textures/T_Earth_Day_16k"))
    night = node(m, unreal.MaterialExpressionTextureSample, -1100, 350)
    night.set_editor_property("texture", tex("/Game/Textures/T_Earth_Night_8k"))
    mel.connect_material_property(mulc(m, day, 1.35, -800, 0, "RGB"), "", unreal.MaterialProperty.MP_BASE_COLOR)     # parlaklik: Blue Marble sonuk
    # okyanus: mavi baskin -> dusuk puruzluluk (gunes parlamasi)
    sub = node(m, unreal.MaterialExpressionSubtract, -800, 160)
    mel.connect_material_expressions(day, "B", sub, "A")
    mel.connect_material_expressions(day, "R", sub, "B")
    sat = node(m, unreal.MaterialExpressionSaturate, -560, 160)
    mel.connect_material_expressions(mulc(m, sub, 3.0, -680, 160), "", sat, "")
    lerp = node(m, unreal.MaterialExpressionLinearInterpolate, -420, 160)
    lerp.set_editor_property("const_a", 0.85)
    lerp.set_editor_property("const_b", 0.42)
    mel.connect_material_expressions(sat, "", lerp, "Alpha")
    mel.connect_material_property(lerp, "", unreal.MaterialProperty.MP_ROUGHNESS)
    # gece isiklari: Gunes'e ters yuzde
    d = ndotl(m, -1100, 650)
    neg = mulc(m, d, -4.0, -800, 650)
    s2 = node(m, unreal.MaterialExpressionSaturate, -650, 650)
    mel.connect_material_expressions(neg, "", s2, "")
    em = node(m, unreal.MaterialExpressionMultiply, -500, 450)
    mel.connect_material_expressions(night, "RGB", em, "A")
    mel.connect_material_expressions(s2, "", em, "B")
    night_e = mulc(m, em, 20000.0, -350, 450)
    # hafif ortam isigi: gunduz yuzu ve terminator civari (atmosfer saciliminin yerine); okyanus yansimasi kararmasin
    amb = node(m, unreal.MaterialExpressionAdd, -650, 800)
    mel.connect_material_expressions(mulc(m, d, 0.5, -800, 800), "", amb, "A")
    amb.set_editor_property("const_b", 0.22)
    amb_s = node(m, unreal.MaterialExpressionSaturate, -520, 800)
    mel.connect_material_expressions(amb, "", amb_s, "")
    amb_c = node(m, unreal.MaterialExpressionMultiply, -380, 800)
    mel.connect_material_expressions(day, "RGB", amb_c, "A")
    mel.connect_material_expressions(amb_s, "", amb_c, "B")
    tot = node(m, unreal.MaterialExpressionAdd, -150, 600)
    mel.connect_material_expressions(night_e, "", tot, "A")
    mel.connect_material_expressions(mulc(m, amb_c, 1500.0, -250, 800), "", tot, "B")
    mel.connect_material_property(gain_mul(m, tot, 0, 600), "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return m


def build_clouds():
    m = get_or_new("M_EarthClouds")
    m.set_editor_property("blend_mode", unreal.BlendMode.BLEND_TRANSLUCENT)
    m.set_editor_property("translucency_lighting_mode", unreal.TranslucencyLightingMode.TLM_SURFACE)
    c = node(m, unreal.MaterialExpressionTextureSample, -700, 0)
    c.set_editor_property("texture", tex("/Game/Space/Textures/clouds_8k"))
    mel.connect_material_property(mulc(m, c, 0.55, -450, 0, "R"), "", unreal.MaterialProperty.MP_OPACITY)
    col = node(m, unreal.MaterialExpressionConstant3Vector, -450, -200)
    col.set_editor_property("constant", unreal.LinearColor(0.95, 0.96, 1.0, 0))
    mel.connect_material_property(col, "", unreal.MaterialProperty.MP_BASE_COLOR)
    r = node(m, unreal.MaterialExpressionConstant, -450, 200)
    r.set_editor_property("r", 0.95)
    mel.connect_material_property(r, "", unreal.MaterialProperty.MP_ROUGHNESS)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return m


def build_atmosphere():
    m = get_or_new("M_EarthAtmo")
    m.set_editor_property("blend_mode", unreal.BlendMode.BLEND_ADDITIVE)
    m.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_UNLIT)
    fr = node(m, unreal.MaterialExpressionFresnel, -800, 0)
    fr.set_editor_property("exponent", 3.6)
    d = ndotl(m, -900, 300)
    a = mulc(m, d, 1.4, -650, 300)
    b = node(m, unreal.MaterialExpressionAdd, -500, 300)
    mel.connect_material_expressions(a, "", b, "A")
    b.set_editor_property("const_b", 0.35)
    sm = node(m, unreal.MaterialExpressionSaturate, -380, 300)
    mel.connect_material_expressions(b, "", sm, "")
    e = node(m, unreal.MaterialExpressionMultiply, -300, 80)
    mel.connect_material_expressions(fr, "", e, "A")
    mel.connect_material_expressions(sm, "", e, "B")
    col = node(m, unreal.MaterialExpressionConstant3Vector, -300, -120)
    col.set_editor_property("constant", unreal.LinearColor(0.20, 0.48, 1.0, 0))
    e2 = node(m, unreal.MaterialExpressionMultiply, -150, 40)
    mel.connect_material_expressions(e, "", e2, "A")
    mel.connect_material_expressions(col, "", e2, "B")
    mel.connect_material_property(gain_mul(m, mulc(m, e2, 15000.0, 0, 40), 200, 40), "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return m


def build_moon():
    m = get_or_new("M_MoonOrbit")
    tc = node(m, unreal.MaterialExpressionTextureCoordinate, -700, 0)
    c = node(m, unreal.MaterialExpressionTextureSample, -400, 0)
    c.set_editor_property("texture", tex("/Game/Textures/T_Moon_Color_8k"))
    mel.connect_material_expressions(tc, "", c, "UVs")
    n = node(m, unreal.MaterialExpressionTextureSample, -400, 250)
    n.set_editor_property("texture", tex("/Game/Textures/T_Moon_Normal_8k"))
    n.set_editor_property("sampler_type", unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL)
    mel.connect_material_expressions(tc, "", n, "UVs")
    mel.connect_material_property(mulc(m, c, 0.62, -200, 0, "RGB"), "", unreal.MaterialProperty.MP_BASE_COLOR)
    mel.connect_material_property(n, "RGB", unreal.MaterialProperty.MP_NORMAL)
    r = node(m, unreal.MaterialExpressionConstant, -400, 420)
    r.set_editor_property("r", 0.93)
    mel.connect_material_property(r, "", unreal.MaterialProperty.MP_ROUGHNESS)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return m


def build_stars():
    m = get_or_new("M_Stars")
    m.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_UNLIT)
    m.set_editor_property("two_sided", True)
    s = node(m, unreal.MaterialExpressionTextureSample, -600, 0)
    s.set_editor_property("texture", tex("/Game/Space/Textures/stars_8k"))
    mel.connect_material_property(gain_mul(m, mulc(m, s, 20000.0, -300, 0, "RGB"), -100, 0), "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return m


def import_textures():
    items = [(ROOT + r"\data\unreal\textures\stars_8k.png", "stars_8k", True), (ROOT + r"\data\unreal\textures\clouds_8k.png", "clouds_8k", False)]
    for src, name, srgb in items:
        t = unreal.AssetImportTask()
        t.filename, t.destination_path, t.destination_name = src, "/Game/Space/Textures", name
        t.automated, t.replace_existing, t.replace_existing_settings, t.save = True, True, True, True
        at.import_asset_tasks([t])
        a = unreal.load_asset("/Game/Space/Textures/" + name)
        a.set_editor_property("srgb", srgb)
        a.set_editor_property("never_stream", True)
        eal.save_loaded_asset(a)
    e = unreal.load_asset("/Game/Textures/T_Earth_Day_16k")           # 16k Dunya dokusu hep tam cozunurlukte (RTX 4070 12 GB)
    e.set_editor_property("never_stream", True)
    eal.save_loaded_asset(e)


def main():
    for d in ("/Game/Space/Textures", "/Game/Space/Materials", "/Game/Maps"):
        eal.make_directory(d)
    if not os.environ.get("SITE_REUSE_MESHES"):
        import_textures()
    for tp in ("/Game/Textures/T_Moon_Color_8k", "/Game/Textures/T_Moon_Normal_8k", "/Game/Textures/T_Earth_Night_8k"):     # akisa bagli mip dusmesin
        ta = unreal.load_asset(tp)
        ta.set_editor_property("never_stream", True)
        eal.save_loaded_asset(ta)
    m_earth, m_cloud, m_atmo, m_moon, m_stars = build_earth(), build_clouds(), build_atmosphere(), build_moon(), build_stars()
    sphere = unreal.load_asset("/Game/Meshes/uvsphere/StaticMeshes/SM_UVSphere")
    ns = sphere.get_editor_property("nanite_settings")      # Nanite: kaba parca ve saydam/ek katman sorunlari -> kapali (65k kose yeter)
    ns.set_editor_property("enabled", False)
    sphere.set_editor_property("nanite_settings", ns)
    eal.save_loaded_asset(sphere)
    tdrs_meshes = [m for m in (unreal.load_asset(p) for p in eal.list_assets("/Game/TDRS/tdrs_a/StaticMeshes", recursive=False, include_folder=False)) if isinstance(m, unreal.StaticMesh)]

    les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    path = "/Game/Maps/Orbit"
    umap = ROOT + r"\unreal\FezaMoon\Content\Maps\Orbit.umap"
    if os.path.exists(umap):
        les.load_level(path)
    elif not les.new_level(path):
        raise RuntimeError("new_level basarisiz")
    eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    for a in list(eas.get_all_level_actors()):
        eas.destroy_actor(a)

    def sph(label, loc, radius, mat, rot=None, shadow=True):
        a = eas.spawn_actor_from_class(unreal.StaticMeshActor, loc, rot or unreal.Rotator())
        a.set_actor_label(label)
        c = a.static_mesh_component
        c.set_static_mesh(sphere)
        c.set_material(0, mat)
        c.set_editor_property("cast_shadow", shadow)
        s = radius / 100.0
        a.set_actor_scale3d(unreal.Vector(s, s, s))
        return a

    earth_rot = unreal.Rotator(roll=14.0, pitch=0.0, yaw=140.0)                   # Atlantik/Amerika kameraya, hafif eksen egimi
    sph("Earth", unreal.Vector(0, 0, 0), R_E, m_earth, earth_rot)
    sph("EarthClouds", unreal.Vector(0, 0, 0), R_E * 1.004, m_cloud, earth_rot, shadow=False)
    sph("EarthAtmosphere", unreal.Vector(0, 0, 0), R_E * 1.04, m_atmo, shadow=False)

    to_earth = unreal.Vector(-MOON_POS.x, -MOON_POS.y, -MOON_POS.z)
    ln = math.sqrt(to_earth.x ** 2 + to_earth.y ** 2 + to_earth.z ** 2)
    moon_rot = unreal.MathLibrary.make_rot_from_xz(unreal.Vector(to_earth.x / ln, to_earth.y / ln, to_earth.z / ln), unreal.Vector(0, 0, 1))
    sph("Moon", MOON_POS, R_M, m_moon, moon_rot)
    sph("Stars", unreal.Vector(0, 0, 0), STAR_R, m_stars, shadow=False)

    # TDRS: Dunya ekvatorunda halka (gosterim icin sikistirilmis), boyut abartili
    tf = unreal.Transform(location=unreal.Vector(0, 0, 0), rotation=earth_rot, scale=unreal.Vector(1, 1, 1))
    for name, lon in TDRS:
        lo = math.radians(lon)
        d = unreal.MathLibrary.transform_direction(tf, unreal.Vector(math.cos(lo), -math.sin(lo), 0.0))
        loc = unreal.Vector(d.x * TDRS_RING, d.y * TDRS_RING, d.z * TDRS_RING)
        rot = unreal.MathLibrary.make_rot_from_xz(d, unreal.Vector(0, 0, 1))
        for i, mesh in enumerate(tdrs_meshes):
            a = eas.spawn_actor_from_class(unreal.StaticMeshActor, loc, rot)
            a.set_actor_label("%s_%d" % (name, i))
            a.static_mesh_component.set_static_mesh(mesh)
            a.set_actor_scale3d(unreal.Vector(TDRS_SCALE, TDRS_SCALE, TDRS_SCALE))

    n = math.sqrt(sum(v * v for v in SUN_DIR))
    far = unreal.Vector(SUN_DIR[0] / n * 1e9, SUN_DIR[1] / n * 1e9, SUN_DIR[2] / n * 1e9)
    sun = eas.spawn_actor_from_class(unreal.DirectionalLight, far)
    sun.set_actor_label("Sun")
    sun.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(far, unreal.Vector(0, 0, 0)), False)
    lc = sun.get_component_by_class(unreal.DirectionalLightComponent)
    lc.set_editor_property("intensity", 120000.0)
    lc.set_editor_property("light_source_angle", 0.53)

    ppv = eas.spawn_actor_from_class(unreal.PostProcessVolume, unreal.Vector(0, 0, 0))
    ppv.set_actor_label("Exposure")
    ppv.set_editor_property("unbound", True)
    st = ppv.get_editor_property("settings")
    st.set_editor_property("override_auto_exposure_method", True)
    st.set_editor_property("auto_exposure_method", unreal.AutoExposureMethod.AEM_MANUAL)
    st.set_editor_property("override_auto_exposure_bias", True)
    st.set_editor_property("auto_exposure_bias", EXPOSURE)
    st.set_editor_property("override_motion_blur_amount", True)       # kamera yaklasirken hareket bulanikligi olmasin
    st.set_editor_property("motion_blur_amount", 0.0)
    ppv.set_editor_property("settings", st)

    def camera(label, loc, target, focal):
        c = eas.spawn_actor_from_class(unreal.CineCameraActor, loc)
        c.set_actor_label(label)
        c.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(loc, target), False)
        c.get_cine_camera_component().set_editor_property("current_focal_length", focal)

    mid = unreal.Vector(0.0, MOON_POS.y * 0.5, MOON_POS.z * 0.5)
    camera("Cam_Shot_Overview", unreal.Vector(-420000.0, mid.y + 18000.0, mid.z + 60000.0), mid, 26.0)
    md = 3.2 * R_M
    camera("Cam_Shot_Moon", unreal.Vector(MOON_POS.x - md * 0.9, MOON_POS.y - md * 0.45, MOON_POS.z + md * 0.15), MOON_POS, 30.0)
    ed = 3.0 * R_E
    camera("Cam_Shot_Earth", unreal.Vector(-ed * 0.95, ed * 0.1, ed * 0.3), unreal.Vector(0, 0, 0), 30.0)

    les.save_current_level()
    with open(ROOT + r"\data\scratch\orbit_build.txt", "w", encoding="utf-8") as f:
        f.write("HAZIR Orbit | tdrs parca %d\n" % len(tdrs_meshes))


main()
