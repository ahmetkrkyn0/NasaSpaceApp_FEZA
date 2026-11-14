"""Upgrade the imported Nova-C model: PBR materials, bevels and a lunar south-pole scene.

Run: blender --background --factory-startup --python enhance.py -- <imported.blend> <tex_dir> <out_dir> [samples]
"""

import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src_blend, tex_dir, out_dir = (os.path.abspath(a) for a in argv[:3])
samples = int(argv[3]) if len(argv) > 3 else 128
os.makedirs(out_dir, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=src_blend)
scene = bpy.context.scene

# Remove the preview helpers
for name in ("Plane", "Sun", "Camera"):
    o = bpy.data.objects.get(name)
    if o:
        bpy.data.objects.remove(o, do_unlink=True)

root = bpy.data.objects["NovaC"]
parts = [o for o in scene.objects if o.type == "MESH" and o.parent == root]


# ---------------------------------------------------------------- materials
def image(name):
    path = os.path.join(tex_dir, name)
    for img in bpy.data.images:
        if os.path.basename(img.filepath) == name:
            return img
    return bpy.data.images.load(path)


def build(mat, base, metallic, roughness, tex=None, crinkle=0.0, crinkle_scale=30.0,
          tex_mix=1.0, emission=None, coat=0.0, aniso=0.0):
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Base Color"].default_value = (*base, 1)
    if coat:
        bsdf.inputs["Coat Weight"].default_value = coat
        bsdf.inputs["Coat Roughness"].default_value = 0.05
    if aniso:
        bsdf.inputs["Anisotropic"].default_value = aniso

    tc = nt.nodes.new("ShaderNodeTexCoord")
    if tex:
        it = nt.nodes.new("ShaderNodeTexImage")
        it.image = image(tex)
        nt.links.new(tc.outputs["UV"], it.inputs["Vector"])
        if tex_mix >= 1.0:
            nt.links.new(it.outputs["Color"], bsdf.inputs["Base Color"])
        else:
            mix = nt.nodes.new("ShaderNodeMix")
            mix.data_type = "RGBA"
            mix.blend_type = "MULTIPLY"
            mix.inputs["Factor"].default_value = tex_mix
            mix.inputs["A"].default_value = (*base, 1)
            nt.links.new(it.outputs["Color"], mix.inputs["B"])
            nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
        if emission:
            nt.links.new(it.outputs["Color"], bsdf.inputs["Emission Color"])
            bsdf.inputs["Emission Strength"].default_value = emission

    if crinkle:
        # Crumpled multi-layer insulation: voronoi facets + noise, drives bump and roughness
        vor = nt.nodes.new("ShaderNodeTexVoronoi")
        vor.feature = "F1"
        vor.inputs["Scale"].default_value = crinkle_scale * 0.5
        noise = nt.nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = crinkle_scale * 0.6
        noise.inputs["Detail"].default_value = 10
        noise.inputs["Roughness"].default_value = 0.65
        nt.links.new(tc.outputs["Object"], vor.inputs["Vector"])
        nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])
        add = nt.nodes.new("ShaderNodeMath")
        add.operation = "ADD"
        nt.links.new(vor.outputs["Distance"], add.inputs[0])
        nt.links.new(noise.outputs["Fac"], add.inputs[1])
        bump = nt.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = crinkle * 0.6
        bump.inputs["Distance"].default_value = 0.01
        nt.links.new(add.outputs["Value"], bump.inputs["Height"])
        nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
        rr = nt.nodes.new("ShaderNodeMapRange")
        rr.inputs["To Min"].default_value = roughness * 0.5
        rr.inputs["To Max"].default_value = roughness * 1.6
        nt.links.new(noise.outputs["Fac"], rr.inputs["Value"])
        nt.links.new(rr.outputs["Result"], bsdf.inputs["Roughness"])
    return mat


