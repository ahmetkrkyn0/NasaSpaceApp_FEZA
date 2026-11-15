"""PIE testi: direk yuksekligi (kamera) ve ekibin ufuk profili (Chandrayaan-3, Site_Ridges); ue_test_sky.py iskeleti. 'SHOT <ad>' satirlari win_capture.ps1 icin.

Onkosul: tools\\.venv\\Scripts\\python.exe tools\\sky_service.py calisiyor, vite 127.0.0.1:5199 calisiyor.
Akis: Site_Ridges + SLIM @2026-12-27 (devrilmis; Gunes yuksek) -> lander kamerasi -> Dunya kamerasi -> Apollo 11 @2026-12-12 (Gunes ufkun altinda)
Cikti: data/scratch/test_web.txt (SHOT satirlari), data/scratch/ui_runtime.txt
"""
import sys

import unreal

sys.path.insert(0, r"C:\Users\Berke\FEZA_Unreal\tools")
import feza_runtime as fr  # noqa: E402

les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
ues = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem)
LOG = open("C:/Users/Berke/FEZA_Unreal/data/scratch/test_web.txt", "w", encoding="utf-8")
st = {"f": 0, "phase": "wait", "t": 0, "i": 0}
SLIM = dict(fr.SITE_BY_ID["chandrayaan-3"], url_start="2026-12-27T06:00:00Z", url_end="2027-01-26T06:00:00Z")
fr.S["ui_url"] = fr._scenario_url(SLIM)
fr.S["ui_site"] = "chandrayaan-3"
STEPS = [("c3_m2", "Cam_Ground", None), ("c3_m10", "Cam_Ground", ("chandrayaan-3", "2026-12-27T06:00:00Z", 10.0)), ("c3_m0", "Cam_Ground", ("chandrayaan-3", "2026-12-27T06:00:00Z", 0.0))]


def log(m):
    LOG.write("f=%d | %s\n" % (st["f"], m))
    LOG.flush()


def tick(dt):
    st["f"] += 1
    f = st["f"]
    if f == 2:
        les.load_level("/Game/Maps/Site_Ridges")
        return
    if f == 40:
        les.editor_request_begin_play()
        return
    w = ues.get_game_world()
    if w is None or w.get_name() != "Site_Ridges":
        if f > 1500:
            log("ZAMAN ASIMI")
            st["phase"], st["t"] = "end", f
        if st["phase"] != "end":
            return
    if st["phase"] == "wait":
        st["phase"], st["t"] = "set", f
        return
    if st["phase"] == "set" and f - st["t"] > (600 if st["i"] == 0 else 150):
        name, cam, ap = STEPS[st["i"]]
        if ap:
            fr._sky_apply(w, ap[0], ap[1], ap[2])
        pc = unreal.GameplayStatics.get_player_controller(w, 0)
        fr._view(pc, fr.S["actors"][cam])
        st["phase"], st["t"] = "shot", f
        return
    if st["phase"] == "shot" and f - st["t"] > 90:
        log("SHOT %s" % STEPS[st["i"]][0])
        st["phase"], st["t"] = "after", f
        return
    if st["phase"] == "after" and f - st["t"] > 330:
        st["i"] += 1
        st["phase"] = "end" if st["i"] >= len(STEPS) else "set"
        st["t"] = f
        return
    if st["phase"] == "end" and f - st["t"] > 10:
        log("BITTI")
        LOG.close()
        les.editor_request_end_play()
        unreal.SystemLibrary.execute_console_command(None, "QUIT_EDITOR")
        st["phase"] = "done"


unreal.register_slate_post_tick_callback(tick)
