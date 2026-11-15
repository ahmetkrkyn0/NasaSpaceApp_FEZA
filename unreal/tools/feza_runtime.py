"""Editorde Play (PIE) sirasinda calisan etkilesim katmani (Python). Proje ayari StartupScripts ile editor acilisinda yuklenir.
Ekranda METIN YOK (etiket/HUD kaldirildi); kontroller sezgisel, ipuclari belgede.

Yorunge (Orbit): Ay + Dunya birlikte kadrajda.
  - Ay'a veya Dunya'ya tikla  -> kamera yumusakca yaklasir (Ay: inis bolgeleri, Dunya: DSN istasyonlari ve TDRS)
  - yakinda isaretciye gel (vurgulanir), tikla -> o sahaya gec
  - sol tus surukle = dondur, tekerlek = yakinlastir, Backspace / sag tus = bir kademe geri, Tab = Ay <-> Dunya
Ay sahasi (Site_*): sol tus surukle = bakis, 1/2/3 = kamera, 4 = gokyuzunde Dunya, 5 = Gunes, Backspace/M = Ay'a don, E = Dunya (haberlesme)
DSN istasyonu (Station_*): sol tus surukle = bakis, 1/2/3 = kamera, 4/5 = Ay (genis/yakin), Backspace/E = Dunya'ya don, M = Ay
NOT: Python yalnizca editorde calisir; paketlenmis exe icin ayni mantigin C++'a tasinmasi gerekir (Windows SDK kurulu degil).
"""
import datetime
import json
import math
import os
import urllib.parse
import urllib.request

import unreal

ROOT = r"C:\Users\Berke\FEZA_Unreal"
R_M, R_E = 28000.0, 63710.0
HOVER_PX = 42.0
CLICK_PX = 8.0
ORBIT_LEVEL = "/Game/Maps/Orbit"

# --- web arayuzu (ekibin uygulamasi) Unreal icinde: BP_UIHost -> Shell (WBP_Shell) -> Browser (WebBrowser) ---
UI_URL = os.environ.get("FEZA_UI_URL", "http://127.0.0.1:5199/")
UI_ENABLED = True
LABELS_PATH = "ue-labels.html"                     # ikinci (saydam) tarayici: modern etiketler (HTML/CSS)
UI_WIDTH = 620.0                                   # WBP_Shell: sagdaki tarayici seridi (slate birimi)
UI_LOG = ROOT + r"\data\scratch\ui_runtime.txt"
SCENE_LEVEL = {"moon-craters": "/Game/Maps/Site_Craters", "moon-plains": "/Game/Maps/Site_Plains", "moon-ridges": "/Game/Maps/Site_Ridges"}
JS_ENTER = "(function(){var b=[].slice.call(document.querySelectorAll('button')).filter(function(x){return /OPEN CONSOLE/i.test(x.textContent)})[0];if(b){b.click();return 'entered'}return 'no-splash'})()"

if not hasattr(unreal, "_feza_state"):
    unreal._feza_state = {}
S = unreal._feza_state
for _k, _v in {"world_path": None, "press": None, "force_go": None, "force_focus": None, "frames": 0, "site_cam": "Cam_Ground",
               "next_focus": None, "hub": None, "hover_f": {}, "base_scale": {}}.items():
    S.setdefault(_k, _v)


def _load(path, key):
    try:
        return json.load(open(path, encoding="utf-8"))[key]
    except Exception as e:          # noqa: BLE001
        unreal.log_warning("feza_runtime: %s okunamadi: %s" % (path, e))
        return []


def _ui_log(msg):
    try:
        with open(UI_LOG, "a", encoding="utf-8") as f:
            f.write(str(msg) + "\n")
    except Exception:        # noqa: BLE001
        pass


def _catalog():
    """Katalog saha kimligi -> Unreal seviyesi (export/web3d/scenes.json eslemesi)."""
    try:
        d = json.load(open(ROOT + r"\export\web3d\scenes.json", encoding="utf-8"))
        return {k: SCENE_LEVEL.get(v["scene"]) for k, v in d["catalog_map"].items() if SCENE_LEVEL.get(v["scene"])}
    except Exception as e:        # noqa: BLE001
        _ui_log("katalog okunamadi: %s" % e)
        return {}


CATALOG = _catalog()
SITES = _load(ROOT + r"\data\unreal\catalog_markers.json", "sites")
STATIONS = _load(ROOT + r"\data\unreal\stations\stations.json", "stations")
MOON_POS = (0.0, 215000.0, 14000.0)


def _key(name):
    k = unreal.Key()
    k.set_editor_property("key_name", name)
    return k


K_LMB, K_RMB, K_WU, K_WD = _key("LeftMouseButton"), _key("RightMouseButton"), _key("MouseScrollUp"), _key("MouseScrollDown")
K_M, K_E, K_TAB, K_BACK = _key("M"), _key("E"), _key("Tab"), _key("BackSpace")
K_T = _key("T")
K_1, K_2, K_3, K_4, K_5, K_6 = _key("One"), _key("Two"), _key("Three"), _key("Four"), _key("Five"), _key("Six")


# ---------------- yardimcilar ----------------
def _game_world():
    return unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_game_world()


def _by_label(world):
    out = {}
    for a in unreal.GameplayStatics.get_all_actors_of_class(world, unreal.Actor):
        try:
            out[a.get_actor_label()] = a
        except Exception:        # noqa: BLE001
            pass
    return out


def _mouse(pc):
    r = pc.get_mouse_position()
    if isinstance(r, tuple) and len(r) >= 2:
        return (float(r[-2]), float(r[-1]))
    return (0.0, 0.0)


def _project(pc, loc):
    r = pc.project_world_location_to_screen(loc, False)
    if isinstance(r, tuple) and len(r) == 2:
        ok, v = r
        return (float(v.x), float(v.y)) if ok else None
    if r is not None and hasattr(r, "x") and hasattr(r, "y"):        # 5.8: yalniz Vector2D doner
        return (float(r.x), float(r.y))
    return None


def _delta(pc):
    r = pc.get_input_mouse_delta()
    return (float(r[0]), float(r[1])) if isinstance(r, tuple) and len(r) >= 2 else (0.0, 0.0)


def _norm(v):
    n = math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) or 1.0
    return (v[0] / n, v[1] / n, v[2] / n)


def _view(pc, cam):
    try:
        pc.set_view_target_with_blend(cam, 0.0)
        return
    except Exception as e:       # noqa: BLE001
        unreal.log_warning("feza_runtime: set_view_target_with_blend yok (%s)" % e)
    try:
        pc.player_camera_manager.set_view_target(cam)
    except Exception as e:       # noqa: BLE001
        unreal.log_warning("feza_runtime: kamera ayarlanamadi: %s" % e)


def _open(world, level):
    unreal.log("feza_runtime: gecis -> %s" % level)
    unreal.GameplayStatics.open_level(world, level, True, "")


def _over_ui(world, mx):
    """Fare sagdaki web arayuzu seridinin ustunde mi (orada tiklama/kaydirma tarayiciya gider)."""
    if not S.get("ui"):
        return False
    try:
        vs = unreal.WidgetLayoutLibrary.get_viewport_size(world)
        sc = unreal.WidgetLayoutLibrary.get_viewport_scale(world)
        return mx > vs.x - UI_WIDTH * sc
    except Exception:        # noqa: BLE001
        return False


def _pressed(pc, k):
    return bool(pc.was_input_key_just_pressed(k))


def _angles(offset):
    """Merkezden kameraya ofset -> (yaw, pitch, dist) derece."""
    d = math.sqrt(offset[0] ** 2 + offset[1] ** 2 + offset[2] ** 2) or 1.0
    return math.degrees(math.atan2(offset[1], offset[0])), math.degrees(math.asin(offset[2] / d)), d


# ---------------- yorunge merkezi ----------------
def _presets():
    mx, my, mz = MOON_POS
    ov_c = (0.0, my * 0.5, mz * 0.5)
    ov_y, ov_p, ov_d = _angles((-420000.0, 18000.0, 60000.0))
    mo = _norm((-0.28, -0.92, -0.05))                    # Ay'dan Dunya tarafina: yakin yuz (isaretciler, guney dahil) kameraya
    mo_y, mo_p, _ = _angles(mo)
    ea = _norm((-0.95, 0.10, 0.30))
    ea_y, ea_p, _ = _angles(ea)
    return {
        "overview": {"c": ov_c, "yaw": ov_y, "pitch": ov_p, "dist": ov_d, "dmin": 0.55 * ov_d, "dmax": 1.5 * ov_d},
        "moon": {"c": MOON_POS, "yaw": mo_y, "pitch": mo_p, "dist": 5.2 * R_M, "dmin": 1.6 * R_M, "dmax": 9.0 * R_M},
        "earth": {"c": (0.0, 0.0, 0.0), "yaw": ea_y, "pitch": ea_p, "dist": 4.4 * R_E, "dmin": 1.5 * R_E, "dmax": 8.0 * R_E},
    }


