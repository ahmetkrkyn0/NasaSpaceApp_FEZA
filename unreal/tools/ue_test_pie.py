"""Editorde Play'i baslatip yeni akisi betikle sinar (Orbit -> Ay'a yaklas -> saha -> geri -> Dunya -> istasyon -> geri).

Kullanim: UnrealEditor.exe <proje> -ExecCmds="py C:/.../ue_test_pie.py" -windowed -ResX=1280 -ResY=720 -nosplash
Cikti: data/scratch/test_pie.txt (asama gunlugu) ve Saved/Screenshots/WindowsEditor/HighresScreenshot*.png (sirasiyla asamalar)
Her adim: eylem (onceki dunyada) -> beklenen dunya yuklenir -> SETTLE kare bekle -> ekran goruntusu.
"""
import sys

import unreal

sys.path.insert(0, r"C:\Users\Berke\FEZA_Unreal\tools")
import feza_runtime as fr  # noqa: E402

les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
ues = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem)
LOG = open("C:/Users/Berke/FEZA_Unreal/data/scratch/test_pie.txt", "w", encoding="utf-8")
SETTLE = 170
st = {"f": 0, "i": 0, "armed": False, "t_ok": None, "t_arm": 0, "end": None}

# (ad, beklenen dunya, eylem)
STEPS = [
    ("orbit", "Orbit", None),
    ("moon_focus", "Orbit", lambda: fr.debug_focus("moon")),
    ("craters", "Site_Craters", lambda: fr.debug_go("site-craters")),
    ("back_to_moon", "Orbit", lambda: fr.debug_go("BACK")),
    ("earth_focus", "Orbit", lambda: fr.debug_focus("earth")),
    ("madrid", "Station_Madrid", lambda: fr.debug_go("dsn-madrid")),
    ("back_to_earth", "Orbit", lambda: fr.debug_go("BACK")),
]


def log(msg):
    LOG.write(msg + "\n")
    LOG.flush()


def tick(dt):
    st["f"] += 1
    f = st["f"]
    if f == 2:
        les.load_level("/Game/Maps/Orbit")
        return
    if f == 40:
        les.editor_request_begin_play()
        return
    if f <= 40:
        return
    if st["end"] is not None:
        if f - st["end"] == 100:
            log("BITTI")
            LOG.close()
            les.editor_request_end_play()
            unreal.SystemLibrary.execute_console_command(None, "QUIT_EDITOR")
        return
    if st["i"] >= len(STEPS):
        st["end"] = f
        return
    w = ues.get_game_world()
    name, want, action = STEPS[st["i"]]
    if not st["armed"]:
        if w is None:
            return
        if action is not None:
            action()
        st["armed"], st["t_ok"], st["t_arm"] = True, None, f
        return
    if w is None or w.get_name() != want or fr.S.get("world_path") != w.get_path_name():
        st["t_ok"] = None
        if f - st["t_arm"] > 5000:
            log("ZAMAN ASIMI: %s (dunya=%s)" % (name, w.get_name() if w else None))
            st["i"] = len(STEPS)
        return
    if st["t_ok"] is None:
        st["t_ok"] = f
        return
    if f - st["t_ok"] >= SETTLE:
        unreal.SystemLibrary.execute_console_command(w, "HighResShot 1280x720")
        hub = fr.S.get("hub")
        log("%s | dunya=%s | odak=%s | kare=%d" % (name, w.get_name(), hub["focus"] if hub else None, f))
        st["i"] += 1
        st["armed"] = False


unreal.register_slate_post_tick_callback(tick)
