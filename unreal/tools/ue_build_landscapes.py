"""UE 5.8 icinde calisir: prosedurel inis sahalari icin seviye kurar (ayrintili cekirdek + yogun acisal kayalar + regolit materyali).

Girdi : data/unreal/meshes/<saha>/{layout.json, *.glb}  (make_site_detail.py), data/unreal/terrain/<saha>/{terrain.json, rocks_ue.csv},
        data/unreal/textures/ground_L{1,2,3}_N.png, ground_L{1,2}_A.png, moon_mask_noise.png (make_ground_textures.py / make_procedural_landscape.py),
        data/raw/polyhaven/moon/rocks (CC0, Poly Haven; yalniz yakin plan tarama kayalari)
Cikti : /Game/Moon/{Textures,Materials,Rocks}, /Game/Sites/<saha>/Meshes, /Game/Maps/Site_<Tur>
Ortam : SITE_ONLY=<saha-kimligi> (tek saha), SITE_REUSE_MESHES=1 (mesh'leri yeniden ice aktarma)
Calistirma (editor kapali): UnrealEditor-Cmd.exe <proje> -ExecutePythonScript="<bu dosya>" -unattended -nosplash
Cerceve: UE X = kuzey, Y = dogu, Z yukari (cm); UV metre cinsinden.
"""
import csv
import json
import math
import os

import unreal

ROOT = r"C:\Users\Berke\FEZA_Unreal"
PH = ROOT + r"\data\raw\polyhaven\moon"
TEX = ROOT + r"\data\unreal\textures"
SUN_LUX = 120000.0
BIAS = -3.0
ROCK_NOMINAL_M = 0.20                      # Poly Haven moon_rock modelleri ~20 cm; olcek = hedef cap / bu
MAX_SCAN_ROCKS = 1500
BATCH = 3

SITES = [("site-craters", "Site_Craters"), ("site-plains", "Site_Plains"), ("site-ridges", "Site_Ridges")]

at = unreal.AssetToolsHelpers.get_asset_tools()
mel = unreal.MaterialEditingLibrary
eal = unreal.EditorAssetLibrary
smsub = unreal.get_editor_subsystem(unreal.StaticMeshEditorSubsystem)


def import_task(src, dest_dir, name):
    t = unreal.AssetImportTask()
    t.filename, t.destination_path, t.destination_name = src, dest_dir, name
    t.automated = True
    t.replace_existing = True
    t.replace_existing_settings = True
    t.save = True
    return t


def import_many(items):
    tasks = [(n, import_task(s, d, n)) for s, d, n in items]
    at.import_asset_tasks([t for _, t in tasks])
    out = {}
    for n, t in tasks:
        paths = list(t.get_editor_property("imported_object_paths"))
        out[n] = [unreal.load_asset(p) for p in paths]
    return out


def tex_settings(t, kind):
    if kind == "normal":
        t.set_editor_property("compression_settings", unreal.TextureCompressionSettings.TC_NORMALMAP)
        t.set_editor_property("srgb", False)
    elif kind == "linear":
        t.set_editor_property("srgb", False)
    else:
        t.set_editor_property("srgb", True)
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


def addc(m, src, k, x, y, out=""):
    n = node(m, unreal.MaterialExpressionAdd, x, y)
    mel.connect_material_expressions(src, out, n, "A")
    n.set_editor_property("const_b", k)
    return n


def mul2(m, a, b, x, y, ao="", bo=""):
    n = node(m, unreal.MaterialExpressionMultiply, x, y)
    mel.connect_material_expressions(a, ao, n, "A")
    mel.connect_material_expressions(b, bo, n, "B")
    return n


def add2(m, a, b, x, y):
    n = node(m, unreal.MaterialExpressionAdd, x, y)
    mel.connect_material_expressions(a, "", n, "A")
    mel.connect_material_expressions(b, "", n, "B")
    return n


def samp(m, tex, uv, x, y, normal=False):
    s = node(m, unreal.MaterialExpressionTextureSample, x, y)
    s.set_editor_property("texture", tex)
    if normal:
        s.set_editor_property("sampler_type", unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL)
    mel.connect_material_expressions(uv, "", s, "UVs")
    return s


