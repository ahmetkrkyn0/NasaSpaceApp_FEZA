"""Build the Intuitive Machines Athena (IM-2, Nova-C class) lander from scratch in Blender.

Everything here is made by this script: no third-party meshes or textures.
Shapes and proportions follow public photos of Nova-C and the published size
(4.3 m tall, 1.6 m hexagonal body); payload sizes follow public mission facts.

Run: blender --background --factory-startup --python athena_build.py -- <out_dir> [samples]

Outputs in <out_dir>:
  athena_lander.blend  lander only, collection "Athena", origin = footpad underside centre
  athena_lander.glb    the same lander as glTF
  studio_*.png         preview renders (only when samples > 0)
"""

import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["."]
OUT = os.path.abspath(argv[0])
SAMPLES = int(argv[1]) if len(argv) > 1 else 0
os.makedirs(OUT, exist_ok=True)
random.seed(11)

# ------------------------------------------------------------------ dimensions (metres)
H_TOTAL = 4.30          # published overall height
BODY_R = 0.80           # hexagon circumradius -> 1.6 m across corners
Z_BODY_BOT = 1.10       # underside of the body
Z_SPLIT = 2.05          # black lower section / white upper section
Z_BODY_TOP = 3.95       # top deck
PAD_RADIUS = 2.05       # footpad centre distance from axis
PAD_R = 0.17            # footpad radius
Z_LEG_UP = 1.80         # where the primary strut meets the body corner

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
coll = bpy.data.collections.new("Athena")
scene.collection.children.link(coll)
root = bpy.data.objects.new("Athena", None)
coll.objects.link(root)


def corner(i, r=BODY_R, z=0.0):
    a = math.radians(60 * i)
    return Vector((r * math.cos(a), r * math.sin(a), z))


def face_frame(i, r=None):
    """Centre (at z=0), outward normal and tangent of hexagon face i (between corners i and i+1)."""
    a = math.radians(60 * i + 30)
    apothem = BODY_R * math.cos(math.radians(30)) if r is None else r
    n = Vector((math.cos(a), math.sin(a), 0))
    t = Vector((-math.sin(a), math.cos(a), 0))
    return n * apothem, n, t


FACE_W = BODY_R  # a regular hexagon's side equals its circumradius


# ------------------------------------------------------------------ materials
def principled(name, base, metallic=0.0, rough=0.5, **extra):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*base, 1)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = rough
    for k, v in extra.items():
        b.inputs[k].default_value = v
    return m


