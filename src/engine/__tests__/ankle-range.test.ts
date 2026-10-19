import { describe, expect, test } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { measureAnkles, type AnkleWorst } from '../../test/ankles';
import { ANKLE_LIMIT, PLANTED_LIMIT } from '../limits';

/**
 * Ankle and toe angles measured on the posed skeleton for every motion of the library, both coaches,
 * the four styles, 49 instants each. A foot off the floor stays within the ankle's range relative to
 * the shin; a planted foot within the weight-bearing range (the heel lifts, the knee turns over the
 * foot or the foot rolls onto its edge instead, src/engine/rig.ts settlePlanted).
 *
 * Tolerance: 1° for a foot in the air (soft stop), 4° for a planted foot, whose edge roll is about the
 * line ankle → ball of the foot, close to but not exactly the inversion axis.
 */
const D = 180 / Math.PI;
const DOC = resolve(__dirname, '../../../docs/audit-biomecanique/MESURES_CHEVILLES.md');
const BEFORE = resolve(__dirname, '../../../docs/audit-biomecanique/chevilles-avant-v0.22.0.json');

/**
 * Ground techniques still over the planted range (lot A of docs/audit-biomecanique/PLAN.md, the
 * ground work, will rework them): each is held to its value measured in v0.23.0, never worse.
 */
const GROUND_PENDING: Record<string, number> = {
  sprawl: 23,
  'sortie-hanche': 27,
  'releve-technique': 20,
  pont: 27,
  'retention-garde': 22,
  'changement-base': 22,
};

const rigs = { homme: new CoachRig(loadSkeleton('homme')), femme: new CoachRig(loadSkeleton('femme')) };
const data: Record<string, AnkleWorst[]> = {};
for (const c of ['homme', 'femme'] as const) data[c] = measureAnkles(rigs[c]);

