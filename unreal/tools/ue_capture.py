"""Editor icinde (grafikli, UnrealEditor.exe) calisir: bir haritada duragan goruntuler + kamera hareketi kareleri yakalar, kapanir.

Kullanim: UnrealEditor.exe <proje> -ExecCmds="py C:/.../ue_capture.py" -windowed -ResX=1600 -ResY=900   (ortam: CAP_MAP=/Game/Maps/Site_Craters)
Cikti : Saved/Screenshots/WindowsEditor/cap_<harita>_<ad>.png  (duragan)  ve  cap_<harita>_v<NNN>.png  (hareket kareleri)
Hareket: "pan" = temel kameradan +-PAN_DEG yaw suprulmesi (yumusak), "orbit" = kamera konumu Z ekseni etrafinda 360 derece (kure sahneleri).
Sonraki adim: tools/build_web3d_package.py kareleri mp4'e cevirir.
"""
import math
import os

import unreal

MAP = os.environ.get("CAP_MAP", "/Game/Maps/Site_Craters")
TAG = MAP.split("/")[-1]
STEP = 7                                            # iki yakalama arasi kare
START = int(os.environ.get("CAP_START", "260"))                  # shader/doku/mesh otursun (agir sahnelerde CAP_START=900)

LUNAR = [("ground", "Cam_Ground"), ("lander", "Cam_Lander"), ("earth", "Cam_Earth"), ("sun", "Cam_Sun"), ("overview", "Cam_Overview")]
STATION = [("ground", "Cam_Ground"), ("close", "Cam_Close"), ("moon", "Cam_Moon"), ("moonzoom", "Cam_MoonZoom"), ("overview", "Cam_Overview")]
# harita -> (duragan [(dosya adi, kamera)], hareket tipi, taban kamera, kare sayisi, yaw suprulmesi/derece)
CONFIG = {
    "Site_Craters": (LUNAR, "pan", "Cam_Ground", 36, 30.0),
    "Site_Plains": (LUNAR, "pan", "Cam_Ground", 36, 30.0),
    "Site_Ridges": (LUNAR, "pan", "Cam_Ground", 36, 30.0),
    "Station_Goldstone": (STATION, "pan", "Cam_Ground", 36, 25.0),
    "Station_Madrid": (STATION, "pan", "Cam_Ground", 36, 25.0),
    "Station_Canberra": (STATION, "pan", "Cam_Ground", 36, 25.0),
    "Orbit": ([("earth", "Cam_Shot_Earth"), ("moon", "Cam_Shot_Moon"), ("overview", "Cam_Shot_Overview")], "orbit", "Cam_Shot_Earth", 48, 360.0),
    "Earth_Globe": ([("globe", "Cam_Globe"), ("geo", "Cam_Geo")], "orbit", "Cam_Globe", 48, 360.0),
    "Main": ([], "orbit", None, 48, 360.0),
}
STILLS, MODE, BASE, NFRAMES, SPAN = CONFIG[TAG]
if STILLS:
    STILLS = [("warm", STILLS[0][1])] + list(STILLS)       # ilk cekim kayboluyor: isinma karesi (paketlemede atilir)
S = {"f": 0, "cam": None, "base": None}
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)


def find(label):
    for a in EAS.get_all_level_actors():
        if a.get_actor_label() == label:
            return a
    return None


def shot(name, cam):
    unreal.AutomationLibrary.take_high_res_screenshot(1920, 1080, name, cam, False, False, unreal.ComparisonTolerance.LOW)


def make_cam(frame_i):
    """Hareket kamerasini kareye gore yerlestir."""
    t = frame_i / float(NFRAMES - 1)
    c = S["cam"]
    b = S["base"]
    if MODE == "pan":
        ease = math.sin((t - 0.5) * math.pi) * 0.5 + 0.5          # yumusak gidis
        yaw = -SPAN + 2 * SPAN * ease
        r = b["rot"]
        c.set_actor_rotation(unreal.Rotator(roll=0.0, pitch=r.pitch, yaw=r.yaw + yaw), False)
    else:
        a = t * 2 * math.pi
        L = b["loc"]
        rad = math.hypot(L.x, L.y)
        ang0 = math.atan2(L.y, L.x)
        loc = unreal.Vector(rad * math.cos(ang0 + a), rad * math.sin(ang0 + a), L.z)
        c.set_actor_location(loc, False, False)
        c.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(loc, unreal.Vector(0, 0, 0)), False)


def tick(dt):
    S["f"] += 1
    f = S["f"]
    if f == 1:
        unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).load_level(MAP)
    elif f == 5:
        unreal.SystemLibrary.execute_console_command(None, "r.Streaming.FullyLoadUsedTextures 1")
        unreal.SystemLibrary.execute_console_command(None, "r.Streaming.PoolSize 6000")
    elif f == START - 40:
        if BASE:
            b = find(BASE)
            S["base"] = {"loc": b.get_actor_location(), "rot": b.get_actor_rotation()}
            focal = b.get_cine_camera_component().get_editor_property("current_focal_length")
        else:                                                  # Ay kuresi: 4.6 R'de kamera
            R = 17374.0 * 4.6
            S["base"] = {"loc": unreal.Vector(R * math.cos(math.radians(-30)), R * math.sin(math.radians(-30)), R * 0.35), "rot": unreal.Rotator()}
            focal = 30.0
        c = EAS.spawn_actor_from_class(unreal.CineCameraActor, S["base"]["loc"], S["base"]["rot"])
        c.set_actor_label("Cam_CaptureMotion")
        c.get_cine_camera_component().set_editor_property("current_focal_length", focal)
        S["cam"] = c
        make_cam(0)
    elif f >= START:
        k = (f - START) // STEP
        if (f - START) % STEP == 0:
            if k < len(STILLS):
                name, cam = STILLS[k]
                shot("cap_%s_%s.png" % (TAG, name), find(cam))
            elif k - len(STILLS) < NFRAMES:
                i = k - len(STILLS)
                make_cam(i)
                S["pending"] = i                                  # kamera yerlessin, sonraki karelerde cek
        elif (f - START) % STEP == 3 and S.get("pending") is not None:
            i = S.pop("pending")
            shot("cap_%s_v%03d.png" % (TAG, i), S["cam"])
        if k > len(STILLS) + NFRAMES + 2:
            unreal.log("CAPTURE BITTI")
            unreal.SystemLibrary.execute_console_command(None, "QUIT_EDITOR")


unreal.register_slate_post_tick_callback(tick)