def add_crinkle(m, scale=18.0, strength=0.35, rough_lo=None, rough_hi=None):
    """Crumpled multi-layer insulation: voronoi facets plus noise into bump and roughness."""
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = scale
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale * 1.3
    noise.inputs["Detail"].default_value = 10
    noise.inputs["Roughness"].default_value = 0.65
    nt.links.new(tc.outputs["Object"], vor.inputs["Vector"])
    nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])
    add = nt.nodes.new("ShaderNodeMath")
    nt.links.new(vor.outputs["Distance"], add.inputs[0])
    nt.links.new(noise.outputs["Fac"], add.inputs[1])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    bump.inputs["Distance"].default_value = 0.01
    nt.links.new(add.outputs["Value"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    r = b.inputs["Roughness"].default_value
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["To Min"].default_value = rough_lo if rough_lo is not None else r * 0.4
    mr.inputs["To Max"].default_value = rough_hi if rough_hi is not None else r * 1.8
    nt.links.new(noise.outputs["Fac"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], b.inputs["Roughness"])
    return m


def solar_material():
    """Cell grid in the panel's own plane: object-local x = across, z = up (each panel is its own object)."""
    m = principled("SolarCells", (0.01, 0.012, 0.02), 0.3, 0.1, **{"Coat Weight": 1.0, "Coat Roughness": 0.02})
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs["Vector"])
    nt.links.new(sep.outputs["X"], comb.inputs["X"])
    nt.links.new(sep.outputs["Z"], comb.inputs["Y"])
    brick = nt.nodes.new("ShaderNodeTexBrick")
    brick.offset = 0.0
    brick.squash = 1.0
    brick.inputs["Scale"].default_value = 1.0
    brick.inputs["Brick Width"].default_value = 0.061
    brick.inputs["Row Height"].default_value = 0.04
    brick.inputs["Mortar Size"].default_value = 0.003
    brick.inputs["Mortar Smooth"].default_value = 0.1
    brick.inputs["Color1"].default_value = (0.008, 0.01, 0.022, 1)
    brick.inputs["Color2"].default_value = (0.014, 0.016, 0.03, 1)
    brick.inputs["Mortar"].default_value = (0.16, 0.16, 0.17, 1)
    nt.links.new(comb.outputs["Vector"], brick.inputs["Vector"])
    nt.links.new(brick.outputs["Color"], b.inputs["Base Color"])
    # the white interconnect lines are matte, the cells glossy
    rr = nt.nodes.new("ShaderNodeMapRange")
    rr.inputs["To Min"].default_value = 0.08
    rr.inputs["To Max"].default_value = 0.5
    nt.links.new(brick.outputs["Fac"], rr.inputs["Value"])
    nt.links.new(rr.outputs["Result"], b.inputs["Roughness"])
    return m


M = {
    "white": principled("WhitePaint", (0.82, 0.82, 0.8), 0.0, 0.42),
    "silver": add_crinkle(principled("SilverMLI", (0.78, 0.79, 0.81), 1.0, 0.16), 14, 0.5, 0.05, 0.3),
    "black": add_crinkle(principled("BlackKapton", (0.012, 0.012, 0.014), 0.0, 0.32), 10, 0.3, 0.15, 0.5),
    "copper": add_crinkle(principled("CopperMLI", (0.95, 0.5, 0.25), 1.0, 0.2), 9, 0.45, 0.08, 0.35),
    "gold": add_crinkle(principled("GoldMLI", (1.0, 0.72, 0.3), 1.0, 0.22), 12, 0.4),
    "strut": principled("StrutMetal", (0.75, 0.77, 0.8), 1.0, 0.22, Anisotropic=0.5),
    "dark": principled("DarkHardware", (0.05, 0.05, 0.055), 0.6, 0.38),
    "alu": principled("Aluminium", (0.86, 0.87, 0.88), 1.0, 0.3),
    "nozzle": principled("Niobium", (0.55, 0.53, 0.52), 1.0, 0.3, Anisotropic=0.6),
    "inner": principled("NozzleInner", (0.03, 0.025, 0.02), 0.4, 0.6),
    "solar": solar_material(),
    "frame": principled("PanelFrame", (0.9, 0.62, 0.25), 1.0, 0.3),
    "radiator": principled("Radiator", (0.92, 0.93, 0.95), 0.0, 0.2),
    "cable": principled("Cable", (0.06, 0.06, 0.06), 0.0, 0.55),
    "tyre": principled("RoverWheel", (0.6, 0.6, 0.62), 0.9, 0.35),
}


# ------------------------------------------------------------------ geometry helpers
def link(obj, mats, bevel=0.0, smooth_angle=None, sub=0):
    coll.objects.link(obj)
    obj.parent = root
    for m in mats:
        obj.data.materials.append(m)
    if bevel:
        b = obj.modifiers.new("Bevel", "BEVEL")
        b.width = bevel
        b.segments = 3
        b.limit_method = "ANGLE"
        b.angle_limit = math.radians(30)
        b.harden_normals = True
    if sub:
        s = obj.modifiers.new("Sub", "SUBSURF")
        s.levels = s.render_levels = sub
    if smooth_angle is not None:
        bpy.context.view_layer.objects.active = obj
        for o in bpy.context.view_layer.objects:
            o.select_set(o == obj)
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(smooth_angle))
    return obj


def mesh_obj(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return bpy.data.objects.new(name, me)


def box(bm, center, size, rot=Matrix.Identity(4), mat=0):
    res = bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(center) @ rot @ Matrix.Diagonal((*size, 1)),
                        verts=res["verts"])
    for f in {f for v in res["verts"] for f in v.link_faces}:
        f.material_index = mat
    return res["verts"]