PRE = _presets()
SAT_R = 12000.0                                        # uydu secim/yaklasma yaricapi (cm); TDRS_SCALE ile uyumlu
SAT_NAMES = ("TDRS-East", "TDRS-West", "TDRS-Z")


def _preset(name):
    """Sabit odaklar + uydu odagi ("sat:<ad>": uydu etrafinda yakin kamera, Dunya'dan disari bakan taraf)."""
    if name.startswith("sat:"):
        a = S["actors"].get(name[4:] + "_0")
        if a is not None:
            c = a.get_actor_location()
            off = _norm((c.x, c.y, c.z))
            yaw, pitch, _ = _angles((off[0] + 0.45, off[1] - 0.45, off[2] + 0.35))
            return {"c": (c.x, c.y, c.z), "yaw": yaw, "pitch": pitch, "dist": 3.4 * SAT_R, "dmin": 1.5 * SAT_R, "dmax": 9.0 * SAT_R}
        return PRE["earth"]
    return PRE[name]


def _sats():
    return [(n, S["actors"][n + "_0"]) for n in SAT_NAMES if (n + "_0") in S["actors"]]


def _hub_enter(start, goal):
    p = PRE[start]
    S["hub"] = {"focus": goal, "cur": {"c": list(p["c"]), "yaw": p["yaw"], "pitch": p["pitch"], "dist": p["dist"]}, "goal": None}
    _hub_focus(goal)


def _hub_focus(name):
    h = S["hub"]
    p = _preset(name)
    h["focus"] = name
    S["map"] = name in ("moon", "earth")                 # Ay/Dunya secilince 2D harita (T: kure/harita)
    h["goal"] = {"c": list(p["c"]), "yaw": p["yaw"], "pitch": p["pitch"], "dist": p["dist"]}


def _hub_apply(cam, dt):
    h = S["hub"]
    c, g = h["cur"], h["goal"]
    k = 1.0 - math.exp(-dt * 5.0)
    for i in range(3):
        c["c"][i] += (g["c"][i] - c["c"][i]) * k
    dy = (g["yaw"] - c["yaw"] + 180.0) % 360.0 - 180.0
    c["yaw"] += dy * k
    c["pitch"] += (g["pitch"] - c["pitch"]) * k
    c["dist"] += (g["dist"] - c["dist"]) * k
    y, p = math.radians(c["yaw"]), math.radians(c["pitch"])
    pos = unreal.Vector(c["c"][0] + c["dist"] * math.cos(p) * math.cos(y), c["c"][1] + c["dist"] * math.cos(p) * math.sin(y), c["c"][2] + c["dist"] * math.sin(p))
    tgt = unreal.Vector(*c["c"])
    fr_ = S.get("ui_frac", 0.0)
    if fr_ > 0:                                            # nesne, sagdaki web seridi hariç serbest alanin ortasinda dursun
        f = _norm((tgt.x - pos.x, tgt.y - pos.y, tgt.z - pos.z))
        right = _norm((-f[1], f[0], 0.0))
        s_ = fr_ * c["dist"] * 0.48
        pos = unreal.Vector(pos.x + right[0] * s_, pos.y + right[1] * s_, pos.z)
        tgt = unreal.Vector(tgt.x + right[0] * s_, tgt.y + right[1] * s_, tgt.z)
    cam.set_actor_location(pos, False, False)
    cam.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(pos, tgt), False)
    return pos


def _sphere_hit(pc, center, radius, cam_pos, mx, my):
    sp = _project(pc, center)
    if sp is None:
        return None
    f = _norm((center.x - cam_pos.x, center.y - cam_pos.y, center.z - cam_pos.z))
    right = _norm((f[1], -f[0], 0.0))                      # kameranin sagi (Z yukari varsayimi)
    edge = _project(pc, unreal.Vector(center.x + right[0] * radius, center.y + right[1] * radius, center.z + right[2] * radius))
    r_px = math.hypot(edge[0] - sp[0], edge[1] - sp[1]) if edge else 20.0
    d = math.hypot(sp[0] - mx, sp[1] - my)
    return d if d <= max(r_px, 22.0) else None


def _hover_markers(pc, sites, body_center, radius, cam_pos, mx, my):
    best, hover = HOVER_PX, None
    for s in sites:
        head = S["actors"].get("MarkerHead_" + s["id"])
        if head is None:
            continue
        hl = head.get_actor_location()
        n = _norm((hl.x - body_center[0], hl.y - body_center[1], hl.z - body_center[2]))
        v = _norm((cam_pos.x - body_center[0], cam_pos.y - body_center[1], cam_pos.z - body_center[2]))
        if n[0] * v[0] + n[1] * v[1] + n[2] * v[2] <= 0.15:        # kurenin arkasinda
            continue
        sp = _project(pc, hl)
        if sp is None:
            continue
        d = math.hypot(sp[0] - mx, sp[1] - my)
        if d < best:
            best, hover = d, s
    return hover


def _apply_hover_scale(sites, hover, dt):
    """Vurgu: imlecin altindaki isaretcinin basi yumusakca buyur (metin yok)."""
    for s in sites:
        for pref in ("MarkerHead_",):
            a = S["actors"].get(pref + s["id"])
            if a is None:
                continue
            base = S["base_scale"].setdefault(s["id"], a.get_actor_scale3d())
            tgt = 1.9 if (hover is not None and hover["id"] == s["id"]) else 1.0
            cur = S["hover_f"].get(s["id"], 1.0)
            cur += (tgt - cur) * (1.0 - math.exp(-dt * 12.0))
            S["hover_f"][s["id"]] = cur
            a.set_actor_scale3d(unreal.Vector(base.x * cur, base.y * cur, base.z * cur))


# ---------------- dunya baslatma ----------------
def _init_world(world, pc):
    S["world_path"] = world.get_path_name()
    S["actors"] = _by_label(world)
    S["press"] = None
    S["sky_mid"], S["sky_key"], S["dish"] = {}, None, None
    unreal.SystemLibrary.execute_console_command(world, "r.Shadow.Virtual.AllowScreenOverflowMessages 0")
    S.pop("ath_base", None)
    S["orb"], S["orb_last"] = None, None
    S["hover_f"] = {}
    S["base_scale"] = {}
    for step, fn in (
        ("imlec", lambda: pc.set_editor_property("show_mouse_cursor", True)),
        ("tiklama olaylari", lambda: pc.set_editor_property("enable_click_events", True)),
        ("input modu", lambda: unreal.WidgetLibrary.set_input_mode_game_and_ui_ex(pc, None, unreal.MouseLockMode.DO_NOT_LOCK, False, False)),
        ("fare yakalama", lambda: unreal.GameplayStatics.set_viewport_mouse_capture_mode(world, unreal.MouseCaptureMode.CAPTURE_DURING_MOUSE_DOWN)),
    ):
        try:
            fn()
        except Exception as e:       # noqa: BLE001
            unreal.log_warning("feza_runtime: %s ayarlanamadi: %s" % (step, e))
    name = world.get_name()
    if name == "Orbit":
        goal = S["next_focus"] or "overview"
        S["next_focus"] = None
        _hub_enter("overview", goal)
        cam = S["actors"].get("Cam_Orbit")
    else:
        S["site_cam"] = "Cam_Ground"
        cam = S["actors"].get("Cam_Ground")
    if cam is not None:
        _view(pc, cam)
    _ui_attach(world)
    unreal.log("feza_runtime: dunya hazir: %s | aktor: %d | kamera: %s" % (name, len(S["actors"]), cam.get_actor_label() if cam else None))


