"""Make a lander-only file for dropping into another scene.

Run: blender --background --factory-startup --python export_clean.py -- <athena_hq.blend> <out.blend> <out.glb>

- keeps only the NovaC hierarchy, inside a collection named "Athena"
- origin (the NovaC empty) sits at the centre between the footpads, on their underside (z = 0)
- real size in metres, Z up; all textures packed into the .blend
"""

import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, out_blend, out_glb = (os.path.abspath(a) for a in argv[:3])

bpy.ops.wm.open_mainfile(filepath=src)
scene = bpy.context.scene
root = bpy.data.objects["NovaC"]
lander = {root} | set(root.children_recursive)

for o in list(bpy.data.objects):
    if o not in lander:
        bpy.data.objects.remove(o, do_unlink=True)

# Put the lander in its own collection
coll = bpy.data.collections.new("Athena")
scene.collection.children.link(coll)
for o in lander:
    for c in list(o.users_collection):
        c.objects.unlink(o)
    coll.objects.link(o)

# Move the origin: centre between footpads, footpad underside at z = 0
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
pts = []
for o in lander:
    if o.type == "MESH":
        ev = o.evaluated_get(dg)
        mw = ev.matrix_world
        pts += [mw @ v.co for v in ev.data.vertices]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
shift = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
root.location -= shift
bpy.context.view_layer.update()
print("SIZE m:", tuple(round(v, 3) for v in (hi - lo)))

# Neutral world, no render setup baggage
scene.world = None
for w in list(bpy.data.worlds):
    bpy.data.worlds.remove(w)
bpy.ops.outliner.orphans_purge(do_recursive=True)

bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=out_blend, compress=True)

bpy.ops.object.select_all(action="DESELECT")
for o in lander:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=out_glb, export_format="GLB", use_selection=True,
                          export_apply=True, export_yup=True)
print("DONE")
