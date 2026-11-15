"""Deneme: /Game/Nature altindaki cok parcali modellerin StaticMesh adlari ve sinirlari. Cikti: data/scratch/probe_hism.txt"""
import unreal

out = []
eal = unreal.EditorAssetLibrary
for name in ("wild_rooibos_bush", "grass_bermuda_01", "searsia_lucida", "shrub_02", "pine_sapling_small", "namaqualand_rocks_01"):
    for p in eal.list_assets("/Game/Nature/" + name, recursive=True, include_folder=False):
        a = unreal.load_asset(p)
        if isinstance(a, unreal.StaticMesh):
            b = a.get_bounds()
            out.append("%s | %s | ext %.0f %.0f %.0f | org %.0f %.0f %.0f | tris %d" % (name, a.get_name(), b.box_extent.x, b.box_extent.y, b.box_extent.z,
                       b.origin.x, b.origin.y, b.origin.z, a.get_num_triangles(0) if hasattr(a, "get_num_triangles") else -1))
open(r"C:\Users\Berke\FEZA_Unreal\data\scratch\probe_hism.txt", "w").write("\n".join(out))
