import { readFileSync, statSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { BufferAttribute, BufferGeometry, Mesh } from 'three';
import { dropStillMorphs, expressionWeights, FACE_EXPRESSIONS } from '../face';

/**
 * 1.16 (Youssef 04/11 14:16 « applique ta proposition »): the Rocketbox coaches carry 25 of the avatars' own facial
 * expressions (tools/generator/rocketbox/morph_{extract,apply}), on the face only, and the face animator drives them.
 */
const ROCKETBOX = ['mma-kadir', 'mma-amara', 'nael', 'inaya'] as const;

interface Acc { count: number; type: string; bufferView?: number; sparse?: { count: number; indices: { bufferView: number; componentType: number }; values: { bufferView: number } } }
interface Json {
  meshes: { extras?: { targetNames?: string[] }; weights?: number[]; primitives: { material: number; attributes: Record<string, number>; targets?: { POSITION: number }[] }[] }[];
  materials: { name: string }[];
  accessors: Acc[];
  bufferViews: { byteOffset?: number; byteLength: number }[];
}

function glb(id: string) {
  const b = readFileSync(`public/coaches/${id}/photo.glb`);
  const jl = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + jl).toString('utf8')) as Json;
  const bin = b.subarray(20 + jl + 8);
  const view = (i: number) => {
    const v = json.bufferViews[i];
    return bin.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength);
  };
  /** the moving points of a sparse target: index -> delta (metres) */
  const sparse = (acc: number) => {
    const a = json.accessors[acc];
    expect(a.bufferView, 'cible creuse').toBeUndefined();
    const s = a.sparse!;
    const iv = view(s.indices.bufferView);
    const vv = view(s.values.bufferView);
    const out = new Map<number, [number, number, number]>();
    for (let k = 0; k < s.count; k++) out.set(iv.readUInt32LE(k * 4), [vv.readFloatLE(k * 12), vv.readFloatLE(k * 12 + 4), vv.readFloatLE(k * 12 + 8)]);
    return out;
  };
  return { json, sparse };
}

const len = (d: [number, number, number]) => Math.hypot(...d);

describe.each(ROCKETBOX)('%s : expressions du visage', (id) => {
  const { json, sparse } = glb(id);
  const mesh = json.meshes[0];
  const names = mesh.extras?.targetNames ?? [];
  const part = (re: RegExp) => mesh.primitives.find((p) => re.test(json.materials[p.material].name))!;
  const at = (name: string) => names.findIndex((n) => n.replace(/^AK_\d+_/, '') === name);

  test('les 25 expressions sont là, toutes au repos', () => {
    for (const e of FACE_EXPRESSIONS) expect(at(e), e).toBeGreaterThanOrEqual(0);
    expect(names).toHaveLength(FACE_EXPRESSIONS.length);
    expect(mesh.weights?.every((w) => w === 0)).toBe(true);
    for (const p of mesh.primitives) expect(p.targets).toHaveLength(names.length);
  });

  test('le clignement ferme la paupière de son côté, d’un centimètre au plus', () => {
    const head = part(/head$/);
    for (const e of ['EyeBlinkLeft', 'EyeBlinkRight']) {
      const d = sparse(head.targets![at(e)].POSITION);
      const moving = [...d.values()].filter((v) => len(v) > 1e-3);
      expect(moving.length, e).toBeGreaterThan(50);
      const max = Math.max(...moving.map(len));
      expect(max, e).toBeGreaterThan(0.004);
      expect(max, e).toBeLessThan(0.015);
      // a lid closes downward
      expect(moving.reduce((s, v) => s + v[1], 0), e).toBeLessThan(0);
    }
  });

  test('la mâchoire s’ouvre vers le bas, de moins de 2,5 cm', () => {
    const d = sparse(part(/head$/).targets![at('JawOpen')].POSITION);
    const v = [...d.values()];
    expect(Math.max(...v.map(len))).toBeLessThan(0.025);
    expect(v.reduce((s, x) => s + x[1], 0)).toBeLessThan(0);
  });

  test('le corps ne bouge avec aucune expression', () => {
    const body = part(/body$/);
    for (const t of body.targets!) for (const v of sparse(t.POSITION).values()) expect(len(v)).toBeLessThan(1e-6);
  });

  test('le modèle reste léger (moins de 3,5 Mo)', () => expect(statSync(`public/coaches/${id}/photo.glb`).size).toBeLessThan(3.5e6));
});

describe('poids des expressions', () => {
  test('au repos, visage neutre', () => {
    for (const v of Object.values(expressionWeights(0, 0, 0))) expect(v).toBe(0);
  });
  test('un clignement ferme les deux yeux, rien d’autre', () => {
    const w = expressionWeights(1, 0, 0);
    expect(w.EyeBlinkLeft).toBe(1);
    expect(w.EyeBlinkRight).toBe(1);
    for (const [k, v] of Object.entries(w)) if (!k.startsWith('EyeBlink')) expect(v, k).toBe(0);
  });
  test('l’effort fronce sans grimace : aucune expression à fond (0,9 au plus)', () => {
    const w = expressionWeights(0, 1, 1);
    expect(w.BrowDownLeft).toBeGreaterThan(0.3);
    for (const [k, v] of Object.entries(w)) expect(v!, k).toBeLessThanOrEqual(0.9);
  });
});

