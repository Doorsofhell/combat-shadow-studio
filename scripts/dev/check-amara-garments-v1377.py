"""Geometry gate for Amara v1.37.7 (run in Blender: blender --background --python this.py).

1. The four striking tops cover the upper chest (the higher front asked in 1.37.6), as in v1376.
2. The old bikini sculpted in Amara's skin no longer shows through the long tops: along the back, between the
   shoulder blades and the waist, the outer surface of the rash guard (bjj-nogi) and of the gi jackets (bjj, judo)
   has no bump over 2.5 mm above the line of its neighbours 7.5 mm up and down (the band of the bikini made a
   5 to 7 mm ridge there in 1.37.6; Inaya's approved tops measure 1.5 mm).
3. MMA: the over-short is whole (no 1.37.6 central cut, which left a loose piece between the thighs) and the
   liner under it is parted at the middle (no face within 6 mm of the middle below the crotch).

Bind pose only: a live check of the poses (captures) is still needed.
"""
import bpy
import os

ROOT = os.environ.get("OUTFITS_DIR", "public/coaches/mma-amara/tenues")
STRIKING = ("boxe", "kickboxing", "muaythai", "mma")
# measured 12/11 with this same probe: Amara 1.37.6 5.1 to 7.1 mm (the bikini band), Inaya (approved, body cleaned in
# 1.19) 1.3 to 1.5 mm, Amara 1.37.7 2.0 to 2.3 mm
RIDGE_MAX = 0.0025


def load(name):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.abspath(f"{ROOT}/{name}.glb"))


def mesh(prefix):
    found = [o for o in bpy.data.objects if o.type == "MESH" and o.name.startswith(prefix)]
    if len(found) != 1:
        raise RuntimeError(f"Expected one {prefix} mesh, found {[o.name for o in found]}")
    return found[0]


def chest_coverage(outfit):
    o = mesh("haut-crop")
    pts = [o.matrix_world @ v.co for v in o.data.vertices]
    upper = [p for p in pts if abs(p.x) < .055 and p.y < -.030 and 1.344 < p.z < 1.425]
    if len(upper) < 10 or max(p.z for p in upper) < 1.358:
        raise RuntimeError(f"{outfit}: upper chest not covered ({len(upper)} points)")
    print(f"OK {outfit}: chest covered up to {max(p.z for p in upper):.4f} m", flush=True)


def back_ridge(outfit, prefix):
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
    o = mesh(prefix)
    dg = bpy.context.evaluated_depsgraph_get()
    bvh = BVHTree.FromObject(o, dg)
    inv = o.matrix_world.inverted()
    def back_at(x, z):
        # the outermost surface of the back, hit by a ray coming from behind
        hit = bvh.ray_cast(inv @ Vector((x, 0.6, z)), (inv.to_3x3() @ Vector((0, -1, 0))).normalized())
        return (o.matrix_world @ hit[0]).y if hit[0] is not None else None
    worst, where = 0.0, None
    h = 0.0075
    for x in (-0.06, -0.03, 0.0, 0.03, 0.06):
        z = 1.17
        while z < 1.33:
            ys = [back_at(x, z - h), back_at(x, z), back_at(x, z + h)]
            if None not in ys:
                bump = ys[1] - (ys[0] + ys[2]) / 2
                if bump > worst:
                    worst, where = bump, (x, round(z, 3))
            z += 0.0025
    if worst > RIDGE_MAX:
        raise RuntimeError(f"{outfit}/{prefix}: ridge of {worst * 1000:.1f} mm across the back at {where} (old bikini band)")
    print(f"OK {outfit}/{prefix}: back smooth (largest bump {worst * 1000:.2f} mm at {where})", flush=True)


def mma_shorts():
    sur = mesh("short-surshort")
    if sur.get("cssCrotchGapCut") is not None:
        raise RuntimeError("over-short still cut at the crotch (1.37.6)")
    liner = mesh("short-vale-tudo")
    gap = liner.get("cssLinerGap")
    if not isinstance(gap, (int, float)) or gap < 0.008:
        raise RuntimeError(f"liner gap missing or too narrow: {gap}")
    zs = [(liner.matrix_world @ v.co).z for v in liner.data.vertices]
    crotch = max(zs) - 0.02
    bad = [f.index for f in liner.data.polygons if abs((liner.matrix_world @ f.center).x) < 0.006 and (liner.matrix_world @ f.center).z < crotch]
    if bad:
        raise RuntimeError(f"liner: {len(bad)} faces still join the two legs at the middle")
    print(f"OK mma: over-short whole, liner parted ({gap * 1000:.0f} mm each side)", flush=True)


def main():
    for outfit in STRIKING:
        load(outfit)
        chest_coverage(outfit)
        if outfit == "mma":
            mma_shorts()
    for outfit, prefix in (("bjj-nogi", "haut-rash-long"), ("bjj", "veste-bjj"), ("judo", "veste-judo")):
        load(outfit)
        back_ridge(outfit, prefix)
    print("OK: Amara 1.37.7 garments", flush=True)


if __name__ == "__main__":
    main()
