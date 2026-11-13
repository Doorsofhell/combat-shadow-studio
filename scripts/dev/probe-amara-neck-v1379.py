#!/usr/bin/env python3
"""Read-only inspection of remaining dark neckline / old halter strap. Does NOT repaint head."""
import io
from pathlib import Path
import numpy as np
from PIL import Image
from importlib.machinery import SourceFileLoader
a=SourceFileLoader('glb_probe','scripts/dev/audit-amara-original-swimsuit.py').load_module()
doc,blob=a.glb(Path('public/coaches/mma-amara/photo.glb'))
for pno,p in enumerate(doc['meshes'][0]['primitives'][:2]):
    mat=doc['materials'][p['material']]
    tex_idx=mat['pbrMetallicRoughness']['baseColorTexture']['index']
    im_idx=doc['textures'][tex_idx]['source']
    im=doc['images'][im_idx]
    view=doc['bufferViews'][im['bufferView']]
    raw=blob[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]
    img=np.asarray(Image.open(io.BytesIO(raw)).convert('RGB'))
    xyz=np.asarray(a.accessor(doc,blob,p['attributes']['POSITION']),dtype=np.float64)
    uv=np.asarray(a.accessor(doc,blob,p['attributes']['TEXCOORD_0']),dtype=np.float64)
    ii=np.asarray(a.accessor(doc,blob,p['indices']),dtype=np.int32).reshape(-1,3)
    mid=xyz[ii].mean(axis=1);uvmid=uv[ii].mean(axis=1)
    x=np.clip(np.round(uvmid[:,0]*(img.shape[1]-1)).astype(int),0,img.shape[1]-1)
    y=np.clip(np.round(uvmid[:,1]*(img.shape[0]-1)).astype(int),0,img.shape[0]-1)
    rgb=img[y,x]
    print('MATERIAL',pno,mat['name'],'image',im['name'],'raster',img.shape,'worldXYZ min/max',xyz.min(axis=0),xyz.max(axis=0),flush=True)
    for side,sg in [('back',-1),('front',1)]:
        for lo,hi in [(1.2,1.3),(1.3,1.4),(1.4,1.5),(1.5,1.6),(1.6,1.7),(1.7,1.8)]:
            sel=(mid[:,1]>lo)&(mid[:,1]<hi)&(abs(mid[:,0])<0.20)&(mid[:,2]*sg>0.01)
            if not np.any(sel):continue
            col=rgb[sel];ss=uvmid[sel]
            dark=(col[:,0]<85)&(col[:,1]<85)&(col[:,2]<85)
            print('NECK',pno,side,round(lo,2),round(hi,2),'tri',len(col),'dark',int(dark.sum()),'dark%=',round(100*dark.mean(),1),
                  'meanRGB',col.mean(axis=0).astype(int).tolist(),'UVv',np.round(np.percentile(ss[:,1],[0,25,50,75,100]),2).tolist())
            if dark.sum():
                cc=ss[dark]
                print('  DARK UV examples',np.round(cc[::max(1,len(cc)//8)][:9],3).tolist())
