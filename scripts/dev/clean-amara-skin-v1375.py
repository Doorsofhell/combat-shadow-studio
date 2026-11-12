#!/usr/bin/env python3
"""v1.37.5 — surgical retouch of Amara's BAKED bikini pigment.

Inaya is the cleaned template, but HER SKIN IS NOT copied wholesale onto Amara.
The script only replaces verified black bikini texels within the anatomical
torso/neck UV islands, matching Amara's existing skin colour. It patches embedded
GLB images without re-exporting the mesh: every vertex, skin, skeleton, bone
matrix and all 26 facial morph targets remain byte-identical.
Run: blender --background --python-exit-code 42 --python scripts/dev/clean-amara-skin-v1375.py
"""
import bpy
import io
import json
import os
import struct
import hashlib
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_dilation, gaussian_filter

PATH = "public/coaches/mma-amara/photo.glb"
REFERENCE = "public/coaches/inaya/photo.glb"
TARGET_VERSION = "1.37.5"
ALLOWED_BODY_SHA = "019edad919c9eedb6ad0bf2e080ec12e5f6330ce"

def glb_read(path):
    raw = open(path, "rb").read()
    if len(raw) < 28 or raw[:4] != b"glTF" or struct.unpack_from("<I", raw, 4)[0] != 2:
        raise RuntimeError("Invalid GLB " + path)
    if struct.unpack_from("<I", raw, 8)[0] != len(raw):
        raise RuntimeError("Invalid GLB total length " + path)
    offset, chunks = 12, {}
    while offset < len(raw):
        n, typ = struct.unpack_from("<I4s", raw, offset)
        offset += 8
        chunks[typ] = raw[offset:offset+n]
        offset += n
    if b"JSON" not in chunks or b"BIN\\x00" not in chunks:
        raise RuntimeError("Missing JSON/BIN GLB chunk")
    gltf = json.loads(chunks[b"JSON"])
    return gltf, chunks[b"BIN\\x00"], raw

def skin_image(gltf, binary, material_name):
    mid = next(i for i, m in enumerate(gltf["materials"]) if m.get("name") == material_name)
    tex_id = gltf["materials"][mid]["pbrMetallicRoughness"]["baseColorTexture"]["index"]
    image_id = gltf["textures"][tex_id]["source"]
    info = gltf["images"][image_id]
    bv_id = info["bufferView"]
    bv = gltf["bufferViews"][bv_id]
    raw = binary[bv.get("byteOffset", 0):bv.get("byteOffset", 0)+bv["byteLength"]]
    img = Image.open(io.BytesIO(raw)).convert("RGBA")
    return img, image_id, bv_id

def git_blob(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\\x00" + data).hexdigest()

def anatomy_masks(path, sizes):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.abspath(path))
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    body = max((o for o in bpy.data.objects if o.type == "MESH"), key=lambda o: len(o.data.vertices))
    h = {bone.name: arm.matrix_world @ bone.head_local for bone in arm.data.bones}
    chestz, neckz = h["Spine2"].z, h["Neck"].z
    uv = body.data.uv_layers.active
    if uv is None:
        raise RuntimeError("Body has no UV atlas")
    masks = {key: Image.new("L", sizes[key], 0) for key in sizes}
    drawers = {key: ImageDraw.Draw(im) for key, im in masks.items()}
    faces = {key: 0 for key in sizes}
    for poly in body.data.polygons:
        mat = body.data.materials[poly.material_index]
        if mat is None or mat.name not in masks:
            continue
        q = body.matrix_world @ poly.center
        if mat.name == "f021_body":
            inside = (abs(q.x) < .245 and chestz-.155 < q.z < neckz+.042)
        else:
            # Below the chin only — don't touch Amara's face/eyes/hair.
            inside = (abs(q.x) < .205 and neckz-.105 < q.z < neckz+.035)
        if not inside:
            continue
        w, ht = sizes[mat.name]
        pts = []
        for li in poly.loop_indices:
            u, v = uv.data[li].uv
            pts.append((max(0, min(w-1, int(u*(w-1)))),
                        max(0, min(ht-1, int((1-v)*(ht-1))))))
        if len(pts) >= 3:
            drawers[mat.name].polygon(pts, fill=255)
            faces[mat.name] += 1
    print("Anatomical mask faces:", faces, flush=True)
    for k, m in masks.items():
        print("Anatomical mask:", k, np.count_nonzero(np.asarray(m)), "pixels", flush=True)
    return masks

