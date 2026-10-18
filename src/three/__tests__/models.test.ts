import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { MeshLambertMaterial, Texture } from 'three';
import { toonMaterial } from '../manga';

/** glTF JSON chunk of a .glb file (header 12 bytes, then chunk length, chunk type, JSON) */
function gltfJson(file: string) {
  const b = readFileSync(`public/models/${file}`);
  const len = b.readUInt32LE(12);
  return JSON.parse(b.subarray(20, 20 + len).toString('utf8')) as {
    materials: { name: string; normalTexture?: { index: number } }[];
    skins: { joints: number[] }[];
    nodes: { name: string }[];
  };
}

const MODELS = ['coach_male_manga.glb', 'coach_female_manga.glb', 'coach_male.glb', 'coach_female.glb'];
const boneNames = (file: string) => {
  const j = gltfJson(file);
  return j.skins[0].joints.map((i) => j.nodes[i].name).sort();
};

describe('modèles 3D des coachs', () => {
  test.each(MODELS)('%s : la peau porte la carte de relief anatomique', (f) => {
    const skin = gltfJson(f).materials.find((m) => m.name.toLowerCase().startsWith('skin'));
    expect(skin?.normalTexture).toBeDefined();
  });

  test.each(MODELS)('%s : même squelette de 52 os que les animations', (f) => {
    const bones = boneNames(f);
    expect(bones).toHaveLength(52);
    expect(bones).toEqual(boneNames('coach_male_manga.glb'));
    for (const b of ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftArm', 'RightForeArm', 'LeftUpLeg', 'RightFoot']) {
      expect(bones.some((n) => n.replace(/^mixamorig:?/i, '') === b)).toBe(true);
    }
  });

  test.each(['manga', 'encre'] as const)('le style %s garde la carte de relief', (style) => {
    const normal = new Texture();
    const m = toonMaterial('Skin', null, undefined, style, normal) as MeshLambertMaterial;
    expect(m.normalMap).toBe(normal);
  });
});
