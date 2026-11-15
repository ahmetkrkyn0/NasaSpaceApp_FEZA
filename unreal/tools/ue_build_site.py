"""UE 5.8 icinde calisir: inis sahasi seviyesi (/Game/Maps/Site_LBP) kurar.

Girdi : data/unreal/meshes/site/{layout.json,site_info.json,*.glb}, data/unreal/textures/{site_macro_*_4k,regolith_*}.png
Calistirma (editor kapali): UnrealEditor-Cmd.exe <proje> -ExecutePythonScript="<bu dosya>" -unattended -nosplash

Cerceve (UE, cm): X = grid y (goruntu yukari), Y = grid x (goruntu sag), Z yukari. Yerel kuzey/dogu = grid donusu (boylam L).
"""
import json
import math
import os

import unreal

ROOT = r"C:\Users\Berke\FEZA_Unreal"
TEX = ROOT + r"\data\unreal\textures"
MESHD = ROOT + r"\data\unreal\meshes\site"
SUN_LUX = 120000.0
BIAS = -2.5

at = unreal.AssetToolsHelpers.get_asset_tools()
mel = unreal.MaterialEditingLibrary
eal = unreal.EditorAssetLibrary


def import_files(items):
    """items: [(src, dest_dir, name)] -> {name: asset}"""
    tasks = []
    for src, d, n in items:
        t = unreal.AssetImportTask()
        t.filename, t.destination_path, t.destination_name = src, d, n
        t.automated = True
        t.replace_existing = True
        t.replace_existing_settings = True
        t.save = True
        tasks.append((n, t))
    at.import_asset_tasks([t for _, t in tasks])
    out = {}
    for n, t in tasks:
        paths = list(t.get_editor_property("imported_object_paths"))
        out[n] = unreal.load_asset(paths[0]) if paths else None
        unreal.log("import %s: %s" % (n, paths[0] if paths else "BASARISIZ"))
    return out


def tex_settings(t, normal=False, srgb=False):
    if normal:
        t.set_editor_property("compression_settings", unreal.TextureCompressionSettings.TC_NORMALMAP)
        t.set_editor_property("srgb", False)
    else:
        t.set_editor_property("srgb", srgb)
    t.set_editor_property("never_stream", False)
    eal.save_loaded_asset(t)


def node(m, cls, x, y):
    return mel.create_material_expression(m, cls, x, y)


def c3(m, r, g, b, x, y):
    n = node(m, unreal.MaterialExpressionConstant3Vector, x, y)
    n.set_editor_property("constant", unreal.LinearColor(r, g, b, 0))
    return n


def mulc(m, src, k, x, y, out=""):
    n = node(m, unreal.MaterialExpressionMultiply, x, y)
    mel.connect_material_expressions(src, out, n, "A")
    n.set_editor_property("const_b", k)
    return n


