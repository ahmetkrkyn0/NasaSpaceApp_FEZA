"""UE icinde calisir (editor kapali): WBP_Shell'e ikinci, saydam ve tiklanamaz bir WebBrowser ("Overlay", tam ekran) ekler.

Yontem: widget agaci Python'a ozellik olarak acik degil, ama alt nesnelerine yolla erisilir:
        /Game/UI/WBP_Shell.WBP_Shell:WidgetTree  ve  ...:WidgetTree.<widget adi>
Cikti : WBP_Shell icinde "Overlay" (Is Variable, Hit Test Invisible, Supports Transparency, tam ekran) ve gunluk data/scratch/add_overlay.txt
Calistirma: UnrealEditor-Cmd.exe <proje> -ExecutePythonScript="<bu dosya>" -unattended -nosplash
"""
import traceback

import unreal

LOG = open("C:/Users/Berke/FEZA_Unreal/data/scratch/add_overlay.txt", "w", encoding="utf-8")


def log(msg):
    LOG.write(str(msg) + "\n")
    LOG.flush()


BP = "/Game/UI/WBP_Shell.WBP_Shell"
try:
    tree = unreal.load_object(None, BP + ":WidgetTree")
    log("tree: %s" % tree)
    canvas = None
    for nm in ("CanvasPanel", "CanvasPanel_0", "RootCanvas"):
        try:
            o = unreal.load_object(None, BP + ":WidgetTree." + nm)
            if o is not None:
                canvas = o
                log("canvas bulundu: %s" % nm)
                break
        except Exception as e:       # noqa: BLE001
            log("canvas %s: %s" % (nm, e))
    browser = unreal.load_object(None, BP + ":WidgetTree.Browser")
    log("browser: %s" % browser)
    if canvas is None:
        raise RuntimeError("canvas bulunamadi")
    existing = None
    try:
        existing = unreal.load_object(None, BP + ":WidgetTree.Overlay")
    except Exception:       # noqa: BLE001
        existing = None
    if existing is not None:
        log("Overlay zaten var; yeniden eklenmiyor")
    else:
        ov = unreal.new_object(unreal.WebBrowser, tree, "Overlay")
        log("overlay: %s" % ov)
        for prop, val in (("is_variable", True), ("supports_transparency", True), ("visibility", unreal.SlateVisibility.HIT_TEST_INVISIBLE)):
            try:
                ov.set_editor_property(prop, val)
                log("ayarlandi: %s" % prop)
            except Exception as e:       # noqa: BLE001
                log("ayar hata %s: %s" % (prop, e))
        log("canvas yontemleri: %s" % [m for m in dir(canvas) if "child" in m.lower()])
        slot = canvas.add_child_to_canvas(ov)
        log("slot: %s" % slot)
        slot.set_anchors(unreal.Anchors(minimum=unreal.Vector2D(0.0, 0.0), maximum=unreal.Vector2D(1.0, 1.0)))
        slot.set_offsets(unreal.Margin(left=0.0, top=0.0, right=0.0, bottom=0.0))
        slot.set_z_order(-1)
    bp = unreal.load_asset(BP)
    try:
        unreal.BlueprintEditorLibrary.compile_blueprint(bp)
        log("compile ok")
    except Exception as e:       # noqa: BLE001
        log("compile hata: %s" % e)
    unreal.EditorAssetLibrary.save_loaded_asset(bp)
    log("kaydedildi")
except Exception:       # noqa: BLE001
    log(traceback.format_exc())
LOG.close()
