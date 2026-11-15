"""UE icinde calisir (editor kapali): /Game/UI/WBP_Shell widget blueprint'ini Python'la uretir: sag kenarda bir WebBrowser ("Browser").

Cikti: /Game/UI/WBP_Shell, gunluk data/scratch/build_ui.txt
Calisma zamani: feza_runtime.py (FEZA_UI_URL / fr.UI_URL) bu widget'i viewport'a ekler ve ekibin web uygulamasini yukler.
Calistirma: UnrealEditor-Cmd.exe <proje> -ExecutePythonScript="<bu dosya>" -unattended -nosplash   (WebBrowserWidget eklentisi acik olmali)
"""
import traceback

import unreal

LOG = open("C:/Users/Berke/FEZA_Unreal/data/scratch/build_ui.txt", "w", encoding="utf-8")


def log(msg):
    LOG.write(str(msg) + "\n")
    LOG.flush()


try:
    at = unreal.AssetToolsHelpers.get_asset_tools()
    eal = unreal.EditorAssetLibrary
    eal.make_directory("/Game/UI")
    p = "/Game/UI/WBP_Shell"
    if eal.does_asset_exist(p):
        eal.delete_asset(p)
    f = unreal.WidgetBlueprintFactory()
    f.set_editor_property("parent_class", unreal.UserWidget)
    bp = at.create_asset("WBP_Shell", "/Game/UI", unreal.WidgetBlueprint, f)
    log("blueprint: %s" % bp)
    # widget_tree Python'a acik degil: fabrika varsayilan CanvasPanel koklu bos widget uretir; icerik calisma aninda eklenir
    try:
        unreal.BlueprintEditorLibrary.compile_blueprint(bp)
        log("compile ok")
    except Exception as e:       # noqa: BLE001
        log("compile hata: %s" % e)
    eal.save_loaded_asset(bp)
    log("kaydedildi")
except Exception:       # noqa: BLE001
    log(traceback.format_exc())
LOG.close()