# ---------------- yorunge sahnesi ----------------
def _layout_hit(cx, cy, mapmode):
    """Sayfanin bildirdigi kart/nokta/dugme dikdortgenleri icinde fare var mi. Doner: (kart kimligi | None, dugme ustunde mi)."""
    best = None
    lay = S.get("layout") or {}
    k = lay.get("kx", 1.0)
    cx, cy = cx * k, cy * k                                  # fare (Slate birimi) -> sayfa CSS pikseli
    for r in lay.get("r", []):
        if r["id"] == "toggle":
            if r["x"] - 3 <= cx <= r["x"] + r["w"] + 3 and r["y"] - 3 <= cy <= r["y"] + r["h"] + 3:
                return (None, True)
            continue
        if not mapmode:
            continue
        in_card = r["x"] <= cx <= r["x"] + r["w"] and r["y"] <= cy <= r["y"] + r["h"]
        d = math.hypot(cx - r["dx"], cy - r["dy"])
        if in_card or d <= 15.0:
            if best is None or d < best[1]:
                best = (r["id"], d)
    return (best[0] if best else None, False)



def _tick_orbit(world, pc, dt):
    cam = S["actors"].get("Cam_Orbit")
    if cam is None or S["hub"] is None:
        return
    h = S["hub"]
    P = _preset(h["focus"])
    mx, my = _mouse(pc)
    over_ui = _over_ui(world, mx)
    try:
        vs_ = unreal.WidgetLayoutLibrary.get_viewport_size(world)
        S["ui_frac"] = (UI_WIDTH * _scale(world) / vs_.x) if (S.get("ui") and vs_.x > 0) else 0.0
    except Exception:        # noqa: BLE001
        S["ui_frac"] = 0.0
    last = S.get("last_mouse") or (mx, my)
    dx, dy = mx - last[0], my - last[1]                    # imlec kilitli degil: eksen girdisi yerine konum farki
    S["last_mouse"] = (mx, my)
    if pc.was_input_key_just_pressed(K_LMB):
        S["drag"] = not over_ui
        if S["drag"]:
            try:
                unreal.WidgetLibrary.set_focus_to_game_viewport()      # tuslar (Backspace, Tab) oyuna gitsin
            except Exception:        # noqa: BLE001
                pass
    if not pc.is_input_key_down(K_LMB):
        S["drag"] = False
    if S.get("drag"):
        h["goal"]["yaw"] -= dx * 0.30
        h["goal"]["pitch"] = max(-85.0, min(85.0, h["goal"]["pitch"] - dy * 0.30))
    if not over_ui and pc.was_input_key_just_pressed(K_WU):
        h["goal"]["dist"] = max(P["dmin"], h["goal"]["dist"] * 0.88)
    if not over_ui and pc.was_input_key_just_pressed(K_WD):
        h["goal"]["dist"] = min(P["dmax"], h["goal"]["dist"] * 1.14)
    pos = _hub_apply(cam, dt)

    if S["press"] is None and S.get("drag") and pc.was_input_key_just_pressed(K_LMB):
        S["press"] = (mx, my)
    focus = h["focus"]
    sites = SITES if focus == "moon" else (STATIONS if focus == "earth" else [])
    body_c = MOON_POS if focus == "moon" else (0.0, 0.0, 0.0)
    body_r = R_M if focus == "moon" else R_E
    mapmode = bool(S.get("map")) and focus in ("moon", "earth")
    lay_hit, tgl_hit = (None, False)
    if focus in ("moon", "earth") and not over_ui:
        try:
            lay_w = (S.get("layout") or {}).get("W") or 0
            S.setdefault("layout", {})["kx"] = (lay_w / unreal.WidgetLayoutLibrary.get_viewport_size(world).x) if lay_w else 1.0
        except Exception:        # noqa: BLE001
            pass
        lay_hit, tgl_hit = _layout_hit(mx, my, mapmode)
    S["toggle_hot"] = tgl_hit
    hover = _hover_markers(pc, sites, body_c, body_r, pos, mx, my) if (sites and not mapmode) else None
    if mapmode:
        S["hover_id"] = lay_hit
    _apply_hover_scale(SITES + STATIONS, hover, dt)

    if pc.was_input_key_just_released(K_LMB):
        moved = math.hypot(mx - S["press"][0], my - S["press"][1]) if S["press"] else 999.0
        S["press"] = None
        if moved < CLICK_PX and focus in ("moon", "earth") and not over_ui and (tgl_hit or (mapmode and lay_hit)):
            if tgl_hit:
                S["map"] = not S.get("map")
            elif lay_hit.startswith("sat:"):
                _hub_focus(lay_hit)
            else:
                site = next((q for q in SITES + STATIONS if q["id"] == lay_hit), None)
                if site:
                    _goto_site(world, site)
                    return
        elif moved < CLICK_PX and not mapmode:
            if hover:
                _goto_site(world, hover)
                return
            if focus in ("overview", "earth"):
                hit_sat = None
                for sn, sa in _sats():                          # uydu Dunya'nin onunde: once uydu
                    d = _sphere_hit(pc, sa.get_actor_location(), SAT_R, pos, mx, my)
                    if d is not None and (hit_sat is None or d < hit_sat[1]):
                        hit_sat = (sn, d)
                if hit_sat:
                    _hub_focus("sat:" + hit_sat[0])
                elif focus == "overview":
                    moon, earth = S["actors"].get("Moon"), S["actors"].get("Earth")
                    dm = _sphere_hit(pc, moon.get_actor_location(), R_M, pos, mx, my) if moon else None
                    de = _sphere_hit(pc, earth.get_actor_location(), R_E, pos, mx, my) if earth else None
                    if dm is not None and (de is None or dm <= de):
                        _hub_focus("moon")
                    elif de is not None:
                        _hub_focus("earth")
    if S["force_focus"]:
        _hub_focus(S["force_focus"])
        S["force_focus"] = None
    if S["force_go"]:
        site = next((s for s in SITES + STATIONS if s["id"] == S["force_go"]), None)
        S["force_go"] = None
        if site:
            _open(world, site["level"])
            return
    if _pressed(pc, K_BACK) or _pressed(pc, K_RMB):
        if focus != "overview":
            _hub_focus("overview")
    elif _pressed(pc, K_T) and focus in ("moon", "earth"):
        S["map"] = not S.get("map")
    elif _pressed(pc, K_TAB):
        _hub_focus("earth" if focus == "moon" else "moon")
    elif _pressed(pc, K_M):
        _hub_focus("moon")
    elif _pressed(pc, K_E):
        _hub_focus("earth")


# ---------------- Ay sahasi / DSN istasyonu ----------------
def _lander_pivot():
    base = S.get("ath_base")
    loc = None
    if base:
        loc = next(iter(base.values()))[0]
    else:
        a = next((x for lab, x in S["actors"].items() if lab.startswith("Athena_")), None)
        loc = a.get_actor_location() if a is not None else None
    return None if loc is None else unreal.Vector(loc.x, loc.y, loc.z + 150.0)


def _orbit_lander(world, pc):
    """Sag fare tusu surukle: kamera lander'in etrafinda doner (azimut/yukseklik), tekerlek: yakinlas/uzaklas."""
    cam = S["actors"].get("Cam_Lander")
    piv = _lander_pivot()
    if cam is None or piv is None:
        return
    mx, my = _mouse(pc)
    last = S.get("orb_last") or (mx, my)
    S["orb_last"] = (mx, my)
    over = _over_ui(world, mx)
    o = S.get("orb")
    if o is None:
        c = cam.get_actor_location()
        v = (c.x - piv.x, c.y - piv.y, c.z - piv.z)
        r = math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2) or 1000.0
        o = S["orb"] = {"az": math.degrees(math.atan2(v[1], v[0])), "el": math.degrees(math.asin(v[2] / r)), "r": r}
    moved = False
    if pc.is_input_key_down(K_RMB) and not over:
        if S["site_cam"] != "Cam_Lander":
            S["site_cam"] = "Cam_Lander"
            _view(pc, cam)
        o["az"] -= (mx - last[0]) * 0.35
        o["el"] = max(2.0, min(70.0, o["el"] + (my - last[1]) * 0.2))
        moved = True
    if S["site_cam"] == "Cam_Lander" and not over:
        if pc.was_input_key_just_pressed(K_WU):
            o["r"] = max(300.0, o["r"] * 0.85)
            moved = True
        if pc.was_input_key_just_pressed(K_WD):
            o["r"] = min(6000.0, o["r"] * 1.18)
            moved = True
    if moved:
        a, e = math.radians(o["az"]), math.radians(o["el"])
        loc = unreal.Vector(piv.x + o["r"] * math.cos(e) * math.cos(a), piv.y + o["r"] * math.cos(e) * math.sin(a), piv.z + o["r"] * math.sin(e))
        cam.set_actor_location(loc, False, False)
        cam.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(loc, piv), False)


