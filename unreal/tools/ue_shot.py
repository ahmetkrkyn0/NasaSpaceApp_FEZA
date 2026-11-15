"""Editor icinde (grafikli, UnrealEditor.exe) calisir: haritayi acar, kameradan ekran goruntusu alir, kapanir.

Kullanim: UnrealEditor.exe <proje> -ExecutePythonScript="ue_shot.py" -windowed -ResX=1280 -ResY=720
Ortam degiskenleri: SHOT_CAM (aktor etiketi, vars. Cam_Moon), SHOT_NAME (dosya adi, vars. shot.png)
"""
import os
import unreal

CAM = os.environ.get("SHOT_CAM", "Cam_Moon")
NAME = os.environ.get("SHOT_NAME", "shot.png")
state = {"frame": 0, "shot": False}


def find_cam():
    for a in unreal.get_editor_subsystem(unreal.EditorActorSubsystem).get_all_level_actors():
        if a.get_actor_label() == CAM:
            return a
    return None


def tick(dt):
    state["frame"] += 1
    f = state["frame"]
    if f == 1:
        unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).load_level(os.environ.get("SHOT_MAP", "/Game/Maps/Main"))
    elif f == 7 and os.environ.get("SHOT_CSM"):       # hata ayiklama: kaskad golge parametreleri
        for a in unreal.get_editor_subsystem(unreal.EditorActorSubsystem).get_all_level_actors():
            if a.get_actor_label() == "Sun":
                lc = a.get_component_by_class(unreal.DirectionalLightComponent)
                lc.set_editor_property("dynamic_shadow_distance_movable_light", float(os.environ["SHOT_CSM"]))
                lc.set_editor_property("dynamic_shadow_cascades", 4)
                lc.set_editor_property("cascade_distribution_exponent", 3.0)
                unreal.log("DEBUG kaskad golge mesafesi %s" % os.environ["SHOT_CSM"])
    elif f == 8 and os.environ.get("SHOT_CMD"):       # hata ayiklama: konsol komutu
        for c in os.environ["SHOT_CMD"].split(";"):
            unreal.SystemLibrary.execute_console_command(None, c.strip())
            unreal.log("DEBUG cmd: %s" % c.strip())
    elif f == 5:                                      # dokular tam yuklensin (stream beklemeden)
        unreal.SystemLibrary.execute_console_command(None, "r.Streaming.FullyLoadUsedTextures 1")
        unreal.SystemLibrary.execute_console_command(None, "r.Streaming.PoolSize 6000")
    elif f == 30 and os.environ.get("SHOT_DEBUG"):    # hata ayiklama: materyali degistir
        mat = unreal.load_asset(os.environ["SHOT_DEBUG"])
        n = 0
        for a in unreal.get_editor_subsystem(unreal.EditorActorSubsystem).get_all_level_actors():
            if isinstance(a, unreal.StaticMeshActor):
                a.static_mesh_component.set_material(0, mat)
                n += 1
        unreal.log("DEBUG materyal %s: %d aktor" % (os.environ["SHOT_DEBUG"], n))
    elif f == 35 and os.environ.get("SHOT_SUNPITCH"):  # hata ayiklama: Gunes'i dik acidan isitsin
        for a in unreal.get_editor_subsystem(unreal.EditorActorSubsystem).get_all_level_actors():
            if a.get_actor_label() == "Sun":
                a.set_actor_rotation(unreal.Rotator(0.0, float(os.environ["SHOT_SUNPITCH"]), 0.0), False)
                unreal.log("DEBUG gunes pitch %s" % os.environ["SHOT_SUNPITCH"])
    elif f == 40 and os.environ.get("SHOT_INFO"):     # hata ayiklama: konum/sinir bilgisi
        for a in unreal.get_editor_subsystem(unreal.EditorActorSubsystem).get_all_level_actors():
            lab = a.get_actor_label()
            if lab in ("focus_0_0", "focus_3_3", "outer", "Cam_Overview", "Cam_Ground", "Sun"):
                o, e = a.get_actor_bounds(False)
                unreal.log("INFO %s loc=%s bounds_origin=(%.0f,%.0f,%.0f) extent=(%.0f,%.0f,%.0f)" % (
                    lab, a.get_actor_location(), o.x, o.y, o.z, e.x, e.y, e.z))
                if isinstance(a, unreal.StaticMeshActor):
                    m = a.static_mesh_component.static_mesh
                    unreal.log("INFO   mesh=%s nanite=%s" % (m.get_name(), m.get_editor_property("nanite_settings").get_editor_property("enabled")))
    elif f == 60 and os.environ.get("SHOT_FRAME"):    # tarih cubugunu istenen kareye getir
        seq = unreal.load_asset("/Game/Sequences/LS_Timeline")
        unreal.LevelSequenceEditorBlueprintLibrary.open_level_sequence(seq)
        unreal.LevelSequenceEditorBlueprintLibrary.set_current_time(int(os.environ["SHOT_FRAME"]))
    elif f == 105 and os.environ.get("SHOT_EARTHCLOSE"):  # Dunya'ya yakin kamera (Gunes'e dik)
        eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
        al = {a.get_actor_label(): a for a in eas.get_all_level_actors()}
        ep, fw = al["Earth"].get_actor_location(), al["Sun"].get_actor_forward_vector()
        perp = unreal.Vector(fw.y, -fw.x, 0.0)
        L = (perp.x ** 2 + perp.y ** 2) ** 0.5 or 1.0
        d = 63710.0 * float(os.environ.get("SHOT_EARTHCLOSE"))
        loc = unreal.Vector(ep.x + perp.x / L * d, ep.y + perp.y / L * d, ep.z)
        c = eas.spawn_actor_from_class(unreal.CineCameraActor, loc)
        c.set_actor_label("Cam_EarthClose")
        c.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(loc, ep), False)
    elif f == 100 and os.environ.get("SHOT_BIAS"):    # pozlama denemesi (EV sapmasi)
        for a in unreal.get_editor_subsystem(unreal.EditorActorSubsystem).get_all_level_actors():
            if a.get_actor_label() == "Exposure":
                st = a.get_editor_property("settings")
                st.set_editor_property("auto_exposure_bias", float(os.environ["SHOT_BIAS"]))
                a.set_editor_property("settings", st)
    elif f == 110 and os.environ.get("SHOT_EARTHVIEW"):   # Dunya yonunden bakis kamerasi (yonelim dogrulamasi)
        eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
        earth = [a for a in eas.get_all_level_actors() if a.get_actor_label() == "Earth"][0]
        p = earth.get_actor_location()
        n = (p.x * p.x + p.y * p.y + p.z * p.z) ** 0.5
        d = float(os.environ.get("SHOT_DIST", "55000"))
        loc = unreal.Vector(p.x / n * d, p.y / n * d, p.z / n * d)
        c = eas.spawn_actor_from_class(unreal.CineCameraActor, loc)
        c.set_actor_label("Cam_FromEarth")
        c.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(loc, unreal.Vector(0, 0, 0)), False)
    elif f == int(os.environ.get("SHOT_AT", "260")):  # shader'lar/dokular/Nanite sayfalari otursun
        cam = find_cam()
        unreal.log(f"KAMERA: {cam}")
        unreal.AutomationLibrary.take_high_res_screenshot(1920, 1080, NAME, cam, False, False, unreal.ComparisonTolerance.LOW)
        state["shot"] = True
    elif f == int(os.environ.get("SHOT_QUIT", "520")):
        unreal.log("SHOT BITTI")
        unreal.SystemLibrary.execute_console_command(None, "QUIT_EDITOR")


unreal.register_slate_post_tick_callback(tick)