def tube(bm, a, b, r, mat=0, seg=20, collars=True, r_end=None):
    d = b - a
    L = d.length
    rot = d.normalized().to_track_quat("Z", "Y").to_matrix().to_4x4()
    rc = r * 1.5 if r_end is None else r_end
    rings = ([(0, rc), (0.03 * L, rc), (0.035 * L, r), (0.965 * L, r), (0.97 * L, rc), (L, rc)]
             if collars else [(0, r), (L, r)])
    loops = []
    for t, rr in rings:
        loops.append([bm.verts.new(a + rot @ Vector((rr * math.cos(2 * math.pi * i / seg),
                                                       rr * math.sin(2 * math.pi * i / seg), t)))
                      for i in range(seg)])
    for l0, l1 in zip(loops, loops[1:]):
        for i in range(seg):
            f = bm.faces.new((l0[i], l0[(i + 1) % seg], l1[(i + 1) % seg], l1[i]))
            f.material_index = mat
            f.smooth = True
    for loop, flip in ((loops[0], True), (loops[-1], False)):
        f = bm.faces.new(list(reversed(loop)) if flip else loop)
        f.material_index = mat
        f.smooth = True


def lathe(bm, profile, center, mat=0, seg=48, cap_bottom=False, cap_top=False):
    """Revolve [(radius, z)] around the vertical axis through center."""
    rings = [[bm.verts.new(center + Vector((r * math.cos(2 * math.pi * i / seg),
                                            r * math.sin(2 * math.pi * i / seg), z)))
              for i in range(seg)] for r, z in profile]
    for l0, l1 in zip(rings, rings[1:]):
        for i in range(seg):
            f = bm.faces.new((l0[i], l0[(i + 1) % seg], l1[(i + 1) % seg], l1[i]))
            f.material_index = mat
            f.smooth = True
    if cap_bottom:
        f = bm.faces.new(list(reversed(rings[0])))
        f.material_index = mat
    if cap_top:
        f = bm.faces.new(rings[-1])
        f.material_index = mat


def face_rot(i):
    _, n, t = face_frame(i)
    return Matrix((t, n, (0, 0, 1))).transposed().to_4x4()  # local x = tangent, y = normal, z = up


def on_face(i, u, z, out=0.0):
    """Point on face i: u along the face (-0.5..0.5 of width), height z, pushed out by `out`."""
    c, n, t = face_frame(i)
    return c + t * (u * FACE_W) + n * out + Vector((0, 0, z))


# ------------------------------------------------------------------ body
def hex_prism(z0, z1, r, inset_seams=True):
    bm = bmesh.new()
    bot = [bm.verts.new(corner(i, r, z0)) for i in range(6)]
    top = [bm.verts.new(corner(i, r, z1)) for i in range(6)]
    for i in range(6):
        bm.faces.new((bot[i], bot[(i + 1) % 6], top[(i + 1) % 6], top[i]))
    bm.faces.new(list(reversed(bot)))
    bm.faces.new(top)
    return bm


# lower section: black kapton
bm = hex_prism(Z_BODY_BOT, Z_SPLIT, BODY_R)
link(mesh_obj("BodyLower", bm), [M["black"]], bevel=0.01)

# upper section: white panels, each face split into a grid of inset panels (seams)
bm = hex_prism(Z_SPLIT, Z_BODY_TOP, BODY_R)
sides = [f for f in bm.faces if abs(f.normal.z) < 0.5]
cuts = bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs((e.verts[0].co - e.verts[1].co).z) > 0.1],
                                 cuts=2, use_grid_fill=False)
bm.faces.ensure_lookup_table()
panels = [f for f in bm.faces if abs(f.normal.z) < 0.5]
ins = bmesh.ops.inset_individual(bm, faces=panels, thickness=0.012, depth=-0.004)
for f in panels:
    # alternate white paint and silver MLI panels
    # silver MLI on the top row of panels and on a few others, white paint elsewhere
    f.material_index = 1 if (f.calc_center_median().z > Z_BODY_TOP - 0.65 or random.random() < 0.12) else 0
body_up = link(mesh_obj("BodyUpper", bm), [M["white"], M["silver"]], bevel=0.004)

