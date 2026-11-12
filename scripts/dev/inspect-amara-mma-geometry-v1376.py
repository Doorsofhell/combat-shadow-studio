"""Read-only diagnosis: identify stretched triangles and crotch bridges in Amara MMA meshes.
Run with Blender --background --python ... ; never writes an asset.
"""
import bpy, os, math
from collections import defaultdict

p = os.path.abspath("public/coaches/mma-amara/tenues/mma.glb")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=p)
for o in bpy.data.objects:
    if o.type != 'MESH':
        continue
    print('OBJECT', o.name, 'vertices',len(o.data.vertices),'faces',len(o.data.polygons), flush=True)
    if not ('short-' in o.name or 'haut-' in o.name):
        continue
    bounds = defaultdict(list)
    slender = []
    midline = []
    for poly in o.data.polygons:
        vs = [o.matrix_world @ o.data.vertices[i].co for i in poly.vertices]
        z = sum(x.z for x in vs)/len(vs)
        if len(vs) != 3:
            continue
        lengths = sorted([(vs[i] - vs[(i+1)%3]).length for i in range(3)])
        elongation = lengths[-1]/max(0.0001,lengths[0])
        area = (vs[1]-vs[0]).cross(vs[2]-vs[0]).length*.5
        data = (round(z,3),round(sum(v.y for v in vs)/3,3),round(min(v.x for v in vs),3),round(max(v.x for v in vs),3),round(elongation,2),round(area,6),poly.index)
        if min(x.x for x in vs) < -.015 and max(x.x for x in vs) > .015:
            midline.append(data)
        if elongation > 12 or area < 1e-8:
            slender.append(data)
        if abs(sum(v.x for v in vs)/3) < .10 and z < 1.1 and z > .55:
            bounds[round(z*20)/20].append(data)
    print('MIDLINE',o.name,len(midline), 'LOWEST', sorted(midline,key=lambda x:x[0])[:30],flush=True)
    print('SLENDER',o.name,len(slender), 'top',sorted(slender,key=lambda x:-x[4])[:25],flush=True)
    for z, items in sorted(bounds.items()):
        unusual=[x for x in items if x[4]>5 or x[2]<-.05 and x[3]>.05]
        if unusual:
            print('SUSPICIOUS_Z',o.name,z,len(items),'bad',len(unusual),'top',sorted(unusual,key=lambda x:-x[4])[:7],flush=True)
print('DIAGNOSTIC COMPLETE no files changed',flush=True)
