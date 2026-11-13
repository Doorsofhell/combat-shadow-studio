#!/usr/bin/env python3
"""Prototype-only: replace BODY UV triangles of the original Rocketbox bikini with natural
adjacent skin texture (colour and tangent normal). Existing UVs/face morphs/rig untouched.
Does not process the head/neck; final animated visual approval is still required.
Usage: python scripts/dev/repaint-amara-swimsuit-v1379.py clean_morph.glb clean_repaint.glb
"""
from __future__ import annotations
import io, json, math, struct, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt
from scipy.spatial import cKDTree
from importlib.machinery import SourceFileLoader

inspect=SourceFileLoader('amara_reader','scripts/dev/audit-amara-original-swimsuit.py').load_module()
src,dst=map(Path,sys.argv[1:3])
assert src.resolve()!=dst.resolve()
raw=src.read_bytes()
assert raw[:4]==b'glTF' and len(raw)==struct.unpack_from('<I',raw,8)[0]
p=12; chunks=[]
while p<len(raw):
    n,t=struct.unpack_from('<II',raw,p);p+=8
    chunks.append((t,raw[p:p+n]));p+=n
assert len(chunks)==2
doc=json.loads(chunks[0][1]);blob=bytearray(chunks[1][1])
prim=doc['meshes'][0]['primitives'][0]
assert doc['materials'][prim['material']]['name']=='f021_body'
xyz=np.asarray(inspect.accessor(doc,blob,prim['attributes']['POSITION']),np.float64)
uv=np.asarray(inspect.accessor(doc,blob,prim['attributes']['TEXCOORD_0']),np.float64)
indices=np.asarray(inspect.accessor(doc,blob,prim['indices']),np.int32).reshape(-1,3)
v=uv[indices,1]
height=xyz[indices,1].min(axis=1)
low=(v.max(axis=1)<0.22)&(height>1.15)
high=(v.min(axis=1)>0.78)&(height>1.15)
key=low if abs(int(low.sum())-4416)<abs(int(high.sum())-4416) else high
assert abs(int(key.sum())-4416)<200,'Original bikini island changed; abort'
assert doc['meshes'][0].get('extras',{}).get('cssAmaraSurfacePrototype')=='bikini-geometry-cleaned-v1379'
print('Original bikini faces',int(key.sum()),'skinnable non-bikini faces',int((~key).sum()),flush=True)

def load_embedded(name):
    n=next((i for i in doc['images'] if i.get('name')==name),None)
    assert n is not None and 'bufferView' in n
    bw=doc['bufferViews'][n['bufferView']]
    im=Image.open(io.BytesIO(blob[bw['byteOffset']:bw['byteOffset']+bw['byteLength']])).convert('RGB')
    return np.asarray(im,np.uint8), n
color,img_node=load_embedded('f021_body_color')
normal,norm_node=load_embedded('f021_body_normal')
h,w=color.shape[:2]
hn,wn=normal.shape[:2]
assert 512<=h<=4096 and 512<=w<=4096 and 128<=hn<=4096 and 128<=wn<=4096
def pixels_for_uv(image):
    h_,w_=image.shape[:2]
    xx=np.clip(np.round(uv[:,0]*(w_-1)).astype(int),0,w_-1)
    yy=np.clip(np.round(uv[:,1]*(h_-1)).astype(int),0,h_-1)
    return image[yy,xx].astype(np.float32)
rgb=pixels_for_uv(color)
normal_rgb=pixels_for_uv(normal)
# Collect skin-only points from the torso and neck, excluding every vertex on a
# swimsuit UV triangle (including possible border contamination). Back and front
# are separated by physical 3D distance, not by 2D atlas location.
bad_vertex=np.zeros(len(xyz),bool)
bad_vertex[indices[key].reshape(-1)]=True
clean_ids=np.unique(indices[~key].reshape(-1))
clean_ids=clean_ids[~bad_vertex[clean_ids]]
cand=xyz[clean_ids]
col=rgb[clean_ids]
# Shadowed natural skin is still warm, unlike almost black fabric.
good=(cand[:,1]>1.11)&(cand[:,1]<1.72)&(np.abs(cand[:,0])<0.33)&(
    col[:,0]>65)&(col[:,0]>col[:,1]*1.05)&(col[:,1]>col[:,2]*0.88)&(col[:,1]>38)
clean_ids=clean_ids[good]
assert len(clean_ids)>500, ('Too few reliable nearby skin pixels',len(clean_ids))
tree=cKDTree(xyz[clean_ids])
known_rgb=rgb[clean_ids]
known_nrm=normal_rgb[clean_ids]
def palette(world):
    dd, kk=tree.query(world,k=12)
    dd=np.maximum(dd,0.002)
    weights=np.exp(-((dd/0.085)**2))/np.maximum(dd,0.008)
    weights/=np.maximum(weights.sum(1,keepdims=True),1e-12)
    rgb_new=(known_rgb[kk]*weights[:,:,None]).sum(1)
    normal_new=(known_nrm[kk]*weights[:,:,None]).sum(1)
    return np.clip(rgb_new,0,255),np.clip(normal_new,0,255)

