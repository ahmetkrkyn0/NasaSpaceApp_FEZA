"""Rebuild the low-poly parts of the Nova-C model with higher-quality geometry and render a studio turnaround.

Run: blender --background --factory-startup --python remodel.py -- <athena.blend> <out_dir> [samples]

- thin prism struts  -> smooth round tubes with end collars
- propellant tanks   -> smooth ellipsoids with real (displaced) MLI wrinkles
- engine nozzle      -> lathed bell with lip and dark interior
- footpads           -> domed pads
- flat zero-thickness panels -> solidified
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, out_dir = os.path.abspath(argv[0]), os.path.abspath(argv[1])
samples = int(argv[2]) if len(argv) > 2 else 96
os.makedirs(out_dir, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=src)
scene = bpy.context.scene
root = bpy.data.objects["NovaC"]

# Keep only the lander
keep = {root} | set(root.children_recursive)
for o in list(scene.objects):
    if o not in keep:
        bpy.data.objects.remove(o, do_unlink=True)


# ------------------------------------------------------------------ helpers
def components(bm):
    seen, comps = set(), []
    for v in bm.verts:
        if v in seen:
            continue
        comp, stack = [], [v]
        while stack:
            x = stack.pop()
            if x in seen:
                continue
            seen.add(x)
            comp.append(x)
            stack.extend(e.other_vert(x) for e in x.link_edges)
        comps.append(comp)
    return comps


def pca(points):
    n = len(points)
    c = sum(points, Vector()) / n
    cov = [[0.0] * 3 for _ in range(3)]
    for p in points:
        d = p - c
        for i in range(3):
            for j in range(3):
                cov[i][j] += d[i] * d[j]
    # power iteration for the main axis
    axis = Vector((1, 0.3, 0.2)).normalized()
    for _ in range(50):
        axis = Vector([sum(cov[i][j] * axis[j] for j in range(3)) for i in range(3)])
        if axis.length < 1e-12:
            return c, Vector((0, 0, 1))
        axis.normalize()
    return c, axis


def comp_material(comp):
    for v in comp:
        for f in v.link_faces:
            return f.material_index
    return 0


def new_object(name, mesh, mats, like):
    o = bpy.data.objects.new(name, mesh)
    for m in mats:
        o.data.materials.append(m)
    scene.collection.objects.link(o)
    o.parent = like.parent
    o.matrix_world = like.matrix_world.copy()
    return o


def tube(bm, a, b, r, mat, seg=20, collar=True):
    """Round tube from a to b in the bmesh's local space, with small end collars."""
    d = b - a
    L = d.length
    if L < 1e-6:
        return
    z = d.normalized()
    rot = z.to_track_quat("Z", "Y").to_matrix().to_4x4()
    rings = [(0.0, r * 1.45), (0.035 * L, r * 1.45), (0.04 * L, r),
             (0.96 * L, r), (0.965 * L, r * 1.45), (L, r * 1.45)] if collar else [(0.0, r), (L, r)]
    loops = []
    for t, rr in rings:
        loop = []
        for i in range(seg):
            ang = 2 * math.pi * i / seg
            p = Vector((rr * math.cos(ang), rr * math.sin(ang), t))
            loop.append(bm.verts.new(a + (rot @ p)))
        loops.append(loop)
    for l0, l1 in zip(loops, loops[1:]):
        for i in range(seg):
            f = bm.faces.new((l0[i], l0[(i + 1) % seg], l1[(i + 1) % seg], l1[i]))
            f.material_index = mat
            f.smooth = True
    for loop, flip in ((loops[0], True), (loops[-1], False)):
        f = bm.faces.new(list(reversed(loop)) if flip else loop)
        f.material_index = mat
        f.smooth = True


stats = {"struts": 0, "tanks": 0, "pads": 0}

# ------------------------------------------------------------------ struts
for o in list(root.children):
    if o.type != "MESH":
        continue
    bm = bmesh.new()
    bm.from_mesh(o.data)
    replaced = []
    for comp in components(bm):
        if not (4 <= len(comp) <= 40):
            continue
        pts = [v.co.copy() for v in comp]
        c, axis = pca(pts)
        proj = [(p - c).dot(axis) for p in pts]
        L = max(proj) - min(proj)
        radial = max((p - c - axis * (p - c).dot(axis)).length for p in pts)
        if L > 0.25 and L > 9 * radial and radial > 0.003:
            a = c + axis * min(proj)
            b = c + axis * max(proj)
            replaced.append((comp, a, b, max(radial * 0.85, 0.008), comp_material(comp)))
    for comp, a, b, r, mat in replaced:
        bmesh.ops.delete(bm, geom=comp, context="VERTS")
        tube(bm, a, b, r, mat)
        stats["struts"] += 1
    bm.to_mesh(o.data)
    bm.free()