# thin structural rails on each corner
bm = bmesh.new()
for i in range(6):
    p = corner(i, BODY_R + 0.006)
    rot = Matrix.Rotation(math.radians(60 * i), 4, "Z")
    box(bm, p + Vector((0, 0, (Z_BODY_BOT + Z_BODY_TOP) / 2)), (0.05, 0.05, Z_BODY_TOP - Z_BODY_BOT + 0.02), rot)
# belt rings at the split and top
for z in (Z_SPLIT, Z_BODY_TOP - 0.01, Z_BODY_BOT + 0.01):
    for i in range(6):
        c, n, t = face_frame(i)
        box(bm, c + n * 0.008 + Vector((0, 0, z)), (FACE_W, 0.03, 0.04), face_rot(i))
link(mesh_obj("Frame", bm), [M["alu"]], bevel=0.006)

# top deck: plate + radiator panel + payload/avionics boxes
bm = hex_prism(Z_BODY_TOP, Z_BODY_TOP + 0.04, BODY_R * 1.04)
link(mesh_obj("TopDeck", bm), [M["alu"]], bevel=0.008)

bm = bmesh.new()
box(bm, Vector((0.0, -0.05, Z_BODY_TOP + 0.20)), (1.0, 0.75, 0.03), Matrix.Rotation(math.radians(8), 4, "X"))
link(mesh_obj("Radiator", bm), [M["radiator"]], bevel=0.006)
bm = bmesh.new()
for k in range(4):
    a = math.radians(45 + 90 * k)
    box(bm, Vector((0.32 * math.cos(a), 0.32 * math.sin(a), Z_BODY_TOP + 0.09)), (0.04, 0.04, 0.12))
link(mesh_obj("RadiatorPosts", bm), [M["alu"]], bevel=0.004)

bm = bmesh.new()
for (x, y, sx, sy, sz) in [(-0.45, 0.25, 0.28, 0.22, 0.18), (0.42, 0.3, 0.22, 0.2, 0.14),
                           (0.3, -0.48, 0.26, 0.18, 0.16), (-0.25, -0.5, 0.18, 0.18, 0.12)]:
    box(bm, Vector((x, y, Z_BODY_TOP + 0.04 + sz / 2)), (sx, sy, sz))
link(mesh_obj("DeckBoxes", bm), [M["silver"]], bevel=0.01)

# ------------------------------------------------------------------ RCS thruster pods on alternate top corners
bm = bmesh.new()
nz = bmesh.new()
for i in (0, 2, 4):
    p = corner(i, BODY_R + 0.12, Z_BODY_TOP - 0.18)
    rot = Matrix.Rotation(math.radians(60 * i), 4, "Z")
    box(bm, p, (0.2, 0.16, 0.16), rot)
    box(bm, corner(i, BODY_R + 0.03, Z_BODY_TOP - 0.18), (0.12, 0.08, 0.06), rot)
    out = Vector((math.cos(math.radians(60 * i)), math.sin(math.radians(60 * i)), 0))
    side = Vector((-out.y, out.x, 0))
    for d in (out, side, -side, Vector((0, 0, -1))):
        base = p + d * 0.09
        lathe(nz, [(0.018, 0.0), (0.022, 0.03), (0.035, 0.07), (0.04, 0.085)], Vector(), seg=20)
        last = list(nz.verts)[-4 * 20:]
        rotd = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
        bmesh.ops.transform(nz, matrix=Matrix.Translation(base) @ rotd, verts=last)
link(mesh_obj("RCSPods", bm), [M["silver"]], bevel=0.01)
link(mesh_obj("RCSNozzles", nz), [M["nozzle"]], smooth_angle=60)

# ------------------------------------------------------------------ main engine + thrust structure
bm = bmesh.new()
lathe(bm, [(0.62, Z_BODY_BOT - 0.12), (0.66, Z_BODY_BOT - 0.08), (0.66, Z_BODY_BOT), (0.5, Z_BODY_BOT)],
      Vector(), cap_bottom=True, seg=6)
link(mesh_obj("ThrustCone", bm), [M["alu"]], bevel=0.008)

