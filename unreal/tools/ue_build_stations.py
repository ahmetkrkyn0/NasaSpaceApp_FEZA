"""UE 5.8 icinde calisir: DSN yer istasyonu sahneleri (Station_Goldstone / Station_Madrid / Station_Canberra).

Girdi : data/unreal/stations/stations.json, data/unreal/meshes/<dsn-id>/{layout.json,*.glb}, data/unreal/terrain/<dsn-id>/terrain.json,
        data/raw/polyhaven/ground (CC0), data/raw/dsn70/dsn70.glb (Masaustu'ndeki "Deep Space Network 70-meter.glb" kopyasi),
        /Game/Textures/T_Moon_Color_8k, T_Moon_Normal_8k (ue_build_scene.py), /Game/Meshes/uvsphere/StaticMeshes/SM_UVSphere
Cikti : /Game/DSN, /Game/Stations/<id>, /Game/Maps/Station_<Ad>
Sahne : prosedurel arazi + Poly Haven zemin, SkyAtmosphere + Gunes (gercek an), Ay (gercek yon/evre/yonelim), 70 m canak Ay'a bakar.
Ortam : SITE_ONLY=<dsn-id>, SITE_REUSE_MESHES=1
Calistirma (editor kapali): UnrealEditor-Cmd.exe <proje> -ExecutePythonScript="<bu dosya>" -unattended -nosplash
Cerceve: UE X = kuzey, Y = dogu, Z yukari (cm).
"""
import json
import math
import os

import unreal

ROOT = r"C:\Users\Berke\FEZA_Unreal"
PH = ROOT + r"\data\raw\polyhaven\ground"
SUN_LUX = 100000.0
BIAS = -3.0
BATCH = 2
MOON_D = 6.0e5                 # cm (6 km): atmosfer sisinden etkilenmesin diye yakin, aci boyutu dogru
DISH_PIVOT_Z = 3390.0          # cm: elevasyon ekseni yuksekligi (glTF y=33.9 m)

# istasyon -> (doku kimligi, tile boyutu m)
GROUND = {"dsn-goldstone": ("dry_ground_rocks", 4.0), "dsn-madrid": ("aerial_grass_rock", 15.0), "dsn-canberra": ("grass_path_3", 3.0)}
TINT = {"dsn-goldstone": (1.0, 0.92, 0.80), "dsn-madrid": (0.80, 0.76, 0.50), "dsn-canberra": (0.52, 0.66, 0.34)}

at = unreal.AssetToolsHelpers.get_asset_tools()
mel = unreal.MaterialEditingLibrary
eal = unreal.EditorAssetLibrary
smsub = unreal.get_editor_subsystem(unreal.StaticMeshEditorSubsystem)


def import_task(src, dest_dir, name):
    t = unreal.AssetImportTask()
    t.filename, t.destination_path, t.destination_name = src, dest_dir, name
    t.automated, t.replace_existing, t.replace_existing_settings, t.save = True, True, True, True
    return t


def import_many(items):
    tasks = [(n, import_task(s, d, n)) for s, d, n in items]
    at.import_asset_tasks([t for _, t in tasks])
    return {n: [unreal.load_asset(p) for p in list(t.get_editor_property("imported_object_paths"))] for n, t in tasks}


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


def mulc(m, src, k, x, y, out=""):
    n = node(m, unreal.MaterialExpressionMultiply, x, y)
    mel.connect_material_expressions(src, out, n, "A")
    n.set_editor_property("const_b", k)
    return n


def addc(m, src, k, x, y):
    n = node(m, unreal.MaterialExpressionAdd, x, y)
    mel.connect_material_expressions(src, "", n, "A")
    n.set_editor_property("const_b", k)
    return n


def samp(m, tex, uv, x, y, normal=False):
    s = node(m, unreal.MaterialExpressionTextureSample, x, y)
    s.set_editor_property("texture", tex)
    if normal:
        s.set_editor_property("sampler_type", unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL)
    mel.connect_material_expressions(uv, "", s, "UVs")
    return s


def get_or_new_material(name, folder="/Game/Stations"):
    p = folder + "/" + name
    if eal.does_asset_exist(p):
        m = unreal.load_asset(p)
        mel.delete_all_material_expressions(m)
        return m
    return at.create_asset(name, folder, unreal.Material, unreal.MaterialFactoryNew())


