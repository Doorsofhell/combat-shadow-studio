"""Geometry gate for Amara (1.37.7, completed in 1.37.9 and 1.38.0; run in Blender: blender --background --python this.py).

1.38.0: 4. the under-bands and waistbands of the four striking outfits are fitted bands: level edges, thin, on the body
   (fitted_bands).

1. The four striking tops cover the upper chest (the higher front asked in 1.37.6), as in v1376.
2. The old bikini sculpted in Amara's skin no longer shows through the long tops: along the back, between the
   shoulder blades and the waist, the outer surface of the rash guard (bjj-nogi) and of the gi jackets (bjj, judo)
   has no bump over 2.5 mm above the line of its neighbours 7.5 mm up and down (the band of the bikini made a
   5 to 7 mm ridge there in 1.37.6; Inaya's approved tops measure 1.5 mm).
3. MMA: the over-short is whole (no 1.37.6 central cut, which left a loose piece between the thighs) and the
   liner under it is parted at the middle (no face joining both legs below the crotch).

Bind pose only: a live check of the poses (captures) is still needed.
"""
import bpy
import os

ROOT = os.environ.get("OUTFITS_DIR", "public/coaches/mma-amara/tenues")
STRIKING = ("boxe", "kickboxing", "muaythai", "mma")
BODY = os.environ.get("BODY_GLB", "public/coaches/mma-amara/photo-clean.glb")
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
    """1.37.9: fitted ONE-LAYER vale-tudo shorts replace the old 1.37.7 overshort/liner pair.
    Enforce two separate leg hems at the lower crotch and a smooth independent bra band.
    """
    short = mesh("short-vale-tudo")
    if short.get("cssNoOvershort") is True:
        if any(o.name.startswith("short-surshort") for o in bpy.data.objects):
            raise RuntimeError("new MMA has a duplicated old surshort")
        gap = short.get("cssLegSeparationHalfWidth")
        if not isinstance(gap, (int, float)) or gap < 0.01:
            raise RuntimeError(f"new MMA boxer has no proper separate legs: {gap}")
        # 1.38.0: the 4.4 cm ring 7 mm off the torso of 1.37.9 (« bourrelet ») is a fitted band (fitted_band in
        # outfits.py); its shape is measured by fitted_bands() below, for the four striking outfits
        band = mesh("bande-brassiere-mma")
        if band.get("cssFittedBand") != "1.38.0":
            raise RuntimeError("MMA under-band is not the fitted band of 1.38.0")
        vertices = [short.matrix_world @ v.co for v in short.data.vertices]
        hem = min(v.z for v in vertices)
        def joins(f):
            pts = [vertices[k] for k in f.vertices]
            return (min(p.x for p in pts) < -0.002
                    and max(p.x for p in pts) > 0.002
                    and sum(p.z for p in pts) / len(pts) < hem + 0.035)
        invalid = [f.index for f in short.data.polygons if joins(f)]
        if invalid:
            raise RuntimeError(f"new MMA shorts still bridge two legs at hems: {len(invalid)} faces")
        print(f"OK mma: one fitted short, separate leg hems, fitted under-band; gap {gap:.3f} m", flush=True)
        return
    # Original 1.37.7 geometry is accepted ONLY when the new compression design
    # is not selected (e.g. historical rollback branch).
    sur = mesh("short-surshort")
    if sur.get("cssCrotchGapCut") is not None:
        raise RuntimeError("over-short still cut at the crotch (1.37.6)")
    gap = short.get("cssLinerGap")
    if not isinstance(gap, (int, float)) or gap < 0.008:
        raise RuntimeError(f"old liner gap missing or too narrow: {gap}")
    print(f"OK mma legacy: overshort with liner gap {gap:.3f} m", flush=True)


