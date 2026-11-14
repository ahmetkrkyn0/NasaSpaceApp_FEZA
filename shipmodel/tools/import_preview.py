"""Import the converted Nova-C OBJ into Blender, save a .blend and render previews.

Run: blender --background --factory-startup --python import_preview.py -- <obj> <out_dir>
"""

import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
obj_path, out_dir = os.path.abspath(argv[0]), os.path.abspath(argv[1])
os.makedirs(out_dir, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=obj_path)
objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]

# Bounding box of the whole model
pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
size = hi - lo
print("BBOX size (model units):", tuple(round(v, 3) for v in size))

# Parent everything to an empty, scale so the height is 4.3 m and stand it on z=0
root = bpy.data.objects.new("NovaC", None)
bpy.context.scene.collection.objects.link(root)
for o in objs:
    o.parent = root
height_axis = max(range(3), key=lambda i: size[i])
scale = 4.3 / size[height_axis]
root.scale = (scale, scale, scale)
# Celestia shows this model with "Orientation [180 1 0 0]": flip it upright
root.rotation_euler = (math.pi, 0, 0)
center = (lo + hi) / 2
root.location = (-center.x * scale, center.y * scale, hi.z * scale)
print("height axis:", "xyz"[height_axis], "scale:", round(scale, 4))

# Ground, sun, camera
bpy.ops.mesh.primitive_plane_add(size=40)
ground = bpy.context.active_object
gm = bpy.data.materials.new("Regolith")
gm.diffuse_color = (0.35, 0.34, 0.32, 1)
gm.use_nodes = True
gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.35, 0.34, 0.32, 1)
ground.data.materials.append(gm)

sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
sun.data.energy = 4
sun.rotation_euler = (math.radians(75), 0, math.radians(40))
bpy.context.scene.collection.objects.link(sun)

world = bpy.data.worlds.new("World")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.02, 0.02, 0.025, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
bpy.context.scene.world = world

cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
bpy.context.scene.collection.objects.link(cam)
bpy.context.scene.camera = cam

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in [
    e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items
] else "BLENDER_EEVEE"
scene.render.resolution_x, scene.render.resolution_y = 1200, 1200
scene.view_settings.view_transform = "Standard"

target = Vector((0, 0, 2.0))
views = {"front": (0, -1), "three_quarter": (1, -1), "side": (1, 0), "back": (0, 1)}
for name, (dx, dy) in views.items():
    d = Vector((dx, dy, 0)).normalized()
    cam.location = target + d * 9 + Vector((0, 0, 2.5))
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = os.path.join(out_dir, f"preview_{name}.png")
    bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out_dir, "nova-c_imported.blend"))
print("DONE")
