#!/usr/bin/env python3
"""Append an Amara-only 'CSS_CleanBikini' glTF morph, leaving ALL original base buffers intact.

Why a morph target? Every one of Amara's 7 existing hideBody masks is keyed to the
ORIGINAL base positions. Changing POSITION would invalidate the masks and expose skin.
A default-on mesh morph and a runtime bake preserve masks and the original 25 face
expressions. This prototype DOES NOT edit textures: colour removal is a separate gate.
"""
from __future__ import annotations
import json, os, struct, sys
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree

src, delta_npz, dst = map(Path, sys.argv[1:4])
if src.resolve() == dst.resolve():
    raise RuntimeError('Use an isolated destination; never edit source in place')
raw=src.read_bytes()
assert raw[:4] == b'glTF' and struct.unpack_from('<I',raw,4)[0] == 2
old_n=struct.unpack_from('<I',raw,8)[0]; assert old_n == len(raw)
p=12; chunks=[]
while p < len(raw):
    n,typ=struct.unpack_from('<II',raw,p);p+=8
    chunks.append((typ,raw[p:p+n]));p+=n
assert chunks[0][0]==0x4E4F534A and chunks[1][0]==0x004E4942 and len(chunks)==2
doc=json.loads(chunks[0][1]);blob=bytearray(chunks[1][1])
mesh=doc['meshes'][0];faces=mesh['primitives']
names=mesh.get('extras',{}).get('targetNames',[])
assert len(names)==25, ('Unexpected existing face targets',len(names))
assert 'CSS_CleanBikini' not in names
assert all(len(pr.get('targets',[]))==25 for pr in faces)
body_attr=faces[0]['attributes']; assert doc['materials'][faces[0]['material']]['name']=='f021_body'
mapping=np.load(delta_npz)
old=np.asarray(mapping['source_xyz'],dtype=np.float64)
new=np.asarray(mapping['cleaned_xyz'],dtype=np.float64)
assert old.shape == new.shape and old.shape[1] == 3
b_delta=new-old

def attr(i):
    a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']]
    assert a['componentType']==5126 and a['type']=='VEC3' and 'sparse' not in a
    n=a['count'];o=v.get('byteOffset',0)+a.get('byteOffset',0)
    stride=v.get('byteStride',12)
    if stride==12:
        return np.frombuffer(blob,dtype='<f4',count=n*3,offset=o).reshape(n,3).copy()
    return np.asarray([struct.unpack_from('<fff',blob,o+j*stride) for j in range(n)],dtype='<f4')

# Choose importer axis conversion using measured rest positions, never infer by name.
original=attr(body_attr['POSITION']);sample=original[::max(1,len(original)//200)]
best=None
import itertools
for perm in itertools.permutations((0,1,2)):
    for signs in itertools.product((-1,1),repeat=3):
        oriented=old[:,perm]*np.asarray(signs)
        tree=cKDTree(oriented)
        dd,_=tree.query(sample)
        rms=float(np.percentile(dd,95))
        if best is None or rms<best[0]:
            best=(rms,perm,signs,tree,oriented)
score,perm,signs,tree,oriented=best
assert score<2e-5, ('Cannot map Blender original vertices to shipped GLB',score,perm,signs)
new_glb=new[:,perm]*np.asarray(signs)
counts=[]
for j,pr in enumerate(faces):
    xyz=attr(pr['attributes']['POSITION'])
    if j==0:
        ds,ii=tree.query(xyz)
        assert (ds<2e-5).sum() >= int(0.995*len(ds)), ('source coordinate mismatch',int((ds<2e-5).sum()),len(ds))
        delta=(new_glb[ii]-xyz).astype('<f4')
        delta[ds>=2e-5]=0
    else:
        delta=np.zeros_like(xyz,dtype='<f4')
    counts.append((len(delta),int(np.sum(np.linalg.norm(delta,axis=1)>0.0003))))
    while len(blob)%4:blob.append(0)
    start=len(blob);blob.extend(delta.tobytes())
    view_id=len(doc['bufferViews'])
    doc['bufferViews'].append({'buffer':0,'byteOffset':start,'byteLength':delta.nbytes})
    accessor_id=len(doc['accessors'])
    doc['accessors'].append({'bufferView':view_id,'componentType':5126,'count':len(delta),
                             'type':'VEC3','min':delta.min(axis=0).tolist(),
                             'max':delta.max(axis=0).tolist()})
    pr['targets'].append({'POSITION':accessor_id})
mesh['extras']['targetNames'].append('CSS_CleanBikini')
if 'weights' in mesh:
    assert len(mesh['weights'])==25
    mesh['weights'].append(1.0)
else:mesh['weights']=[0.0]*25+[1.0]
for nd in doc['nodes']:
    if nd.get('mesh')==0 and 'weights' in nd:
        assert len(nd['weights'])==25
        nd['weights'].append(1.0)
mesh['extras']['cssAmaraSurfacePrototype']='bikini-geometry-cleaned-v1379'
mesh['extras']['cssMaskUsesOriginalBase']=True
assert counts[0][1]>100 and counts[1][1]==0 and counts[2][1]==0
doc['buffers'][0]['byteLength']=len(blob)
jdat=json.dumps(doc,separators=(',',':'),ensure_ascii=False).encode()
jdat+=b' ' * ((-len(jdat))%4)
while len(blob)%4:blob.append(0)
total=12+8+len(jdat)+8+len(blob)
out=(b'glTF'+struct.pack('<II',2,total)+struct.pack('<II',len(jdat),0x4E4F534A)+jdat+
     struct.pack('<II',len(blob),0x004E4942)+blob)
dst.parent.mkdir(parents=True,exist_ok=True)
dst.write_bytes(out)
print('CLEAN_MORPH created',dst,'axis',perm,signs,'fit_p95',score,
      'moved (body, head, eyes)',counts,'output_bytes',len(out),flush=True)
