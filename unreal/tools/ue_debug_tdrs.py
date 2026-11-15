import unreal

OUT = open("C:/Users/Berke/FEZA_Unreal/data/scratch/dbg_tdrs.txt", "w", encoding="utf-8")
for p in unreal.EditorAssetLibrary.list_assets("/Game/TDRS/tdrs_a/StaticMeshes", recursive=False, include_folder=False):
    a = unreal.load_asset(p)
    b = a.get_bounds()
    OUT.write("%s origin=%s ext=%s\n" % (p, b.origin, b.box_extent))
OUT.close()