def build_ground(sid, T, mask):
    tid, tile = GROUND[sid]
    m = get_or_new_material("M_Ground_" + sid.split("-")[1])
    tc = node(m, unreal.MaterialExpressionTextureCoordinate, -2000, 0)
    uvA = mulc(m, tc, 1.0 / tile, -1800, 0)
    uvB = addc(m, mulc(m, tc, 1.0 / (tile * 3.7), -1800, 150), 0.31, -1650, 150)
    uvM = mulc(m, tc, 1.0 / 220.0, -1800, 300)
    dA, dB = samp(m, T[tid + "_D"], uvA, -1400, 0), samp(m, T[tid + "_D"], uvB, -1400, 150)
    nA, nB = samp(m, T[tid + "_N"], uvA, -1400, 300, True), samp(m, T[tid + "_N"], uvB, -1400, 450, True)
    rA = samp(m, T[tid + "_R"], uvA, -1400, 600)
    mk = samp(m, mask, uvM, -1400, 750)
    cs = node(m, unreal.MaterialExpressionAdd, -1100, 70)
    mel.connect_material_expressions(dA, "RGB", cs, "A")
    mel.connect_material_expressions(dB, "RGB", cs, "B")
    col = mulc(m, cs, 0.5, -950, 70)
    var = addc(m, mulc(m, mk, 0.35, -1100, 780, "R"), 0.82, -950, 780)          # makro parlaklik varyasyonu
    cv = node(m, unreal.MaterialExpressionMultiply, -800, 100)
    mel.connect_material_expressions(col, "", cv, "A")
    mel.connect_material_expressions(var, "", cv, "B")
    tn = node(m, unreal.MaterialExpressionConstant3Vector, -800, 250)
    tn.set_editor_property("constant", unreal.LinearColor(*TINT[sid], 0))
    ct = node(m, unreal.MaterialExpressionMultiply, -650, 150)
    mel.connect_material_expressions(cv, "", ct, "A")
    mel.connect_material_expressions(tn, "", ct, "B")
    mel.connect_material_property(ct, "", unreal.MaterialProperty.MP_BASE_COLOR)

    def xy(n, x, y):                                       # normal: XY bileseni
        cm = node(m, unreal.MaterialExpressionComponentMask, x, y)
        for k, v in (("r", True), ("g", True), ("b", False), ("a", False)):
            cm.set_editor_property(k, v)
        mel.connect_material_expressions(n, "RGB", cm, "")
        return cm
    s = node(m, unreal.MaterialExpressionAdd, -500, 380)
    mel.connect_material_expressions(xy(nA, -650, 300), "", s, "A")
    mel.connect_material_expressions(mulc(m, xy(nB, -650, 450), 0.7, -560, 450), "", s, "B")
    one = node(m, unreal.MaterialExpressionConstant, -500, 480)
    one.set_editor_property("r", 1.0)
    ap = node(m, unreal.MaterialExpressionAppendVector, -380, 400)
    mel.connect_material_expressions(s, "", ap, "A")
    mel.connect_material_expressions(one, "", ap, "B")
    nz = node(m, unreal.MaterialExpressionNormalize, -260, 400)
    mel.connect_material_expressions(ap, "", nz, "")
    mel.connect_material_property(nz, "", unreal.MaterialProperty.MP_NORMAL)
    mel.connect_material_property(rA, "R", unreal.MaterialProperty.MP_ROUGHNESS)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return m


def build_moon_material():
    m = get_or_new_material("M_MoonSky")
    c = unreal.load_asset("/Game/Textures/T_Moon_Color_8k")
    n = unreal.load_asset("/Game/Textures/T_Moon_Normal_8k")
    tc = node(m, unreal.MaterialExpressionTextureCoordinate, -600, 0)
    sc = samp(m, c, tc, -300, 0)
    sn = samp(m, n, tc, -300, 250, True)
    mel.connect_material_property(mulc(m, sc, 1.6, -150, 0, "RGB"), "", unreal.MaterialProperty.MP_BASE_COLOR)   # gunduz gokyuzunde okunur parlaklik
    mel.connect_material_property(sn, "RGB", unreal.MaterialProperty.MP_NORMAL)
    r = node(m, unreal.MaterialExpressionConstant, -150, 300)
    r.set_editor_property("r", 0.92)
    mel.connect_material_property(r, "", unreal.MaterialProperty.MP_ROUGHNESS)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return m


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
    smsub.set_lod_build_settings(sm, 0, bs)
    eal.save_loaded_asset(sm)


