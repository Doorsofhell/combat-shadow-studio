#!/usr/bin/env python3
"""Read-only inventory: Amara's actual shipped photo.glb. Used before any skin edits."""
import json, struct
from pathlib import Path
from importlib.machinery import SourceFileLoader

reader = SourceFileLoader("amara_audit", "scripts/dev/audit-amara-original-swimsuit.py").load_module()
doc, data = reader.glb(Path("public/coaches/mma-amara/photo.glb"))
print("glb bytes", Path("public/coaches/mma-amara/photo.glb").stat().st_size)
for i, m in enumerate(doc.get("materials", [])):
  pbr=m.get("pbrMetallicRoughness",{})
  print("MATERIAL",i,m.get("name"),"baseTexture",pbr.get("baseColorTexture",{}).get("index"),"normal",m.get("normalTexture",{}).get("index"))
for i, im in enumerate(doc.get("images", [])):
  v=doc.get("bufferViews", [])[im["bufferView"]] if "bufferView" in im else {}
  print("IMAGE",i,im.get("name"),im.get("mimeType"),v.get("byteLength"),im.get("uri"))
for i,t in enumerate(doc.get("textures",[])):
  print("TEXTURE",i,"source",t.get("source"),"sampler",t.get("sampler"))
for i,n in enumerate(doc.get("nodes", [])):
  if "mesh" in n:
    print("NODE",i,n.get("name"),"mesh",n.get("mesh"),"skin",n.get("skin"),
      "extrasKeys",list((n.get("extras") or {}).keys()))
for i,m in enumerate(doc.get("meshes", [])):
  print("MESH",i,m.get("name"),"primitives",len(m.get("primitives",[])),"morphTargetNames",m.get("extras",{}).get("targetNames",[])[:8])
  for j,p in enumerate(m.get("primitives", [])):
    attrs=p.get("attributes",{})
    print("PRIMITIVE",i,j,"mat",p.get("material"),"attrs",attrs,
      "vertexCount",doc["accessors"][attrs["POSITION"]]["count"] if "POSITION" in attrs else 0,
      "indexCount",doc["accessors"][p["indices"]]["count"] if "indices" in p else 0,
      "morphTargets",len(p.get("targets",[])),"mode",p.get("mode",4))
    if "POSITION" in attrs and "TEXCOORD_0" in attrs:
      pos=reader.accessor(doc,data,attrs["POSITION"]); uv=reader.accessor(doc,data,attrs["TEXCOORD_0"])
      cand=[k for k in range(len(pos)) if pos[k][1]>1.15 and (uv[k][1]>0.78 or uv[k][1]<0.22)]
      print("BIKINI CANDIDATE VERTS",len(cand),"UV span",[
        [min(uv[k][z] for k in cand),max(uv[k][z] for k in cand)] for z in (0,1)
      ] if cand else [],"morphs",len(p.get("targets",[])))
