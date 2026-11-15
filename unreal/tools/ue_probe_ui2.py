import unreal

OUT = open("C:/Users/Berke/FEZA_Unreal/data/scratch/probe_ui2.txt", "w", encoding="utf-8")
for cname in ("WidgetLibrary", "UserWidgetFunctionLibrary", "UserWidget", "WidgetLayoutLibrary", "GameViewportClient", "WidgetBlueprint", "EditorUtilitySubsystem", "EditorUtilityLibrary"):
    c = getattr(unreal, cname, None)
    OUT.write("== %s: %s\n" % (cname, c is not None))
    if c:
        OUT.write("   " + ", ".join(m for m in dir(c) if not m.startswith("_") and (cname in ("WidgetLibrary", "UserWidgetFunctionLibrary", "EditorUtilitySubsystem", "EditorUtilityLibrary") or any(k in m for k in ("create", "viewport", "widget", "tree", "root", "add", "spawn")))) + "\n")
try:
    c = unreal.load_object(None, "/Game/UI/WBP_Shell.WBP_Shell_C")
    OUT.write("load_object _C: %s\n" % c)
except Exception as e:       # noqa: BLE001
    OUT.write("load_object _C hata: %s\n" % e)
try:
    c = unreal.load_class(None, "/Game/UI/WBP_Shell.WBP_Shell_C")
    OUT.write("load_class: %s\n" % c)
except Exception as e:       # noqa: BLE001
    OUT.write("load_class hata: %s\n" % e)
OUT.close()