GOLD = (1.0, 0.71, 0.29)
SILVER = (0.91, 0.92, 0.92)
specs = {
    # slot: (base, metallic, roughness, texture, kwargs)
    "mat0": ((0.62, 0.66, 0.72), 1.0, 0.3, None, {"aniso": 0.4}),           # strut metal
    "mat1": ((0.05, 0.07, 0.15), 0.2, 0.12, "nova_c_solp.png", {"coat": 1.0}),  # solar cells
    "mat2": (GOLD, 1.0, 0.25, None, {"crinkle": 0.35}),                    # gold trim
    "mat3": (SILVER, 1.0, 0.22, "nova_c_silver.png", {"crinkle": 0.45, "tex_mix": 0.6}),  # silver MLI
    "mat4": ((0.02, 0.02, 0.022), 0.0, 0.45, "nova_c_black.png", {"tex_mix": 0.5}),  # black kapton
    "mat5": ((0.04, 0.04, 0.045), 0.6, 0.4, None, {}),                     # dark hardware
    "mat6": ((1.0, 0.55, 0.12), 1.0, 0.25, None, {"crinkle": 0.3}),        # orange/gold leg wrap
    "mat7": ((0.95, 0.95, 0.95), 0.0, 0.35, "nova_c_logos.png", {}),       # logo decals
    "mat8": ((0.8, 0.8, 0.8), 0.8, 0.35, None, {}),                        # misc grey
    "mat9": (GOLD, 1.0, 0.22, "nova_c_gold.png", {"crinkle": 0.5, "tex_mix": 0.7}),  # gold MLI tanks
    "mat10": ((0.75, 0.76, 0.78), 1.0, 0.32, "nova_c_metal.png", {"tex_mix": 0.5, "aniso": 0.3}),
    "mat11": ((0.86, 0.86, 0.82), 0.0, 0.5, None, {}),                     # white paint
}
for name, (base, met, rough, tex, kw) in specs.items():
    mat = bpy.data.materials.get(name)
    if mat:
        mat.use_nodes = True
        build(mat, base, met, rough, tex, **kw)

# ---------------------------------------------------------------- geometry
for o in parts:
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    # Clean duplicate verts left by the triangle-strip export
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=1e-5)
    bpy.ops.object.mode_set(mode="OBJECT")
    o.select_set(False)
    if o.data.has_custom_normals:
        bpy.context.view_layer.objects.active = o
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    bev = o.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.006
    bev.segments = 2
    bev.limit_method = "ANGLE"
    bev.angle_limit = math.radians(35)
    bev.harden_normals = True
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    o.select_set(False)

# ---------------------------------------------------------------- lunar scene
bpy.ops.mesh.primitive_plane_add(size=120, location=(0, 0, 0))
ground = bpy.context.active_object
ground.name = "Regolith"
sub = ground.modifiers.new("Sub", "SUBSURF")
sub.subdivision_type = "SIMPLE"
sub.levels = sub.render_levels = 7
tex = bpy.data.textures.new("RegolithDisp", "CLOUDS")
tex.noise_scale = 6.0
disp = ground.modifiers.new("Disp", "DISPLACE")
disp.texture = tex
disp.strength = 0.6
disp.mid_level = 0.5
ground.location.z = -0.02

gm = bpy.data.materials.new("RegolithMat")
gm.use_nodes = True
nt = gm.node_tree
bsdf = nt.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.95
tc = nt.nodes.new("ShaderNodeTexCoord")
n1 = nt.nodes.new("ShaderNodeTexNoise")
n1.inputs["Scale"].default_value = 0.4
n1.inputs["Detail"].default_value = 12
nt.links.new(tc.outputs["Object"], n1.inputs["Vector"])
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].color = (0.10, 0.10, 0.10, 1)
ramp.color_ramp.elements[1].color = (0.24, 0.235, 0.225, 1)
nt.links.new(n1.outputs["Fac"], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
n2 = nt.nodes.new("ShaderNodeTexNoise")
n2.inputs["Scale"].default_value = 60
n2.inputs["Detail"].default_value = 15
nt.links.new(tc.outputs["Object"], n2.inputs["Vector"])
gb = nt.nodes.new("ShaderNodeBump")
gb.inputs["Strength"].default_value = 0.6
nt.links.new(n2.outputs["Fac"], gb.inputs["Height"])
nt.links.new(gb.outputs["Normal"], bsdf.inputs["Normal"])
ground.data.materials.append(gm)
bpy.ops.object.shade_smooth()
disp2_tex = bpy.data.textures.new("RegolithFine", "CLOUDS")
disp2_tex.noise_scale = 0.8
disp2 = ground.modifiers.new("DispFine", "DISPLACE")
disp2.texture = disp2_tex
disp2.strength = 0.08

# Scattered rocks
import random
random.seed(7)
rock_mat = bpy.data.materials.new("RockMat")
rock_mat.use_nodes = True
rb = rock_mat.node_tree.nodes["Principled BSDF"]
rb.inputs["Base Color"].default_value = (0.07, 0.068, 0.065, 1)
rb.inputs["Roughness"].default_value = 0.95
rn = rock_mat.node_tree.nodes.new("ShaderNodeTexNoise")
rn.inputs["Scale"].default_value = 25
rn.inputs["Detail"].default_value = 12
rbump = rock_mat.node_tree.nodes.new("ShaderNodeBump")
rbump.inputs["Strength"].default_value = 0.8
rock_mat.node_tree.links.new(rn.outputs["Fac"], rbump.inputs["Height"])
rock_mat.node_tree.links.new(rbump.outputs["Normal"], rb.inputs["Normal"])
rock_tex = bpy.data.textures.new("RockDisp", "VORONOI")
rock_tex.noise_scale = 0.4
for i in range(140):
    r = random.uniform(4.0, 45.0)
    a = random.uniform(0, 2 * math.pi)
    size = random.uniform(0.03, 0.22) * (1.8 if random.random() < 0.08 else 1.0)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=size,
                                          location=(r * math.cos(a), r * math.sin(a), -size * 0.35))
    rock = bpy.context.active_object
    rock.scale = (random.uniform(0.8, 1.4), random.uniform(0.8, 1.4), random.uniform(0.5, 0.9))
    rock.rotation_euler = (random.random() * 3, random.random() * 3, random.random() * 3)
    d = rock.modifiers.new("D", "DISPLACE")
    d.texture = rock_tex
    d.strength = size * 0.5
    bpy.ops.object.shade_smooth()
    rock.data.materials.append(rock_mat)

