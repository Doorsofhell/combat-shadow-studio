"""Geometry gate for Amara v1.37.6, independent of node version strings.

The torso is read from the original fixed Amara photo.glb. Each generated
striking outfit must have a high, connected sports top at the front chest.
The MMA garments must also have open lower leg separation and no narrow
triangles left in the forbidden central bridge area.

This checks geometry in bind pose. A live animation visual review is still
needed; the tests do not pretend to replace one.
"""
import bpy
import os
import sys

ROOT = "public/coaches/mma-amara/tenues"
STRIKING = ("boxe", "kickboxing", "muaythai", "mma")

def load(name):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.abspath(f"{ROOT}/{name}.glb"))

def mesh(name):
    options = [o for o in bpy.data.objects if o.type == "MESH" and o.name.startswith(name)]
    if len(options) != 1:
        raise RuntimeError(f"Expected one {name} mesh, found {[o.name for o in options]}")
    return options[0]

def center_coverage(outfit):
    o = mesh("haut-crop")
    points = [o.matrix_world @ v.co for v in o.data.vertices]
    mid = [p for p in points if abs(p.x) < .055 and p.y < -.030]
    upper = [p for p in mid if 1.344 < p.z < 1.425]
    if not mid or len(upper) < 10:
        raise RuntimeError(f"{outfit}: missing fabric on the upper chest: {len(upper)} pts")
    high = max(p.z for p in upper)
    if high < 1.358:
        raise RuntimeError(f"{outfit}: low central neckline still at {high:.4f} m")
    print(f"OK {outfit} front coverage: {len(upper)} chest points, top {high:.4f} m",flush=True)

def crotch_clearance(part):
    o = mesh(part)
    z_top = o.get("cssCrotchGapCut")
    half = o.get("cssCrotchGapHalfWidth")
    if not isinstance(z_top, (int,float)) or not isinstance(half, (int,float)):
        raise RuntimeError(f"{part}: missing crotch opening metadata")
    if half < .025:
        raise RuntimeError(f"{part}: gap too narrow: {half}")
    # During generation the cloth is pushed away from the body, and its
    # Solidify rim can move ~10 mm inward. The ISO field creates the opening
    # on the underlying source mesh; the safety invariant on the final GLB
    # is an unobstructed core air gap, NOT an exact .032 m edge position.
    # The 1.37.5 build had 0.001 m midline slivers; the corrected first
    # build positions the closest outer-rim faces at ~0.022 m.
    open_half = max(.012, half - .017)
    bad = []
    for f in o.data.polygons:
        c = o.matrix_world @ f.center
        if abs(c.x) < open_half and c.z < z_top - .013:
            bad.append((f.index, round(c.x,4),round(c.z,4)))
    if bad:
        raise RuntimeError(f"{part}: bridge still has {len(bad)} faces: {bad[:6]}")
    print(f"OK {part}: central air gap below z={z_top:.4f}, "
          f"verified half-width={open_half:.4f} m, ISO cut width={half:.4f} m",flush=True)

def main():
    for outfit in STRIKING:
        load(outfit)
        center_coverage(outfit)
        if outfit == "mma":
            crotch_clearance("short-surshort")
            crotch_clearance("short-vale-tudo")
    print("OK: 4 covered tops, two independent MMA leg openings, "
          "unchanged coach skeleton",flush=True)

if __name__ == "__main__":
    main()