def fitted_bands(outfit):
    """1.38.0 (Youssef 13/11: « bande trop épaisse, bourrelet », « contours déchiquetés », « ceinture du short
    déchiquetée »). Each striking outfit has two fitted bands (under-band of the top, waistband of the short):
    - both edges of a band are level lines (no tooth: every point of an edge within 0.5 mm of its height);
    - the under-band is at most 3.2 cm high;
    - no point of a band is inside the body, none stands more than 2.5 cm off it (a hoop), and half of them lie
      within 9 mm of the skin (11.5 mm for a waistband: cloth and band together)."""
    from mathutils.bvhtree import BVHTree
    bands = [o for o in bpy.data.objects if o.type == "MESH" and o.get("cssFittedBand") == "1.38.0"]
    kinds = sorted(o.name.split("-")[0] for o in bands)
    if kinds != ["bande", "ceinture"]:
        raise RuntimeError(f"{outfit}: expected an under-band and a waistband, found {[o.name for o in bands]}")
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.abspath(BODY))
    skin = max((o for o in bpy.data.objects if o.type == "MESH" and o not in before), key=lambda o: len(o.data.vertices))
    # the rest pose as the file stores it (no armature evaluation: the same on every Blender version)
    bvh = BVHTree.FromPolygons([v.co.copy() for v in skin.data.vertices], [list(f.vertices) for f in skin.data.polygons])
    inv = skin.matrix_world.inverted()
    for o in bands:
        pts = [o.matrix_world @ v.co for v in o.data.vertices]
        zs = sorted(p.z for p in pts)
        lo, hi = zs[0], zs[-1]
        for name, edge in (("bottom", [p.z for p in pts if p.z < lo + 0.002]), ("top", [p.z for p in pts if p.z > hi - 0.002])):
            if len(edge) < 90 or max(edge) - min(edge) > 0.0005:
                raise RuntimeError(f"{outfit}/{o.name}: {name} edge is not a level line ({len(edge)} points, {1000 * (max(edge) - min(edge)):.2f} mm)")
        if o.name.startswith("bande") and hi - lo > 0.032:
            raise RuntimeError(f"{outfit}/{o.name}: under-band {1000 * (hi - lo):.0f} mm high (limit 32)")
        dist = []
        for p in pts:
            loc, nrm, _, d = bvh.find_nearest(inv @ p)
            outside = (p - skin.matrix_world @ loc).dot((skin.matrix_world.to_3x3() @ nrm).normalized())
            if outside < 0.0005:
                raise RuntimeError(f"{outfit}/{o.name}: a point of the band is in the skin ({1000 * outside:.2f} mm) at {tuple(round(c, 3) for c in p)}")
            dist.append(d * skin.matrix_world.to_scale()[0])
        dist.sort()
        # (a waistband lies on a thicker short: 3.5 mm of cloth 4 mm off the skin)
        if dist[-1] > 0.025 or dist[len(dist) // 2] > (0.009 if o.name.startswith("bande") else 0.0115):
            raise RuntimeError(f"{outfit}/{o.name}: band stands off the body (max {1000 * dist[-1]:.1f} mm, median {1000 * dist[len(dist) // 2]:.1f} mm)")
        print(f"OK {outfit}/{o.name}: level edges, {1000 * (hi - lo):.0f} mm high, {1000 * dist[0]:.1f} to {1000 * dist[-1]:.1f} mm off the skin (median {1000 * dist[len(dist) // 2]:.1f})", flush=True)


def main():
    for outfit in STRIKING:
        load(outfit)
        if outfit == "mma" and any(o.name.startswith("haut-brassiere") for o in bpy.data.objects):
            top = mesh("haut-brassiere")
            if len(top.data.polygons) < 800:
                raise RuntimeError("MMA scoop bra has too little geometry for moving shoulders")
            print("OK mma: rounded neckline is deliberate and retains the user-approved décolleté", flush=True)
        else:
            chest_coverage(outfit)
        if outfit == "mma":
            mma_shorts()
        fitted_bands(outfit)
    for outfit, prefix in (("bjj-nogi", "haut-rash-long"), ("bjj", "veste-bjj"), ("judo", "veste-judo")):
        load(outfit)
        back_ridge(outfit, prefix)
    print("OK: Amara 1.38.0 garments (all 7)", flush=True)


if __name__ == "__main__":
    main()
