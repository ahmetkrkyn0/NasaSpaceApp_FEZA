"""Editor icinde (grafikli UnrealEditor.exe) calisir: bir "cekim" (FILM_SHOT) icin kare kare PNG yakalar, bitince editoru kapatir.

Kullanim: UnrealEditor.exe <proje> -ExecCmds="py C:/.../ue_film.py" -windowed -ResX=1920 -ResY=1080   (ortam: FILM_SHOT=<ad>)
Cikti   : Saved/Screenshots/WindowsEditor/film_<ad>_<NNNN>.png  -> tools/film_encode.py mp4'e cevirir.
Cekimler: SHOTS sozlugu (asagida). Her cekim = harita + kare sayisi + kare basina ayar fonksiyonu.
Gokyuzu servisi (127.0.0.1:5198, tools/sky_service.py) calisiyor olmali (saha cekimleri Gunes/Dunya yonunu oradan alir).
"""
import datetime as dt
import json
import math
import os
import traceback
import urllib.parse
import urllib.request

import unreal

ROOT = "C:/Users/Berke/FEZA_Unreal"
SHOT = os.environ.get("FILM_SHOT", "apollo")
START = int(os.environ.get("FILM_START", "300"))       # harita yuklendikten sonra isinma (agir sahnelerde 900)
STEP = int(os.environ.get("FILM_STEP", "6"))           # iki kare arasi tick
SKY = "http://127.0.0.1:5198/sky"
LOG = open(ROOT + "/data/scratch/film_%s.txt" % SHOT, "w", encoding="utf-8")
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
LES = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
V = unreal.Vector


def log(m):
    LOG.write(str(m) + "\n")
    LOG.flush()


def find(label):
    for a in EAS.get_all_level_actors():
        if a.get_actor_label() == label:
            return a
    return None


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


def vlerp(a, b, t):
    return V(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t))


def vadd(a, b):
    return V(a.x + b.x, a.y + b.y, a.z + b.z)


def vsub(a, b):
    return V(a.x - b.x, a.y - b.y, a.z - b.z)


def vmul(a, k):
    return V(a.x * k, a.y * k, a.z * k)


def vlen(a):
    return math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)


def vnorm(a):
    l = vlen(a) or 1.0
    return V(a.x / l, a.y / l, a.z / l)


def look(frm, to):
    return unreal.MathLibrary.find_look_at_rotation(frm, to)


# ---------------------------------------------------------------- kamera
class Cam:
    def __init__(self, focal=26.0):
        self.a = EAS.spawn_actor_from_class(unreal.CineCameraActor, V(0, 0, 0), unreal.Rotator())
        self.a.set_actor_label("Cam_Film")
        c = self.a.get_cine_camera_component()
        c.set_editor_property("current_focal_length", focal)
        try:
            fs = c.get_editor_property("focus_settings")
            fs.focus_method = unreal.CameraFocusMethod.DISABLE
            c.set_editor_property("focus_settings", fs)
        except Exception:        # noqa: BLE001
            pass

    def put(self, loc, target=None, rot=None, focal=None):
        self.a.set_actor_location(loc, False, False)
        self.a.set_actor_rotation(rot if rot is not None else look(loc, target), False)
        if focal is not None:
            self.a.get_cine_camera_component().set_editor_property("current_focal_length", focal)


# ---------------------------------------------------------------- isik/gokyuzu (saha haritalari)
_sky_cache = {}


def sky_query(lat, lon, iso_):
    k = (round(lat, 3), round(lon, 3), iso_)
    if k not in _sky_cache:
        q = urllib.parse.urlencode({"lat": lat, "lon": lon, "t": iso_})
        with urllib.request.urlopen(SKY + "?" + q, timeout=5) as r:
            _sky_cache[k] = json.loads(r.read().decode())
    return _sky_cache[k]


def azel(az, el):
    a, e = math.radians(az), math.radians(el)
    return V(math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e))


