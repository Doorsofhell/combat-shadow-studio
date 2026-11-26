#!/usr/bin/env python3
"""2.10.4 : recalcule le masque hideBody d'une tenue (faite sur un ancien corps) pour le corps actuel, point par point.

Usage : python3 tools/generator/rocketbox/remap_masque.py <ancien corps.glb> <corps actuel.glb> <tenue.glb> <sortie.glb>
Les deux corps doivent avoir les mêmes points dans le même ordre (même maillage Rocketbox, formes différentes).
"""
import json, struct, base64, sys
import numpy as np
def load(p):
    b=open(p,'rb').read(); n=struct.unpack('<I',b[12:16])[0]; js=json.loads(b[20:20+n]); o=20+n
    bl=struct.unpack('<I',b[o:o+4])[0]; return js, b[o+8:o+8+bl]
def acc(js,binb,i):
    a=js['accessors'][i]; v=js['bufferViews'][a['bufferView']]; off=v.get('byteOffset',0)+a.get('byteOffset',0)
    return np.frombuffer(binb,dtype=np.float32,count=a['count']*3,offset=off).reshape(-1,3)
def body_pos(p):
    js,b=load(p)
    for m in js['meshes']:
        for pr in m['primitives']:
            mat=js['materials'][pr['material']]['name'] if 'material' in pr else ''
            if 'body' in mat.lower(): return acc(js,b,pr['attributes']['POSITION'])
    raise SystemExit('pas de corps')
def save(p,js,binb):
    j=json.dumps(js,separators=(',',':')).encode(); j+=b' '*((4-len(j)%4)%4); bb=binb+b'\0'*((4-len(binb)%4)%4)
    out=struct.pack('<III',0x46546C67,2,12+8+len(j)+8+len(bb))+struct.pack('<II',len(j),0x4E4F534A)+j+struct.pack('<II',len(bb),0x004E4942)+bb
    open(p,'wb').write(out)
old_body, new_body, tenue_in, tenue_out = sys.argv[1:5]
A=body_pos(old_body); B=body_pos(new_body); assert A.shape==B.shape, (A.shape,B.shape)
js,binb=load(tenue_in)
n=0
for node in js['nodes']:
    ex=node.get('extras') or {}
    if 'hideBody' not in ex: continue
    sc=float(ex.get('hideScale',1000)); raw=base64.b64decode(ex['hideBody'])
    keys=set(struct.unpack_from('<3h',raw,o) for o in range(0,len(raw)-5,6))
    qa=np.round(A*sc).astype(np.int64); idx=[i for i in range(len(A)) if tuple(qa[i]) in keys]
    qb=np.round(B*sc).astype(np.int64); assert np.abs(qb).max()<32767
    new=sorted(set(tuple(int(x) for x in qb[i]) for i in idx))
    ex['hideBody']=base64.b64encode(b''.join(struct.pack('<3h',*k) for k in new)).decode()
    print(f'{tenue_in}: {len(keys)} clés, {len(idx)} points du corps retrouvés, {len(new)} nouvelles clés'); n+=1
assert n==1
save(tenue_out,js,binb)
