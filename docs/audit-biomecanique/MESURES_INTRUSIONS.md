# Membres qui traversent le corps

Généré par `AUDIT_UPDATE=1 npx vitest run src/engine/__tests__/intrusions.test.ts`. Ne pas modifier à la main.

Mesure (1.41.0) : sur la peau de Kadir, Amara, Naël et Inaya (garde du coach, droitier), toutes les techniques dans chaque style de leurs disciplines, 15 images par seconde. Chaque volume du corps (tronc, tête, cuisses, tibias) a un « cœur » le long de ses os, tranche par tranche et secteur par secteur (un torse est plus large que profond) : 20 % de sa propre peau au repos est plus près des os, et le cœur est encore 1 cm plus profond. Une main, un avant-bras ou une jambe qui entre dans un cœur est dans le corps ; on donne la profondeur. Jusqu’à 2 cm, c’est un contact (chair qui s’écrase, gant contre les côtes).

Résultat : 31 techniques dépassent 2 cm. Elles sont bornées à leur valeur par le test (elles ne peuvent pas empirer) et seront corrigées une par une, avec l’accord de Youssef, car la correction change le trajet d’un membre.

| Technique | Pire profondeur (cm) | Quoi | Où | Instant |
|---|---|---|---|---|
| `genou-direct-arriere` | 9,6 | avant-bras droit dans le tronc | mma-kadir mma | 0,14 s |
| `entree-lutte` | 7,9 | main gauche dans la cuisse gauche | inaya bjj | 0,73 s |
| `retrait` | 7,8 | avant-bras droit dans le tronc | nael boxing | 0,35 s |
| `uchikomi-o-soto-gari` | 7,6 | main gauche dans le tronc | mma-amara judo | 1,18 s |
| `uchikomi-o-goshi` | 7,2 | jambe droite dans la cuisse gauche | mma-kadir judo | 1,06 s |
| `uchikomi-seoi` | 7,1 | jambe droite dans la cuisse gauche | mma-kadir judo | 1,04 s |
| `uppercut-arriere` | 7,0 | avant-bras droit dans le tronc | nael boxing | 0,21 s |
| `rattrapage-middle` | 6,7 | avant-bras droit dans le tronc | nael muaythai | 0,78 s |
| `ukemi-yoko` | 6,6 | avant-bras gauche dans le tronc | mma-kadir judo | 2,05 s |
| `releve-technique` | 6,4 | main gauche dans la cuisse gauche | mma-kadir bjj | 0,54 s |
| `ukemi-ushiro` | 5,7 | avant-bras gauche dans le tronc | mma-kadir judo | 2,84 s |
| `genou-circulaire-arriere` | 5,3 | jambe droite dans la cuisse gauche | mma-kadir kickboxing | 0,54 s |
| `changement-base` | 5,0 | avant-bras gauche dans le tronc | mma-amara bjj | 0,53 s |
| `sit-out` | 4,9 | avant-bras gauche dans le tronc | mma-kadir bjj | 0,53 s |
| `coude-montant-arriere` | 4,9 | main droite dans la tête | mma-kadir muaythai | 0,39 s |
| `teep-avant` | 4,8 | main gauche dans la cuisse gauche | mma-kadir mma | 0,27 s |
| `shoulder-roll` | 4,2 | avant-bras droit dans le tronc | nael boxing | 0,20 s |
| `defense-lutte` | 3,9 | avant-bras droit dans le tronc | mma-kadir mma | 0,14 s |
| `uchikomi-ko-uchi-gari` | 3,7 | jambe gauche dans la cuisse droite | inaya judo | 0,67 s |
| `sprawl` | 3,4 | avant-bras droit dans le tronc | mma-kadir mma | 0,20 s |
| `crochet-avant` | 3,3 | avant-bras droit dans le tronc | nael boxing | 0,21 s |
| `retention-garde` | 3,2 | avant-bras gauche dans le tronc | mma-kadir bjj | 1,99 s |
| `switch-kick` | 3,2 | main gauche dans le tronc | inaya kickboxing | 0,60 s |
| `pont` | 3,2 | avant-bras gauche dans le tronc | mma-kadir bjj | 1,40 s |
| `blocage-corps-avant` | 2,7 | avant-bras droit dans le tronc | nael boxing | 0,25 s |
| `middle-kick-arriere` | 2,6 | main droite dans le tronc | mma-kadir mma | 0,40 s |
| `releve-genoux` | 2,5 | main gauche dans la cuisse gauche | inaya bjj | 0,80 s |
| `check-hook` | 2,5 | avant-bras droit dans le tronc | nael boxing | 0,27 s |
| `genou-direct-avant` | 2,2 | jambe gauche dans la jambe (tibia) droit | mma-amara muaythai | 0,54 s |
| `esquive-droite` | 2,1 | avant-bras droit dans le tronc | nael boxing | 0,20 s |
| `genou-clinch` | 2,1 | jambe droite dans la cuisse gauche | mma-kadir muaythai | 0,61 s |