# ------------------------------------------------------------------ tanks
# Tank MLI: broad soft folds come from real displaced geometry, so tone the shader bump down
gold = bpy.data.materials["mat9"].copy()
gold.name = "TankMLI"
for n in gold.node_tree.nodes:
    if n.type == "BUMP":
        n.inputs["Strength"].default_value = 0.08
crinkle_tex = bpy.data.textures.new("MLIWrinkle", "CLOUDS")
crinkle_tex.noise_scale = 0.09
crinkle_tex.noise_depth = 2
crinkle_tex.noise_basis = "VORONOI_F2_F1"
crinkle_fine = bpy.data.textures.new("MLIFine", "CLOUDS")
crinkle_fine.noise_scale = 0.03
crinkle_fine.noise_depth = 3

for name in ("mesh8", "mesh13"):
    o = bpy.data.objects[name]
    bm = bmesh.new()
    bm.from_mesh(o.data)
    comps = sorted(components(bm), key=len, reverse=True)
    tank = comps[0]
    pts = [v.co.copy() for v in tank]
    c, axis = pca(pts)
    # extents along the main axis and perpendicular
    along = [(p - c).dot(axis) for p in pts]
    perp = [(p - c - axis * (p - c).dot(axis)).length for p in pts]
    half_len = (max(along) - min(along)) / 2
    rad = max(perp)
    c = c + axis * (max(along) + min(along)) / 2
    bmesh.ops.delete(bm, geom=tank, context="VERTS")
    bm.to_mesh(o.data)
    bm.free()

    tm = bpy.data.meshes.new(name + "_tank")
    tb = bmesh.new()
    bmesh.ops.create_uvsphere(tb, u_segments=96, v_segments=48, radius=1.0, calc_uvs=True)
    scale = Matrix.Diagonal((rad, rad, half_len, 1))
    rot = axis.to_track_quat("Z", "Y").to_matrix().to_4x4()
    bmesh.ops.transform(tb, matrix=Matrix.Translation(c) @ rot @ scale, verts=tb.verts)
    for f in tb.faces:
        f.smooth = True
    tb.to_mesh(tm)
    tb.free()
    t = new_object(name + "_Tank", tm, [gold], o)
    sub = t.modifiers.new("Sub", "SUBSURF")
    sub.levels = sub.render_levels = 2
    d1 = t.modifiers.new("Wrinkle", "DISPLACE")
    d1.texture = crinkle_tex
    d1.texture_coords = "OBJECT"
    d1.strength = 0.008
    d1.mid_level = 0.5
    d2 = t.modifiers.new("WrinkleFine", "DISPLACE")
    d2.texture = crinkle_fine
    d2.texture_coords = "OBJECT"
    d2.strength = 0.002
    stats["tanks"] += 1

# ------------------------------------------------------------------ nozzle
o = bpy.data.objects["mesh3"]
bm = bmesh.new()
bm.from_mesh(o.data)
comps = sorted(components(bm), key=len, reverse=True)
bell = comps[0]
mw = o.matrix_world
pts_w = [mw @ v.co for v in bell]
zlo, zhi = min(p.z for p in pts_w), max(p.z for p in pts_w)
cx = sum(p.x for p in pts_w) / len(pts_w)
cy = sum(p.y for p in pts_w) / len(pts_w)
r_exit = max(math.hypot(p.x - cx, p.y - cy) for p in pts_w if p.z < zlo + 0.05 * (zhi - zlo))
bmesh.ops.delete(bm, geom=bell, context="VERTS")
bm.to_mesh(o.data)
bm.free()