def repaint_map(source, which):
    h_,w_=source.shape[:2]
    xy=np.column_stack([np.clip(uv[:,0],0,1)*(w_-1),np.clip(uv[:,1],0,1)*(h_-1)])
    output=source.copy()
    mask=np.zeros((h_,w_),np.uint8)
    # The normal map and body colour map need not have the same resolution.
    for j in np.nonzero(key)[0]:
        ids=indices[j];tri=xy[ids]
        lo=np.floor(tri.min(axis=0)).astype(int)-1
        hi=np.ceil(tri.max(axis=0)).astype(int)+1
        x0,y0=max(0,lo[0]),max(0,lo[1])
        x1,y1=min(w_-1,hi[0]),min(h_-1,hi[1])
        if x1<x0 or y1<y0:continue
        ab=np.stack([tri[1]-tri[0],tri[2]-tri[0]],axis=1)
        if abs(np.linalg.det(ab))<1e-9:continue
        ys,xs=np.mgrid[y0:y1+1,x0:x1+1]
        pix=np.stack([xs.ravel()+0.5,ys.ravel()+0.5],axis=1)
        lam=(pix-tri[0])@np.linalg.inv(ab).T
        bary=np.column_stack([1-lam.sum(axis=1),lam])
        inside=np.all(bary>=-0.005,axis=1)&np.all(bary<=1.005,axis=1)
        if not inside.any():continue
        q=bary[inside]@xyz[ids]
        new_col,new_nrm=palette(q)
        xx,yy=xs.ravel()[inside],ys.ravel()[inside]
        output[yy,xx]=(new_col if which=='color' else new_nrm).astype(np.uint8)
        mask[yy,xx]=1
    y,x=np.nonzero(mask)
    if which=='color' and len(x):
        # Preserve a tiny natural grain, not a flat artificial painted patch.
        small=np.sin(x*0.293+y*0.271)*np.sin(x*0.687-y*0.421)*1.6
        output[y,x]=np.clip(output[y,x].astype(float)+small[:,None],0,255).astype(np.uint8)
    # Pad only the black UNUSED atlas background: avoids UV edge bleeding at mip levels.
    if np.any(mask):
        border=distance_transform_edt(mask==0)
        _,nearest=distance_transform_edt(mask==0,return_indices=True)
        rim=(border<=3)&(mask==0)&(source.max(axis=2)<55)
        sy,sx=nearest
        output[rim]=output[sy[rim],sx[rim]]
    else:
        rim=np.zeros(mask.shape,bool)
    altered=(mask>0)|rim
    assert np.array_equal(output[~altered],source[~altered]),'Edited valid texture outside old bikini'
    count=int(mask.sum())
    print('REPAINT',which,'resolution',w_,h_,'UV pixels',count,'padding',int(rim.sum()),flush=True)
    return output,mask
out_color,mask=repaint_map(color,'color')
out_normal,mask_nrm=repaint_map(normal,'normal')
count=int(mask.sum())
assert 5000<count<300000,('Bad colour UV coverage, source not expected',count)
assert 1000<int(mask_nrm.sum())<300000
old_mean=np.mean(color[mask>0],axis=0)
new_mean=np.mean(out_color[mask>0],axis=0)
assert new_mean[0]>new_mean[1] and new_mean[1]>new_mean[2]*0.80
print('Old swimsuit RGB mean',old_mean.round(1),'new skin RGB mean',new_mean.round(1),
      'reference skin samples',len(clean_ids),flush=True)

def append_image(image, name, fmt, node, quality=None):
    f=io.BytesIO()
    save_kwargs={} if quality is None else dict(quality=quality,subsampling=0)
    Image.fromarray(image,'RGB').save(f,format=fmt,**save_kwargs)
    data=f.getvalue()
    while len(blob)%4:blob.append(0)
    start=len(blob);blob.extend(data)
    view_id=len(doc['bufferViews'])
    doc['bufferViews'].append({'buffer':0,'byteOffset':start,'byteLength':len(data)})
    node['bufferView']=view_id
    node['mimeType']='image/png' if fmt=='PNG' else 'image/jpeg'
    print('Embedded',name,'bytes',len(data),flush=True)
append_image(out_color,'body colour','PNG',img_node)
append_image(out_normal,'body normal','JPEG',norm_node,quality=93)
doc['meshes'][0]['extras']['cssOriginalBikiniRepaint']='body-skin-uv-1379'
doc['meshes'][0]['extras']['cssOriginalBikiniRepaintPixels']=count
doc['buffers'][0]['byteLength']=len(blob)
jdat=json.dumps(doc,separators=(',',':'),ensure_ascii=False).encode()
jdat+=b' '*((-len(jdat))%4)
while len(blob)%4:blob.append(0)
result=b'glTF'+struct.pack('<II',2,12+8+len(jdat)+8+len(blob))+struct.pack('<II',len(jdat),0x4E4F534A)+jdat+struct.pack('<II',len(blob),0x004E4942)+blob
dst.write_bytes(result)
print('REPAINT SAVED',dst,len(result),'bytes; head image untouched',flush=True)
