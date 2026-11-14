"""Convert a Celestia binary .cmod model to Wavefront OBJ + MTL.

Usage: python cmod_to_obj.py <input.cmod> <output.obj> [texture_dir]
"""

import os
import struct
import sys

# Tokens
MATERIAL, END_MATERIAL = 1001, 1002
DIFFUSE, SPECULAR, SPEC_POWER, OPACITY, TEXTURE = 1003, 1004, 1005, 1006, 1007
MESH, END_MESH, VDESC, END_VDESC, VERTICES = 1009, 1010, 1011, 1012, 1013
EMISSIVE, BLEND = 1014, 1015

# Data types
T_FLOAT1, T_FLOAT2, T_FLOAT3, T_FLOAT4, T_STRING, T_UINT32, T_COLOR = 1, 2, 3, 4, 5, 6, 7

# Vertex semantics / formats
POSITION, NORMAL, TEXCOORD0 = 0, 3, 5
FORMAT_SIZE = {0: 4, 1: 8, 2: 12, 3: 16, 4: 4}

# Primitive types
TRI_LIST, TRI_STRIP, TRI_FAN = 0, 1, 2


class Reader:
    def __init__(self, data):
        self.d, self.p = data, 0

    def take(self, fmt):
        v = struct.unpack_from("<" + fmt, self.d, self.p)
        self.p += struct.calcsize("<" + fmt)
        return v if len(v) > 1 else v[0]

    def typed(self):
        t = self.take("H")
        if t == T_FLOAT1:
            return self.take("f")
        if t == T_FLOAT2:
            return self.take("2f")
        if t in (T_FLOAT3, T_COLOR):
            return self.take("3f")
        if t == T_FLOAT4:
            return self.take("4f")
        if t == T_UINT32:
            return self.take("I")
        if t == T_STRING:
            n = self.take("H")
            s = self.d[self.p:self.p + n].decode("latin-1")
            self.p += n
            return s
        raise ValueError(f"unknown data type {t} at {self.p}")


def parse(path):
    data = open(path, "rb").read()
    if not data.startswith(b"#celmodel_binary"):
        raise ValueError("not a binary cmod file")
    r = Reader(data)
    r.p = 16
    materials, meshes = [], []
    while r.p < len(data):
        tok = r.take("H")
        if tok == MATERIAL:
            m = {"diffuse": (0.8, 0.8, 0.8), "opacity": 1.0, "tex": None}
            while True:
                t = r.take("H")
                if t == END_MATERIAL:
                    break
                if t == DIFFUSE:
                    m["diffuse"] = r.typed()
                elif t in (SPECULAR, EMISSIVE):
                    m["spec" if t == SPECULAR else "emis"] = r.typed()
                elif t == SPEC_POWER:
                    m["spow"] = r.typed()
                elif t == OPACITY:
                    m["opacity"] = r.typed()
                elif t == BLEND:
                    r.take("h")
                elif t == TEXTURE:
                    sem = r.take("h")
                    name = r.typed()
                    if sem == 0:
                        m["tex"] = name
                else:
                    raise ValueError(f"bad material token {t} at {r.p}")
            materials.append(m)
        elif tok == MESH:
            assert r.take("H") == VDESC
            desc = []
            while True:
                sem = r.take("h")
                if sem == END_VDESC:
                    break
                desc.append((sem, r.take("h")))
            assert r.take("H") == VERTICES
            count = r.take("I")
            stride = sum(FORMAT_SIZE[f] for _, f in desc)
            pos, nrm, uv = [], [], []
            for i in range(count):
                base = r.p + i * stride
                off = 0
                for sem, f in desc:
                    if sem == POSITION:
                        pos.append(struct.unpack_from("<3f", data, base + off))
                    elif sem == NORMAL and f == 2:
                        nrm.append(struct.unpack_from("<3f", data, base + off))
                    elif sem == TEXCOORD0 and f == 1:
                        uv.append(struct.unpack_from("<2f", data, base + off))
                    off += FORMAT_SIZE[f]
            r.p += count * stride
            groups = []
            while True:
                t = r.take("h")
                if t == END_MESH:
                    break
                mat, n = r.take("I"), r.take("I")
                idx = struct.unpack_from(f"<{n}I", data, r.p)
                r.p += 4 * n
                tris = []
                if t == TRI_LIST:
                    tris = [idx[i:i + 3] for i in range(0, n - 2, 3)]
                elif t == TRI_STRIP:
                    for i in range(n - 2):
                        a, b, c = idx[i], idx[i + 1], idx[i + 2]
                        tris.append((a, b, c) if i % 2 == 0 else (b, a, c))
                elif t == TRI_FAN:
                    tris = [(idx[0], idx[i], idx[i + 1]) for i in range(1, n - 1)]
                groups.append((mat, tris))
            meshes.append({"pos": pos, "nrm": nrm, "uv": uv, "groups": groups})
        else:
            raise ValueError(f"unexpected token {tok} at {r.p}")
    return materials, meshes


def write_obj(materials, meshes, out_path, tex_dir):
    base = os.path.splitext(out_path)[0]
    mtl_name = os.path.basename(base) + ".mtl"
    with open(base + ".mtl", "w") as f:
        for i, m in enumerate(materials):
            f.write(f"newmtl mat{i}\nKd {m['diffuse'][0]} {m['diffuse'][1]} {m['diffuse'][2]}\n")
            f.write(f"d {m['opacity']}\n")
            if m["tex"]:
                tex = m["tex"]
                if tex_dir:
                    tex = os.path.relpath(os.path.join(tex_dir, tex), os.path.dirname(out_path) or ".")
                f.write(f"map_Kd {tex.replace(os.sep, '/')}\n")
            f.write("\n")
    vo = to = no = 1
    with open(out_path, "w") as f:
        f.write(f"mtllib {mtl_name}\n")
        for mi, mesh in enumerate(meshes):
            f.write(f"o mesh{mi}\n")
            for p in mesh["pos"]:
                f.write(f"v {p[0]} {p[1]} {p[2]}\n")
            has_n = len(mesh["nrm"]) == len(mesh["pos"])
            has_t = len(mesh["uv"]) == len(mesh["pos"])
            for n in mesh["nrm"] if has_n else []:
                f.write(f"vn {n[0]} {n[1]} {n[2]}\n")
            for t in mesh["uv"] if has_t else []:
                f.write(f"vt {t[0]} {t[1]}\n")
            for mat, tris in mesh["groups"]:
                f.write(f"usemtl mat{mat}\n")
                for tri in tris:
                    parts = []
                    for v in tri:
                        k, kt, kn = v + vo, v + to, v + no
                        if has_t and has_n:
                            parts.append(f"{k}/{kt}/{kn}")
                        elif has_n:
                            parts.append(f"{k}//{kn}")
                        elif has_t:
                            parts.append(f"{k}/{kt}")
                        else:
                            parts.append(str(k))
                    f.write("f " + " ".join(parts) + "\n")
            vo += len(mesh["pos"])
            to += len(mesh["uv"]) if has_t else 0
            no += len(mesh["nrm"]) if has_n else 0


def main():
    src, dst = sys.argv[1], sys.argv[2]
    tex_dir = sys.argv[3] if len(sys.argv) > 3 else None
    materials, meshes = parse(src)
    write_obj(materials, meshes, dst, tex_dir)
    tris = sum(len(t) for m in meshes for _, t in m["groups"])
    print(f"{len(materials)} materials, {len(meshes)} meshes, {tris} triangles")
    for i, m in enumerate(materials):
        print(i, m)


if __name__ == "__main__":
    main()