SKY_D = 2.0e8
SUN_LUX = 120000.0
_mids = {}


def mid(a):
    m = _mids.get(a.get_actor_label())
    if m is None:
        m = a.static_mesh_component.create_dynamic_material_instance(0)
        _mids[a.get_actor_label()] = m
    return m


def apply_sky(lat, lon, iso_, horizon_deg=0.0):
    """feza_runtime._sky_apply'in editor surumu: Gunes isigi + diski, Dunya (evre+yonelim), yildiz golgelemesi."""
    d = sky_query(lat, lon, iso_)
    sn, ea = d["sun"], d["earth"]
    stars = find("Stars")
    g = stars.get_actor_location()
    sdir = azel(sn["az_deg"], sn["el_deg"])
    sun_up = sn["el_deg"] > horizon_deg - 0.27
    earth_up = ea["el_deg"] > horizon_deg - ea["ang_radius_deg"]
    disc = find("SunDisc")
    if disc is not None:
        disc.set_actor_location(V(g.x + sdir.x * SKY_D, g.y + sdir.y * SKY_D, g.z + sdir.z * SKY_D), False, False)
        disc.set_actor_hidden_in_game(not sun_up)
    ed = azel(ea["az_deg"], ea["el_deg"])
    rot = unreal.MathLibrary.make_rot_from_xz(V(*ea["axis_x"]), V(*ea["axis_z"]))
    sc = SKY_D * math.tan(math.radians(ea["ang_radius_deg"])) / 100.0
    for lab, k in (("Earth", 1.0), ("EarthClouds", 1.004), ("EarthAtmosphere", 1.04)):
        a = find(lab)
        if a is None:
            continue
        a.set_actor_location(V(g.x + ed.x * SKY_D, g.y + ed.y * SKY_D, g.z + ed.z * SKY_D), False, False)
        a.set_actor_scale3d(V(sc * k, sc * k, sc * k))
        if lab != "EarthAtmosphere":
            a.set_actor_rotation(rot, False)
        a.set_actor_hidden_in_game(not earth_up)
        if lab != "EarthClouds":
            mid(a).set_vector_parameter_value("SunDir", unreal.LinearColor(sdir.x, sdir.y, sdir.z, 0.0))
    mid(stars).set_vector_parameter_value("SunDir", unreal.LinearColor(sdir.x, sdir.y, sdir.z, 0.0))
    light = find("Sun")
    far = V(sdir.x * 1e8, sdir.y * 1e8, sdir.z * 1e8)
    light.set_actor_rotation(look(far, V(0, 0, 0)), False)
    lc = light.get_component_by_class(unreal.DirectionalLightComponent)
    k = max(0.0, min(1.0, (sn["el_deg"] - horizon_deg + 0.27) / 2.0))
    try:
        lc.set_intensity(SUN_LUX * k)
    except Exception:        # noqa: BLE001
        lc.set_editor_property("intensity", SUN_LUX * k)
    return d


def utc(s):
    return dt.datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=dt.timezone.utc)


def iso(t):
    return t.strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------- sinyal isini (Orbit)
