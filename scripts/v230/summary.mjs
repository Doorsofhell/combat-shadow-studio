// 2.3.0 : synthèse des mesures du moteur avant / après (docs/v230/audit/avant.json, apres.json → docs/v230/AUDIT_MESURES.md).
// Les deux fichiers sont écrits par src/engine/__tests__/anim-audit-v230.test.ts :
//   AUDIT_V230=avant AUDIT_FLAGS=0 npx vitest run src/engine/__tests__/anim-audit-v230.test.ts
//   AUDIT_V230=apres npx vitest run src/engine/__tests__/anim-audit-v230.test.ts
// puis : node scripts/v230/summary.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const dir = 'docs/v230/audit';
const A = JSON.parse(readFileSync(`${dir}/avant.json`, 'utf8'));
const B = JSON.parse(readFileSync(`${dir}/apres.json`, 'utf8'));
const key = (m) => `${m.coach}|${m.style}|${m.motion}`;
const after = new Map(B.motions.map((m) => [key(m), m]));
const pairs = A.motions.map((a) => [a, after.get(key(a))]).filter(([, b]) => b);

const f1 = (x) => (x === undefined || Number.isNaN(x) ? '–' : x.toFixed(1).replace('.', ','));
const f2 = (x) => (x === undefined || Number.isNaN(x) ? '–' : x.toFixed(2).replace('.', ','));
const ms = (x) => (x === undefined ? '–' : `${Math.round(x * 1000)}`);
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const COACHES = ['mma-kadir', 'mma-amara', 'nael', 'victor', 'inaya', 'kanya'];
const NAME = { 'mma-kadir': 'Kadir', 'mma-amara': 'Amara', nael: 'Naël', victor: 'Victor', inaya: 'Inaya', kanya: 'Kanya' };
const STRIKES = ['direct', 'crochet', 'uppercut', 'coude', 'pied-droit', 'pied-circulaire', 'genou'];

const out = [];
const p = (s = '') => out.push(s);
p('# 2.3.0 : mesures du moteur avant / après (généré)');
p();
p('Généré par `node scripts/v230/summary.mjs` à partir de `docs/v230/audit/avant.json` (moteur 2.3.0 avec toutes les');
p('corrections coupées, identique au moteur 2.2.0) et `apres.json` (corrections actives). Mesures faites sur les squelettes');
p(`réels des 6 coachs, ${pairs.length} couples coach × discipline × technique, 120 images par seconde.`);
p();
p('Lecture : **pic hanches / épaules / poing** = instant (ms depuis le début) où la ligne des hanches, celle des épaules');
p('et l’extrémité qui frappe tournent ou vont le plus vite ; une chaîne cinétique saine a hanches < épaules < poing.');
p('**Arrêt** = durée où l’extrémité reste immobile (à 1 % de la taille près) autour de l’impact. **Vitesse** = vitesse');
p('de l’extrémité juste avant l’impact (m/s). **Saut de vitesse** (dv) = plus grand changement de vitesse d’une');
p('articulation entre deux images (tailles par seconde) : au-delà de 10, l’œil voit un à-coup. **Rotation parasite** =');
p('plus grand tour d’un coude ou d’un genou autour de son membre en 1/60 s (degrés).');
p();

// 1. families
p('## 1. Par famille de techniques (moyenne des 6 coachs)');
p();
p('| Famille | n | Saut de vitesse moyen avant → après | Rotation parasite moy. | Arrêt à l’impact (ms) | Vitesse à l’impact (m/s) |');
p('|---|---|---|---|---|---|');
const fams = [...new Set(pairs.map(([a]) => a.family))];
for (const f of fams) {
  const ps = pairs.filter(([a]) => a.family === f);
  const st = ps.filter(([a, b]) => a.freeze !== undefined && b.freeze !== undefined);
  p(
    `| ${f} | ${ps.length} | ${f2(mean(ps.map(([a]) => a.dv)))} → ${f2(mean(ps.map(([, b]) => b.dv)))} | ${f1(mean(ps.map(([a]) => a.swivel)))}° → ${f1(mean(ps.map(([, b]) => b.swivel)))}° | ` +
      (st.length ? `${ms(mean(st.map(([a]) => a.freeze)))} → ${ms(mean(st.map(([, b]) => b.freeze)))} | ${f2(mean(st.map(([a]) => a.impactSpeed)))} → ${f2(mean(st.map(([, b]) => b.impactSpeed)))} |` : '– | – |'),
  );
}
p();