def xy(m, n, x, y):
    cm = node(m, unreal.MaterialExpressionComponentMask, x, y)
    for k, v in (("r", True), ("g", True), ("b", False), ("a", False)):
        cm.set_editor_property(k, v)
    mel.connect_material_expressions(n, "", cm, "")
    return cm


def normalize_xy(m, parts, x, y):
    """XY bilesenlerini topla, Z=1 ekle, normalize et -> MP_NORMAL."""
    s = parts[0]
    for p in parts[1:]:
        s = add2(m, s, p, x, y)
        y += 80
    one = node(m, unreal.MaterialExpressionConstant, x, y)
    one.set_editor_property("r", 1.0)
    ap = node(m, unreal.MaterialExpressionAppendVector, x + 120, y)
    mel.connect_material_expressions(s, "", ap, "A")
    mel.connect_material_expressions(one, "", ap, "B")
    nz = node(m, unreal.MaterialExpressionNormalize, x + 240, y)
    mel.connect_material_expressions(ap, "", nz, "")
    mel.connect_material_property(nz, "", unreal.MaterialProperty.MP_NORMAL)


def fade_node(m, pd, dist_cm, x, y):
    d = node(m, unreal.MaterialExpressionDivide, x, y)
    mel.connect_material_expressions(pd, "", d, "A")
    d.set_editor_property("const_b", dist_cm)
    o = node(m, unreal.MaterialExpressionOneMinus, x + 120, y)
    mel.connect_material_expressions(d, "", o, "")
    s = node(m, unreal.MaterialExpressionSaturate, x + 240, y)
    mel.connect_material_expressions(o, "", s, "")
    return s


def fixed_normal(m, tex, uv, fade, gain, x, y):
    """Normal ornegi -> (mesafeyle duze solar) * kazanc -> XY."""
    s = samp(m, tex, uv, x, y, True)
    flat = c3(m, 0.0, 0.0, 1.0, x, y + 150)
    l = node(m, unreal.MaterialExpressionLinearInterpolate, x + 250, y)
    mel.connect_material_expressions(flat, "", l, "A")
    mel.connect_material_expressions(s, "RGB", l, "B")
    mel.connect_material_expressions(mulc(m, fade, gain, x + 120, y + 250), "", l, "Alpha")
    return xy(m, l, x + 400, y)


