#!/usr/bin/env python3
"""Read-only, low-res visual inventory of original Rocketbox skin atlas/old underwear UVs."""
import base64, io, math, struct
from pathlib import Path
from PIL import Image, ImageDraw
from importlib.machinery import SourceFileLoader
reader=SourceFileLoader('inspect','scripts/dev/audit-amara-original-swimsuit.py').load_module()
doc,binary=reader.glb(Path('public/coaches/mma-amara/photo.glb'))
im=next(im for im in doc['images'] if im['name']=='f021_body_color')
v=doc['bufferViews'][im['bufferView']]
raw=binary[v['byteOffset']:v['byteOffset']+v['byteLength']]
photo=Image.open(io.BytesIO(raw)).convert('RGB')
primitive=doc['meshes'][0]['primitives'][0]
positions=reader.accessor(doc,binary,primitive['attributes']['POSITION'])
uvs=reader.accessor(doc,binary,primitive['attributes']['TEXCOORD_0'])
idx=[x[0] for x in reader.accessor(doc,binary,primitive['indices'])]
polys={'lowV':[],'highV':[]}
for k in range(0,len(idx),3):
  ids=idx[k:k+3]
  if min(positions[i][1] for i in ids)<1.15:continue
  vs=[uvs[i][1] for i in ids]
  if max(vs)<0.22:key='lowV'
  elif min(vs)>0.78:key='highV'
  else:continue
  polys[key].append(ids)
active=min(polys,key=lambda x:abs(len(polys[x])-4416))
w,h=photo.size
overlay=Image.new('RGBA',(w,h))
draw=ImageDraw.Draw(overlay)
for tri in polys[active]:
  draw.polygon([(int(uvs[i][0]*w),int(uvs[i][1]*h)) for i in tri],fill=(255,55,0,110))
paint=Image.alpha_composite(photo.convert('RGBA'),overlay).convert('RGB')
photo.thumbnail((700,820))
paint.thumbnail((700,820))
out=Image.new('RGB',(photo.width+paint.width,max(photo.height,paint.height)+30),'#e8e9ec')
out.paste(photo,(0,30));out.paste(paint,(photo.width,30))
ImageDraw.Draw(out).text((10,5),'LEFT: source skin atlas     RIGHT: old-bikini UV island',fill='#151515')
root=Path('captures/amara-skin-atlas-review');root.mkdir(parents=True,exist_ok=True)
file=root/'atlas-overview.jpg';out.save(file,quality=80)
(root/'atlas-overview.b64').write_text(base64.b64encode(file.read_bytes()).decode('ascii'))
print('Atlas',w,h,'UV counts',{k:len(v) for k,v in polys.items()},'selected',active,'preview',file)