# Keep the lander's footpads on the displaced surface: lift it a little
root.location.z += 0.05

# Sun low over the horizon, as at the south pole
sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
sun.data.energy = 7.0
sun.data.angle = math.radians(0.53)
sun.data.color = (1.0, 0.98, 0.95)
sun.rotation_euler = (math.radians(90 - 12), 0, math.radians(55))
scene.collection.objects.link(sun)

# Faint fill so the shadow side is readable (earthshine / regolith bounce)
fill = bpy.data.objects.new("Fill", bpy.data.lights.new("Fill", "SUN"))
fill.data.energy = 0.12
fill.data.color = (0.7, 0.8, 1.0)
fill.rotation_euler = (math.radians(60), 0, math.radians(140))
scene.collection.objects.link(fill)

world = scene.world
wn = world.node_tree.nodes
wn["Background"].inputs["Color"].default_value = (0, 0, 0, 1)
wn["Background"].inputs["Strength"].default_value = 0.0

# Earth hanging low on the horizon
bpy.ops.mesh.primitive_uv_sphere_add(radius=9, location=(-346, 200, 70), segments=64, ring_count=32)
earth = bpy.context.active_object
earth.name = "Earth"
bpy.ops.object.shade_smooth()
em = bpy.data.materials.new("EarthMat")
em.use_nodes = True
eb = em.node_tree.nodes["Principled BSDF"]
en = em.node_tree.nodes.new("ShaderNodeTexNoise")
en.inputs["Scale"].default_value = 3
en.inputs["Detail"].default_value = 6
er = em.node_tree.nodes.new("ShaderNodeValToRGB")
er.color_ramp.elements[0].color = (0.02, 0.08, 0.3, 1)
er.color_ramp.elements[0].position = 0.5
er.color_ramp.elements[1].position = 0.62
er.color_ramp.elements[1].color = (0.95, 0.95, 0.97, 1)
em.node_tree.links.new(en.outputs["Fac"], er.inputs["Fac"])
em.node_tree.links.new(er.outputs["Color"], eb.inputs["Base Color"])
earth.data.materials.append(em)

# ---------------------------------------------------------------- render setup
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
for backend in ("OPTIX", "CUDA"):
    try:
        prefs.compute_device_type = backend
        prefs.get_devices()
        if any(d.type == backend for d in prefs.devices):
            for d in prefs.devices:
                d.use = d.type == backend
            scene.cycles.device = "GPU"
            print("Using", backend)
            break
    except TypeError:
        continue
scene.cycles.samples = samples
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = 1600, 1000
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = -0.2

cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
cam.data.lens = 40
scene.collection.objects.link(cam)
scene.camera = cam

shots = {
    "hero": (Vector((7.5, -9.0, 1.4)), Vector((0, 0, 2.0))),
    "low": (Vector((-4.5, -6.5, 0.5)), Vector((0, 0, 2.3))),
    "top": (Vector((5.0, 4.5, 6.5)), Vector((0, 0, 2.2))),
}
for name, (loc, target) in shots.items():
    cam.location = loc
    cam.rotation_euler = (target - loc).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = os.path.join(out_dir, f"athena_{name}.png")
    bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out_dir, "athena.blend"))
print("DONE")
