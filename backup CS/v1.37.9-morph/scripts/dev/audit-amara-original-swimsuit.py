#!/usr/bin/env python3
"""Read-only audit of the source Rocketbox swimsuit versus ALL Amara outfit hideBody masks.

The Rocketbox source swimsuit is SCULPTED INTO THE BODY; flattened cloth in the generator
does not remove the shipped body underneath. This probe identifies unmasked triangles
on the old swimsuit's UV islands without touching GLBs or skin weights.

Run: python3 scripts/dev/audit-amara-original-swimsuit.py
Set AMARA_AUDIT_STRICT=1 only after the leak is corrected and the UV criteria verified.
"""
import base64
import json
import math
import os
import pathlib
import struct
import sys

ROOT = pathlib.Path("public/coaches/mma-amara")
OUTFITS = ("boxe", "kickboxing", "muaythai", "mma", "bjj", "bjj-nogi", "judo")
COMP = {5120: ("b", 1), 5121: ("B", 1), 5122: ("h", 2), 5123: ("H", 2), 5125: ("I", 4), 5126: ("f", 4)}
SIZES = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def glb(path):
    data = path.read_bytes()
    assert len(data) > 20 and data[:4] == b"glTF" and struct.unpack_from("<II", data, 4) == (2, len(data)), path
    n, off = struct.unpack_from("<II", data, 12)
    assert off == 0x4E4F534A, path
    doc = json.loads(data[20:20 + n])
    p = 20 + n
    while p + 8 <= len(data):
        count, kind = struct.unpack_from("<II", data, p)
        p += 8
        if kind == 0x004E4942:
            return doc, data[p:p + count]
        p += count
    raise RuntimeError("No BIN chunk in " + str(path))


def accessor(doc, binary, i):
    a = doc["accessors"][i]
    if "sparse" in a:
        raise ValueError("Sparse accessor not supported for this audit")
    view = doc["bufferViews"][a["bufferView"]]
    if "extensions" in view:
        raise ValueError("Compressed GLB buffer view cannot be audited without decoding")
    code, size = COMP[a["componentType"]]
    n = SIZES[a["type"]]
    stride = view.get("byteStride", size * n)
    offset = view.get("byteOffset", 0) + a.get("byteOffset", 0)
    fmt = "<" + code * n
    return [struct.unpack_from(fmt, binary, offset + stride * k) for k in range(a["count"])]


def mask(path):
    doc, _ = glb(path)
    found = [(n.get("extras") or {}) for n in doc.get("nodes", []) if (n.get("extras") or {}).get("hideBody")]
    if len(found) != 1:
        raise AssertionError(f"{path}: expected exactly one hideBody, got {len(found)}")
    e = found[0]
    raw = base64.b64decode(e["hideBody"], validate=True)
    assert len(raw) % 6 == 0, (path, len(raw))
    return set(struct.iter_unpack("<hhh", raw)), int(e.get("hideScale", 1000))


def all_source_faces(doc, binary):
    """Body-only triangles: positions remain in FILE coordinates, same as hideBody keys."""
    faces = []
    for m in doc.get("meshes", []):
        for p in m.get("primitives", []):
            material = doc["materials"][p.get("material", 0)]["name"].lower()
            if "body" not in material or not all(k in p["attributes"] for k in ("POSITION", "TEXCOORD_0")):
                continue
            positions = accessor(doc, binary, p["attributes"]["POSITION"])
            uvs = accessor(doc, binary, p["attributes"]["TEXCOORD_0"])
            if "indices" not in p:
                idx = list(range(len(positions)))
            else:
                idx = [x[0] for x in accessor(doc, binary, p["indices"])]
            if len(idx) % 3:
                raise AssertionError("non-triangular source mesh")
            for t in range(0, len(idx), 3):
                inds = idx[t:t + 3]
                if min(positions[j][1] for j in inds) <= 1.15:
                    continue
                vs = [uvs[j][1] for j in inds]
                # Blender flips glTF V on import; report both ends to identify the true old-bikini island.
                if max(vs) < 0.22:
                    island = "lowV"
                elif min(vs) > 0.78:
                    island = "highV"
                else:
                    continue
                faces.append((island, tuple(positions[j] for j in inds)))
    return faces