def _tick_scene(world, pc):
    name = world.get_name()
    station = name.startswith("Station_")
    cams = {"Cam_Ground": K_1, "Cam_Overview": K_2, "Cam_Close": K_3}
    cams.update({"Cam_Moon": K_4, "Cam_MoonZoom": K_5} if station else {"Cam_Earth": K_4, "Cam_Sun": K_5, "Cam_Lander": K_6})
    for cname, k in cams.items():
        if _pressed(pc, k) and cname in S["actors"]:
            S["site_cam"] = cname
            _view(pc, S["actors"][cname])
    _dish_step(max(0.0, min(0.1, S.pop("dish_dt", 0.016))))
    if not station:
        _orbit_lander(world, pc)
    cam = S["actors"].get(S["site_cam"])
    if cam is not None and pc.is_input_key_down(K_LMB):
        dx, dy = _delta(pc)
        r = cam.get_actor_rotation()
        zoomed = S["site_cam"] == "Cam_MoonZoom"
        r.yaw += dx * (0.02 if zoomed else 0.15)
        r.pitch = max(-85.0, min(85.0, r.pitch + dy * (0.02 if zoomed else 0.15)))
        cam.set_actor_rotation(r, False)
    back = "earth" if station else "moon"
    if _pressed(pc, K_BACK) or S["force_go"] == "BACK":
        S["force_go"] = None
        S["next_focus"] = back
        _open(world, ORBIT_LEVEL)
    elif _pressed(pc, K_M):
        S["next_focus"] = "moon"
        _open(world, ORBIT_LEVEL)
    elif _pressed(pc, K_E):
        S["next_focus"] = "earth"
        _open(world, ORBIT_LEVEL)


# ---------------- gokyuzu senkronu (uygulamada secilen saha + zaman) ----------------
SKY_URL = os.environ.get("FEZA_SKY_URL", "http://127.0.0.1:5198/sky")
SITE_BY_ID = {x["id"]: x for x in SITES}
SKY_D = 2.0e8
SUN_LUX = 120000.0


def _azel(az, el):
    a, e = math.radians(az), math.radians(el)
    return unreal.Vector(math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e))


def _ui_param(url, key):
    try:
        return urllib.parse.parse_qs(urllib.parse.urlparse(url).query).get(key, [None])[0]
    except Exception:        # noqa: BLE001
        return None


def _mid(actor):
    m = S["sky_mid"].get(actor.get_actor_label())
    if m is None:
        m = actor.static_mesh_component.create_dynamic_material_instance(0)
        S["sky_mid"][actor.get_actor_label()] = m
    return m


HZ_FILES = {"mons-mouton": "mons-mouton-im2-target"}              # katalog kimligi -> ufuk dosyasi adi
_HZ = {}


def _horizon_profile(sid, mast):
    """Ekibin ufuk profili (data/horizons, salt okunur kopya: data/unreal/horizons_team). Yalniz 2 m ve 10 m direk ve profili olan sahalar; yoksa None = duz ufuk (Varsayim)."""
    m = int(round(mast)) if mast is not None else None
    if m not in (2, 10):
        return None
    key = (sid, m)
    if key not in _HZ:
        try:
            d = json.load(open(ROOT + "/data/unreal/horizons_team/%s_%dm.json" % (HZ_FILES.get(sid, sid), m), encoding="utf-8"))
            _HZ[key] = (d["horizon_deg"], float(d.get("azimuth_step_deg", 0.5)))
        except Exception:        # noqa: BLE001
            _HZ[key] = None
    return _HZ[key]


def _horizon_at(prof, az):
    if prof is None:
        return 0.0
    arr, step = prof
    x = (az % 360.0) / step
    i = int(x) % len(arr)
    f = x - int(x)
    return arr[i] * (1.0 - f) + arr[(i + 1) % len(arr)] * f


def _sky_apply(world, sid, iso, mast=None):
    """Gunes, Dunya (evre + yonelim), Gunes diski, iletisim hatti ve devrilmis lander'i secilen saha/ana gore ayarlar."""
    site = SITE_BY_ID.get(sid)
    A = S["actors"]
    if site is None or "Stars" not in A:
        return
    try:
        q = urllib.parse.urlencode({"lat": site["lat_deg"], "lon": site["lon_deg"], "t": iso})
        with urllib.request.urlopen(SKY_URL + "?" + q, timeout=1.5) as r:
            d = json.loads(r.read().decode())
        if "error" in d:
            raise RuntimeError(d["error"])
    except Exception as e:        # noqa: BLE001
        if S.get("sky_err") != str(e):
            S["sky_err"] = str(e)
            _ui_log("gokyuzu servisi yok (%s): sahne sabit kalir" % e)
        return
    g = A["Stars"].get_actor_location()
    sn, ea = d["sun"], d["earth"]
    S["sun_az"] = sn["az_deg"]
    sdir = _azel(sn["az_deg"], sn["el_deg"])
    prof = _horizon_profile(sid, mast)
    h_sun, h_earth = _horizon_at(prof, sn["az_deg"]), _horizon_at(prof, ea["az_deg"])      # ufuk acisi (profil yoksa 0)
    sun_up = sn["el_deg"] > h_sun - 0.27
    earth_up = ea["el_deg"] > h_earth - ea["ang_radius_deg"]
    if mast is not None:                                                     # kameralar direk yuksekliginde
        for cn in ("Cam_Ground", "Cam_Earth", "Cam_Sun"):
            c = A.get(cn)
            if c is not None:
                cl = c.get_actor_location()
                c.set_actor_location(unreal.Vector(cl.x, cl.y, g.z + 30.0 + 100.0 * mast), False, False)
    for lab in ("SunDisc",):
        a = A.get(lab)
        if a is not None:
            dd = sdir
            a.set_actor_location(unreal.Vector(g.x + dd.x * SKY_D, g.y + dd.y * SKY_D, g.z + dd.z * SKY_D), False, False)
            a.set_actor_hidden_in_game(not sun_up)
    ed = _azel(ea["az_deg"], ea["el_deg"])
    rot = unreal.MathLibrary.make_rot_from_xz(unreal.Vector(*ea["axis_x"]), unreal.Vector(*ea["axis_z"]))
    sc = SKY_D * math.tan(math.radians(ea["ang_radius_deg"])) / 100.0
    for lab, k in (("Earth", 1.0), ("EarthClouds", 1.004), ("EarthAtmosphere", 1.04)):
        a = A.get(lab)
        if a is None:
            continue
        a.set_actor_location(unreal.Vector(g.x + ed.x * SKY_D, g.y + ed.y * SKY_D, g.z + ed.z * SKY_D), False, False)
        a.set_actor_scale3d(unreal.Vector(sc * k, sc * k, sc * k))
        if lab != "EarthAtmosphere":
            a.set_actor_rotation(rot, False)
        a.set_actor_hidden_in_game(not earth_up)
        if lab != "EarthClouds":
            _mid(a).set_vector_parameter_value("SunDir", unreal.LinearColor(sdir.x, sdir.y, sdir.z, 0.0))
    if "Stars" in A:
        _mid(A["Stars"]).set_vector_parameter_value("SunDir", unreal.LinearColor(sdir.x, sdir.y, sdir.z, 0.0))
    light = A.get("Sun")
    if light is not None:
        far = unreal.Vector(sdir.x * 1e8, sdir.y * 1e8, sdir.z * 1e8)
        light.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(far, unreal.Vector(0, 0, 0)), False)
        lc = light.get_component_by_class(unreal.DirectionalLightComponent)
        k = max(0.0, min(1.0, (sn["el_deg"] - h_sun + 0.27) / 2.0))          # ufukta yumusak sonme
        try:
            lc.set_intensity(SUN_LUX * k)
        except Exception:        # noqa: BLE001
            lc.set_editor_property("intensity", SUN_LUX * k)
    for cn, dd in (("Cam_Earth", ed), ("Cam_Sun", sdir)):        # 4/5 tuslari kameralari yeni yonlere cevirir
        c = A.get(cn)
        if c is not None:
            cl = c.get_actor_location()
            c.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(cl, unreal.Vector(cl.x + dd.x * 1000, cl.y + dd.y * 1000, cl.z + dd.z * 1000)), False)
    # lander: devrilmis gorevlerde yan yatir
    ath = [a for lab, a in A.items() if lab.startswith("Athena_")]
    if ath:
        if "ath_base" not in S:
            S["ath_base"] = {a.get_actor_label(): (a.get_actor_location(), a.get_actor_rotation()) for a in ath}
        tipped = TIP_ON and site.get("status") == "TIPPED OVER"
        for a in ath:
            l0, r0 = S["ath_base"][a.get_actor_label()]
            if tipped:
                a.set_actor_rotation(unreal.Rotator(roll=TIP_ROLL, pitch=0.0, yaw=r0.yaw), False)
                a.set_actor_location(unreal.Vector(l0.x, l0.y, l0.z + TIP_LIFT), False, False)
            else:
                a.set_actor_rotation(r0, False)
                a.set_actor_location(l0, False, False)
        lp = S["ath_base"][ath[0].get_actor_label()][0]
        link = A.get("CommLink")
        if link is not None:
            show = earth_up and ea["el_deg"] > max(1.0, h_earth)
            link.set_actor_hidden_in_game(not show)
            if show:
                st = unreal.Vector(lp.x, lp.y, lp.z + (80.0 if tipped else 380.0))
                mid = unreal.Vector(st.x + ed.x * LINK_LEN / 2, st.y + ed.y * LINK_LEN / 2, st.z + ed.z * LINK_LEN / 2)
                link.set_actor_location(mid, False, False)
                link.set_actor_rotation(unreal.MathLibrary.make_rot_from_z(ed), False)
                link.set_actor_scale3d(unreal.Vector(LINK_R / 50.0, LINK_R / 50.0, LINK_LEN / 100.0))
    _ui_log("gokyuzu: %s %s direk %s | gunes el %.1f (ufuk %.2f, %s) | dunya el %.1f (ufuk %.2f) evre %.2f | durum %s" % (
        sid, iso, mast, sn["el_deg"], h_sun, "arazi" if prof else "duz", ea["el_deg"], h_earth, ea["phase"], site.get("status")))


