import unreal

OUT = open("C:/Users/Berke/FEZA_Unreal/data/scratch/probe_ui.txt", "w", encoding="utf-8")
ues = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem)
les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
st = {"f": 0}


def log(m):
    OUT.write(str(m) + "\n")
    OUT.flush()


def tick(dt):
    st["f"] += 1
    f = st["f"]
    if f == 2:
        les.load_level("/Game/Maps/Orbit")
    elif f == 40:
        les.editor_request_begin_play()
    elif f == 300:
        try:
            w = ues.get_game_world()
            pc = unreal.GameplayStatics.get_player_controller(w, 0)
            cls = unreal.EditorAssetLibrary.load_blueprint_class("/Game/UI/WBP_Shell")
            log("class: %s" % cls)
            wid = unreal.WidgetLibrary.create(w, cls, pc)
            log("widget: %s" % wid)
            log("widget members: %s" % [m for m in dir(wid) if any(k in m.lower() for k in ("tree", "root", "widget", "child", "panel", "name"))])
            wid.add_to_viewport(10)
            log("added to viewport")
            for nm in ("CanvasPanel_0", "CanvasPanel", "RootCanvas"):
                try:
                    r = wid.get_widget_from_name(nm)
                    log("get_widget_from_name(%s) = %s" % (nm, r))
                except Exception as e:       # noqa: BLE001
                    log("get_widget_from_name(%s) hata: %s" % (nm, e))
            try:
                log("root_widget: %s" % wid.get_editor_property("widget_tree"))
            except Exception as e:       # noqa: BLE001
                log("widget_tree hata: %s" % e)
        except Exception as e:       # noqa: BLE001
            import traceback
            log(traceback.format_exc())
    elif f == 360:
        OUT.close()
        les.editor_request_end_play()
        unreal.SystemLibrary.execute_console_command(None, "QUIT_EDITOR")


unreal.register_slate_post_tick_callback(tick)