def build_material():
    p = "/Game/Site/Materials/M_Regolith"
    if eal.does_asset_exist(p):
        eal.delete_asset(p)
    m = at.create_asset("M_Regolith", "/Game/Site/Materials", unreal.Material, unreal.MaterialFactoryNew())

    tc = node(m, unreal.MaterialExpressionTextureCoordinate, -1800, 0)
    tcm = tc                                                             # mesh UV'si zaten metre cinsinden
    uv1 = mulc(m, tcm, 0.5, -1400, 0)                                    # D1: periyot 2 m
    uv2 = mulc(m, tcm, 1.0 / 0.30, -1400, 200)                           # D2: periyot 0.30 m
    uv1b0 = mulc(m, tcm, 0.5 * 0.37, -1400, -250)                        # D1'in ikinci ornegi: farkli olcek + otele (desen kirma)
    uv1b = node(m, unreal.MaterialExpressionAdd, -1250, -250)
    mel.connect_material_expressions(uv1b0, "", uv1b, "A")
    uv1b.set_editor_property("const_b", 0.317)

    macro = node(m, unreal.MaterialExpressionTextureSampleParameter2D, -1200, -400)
    macro.set_editor_property("parameter_name", "MacroAlbedo")
    # makro UV: dunya konumundan  u=(Y-Y0)/S, v=(Xtop-X)/S  (cm)
    wp = node(m, unreal.MaterialExpressionWorldPosition, -2300, -560)
    mx = node(m, unreal.MaterialExpressionComponentMask, -2150, -620)
    for k, v_ in (("r", True), ("g", False), ("b", False), ("a", False)):
        mx.set_editor_property(k, v_)
    my = node(m, unreal.MaterialExpressionComponentMask, -2150, -500)
    for k, v_ in (("r", False), ("g", True), ("b", False), ("a", False)):
        my.set_editor_property(k, v_)
    mel.connect_material_expressions(wp, "", mx, "")
    mel.connect_material_expressions(wp, "", my, "")

    def sparam(name, x, y):
        s = node(m, unreal.MaterialExpressionScalarParameter, x, y)
        s.set_editor_property("parameter_name", name)
        s.set_editor_property("default_value", 1.0)
        return s

    py0, pxt, psz = sparam("MacroY0Cm", -2150, -380), sparam("MacroXTopCm", -2150, -300), sparam("MacroSizeCm", -2150, -220)
    su = node(m, unreal.MaterialExpressionSubtract, -1980, -500)
    mel.connect_material_expressions(my, "", su, "A")
    mel.connect_material_expressions(py0, "", su, "B")
    du = node(m, unreal.MaterialExpressionDivide, -1850, -500)
    mel.connect_material_expressions(su, "", du, "A")
    mel.connect_material_expressions(psz, "", du, "B")
    sv = node(m, unreal.MaterialExpressionSubtract, -1980, -620)
    mel.connect_material_expressions(pxt, "", sv, "A")
    mel.connect_material_expressions(mx, "", sv, "B")
    dv = node(m, unreal.MaterialExpressionDivide, -1850, -620)
    mel.connect_material_expressions(sv, "", dv, "A")
    mel.connect_material_expressions(psz, "", dv, "B")
    app = node(m, unreal.MaterialExpressionAppendVector, -1700, -560)
    mel.connect_material_expressions(du, "", app, "A")
    mel.connect_material_expressions(dv, "", app, "B")
    mel.connect_material_expressions(app, "", macro, "UVs")
    d1a = node(m, unreal.MaterialExpressionTextureSample, -1200, -150)
    d1a.set_editor_property("texture", unreal.load_asset("/Game/Site/Textures/T_Reg_D1_A"))
    mel.connect_material_expressions(uv1, "", d1a, "UVs")
    d1n = node(m, unreal.MaterialExpressionTextureSample, -1200, 100)
    d1n.set_editor_property("texture", unreal.load_asset("/Game/Site/Textures/T_Reg_D1_N"))
    d1n.set_editor_property("sampler_type", unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL)
    mel.connect_material_expressions(uv1, "", d1n, "UVs")
    d1nb = node(m, unreal.MaterialExpressionTextureSample, -1200, 220)
    d1nb.set_editor_property("texture", unreal.load_asset("/Game/Site/Textures/T_Reg_D1_N"))
    d1nb.set_editor_property("sampler_type", unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL)
    mel.connect_material_expressions(uv1b, "", d1nb, "UVs")
    d2n = node(m, unreal.MaterialExpressionTextureSample, -1200, 350)
    d2n.set_editor_property("texture", unreal.load_asset("/Game/Site/Textures/T_Reg_D2_N"))
    d2n.set_editor_property("sampler_type", unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL)
    mel.connect_material_expressions(uv2, "", d2n, "UVs")

    # --- taban renk: makro yansitma * detay varyasyon * ton ---
    lerp = node(m, unreal.MaterialExpressionLinearInterpolate, -800, -400)
    lerp.set_editor_property("const_a", 0.05)
    lerp.set_editor_property("const_b", 0.17)
    mel.connect_material_expressions(macro, "R", lerp, "Alpha")
    var = mulc(m, d1a, 2.0, -800, -150, "R")
    mul1 = node(m, unreal.MaterialExpressionMultiply, -600, -300)
    mel.connect_material_expressions(lerp, "", mul1, "A")
    mel.connect_material_expressions(var, "", mul1, "B")
    tint = c3(m, 1.0, 0.965, 0.92, -600, -150)
    mul2 = node(m, unreal.MaterialExpressionMultiply, -400, -250)
    mel.connect_material_expressions(mul1, "", mul2, "A")
    mel.connect_material_expressions(tint, "", mul2, "B")
    mel.connect_material_property(mul2, "", unreal.MaterialProperty.MP_BASE_COLOR)

    # --- normal: mesafeye gore solan iki ince normal ---
    pd = node(m, unreal.MaterialExpressionPixelDepth, -1000, 600)

    def fade(dist_cm, y):
        d = node(m, unreal.MaterialExpressionDivide, -800, y)
        mel.connect_material_expressions(pd, "", d, "A")
        d.set_editor_property("const_b", dist_cm)
        o = node(m, unreal.MaterialExpressionOneMinus, -650, y)
        mel.connect_material_expressions(d, "", o, "")
        s = node(m, unreal.MaterialExpressionSaturate, -520, y)
        mel.connect_material_expressions(o, "", s, "")
        return s

    f1, f2 = fade(80000.0, 560), fade(6000.0, 700)
    flat = c3(m, 0.0, 0.0, 1.0, -800, 450)

    def mix(tex, f, y):
        l = node(m, unreal.MaterialExpressionLinearInterpolate, -350, y)
        mel.connect_material_expressions(flat, "", l, "A")
        mel.connect_material_expressions(tex, "RGB", l, "B")
        mel.connect_material_expressions(f, "", l, "Alpha")
        return l

    f1a, f1b = mulc(m, f1, 0.8, -450, 520), mulc(m, f1, 0.55, -450, 600)  # D1 yogunlugu azaltilmis; ikinci ornek daha zayif
    l1, l1b, l2 = mix(d1n, f1a, 400), mix(d1nb, f1b, 480), mix(d2n, f2, 560)
    def xy(n, y):                                     # yalniz XY egimi (Z=1 ile normallestirilecek; toplamda Z negatif olmasin)
        cm = node(m, unreal.MaterialExpressionComponentMask, -250, y)
        for k, v_ in (("r", True), ("g", True), ("b", False), ("a", False)):
            cm.set_editor_property(k, v_)
        mel.connect_material_expressions(n, "", cm, "")
        return cm

    a1, a2, a3 = xy(l1, 400), xy(l1b, 470), xy(l2, 540)
    addp = node(m, unreal.MaterialExpressionAdd, -150, 440)
    mel.connect_material_expressions(a1, "", addp, "A")
    mel.connect_material_expressions(a2, "", addp, "B")
    add1 = node(m, unreal.MaterialExpressionAdd, -50, 480)
    mel.connect_material_expressions(addp, "", add1, "A")
    mel.connect_material_expressions(a3, "", add1, "B")
    one = node(m, unreal.MaterialExpressionConstant, -50, 640)
    one.set_editor_property("r", 1.0)
    add2 = node(m, unreal.MaterialExpressionAppendVector, 60, 520)
    mel.connect_material_expressions(add1, "", add2, "A")
    mel.connect_material_expressions(one, "", add2, "B")
    nz = node(m, unreal.MaterialExpressionNormalize, 170, 520)
    mel.connect_material_expressions(add2, "", nz, "")
    mel.connect_material_property(nz, "", unreal.MaterialProperty.MP_NORMAL)

    rough = node(m, unreal.MaterialExpressionConstant, -100, 150)
    rough.set_editor_property("r", 0.92)
    mel.connect_material_property(rough, "", unreal.MaterialProperty.MP_ROUGHNESS)
    m.set_editor_property("used_with_nanite", True)         # Nanite mesh'lerle kullanim (yoksa yedek mesh cizilir)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return m