describe('amplitude des chevilles', () => {
  test('pied en l’air : dans l’amplitude de la cheville par rapport au tibia', () => {
    const bad: string[] = [];
    for (const [c, ws] of Object.entries(data))
      for (const w of ws) {
        if (!w.airFrames) continue;
        const a = w.air;
        const t = 1;
        if (a.dorsi > -ANKLE_LIMIT.plantar.min * D + t) bad.push(`${c} ${w.style} ${w.motion} dorsiflexion ${a.dorsi.toFixed(1)}`);
        if (a.plantar > ANKLE_LIMIT.plantar.max * D + t) bad.push(`${c} ${w.style} ${w.motion} flexion plantaire ${a.plantar.toFixed(1)}`);
        if (a.inversion > ANKLE_LIMIT.inversion.max * D + t) bad.push(`${c} ${w.style} ${w.motion} inversion ${a.inversion.toFixed(1)}`);
        if (a.eversion > -ANKLE_LIMIT.inversion.min * D + t) bad.push(`${c} ${w.style} ${w.motion} éversion ${a.eversion.toFixed(1)}`);
        if (a.rotation > ANKLE_LIMIT.rotation.max * D + t) bad.push(`${c} ${w.style} ${w.motion} rotation ${a.rotation.toFixed(1)}`);
        if (a.toeExt > 71 || a.toeFlex > 41) bad.push(`${c} ${w.style} ${w.motion} orteils ${a.toeExt.toFixed(1)} / ${a.toeFlex.toFixed(1)}`);
      }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  test('pied à plat : dans l’amplitude en charge, sans torsion contre le tibia', () => {
    const bad: string[] = [];
    for (const [c, ws] of Object.entries(data))
      for (const w of ws) {
        const p = w.planted;
        const t = 4;
        const rotMax = GROUND_PENDING[w.motion] ?? PLANTED_LIMIT.rotation * D + t;
        if (p.dorsi > PLANTED_LIMIT.dorsi * D + t) bad.push(`${c} ${w.style} ${w.motion} dorsiflexion ${p.dorsi.toFixed(1)}`);
        if (p.inversion > PLANTED_LIMIT.inversion * D + t) bad.push(`${c} ${w.style} ${w.motion} inversion ${p.inversion.toFixed(1)}`);
        if (p.eversion > (GROUND_PENDING[w.motion] ?? PLANTED_LIMIT.eversion * D + t)) bad.push(`${c} ${w.style} ${w.motion} éversion ${p.eversion.toFixed(1)}`);
        if (p.rotation > rotMax) bad.push(`${c} ${w.style} ${w.motion} rotation ${p.rotation.toFixed(1)}`);
      }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  test('le front kick traverse ses phases sans retourner le pied', () => {
    for (const c of ['homme', 'femme'] as const) {
      const w = data[c].find((x) => x.style === 'kickboxing' && x.motion === 'front-kick-avant');
      expect(w, `${c}: front-kick-avant`).toBeDefined();
      expect(w!.air.inversion).toBeLessThan(10);
      expect(w!.air.rotation).toBeLessThan(10);
      // the ankle extends for the ball of the foot, the toes pulled back
      expect(w!.air.plantar).toBeGreaterThan(30);
      expect(w!.air.toeExt).toBeGreaterThan(40);
    }
  });

  test('le document de mesures est à jour', () => {
    const before = JSON.parse(readFileSync(BEFORE, 'utf8')) as Record<string, AnkleWorst[]>;
    const row = (label: string, ws: AnkleWorst[]) => {
      const mx = (k: 'planted' | 'air', f: string) => Math.max(...ws.filter((w) => k === 'planted' || w.airFrames).map((w) => (w[k] as Record<string, number>)[f]));
      return `| ${label} | ${mx('planted', 'dorsi').toFixed(0)}° | ${mx('planted', 'eversion').toFixed(0)}° | ${mx('planted', 'rotation').toFixed(0)}° | ${mx('air', 'dorsi').toFixed(0)}° | ${mx('air', 'plantar').toFixed(0)}° | ${mx('air', 'inversion').toFixed(0)}° | ${mx('air', 'rotation').toFixed(0)}° | ${mx('air', 'toeExt').toFixed(0)}° |`;
    };
    const fk = (ws: AnkleWorst[]) => ws.find((x) => x.style === 'kickboxing' && x.motion === 'front-kick-avant')!.air;
    const md = [
      '# Mesures des chevilles et des orteils',
      '',
      'Généré par `AUDIT_UPDATE=1 npx vitest run src/engine/__tests__/ankle-range.test.ts`. Ne pas modifier à la main.',
      '',
      'Angles lus sur le squelette animé (rotation du pied par rapport au tibia depuis la position de repos), pour',
      'toutes les animations, les quatre styles, 49 instants chacune. « Avant » : v0.22.0 (`chevilles-avant-v0.22.0.json`,',
      'même mesure). Pires valeurs. Amplitudes de référence : `src/engine/limits.ts`.',
      '',
      '| Coach | À plat : dorsiflexion | À plat : éversion | À plat : torsion pied/tibia | En l’air : dorsiflexion | En l’air : flexion plantaire | En l’air : inversion | En l’air : torsion | Orteils relevés |',
      '|---|---|---|---|---|---|---|---|---|',
      row('Homme, avant (v0.22.0)', before.homme),
      row('Homme, après', data.homme),
      row('Femme, avant (v0.22.0)', before.femme),
      row('Femme, après', data.femme),
      `| Référence | 40° en charge | 15° | ≈ 15° | 20° | 50° | 35° | ≈ 15° | 70° |`,
      '',
      '## Front kick avant (kick-boxing), pied de frappe',
      '',
      '| Coach | Flexion plantaire max | Inversion max | Torsion max | Orteils relevés |',
      '|---|---|---|---|---|',
      ...(['homme', 'femme'] as const).flatMap((c) => [
        `| ${c}, avant | ${fk(before[c]).plantar.toFixed(0)}° | ${fk(before[c]).inversion.toFixed(0)}° | ${fk(before[c]).rotation.toFixed(0)}° | ${fk(before[c]).toeExt.toFixed(0)}° |`,
        `| ${c}, après | ${fk(data[c]).plantar.toFixed(0)}° | ${fk(data[c]).inversion.toFixed(0)}° | ${fk(data[c]).rotation.toFixed(0)}° | ${fk(data[c]).toeExt.toFixed(0)}° |`,
      ]),
      '',
      '## Techniques au sol encore hors amplitude (à reprendre, lot A)',
      '',
      'Bornées à leur valeur actuelle par le test (elles ne peuvent pas empirer) :',
      '',
      ...Object.entries(GROUND_PENDING).map(([m, v]) => `- ${m} : torsion ou éversion du pied à plat jusqu’à ${v}°`),
      '',
    ].join('\n');
    if (process.env.AUDIT_UPDATE) writeFileSync(DOC, md);
    expect(readFileSync(DOC, 'utf8')).toBe(md);
  });
});
