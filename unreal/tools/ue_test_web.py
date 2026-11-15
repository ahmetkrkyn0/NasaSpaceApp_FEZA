"""Editorde Play'i baslatip etiketleri/arayuzu gosteren kareleri hazirlar (pencere yakalama disaridan: test gunlugundaki SHOT satirlari).

Akis: Orbit genel gorunum -> Ay odagi -> Dunya odagi -> uydu odagi. Her adimda gunluge 'SHOT <ad>' yazar (bir surec pencereyi yakalar).
Kullanim: UnrealEditor.exe <proje> -ExecCmds="py C:/.../ue_test_web.py" -windowed -ResX=1600 -ResY=900 -nosplash   (vite: 127.0.0.1:5199 calisiyor olmali)
Cikti: data/scratch/test_web.txt, data/scratch/ui_runtime.txt
"""
import sys

import unreal

sys.path.insert(0, r"C:\Users\Berke\FEZA_Unreal\tools")
import feza_runtime as fr  # noqa: E402

les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
ues = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem)
LOG = open("C:/Users/Berke/FEZA_Unreal/data/scratch/test_web.txt", "w", encoding="utf-8")
STEPS = [("overview", None), ("moon", "moon"), ("earth", "earth"), ("sat", "sat:TDRS-East")]
st = {"f": 0, "i": -1, "t": 0, "phase": "wait"}


def log(msg):
    LOG.write("f=%d | %s\n" % (st["f"], msg))
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
    w = ues.get_game_world()
    if st["phase"] == "wait":
        if w is not None and w.get_name() == "Orbit" and fr.S.get("ui"):
            log("arayuz bagli (overlay=%s)" % bool(fr.S["ui"].get("o")))
            st["phase"], st["t"], st["i"] = "settle", f, 0
        elif f > 1500:
            log("ZAMAN ASIMI")
            st["phase"] = "end"
            st["t"] = f
        return
    if st["phase"] == "settle" and f - st["t"] >= (1000 if st["i"] == 0 else 420):
        name, focus = STEPS[st["i"]]
        log("SHOT %s" % name)
        lay = fr.S.get("layout") or {}
        rs = [r for r in lay.get("r", []) if r["id"] != "toggle"]
        k = lay.get("kx", 1.0) or 1.0
        if rs:
            r0 = rs[0]
            hit = fr._layout_hit((r0["x"] + r0["w"] / 2) / k, (r0["y"] + r0["h"] / 2) / k, True)
            log("layout: %d kart, kx=%.3f, ilk=%s, sanal tiklama -> %s" % (len(rs), k, r0["id"], hit))
        st["phase"], st["t"] = "shot", f
        return
    if st["phase"] == "shot" and f - st["t"] >= 360:
        st["i"] += 1
        if st["i"] >= len(STEPS):
            st["phase"], st["t"] = "end", f
            return
        name, focus = STEPS[st["i"]]
        if focus:
            fr.debug_focus(focus)
        st["phase"], st["t"] = "settle", f
        return
    if st["phase"] == "end" and f - st["t"] > 10:
        log("BITTI")
        LOG.close()
        les.editor_request_end_play()
        unreal.SystemLibrary.execute_console_command(None, "QUIT_EDITOR")
        st["phase"] = "done"


unreal.register_slate_post_tick_callback(tick)
