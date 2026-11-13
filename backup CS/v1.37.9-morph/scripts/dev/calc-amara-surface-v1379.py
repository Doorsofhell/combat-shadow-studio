#!/usr/bin/env python3
"""Blender-only: reuse the tested v1.37.7 folded-bikini smoothing on a disposable import.
Produces a position correspondence, NEVER exports a face/rig-modified source GLB.
Usage: blender --background --python calc-amara-surface-v1379.py -- source.glb /tmp/amara_morph.npz
"""
import ast, os, sys
import bpy
import numpy as np
from mathutils import Vector

src, out = sys.argv[sys.argv.index('--') + 1:sys.argv.index('--') + 3]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.abspath(src))
meshes = [o for o in bpy.data.objects if o.type == 'MESH' and
          any('f021_body' in m.name for m in o.data.materials if m)]
assert len(meshes) == 1, [(o.name, [m.name for m in o.data.materials]) for o in meshes]
body = meshes[0]
# Work solely on the imported disposable copy. Existing 25 live face morphs are preserved
# by the GLB binary patcher, not recalculated by Blender.
if body.data.shape_keys:
    body.shape_key_clear()
MW = body.matrix_world.copy()
before = np.array([tuple(MW @ v.co) for v in body.data.vertices], dtype=np.float64)
script = open('tools/generator/rocketbox/outfits.py', encoding='utf8').read()
fn = next(n for n in ast.parse(script).body if isinstance(n, ast.FunctionDef) and n.name == 'smooth_old_bikini')
scope = dict(np=np, MW=MW, os=os, Vector=Vector, BIKINI_MOVED=set(), UNDER_SKIN=set())
exec(compile(ast.Module(body=[fn], type_ignores=[]), 'outfits.py:smooth_old_bikini', 'exec'), scope)
amount = scope['smooth_old_bikini'](body, 3, 0.015)
assert amount >= 1000, 'Unexpected bikini UV candidate count'
after = np.array([tuple(MW @ v.co) for v in body.data.vertices], dtype=np.float64)
dist = np.linalg.norm(after - before, axis=1)
assert len(before) == len(after) and len(before) > 15000
assert (dist > .0003).sum() > 100, 'No actual source shape cleaned'
assert np.percentile(dist, 99.5) < .025, 'Gross surface displacement'
# Blender right-handed Z-up -> glTF Y-up positions.
np.savez_compressed(out, source_xyz=before, cleaned_xyz=after)
print('CLEAN_SURFACE calculated: vertices',len(before),'modified',int((dist>.0003).sum()),
      'max_m',float(dist.max()),'pct99_m',float(np.percentile(dist,99)),
      'source_saved',out,flush=True)