def assemble_dsn(eas, origin, moon_az, moon_el):
    """DSN 70 m: azimut/elevasyon pivotlari; canak Ay yonune cevrilir. Dondurur: aktor sayisi, hedef hatasi (derece)."""
    root = "/Game/DSN/dsn70/StaticMeshes"
    az_parts = {"landing", "rails", "stairs"}
    actors = {}
    for p in eal.list_assets(root, recursive=False, include_folder=False):
        sm = unreal.load_asset(p)
        if not isinstance(sm, unreal.StaticMesh):
            continue
        a = eas.spawn_actor_from_class(unreal.StaticMeshActor, origin)
        a.set_actor_label("DSN_" + sm.get_name())
        a.static_mesh_component.set_static_mesh(sm)
        actors[sm.get_name().lower()] = a
    az_p = eas.spawn_actor_from_class(unreal.StaticMeshActor, origin)
    az_p.set_actor_label("DSN_AzimuthPivot")
    el_p = eas.spawn_actor_from_class(unreal.StaticMeshActor, unreal.Vector(origin.x, origin.y, origin.z + DISH_PIVOT_Z))
    el_p.set_actor_label("DSN_ElevationPivot")
    keep = unreal.AttachmentRule.KEEP_WORLD
    el_p.attach_to_actor(az_p, "", keep, keep, keep, False)
    for n, a in actors.items():
        if n == "base":
            continue                                        # sabit taban
        a.attach_to_actor(az_p if n in az_parts else el_p, "", keep, keep, keep, False)
    target = az_el_dir(moon_az, moon_el)
    dish = actors.get("dish")
    best = (-2.0, (1.0, moon_az))
    for s in (1.0, -1.0):
        for yaw0 in (moon_az - 90.0, moon_az + 90.0):
            el_p.root_component.set_editor_property("relative_rotation", unreal.Rotator(roll=s * (90.0 - moon_el), pitch=0.0, yaw=0.0))
            az_p.set_actor_rotation(unreal.Rotator(roll=0.0, pitch=0.0, yaw=yaw0), False)
            up = dish.get_actor_up_vector() if dish else target
            d = up.x * target.x + up.y * target.y + up.z * target.z
            if d > best[0]:
                best = (d, (s, yaw0))
    s, yaw0 = best[1]
    el_p.root_component.set_editor_property("relative_rotation", unreal.Rotator(roll=s * (90.0 - moon_el), pitch=0.0, yaw=0.0))
    az_p.set_actor_rotation(unreal.Rotator(roll=0.0, pitch=0.0, yaw=yaw0), False)
    return len(actors), math.degrees(math.acos(max(-1.0, min(1.0, best[0]))))


def scatter(eas, sid):
    """Dogal ortam: data/unreal/terrain/<id>/props.json (make_station_terrain.py) -> her ornek icin StaticMeshActor.
    Poly Haven modelleri cok parcali = boyut/tur VARYANTLARI (glTF dugum konumlari ucuna islenmis): ornek basina bir varyant secilir ve
    mesh'in sinir kutusu merkezi (ox, oy) kadar geri kaydirilir; boylece taban noktasi hedef konuma oturur."""
    pj = ROOT + "/data/unreal/terrain/" + sid + "/props.json"
    if not os.path.exists(pj):
        return 0
    import random
    rnd = random.Random(7)
    items = json.load(open(pj, encoding="utf-8"))["items"]
    variants = {}
    for name in {it["a"] for it in items}:
        vs = []
        for p in eal.list_assets("/Game/Nature/" + name, recursive=True, include_folder=False):
            a = unreal.load_asset(p)
            if isinstance(a, unreal.StaticMesh):
                nm = a.get_name().lower()
                if name.startswith("grass_") and any(k in nm for k in ("dead", "flattened", "single", "small")):
                    continue
                b = a.get_bounds()
                vs.append((a, b.origin.x, b.origin.y))
        variants[name] = vs
    n = 0
    for it in items:
        vs = variants.get(it["a"])
        if not vs:
            continue
        sm, ox, oy = vs[rnd.randrange(len(vs))]
        s_, th = it["s"], math.radians(it["yaw"])
        dx, dy = ox * s_, oy * s_
        loc = unreal.Vector(it["x"] - (dx * math.cos(th) - dy * math.sin(th)), it["y"] - (dx * math.sin(th) + dy * math.cos(th)), it["z"])
        a = eas.spawn_actor_from_class(unreal.StaticMeshActor, loc, unreal.Rotator(roll=0.0, pitch=0.0, yaw=it["yaw"]))
        a.set_actor_label("Prop_%s_%d" % (it["a"], n))
        a.static_mesh_component.set_static_mesh(sm)
        a.set_actor_scale3d(unreal.Vector(s_, s_, s_))
        if it["a"].startswith(("grass_", "stone_")):
            a.static_mesh_component.set_editor_property("cast_shadow", False)
        n += 1
    return n