bm = bmesh.new()
z_exit, z_throat = 0.58, Z_BODY_BOT - 0.14
r_exit, r_throat = 0.21, 0.075
prof = []
for k in range(41):
    t = k / 40  # 0 exit .. 1 throat
    r = r_throat + (r_exit - r_throat) * (1 - t) ** 0.55
    prof.append((r, z_exit + (z_throat - z_exit) * t))
prof += [(0.11, z_throat + 0.05), (0.13, z_throat + 0.12)]
lathe(bm, prof, Vector(), seg=64)
noz = link(mesh_obj("Engine", bm), [M["nozzle"], M["inner"]], sub=1)
s = noz.modifiers.new("Thick", "SOLIDIFY")
s.thickness = 0.006
s.offset = 1.0
s.material_offset = 1
noz.modifiers.move(1, 0)
bm = bmesh.new()
for t in (0.03, 0.5):
    r = r_throat + (r_exit - r_throat) * (1 - t) ** 0.55 + 0.008
    lathe(bm, [(r, z_exit + (z_throat - z_exit) * t - 0.008), (r + 0.006, z_exit + (z_throat - z_exit) * t),
               (r, z_exit + (z_throat - z_exit) * t + 0.008)], Vector(), seg=64)
link(mesh_obj("EngineRings", bm), [M["nozzle"]])

# ------------------------------------------------------------------ landing legs
legs_bm = bmesh.new()
damp_bm = bmesh.new()
pads_bm = bmesh.new()
brace_bm = bmesh.new()
fit_bm = bmesh.new()
for i in range(6):
    a = math.radians(60 * i)
    out = Vector((math.cos(a), math.sin(a), 0))
    pad_c = out * PAD_RADIUS
    knee = pad_c + Vector((0, 0, 0.16))
    top = corner(i, BODY_R + 0.04, Z_LEG_UP)
    # primary strut: damper (thick) upper part, piston lower part
    mid = top.lerp(knee, 0.45)
    tube(damp_bm, top, mid, 0.045, seg=24)
    tube(legs_bm, mid - (mid - top).normalized() * 0.05, knee, 0.03, seg=24)
    # two secondary struts from the body underside to the knee
    for s_ in (-1, 1):
        b = corner(i, BODY_R * 0.86, Z_BODY_BOT + 0.02)
        b = Matrix.Rotation(math.radians(24 * s_), 4, "Z") @ b
        tube(legs_bm, b, knee, 0.022, seg=20)
    # footpad: dome with socket
    lathe(pads_bm, [(0.0, 0.0), (PAD_R * 0.92, 0.0), (PAD_R, 0.012), (PAD_R * 0.97, 0.028),
                    (PAD_R * 0.6, 0.055), (PAD_R * 0.25, 0.07), (0.045, 0.1), (0.045, 0.17)],
          pad_c, seg=48, cap_bottom=True, cap_top=True)
    # ball joint at the knee, bracket at the shoulder
    ball = bmesh.ops.create_uvsphere(pads_bm, u_segments=24, v_segments=12, radius=0.05)
    bmesh.ops.translate(pads_bm, verts=ball["verts"], vec=knee)
    box(fit_bm, top - out * 0.01, (0.1, 0.12, 0.14), Matrix.Rotation(a, 4, "Z"))
# copper-wrapped V braces on each face of the lower body
for i in range(6):
    l = corner(i, BODY_R + 0.035, Z_LEG_UP - 0.06)
    r = corner(i + 1, BODY_R + 0.035, Z_LEG_UP - 0.06)
    c, n, t = face_frame(i)
    bot = c + n * 0.035 + Vector((0, 0, Z_BODY_BOT + 0.08))
    tube(brace_bm, l, bot, 0.026, seg=16, r_end=0.03)
    tube(brace_bm, r, bot, 0.026, seg=16, r_end=0.03)
link(mesh_obj("LegStruts", legs_bm), [M["strut"]])
link(mesh_obj("LegDampers", damp_bm), [M["strut"]])
link(mesh_obj("Footpads", pads_bm), [M["alu"]], sub=1)
link(mesh_obj("LegFittings", fit_bm), [M["alu"]], bevel=0.012)
link(mesh_obj("Braces", brace_bm), [M["copper"]])