TIP_ON = False                                         # lander her gorevde dik (devrilme gorseli kapali)
TIP_ROLL, TIP_LIFT, LINK_LEN, LINK_R = 78.0, 60.0, 30000.0, 0.7


STATION_BY_ID = {x["id"]: x for x in STATIONS}
MOON_D = 6.0e5


def _dish_pick(az_p, el_p, dish, tgt):
    """Canak 'yukari' ekseni hedefe en iyi baktigi (isaret, azimut) cifti (ue_build_stations.assemble_dsn ile ayni arama)."""
    best = (-2.0, (1.0, 0.0))
    maz = math.degrees(math.atan2(tgt[1], tgt[0]))
    mel = math.degrees(math.asin(max(-1.0, min(1.0, tgt[2]))))
    for sg in (1.0, -1.0):
        for yaw0 in (maz - 90.0, maz + 90.0):
            el_p.root_component.set_editor_property("relative_rotation", unreal.Rotator(roll=sg * (90.0 - mel), pitch=0.0, yaw=0.0))
            az_p.set_actor_rotation(unreal.Rotator(roll=0.0, pitch=0.0, yaw=yaw0), False)
            up = dish.get_actor_up_vector()
            d = up.x * tgt[0] + up.y * tgt[1] + up.z * tgt[2]
            if d > best[0]:
                best = (d, (sg, yaw0))
    return best[1], mel


def _station_apply(world, iso):
    """DSN sahnesi: secilen ana gore Gunes, Ay (konum/evre/yonelim) ve canagin Aya donusu."""
    st = STATION_BY_ID.get("dsn-" + world.get_name().split("_", 1)[1].lower())
    A = S["actors"]
    if st is None:
        return
    try:
        q = urllib.parse.urlencode({"lat": st["lat_deg"], "lon": st["lon_deg"], "alt": st.get("alt_m", 0), "t": iso})
        with urllib.request.urlopen(SKY_URL.replace("/sky", "/station") + "?" + q, timeout=1.5) as r:
            d = json.loads(r.read().decode())
        if "error" in d:
            raise RuntimeError(d["error"])
    except Exception as e:        # noqa: BLE001
        if S.get("sky_err") != str(e):
            S["sky_err"] = str(e)
            _ui_log("gokyuzu servisi yok (%s): istasyon sahnesi sabit kalir" % e)
        return
    sn, mo = d["sun"], d["moon"]
    sdir = _azel(sn["az_deg"], sn["el_deg"])
    light = A.get("Sun")
    if light is not None:
        far = unreal.Vector(sdir.x * 1e8, sdir.y * 1e8, sdir.z * 1e8)
        light.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(far, unreal.Vector(0, 0, 0)), False)
        lc = light.get_component_by_class(unreal.DirectionalLightComponent)
        # Ay'in evresi bu isiktan geldigi icin Gunes ufkun altindayken de acik kalir (zemin zaten kendini golgeler)
        try:
            lc.set_intensity(100000.0)
        except Exception:        # noqa: BLE001
            lc.set_editor_property("intensity", 100000.0)
        try:
            lc.set_editor_property("cast_shadows", sn["el_deg"] > -0.27)        # ufkun altindayken zemin, Ay'a giden isigi golgelemesin
        except Exception:        # noqa: BLE001
            pass
    g = st["ground_center_cm"]
    md = _azel(mo["az_deg"], mo["el_deg"])
    m = A.get("Moon")
    if m is not None:
        m.set_actor_location(unreal.Vector(g[0] + md.x * MOON_D, g[1] + md.y * MOON_D, g[2] + md.z * MOON_D), False, False)
        sc = MOON_D * math.tan(math.radians(mo["ang_radius_deg"])) / 100.0
        m.set_actor_scale3d(unreal.Vector(sc, sc, sc))
        m.set_actor_rotation(unreal.MathLibrary.make_rot_from_xz(unreal.Vector(*mo["axis_x"]), unreal.Vector(*mo["axis_z"])), False)
        m.set_actor_hidden_in_game(mo["el_deg"] < -mo["ang_radius_deg"])
    for cn in ("Cam_Moon", "Cam_MoonZoom"):                       # 4/5 tuslari Ay'in yeni yonune bakar
        c = A.get(cn)
        if c is not None:
            cl = c.get_actor_location()
            c.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(cl, unreal.Vector(g[0] + md.x * MOON_D, g[1] + md.y * MOON_D, g[2] + md.z * MOON_D)), False)
    az_p, el_p = A.get("DSN_AzimuthPivot"), A.get("DSN_ElevationPivot")
    dish = next((a for lab, a in A.items() if lab.lower() in ("dsn_dish",)), None)
    if az_p is not None and el_p is not None and dish is not None:
        cur_roll = el_p.root_component.get_editor_property("relative_rotation").roll
        cur_yaw = az_p.get_actor_rotation().yaw
        tgt = _norm((md.x, md.y, max(md.z, 0.17)))                  # Ay ufkun altindaysa canak ufka yakin park eder
        (sg, yaw0), mel = _dish_pick(az_p, el_p, dish, tgt)
        el_p.root_component.set_editor_property("relative_rotation", unreal.Rotator(roll=cur_roll, pitch=0.0, yaw=0.0))   # adaylar denendi: gercek konuma don
        az_p.set_actor_rotation(unreal.Rotator(roll=0.0, pitch=0.0, yaw=cur_yaw), False)
        S["dish"] = {"az": az_p, "el": el_p, "roll": cur_roll, "yaw": cur_yaw, "g_roll": sg * (90.0 - mel), "g_yaw": yaw0, "t": None}
    _ui_log("istasyon gokyuzu: %s %s | gunes el %.1f | ay el %.1f aydinlik %.2f" % (st["id"], iso, sn["el_deg"], mo["el_deg"], mo["illum"]))


def _dish_step(dt):
    """Canak hedefe yumusak doner (en fazla ~12 derece/sn)."""
    d = S.get("dish")
    if not d:
        return
    step = 12.0 * dt
    dy = (d["g_yaw"] - d["yaw"] + 180.0) % 360.0 - 180.0
    dr = d["g_roll"] - d["roll"]
    d["yaw"] += max(-step, min(step, dy))
    d["roll"] += max(-step, min(step, dr))
    try:
        d["el"].root_component.set_editor_property("relative_rotation", unreal.Rotator(roll=d["roll"], pitch=0.0, yaw=0.0))
        d["az"].set_actor_rotation(unreal.Rotator(roll=0.0, pitch=0.0, yaw=d["yaw"]), False)
    except Exception:        # noqa: BLE001
        S["dish"] = None
    if abs(dy) < 0.05 and abs(dr) < 0.05:
        S["dish"] = None


