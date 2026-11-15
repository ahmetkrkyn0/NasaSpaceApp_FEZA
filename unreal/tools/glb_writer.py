"""Minimal GLB (glTF 2.0 binary) yazici: tek mesh, POSITION/NORMAL/TEXCOORD_0 (+ istege bagli COLOR_0) + uint32 indeksler."""
import json
import struct
from pathlib import Path

import numpy as np


def write_glb(path, pos, nrm, uv, idx, name="Mesh", color=None):
    pos = np.ascontiguousarray(pos, dtype="<f4")
    nrm = np.ascontiguousarray(nrm, dtype="<f4")
    uv = np.ascontiguousarray(uv, dtype="<f4")
    idx = np.ascontiguousarray(idx, dtype="<u4").ravel()

    blobs = [pos.tobytes(), nrm.tobytes(), uv.tobytes(), idx.tobytes()]
    if color is not None:                                     # COLOR_0 (VEC4 float): kaya basina ton
        color = np.ascontiguousarray(color, dtype="<f4")
        blobs.append(color.tobytes())
    offs, o = [], 0
    for b in blobs:
        offs.append(o)
        o += len(b)
    binary = b"".join(blobs)
    binary += b"\x00" * (-len(binary) % 4)

    attrs = {"POSITION": 0, "NORMAL": 1, "TEXCOORD_0": 2}
    views = [
        {"buffer": 0, "byteOffset": offs[0], "byteLength": len(blobs[0]), "target": 34962},
        {"buffer": 0, "byteOffset": offs[1], "byteLength": len(blobs[1]), "target": 34962},
        {"buffer": 0, "byteOffset": offs[2], "byteLength": len(blobs[2]), "target": 34962},
        {"buffer": 0, "byteOffset": offs[3], "byteLength": len(blobs[3]), "target": 34963},
    ]
    accs = [
        {"bufferView": 0, "componentType": 5126, "count": len(pos), "type": "VEC3",
         "min": pos.min(axis=0).tolist(), "max": pos.max(axis=0).tolist()},
        {"bufferView": 1, "componentType": 5126, "count": len(nrm), "type": "VEC3"},
        {"bufferView": 2, "componentType": 5126, "count": len(uv), "type": "VEC2"},
        {"bufferView": 3, "componentType": 5125, "count": len(idx), "type": "SCALAR"},
    ]
    if color is not None:
        views.append({"buffer": 0, "byteOffset": offs[4], "byteLength": len(blobs[4]), "target": 34962})
        accs.append({"bufferView": 4, "componentType": 5126, "count": len(color), "type": "VEC4"})
        attrs["COLOR_0"] = 4

    doc = {
        "asset": {"version": "2.0", "generator": "feza"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": name}],
        "meshes": [{"name": name, "primitives": [{"attributes": attrs, "indices": 3, "mode": 4}]}],
        "buffers": [{"byteLength": len(binary)}],
        "bufferViews": views,
        "accessors": accs,
    }
    j = json.dumps(doc, separators=(",", ":")).encode()
    j += b" " * (-len(j) % 4)
    total = 12 + 8 + len(j) + 8 + len(binary)
    with open(path, "wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, total))
        f.write(struct.pack("<I4s", len(j), b"JSON") + j)
        f.write(struct.pack("<I4s", len(binary), b"BIN\x00") + binary)
    return Path(path)