def main():
    doc, binary = glb(ROOT / "photo.glb")
    faces = all_source_faces(doc, binary)
    counts = {i: sum(f[0] == i for f in faces) for i in ("lowV", "highV")}
    print("Original source bikini UV islands by orientation:", counts, flush=True)
    if not faces:
        raise AssertionError("no bikini candidate triangles: audit cannot validate anything")
    # 1.37.7 identified 4,416 *Blender* faces in the original bikini islands.
    # After GLB conversion those island UVs can be inverted; explicit report avoids a silent false pass.
    candidate = min(("lowV", "highV"), key=lambda k: abs(counts[k] - 4416))
    print("Candidate island (closest to 4,416 audited in Blender):", candidate, flush=True)
    if abs(counts[candidate] - 4416) > 2500:
        raise AssertionError("bikini UV island changed substantially; review source before trusting audit")
    failures = []
    for name in OUTFITS:
        hidden, scale = mask(ROOT / "tenues" / (name + ".glb"))
        def key(pos):
            return tuple(math.floor(v * scale + 0.5) for v in pos)
        considered = 0
        completely_removed = 0
        partially_visible = 0
        fully_visible = 0
        matched_corners = 0
        for island, triangle in faces:
            if island != candidate:
                continue
            considered += 1
            n = sum(key(p) in hidden for p in triangle)
            matched_corners += n
            if n == 3: completely_removed += 1
            elif n > 0: partially_visible += 1
            else: fully_visible += 1
        # The game removes a triangle ONLY when all 3 of its corners are hidden.
        left = partially_visible + fully_visible
        print(f"{name:11} old bikini UV triangles: {considered:5} | removed {completely_removed:5} | "
              f"still drawn {left:5} (partly hidden {partially_visible}, fully uncovered {fully_visible}) | "
              f"mask key hits {matched_corners}/{considered * 3}", flush=True)
        if left:
            failures.append((name, left))
    print("Original swimsuit geometry still drawn with LEGACY body (diagnostic only):", failures, flush=True)
    # v1.37.9: garments draw on the CLEAN source, which retains the SAME original
    # triangle indices but whose old bikini UV region is repainted as natural
    # skin. Counting visible triangles of that now-normal skin must NOT be treated
    # as old bikini visibility. Strict mode checks the actual displayed asset.
    if os.environ.get("AMARA_AUDIT_STRICT") == "1":
        cleaned = ROOT / "photo-clean.glb"
        assert cleaned.is_file(), "Outfit-only cleaned source missing: " + str(cleaned)
        model, output = glb(cleaned)
        extras = model["meshes"][0].get("extras", {})
        assert extras.get("cssAmaraSurfacePrototype") == "bikini-geometry-cleaned-v1379", extras
        assert extras.get("cssOriginalBikiniRepaint") == "body-skin-uv-1379", extras
        assert int(extras.get("cssOriginalBikiniRepaintPixels", 0)) > 30000, extras
        assert model["meshes"][0]["extras"]["targetNames"][-1] == "CSS_CleanBikini"
        assert model["meshes"][0]["weights"][-1] == 1.0
        assert len(model["meshes"][0]["extras"]["targetNames"]) == 26
        assert len(model["meshes"][0]["primitives"]) == len(doc["meshes"][0]["primitives"]) == 3
        assert model["textures"] == doc["textures"], "Texture indices unexpectedly changed"
        for oldp, newp in zip(doc["meshes"][0]["primitives"], model["meshes"][0]["primitives"]):
            assert oldp["attributes"] == newp["attributes"] and oldp["indices"] == newp["indices"], (
                "Outfit mask source positions were changed")
            assert oldp["targets"] == newp["targets"][:-1], "25 facial morphs changed"
        old_ims = {im["name"]: im for im in doc["images"]}
        new_ims = {im["name"]: im for im in model["images"]}
        assert old_ims.keys() == new_ims.keys(), "Original head images removed"
        def image_bytes(data, filedoc, im):
            view = filedoc["bufferViews"][im["bufferView"]]
            off, size = view.get("byteOffset", 0), view["byteLength"]
            return data[off:off + size]
        changed = []
        for name in old_ims:
            different = image_bytes(binary, doc, old_ims[name]) != image_bytes(output, model, new_ims[name])
            if name in ("f021_body_color", "f021_body_normal"):
                assert different, "Old bikini texture remains: " + name
                changed.append(name)
            else:
                assert not different, "Head/face texture unexpectedly changed: " + name
        assert sorted(changed) == ["f021_body_color", "f021_body_normal"]
        for name in OUTFITS:
            mask(ROOT / "tenues" / (name + ".glb"))
        print("STRICT PASS: 7 original position masks + 2 repainted body textures +"
              " 25 facial morphs + untouched head + clean morph", flush=True)
    print("Read-only source audit finished; animated visual review is separately required.", flush=True)


if __name__ == "__main__":
    main()