def _sky_poll(world, url):
    if world.get_name().startswith("Station_"):
        t = _ui_param(url, "t") or _ui_param(url, "start")
        if t and S.get("sky_key") != ("st", t) and S["frame_n"] - S.get("sky_last", -999) > 20:
            S["sky_key"], S["sky_last"] = ("st", t), S["frame_n"]
            _station_apply(world, t)
        return
    if not world.get_name().startswith("Site_"):
        return
    sid, t = _ui_param(url, "site"), _ui_param(url, "t") or _ui_param(url, "start")
    if not sid or not t:
        return
    try:
        mast = float(_ui_param(url, "mast")) if _ui_param(url, "mast") is not None else None
    except ValueError:
        mast = None
    key = (sid, t, mast)
    if S.get("sky_key") != key and S["frame_n"] - S.get("sky_last", -999) > 20:
        S["sky_key"], S["sky_last"] = key, S["frame_n"]
        _sky_apply(world, sid, t, mast)


# ---------------- web arayuzu ----------------
def _ui_site(url):
    try:
        return urllib.parse.parse_qs(urllib.parse.urlparse(url).query).get("site", [None])[0]
    except Exception:        # noqa: BLE001
        return None


def _overlay_console(m, src, ln):
    if str(m).startswith("LAY|"):
        try:
            S["layout"] = json.loads(str(m)[4:])        # {"W","H","r":[...]} sayfa CSS pikseli
        except Exception:        # noqa: BLE001
            pass
        return
    _ui_log("[overlay js] %s (%s:%s)" % (m, src, ln))


def _ui_attach(world):
    S["ui"] = None
    if not UI_ENABLED:
        return
    host = S["actors"].get("UIHost")
    if host is None:
        _ui_log("%s: UIHost yok" % world.get_name())
        return
    try:
        shell = host.get_editor_property("Shell")
        browser = shell.get_editor_property("Browser") if shell else None
    except Exception as e:        # noqa: BLE001
        _ui_log("%s: Shell/Browser okunamadi: %s" % (world.get_name(), e))
        return
    if browser is None:
        _ui_log("%s: Browser bos" % world.get_name())
        return
    url = S.get("ui_url") or UI_URL
    browser.load_url(url)
    S["ui_site"] = _ui_site(url)                           # yeni seviyede ayni sahaya tekrar gecme
    overlay = None
    try:                                                   # ikinci tarayici: ana tarayicinin kardesi (Canvas'in diger WebBrowser'i)
        for ch in browser.get_parent().get_all_children():
            if ch.get_name() != browser.get_name() and isinstance(ch, unreal.WebBrowser):
                overlay = ch
        if overlay is not None:
            overlay.load_url(UI_URL.split("?")[0].rstrip("/") + "/" + LABELS_PATH)
            try:
                overlay.on_console_message.add_callable(_overlay_console)
            except Exception as e2:        # noqa: BLE001
                _ui_log("konsol baglanamadi: %s" % e2)
    except Exception as e:        # noqa: BLE001
        _ui_log("overlay bulunamadi: %s" % e)
    try:
        browser.on_console_message.add_callable(_main_console)
    except Exception as e3:        # noqa: BLE001
        _ui_log("ana tarayici konsolu baglanamadi: %s" % e3)
    S["ui_lock"] = 0
    S["ui"] = {"b": browser, "o": overlay, "f": 0}
    _ui_log("overlay: %s" % overlay)
    _ui_log("%s: arayuz yuklendi (%s)" % (world.get_name(), url))


def _ui_goto(world, site):
    level = CATALOG.get(site)
    _ui_log("saha secildi: %s -> %s" % (site, level))
    if not level:
        return
    if world.get_name() == "Orbit":
        _hub_focus("moon")
        S["ui_pending"] = [level, 100]
    elif world.get_path_name().split(".")[0] != level:
        _open(world, level)


def _ui_tick(world):
    u = S.get("ui")
    if not u:
        return
    u["f"] += 1
    f = u["f"]
    if f in (240, 420, 600, 900):                          # acilis ekrani varsa gec (yoksa zararsiz)
        try:
            _ui_log("giris: %s" % u["b"].execute_javascript(JS_ENTER))
        except Exception as e:        # noqa: BLE001
            _ui_log("giris hata: %s" % e)
    if f % 15 == 0:
        try:
            url = u["b"].get_url()
        except Exception as e:        # noqa: BLE001
            _ui_log("get_url hata: %s" % e)
            return
        if S.get("ui_lock", 0) > 0:                        # sahne gecisi suruyor: hedef senaryo adresi korunur (yeni seviyede yuklenir)
            S["ui_lock"] -= 15
            return
        if url and url != "about:blank":
            S["ui_url"] = url
            S["frame_n"] = S.get("frame_n", 0) + 15
            _sky_poll(world, url)
            site = _ui_site(url)
            if site and site != S.get("ui_site"):
                S["ui_site"] = site
                _ui_goto(world, site)
    if u.get("o") is not None and f % 2 == 0:
        _labels_push(world, u["o"])
    pend = S.get("ui_pending")
    if pend:
        pend[1] -= 1
        if pend[1] <= 0:
            S["ui_pending"] = None
            _open(world, pend[0])


# ---------------- etiketler (modern, HTML/CSS katmani) ----------------
def _scale(world):
    try:
        return float(unreal.WidgetLayoutLibrary.get_viewport_scale(world)) or 1.0
    except Exception:        # noqa: BLE001
        return 1.0


def _scr(pc, sc, loc):
    p = _project(pc, loc)
    return None if p is None else (round(p[0] / sc, 1), round(p[1] / sc, 1))


def _screen_r(pc, center, radius, cam, sc):
    sp = _project(pc, center)
    if sp is None:
        return 0.0
    f = _norm((center.x - cam.x, center.y - cam.y, center.z - cam.z))
    right = _norm((f[1], -f[0], 0.0))
    e = _project(pc, unreal.Vector(center.x + right[0] * radius, center.y + right[1] * radius, center.z + right[2] * radius))
    return round((math.hypot(e[0] - sp[0], e[1] - sp[1]) if e else 20.0) / sc, 1)


def _fmt_ll(lat, lon):
    return "%.2f°%s  %.2f°%s" % (abs(lat), "N" if lat >= 0 else "S", abs(lon), "E" if lon >= 0 else "W")


STATION_INFO = {
    "dsn-goldstone": {"flag": "us", "sub": "Mojave Desert, USA", "info": "NASA Deep Space Network complex. 70 m antenna DSS-14 tracks deep-space and lunar missions."},
    "dsn-madrid": {"flag": "es", "sub": "Robledo de Chavela, Spain", "info": "NASA Deep Space Network complex near Madrid. 70 m antenna DSS-63 covers the European longitudes."},
    "dsn-canberra": {"flag": "au", "sub": "Tidbinbilla, Australia", "info": "NASA Deep Space Network complex near Canberra. 70 m antenna DSS-43 is the main southern-hemisphere station."},
}
SAT_INFO = {"TDRS-East": "Relay over the Atlantic. Links low-orbit spacecraft with the ground.", "TDRS-West": "Relay over the Pacific. Links low-orbit spacecraft with the ground.",
            "TDRS-Z": "Spare relay of the TDRS constellation."}
CAT_TR = {"apollo": "Apollo crewed landing", "international": "International mission", "commercial": "Commercial lander", "clps": "NASA CLPS commercial lander", "test": "Reference / test point"}


def _site_info(s):
    if s["id"] in STATION_INFO:
        return STATION_INFO[s["id"]]["info"]
    n = (s.get("notes") or "").strip()
    return n or (s.get("category") or "").title()


def _viewport_css(world, sc):
    vs = unreal.WidgetLayoutLibrary.get_viewport_size(world)
    return vs.x / sc, vs.y / sc


def _sat_lonlat():
    """TDRS uydularinin Dunya uzerindeki alt-uydu noktasi (Dunya aktorunun donusu uygulanir)."""
    earth = S["actors"].get("Earth")
    out = {}
    if earth is None:
        return out
    tf = earth.get_actor_transform()
    c = earth.get_actor_location()
    for sn, sa in _sats():
        p = sa.get_actor_location()
        v = unreal.MathLibrary.inverse_transform_direction(tf, unreal.Vector(p.x - c.x, p.y - c.y, p.z - c.z))
        n = _norm((v.x, v.y, v.z))
        out[sn] = (math.degrees(math.asin(max(-1.0, min(1.0, n[2])))), math.degrees(math.atan2(-n[1], n[0])))
    return out


