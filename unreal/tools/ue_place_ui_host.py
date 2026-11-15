"""UE icinde calisir (editor kapali): BP_UIHost (web arayuzunu viewport'a ekleyen aktor) 7 haritaya yerlestirilir.

Girdi : /Game/UI/BP_UIHost (elle yapilan Blueprint: BeginPlay -> Create WBP_Shell -> Set Shell -> Add to Viewport)
Cikti : her haritada "UIHost" aktoru (yeniden calistirilabilir), gunluk data/scratch/place_ui.txt
Calistirma: UnrealEditor-Cmd.exe <proje> -ExecutePythonScript="<bu dosya>" -unattended -nosplash
"""
import traceback

import unreal

import os

MAPS = (os.environ.get("UIHOST_MAPS") or "Orbit,Site_Craters,Site_Plains,Site_Ridges,Station_Goldstone,Station_Madrid,Station_Canberra").split(",")
LOG = open("C:/Users/Berke/FEZA_Unreal/data/scratch/place_ui.txt", "w", encoding="utf-8")


def log(msg):
    LOG.write(str(msg) + "\n")
    LOG.flush()


try:
    cls = unreal.load_object(None, "/Game/UI/BP_UIHost.BP_UIHost_C")
    log("sinif: %s" % cls)
    les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    for m in MAPS:
        les.load_level("/Game/Maps/" + m)
        for a in list(eas.get_all_level_actors()):
            if a.get_actor_label() == "UIHost":
                eas.destroy_actor(a)
        host = eas.spawn_actor_from_class(cls, unreal.Vector(0, 0, 0))
        host.set_actor_label("UIHost")
        les.save_current_level()
        log("%s: yerlestirildi (%s)" % (m, host))
except Exception:       # noqa: BLE001
    log(traceback.format_exc())
LOG.close()
