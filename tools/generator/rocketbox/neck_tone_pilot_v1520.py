#!/usr/bin/env python3
"""Experimental, reversible GLB-local neck-ring colour calibration (Kadir pilot).

Uses actual head/body UVs at coincident vertices to transfer the body skin
colour ONLY onto a narrow band of the head's texture. No faces, mesh positions,
normals, skin weights, morphs or shared GLTF cache are modified.

This is a *prototype*, not proof of an improvement. Render WebGL A/B and review.
"""
from io import BytesIO
from pathlib import Path
import json
import struct
import sys
import numpy as np
from PIL import Image

def align4(data: bytes) -> bytes:
    return data + bytes(-len(data) % 4)

def main(path):
    path = Path(path)
    blob = path.read_bytes()
    _, version, length = struct.unpack_from('<III', blob, 0)
    assert version == 2 and length == len(blob)
    at = 12
    chunks = []
    while at < len(blob):
        count, kind = struct.unpack_from('<I4s', blob, at)
        chunks.append((kind, bytes(blob[at+8:at+8+count])))
        at += count + 8
    doc = json.loads(next(c for t,c in chunks if t == b'JSON'))
    binary = bytearray(next(c for t,c in chunks if t == b'BIN\x00'))
    def accessor(i):
        a=doc['accessors'][i]; bv=doc['bufferViews'][a['bufferView']]
        count={'VEC2':2, 'VEC3':3, 'VEC4':4}[a['type']]
        dtype=np.dtype({5126:'<f4',5123:'<u2',5125:'<u4'}[a['componentType']])
        stride=bv.get('byteStride', dtype.itemsize*count)
        offset=bv.get('byteOffset',0)+a.get('byteOffset',0)
        return np.ndarray((a['count'],count),dtype=dtype,buffer=binary,
            offset=offset,strides=(stride,dtype.itemsize)).copy()
    matches={}
    for mesh in doc['meshes']:
        for p in mesh['primitives']:
            name=doc['materials'][p.get('material',0)].get('name','').lower()
            for part in ('head','body'):
                if name.endswith('_'+part):
                    matches[part]=p
    assert len(matches)==2
    head=matches['head']; body=matches['body']
    hp=accessor(head['attributes']['POSITION'])
    bp=accessor(body['attributes']['POSITION'])
    hu=accessor(head['attributes']['TEXCOORD_0'])
    bu=accessor(body['attributes']['TEXCOORD_0'])
    unit=100 if (bp[:,1].max()-bp[:,1].min())>10 else 1
    eps=0.0002*unit
    keys={}
    for i,xyz in enumerate(bp):
        key=tuple(np.round(xyz/eps).astype('i8'))
        keys.setdefault(key,[]).append(i)
    sample_pairs=[]
    low=np.quantile(hp[:,1],0.02)
    high=np.quantile(hp[:,1],0.20)
    for i,xyz in enumerate(hp):
        if xyz[1]<low or xyz[1]>high: continue
        key=tuple(np.round(xyz/eps).astype('i8'))
        for j in keys.get(key,[]):
            if np.linalg.norm(xyz-bp[j]) < eps*0.5:
                sample_pairs.append((i,j));break
    assert len(sample_pairs)>=20, f'Insufficient true neck ring coincidences: {len(sample_pairs)}'
    def image_for(p):
        mat=doc['materials'][p['material']]
        tx=mat['pbrMetallicRoughness']['baseColorTexture']['index']
        imgid=doc['textures'][tx]['source']
        img=doc['images'][imgid]
        view=doc['bufferViews'][img['bufferView']]
        offset=view.get('byteOffset',0)
        bits=bytes(binary[offset:offset+view['byteLength']])
        return img, np.array(Image.open(BytesIO(bits)).convert('RGB'))
    head_image, pixels=image_for(head)
    _,body_pixels=image_for(body)
    H,W=pixels.shape[:2]
    def pxcoord(uv, im):
        h,w=im.shape[:2]
        return (int((float(uv[0])%1)*(w-1)),
                int((1-(float(uv[1])%1))*(h-1)))
    acc=np.zeros((H,W,3),np.float32)
    weight=np.zeros((H,W),np.float32)
    maxweight=np.zeros((H,W),np.float32)
    radius=52
    measurements=[]
    for i,j in sample_pairs:
        cx,cy=pxcoord(hu[i],pixels)
        bx,by=pxcoord(bu[j],body_pixels)
        delta=body_pixels[by,bx].astype(np.float32)-pixels[cy,cx].astype(np.float32)
        measurements.append(float(np.linalg.norm(delta)))
        x0=max(0,cx-radius);x1=min(W,cx+radius+1)
        y0=max(0,cy-radius);y1=min(H,cy+radius+1)
        yy,xx=np.mgrid[y0:y1,x0:x1]
        r=np.sqrt((xx-cx)**2+(yy-cy)**2)
        t=np.clip((radius-r)/(radius-5),0,1)
        # C1 smooth falloff, no abrupt patch boundary.
        strength=t*t*(3-2*t)
        acc[y0:y1,x0:x1]+=strength[:,:,None]*delta
        weight[y0:y1,x0:x1]+=strength
        maxweight[y0:y1,x0:x1]=np.maximum(maxweight[y0:y1,x0:x1],strength)
    valid=weight>0
    output=pixels.astype(np.float32)
    corrections=acc[valid]/weight[valid,None]
    output[valid]=np.clip(output[valid]+maxweight[valid,None]*corrections,0,255)
    result=np.uint8(np.rint(output))
    # Embed a new PNG image at the end of GLB binary, leaving original bytes
    # and ALL attributes untouched (undo = restore the old GLB).
    buf=BytesIO();Image.fromarray(result,'RGB').save(buf,format='PNG',compress_level=7)
    new_png=buf.getvalue()
    new_offset=len(binary)
    binary.extend(align4(new_png))
    new_view=len(doc['bufferViews'])
    doc['bufferViews'].append({'buffer':0,'byteOffset':new_offset,'byteLength':len(new_png)})
    head_image['bufferView']=new_view
    head_image['mimeType']='image/png'
    doc['buffers'][0]['byteLength']=len(binary)
    doc['asset'].setdefault('extras',{})['css_neck_tone_pilot']='1.52.0-kadir-only'
    json_bytes=json.dumps(doc,separators=(',',':')).encode()
    json_bytes+=b' '*(-len(json_bytes)%4)
    result_glb=bytearray(b'glTF'+struct.pack('<II',2,0))
    for kind, chunk in [(b'JSON',json_bytes),(b'BIN\x00',bytes(binary))]:
        result_glb+=struct.pack('<I4s',len(chunk),kind)+chunk
    struct.pack_into('<I',result_glb,8,len(result_glb))
    path.write_bytes(result_glb)
    info={'file':str(path),'sharedRingPoints':len(sample_pairs),'brushRadiusPixels':radius,
          'medianBeforeRgbDistance':round(float(np.median(measurements)),2),
          'modifiedPixels':int(np.count_nonzero(maxweight)),
          'totalPixels':W*H,
          'modifiedFraction':round(float(np.count_nonzero(maxweight))/(W*H),5),
          'bodyGeometryBytesUnchanged':True,'outputGlbBytes':len(result_glb)}
    report=Path('captures/v1520-tone')
    report.mkdir(parents=True,exist_ok=True)
    (report/'pilot-manifest.json').write_text(json.dumps(info,indent=2)+'\n')
    print(json.dumps(info,indent=2))
if __name__=='__main__':
    if len(sys.argv)!=2: raise SystemExit('usage: script path/to/kadir/photo.glb')
    main(sys.argv[1])