def _map_payload(world, pc, sc, focus, hov):
    """2D harita gorunumu: tam kaplama panel + esit dikdortgen izdusum; ayni kartlar, tiklanabilir (yerlesim sayfadan LAY| ile gelir)."""
    items = []

    def add(i, title, sub, lat, lon, acc, chip, info="", meta="", flag="", coord=""):
        items.append({"id": i, "kind": "site", "lat": lat, "lon": lon, "x": 0, "y": 0, "cx": 0, "cy": 0, "title": title, "sub": sub, "coord": coord, "chip": chip, "accent": acc,
                      "hot": hov == i, "info": info, "meta": meta, "flag": flag})

    if focus == "moon":
        for s_ in SITES:
            add(s_["id"], s_["name"], CAT_TR.get(s_.get("category"), (s_.get("category") or "Site").title()), s_["lat_deg"], s_["lon_deg"], "moon", s_.get("status"),
                _site_info(s_), s_.get("validity") or "", "", _fmt_ll(s_["lat_deg"], s_["lon_deg"]))
        head = {"title": "MOON", "sub": "Catalogue landing sites. Select one to open its surface scene.", "accent": "moon"}
        img = "ue-maps/moon.jpg"
    else:
        for s_ in STATIONS:
            si = STATION_INFO.get(s_["id"], {})
            add(s_["id"], s_["name"], si.get("sub", ""), s_["lat_deg"], s_["lon_deg"], "earth", "DSN 70 m", si.get("info", ""), "", si.get("flag", ""), _fmt_ll(s_["lat_deg"], s_["lon_deg"]))
        for sn, (la, lo) in _sat_lonlat().items():
            add("sat:" + sn, sn.upper(), "Geostationary relay, %.0f°%s" % (abs(lo), "E" if lo >= 0 else "W"), 0.0, lo, "sat", "GEO", SAT_INFO.get(sn, ""), "", "", "")
        head = {"title": "EARTH", "sub": "Deep Space Network stations and TDRS relay satellites. Select one.", "accent": "earth"}
        img = "ue-maps/earth.jpg"
    return {"items": items, "head": head, "focus": focus, "map": {"img": img, "strip": UI_WIDTH if S.get("ui") else 0},
            "toggle": "T  ·  3D globe", "toggle_hot": S.get("toggle_hot", False)}


def _labels_payload(world, pc):
    h = S.get("hub")
    cam = S["actors"].get("Cam_Orbit")
    if h is None or cam is None:
        return {"items": []}
    cp = cam.get_actor_location()
    sc = _scale(world)
    focus = h["focus"]
    hov = S.get("hover_id")
    items, head = [], None
    if focus in ("moon", "earth") and S.get("map"):
        return _map_payload(world, pc, sc, focus, hov)

    def body(i, title, sub, loc, r_cm, acc, chip=None):
        c = _scr(pc, sc, loc)
        if c:
            items.append({"id": i, "kind": "body", "x": c[0], "y": c[1], "r": _screen_r(pc, loc, r_cm, cp, sc), "title": title, "sub": sub, "chip": chip, "accent": acc})

    def markers(sites, center, radius, acc, chip_of):
        cs = _scr(pc, sc, unreal.Vector(*center))
        for s in sites:
            a = S["actors"].get("MarkerHead_" + s["id"])
            if a is None:
                continue
            hl = a.get_actor_location()
            n = _norm((hl.x - center[0], hl.y - center[1], hl.z - center[2]))
            v = _norm((cp.x - center[0], cp.y - center[1], cp.z - center[2]))
            if n[0] * v[0] + n[1] * v[1] + n[2] * v[2] <= -0.05:
                continue
            c = _scr(pc, sc, hl)
            if c:
                items.append({"id": s["id"], "kind": "site", "x": c[0], "y": c[1], "cx": cs[0] if cs else c[0], "cy": cs[1] if cs else c[1],
                              "title": s["name"], "sub": STATION_INFO.get(s["id"], {}).get("sub") or CAT_TR.get(s.get("category"), (s.get("category") or "Site").title()), "coord": _fmt_ll(s["lat_deg"], s["lon_deg"]), "chip": chip_of(s), "accent": acc, "hot": hov == s["id"],
                              "info": _site_info(s), "meta": s.get("validity") or "", "flag": STATION_INFO.get(s["id"], {}).get("flag", "")})

    moon = S["actors"].get("Moon")
    earth = S["actors"].get("Earth")
    if focus == "overview":
        if moon:
            body("moon", "MOON", "Landing sites", moon.get_actor_location(), R_M, "moon", "%d SITES" % len(SITES))
        if earth:
            body("earth", "EARTH", "Ground stations and relays", earth.get_actor_location(), R_E, "earth", "DSN + TDRS")
        for sn, sa in _sats():
            body("sat:" + sn, sn.upper(), "Geostationary relay · 35,786 km", sa.get_actor_location(), SAT_R, "sat", "GEO")
    elif focus == "moon":
        head = {"title": "MOON", "sub": "Catalogue landing sites. Select one to open its surface scene.", "accent": "moon"}
        markers(SITES, MOON_POS, R_M, "moon", lambda s: s.get("status"))
    elif focus == "earth":
        head = {"title": "EARTH", "sub": "Deep Space Network stations and TDRS relay satellites.", "accent": "earth"}
        markers(STATIONS, (0.0, 0.0, 0.0), R_E, "earth", lambda s: "DSN 70 m")
        for sn, sa in _sats():
            body("sat:" + sn, sn.upper(), "Geostationary relay · 35,786 km", sa.get_actor_location(), SAT_R, "sat", "GEO")
    elif focus.startswith("sat:"):
        sa = S["actors"].get(focus[4:] + "_0")
        head = {"title": focus[4:].upper(), "sub": "Tracking and Data Relay Satellite. Geostationary orbit, 35 786 km. Relays the ground stations to spacecraft.", "accent": "sat"}
        if sa:
            body(focus, focus[4:].upper(), SAT_INFO.get(focus[4:], "Relay satellite"), sa.get_actor_location(), SAT_R, "sat", "GEO")
    out = {"items": items, "head": head, "focus": focus}
    if focus in ("moon", "earth"):
        out["toggle"], out["toggle_hot"] = "T  ·  2D map", S.get("toggle_hot", False)
    return out


def _labels_push(world, overlay):
    try:
        pc = unreal.GameplayStatics.get_player_controller(world, 0)
        data = _labels_payload(world, pc) if world.get_name() == "Orbit" else {"items": [], "head": None}
        S["last_items"] = data.get("items", [])
        key = (data.get("focus"), len(data["items"]))
        if S.get("label_key") != key:
            S["label_key"] = key
            if not data["items"]:
                a = S["actors"].get("Moon")
                raw = pc.project_world_location_to_screen(a.get_actor_location(), False) if a else None
                _ui_log("etiket TEŞHİS: moon=%s raw=%r hub=%s cam=%s sites=%d head0=%s" % (bool(a), raw, bool(S.get("hub")), bool(S["actors"].get("Cam_Orbit")), len(SITES), S["actors"].get("MarkerHead_" + SITES[0]["id"]) if SITES else None))
            _ui_log("etiket: odak=%s adet=%d ornek=%s" % (key[0], key[1], json.dumps(data["items"][:1])[:200]))
        overlay.execute_javascript("window.feza&&window.feza.set(" + json.dumps(data, separators=(",", ":")) + ")")
    except Exception as e:        # noqa: BLE001
        if S.get("label_err") != str(e):
            S["label_err"] = str(e)
            _ui_log("etiket hata: %s" % e)


def _demo_t():
    """Tanitim cekimi: data/scratch/demo_t.txt icindeki an (ISO UTC) senaryo zamani olur (hem Ay sahasi hem DSN gunduz/Ay yukarida)."""
    try:
        return open(ROOT + "/data/scratch/demo_t.txt", encoding="utf-8").read().strip() or None
    except OSError:
        return None