def build_ground_material(T):
    p = "/Game/Moon/Materials/M_MoonGround"
    if eal.does_asset_exist(p):                       # silme basarisiz olabiliyor (referans var): icerigi temizle
        m = unreal.load_asset(p)
        mel.delete_all_material_expressions(m)
    else:
        m = at.create_asset("M_MoonGround", "/Game/Moon/Materials", unreal.Material, unreal.MaterialFactoryNew())
    tc = node(m, unreal.MaterialExpressionTextureCoordinate, -3000, 0)              # mesh UV'si metre cinsinden

    def uv(scale_m, off=0.0, y=0):
        n = mulc(m, tc, 1.0 / scale_m, -2700, y)
        return addc(m, n, off, -2550, y) if off else n

    u1, u1b = uv(24.0, 0.0, -300), uv(24.0 * 1.93, 0.31, -150)
    u2, u2b = uv(5.3, 0.0, 0), uv(5.3 * 1.71, 0.17, 150)
    u3 = uv(1.15, 0.0, 300)
    uM = mulc(m, tc, 1.0 / 160.0, -2700, 450)

    pd = node(m, unreal.MaterialExpressionPixelDepth, -2700, 700)
    f1, f2, f3 = fade_node(m, pd, 150000.0, -2500, 700), fade_node(m, pd, 40000.0, -2500, 800), fade_node(m, pd, 6000.0, -2500, 900)
    n1 = fixed_normal(m, T["ground_L1_N"], u1, f1, 0.7, -2200, -300)
    n1b = fixed_normal(m, T["ground_L1_N"], u1b, f1, 0.5, -2200, -100)
    n2 = fixed_normal(m, T["ground_L2_N"], u2, f2, 0.45, -2200, 150)
    n2b = fixed_normal(m, T["ground_L2_N"], u2b, f2, 0.3, -2200, 350)
    n3 = fixed_normal(m, T["ground_L3_N"], u3, f3, 0.3, -2200, 550)
    normalize_xy(m, [n1, n1b, n2, n2b, n3], -1500, 0)

    # albedo: sabit ay tonu x (L1 ic bukey) x (L2 ic bukey) x makro maske
    mk = samp(m, T["T_MaskNoise"], uM, -2200, 800)
    a1 = samp(m, T["ground_L1_A"], u1, -2200, 1000)
    a1b = samp(m, T["ground_L1_A"], u1b, -2200, 1150)
    a2 = samp(m, T["ground_L2_A"], u2, -2200, 1300)
    A1 = mulc(m, add2(m, a1, a1b, -1900, 1050), 0.5, -1750, 1050)
    k1 = addc(m, mulc(m, A1, 0.8, -1600, 1050), 0.6, -1450, 1050)                  # 0.6 + 0.8*A1 (A=0.5 -> 1.0)
    k2 = addc(m, mulc(m, a2, 0.5, -1900, 1300, "R"), 0.75, -1750, 1300)             # 0.75 + 0.5*A2
    kv = addc(m, mulc(m, mk, 0.14, -1900, 1450, "R"), 0.93, -1750, 1450)
    col = c3(m, 0.54, 0.50, 0.45, -1450, 900)
    c = mul2(m, mul2(m, mul2(m, col, k1, -1250, 1000), k2, -1100, 1000), kv, -950, 1000)
    mel.connect_material_property(mulc(m, c, 0.20, -800, 1000), "", unreal.MaterialProperty.MP_BASE_COLOR)
    rough = node(m, unreal.MaterialExpressionConstant, -800, 1200)
    rough.set_editor_property("r", 0.93)
    mel.connect_material_property(rough, "", unreal.MaterialProperty.MP_ROUGHNESS)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return m


def build_rock_material(T):
    p = "/Game/Moon/Materials/M_MoonRock"
    if eal.does_asset_exist(p):                       # silme basarisiz olabiliyor (referans var): icerigi temizle
        m = unreal.load_asset(p)
        mel.delete_all_material_expressions(m)
    else:
        m = at.create_asset("M_MoonRock", "/Game/Moon/Materials", unreal.Material, unreal.MaterialFactoryNew())
    tc = node(m, unreal.MaterialExpressionTextureCoordinate, -2200, 0)                # kutu izdusumu UV (metre, kaya basina ofsetli)
    u3 = mulc(m, tc, 1.0 / 1.15, -2000, 0)
    u2 = mulc(m, tc, 1.0 / 5.3, -2000, 150)
    u1 = mulc(m, tc, 1.0 / 24.0, -2000, 300)
    one = node(m, unreal.MaterialExpressionConstant, -1700, 700)
    one.set_editor_property("r", 1.0)
    n3 = fixed_normal(m, T["ground_L3_N"], u3, one, 1.1, -1700, 0)
    n2 = fixed_normal(m, T["ground_L2_N"], u2, one, 0.9, -1700, 250)
    n1 = fixed_normal(m, T["ground_L1_N"], u1, one, 0.8, -1700, 500)
    normalize_xy(m, [n3, n2, n1], -1000, 0)
    a2 = samp(m, T["ground_L2_A"], u2, -1700, 800)
    a1 = samp(m, T["ground_L1_A"], u1, -1700, 950)
    k = addc(m, mulc(m, add2(m, a2, a1, -1400, 850), 0.7, -1250, 850), 0.30, -1100, 850)     # 0.3 + 0.7*(A1+A2) (A=.5 -> 1.0)
    vc = node(m, unreal.MaterialExpressionVertexColor, -1400, 1100)
    col = c3(m, 0.42, 0.40, 0.38, -1250, 1000)
    c = mul2(m, mul2(m, col, k, -1000, 950), vc, -850, 1000, "", "RGB")
    mel.connect_material_property(mulc(m, c, 0.20, -700, 1000), "", unreal.MaterialProperty.MP_BASE_COLOR)
    rough = node(m, unreal.MaterialExpressionConstant, -700, 1200)
    rough.set_editor_property("r", 0.88)
    mel.connect_material_property(rough, "", unreal.MaterialProperty.MP_ROUGHNESS)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return m



