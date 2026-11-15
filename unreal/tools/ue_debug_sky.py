"""UE icinde: Site_Craters'taki Earth/SunDisc/Cam/Athena aktorlerini data/scratch/dbg_sky.txt'ye yazar (hata ayiklama)."""
import unreal

OUT = open("C:/Users/Berke/FEZA_Unreal/data/scratch/dbg_sky.txt", "w", encoding="utf-8")
unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).load_level("/Game/Maps/Site_Craters")
for a in unreal.get_editor_subsystem(unreal.EditorActorSubsystem).get_all_level_actors():
    n = a.get_actor_label()
    if n in ("Earth", "SunDisc", "Cam_Earth", "Cam_Sun", "Cam_Lander", "Cam_Ground", "Sun") or n.startswith("Athena_BodyL") or n.startswith("Athena_Footp"):
        extra = ""
        if isinstance(a, unreal.StaticMeshActor):
            c = a.static_mesh_component
            m0 = c.get_material(0)
            extra = " mesh=%s mat=%s" % (c.static_mesh.get_name() if c.static_mesh else None, m0.get_name() if m0 else None)
        OUT.write("DBG %s loc=%s rot=%s scale=%s%s\n" % (n, a.get_actor_location(), a.get_actor_rotation(), a.get_actor_scale3d(), extra))
OUT.close()