def make_instance(name, parent, macro_tex, mp):
    p = "/Game/Site/Materials/" + name
    if eal.does_asset_exist(p):
        eal.delete_asset(p)
    mi = at.create_asset(name, "/Game/Site/Materials", unreal.MaterialInstanceConstant, unreal.MaterialInstanceConstantFactoryNew())
    mi.set_editor_property("parent", parent)
    mel.set_material_instance_texture_parameter_value(mi, "MacroAlbedo", macro_tex)
    mel.set_material_instance_scalar_parameter_value(mi, "MacroY0Cm", mp["y0_cm"])
    mel.set_material_instance_scalar_parameter_value(mi, "MacroXTopCm", mp["xtop_cm"])
    mel.set_material_instance_scalar_parameter_value(mi, "MacroSizeCm", mp["size_cm"])
    eal.save_loaded_asset(mi)
    return mi


def azel_to_ue(az_deg, el_deg, lon_deg):
    L = math.radians(lon_deg)
    n = (-math.sin(L), -math.cos(L))          # yerel kuzey, grid (x, y)
    e = (math.cos(L), -math.sin(L))           # yerel dogu
    a, el = math.radians(az_deg), math.radians(el_deg)
    hx = math.sin(a) * e[0] + math.cos(a) * n[0]
    hy = math.sin(a) * e[1] + math.cos(a) * n[1]
    return unreal.Vector(math.cos(el) * hy, math.cos(el) * hx, math.sin(el))    # UE (X=grid y, Y=grid x, Z)