def _scenario_url(s):
    base = UI_URL.split("?")[0]
    dt = _demo_t()
    if dt:
        s = dict(s)
        t0 = datetime.datetime.strptime(dt, "%Y-%m-%dT%H:%M:%SZ")
        s["url_start"] = (t0 - datetime.timedelta(hours=22)).strftime("%Y-%m-%dT%H:%M:%SZ")
        s["url_end"] = (t0 + datetime.timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%SZ")
        s["_t"] = dt
    q = urllib.parse.urlencode({"sid": "ue", "label": s.get("full_name") or s["name"], "site": s["id"], "start": s["url_start"], "end": s["url_end"],
                                "mast": "2", "panel": "vertical_tracking", "t": s.get("_t") or s["url_start"]})
    return base + "?" + q


def _goto_site(world, s):
    """Unreal'de isaretciye tiklandi: web arayuzu de ayni sahaya (adres cubugu) tasinir, sahne acilir."""
    S["last_site"] = s["id"]
    if s.get("url_start"):
        S["ui_url"] = _scenario_url(s)
        S["ui_site"] = s["id"]
        S["ui_lock"] = 900
    elif s.get("utc"):                                 # DSN istasyonu: katalogda yok; web arayuzu son senaryoda kalir, yalniz an istasyonun aniyla degisir
        t0 = _demo_t() or s["utc"]
        base = urllib.parse.urlparse(S.get("ui_url") or UI_URL)
        q = urllib.parse.parse_qs(base.query)
        end = (datetime.datetime.strptime(t0, "%Y-%m-%dT%H:%M:%SZ") + datetime.timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%SZ")
        for k, v in (("t", t0), ("start", t0), ("end", end)):
            q[k] = [v]
        S["ui_url"] = urllib.parse.urlunparse(base._replace(query=urllib.parse.urlencode({k: v[0] for k, v in q.items()})))
        S["ui_lock"] = 900
    _open(world, s["level"])


def _tick(dt):
    try:
        world = _game_world()
        if world is None:
            S["world_path"] = None
            return
        pc = unreal.GameplayStatics.get_player_controller(world, 0)
        if pc is None:
            return
        if S["world_path"] != world.get_path_name():
            _init_world(world, pc)
        S["frames"] += 1
        name = world.get_name()
        if name == "Orbit":
            _tick_orbit(world, pc, max(dt, 1e-3))
        elif name.startswith(("Site_", "Station_")):
            S["dish_dt"] = dt
            _tick_scene(world, pc)
        _ui_tick(world)
        _demo_tick(world)
    except Exception as e:       # noqa: BLE001
        if S.get("last_err") != str(e):
            S["last_err"] = str(e)
            unreal.log_warning("feza_runtime hata: %s" % e)


# --- tanitim videosu cekimi (data/scratch/demo_on.txt varken): durum dosyasi + komut kanali ---
DEMO_ON = ROOT + "/data/scratch/demo_on.txt"
DEMO_STATE = ROOT + "/data/scratch/demo_state.json"
DEMO_CMD = ROOT + "/data/scratch/demo_cmd.txt"
POS_JS = ("(function(){var o={};function r(k,e){if(e){var b=e.getBoundingClientRect();o[k]=[b.left+b.width/2,b.top+b.height/2];}}"
          "var btn=[].slice.call(document.querySelectorAll('button'));function by(t){return btn.filter(function(e){return e.textContent.trim()===t;})[0];}"
          "r('play',by('Play'));r('apply',by('Apply scenario'));r('tpower',by('Power'));r('tcomms',by('Comms'));r('tcompare',by('Compare'));r('tsky',by('Sky'));r('analyze',by('Analyze'));r('cy3',by('Chandrayaan-3'));r('im2',by('IM-2 Athena'));r('m2',by('2 m'));r('m10',by('10 m'));r('m5',by('5 m'));o.W=innerWidth;o.H=innerHeight;console.log('POS|'+JSON.stringify(o));})()")


FIND_JS = ("(function(spec){var last=false,sub=false,t=spec.toLowerCase();if(t.slice(-5)==='@last'){last=true;t=t.slice(0,-5);}var ex=false;if(t.charAt(0)==='='){ex=true;t=t.slice(1);}if(t.charAt(0)==='~'){sub=true;t=t.slice(1);}"
           "var els=[].slice.call(document.querySelectorAll('button,[role=tab],a,summary')).filter(function(e){var x=(e.textContent||'').trim().toLowerCase();"
           "var r=e.getBoundingClientRect();if(!r.width||e.disabled)return false;return sub?x.indexOf(t)>=0:(ex?x===t:(x===t||x.indexOf(t)===0));});"
           "var e=last?els[els.length-1]:els[0];var o={W:innerWidth,H:innerHeight,f:null};if(e){e.scrollIntoView({block:'center'});var b=e.getBoundingClientRect();o.f=[b.left+b.width/2,b.top+b.height/2];}"
           "console.log('POS|'+JSON.stringify(o));})")


def _main_console(m, src, ln):
    if str(m).startswith("POS|"):
        try:
            S.setdefault("web_pos", {}).update(json.loads(str(m)[4:]))
        except Exception:        # noqa: BLE001
            pass


def _demo_tick(world):
    S["demo_n"] = S.get("demo_n", 0) + 1
    n = S["demo_n"]
    if n % 30 == 0:
        S["demo_on"] = os.path.exists(DEMO_ON)
    if not S.get("demo_on"):
        return
    u = S.get("ui")
    if n % 4 == 0 and os.path.exists(DEMO_CMD):
        try:
            lines = open(DEMO_CMD, encoding="utf-8").read().splitlines()
            os.remove(DEMO_CMD)
        except OSError:
            lines = []
        for ln in lines:
            cmd, _, arg = ln.partition(" ")
            if cmd == "js" and u:
                u["b"].execute_javascript(arg)
            elif cmd == "cam" and arg in S["actors"]:
                S["site_cam"] = arg
                pc = unreal.GameplayStatics.get_player_controller(world, 0)
                _view(pc, S["actors"][arg])
            elif cmd == "orbsun" and "Cam_Lander" in S["actors"]:          # orbsun <Gunes azimutuna gore aci farki> <yukseklik> <yaricap cm>
                dd, el, rr = [float(x) for x in arg.split()]
                piv = _lander_pivot()
                if piv is not None:
                    S["orb"] = {"az": S.get("sun_az", 0.0) + dd, "el": el, "r": rr}
                    o = S["orb"]
                    a_, e_ = math.radians(o["az"]), math.radians(o["el"])
                    cl = unreal.Vector(piv.x + rr * math.cos(e_) * math.cos(a_), piv.y + rr * math.cos(e_) * math.sin(a_), piv.z + rr * math.sin(e_))
                    cam_ = S["actors"]["Cam_Lander"]
                    cam_.set_actor_location(cl, False, False)
                    cam_.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(cl, piv), False)
                    S["site_cam"] = "Cam_Lander"
                    _view(unreal.GameplayStatics.get_player_controller(world, 0), cam_)
            elif cmd == "find" and u:
                S.setdefault("web_pos", {})["f"] = None
                u["b"].execute_javascript(FIND_JS + "(" + json.dumps(arg) + ")")
            elif cmd == "map":
                S["map"] = arg == "1"
            elif cmd == "pos" and u:
                u["b"].execute_javascript(POS_JS)
    if n % 6 == 0:
        vs = unreal.WidgetLayoutLibrary.get_viewport_size(world)
        sc = _scale(world)
        h = S.get("hub") or {}
        st = {"world": world.get_name(), "focus": h.get("focus"), "map": bool(S.get("map")), "vw": vs.x, "vh": vs.y, "sc": sc, "ui": bool(u),
              "ui_left": vs.x - UI_WIDTH * sc, "layout": S.get("layout"), "items": S.get("last_items"), "web_pos": S.get("web_pos"),
              "url": S.get("ui_url"), "frame": S.get("frames"), "site_cam": S.get("site_cam")}
        try:
            open(DEMO_STATE + ".tmp", "w", encoding="utf-8").write(json.dumps(st))
            os.replace(DEMO_STATE + ".tmp", DEMO_STATE)
        except OSError:
            pass
        if u and n % 60 == 0:
            u["b"].execute_javascript(POS_JS)


# --- test/hata ayiklama girisleri (editor otomasyonu) ---
def debug_focus(name):
    S["force_focus"] = name


def debug_go(site_id):
    S["force_go"] = site_id


if not hasattr(unreal, "_feza_tick_handle"):
    unreal._feza_tick_handle = unreal.register_slate_post_tick_callback(_tick)
    unreal.log("feza_runtime: yuklendi (%d ay bolgesi, %d istasyon)" % (len(SITES), len(STATIONS)))