def repair_color(original, reference, region, part):
    aa = np.asarray(original, np.float32) / 255
    rr = np.asarray(reference, np.float32) / 255
    zone = np.asarray(region) > 0
    if aa.shape != rr.shape or zone.shape != aa.shape[:2]:
        raise RuntimeError("Amara/Inaya UV textures incompatible: " + part)
    if int(zone.sum()) < 500:
        raise RuntimeError("Missing UV torso mask: " + part)

    lum = lambda c: np.dot(c[..., :3], np.array([.2126, .7152, .0722], np.float32))
    a_lum, r_lum = lum(aa), lum(rr)
    good_ref = zone & (r_lum > .48)
    if int(good_ref.sum()) < 250:
        raise RuntimeError("Clean Inaya skin absent in comparable UV island: " + part)
    # Healthy Amara areas are darker than Inaya but retain natural photographic
    # grain. Estimate the colour correction from THEIR shared clean pixels.
    a_q = float(np.quantile(a_lum[good_ref], .79))
    healthy = good_ref & (a_lum >= a_q*.90) & (a_lum > .30)
    if int(healthy.sum()) < 100:
        raise RuntimeError("No clean Amara skin for colour calibration: " + part)
    source = np.maximum(rr[..., :3], .03)
    ratios = np.clip(aa[..., :3]/source, .15, 2)
    scale = np.clip(np.median(ratios[healthy], axis=0), .35, 1.05)
    relative = a_lum / np.maximum(r_lum, .05)
    healthy_ratio = float(np.median(relative[healthy]))
    # Require both an anatomical UV match AND a luminance discontinuity.
    dark = good_ref & (relative < healthy_ratio*.67) & (a_lum < a_q*.88)
    if part == "f021_body" and int(dark.sum()) < 300:
        raise RuntimeError("No old black bikini pigment found in body atlas")
    if int(dark.sum()) == 0:
        print(part, "no dark pigment; leaving image unchanged", flush=True)
        return None
    # Cover a few pixels of dark filtered bleed, not the surrounding natural skin.
    expanded = binary_dilation(dark, iterations=3) & zone & (r_lum > .44)
    alpha = np.clip(gaussian_filter(expanded.astype(np.float32), 1.6), 0, 1)[..., None]
    alpha *= zone[..., None]
    # Inaya's CLEAN texture supplies photographic skin grain, rescaled to
    # Amara's complexion. Never copy unrelated regions, hair, iris or clothes.
    clean = np.clip(rr[..., :3] * scale, 0, 1)
    fixed = aa.copy()
    fixed[..., :3] = aa[..., :3]*(1-alpha) + clean*alpha
    after = lum(fixed)
    before_dark = int((good_ref & (relative < healthy_ratio*.67)).sum())
    after_dark = int((good_ref & (after/np.maximum(r_lum, .05) < healthy_ratio*.67)).sum())
    print(part, "mask_pixels", int(zone.sum()), "dark_pixels", int(dark.sum()),
          "healthy_ratio", round(healthy_ratio, 3),
          "skin_scale", [round(float(x), 3) for x in scale],
          "black_before", before_dark, "black_after", after_dark, flush=True)
    if after_dark >= before_dark * .7:
        raise RuntimeError("Skin retouch not sufficiently effective: " + part)
    return Image.fromarray((fixed*255+.5).astype(np.uint8), "RGBA")