def build_sky_materials():
    """Gunes diski: aydinlatmasiz, cok parlak (patlayip parlamaya yol acar). Dunya/yildiz/atmosfer: yorunge sahnesinin malzemeleri + saha basina ornek."""
    p = "/Game/Moon/Materials/M_SunDisc"
    if eal.does_asset_exist(p):
        m = unreal.load_asset(p)
        mel.delete_all_material_expressions(m)
    else:
        m = at.create_asset("M_SunDisc", "/Game/Moon/Materials", unreal.Material, unreal.MaterialFactoryNew())
    m.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_UNLIT)
    c = c3(m, 1.0, 0.96, 0.88, -600, 0)
    mel.connect_material_property(mulc(m, c, 400000.0, -400, 0), "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return {"sun": m}


def make_mic(name, parent_path, sun_dir, gain):
    folder = "/Game/Moon/SkyInstances"
    eal.make_directory(folder)
    p = folder + "/" + name
    if eal.does_asset_exist(p):
        mic = unreal.load_asset(p)
    else:
        mic = at.create_asset(name, folder, unreal.MaterialInstanceConstant, unreal.MaterialInstanceConstantFactoryNew())
    mic.set_editor_property("parent", unreal.load_asset(parent_path))
    mel.set_material_instance_vector_parameter_value(mic, "SunDir", unreal.LinearColor(sun_dir.x, sun_dir.y, sun_dir.z, 0))
    mel.set_material_instance_scalar_parameter_value(mic, "EmissiveGain", gain)
    eal.save_loaded_asset(mic)
    return mic


def spawn_sky(eas, meta, ground, sky_mats, key):
    """Yildiz alani; Dunya (bulut + atmosfer, ayni Gunes isigi) ve Gunes diski yalniz gercekte ufkun ustundeyse."""
    sphere = unreal.load_asset("/Game/Meshes/uvsphere/StaticMeshes/SM_UVSphere")
    if sphere is None:
        raise RuntimeError("SM_UVSphere yuklenemedi")
    D = 2.0e8                                          # cm (2000 km): koordinat hassasiyeti icin yakin, aci boyutu dogru
    sun_az, sun_el = meta["sun"]["az_deg"], meta["sun"]["el_deg"]
    sdir = az_el_dir(sun_az, sun_el)
    gain = 2.0 ** (-5.5 - BIAS)                        # yorunge sahnesi pozlamasi -5.5: ayni gorunum icin saha pozlamasina gore olcekle

    def place(label, az, el, ang_r_deg, mat, scale=1.0, shadow=False):
        d = az_el_dir(az, el)
        loc = unreal.Vector(ground.x + d.x * D, ground.y + d.y * D, ground.z + d.z * D)
        a = eas.spawn_actor_from_class(unreal.StaticMeshActor, loc)
        a.set_actor_label(label)
        c = a.static_mesh_component
        c.set_static_mesh(sphere)
        c.set_material(0, mat)
        c.set_editor_property("cast_shadow", shadow)
        sc = D * math.tan(math.radians(ang_r_deg)) / 100.0 * scale
        a.set_actor_scale3d(unreal.Vector(sc, sc, sc))
        return a

    # yildizlar: her sahada (gokyuzu siyahsa gorunur)
    st = eas.spawn_actor_from_class(unreal.StaticMeshActor, ground)
    st.set_actor_label("Stars")
    st.static_mesh_component.set_static_mesh(sphere)
    st.static_mesh_component.set_material(0, make_mic("MI_Stars_" + key, "/Game/Space/Materials/M_Stars", sdir, 0.45))
    st.static_mesh_component.set_editor_property("cast_shadow", False)
    st.set_actor_scale3d(unreal.Vector(4.0e6, 4.0e6, 4.0e6))

    e = meta["sky"]["earth"]
    earth_up = e["el_deg"] > -e["ang_radius_deg"]
    if earth_up:
        ea = place("Earth", e["az_deg"], e["el_deg"], e["ang_radius_deg"], make_mic("MI_Earth_" + key, "/Game/Space/Materials/M_EarthOrbit", sdir, gain))
        rot = unreal.MathLibrary.make_rot_from_xz(unreal.Vector(*e["axis_x"]), unreal.Vector(*e["axis_z"]))
        ea.set_actor_rotation(rot, False)
        cl = place("EarthClouds", e["az_deg"], e["el_deg"], e["ang_radius_deg"], unreal.load_asset("/Game/Space/Materials/M_EarthClouds"), 1.004)
        cl.set_actor_rotation(rot, False)
        place("EarthAtmosphere", e["az_deg"], e["el_deg"], e["ang_radius_deg"], make_mic("MI_Atmo_" + key, "/Game/Space/Materials/M_EarthAtmo", sdir, gain), 1.04)
    if sun_el > -0.27:
        place("SunDisc", sun_az, sun_el, 0.2665, sky_mats["sun"])
    return earth_up


def spawn_athena(eas, lander):
    paths = [p for p in eal.list_assets("/Game/Athena/athena_lander/StaticMeshes", recursive=False, include_folder=False)]
    loc = unreal.Vector(lander["x_m"] * 100.0, lander["y_m"] * 100.0, lander["z_cm"])
    n = 0
    for p in paths:
        sm = unreal.load_asset(p)
        if not isinstance(sm, unreal.StaticMesh):
            continue
        a = eas.spawn_actor_from_class(unreal.StaticMeshActor, loc, unreal.Rotator(roll=0.0, pitch=0.0, yaw=lander["yaw_deg"]))
        a.set_actor_label("Athena_" + sm.get_name())
        a.static_mesh_component.set_static_mesh(sm)
        n += 1
    return n


def az_el_dir(az_deg, el_deg):
    a, e = math.radians(az_deg), math.radians(el_deg)
    return unreal.Vector(math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e))