def main():
    layout = json.load(open(MESHD + r"\layout.json", encoding="utf-8"))
    info = json.load(open(MESHD + r"\site_info.json", encoding="utf-8"))

    for d in ("/Game/Site/Textures", "/Game/Site/Materials", "/Game/Site/Meshes", "/Game/Maps"):
        eal.make_directory(d)
    t = import_files([
        (TEX + r"\site_macro_focus_4k.png", "/Game/Site/Textures", "T_Macro_Focus"),
        (TEX + r"\site_macro_full_4k.png", "/Game/Site/Textures", "T_Macro_Full"),
        (TEX + r"\regolith_d1_a.png", "/Game/Site/Textures", "T_Reg_D1_A"),
        (TEX + r"\regolith_d1_n.png", "/Game/Site/Textures", "T_Reg_D1_N"),
        (TEX + r"\regolith_d2_n.png", "/Game/Site/Textures", "T_Reg_D2_N"),
    ])
    for k in ("T_Macro_Focus", "T_Macro_Full", "T_Reg_D1_A"):
        tex_settings(t[k])
    for k in ("T_Reg_D1_N", "T_Reg_D2_N"):
        tex_settings(t[k], normal=True)

    if os.environ.get("SITE_REUSE_MESHES"):                  # mesh'leri yeniden ice aktarma (hizli yeniden kurulum)
        meshes = {m["name"]: unreal.load_asset("/Game/Site/Meshes/%s/StaticMeshes/%s" % (m["name"], m["name"])) for m in layout["meshes"]}
        unreal.log("mesh'ler yeniden kullanildi")
    else:
        meshes = import_files([(MESHD + "\\%s.glb" % m["name"], "/Game/Site/Meshes", m["name"]) for m in layout["meshes"]])
    for name, sm in ([] if os.environ.get("SITE_REUSE_MESHES") else meshes.items()):
        if sm is None:
            raise RuntimeError("mesh ice aktarilamadi: " + name)
        ns = sm.get_editor_property("nanite_settings")          # 1M koseli karolarda Nanite yuksek ayrinti sayfalari yuklenmedi
        ns.set_editor_property("enabled", False)
        sm.set_editor_property("nanite_settings", ns)
        try:
            bs = sm.get_editor_property("body_setup")
            bs.set_editor_property("collision_trace_flag", unreal.CollisionTraceFlag.CTF_USE_SIMPLE_AS_COMPLEX)
        except Exception as e:
            unreal.log("collision ayari atlandi: %s" % e)
        eal.save_loaded_asset(sm)

    mat = build_material()
    mi_focus = make_instance("MI_Focus", mat, t["T_Macro_Focus"], layout["macro_focus"])
    mi_outer = make_instance("MI_Outer", mat, t["T_Macro_Full"], layout["macro_outer"])

    les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    les.new_level("/Game/Maps/Site_LBP")
    eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    for m in layout["meshes"]:
        o = m["origin_cm"]
        a = eas.spawn_actor_from_class(unreal.StaticMeshActor, unreal.Vector(o[0], o[1], o[2]))
        a.set_actor_label(m["name"])
        c = a.static_mesh_component
        c.set_static_mesh(meshes[m["name"]])
        c.set_material(0, mi_outer if m["name"] == "outer" else mi_focus)

    lon = info["grid_lon_deg"]
    fr = info["sun_frame_low"]
    az, el = info["sun_az_deg"][fr], info["sun_el_deg"][fr]
    sd = azel_to_ue(az, el, lon)
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
    st.set_editor_property("auto_exposure_bias", BIAS)
    ppv.set_editor_property("settings", st)

    g = info["ground_center"]
    ground = unreal.Vector(g["x_cm"], g["y_cm"], g["z_cm"])

    def camera(label, loc, target, focal):
        c = eas.spawn_actor_from_class(unreal.CineCameraActor, loc)
        c.set_actor_label(label)
        c.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(loc, target), False)
        cc = c.get_cine_camera_component()
        cc.set_editor_property("current_focal_length", focal)
        try:
            fs = cc.get_editor_property("focus_settings")
            fs.set_editor_property("focus_method", unreal.CameraFocusMethod.DISABLE)    # odak derinligi bulaniklagi kapali
            cc.set_editor_property("focus_settings", fs)
        except Exception as e:
            unreal.log("focus ayari atlandi: %s" % e)
        return c

    vd = azel_to_ue(az + 100.0, -8.0, lon)          # Gunes soldan-arkadan: yan isik, kabartiyi gosterir
    loc = unreal.Vector(ground.x, ground.y, ground.z + 170.0)
    camera("Cam_Ground", loc, unreal.Vector(loc.x + vd.x * 1000, loc.y + vd.y * 1000, loc.z + vd.z * 1000), 18.0)
    vd2 = azel_to_ue(az + 100.0, -35.0, lon)
    loc2 = unreal.Vector(ground.x, ground.y, ground.z + 60.0)
    camera("Cam_Close", loc2, unreal.Vector(loc2.x + vd2.x * 300, loc2.y + vd2.y * 300, loc2.z + vd2.z * 300), 24.0)
    camera("Cam_Overview", unreal.Vector(ground.x - 150000, ground.y, ground.z + 80000), ground, 20.0)

    les.save_current_level()
    unreal.log("SITE HAZIR: /Game/Maps/Site_LBP | gunes kare %d az %.1f el %.2f" % (fr, az, el))


main()