// 2. counts of anomalies
const count = (sel, test) => sel.filter(test).length;
const As = pairs.map(([a]) => a);
const Bs = pairs.map(([, b]) => b);
p('## 2. Anomalies comptées sur les 1272 mesures');
p();
p('| Anomalie | Avant | Après |');
p('|---|---|---|');
p(`| Saut de vitesse > 10 tailles/s (à-coup visible) | ${count(As, (m) => m.dv > 10)} | ${count(Bs, (m) => m.dv > 10)} |`);
p(`| Rotation parasite d’un coude ou genou > 90° en 1/60 s | ${count(As, (m) => m.swivel > 90)} | ${count(Bs, (m) => m.swivel > 90)} |`);
p(`| Rotation parasite > 45° | ${count(As, (m) => m.swivel > 45)} | ${count(Bs, (m) => m.swivel > 45)} |`);
p(`| Pied d’appui qui glisse > 1 cm par image | ${count(As, (m) => m.slide > 1)} | ${count(Bs, (m) => m.slide > 1)} |`);
p(`| Pied sous le sol > 1 cm | ${count(As, (m) => m.sink > 1)} | ${count(Bs, (m) => m.sink > 1)} |`);
p(`| Coup dont les épaules tournent avant les hanches | ${count(As, (m) => m.chain && m.chain.shoulder < m.chain.hip - 1e-6)} | ${count(Bs, (m) => m.chain && m.chain.shoulder < m.chain.hip - 1e-6)} |`);
p(`| Coup dont hanches et épaules culminent ensemble (± 5 ms) | ${count(As, (m) => m.chain && Math.abs(m.chain.shoulder - m.chain.hip) <= 0.005)} | ${count(Bs, (m) => m.chain && Math.abs(m.chain.shoulder - m.chain.hip) <= 0.005)} |`);
p(`| Poing, coude ou pied immobile ≥ 50 ms à l’impact | ${count(As, (m) => (m.freeze ?? 0) >= 0.05)} | ${count(Bs, (m) => (m.freeze ?? 0) >= 0.05)} |`);
p();

// 3. per coach (morphology)
p('## 3. Par coach (contrôle morphologique, phase D)');
p();
p('Mêmes techniques et mêmes règles pour les six coachs ; aucun réglage ne dépend du sexe. Les écarts restants viennent');
p('des proportions (bras, jambes, taille), que le moteur lit sur chaque squelette.');
p();
p('| Coach | Saut de vitesse moy. | Rotation parasite moy. | Arrêt à l’impact moy. (ms) | Vitesse à l’impact moy. (m/s) | Garde : rebond périodique (1 = identique) |');
p('|---|---|---|---|---|---|');
for (const c of COACHES) {
  const ps = pairs.filter(([a]) => a.coach === c);
  const st = ps.filter(([a, b]) => STRIKES.includes(a.family) && a.freeze !== undefined && b.freeze !== undefined);
  const ia = A.idle.filter((x) => x.coach === c);
  const ib = B.idle.filter((x) => x.coach === c);
  p(
    `| ${NAME[c]} | ${f2(mean(ps.map(([a]) => a.dv)))} → ${f2(mean(ps.map(([, b]) => b.dv)))} | ${f1(mean(ps.map(([a]) => a.swivel)))}° → ${f1(mean(ps.map(([, b]) => b.swivel)))}° | ` +
      `${ms(mean(st.map(([a]) => a.freeze)))} → ${ms(mean(st.map(([, b]) => b.freeze)))} | ${f2(mean(st.map(([a]) => a.impactSpeed)))} → ${f2(mean(st.map(([, b]) => b.impactSpeed)))} | ` +
      `${f2(mean(ia.map((x) => x.periodic)))} → ${f2(mean(ib.map((x) => x.periodic)))} |`,
  );
}
p();

