import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';

function gltfOf(path: string) {
  const b = readFileSync(path);
  expect(b.toString('ascii', 0, 4)).toBe('glTF');
  expect(b.readUInt32LE(8)).toBe(b.length);
  const n = b.readUInt32LE(12);
  const info = JSON.parse(b.toString('utf8', 20, 20+n)) as {
    asset: { extras?: Record<string, unknown> };
    meshes: Array<{ primitives: Array<{ targets?: unknown[] }> }>;
    skins: unknown[];
    images: Array<{ mimeType?: string }>;
  };
  return info;
}
describe('Amara torso retouch v1.37.5', () => {
  test('photo GLB contains verified localized skin cleaning metadata', () => {
    const photo = gltfOf('public/coaches/mma-amara/photo.glb');
    expect(photo.asset.extras?.css_clean_torso).toBe('1.37.5');
    expect(photo.asset.extras?.css_clean_reference).toBe('inaya-texture-pattern');
    expect(photo.skins.length).toBeGreaterThan(0);
    const targets = photo.meshes.flatMap(m => m.primitives.flatMap(p => p.targets ?? []));
    expect(targets.length).toBeGreaterThanOrEqual(20);
  });
  test('reference Inaya stays unmodified', () => {
    const reference = gltfOf('public/coaches/inaya/photo.glb');
    expect(reference.asset.extras?.css_clean_torso).not.toBe('1.37.5');
  });
});
