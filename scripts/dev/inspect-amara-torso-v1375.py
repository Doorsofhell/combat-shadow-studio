#!/usr/bin/env python3
"""Non-destructive, read-only audit of Amara's skin and clothing-source torso.
Run in Blender --background --python-exit-code 42 --python ... .
Outputs no model modifications. Compare with the cleaned reference Inaya.
"""
import bpy, json, os, numpy as np
from mathutils import Vector

ROOT = "public/coaches"
ZONES = ("cleavage", "cups", "back_neck", "back_chest")

def load(coach):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.abspath(f"{ROOT}/{coach}/photo.glb"))
    armatures = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    body = max(meshes, key=lambda o: len(o.data.vertices))
    arm = armatures[0]
    h = {b.name: arm.matrix_world @ b.head_local for b in arm.data.bones}
    chest = h["Spine2"]
    neck = h["Neck"]
    uv = body.data.uv_layers.active
    print(f"===== {coach} =====", flush=True)
    print("mesh vertices", len(body.data.vertices), "polygons", len(body.data.polygons),
          "shape_keys", len(body.data.shape_keys.key_blocks) if body.data.shape_keys else 0,
          "material names", [m.name for m in body.data.materials], flush=True)
    print("Spine2", tuple(round(v, 3) for v in chest),
          "Neck", tuple(round(v, 3) for v in neck), flush=True)
    pix = {}
    for m in body.data.materials:
        if m is None or not m.use_nodes:
            continue
        images = [n.image for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image]
        if not images:
            continue
        best = images[0]
        for n in m.node_tree.nodes:
            if n.type != 'TEX_IMAGE' or not n.image:
                continue
            if any(l.from_node == n and l.to_socket.name == "Base Color" for l in m.node_tree.links):
                best = n.image
                break
        w, ht = best.size
        if not w or not ht:
            continue
        ar = np.empty(w * ht * 4, dtype=np.float32)
        best.pixels.foreach_get(ar)
        pix[m.name] = (ar.reshape(ht, w, 4), best.name)
        print("image", m.name, best.name, f"{w}x{ht}", flush=True)

    collected = {k: [] for k in ZONES}
    dark_samples = {k: [] for k in ZONES}
    if uv:
        for poly in body.data.polygons:
            mat = body.data.materials[poly.material_index]
            if mat is None or mat.name not in pix:
                continue
            co = body.matrix_world @ poly.center
            ax, z = abs(co.x), co.z
            front = co.y < chest.y - 0.02
            back = co.y > chest.y + 0.02
            key = (
                "cleavage" if front and ax < .12 and chest.z - .085 < z < neck.z -.04
                else "cups" if front and .08 <= ax < .20 and chest.z - .085 < z < neck.z -.04
                else "back_neck" if back and ax < .155 and neck.z - .095 < z < neck.z + .02
                else "back_chest" if back and ax < .155 and chest.z -.08 < z < neck.z -.095
                else None
            )
            if key is None:
                continue
            # Body triangles carry face-corner UVs, sometimes split on the seam.
            uu = sum(uv.data[i].uv.x for i in poly.loop_indices) / len(poly.loop_indices)
            vv = sum(uv.data[i].uv.y for i in poly.loop_indices) / len(poly.loop_indices)
            ar, imagename = pix[mat.name]
            ph, pw = ar.shape[:2]
            u = min(pw - 1, max(0, int(uu * pw)))
            v = min(ph - 1, max(0, int(vv * ph)))
            rgb = ar[v, u, :3]
            lum = float(np.dot(rgb, [0.2126, .7152, .0722]))
            collected[key].append(lum)
            if lum < .16:
                dark_samples[key].append([round(float(x), 4) for x in (co.x, co.y, co.z, uu, vv, lum)])

    for key in ZONES:
        ar = np.array(collected[key])
        if not len(ar):
            print(key, "no samples", flush=True)
            continue
        print(key, "count", len(ar), "min", round(float(ar.min()), 3),
              "p10", round(float(np.quantile(ar, .1)), 3),
              "p50", round(float(np.median(ar)), 3),
              "p90", round(float(np.quantile(ar, .9)), 3),
              "black_lt016", sum(v < .16 for v in ar),
              "black_frac", round(float(np.mean(ar < .16)), 3),
              flush=True)
        print(key, "dark 8 samples", dark_samples[key][:8], flush=True)
    return {k: (len(collected[k]), len(dark_samples[k])) for k in ZONES}

if __name__ == "__main__":
    data = {coach: load(coach) for coach in ("mma-amara", "inaya")}
    os.makedirs("logs", exist_ok=True)
    with open("logs/amara-torso-audit.json", "w") as fp:
        json.dump(data, fp, indent=2)
    print("SUCCESS diagnostic only; neither GLB nor texture changed", flush=True)