describe('expressions retirées des parties immobiles', () => {
  const geo = (delta: number) => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(9), 3));
    g.setIndex([0, 1, 2]);
    const t = new BufferAttribute(new Float32Array(9), 3);
    t.setX(1, delta);
    g.morphAttributes.position = [t];
    return g;
  };
  test('immobile : retirées, la géométrie d’origine intacte', () => {
    const g = geo(0);
    const m = new Mesh(g);
    expect(dropStillMorphs(m)).toBe(true);
    expect(m.geometry.morphAttributes.position).toBeUndefined();
    expect(m.morphTargetInfluences).toBeUndefined();
    expect(g.morphAttributes.position).toHaveLength(1);
  });
  test('qui bouge : gardées', () => {
    const m = new Mesh(geo(0.004));
    expect(dropStillMorphs(m)).toBe(false);
    expect(m.morphTargetInfluences).toHaveLength(1);
  });
});

describe('le moteur du visage pilote les expressions', () => {
  test('clignement, effort, puis retour au repos', async () => {
    const { FaceAnimator } = await import('../face');
    const { Object3D } = await import('three');
    const root = new Object3D();
    const m = new Mesh(new BufferGeometry());
    m.morphTargetDictionary = Object.fromEntries(FACE_EXPRESSIONS.map((e, i) => [`AK_${i}_${e}`, i]));
    m.morphTargetInfluences = FACE_EXPRESSIONS.map(() => 0);
    root.add(m);
    const face = new FaceAnimator(root, 3);
    expect(face.active).toBe(true);
    expect(face.state.expressions).toBe(true);
    const inf = (e: (typeof FACE_EXPRESSIONS)[number]) => m.morphTargetInfluences![FACE_EXPRESSIONS.indexOf(e)];
    face.update(1 / 60, { still: true, blink: 1 });
    expect(inf('EyeBlinkLeft')).toBe(1);
    face.update(1 / 60, { still: true, effort: 1 });
    expect(inf('BrowDownLeft')).toBeGreaterThan(0.3);
    face.update(1 / 60, { still: true, effort: 0 });
    expect(m.morphTargetInfluences!.every((v) => v === 0)).toBe(true);
  });
});

/**
 * 1.20 (Youssef 05/11 13:42 « les expressions du visage sont toujours trop figées »): at rest, between strikes, the
 * face lives: look, brows, lips and breathing change slowly, by small amounts, and never when the model stands still.
 */
describe('1.20 le visage vit au repos', () => {
  test('les poids au repos restent petits et le coup reprend le dessus', () => {
    const idle = { focus: 1, brow: 1, press: 0, smile: 1, side: 1, breath: 1 };
    const w = expressionWeights(0, 0, 0, idle);
    expect(w.BrowInnerUp!).toBeGreaterThan(0.2);
    expect(w.MouthSmileLeft! + w.MouthSmileRight!).toBeGreaterThan(0.2);
    expect(w.MouthSmileLeft!).not.toBeCloseTo(w.MouthSmileRight!, 2);
    for (const [k, v] of Object.entries(w)) expect(v!, k).toBeLessThanOrEqual(0.4);
    const hit = expressionWeights(0, 1, 1, idle);
    expect(hit.BrowInnerUp).toBe(0);
    expect(hit.MouthSmileLeft).toBe(0);
    for (const [k, v] of Object.entries(hit)) expect(v!, k).toBeLessThanOrEqual(0.9);
  });
  test('en 12 s sans coup, les expressions changent, lentement', async () => {
    const { FaceAnimator } = await import('../face');
    const { Object3D } = await import('three');
    const root = new Object3D();
    const m = new Mesh(new BufferGeometry());
    m.morphTargetDictionary = Object.fromEntries(FACE_EXPRESSIONS.map((e, i) => [`AK_${i}_${e}`, i]));
    m.morphTargetInfluences = FACE_EXPRESSIONS.map(() => 0);
    root.add(m);
    const face = new FaceAnimator(root, 7);
    const at = (e: (typeof FACE_EXPRESSIONS)[number]) => m.morphTargetInfluences![FACE_EXPRESSIONS.indexOf(e)];
    const watched = ['BrowDownLeft', 'MouthPressLeft', 'NoseSneerLeft', 'JawOpen'] as const;
    const seen = watched.map(() => ({ lo: 1, hi: 0 }));
    let jump = 0;
    let prev = watched.map(() => 0);
    for (let f = 0; f < 12 * 60; f++) {
      face.update(1 / 60);
      const now = watched.map((e) => at(e));
      if (f > 0) jump = Math.max(jump, ...now.map((v, i) => Math.abs(v - prev[i])));
      now.forEach((v, i) => { seen[i].lo = Math.min(seen[i].lo, v); seen[i].hi = Math.max(seen[i].hi, v); });
      prev = now;
    }
    seen.forEach((s, i) => expect(s.hi - s.lo, watched[i]).toBeGreaterThan(0.03));
    // no jerk from one frame to the next (blinks aside, which are not watched here)
    expect(jump).toBeLessThan(0.05);
    face.update(1 / 60, { still: true, effort: 0 });
    expect(m.morphTargetInfluences!.every((v) => v === 0)).toBe(true);
  });
});
