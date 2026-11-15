"""Editor icinde (grafikli) calisir: tanitim videosu icin Orbit'i PIE ile baslatir (kayan 1920x1080 pencere: EditorPerProjectUserSettings.ini LevelEditorPlaySettings, demo_rig.py ayarlar); data/scratch/demo_quit.txt gorununce kapanir.

Cagiran : tools/demo_rig.py (UnrealEditor.exe <proje> -ExecCmds="py .../ue_demo.py" -windowed -ResX=1920 -ResY=1080)
Etki    : data/scratch/demo_on.txt (feza_runtime durum/komut kanalini acar)
Cikti   : data/scratch/demo_ready.txt (PIE baslayinca)
"""
import os

import unreal

ROOT = "C:/Users/Berke/FEZA_Unreal/data/scratch/"
les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
ues = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem)
st = {"f": 0, "ready": False}
for f in ("demo_quit.txt", "demo_ready.txt", "demo_state.json", "demo_cmd.txt"):
    try:
        os.remove(ROOT + f)
    except OSError:
        pass
open(ROOT + "demo_on.txt", "w").write("1")


def tick(dt):
    st["f"] += 1
    f = st["f"]
    if f == 2:
        les.load_level("/Game/Maps/Orbit")
    elif f == 40:
        les.editor_request_begin_play()
    elif not st["ready"] and ues.get_game_world() is not None and f > 80:
        st["ready"] = True
        open(ROOT + "demo_ready.txt", "w").write("1")
    if os.path.exists(ROOT + "demo_quit.txt"):
        les.editor_request_end_play()
        unreal.SystemLibrary.execute_console_command(None, "QUIT_EDITOR")


unreal.register_slate_post_tick_callback(tick)
