import { describe, expect, it } from 'vitest';
import { TECHNIQUES } from '../techniques';
import { GUIDES } from '../guide';
import { INSTRUCTIONS } from '../instructions';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../../engine/rig';
import { getLibrary, getMotion } from '../../engine/library';
import { STYLE_OF } from '../../three/CoachStage';
import { motionPhase, duration } from '../../engine/motion';

// moves whose name itself is a side: their instruction may say left / right
const SIDED = /^(pas-gauche|pas-droite)$/;

describe('consignes de l’écran d’entraînement', () => {
  it('chaque technique a une consigne principale et 3 à 5 points clés courts', () => {
    for (const t of TECHNIQUES) {
      const i = INSTRUCTIONS[t.id];
      expect(i, t.id).toBeDefined();
      // only techniques that have a step-by-step sheet: the instruction condenses it
      expect(GUIDES[t.id], t.id).toBeDefined();
      expect(i.main.length, `${t.id} consigne`).toBeLessThanOrEqual(90);
      expect(i.main, t.id).toMatch(/\.$/);
      expect(i.points.length, t.id).toBeGreaterThanOrEqual(3);
      expect(i.points.length, t.id).toBeLessThanOrEqual(5);
      for (const p of i.points) expect(p.text.length, `${t.id} : ${p.text}`).toBeLessThanOrEqual(48);
      expect(new Set(i.points.map((p) => p.text)).size, `${t.id} doublon`).toBe(i.points.length);
    }
    expect(Object.keys(INSTRUCTIONS).sort()).toEqual(TECHNIQUES.map((t) => t.id).sort());
  });

  it('les points couvrent appuis, bassin, membres ou tête, et la garde', () => {
    for (const t of TECHNIQUES) {
      const zones = new Set(INSTRUCTIONS[t.id].points.map((p) => p.zone));
      expect(zones.has('pieds'), `${t.id} appuis`).toBe(true);
      // Jab: points given word for word in the brief; the pelvis is covered by « léger transfert avant »
      if (t.id !== 'jab') expect(zones.has('bassin'), `${t.id} bassin`).toBe(true);
      // footwork: the limbs at work are the feet themselves
      if (t.category !== 'deplacement') expect(zones.has('bras') || zones.has('jambe') || zones.has('tete'), `${t.id} membres`).toBe(true);
      // the guard itself has no return to guard
      if (t.id !== 'garde') expect(zones.has('garde'), `${t.id} garde`).toBe(true);
    }
  });

  it('valables dans les deux gardes : « avant / arrière » plutôt que gauche / droite', () => {
    for (const t of TECHNIQUES) {
      if (SIDED.test(t.id)) continue;
      const i = INSTRUCTIONS[t.id];
      for (const s of [i.main, ...i.points.map((p) => p.text)]) expect(s, t.id).not.toMatch(/\bgauche\b|(?<!ligne )\bdroite\b|\b(pied|genou|poing|coude|bras|main|épaule|hanche|jambe|côté) droit\b/i);
    }
  });

  it('le Jab suit la consigne demandée', () => {
    const j = INSTRUCTIONS.jab;
    expect(j.main).toBe('Tends le bras avant dans l’axe, puis ramène immédiatement le poing en garde.');
    expect(j.points.map((p) => p.text)).toEqual([
      'Garde opposée maintenue contre la joue',
      'Épaule avant accompagne, menton caché',
      'Poignet aligné, poing tourné à l’impact',
      'Appuis équilibrés, léger transfert avant',
      'Retour immédiat en garde',
    ]);
  });

  it('chaque phase citée par un point existe dans le mouvement joué', () => {
    const rig = new CoachRig(loadSkeleton('homme'));
    for (const t of TECHNIQUES) {
      const m = getMotion(getLibrary(rig, STYLE_OF[t.disciplines[0]]), t.motion, false)!;
      expect(m, t.id).toBeDefined();
      const seen = new Set<string>();
      for (let k = 0; k <= 200; k++) seen.add(motionPhase(m, (duration(m) * k) / 200));
      for (const p of INSTRUCTIONS[t.id].points) if (p.phase) expect(seen.has(p.phase), `${t.id} ${p.phase}`).toBe(true);
    }
  });
});