def patch_binary(gltf, binary, new_images):
    # Rewrite image bufferViews only. ALL other original bufferView payloads
    # are copied without changing a single geometry/skin/morph-target byte.
    views = gltf["bufferViews"]
    image_buffer_views = {}
    for image_id, (bv_id, img_bytes) in new_images.items():
        image_buffer_views[bv_id] = img_bytes
        gltf["images"][image_id]["mimeType"] = "image/png"
    newbin = bytearray()
    for idx in sorted(range(len(views)), key=lambda i: views[i].get("byteOffset", 0)):
        bv = views[idx]
        off, n = bv.get("byteOffset", 0), bv["byteLength"]
        old = binary[off:off+n]
        payload = image_buffer_views.get(idx, old)
        while len(newbin) % 4:
            newbin.append(0)
        bv["byteOffset"] = len(newbin)
        bv["byteLength"] = len(payload)
        newbin.extend(payload)
    while len(newbin) % 4:
        newbin.append(0)
    gltf["buffers"][0]["byteLength"] = len(newbin)
    gltf.setdefault("asset", {}).setdefault("extras", {})["css_clean_torso"] = TARGET_VERSION
    gltf.setdefault("asset", {}).setdefault("extras", {})["css_clean_reference"] = "inaya-texture-pattern"
    jsonbytes = json.dumps(gltf, ensure_ascii=False, separators=(",", ":")).encode()
    jsonbytes += b" " * (-len(jsonbytes) % 4)
    out = bytearray(struct.pack("<4sII", b"glTF", 2, 12+8+len(jsonbytes)+8+len(newbin)))
    out.extend(struct.pack("<I4s", len(jsonbytes), b"JSON"))
    out.extend(jsonbytes)
    out.extend(struct.pack("<I4s", len(newbin), b"BIN\\x00"))
    out.extend(newbin)
    return bytes(out)

def verify_mesh_unchanged(before, after, replaced_bvs):
    a, bin_a, _ = glb_read_bytes(before)
    b, bin_b, _ = glb_read_bytes(after)
    for key in ("meshes", "skins", "nodes", "accessors", "animations"):
        if a.get(key) != b.get(key):
            raise RuntimeError("Protected GLB rig/morph data changed: " + key)
    if a.get("materials") != b.get("materials"):
        raise RuntimeError("Protected GLB materials changed")
    for i in range(len(a["bufferViews"])):
        if i in replaced_bvs:
            continue
        av, bv = a["bufferViews"][i], b["bufferViews"][i]
        old = bin_a[av.get("byteOffset",0):av.get("byteOffset",0)+av["byteLength"]]
        new = bin_b[bv.get("byteOffset",0):bv.get("byteOffset",0)+bv["byteLength"]]
        if old != new:
            raise RuntimeError("Non-image GLB bytes changed: view " + str(i))
    return True

def glb_read_bytes(raw):
    chunks, pos = {}, 12
    while pos < len(raw):
        n, typ = struct.unpack_from("<I4s", raw, pos)
        pos += 8
        chunks[typ] = raw[pos:pos+n]
        pos += n
    return json.loads(chunks[b"JSON"]), chunks[b"BIN\\x00"], raw

def main():
    a, a_bin, old = glb_read(PATH)
    r, r_bin, _ = glb_read(REFERENCE)
    if git_blob(old) != ALLOWED_BODY_SHA:
        raise RuntimeError("Amara source GLB hash changed; redo skin audit before applying")
    images = {}
    sizes = {}
    for material in ("f021_body", "f021_head"):
        aa, img_id, bv_id = skin_image(a, a_bin, material)
        rr, _, _ = skin_image(r, r_bin, material)
        if aa.size != rr.size:
            raise RuntimeError("Inaya skin atlas incompatible: " + material)
        images[material] = (aa, rr, img_id, bv_id)
        sizes[material] = aa.size
    masks = anatomy_masks(PATH, sizes)
    replacements = {}
    for mat, (aa, rr, img_id, bv_id) in images.items():
        patched = repair_color(aa, rr, masks[mat], mat)
        if patched is not None:
            buf = io.BytesIO()
            patched.save(buf, "PNG", compress_level=6)
            replacements[img_id] = (bv_id, buf.getvalue())
    if "f021_body" not in images or len(replacements) == 0:
        raise RuntimeError("No skin textures were corrected")
    result = patch_binary(a, a_bin, replacements)
    verify_mesh_unchanged(old, result, {x[0] for x in replacements.values()})
    with open(PATH, "wb") as out:
        out.write(result)
    print("SUCCESS: Amara skin colour retouched, bone weights, 26 face keys and all mesh buffers unchanged",
          "new_size", len(result), "sha", git_blob(result), flush=True)

if __name__ == "__main__":
    main()