# ------------------------------------------------------------------ body-mounted solar arrays (faces 1, 2, 4, 5)
frm_bm = bmesh.new()
h = (Z_BODY_TOP - 0.12) - (Z_SPLIT - 0.45)
zc = (Z_SPLIT - 0.45 + Z_BODY_TOP - 0.12) / 2
for i in (1, 2, 4, 5):
    sb = bmesh.new()
    box(sb, Vector(), (FACE_W * 0.46, 0.012, h))
    panel = link(mesh_obj(f"SolarArray{i}", sb), [M["solar"]], bevel=0.003)
    panel.matrix_basis = Matrix.Translation(on_face(i, 0.0, zc, out=0.03)) @ face_rot(i)
    box(frm_bm, on_face(i, 0.0, zc, out=0.022), (FACE_W * 0.5, 0.012, h + 0.04), face_rot(i))
link(mesh_obj("SolarFrames", frm_bm), [M["frame"]], bevel=0.004)

# ------------------------------------------------------------------ pressurant tanks in copper MLI (faces 0 and 3)
for i in (0, 3):
    c = on_face(i, 0.0, 2.05, out=0.38)
    tb = bmesh.new()
    bmesh.ops.create_uvsphere(tb, u_segments=96, v_segments=48, radius=1.0)
    _, n, t = face_frame(i)
    rot = face_rot(i)
    bmesh.ops.transform(tb, matrix=Matrix.Translation(c) @ rot @ Matrix.Diagonal((0.46, 0.36, 0.36, 1)), verts=tb.verts)
    for f in tb.faces:
        f.smooth = True
    tank = link(mesh_obj(f"Tank{i}", tb), [M["copper"]], sub=1)
    wr = bpy.data.textures.new(f"Wrinkle{i}", "CLOUDS")
    wr.noise_scale = 0.08
    wr.noise_basis = "VORONOI_F2_F1"
    d = tank.modifiers.new("Wrinkle", "DISPLACE")
    d.texture = wr
    d.texture_coords = "OBJECT"
    d.strength = 0.012
    wf = bpy.data.textures.new(f"WrinkleFine{i}", "CLOUDS")
    wf.noise_scale = 0.025
    d2 = tank.modifiers.new("WrinkleFine", "DISPLACE")
    d2.texture = wf
    d2.texture_coords = "OBJECT"
    d2.strength = 0.0015
    # support struts from tank to body
    sb = bmesh.new()
    for u, z in ((-0.4, 2.3), (0.4, 2.3), (-0.4, 1.8), (0.4, 1.8)):
        tube(sb, on_face(i, u, z, 0.01), c + t * (u * 0.5) + Vector((0, 0, (z - 2.05) * 0.4)), 0.012, seg=12)
    link(mesh_obj(f"TankStruts{i}", sb), [M["dark"]])

# ------------------------------------------------------------------ antennas, cameras, small hardware
bm = bmesh.new()
# high-gain dish on face 0, upper area
dish_c = on_face(0, -0.25, 3.45, out=0.22)
lathe(bm, [(0.0, 0.0), (0.06, 0.004), (0.12, 0.016), (0.17, 0.035), (0.19, 0.045), (0.19, 0.05)],
      Vector(), seg=48, cap_bottom=True)
_, n0, _ = face_frame(0)
dish_rot = (n0 + Vector((0, 0, 0.5))).normalized().to_track_quat("Z", "Y").to_matrix().to_4x4()
bmesh.ops.transform(bm, matrix=Matrix.Translation(dish_c) @ dish_rot, verts=bm.verts)
link(mesh_obj("HighGainDish", bm), [M["white"]], smooth_angle=60)
bm = bmesh.new()
tube(bm, on_face(0, -0.25, 3.45, 0.0), dish_c, 0.02, seg=12)
tube(bm, dish_c, dish_c + (n0 + Vector((0, 0, 0.5))).normalized() * 0.16, 0.006, seg=8, collars=False)
# omni antennas on masts at the top corners 1, 3, 5
for i in (1, 3, 5):
    base = corner(i, BODY_R * 0.92, Z_BODY_TOP + 0.04)
    tip = base + Vector((0, 0, H_TOTAL - Z_BODY_TOP - 0.1))
    tube(bm, base, tip, 0.012, seg=12)
    lathe(bm, [(0.0, 0.0), (0.04, 0.0), (0.045, 0.02), (0.0, 0.06)], tip, seg=24)