def build_station(st, ground_mat, moon_mat, sphere):
    sid = st["id"]
    level = st["level"].split("/")[-1]
    mdir = ROOT + r"\data\unreal\meshes" + "\\" + sid
    layout = json.load(open(mdir + r"\layout.json", encoding="utf-8"))
    dest = "/Game/Stations/%s/Meshes" % sid.replace("-", "_")
    meshes = {}
    for i in range(0, len(layout["meshes"]), BATCH):
        part = layout["meshes"][i:i + BATCH]
        if os.environ.get("SITE_REUSE_MESHES"):
            for m in part:
                meshes[m["name"]] = unreal.load_asset("%s/%s/StaticMeshes/%s" % (dest, m["name"], m["name"]))
            continue
        got = import_many([(mdir + "\\%s.glb" % m["name"], dest, m["name"]) for m in part])
        for name, assets in got.items():
            sm = next(a for a in assets if isinstance(a, unreal.StaticMesh))
            prep_mesh(sm)
            meshes[name] = sm

    les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    path = "/Game/Maps/" + level
    umap = ROOT + r"\unreal\FezaMoon\Content\Maps" + "\\" + level + ".umap"
    if os.path.exists(umap):
        if not les.load_level(path):
            raise RuntimeError("load_level basarisiz: " + path)
    elif not les.new_level(path):
        raise RuntimeError("new_level basarisiz: " + path)
    eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    for a in list(eas.get_all_level_actors()):
        eas.destroy_actor(a)
    for m in layout["meshes"]:
        o = m["origin_cm"]
        a = eas.spawn_actor_from_class(unreal.StaticMeshActor, unreal.Vector(o[0], o[1], o[2]))
        a.set_actor_label(m["name"])
        a.static_mesh_component.set_static_mesh(meshes[m["name"]])
        a.static_mesh_component.set_material(0, ground_mat)

    g = st["ground_center_cm"]
    ground = unreal.Vector(g[0], g[1], g[2])
    n_dsn, err = assemble_dsn(eas, ground, st["moon"]["az_deg"], st["moon"]["el_deg"])
    n_sc = scatter(eas, sid)

    # --- gunes + atmosfer ---
    sd = az_el_dir(st["sun"]["az_deg"], st["sun"]["el_deg"])
    far = unreal.Vector(sd.x * 1e8, sd.y * 1e8, sd.z * 1e8)
    sun = eas.spawn_actor_from_class(unreal.DirectionalLight, far)
    sun.set_actor_label("Sun")
    sun.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(far, unreal.Vector(0, 0, 0)), False)
    lc = sun.get_component_by_class(unreal.DirectionalLightComponent)
    lc.set_editor_property("intensity", SUN_LUX)
    lc.set_editor_property("light_source_angle", 0.53)
    lc.set_editor_property("atmosphere_sun_light", True)
    sky = eas.spawn_actor_from_class(unreal.SkyAtmosphere, unreal.Vector(0, 0, 0))
    sky.set_actor_label("SkyAtmosphere")
    sl = eas.spawn_actor_from_class(unreal.SkyLight, unreal.Vector(0, 0, 20000))
    sl.set_actor_label("SkyLight")
    sl.get_component_by_class(unreal.SkyLightComponent).set_editor_property("real_time_capture", True)

    # --- Ay: gercek yon, evre (ayni Gunes isigi), yonelim ---
    mo = st["moon"]
    d = az_el_dir(mo["az_deg"], mo["el_deg"])
    mloc = unreal.Vector(ground.x + d.x * MOON_D, ground.y + d.y * MOON_D, ground.z + d.z * MOON_D)
    ma = eas.spawn_actor_from_class(unreal.StaticMeshActor, mloc)
    ma.set_actor_label("Moon")
    ma.static_mesh_component.set_static_mesh(sphere)
    ma.static_mesh_component.set_material(0, moon_mat)
    ma.static_mesh_component.set_editor_property("cast_shadow", False)
    sc = MOON_D * math.tan(math.radians(mo["ang_radius_deg"])) / 100.0
    ma.set_actor_scale3d(unreal.Vector(sc, sc, sc))
    ma.set_actor_rotation(unreal.MathLibrary.make_rot_from_xz(unreal.Vector(*mo["axis_x"]), unreal.Vector(*mo["axis_z"])), False)

    ppv = eas.spawn_actor_from_class(unreal.PostProcessVolume, unreal.Vector(0, 0, 0))
    ppv.set_actor_label("Exposure")
    ppv.set_editor_property("unbound", True)
    stt = ppv.get_editor_property("settings")
    stt.set_editor_property("override_auto_exposure_method", True)
    stt.set_editor_property("auto_exposure_method", unreal.AutoExposureMethod.AEM_MANUAL)
    stt.set_editor_property("override_auto_exposure_bias", True)
    stt.set_editor_property("auto_exposure_bias", BIAS)
    ppv.set_editor_property("settings", stt)

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

    side = az_el_dir(mo["az_deg"] + 55.0, 0.0)                # canagi onden/yandan gor (Ay tarafinda)
    cam_loc = unreal.Vector(ground.x + side.x * 22000, ground.y + side.y * 22000, ground.z + 200)
    camera("Cam_Ground", cam_loc, unreal.Vector(ground.x, ground.y, ground.z + 3000), 16.0)
    camera("Cam_Moon", cam_loc, mloc, 22.0)
    camera("Cam_MoonZoom", cam_loc, mloc, 300.0)              # Ay diski ~ 0.5 derece: uzun odak
    camera("Cam_Overview", unreal.Vector(ground.x + side.x * 50000, ground.y + side.y * 50000, ground.z + 24000), unreal.Vector(ground.x, ground.y, ground.z + 3000), 20.0)
    camera("Cam_Close", unreal.Vector(ground.x + side.x * 7500, ground.y + side.y * 7500, ground.z + 250), unreal.Vector(ground.x, ground.y, ground.z + 3000), 20.0)

    les.save_current_level()
    with open(ROOT + r"\data\scratch\stations_build.txt", "a", encoding="utf-8") as f:
        f.write("HAZIR %s | dsn parca %d | hedef hatasi %.2f derece | ay el %.1f az %.0f\n" % (level, n_dsn, err, mo["el_deg"], mo["az_deg"]))