class Beam:
    """Noktadan noktaya giden sinyal: buyuyen cizgi + onde parlak bas. Yol birden cok parcadan olusabilir (role)."""

    def __init__(self, pts, mat, radius=330.0, head=1800.0):
        self.pts = pts
        self.segs = []
        self.total = 0.0
        for a, b in zip(pts[:-1], pts[1:]):
            self.segs.append((a, b, self.total, vlen(vsub(b, a))))
            self.total += vlen(vsub(b, a))
        cyl = unreal.load_asset("/Engine/BasicShapes/Cylinder.Cylinder")
        sph = unreal.load_asset("/Game/Meshes/uvsphere/StaticMeshes/SM_UVSphere")
        self.r = radius
        self.lines = []
        for _ in self.segs:
            a = EAS.spawn_actor_from_class(unreal.StaticMeshActor, V(0, 0, 0), unreal.Rotator())
            a.static_mesh_component.set_static_mesh(cyl)
            a.static_mesh_component.set_material(0, mat)
            a.static_mesh_component.set_cast_shadow(False)
            a.set_actor_hidden_in_game(True)
            self.lines.append(a)
        self.head = EAS.spawn_actor_from_class(unreal.StaticMeshActor, V(0, 0, 0), unreal.Rotator())
        self.head.static_mesh_component.set_static_mesh(sph)
        self.head.static_mesh_component.set_material(0, mat)
        self.head.static_mesh_component.set_cast_shadow(False)
        self.head.set_actor_hidden_in_game(True)
        self.head_r = head

    def at(self, u, head_on=True):
        d = max(0.0, min(1.0, u)) * self.total
        for a, (p, q, s0, ln) in zip(self.lines, self.segs):
            part = max(0.0, min(ln, d - s0))
            if part < 1.0:
                a.set_actor_hidden_in_game(True)
                continue
            dirv = vnorm(vsub(q, p))
            a.set_actor_hidden_in_game(False)
            a.set_actor_location(vadd(p, vmul(dirv, part / 2.0)), False, False)
            a.set_actor_rotation(unreal.MathLibrary.make_rot_from_z(dirv), False)
            a.set_actor_scale3d(V(self.r / 50.0, self.r / 50.0, part / 100.0))
        if head_on and 0.0 < u < 1.0:
            for p, q, s0, ln in self.segs:
                if s0 <= d <= s0 + ln:
                    pos = vadd(p, vmul(vnorm(vsub(q, p)), d - s0))
                    self.head.set_actor_location(pos, False, False)
                    k = self.head_r / 100.0
                    self.head.set_actor_scale3d(V(k, k, k))
                    self.head.set_actor_hidden_in_game(False)
                    return
        self.head.set_actor_hidden_in_game(True)


