#!/usr/bin/env python3
"""Validate generated JJB No-Gi GLBs without external Python dependencies."""
import json
import pathlib
import struct
import sys

PALETTES = {
    "inaya": ("#48203F", "#19151C", "#EA4E92"),
    "mma-amara": ("#151419", "#1D1B20", "#D4AF37"),
    "mma-kadir": ("#17191D", "#292D34", "#D73B42"),
    "nael": ("#152943", "#111821", "#2F8CEB"),
}


def load_glb(path):
    data = path.read_bytes()
    if len(data) < 20 or data[:4] != b"glTF":
        raise ValueError("Invalid GLB header")
    version, total = struct.unpack_from("<II", data, 4)
    if version != 2 or total != len(data):
        raise ValueError("Invalid GLB version or size")
    length, chunk_type = struct.unpack_from("<II", data, 12)
    if chunk_type != 0x4E4F534A or length + 20 > len(data):
        raise ValueError("Missing JSON chunk")
    return json.loads(data[20:20 + length])


def validate(coach, path):
    doc = load_glb(path)
    top, short, accent = PALETTES[coach]
    materials = [m.get("name", "") for m in doc.get("materials", [])]
    nodes = doc.get("nodes", [])
    meshes = doc.get("meshes", [])
    if not any("haut-rash-court-" + top in m for m in materials):
        raise ValueError("Missing coach-specific rashguard colour")
    if not any("short-mma-" + short in m for m in materials):
        raise ValueError("Missing coach-specific shorts colour")
    if not any("ceinture-mma-" + accent in m for m in materials):
        raise ValueError("Missing coach-specific waistband accent")
    if not meshes or not any(m.get("primitives") for m in meshes):
        raise ValueError("Missing mesh primitives")
    for mesh in meshes:
        for primitive in mesh.get("primitives", []):
            if "POSITION" not in primitive.get("attributes", {}):
                raise ValueError("Mesh primitive without POSITION")
    extras = [n.get("extras", {}) for n in nodes]
    if not any(e.get("outfit") == "bjj-nogi" and e.get("hideBody") for e in extras):
        raise ValueError("Missing hideBody metadata for app integration")
    if not doc.get("skins"):
        raise ValueError("Missing skin rig")
    print("PASS", coach, "meshes", len(meshes), "materials", len(materials), "skins", len(doc["skins"]))


def main():
    root = pathlib.Path(sys.argv[1])
    for coach in PALETTES:
        path = root / coach / "tenues" / "bjj-nogi.glb"
        if not path.is_file() or path.stat().st_size < 1024:
            raise ValueError("Missing or empty GLB: " + str(path))
        validate(coach, path)


if __name__ == "__main__":
    main()
