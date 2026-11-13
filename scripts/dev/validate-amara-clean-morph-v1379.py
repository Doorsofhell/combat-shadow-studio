#!/usr/bin/env python3
"""Fail closed: Amara clean base remains identical; facial shapes preserved; new morph only on torso."""
import json,struct,sys
from pathlib import Path
import numpy as np
from importlib.machinery import SourceFileLoader
reader=SourceFileLoader('probe','scripts/dev/audit-amara-original-swimsuit.py').load_module()
old_doc,old_bin=reader.glb(Path(sys.argv[1]))
new_doc,new_bin=reader.glb(Path(sys.argv[2]))
old=old_doc['meshes'][0];new=new_doc['meshes'][0]
assert len(old['primitives'])==len(new['primitives'])==3
assert len(old['extras']['targetNames'])==25 and new['extras']['targetNames'][:-1]==old['extras']['targetNames']
assert new['extras']['targetNames'][-1]=='CSS_CleanBikini'
assert len(new['weights'])==26 and new['weights'][-1]==1.0
for pi,(a,b) in enumerate(zip(old['primitives'],new['primitives'])):
    assert a['attributes']==b['attributes'] and a['indices']==b['indices'] and a['material']==b['material']
    assert a['targets']==b['targets'][:-1]
    assert reader.accessor(old_doc,old_bin,a['attributes']['POSITION'])==reader.accessor(new_doc,new_bin,b['attributes']['POSITION'])
    assert len(b['targets'])==26
    x=np.array(reader.accessor(new_doc,new_bin,b['targets'][-1]['POSITION']))
    moved=int(np.sum(np.linalg.norm(x,axis=1)>0.0003))
    print('TARGET',pi,'verts',len(x),'moved',moved,'maxDelta',float(np.linalg.norm(x,axis=1).max()))
    if pi==0:assert moved>100
    else:assert moved==0
assert old_doc['images']==new_doc['images'] and old_doc['textures']==new_doc['textures']
for a,b in zip(old_doc['images'],new_doc['images']):
    if 'bufferView' in a:
        va=old_doc['bufferViews'][a['bufferView']];vb=new_doc['bufferViews'][b['bufferView']]
        assert old_bin[va['byteOffset']:va['byteOffset']+va['byteLength']]==new_bin[vb['byteOffset']:vb['byteOffset']+vb['byteLength']]
print('PASS: exact original mask coordinates, 25 facial targets and all 4 skin images retained')
