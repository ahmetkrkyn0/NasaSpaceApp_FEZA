"""UE 5.8 icinde calisir: bodies.json'dan LS_Timeline (Level Sequence) uretir.

Her efemeris adimi (step_s = 1 saat) bir kare; 24 kare/sn gosterim hizi. Kare 0 = start_utc.
Anahtarlanan: Sun (rotasyon), Earth (konum + rotasyon), MPC_Sun.SunDir (Dunya gece isiklari maskesi).

Calistirma (ue_build_scene.py'den SONRA, editor kapaliyken):
  UnrealEditor-Cmd.exe <proje>.uproject -ExecutePythonScript="<bu dosya>" -unattended -nosplash
"""
import json
import math

import unreal

ROOT = r"C:\Users\Berke\FEZA_Unreal"
KM = 10.0                  # cm / km (ue_build_scene.py ile ayni)
FPS = 24

at = unreal.AssetToolsHelpers.get_asset_tools()
LINEAR = unreal.MovieSceneKeyInterpolation.LINEAR


def unwrap(vals):
    out, off, prev = [], 0.0, None
    for v in vals:
        if prev is not None:
            d = v - prev
            if d > 180.0:
                off -= 360.0
            elif d < -180.0:
                off += 360.0
        out.append(v + off)
        prev = v
    return out


def main():
    b = json.load(open(ROOT + r"\data\unreal\bodies.json", encoding="utf-8"))
    n = b["n"]
    les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    les.load_level("/Game/Maps/Main")
    eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    acts = {a.get_actor_label(): a for a in eas.get_all_level_actors()}

    # --- Dunya'dan bakis kamerasi (yoksa ekle) ---
    if "Cam_FromEarth" not in acts:
        p = acts["Earth"].get_actor_location()
        L = math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z)
        loc = unreal.Vector(p.x / L * 70000, p.y / L * 70000, p.z / L * 70000)
        c = eas.spawn_actor_from_class(unreal.CineCameraActor, loc)
        c.set_actor_label("Cam_FromEarth")
        c.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(loc, unreal.Vector(0, 0, 0)), False)

    # --- Her kare icin degerler (MOON_ME -> UE: y aynalanir) ---
    sun_yaw, sun_pitch, sun_dirs = [], [], []
    for s in b["sun_pos_km"]:
        L = math.sqrt(s[0] ** 2 + s[1] ** 2 + s[2] ** 2)
        d = (s[0] / L, -s[1] / L, s[2] / L)            # UE yonu (Dunya'dan Gunes'e)
        sun_dirs.append(d)
        fx, fy, fz = -d[0], -d[1], -d[2]               # isik ileri yonu
        sun_yaw.append(math.degrees(math.atan2(fy, fx)))
        sun_pitch.append(math.degrees(math.asin(max(-1.0, min(1.0, fz)))))
    sun_yaw = unwrap(sun_yaw)

    e_loc = [(e[0] * KM, -e[1] * KM, e[2] * KM) for e in b["earth_pos_km"]]
    e_roll, e_pitch, e_yaw = [], [], []
    for q in b["earth_rot_q"]:                          # [w, x, y, z], ITRF -> MOON_ME
        w, x, y, z = q
        r = unreal.Quat(x=-x, y=y, z=-z, w=w).rotator()    # y-aynalama: (w,-x,y,-z)
        e_roll.append(r.roll)
        e_pitch.append(r.pitch)
        e_yaw.append(r.yaw)
    e_roll, e_pitch, e_yaw = unwrap(e_roll), unwrap(e_pitch), unwrap(e_yaw)

    # --- Sequence ---
    unreal.EditorAssetLibrary.make_directory("/Game/Sequences")
    path = "/Game/Sequences/LS_Timeline"
    if unreal.EditorAssetLibrary.does_asset_exist(path):
        unreal.EditorAssetLibrary.delete_asset(path)
    seq = at.create_asset("LS_Timeline", "/Game/Sequences", unreal.LevelSequence, unreal.LevelSequenceFactoryNew())
    seq.set_display_rate(unreal.FrameRate(FPS, 1))
    tick = seq.get_tick_resolution()
    ratio = int(round((tick.numerator / tick.denominator) / FPS))        # tick / gosterim karesi
    seq.set_playback_start_seconds(0.0)
    seq.set_playback_end_seconds((n - 1) / FPS)
    seq.set_work_range_start(0.0)
    seq.set_work_range_end((n - 1) / FPS)
    unreal.log("SEQ tick=%s ratio=%d n=%d" % (tick, ratio, n))

    def xform_track(actor, loc=None, rot=None):
        bind = seq.add_possessable(actor)
        tr = bind.add_track(unreal.MovieScene3DTransformTrack)
        sec = tr.add_section()
        sec.set_range(0, (n - 1) * ratio + 1)
        ch = list(sec.get_all_channels())     # LocX,Y,Z, RotX(roll),Y(pitch),Z(yaw), ScaX,Y,Z
        cur = actor.get_actor_location()
        if loc is None:
            for i, v in enumerate((cur.x, cur.y, cur.z)):
                ch[i].set_default(v)
        else:
            for f in range(n):
                for i in range(3):
                    ch[i].add_key(unreal.FrameNumber(f), loc[f][i], interpolation=LINEAR)
        for f in range(n):
            ch[3].add_key(unreal.FrameNumber(f), rot[0][f], interpolation=LINEAR)
            ch[4].add_key(unreal.FrameNumber(f), rot[1][f], interpolation=LINEAR)
            ch[5].add_key(unreal.FrameNumber(f), rot[2][f], interpolation=LINEAR)
        sc = actor.get_actor_scale3d()
        for i, v in enumerate((sc.x, sc.y, sc.z)):
            ch[6 + i].set_default(v)

    xform_track(acts["Sun"], None, ([0.0] * n, sun_pitch, sun_yaw))
    xform_track(acts["Earth"], e_loc, (e_roll, e_pitch, e_yaw))

    # --- MPC SunDir (Dunya gece isiklari) ---
    mpc = unreal.load_asset("/Game/Materials/MPC_Sun")
    mt = seq.add_track(unreal.MovieSceneMaterialParameterCollectionTrack)
    for pname in ("mpc", "material_parameter_collection", "parameter_collection"):
        try:
            mt.set_editor_property(pname, mpc)
            unreal.log("SEQ MPC property: %s" % pname)
            break
        except Exception:
            pass
    else:
        unreal.log("SEQ MPC dir: %s" % [a for a in dir(mt) if not a.startswith("_")][:80])
    ms = mt.add_section()
    ms.set_range(0, (n - 1) * ratio + 1)
    for f, d in enumerate(sun_dirs):                     # yontem None doner (void)
        ms.add_color_parameter_key("SunDir", unreal.FrameNumber(f * ratio), unreal.LinearColor(d[0], d[1], d[2], 0))
    unreal.log("SEQ MPC parametreler: %s" % list(ms.get_parameter_names()))

    unreal.EditorAssetLibrary.save_loaded_asset(seq)
    les.save_current_level()
    unreal.log("SEQUENCE HAZIR: %s (%d kare, 1 kare = %d s)" % (path, n, b["step_s"]))


main()