def make_mat(name, rgb, gain):
    p = "/Game/Materials/" + name
    eal = unreal.EditorAssetLibrary
    if eal.does_asset_exist(p):
        return unreal.load_asset(p)
    mel = unreal.MaterialEditingLibrary
    m = unreal.AssetToolsHelpers.get_asset_tools().create_asset(name, "/Game/Materials", unreal.Material, unreal.MaterialFactoryNew())
    m.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_UNLIT)
    c = mel.create_material_expression(m, unreal.MaterialExpressionConstant3Vector, -300, 0)
    c.set_editor_property("constant", unreal.LinearColor(rgb[0], rgb[1], rgb[2], 0))
    k = mel.create_material_expression(m, unreal.MaterialExpressionMultiply, -150, 0)
    mel.connect_material_expressions(c, "", k, "A")
    k.set_editor_property("const_b", gain)
    mel.connect_material_property(k, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    mel.recompile_material(m)
    eal.save_loaded_asset(m)
    return m


def marker_pos(sid):
    return find("MarkerHead_" + sid).get_actor_location()


# ================================================================ CEKIMLER
CTX = {}


def orbit_overview_cam():
    b = find("Cam_Shot_Overview")
    return b.get_actor_location(), b.get_actor_rotation(), b.get_cine_camera_component().get_editor_property("current_focal_length")


def setup_signal(kind):
    """Orbit: Apollo 11 (dogrudan) ya da Chang'e 4 (role uzerinden) -> Dunya'daki Madrid anteni."""
    CTX["cam"] = Cam(26.0)
    sig = make_mat("M_Signal", (0.25, 0.85, 1.0), 20000.0)
    madrid = marker_pos("dsn-madrid")
    moon_c = find("Moon").get_actor_location()
    if kind == "apollo":
        src = marker_pos("apollo-11")
        CTX["beam"] = Beam([src, madrid], sig)
    else:
        src = marker_pos("change-4")
        n = vnorm(vsub(src, moon_c))
        best = None
        for lat in (0, 6000, 12000, 18000, 24000, 30000, -6000, -12000):
            cand = vadd(vadd(moon_c, vmul(n, 28000.0 * 1.9)), V(lat, 0, lat))
            d = vnorm(vsub(madrid, cand))
            c = vsub(moon_c, cand)
            cr = V(c.y * d.z - c.z * d.y, c.z * d.x - c.x * d.z, c.x * d.y - c.y * d.x)
            if vlen(cr) > 28000.0 * 1.25:
                best = cand
                break
        relay = best or vadd(moon_c, vmul(n, 28000.0 * 2.2))
        CTX["beam"] = Beam([src, relay, madrid], sig)
        for lab in ("TDRS-East_0", "TDRS-East_1"):
            a = find(lab)
            b = EAS.duplicate_actor(a, a.get_world(), V(0, 0, 0))
            b.set_actor_label("Relay_" + lab)
            b.set_actor_location(relay, False, False)
            b.set_actor_scale3d(vmul(a.get_actor_scale3d(), 3.0))
        log("role konumu %s" % relay)
    sph = unreal.load_asset("/Game/Meshes/uvsphere/StaticMeshes/SM_UVSphere")
    pt = EAS.spawn_actor_from_class(unreal.StaticMeshActor, src, unreal.Rotator())
    pt.static_mesh_component.set_static_mesh(sph)
    pt.static_mesh_component.set_material(0, sig)
    pt.static_mesh_component.set_cast_shadow(False)
    CTX["pt"] = pt
    for a in EAS.get_all_level_actors():
        lab = a.get_actor_label()
        if lab.startswith("Marker") and "dsn-" not in lab:
            a.set_actor_hidden_in_game(True)
    CTX["kind"] = kind


def frame_signal(i, n):
    t = i / float(n - 1)
    cam = CTX["cam"]
    moon_c = find("Moon").get_actor_location()
    u = smooth((t - 0.10) / 0.72)
    CTX["beam"].at(u)
    k = 800.0 * (1.0 + 0.35 * math.sin(i * 0.45)) * (1.0 if t > 0.04 else t / 0.04)
    CTX["pt"].set_actor_scale3d(V(k / 100.0, k / 100.0, k / 100.0))
    b_loc, b_rot, focal = orbit_overview_cam()
    aim = V(0, moon_c.y * (0.52 if CTX["kind"] == "apollo" else 0.60), moon_c.z * 0.5)
    push = smooth(t)
    cam.put(vadd(b_loc, V(0, -6000.0 * push, 0)), aim, focal=lerp(19.0, 21.0, push))


# ---------------------------------------------------------------- yuzey (saha) cekimleri
MONS = dict(lat=-84.78, lon=29.13, map="Site_Ridges")
APOLLO = dict(lat=0.67416, lon=23.47314, map="Site_Plains")
CHANGE4 = dict(lat=-45.4561, lon=177.5885, map="Site_Craters")


def setup_surface(site, focal=24.0):
    CTX["cam"] = Cam(focal)
    CTX["site"] = site
    a = find("Athena_Frame") or find("Athena_BodyUpper")
    CTX["lander"] = a.get_actor_location() if a else find("Cam_Ground").get_actor_location()
    for lab in ("CommLink",):
        x = find(lab)
        if x is not None:
            x.set_actor_hidden_in_game(True)


def surface_cam(mode, t, d, lander):
    """Kamera: lander cevresinde yavas drone-vari yorunge; Gunes azimutuna gore konumlanir ki golgeler ve isik hep gorunsun."""
    sun_az = math.radians(d["sun"]["az_deg"])
    if mode == "orbit":
        r = 1700.0 - 250.0 * t
        phi = sun_az + math.pi + math.radians(48 + 22 * t)
        loc = V(lander.x + r * math.cos(phi), lander.y + r * math.sin(phi), lander.z + 230.0 + 60.0 * t)
        return loc, V(lander.x, lander.y, lander.z + 210.0), 24.0
    if mode == "close":
        r = 620.0 - 120.0 * t
        phi = sun_az + math.radians(120 - 40 * t)
        loc = V(lander.x + r * math.cos(phi), lander.y + r * math.sin(phi), lander.z + 150.0 + 40.0 * t)
        return loc, V(lander.x, lander.y, lander.z + 190.0), 28.0
    if mode == "skypan":
        ea = math.radians(d["earth"]["az_deg"])
        a = lerp(sun_az, ea, smooth(t)) if abs(sun_az - ea) < math.pi else sun_az
        loc = V(lander.x - 900.0 * math.cos(a), lander.y - 900.0 * math.sin(a), lander.z + 200.0)
        tgt = V(loc.x + math.cos(a) * 1000, loc.y + math.sin(a) * 1000, loc.z + 90.0 + 120.0 * t)
        return loc, tgt, 22.0
    if mode == "earth":
        ea = math.radians(d["earth"]["az_deg"])
        loc = V(lander.x - 900.0 * math.cos(ea), lander.y - 900.0 * math.sin(ea), lander.z + 200.0)
        return loc, V(loc.x + math.cos(ea) * 1000, loc.y + math.sin(ea) * 1000, loc.z + 70.0), 22.0
    if mode == "fly":
        phi = sun_az + math.pi + math.radians(70)
        r = lerp(7000.0, 1800.0, smooth(t))
        loc = V(lander.x + r * math.cos(phi + 0.5 * t), lander.y + r * math.sin(phi + 0.5 * t), lander.z + lerp(2600.0, 380.0, smooth(t)))
        return loc, V(lander.x, lander.y, lander.z + 150.0), 24.0
    raise ValueError(mode)


def frame_surface(i, n, t0, t1, mode):
    t = i / float(n - 1)
    site = CTX["site"]
    tm = utc(t0) + (utc(t1) - utc(t0)) * t
    d = apply_sky(site["lat"], site["lon"], iso(tm.replace(microsecond=0)))
    loc, tgt, focal = surface_cam(mode, t, d, CTX["lander"])
    CTX["cam"].put(loc, tgt, focal=focal)


def find_sunset(site, t0, days=30):
    """Gunes ufkun altina inen ilk an (saatlik tarama, sonra dakika inceltme)."""
    t = utc(t0)
    prev = sky_query(site["lat"], site["lon"], iso(t))["sun"]["el_deg"]
    for h in range(1, days * 24):
        cur = sky_query(site["lat"], site["lon"], iso(t + dt.timedelta(hours=h)))["sun"]["el_deg"]
        if prev > 0.0 >= cur:
            return t + dt.timedelta(hours=h)
        prev = cur
    return t + dt.timedelta(hours=days * 12)


def mk_surface(site, t0, t1, mode, frames, focal=24.0):
    return dict(map=site["map"], frames=frames, setup=lambda: setup_surface(site, focal), frame=lambda i, n: frame_surface(i, n, t0, t1, mode))


def frame_compare(i, n):
    k = min(2, int(i / (n / 3.0)))
    t = (i - k * (n / 3.0)) / (n / 3.0)
    starts = ("2026-12-01T00:00:00Z", "2026-12-06T00:00:00Z", "2026-12-12T00:00:00Z")
    t0 = utc(starts[k])
    tm = t0 + dt.timedelta(days=14) * t
    d = apply_sky(MONS["lat"], MONS["lon"], iso(tm.replace(microsecond=0)))
    loc, tgt, focal = surface_cam("earth", t, d, CTX["lander"])
    CTX["cam"].put(loc, tgt, focal=focal)


def frame_countdown(i, n):
    if "sunset" not in CTX:
        CTX["sunset"] = find_sunset(MONS, "2026-12-14T00:00:00Z")
        log("gunbatimi %s" % CTX["sunset"])
    t = i / float(n - 1)
    tm = CTX["sunset"] + dt.timedelta(hours=lerp(-30, 4, t))
    d = apply_sky(MONS["lat"], MONS["lon"], iso(tm.replace(microsecond=0)))
    loc, tgt, focal = surface_cam("skypan", 0.0, d, CTX["lander"])
    CTX["cam"].put(loc, tgt, focal=24.0)



def frame_dusk(i, n):
    site = CTX["site"]
    if "sunset" not in CTX:
        CTX["sunset"] = find_sunset(site, "2026-12-05T00:00:00Z")
        log("gunbatimi %s" % CTX["sunset"])
    t = i / float(n - 1)
    tm = CTX["sunset"] + dt.timedelta(hours=lerp(-14, 14, t))
    d = apply_sky(site["lat"], site["lon"], iso(tm.replace(microsecond=0)))
    loc, tgt, focal = surface_cam("orbit", t, d, CTX["lander"])
    CTX["cam"].put(loc, tgt, focal=focal)


# ---------------------------------------------------------------- gecmis misyonlar: 3D tur (Orbit) ve 2B harita
MISSIONS = ["apollo-11", "change-4", "chandrayaan-3", "slim", "im1-odysseus", "change-6", "blue-ghost-1", "im2-athena", "mons-mouton-im2-target", "hakuto-r-m2"]
MAP_ORIGIN = V(0, -3000000.0, 0)
MAP_W, MAP_H = 400000.0, 200000.0


def latlon_xy(lat, lon):
    return V(MAP_ORIGIN.x + lon / 180.0 * MAP_W / 2.0, MAP_ORIGIN.y + lat / 90.0 * MAP_H / 2.0, MAP_ORIGIN.z)


def setup_tour3d():
    CTX["cam"] = Cam(28.0)
    CTX["heads"] = []
    for a in EAS.get_all_level_actors():
        lab = a.get_actor_label()
        if lab.startswith("Marker"):
            sid = lab.replace("MarkerHead_", "").replace("Marker_", "")
            if sid in MISSIONS:
                a.set_actor_hidden_in_game(False)
                if lab.startswith("MarkerHead_"):
                    CTX["heads"].append(a)
            else:
                a.set_actor_hidden_in_game(True)


def frame_tour3d(i, n):
    t = i / float(n - 1)
    mc = find("Moon").get_actor_location()
    a = math.radians(lerp(-112.0, 18.0, smooth(t)))
    R = lerp(88000.0, 60000.0, math.sin(t * math.pi))
    loc = V(mc.x + R * math.sin(a), mc.y - R * math.cos(a), mc.z + 14000.0 * math.sin(t * 2 * math.pi) + 9000.0)
    CTX["cam"].put(loc, V(mc.x, mc.y, mc.z - 800.0), focal=26.0)
    for h in CTX["heads"]:
        k = 11.0 * (1.0 + 0.25 * math.sin(i * 0.3))
        h.set_actor_scale3d(V(k, k, k))


def setup_map2d():
    CTX["cam"] = Cam(26.0)
    eal = unreal.EditorAssetLibrary
    mel = unreal.MaterialEditingLibrary
    p = "/Game/Materials/M_Map2D"
    if not eal.does_asset_exist(p):
        m = unreal.AssetToolsHelpers.get_asset_tools().create_asset("M_Map2D", "/Game/Materials", unreal.Material, unreal.MaterialFactoryNew())
        m.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_UNLIT)
        tx = mel.create_material_expression(m, unreal.MaterialExpressionTextureSample, -400, 0)
        tx.set_editor_property("texture", unreal.load_asset("/Game/Textures/T_Moon_Color_8k"))
        k = mel.create_material_expression(m, unreal.MaterialExpressionMultiply, -150, 0)
        mel.connect_material_expressions(tx, "RGB", k, "A")
        k.set_editor_property("const_b", 7000.0)
        mel.connect_material_property(k, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
        mel.recompile_material(m)
        eal.save_loaded_asset(m)
    plane = EAS.spawn_actor_from_class(unreal.StaticMeshActor, MAP_ORIGIN, unreal.Rotator())
    plane.static_mesh_component.set_static_mesh(unreal.load_asset("/Engine/BasicShapes/Plane.Plane"))
    plane.static_mesh_component.set_material(0, unreal.load_asset(p))
    plane.set_actor_scale3d(V(MAP_W / 100.0, MAP_H / 100.0, 1.0))
    plane.static_mesh_component.set_cast_shadow(False)
    sig = make_mat("M_Signal", (0.25, 0.85, 1.0), 20000.0)
    cyl = unreal.load_asset("/Engine/BasicShapes/Cylinder.Cylinder")
    sph = unreal.load_asset("/Game/Meshes/uvsphere/StaticMeshes/SM_UVSphere")
    cat = json.load(open(ROOT + "/data/unreal/catalog_markers.json", encoding="utf-8"))["sites"]
    CTX["pins"] = []
    for s_ in cat:
        if s_["id"] not in MISSIONS:
            continue
        pos = latlon_xy(s_["lat_deg"], s_["lon_deg"])
        h = EAS.spawn_actor_from_class(unreal.StaticMeshActor, V(pos.x, pos.y, pos.z + 6000.0), unreal.Rotator())
        h.static_mesh_component.set_static_mesh(sph)
        h.static_mesh_component.set_material(0, sig)
        h.static_mesh_component.set_cast_shadow(False)
        h.set_actor_scale3d(V(16.0, 16.0, 16.0))
        st = EAS.spawn_actor_from_class(unreal.StaticMeshActor, V(pos.x, pos.y, pos.z + 3000.0), unreal.Rotator())
        st.static_mesh_component.set_static_mesh(cyl)
        st.static_mesh_component.set_material(0, sig)
        st.static_mesh_component.set_cast_shadow(False)
        st.set_actor_scale3d(V(1.0, 1.0, 60.0))
        CTX["pins"].append((h, pos))
    CTX["path"] = sorted([p_[1] for p_ in CTX["pins"]], key=lambda v: v.x)
    for a in EAS.get_all_level_actors():
        lab = a.get_actor_label()
        if lab in ("Earth", "EarthClouds", "EarthAtmosphere", "Moon") or lab.startswith("Marker") or lab.startswith("TDRS"):
            a.set_actor_hidden_in_game(True)


def frame_map2d(i, n):
    t = i / float(n - 1)
    P = CTX["path"]
    seg = smooth((t - 0.15) / 0.85) * (len(P) - 1)
    k = min(len(P) - 2, int(seg))
    u = seg - k
    foc = vlerp(P[k], P[k + 1], smooth(u) * 0.6 + u * 0.4)
    w = smooth(t / 0.30)
    h = lerp(330000.0, 95000.0, w)
    back = lerp(9000.0, 70000.0, w)
    fx = foc.x * w + MAP_ORIGIN.x * (1 - w)
    fy = foc.y * w + MAP_ORIGIN.y * (1 - w)
    CTX["cam"].put(V(fx, fy - back, MAP_ORIGIN.z + h), V(fx, fy, MAP_ORIGIN.z), focal=26.0)
    for h_, pos in CTX["pins"]:
        sc = 16.0 * (1.0 + 0.3 * math.sin(i * 0.35 + pos.x * 1e-4))
        h_.set_actor_scale3d(V(sc, sc, sc))


def setup_dish():
    CTX["cam"] = Cam(26.0)
    b = find("Cam_Close")
    CTX["base"] = (b.get_actor_location(), b.get_actor_rotation(), b.get_cine_camera_component().get_editor_property("current_focal_length"))


def frame_dish(i, n):
    t = i / float(n - 1)
    loc, rot, focal = CTX["base"]
    fwd = unreal.MathLibrary.get_forward_vector(rot)
    CTX["cam"].put(vadd(loc, vmul(fwd, 260.0 * smooth(t))), rot=rot, focal=focal)


SHOTS = {
    "apollo": dict(map="Orbit", frames=135, setup=lambda: setup_signal("apollo"), frame=frame_signal),
    "change4": dict(map="Orbit", frames=180, setup=lambda: setup_signal("change4"), frame=frame_signal),
    "sim14": mk_surface(MONS, "2026-12-19T00:00:00Z", "2026-12-25T00:00:00Z", "orbit", 270),
    "tl14": mk_surface(MONS, "2026-12-17T00:00:00Z", "2026-12-27T00:00:00Z", "orbit", 90),
    "s2_compare": dict(map="Site_Ridges", frames=90, setup=lambda: setup_surface(MONS), frame=frame_compare),
    "s3_sky": mk_surface(MONS, "2026-12-21T12:00:00Z", "2026-12-21T12:30:00Z", "skypan", 75),
    "s3_countdown": dict(map="Site_Ridges", frames=90, setup=lambda: setup_surface(MONS), frame=frame_countdown),
    "tour3d": dict(map="Orbit", frames=180, setup=setup_tour3d, frame=frame_tour3d),
    "map2d": dict(map="Orbit", frames=180, setup=setup_map2d, frame=frame_map2d),
    "sc_polar": mk_surface(MONS, "2026-12-21T00:00:00Z", "2026-12-23T12:00:00Z", "orbit", 75),
    "sc_farside": mk_surface(CHANGE4, "2026-12-05T00:00:00Z", "2026-12-08T00:00:00Z", "orbit", 75),
    "sc_night": dict(map="Site_Plains", frames=90, setup=lambda: setup_surface(APOLLO), frame=frame_dusk),
    "sc_athena": mk_surface(MONS, "2026-12-21T00:00:00Z", "2026-12-21T12:00:00Z", "fly", 75),
    "sc_recommend": mk_surface(CHANGE4, "2026-12-10T00:00:00Z", "2026-12-12T00:00:00Z", "fly", 75),
    "dish": dict(map="Station_Madrid", frames=36, setup=setup_dish, frame=frame_dish),
    "s3_power": mk_surface(MONS, "2026-12-20T00:00:00Z", "2026-12-23T00:00:00Z", "close", 90, 28.0),
}

# ================================================================ calistirici
S = {"f": 0, "pending": None}
CFG = SHOTS[SHOT]


def shoot(i):
    unreal.AutomationLibrary.take_high_res_screenshot(1920, 1080, "film_%s_%04d.png" % (SHOT, i), CTX["cam"].a, False, False, unreal.ComparisonTolerance.LOW)


def tick(dt_):
    S["f"] += 1
    f = S["f"]
    try:
        if f == 1:
            LES.load_level("/Game/Maps/" + CFG["map"])
        elif f == 5:
            for c in ("r.Streaming.FullyLoadUsedTextures 1", "r.Streaming.PoolSize 6000"):
                unreal.SystemLibrary.execute_console_command(None, c)
        elif f == START - 60:
            CFG["setup"]()
            CFG["frame"](0, CFG["frames"])
            log("kurulum tamam")
        elif f >= START:
            k = (f - START) // STEP
            ph = (f - START) % STEP
            if ph == 0 and k < CFG["frames"]:
                CFG["frame"](k, CFG["frames"])
                S["pending"] = k
            elif ph == 3 and S["pending"] is not None:
                shoot(S["pending"])
                S["pending"] = None
            if k >= CFG["frames"] + 2:
                log("CEKIM BITTI")
                unreal.SystemLibrary.execute_console_command(None, "QUIT_EDITOR")
    except Exception:        # noqa: BLE001
        log(traceback.format_exc())
        unreal.SystemLibrary.execute_console_command(None, "QUIT_EDITOR")


unreal.register_slate_post_tick_callback(tick)