def main():
    for d in ("/Game/DSN", "/Game/Stations", "/Game/Maps"):
        eal.make_directory(d)
    sts = json.load(open(ROOT + r"\data\unreal\stations\stations.json", encoding="utf-8"))["stations"]
    only = os.environ.get("SITE_ONLY")
    sts = [s for s in sts if not only or s["id"] == only]

    if not os.environ.get("SITE_REUSE_MESHES"):
        items = [(ROOT + r"\data\raw\dsn70\dsn70.glb", "/Game/DSN", "dsn70")]
        for sid in {s["id"] for s in sts}:
            tid, _ = GROUND[sid]
            for suf, mp in (("D", "Diffuse"), ("N", "nor_dx"), ("R", "Rough")):
                items.append((PH + "\\%s\\%s_%s_2k.jpg" % (tid, tid, mp), "/Game/Stations/Textures", "%s_%s" % (tid, suf)))
        got = import_many(items)
        for k, v in got.items():
            if k.endswith(("_D", "_N", "_R")) and v and isinstance(v[0], unreal.Texture):
                tex_settings(v[0], {"D": "color", "N": "normal", "R": "linear"}[k[-1]])
    T = {}
    for sid in {s["id"] for s in sts}:
        tid, _ = GROUND[sid]
        for suf in "DNR":
            T["%s_%s" % (tid, suf)] = unreal.load_asset("/Game/Stations/Textures/%s_%s" % (tid, suf))
    mask = unreal.load_asset("/Game/Moon/Textures/T_MaskNoise")
    sphere = unreal.load_asset("/Game/Meshes/uvsphere/StaticMeshes/SM_UVSphere")
    moon_mat = build_moon_material()
    for st in sts:
        build_station(st, build_ground(st["id"], T, mask), moon_mat, sphere)


main()