nm = bpy.data.meshes.new("Nozzle")
nb = bmesh.new()
seg, steps = 64, 40
H = zhi - zlo
r_throat = r_exit * 0.42
rings = []
for k in range(steps + 1):
    t = k / steps  # 0 = exit (bottom), 1 = throat (top)
    # Bell: expands fast just below the throat, then straightens towards the exit
    r = r_throat + (r_exit - r_throat) * (1 - t) ** 0.55
    z = zlo + H * t
    rings.append([nb.verts.new((cx + r * math.cos(2 * math.pi * i / seg),
                                cy + r * math.sin(2 * math.pi * i / seg), z)) for i in range(seg)])
for l0, l1 in zip(rings, rings[1:]):
    for i in range(seg):
        f = nb.faces.new((l0[i], l0[(i + 1) % seg], l1[(i + 1) % seg], l1[i]))
        f.smooth = True
# stiffening rings
for t in (0.02, 0.45):
    r = r_throat + (r_exit - r_throat) * (1 - t) ** 0.55
    z = zlo + H * t
    ring = bmesh.ops.create_circle(nb, segments=seg, radius=r + 0.012)
    bmesh.ops.translate(nb, verts=ring["verts"], vec=(cx, cy, z))
nb.to_mesh(nm)
nb.free()
inv = mw.inverted()
nm.transform(inv)
noz = bpy.data.objects.new("Nozzle", nm)
scene.collection.objects.link(noz)
noz.parent = o.parent
noz.matrix_world = mw.copy()
nmat = bpy.data.materials.new("NozzleNiobium")
nmat.use_nodes = True
nbsdf = nmat.node_tree.nodes["Principled BSDF"]
nbsdf.inputs["Base Color"].default_value = (0.62, 0.6, 0.58, 1)
nbsdf.inputs["Metallic"].default_value = 1.0
nbsdf.inputs["Roughness"].default_value = 0.28
nbsdf.inputs["Anisotropic"].default_value = 0.6
inner = bpy.data.materials.new("NozzleInner")
inner.use_nodes = True
ib = inner.node_tree.nodes["Principled BSDF"]
ib.inputs["Base Color"].default_value = (0.03, 0.025, 0.02, 1)
ib.inputs["Roughness"].default_value = 0.6
ib.inputs["Metallic"].default_value = 0.5
noz.data.materials.append(nmat)
noz.data.materials.append(inner)
sol = noz.modifiers.new("Thick", "SOLIDIFY")
sol.thickness = 0.008
sol.offset = 1.0
sol.material_offset = 1
sol.use_rim = True
sol.material_offset_rim = 0
noz.modifiers.new("Sub", "SUBSURF").levels = 1
# The solidify flips "inside" as the second material; make sure the inner faces are dark
# (normals of a bell built bottom->top point inward, so offset=1 grows outward)

# ------------------------------------------------------------------ footpads
o = bpy.data.objects["mesh31"]
bm = bmesh.new()
bm.from_mesh(o.data)
mw = o.matrix_world
pads = []
for comp in components(bm):
    pw = [mw @ v.co for v in comp]
    zmin, zmax = min(p.z for p in pw), max(p.z for p in pw)
    w = max(p.x for p in pw) - min(p.x for p in pw)
    if zmin < 0.12 and zmax < 0.12 and w > 0.2:
        cx = (max(p.x for p in pw) + min(p.x for p in pw)) / 2
        cy = (max(p.y for p in pw) + min(p.y for p in pw)) / 2
        pads.append((comp, cx, cy, w / 2, zmin))
for comp, *_ in pads:
    bmesh.ops.delete(bm, geom=comp, context="VERTS")
bm.to_mesh(o.data)
bm.free()

pm = bpy.data.meshes.new("Footpads")
pb = bmesh.new()
for _, cx, cy, r, z0 in pads:
    h = 0.06
    prof = [(0.0, 0.0), (0.92, 0.0), (1.0, 0.18), (0.97, 0.42), (0.6, 0.85), (0.22, 1.0),
            (0.16, 1.4), (0.16, 2.0)]  # dome + short socket stem
    seg = 48
    rings = []
    for pr, pz in prof:
        rings.append([pb.verts.new((cx + r * pr * math.cos(2 * math.pi * i / seg),
                                    cy + r * pr * math.sin(2 * math.pi * i / seg),
                                    z0 + pz * h)) for i in range(seg)])
    for l0, l1 in zip(rings, rings[1:]):
        for i in range(seg):
            f = pb.faces.new((l0[i], l0[(i + 1) % seg], l1[(i + 1) % seg], l1[i]))
            f.smooth = True
    pb.faces.new(list(reversed(rings[0]))).smooth = True
    pb.faces.new(rings[-1]).smooth = True
    stats["pads"] += 1