// 4. main techniques, Kadir & Amara & others
const TECHS = ['jab', 'direct', 'crochet-avant', 'crochet-arriere', 'uppercut-avant', 'uppercut-arriere', 'overhand', 'teep-avant', 'front-kick-avant', 'middle-kick-arriere', 'high-kick-avant', 'high-kick-arriere', 'low-kick-arriere', 'genou-direct-arriere', 'coude-horizontal-arriere'];
p('## 4. Techniques principales, chaque coach (discipline de référence)');
p();
p('| Technique | Coach | Pics hanches / épaules / extrémité (ms) avant | après | Arrêt (ms) | Vitesse (m/s) | Saut de vitesse | Rotation parasite |');
p('|---|---|---|---|---|---|---|---|');
const pref = ['boxing', 'muaythai', 'kickboxing', 'mma'];
for (const t of TECHS) {
  for (const c of COACHES) {
    const ps = pairs.filter(([a]) => a.coach === c && a.motion === t).sort((x, y) => pref.indexOf(x[0].style) - pref.indexOf(y[0].style));
    if (!ps.length) continue;
    const [a, b] = ps[0];
    const ch = (m) => (m.chain ? `${ms(m.chain.hip)} / ${ms(m.chain.shoulder)} / ${ms(m.chain.end)}` : '–');
    p(`| ${t} (${a.style}) | ${NAME[c]} | ${ch(a)} | ${ch(b)} | ${ms(a.freeze)} → ${ms(b.freeze)} | ${f2(a.impactSpeed)} → ${f2(b.impactSpeed)} | ${f1(a.dv)} → ${f1(b.dv)} | ${f1(a.swivel)}° → ${f1(b.swivel)}° |`);
  }
}
p();

// 5. worst remaining
p('## 5. Anomalies restantes les plus fortes (après)');
p();
p('| Technique | Coach | Discipline | Saut de vitesse (articulation, instant) | Rotation parasite (articulation) | Glissement du pied (cm/image) |');
p('|---|---|---|---|---|---|');
const worst = [...pairs].sort(([, x], [, y]) => Math.max(y.dv / 10, y.swivel / 90) - Math.max(x.dv / 10, x.swivel / 90)).slice(0, 25);
for (const [, b] of worst) p(`| ${b.motion} | ${NAME[b.coach]} | ${b.style} | ${f1(b.dv)} (${b.dvJoint}, ${f2(b.dvT)} s) | ${f1(b.swivel)}° (${b.swivelJoint}) | ${f1(b.slide)} |`);
p();

// 6. combos
p('## 6. Enchaînements');
p();
p('| Coach | Discipline | Enchaînement | Saut de vitesse avant → après | Écarts entre impacts (ms) avant | après |');
p('|---|---|---|---|---|---|');
const ck = (c) => `${c.coach}|${c.style}|${c.sequence.join('+')}`;
const cb = new Map(B.combos.map((c) => [ck(c), c]));
for (const a of A.combos) {
  const b = cb.get(ck(a));
  if (!b) continue;
  p(`| ${NAME[a.coach]} | ${a.style} | ${a.sequence.join(' + ')} | ${f1(a.dv)} → ${f1(b.dv)} | ${a.gaps.map(ms).join(', ')} | ${b.gaps.map(ms).join(', ')} |`);
}
p();
writeFileSync('docs/v230/AUDIT_MESURES.md', out.join('\n'));
console.log(`docs/v230/AUDIT_MESURES.md : ${out.length} lignes, ${pairs.length} couples`);