# camera / sensor booms on faces 1 and 4
for i in (1, 4):
    a = on_face(i, 0.45, 3.6, 0.0)
    b = on_face(i, 0.7, 3.65, 0.35)
    tube(bm, a, b, 0.014, seg=12)
    box(bm, b, (0.1, 0.12, 0.08), face_rot(i))
link(mesh_obj("Antennas", bm), [M["alu"]], bevel=0.003)

# cameras, star trackers and electronics boxes on the upper panels
bm = bmesh.new()
for i in range(6):
    for _ in range(3):
        u = random.uniform(-0.35, 0.35)
        z = random.uniform(Z_SPLIT + 0.2, Z_BODY_TOP - 0.25)
        if i in (1, 2, 4, 5) and abs(u) < 0.3:
            continue  # keep the solar array clear
        sx, sz = random.uniform(0.08, 0.18), random.uniform(0.06, 0.16)
        box(bm, on_face(i, u, z, 0.035), (sx, 0.06, sz), face_rot(i))
link(mesh_obj("Boxes", bm), [M["silver"]], bevel=0.008)

# cable harnesses running down the corners of the upper body
bm = bmesh.new()
for i in range(6):
    for k in range(3):
        off = (k - 1) * 0.018
        pts = [corner(i, BODY_R + 0.03, z) + Vector((0, 0, 0)) for z in (Z_BODY_TOP - 0.05, Z_SPLIT + 0.05)]
        tangent = Vector((-math.sin(math.radians(60 * i)), math.cos(math.radians(60 * i)), 0))
        tube(bm, pts[0] + tangent * (0.05 + off), pts[1] + tangent * (0.05 + off), 0.007, seg=8, collars=False)
link(mesh_obj("Cables", bm), [M["cable"]])

# ------------------------------------------------------------------ IM-2 payloads
# PRIME-1 (TRIDENT drill + MSOLO) on face 2, lower section, drill column hanging below the deck
bm = bmesh.new()
box(bm, on_face(2, -0.05, 1.72, 0.12), (0.26, 0.2, 0.5), face_rot(2))           # drill housing
box(bm, on_face(2, -0.05, 1.2, 0.12), (0.12, 0.12, 0.6), face_rot(2))           # deployment rail
box(bm, on_face(2, 0.32, 1.85, 0.08), (0.2, 0.14, 0.22), face_rot(2))           # MSOLO
link(mesh_obj("PRIME1", bm), [M["gold"]], bevel=0.008)
bm = bmesh.new()
tube(bm, on_face(2, -0.05, 1.5, 0.12), on_face(2, -0.05, 0.75, 0.12), 0.02, seg=16)  # drill rod
lathe(bm, [(0.0, -0.06), (0.03, 0.0), (0.03, 0.02)], on_face(2, -0.05, 0.75, 0.12), seg=16)
link(mesh_obj("PRIME1Drill", bm), [M["strut"]])

# MAPP micro-rover (45 x 38 x 40 cm) stowed on face 4, lower section
r_c = on_face(4, 0.0, 1.55, 0.28)
rot4 = face_rot(4)
bm = bmesh.new()
box(bm, r_c, (0.45, 0.38, 0.22), rot4)
box(bm, r_c + Vector((0, 0, 0.14)), (0.3, 0.25, 0.06), rot4)
link(mesh_obj("MAPPBody", bm), [M["white"]], bevel=0.012)
bm = bmesh.new()
_, n4, t4 = face_frame(4)
for su in (-1, 1):
    for sn in (-1, 1):
        wc = r_c + t4 * (su * 0.2) + n4 * (sn * 0.16) + Vector((0, 0, -0.08))
        tube(bm, wc - t4 * 0.04, wc + t4 * 0.04, 0.09, seg=24, collars=False)