def prep_mesh(sm):
    ns = sm.get_editor_property("nanite_settings")
    ns.set_editor_property("enabled", False)
    sm.set_editor_property("nanite_settings", ns)
    bs = smsub.get_lod_build_settings(sm, 0)
    bs.set_editor_property("use_high_precision_tangent_basis", True)
    bs.set_editor_property("use_full_precision_u_vs", True)
    bs.set_editor_property("recompute_normals", False)
    smsub.set_lod_build_settings(sm, 0, bs)
    try:
        sm.get_editor_property("body_setup").set_editor_property("collision_trace_flag", unreal.CollisionTraceFlag.CTF_USE_SIMPLE_AS_COMPLEX)
    except Exception:       # noqa: BLE001
        pass
    eal.save_loaded_asset(sm)


def build_site(site, level, ground_mat, rock_mat, scan_rocks, sky_mats):
    tdir = ROOT + r"\data\unreal\terrain" + "\\" + site
    mdir = ROOT + r"\data\unreal\meshes" + "\\" + site
    meta = json.load(open(tdir + r"\terrain.json", encoding="utf-8"))
    layout = json.load(open(mdir + r"\layout.json", encoding="utf-8"))
    dest = "/Game/Sites/%s/Meshes" % site.replace("-", "_")
    entries = layout["meshes"]

    meshes = {}
    if os.environ.get("SITE_REUSE_MESHES"):
        for m in entries:
            if m.get("kind") == "rock":                      # kayalar her seferinde yeniden ice aktarilir (konum/yogunluk degisebilir)
                continue
            meshes[m["name"]] = unreal.load_asset("%s/%s/StaticMeshes/%s" % (dest, m["name"], m["name"])) or unreal.load_asset("%s/%s" % (dest, m["name"]))
        rocks_only = [m for m in entries if m.get("kind") == "rock"]
        for i in range(0, len(rocks_only), BATCH):
            got = import_many([(mdir + "\%s.glb" % m["name"], dest, m["name"]) for m in rocks_only[i:i + BATCH]])
            for name, assets in got.items():
                sm = next(a for a in assets if isinstance(a, unreal.StaticMesh))
                prep_mesh(sm)
                meshes[name] = sm
    else:
        for i in range(0, len(entries), BATCH):
            part = entries[i:i + BATCH]
            got = import_many([(mdir + "\\%s.glb" % m["name"], dest, m["name"]) for m in part])
            for name, assets in got.items():
                sm = next((a for a in assets if isinstance(a, unreal.StaticMesh)), None)
                if sm is None:
                    raise RuntimeError("mesh yok: " + name)
                prep_mesh(sm)
                meshes[name] = sm
            unreal.log("mesh ice aktarma: %d / %d" % (min(i + BATCH, len(entries)), len(entries)))

    les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    path = "/Game/Maps/" + level
    umap = ROOT + r"\unreal\FezaMoon\Content\Maps" + "\\" + level + ".umap"
    if os.path.exists(umap):                          # var olan seviyeyi sil/yeniden yaratma (kayit defteri catismasi): ac ve temizle
        if not les.load_level(path):
            raise RuntimeError("load_level basarisiz: " + path)
    elif not les.new_level(path):
        raise RuntimeError("new_level basarisiz: " + path)
    eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    for a in list(eas.get_all_level_actors()):               # new_level acilistaki haritanin (Main) kopyasini uretir: temizle
        eas.destroy_actor(a)
    nrock_chunks = 0
    for m in entries:
        o = m["origin_cm"]
        a = eas.spawn_actor_from_class(unreal.StaticMeshActor, unreal.Vector(o[0], o[1], o[2]))
        a.set_actor_label(m["name"])
        a.static_mesh_component.set_static_mesh(meshes[m["name"]])
        is_rock = m.get("kind") == "rock"
        a.static_mesh_component.set_material(0, rock_mat if is_rock else ground_mat)
        nrock_chunks += 1 if is_rock else 0

    # --- yakin plan tarama kayalari (Poly Haven moon_rock_01..07) ---
    rows = list(csv.DictReader(open(tdir + r"\rocks_ue.csv", encoding="utf-8")))[:MAX_SCAN_ROCKS]
    for i, r in enumerate(rows):
        s = max(0.4, float(r["diameter_m"]) / ROCK_NOMINAL_M)
        ra = eas.spawn_actor_from_class(unreal.StaticMeshActor, unreal.Vector(float(r["x_cm"]), float(r["y_cm"]), float(r["z_cm"])),
                                        unreal.Rotator(roll=((i * 37) % 30) - 15.0, pitch=((i * 53) % 30) - 15.0, yaw=float(r["yaw_deg"])))
        ra.set_actor_label("ScanRock_%d" % i)
        ra.static_mesh_component.set_static_mesh(scan_rocks[int(r["variant"]) % len(scan_rocks)])
        ra.set_actor_scale3d(unreal.Vector(s, s, s))

    sun_az, sun_el = meta["sun"]["az_deg"], meta["sun"]["el_deg"]
    sd = az_el_dir(sun_az, sun_el)
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

    g = meta["ground_center_cm"]
    ground = unreal.Vector(g[0], g[1], g[2])

    def camera(label, loc, target, focal):
        c = eas.spawn_actor_from_class(unreal.CineCameraActor, loc)
        c.set_actor_label(label)
        c.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(loc, target), False)
        cc = c.get_cine_camera_component()
        cc.set_editor_property("current_focal_length", focal)
        try:
            fs = cc.get_editor_property("focus_settings")
            fs.set_editor_property("focus_method", unreal.CameraFocusMethod.DISABLE)
            cc.set_editor_property("focus_settings", fs)
        except Exception:       # noqa: BLE001
            pass

    vd = az_el_dir(sun_az + 100.0, -6.0)
    loc = unreal.Vector(ground.x, ground.y, ground.z + 170.0)
    camera("Cam_Ground", loc, unreal.Vector(loc.x + vd.x * 1000, loc.y + vd.y * 1000, loc.z + vd.z * 1000), 18.0)
    vd2 = az_el_dir(sun_az + 100.0, -35.0)
    loc2 = unreal.Vector(ground.x, ground.y, ground.z + 70.0)
    camera("Cam_Close", loc2, unreal.Vector(loc2.x + vd2.x * 300, loc2.y + vd2.y * 300, loc2.z + vd2.z * 300), 24.0)
    camera("Cam_Overview", unreal.Vector(ground.x - 30000, ground.y - 10000, ground.z + 15000), ground, 22.0)

    nath = 0
    if meta.get("lander"):
        nath = spawn_athena(eas, meta["lander"])
        L = meta["lander"]
        lp = unreal.Vector(L["x_m"] * 100.0, L["y_m"] * 100.0, L["z_cm"])
        dx, dy = ground.x - lp.x, ground.y - lp.y
        dn = math.hypot(dx, dy)
        cl = unreal.Vector(lp.x + dx / dn * 900.0, lp.y + dy / dn * 900.0, lp.z + 170.0)
        camera("Cam_Lander", cl, unreal.Vector(lp.x, lp.y, lp.z + 200.0), 20.0)
    if meta.get("sky"):
        spawn_sky(eas, meta, ground, sky_mats, site.replace("-", "_"))
        e = meta["sky"]["earth"]
        for lab, az, el, fl in (("Cam_Earth", e["az_deg"], e["el_deg"], 40.0), ("Cam_Sun", sun_az, sun_el, 28.0)):
            dd = az_el_dir(az, el)
            camera(lab, loc, unreal.Vector(loc.x + dd.x * 1000, loc.y + dd.y * 1000, loc.z + dd.z * 1000), fl)

    les.save_current_level()
    unreal.log("LANDSCAPE HAZIR: %s | mesh %d (kaya hucresi %d) | tarama kaya %d | athena parca %d | gunes az %.0f el %.1f" % (level, len(entries), nrock_chunks, len(rows), nath, sun_az, sun_el))


