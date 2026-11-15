"""Equirectangular-UV high-res unit sphere (radius 1 m = 100 cm in UE) -> data/unreal/meshes/uvsphere.glb

Frame: MOON_ME (right-handed, z north, lon 0 -> +x, east -> +y).
Unreal's glTF import maps UE=(gx, gz, gy), so we write glTF=(x, z, -y): the scene then uses
UE=(x, -y, z) (MIRROR_Y=True in ue_build_scene.py), which keeps true chirality (east on the right seen from Earth).
UV: u = (lon+180)/360, v flipped for glTF (origin top-left).
"""
import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from glb_writer import write_glb

ROOT = Path(__file__).resolve().parent.parent
NLON, NLAT = 360, 180

lon = np.linspace(-np.pi, np.pi, NLON + 1)
lat = np.linspace(np.pi / 2, -np.pi / 2, NLAT + 1)      # north -> south
LON, LAT = np.meshgrid(lon, lat)
x = np.cos(LAT) * np.cos(LON)
y = np.cos(LAT) * np.sin(LON)
z = np.sin(LAT)

pos = np.stack([x, z, -y], axis=-1).reshape(-1, 3)       # glTF axes
nrm = pos.copy()
u = (LON + np.pi) / (2 * np.pi)
v = (np.pi / 2 - LAT) / np.pi                            # 0 at north (top of image)
uv = np.stack([u, v], axis=-1).reshape(-1, 2)

W = NLON + 1
r, c = np.meshgrid(np.arange(NLAT), np.arange(NLON), indexing="ij")
i0 = (r * W + c).ravel(); i1 = i0 + 1; i2 = i0 + W; i3 = i2 + 1
# Axis swap (x,z,-y) mirrors the mesh; reverse winding so faces point outward after Unreal's import
idx = np.concatenate([np.stack([i0, i2, i1], -1), np.stack([i1, i2, i3], -1)], axis=0)

out = ROOT / "data" / "unreal" / "meshes" / "uvsphere.glb"
write_glb(out, pos, nrm, uv, idx, name="UVSphere")
print("written:", out, "(%d verts, %d tris)" % (len(pos), len(idx)))