link(mesh_obj("MAPPWheels", bm), [M["tyre"]], bevel=0.01)
bm = bmesh.new()
box(bm, on_face(4, 0.0, 1.32, 0.18), (0.55, 0.3, 0.03), rot4)                   # release bracket
link(mesh_obj("MAPPBracket", bm), [M["alu"]], bevel=0.005)

# Grace (Micro-Nova hopper) stowed on face 5, lower section: small hexagonal craft with four legs
g_c = on_face(5, 0.0, 1.55, 0.36)
bm = bmesh.new()
for k in range(1):
    gb = bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.26, radius2=0.26, depth=0.32)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(g_c) @ Matrix.Rotation(math.radians(30), 4, "Z"),
                        verts=gb["verts"])
link(mesh_obj("GraceBody", bm), [M["gold"]], bevel=0.01)
bm = bmesh.new()
for k in range(4):
    a = math.radians(45 + 90 * k)
    d = Vector((math.cos(a), math.sin(a), 0))
    tube(bm, g_c + d * 0.2 + Vector((0, 0, -0.1)), g_c + d * 0.34 + Vector((0, 0, -0.3)), 0.012, seg=10)
lathe(bm, [(0.05, 0.0), (0.07, -0.08)], g_c + Vector((0, 0, -0.16)), seg=24)
link(mesh_obj("GraceLegs", bm), [M["strut"]])

# ------------------------------------------------------------------ origin: footpad underside at z = 0, centred
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
pts = []
for o in coll.objects:
    if o.type == "MESH":
        ev = o.evaluated_get(dg)
        pts += [ev.matrix_world @ v.co for v in ev.data.vertices]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
root.location = (-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z)
print("SIZE m:", tuple(round(v, 3) for v in (hi - lo)))

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "athena_lander.blend"), compress=True)
for o in bpy.context.view_layer.objects:
    o.select_set(o in set(coll.objects))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "athena_lander.glb"), export_format="GLB",
                          use_selection=True, export_apply=True, export_yup=True)

# ------------------------------------------------------------------ preview renders (not saved in the .blend)
if SAMPLES > 0:
    world = bpy.data.worlds.new("Studio")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.012, 0.013, 0.016, 1)
    scene.world = world

    def area(name, loc, energy, size, color=(1, 1, 1)):
        L = bpy.data.lights.new(name, "AREA")
        L.energy, L.size, L.color = energy, size, color
        ob = bpy.data.objects.new(name, L)
        scene.collection.objects.link(ob)
        ob.location = loc
        ob.rotation_euler = (Vector((0, 0, 2.0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()

    area("Key", (6, -6, 6), 1700, 4, (1.0, 0.97, 0.92))
    area("Fill", (-7, -4, 3), 450, 6, (0.85, 0.9, 1.0))
    area("Rim", (-2, 7, 6), 2000, 3)
    bpy.ops.mesh.primitive_plane_add(size=60)
    floor = bpy.context.active_object
    floor.data.materials.append(principled("Floor", (0.03, 0.03, 0.033), 0.0, 0.35))

    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    try:
        prefs.compute_device_type = "OPTIX"
        prefs.get_devices()
        for dv in prefs.devices:
            dv.use = dv.type == "OPTIX"
        scene.cycles.device = "GPU"
    except TypeError:
        pass
    scene.cycles.samples = SAMPLES
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = 1600, 1200
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    cam.data.lens = 50
    scene.collection.objects.link(cam)
    scene.camera = cam
    shots = {
        "studio_front": ((7.0, -8.5, 2.6), (0, 0, 2.0)),
        "studio_back": ((-7.5, 8.0, 3.2), (0, 0, 2.0)),
        "studio_low": ((-3.5, -5.5, 0.6), (0, 0, 1.4)),
        "studio_top": ((3.5, -3.0, 6.5), (0, 0, 3.0)),
    }
    for name, (loc, target) in shots.items():
        cam.location = loc
        cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = os.path.join(OUT, f"{name}.png")
        bpy.ops.render.render(write_still=True)
print("DONE")