def main():
    for d in ("/Game/Moon/Textures", "/Game/Moon/Materials", "/Game/Moon/Rocks", "/Game/Maps"):
        eal.make_directory(d)
    items = [(TEX + "\\ground_L%d_N.png" % k, "/Game/Moon/Textures", "ground_L%d_N" % k) for k in (1, 2, 3)]
    items += [(TEX + "\\ground_L%d_A.png" % k, "/Game/Moon/Textures", "ground_L%d_A" % k) for k in (1, 2)]
    items.append((TEX + r"\moon_mask_noise.png", "/Game/Moon/Textures", "T_MaskNoise"))
    got = import_many(items)
    T = {k: v[0] for k, v in got.items()}
    for k in ("ground_L1_N", "ground_L2_N", "ground_L3_N"):
        tex_settings(T[k], "normal")
    for k in ("ground_L1_A", "ground_L2_A", "T_MaskNoise"):
        tex_settings(T[k], "linear")

    scan = []
    for i in range(1, 8):
        rid = "moon_rock_0%d" % i
        p = "/Game/Moon/Rocks/" + rid
        if os.environ.get("SITE_REUSE_MESHES") and unreal.load_asset(p):
            scan.append(unreal.load_asset(p))
            continue
        res = import_many([(PH + r"\rocks" + "\\" + rid + "\\" + rid + "_2k.gltf", "/Game/Moon/Rocks", rid)])[rid]
        sm = next((a for a in res if isinstance(a, unreal.StaticMesh)), None)
        if sm is None:
            raise RuntimeError("kaya mesh'i yok: " + rid)
        scan.append(sm)

    ground_mat, rock_mat = build_ground_material(T), build_rock_material(T)
    sky_mats = build_sky_materials()
    only = os.environ.get("SITE_ONLY")
    for site, level in SITES:
        if only and only != site:
            continue
        build_site(site, level, ground_mat, rock_mat, scan, sky_mats)


main()