pb.to_mesh(pm)
pb.free()
pm.transform(mw.inverted())
padobj = bpy.data.objects.new("Footpads", pm)
scene.collection.objects.link(padobj)
padobj.parent = o.parent
padobj.matrix_world = mw.copy()
padobj.data.materials.append(bpy.data.materials["mat0"])
ps = padobj.modifiers.new("Sub", "SUBSURF")
ps.levels = ps.render_levels = 1

# ------------------------------------------------------------------ panels: give zero-thickness plates some depth
for name in ("mesh9", "mesh35", "mesh12", "mesh23", "mesh44", "mesh25"):
    o = bpy.data.objects.get(name)
    if o and not any(m.type == "SOLIDIFY" for m in o.modifiers):
        s = o.modifiers.new("Thick", "SOLIDIFY")
        s.thickness = 0.012
        s.offset = 0.0
        # keep bevel last
        if "Bevel" in o.modifiers:
            o.modifiers.move(len(o.modifiers) - 1, len(o.modifiers) - 2)

# bevel: rounder edges everywhere
for o in root.children_recursive:
    b = o.modifiers.get("Bevel") if o.type == "MESH" else None
    if b:
        b.segments = 3
        b.width = 0.008
# Silver MLI on the body panels: darker base, sharper reflections, stronger crinkle
silver = bpy.data.materials["mat3"]
for n in silver.node_tree.nodes:
    if n.type == "BUMP":
        n.inputs["Strength"].default_value = 0.55
        n.inputs["Distance"].default_value = 0.015
    elif n.type == "BSDF_PRINCIPLED":
        n.inputs["Base Color"].default_value = (0.72, 0.73, 0.75, 1)
    elif n.type == "MAP_RANGE":
        n.inputs["To Min"].default_value = 0.06
        n.inputs["To Max"].default_value = 0.3
print("REMODEL", stats)

# ------------------------------------------------------------------ studio
world = scene.world
wn = world.node_tree.nodes
wn["Background"].inputs["Color"].default_value = (0.012, 0.013, 0.016, 1)
wn["Background"].inputs["Strength"].default_value = 1.0


def area(name, loc, energy, size, color=(1, 1, 1)):
    L = bpy.data.lights.new(name, "AREA")
    L.energy = energy
    L.size = size
    L.color = color
    ob = bpy.data.objects.new(name, L)
    scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector((0, 0, 2.0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return ob


area("Key", (6, -6, 6), 1700, 4, (1.0, 0.97, 0.92))
area("Fill", (-7, -4, 3), 500, 6, (0.85, 0.9, 1.0))
area("Rim", (-2, 7, 6), 2000, 3)

floor_z = min(pad[4] for pad in pads) if pads else 0.0
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, floor_z - 0.001))
floor = bpy.context.active_object
fm = bpy.data.materials.new("Floor")
fm.use_nodes = True
fb = fm.node_tree.nodes["Principled BSDF"]
fb.inputs["Base Color"].default_value = (0.03, 0.03, 0.033, 1)
fb.inputs["Roughness"].default_value = 0.35
floor.data.materials.append(fm)

scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == "OPTIX"
scene.cycles.device = "GPU"
scene.cycles.samples = samples
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = 1600, 1200
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = 0.0

cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
cam.data.lens = 50
scene.collection.objects.link(cam)
scene.camera = cam
shots = {
    "studio_front": (Vector((7.0, -8.5, 2.6)), Vector((0, 0, 2.0))),
    "studio_low": (Vector((-3.5, -5.5, 0.6)), Vector((0, 0, 1.4))),
    "studio_detail_tank": (Vector((3.2, -2.6, 2.4)), Vector((0.9, -0.3, 2.1))),
    "studio_detail_legs": (Vector((2.8, -3.2, 0.5)), Vector((0.6, -0.5, 0.6))),
}
for name, (loc, target) in shots.items():
    cam.location = loc
    cam.rotation_euler = (target - loc).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = os.path.join(out_dir, f"{name}.png")
    bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out_dir, "athena_hq.blend"))
print("DONE")
