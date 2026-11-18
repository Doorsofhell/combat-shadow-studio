import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]); const r = doc.getRoot();
for (const m of r.listMeshes()) for (const p of m.listPrimitives()) console.log('mesh', m.getName(), p.getAttribute('POSITION').getCount(), 'mat', p.getMaterial()?.getName(), 'targets', p.listTargets().length);
for (const t of r.listTextures()) console.log('tex', t.getName(), t.getMimeType(), t.getSize(), t.getImage().byteLength);
for (const m of r.listMaterials()) console.log('mat', m.getName(), 'rough', m.getRoughnessFactor(), 'metal', m.getMetallicFactor(), 'base', m.getBaseColorTexture()?.getName(), 'normal', m.getNormalTexture()?.getName(), 'mr', m.getMetallicRoughnessTexture()?.getName(), JSON.stringify(m.getExtras()).slice(0,200));
console.log('extras', JSON.stringify(r.getAsset().extras ?? {}).slice(0,400));
