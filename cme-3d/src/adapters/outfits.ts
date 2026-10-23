import { Bone, BufferAttribute, Material, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, Skeleton, SkinnedMesh, SRGBColorSpace } from 'three';
function hiddenKeys(s:string):Set<string>{
 const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0)),dv=new DataView(bytes.buffer),keys=new Set<string>();
 for(let o=0;o+6<=bytes.length;o+=6)keys.add(`${dv.getInt16(o,true)},${dv.getInt16(o+2,true)},${dv.getInt16(o+4,true)}`);return keys;
}
export function maskBody(pos:ArrayLike<number>,indices:ArrayLike<number>,keys:Set<string>,factor:number){
 const hidden=new Uint8Array(pos.length/3);let matched=0;
 for(let i=0;i<hidden.length;i++){const k=`${Math.round(pos[3*i]*factor)},${Math.round(pos[3*i+1]*factor)},${Math.round(pos[3*i+2]*factor)}`;if(keys.has(k)){hidden[i]=1;matched++;}}
 const index:number[]=[];for(let i=0;i<indices.length;i+=3){const a=indices[i],b=indices[i+1],c=indices[i+2];if(hidden[a]&&hidden[b]&&hidden[c])continue;index.push(a,b,c);}return {index,matched};
}
function material(original:Material):Material{
 const m=original as MeshStandardMaterial;if(m.map){m.map.colorSpace=SRGBColorSpace;m.map.anisotropy=4;}
 if(m.normalMap)m.normalMap.anisotropy=4;const sheen=Number(m.userData?.css_sheen??0),coat=Number(m.userData?.css_coat??0);
 if(!sheen&&!coat)return m.clone();
 return new MeshPhysicalMaterial({color:m.color,map:m.map,normalMap:m.normalMap,roughness:m.roughness,metalness:0,vertexColors:m.vertexColors,sheen,sheenRoughness:.45,sheenColor:m.color.clone().lerp(m.color.clone().set('#ffffff'),.4),clearcoat:coat,clearcoatRoughness:.35});
}
/** Rebind the discipline outfit to the real fighter's original bones; clone geometry to avoid skin poke-through. */
export function attachOutfit(body:Object3D,outfit:Object3D):{garments:number;hiddenVertices:number}{
 const bones=new Map<string,Bone>(),skins:SkinnedMesh[]=[];
 body.traverse(o=>{if((o as Bone).isBone)bones.set(o.name,o as Bone);if((o as SkinnedMesh).isSkinnedMesh)skins.push(o as SkinnedMesh);});
 const anchor=skins[0];if(!anchor)throw Error('No skinned human body in source GLB');
 let hiding:{keys:string;scale:number}|null=null;const garments:SkinnedMesh[]=[];
 outfit.traverse(o=>{if(o.userData?.hideBody)hiding={keys:String(o.userData.hideBody),scale:Number(o.userData.hideScale??1000)};if((o as SkinnedMesh).isSkinnedMesh)garments.push(o as SkinnedMesh);});
 for(const g of garments){
  const mesh=new SkinnedMesh(g.geometry,material(g.material as Material));mesh.name='tenue:'+g.name;
  mesh.position.copy(g.position);mesh.quaternion.copy(g.quaternion);mesh.scale.copy(g.scale);
  const skeleton=new Skeleton(g.skeleton.bones.map(b=>bones.get(b.name)??b),g.skeleton.boneInverses);
  anchor.parent?.add(mesh);mesh.updateMatrixWorld(true);mesh.bind(skeleton,g.bindMatrix);
  mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;mesh.normalizeSkinWeights();
 }
 let hiddenVertices=0;
 if(hiding){
  const h=hiding as {keys:string;scale:number};const keys=hiddenKeys(h.keys);
  for(const skin of skins){
   const old=skin.geometry,geo=old.clone(),p=geo.getAttribute('position');
   const indices=geo.index?Array.from(geo.index.array):Array.from({length:p.count},(_,i)=>i);
   const r=maskBody(p.array,indices,keys,h.scale);hiddenVertices+=r.matched;
   geo.setIndex(new BufferAttribute(p.count>65535?new Uint32Array(r.index):new Uint16Array(r.index),1));skin.geometry=geo;
  }
 }
 return {garments:garments.length,hiddenVertices};
}
export function enhanceHumanMaterial(scene:Object3D):void{
 scene.traverse(o=>{const mesh=o as Mesh;if(!mesh.isMesh)return;mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;
  const m=mesh.material as MeshStandardMaterial;if(!m||Array.isArray(m))return;
  if(m.map){m.map.colorSpace=SRGBColorSpace;m.map.anisotropy=8;}if(m.normalMap)m.normalMap.anisotropy=8;
  if(/opacity/i.test(m.name)){const clone=m.clone();clone.alphaTest=.4;clone.transparent=false;mesh.material=clone;return;}
  mesh.material=new MeshPhysicalMaterial({name:m.name,color:m.color,map:m.map,normalMap:m.normalMap,roughness:.58,metalness:0,sheen:.25,sheenRoughness:.7,sheenColor:'#c98a72',specularIntensity:.4});
 });
}
