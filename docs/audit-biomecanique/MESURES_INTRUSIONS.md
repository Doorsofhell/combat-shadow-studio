# Membres qui traversent le corps

Généré par `AUDIT_UPDATE=1 npx vitest run src/engine/__tests__/intrusions.test.ts`. Ne pas modifier à la main.

Mesure (1.41.0) : sur la peau de Kadir, Amara, Naël et Inaya (garde du coach, droitier), toutes les techniques dans chaque style de leurs disciplines, 15 images par seconde. Chaque volume du corps (tronc, tête, cuisses, tibias) a un « cœur » le long de ses os, tranche par tranche et secteur par secteur (un torse est plus large que profond) : 20 % de sa propre peau au repos est plus près des os, et le cœur est encore 1 cm plus profond. Une main, un avant-bras ou une jambe qui entre dans un cœur est dans le corps ; on donne la profondeur. Jusqu’à 2 cm, c’est un contact (chair qui s’écrase, gant contre les côtes).

Résultat : 27 techniques dépassent 2 cm. Elles sont bornées à leur valeur par le test (elles ne peuvent pas empirer) et seront corrigées une par une, avec l’accord de Youssef, car la correction change le trajet d’un membre.

| Technique | Pire profondeur (cm) | Quoi | Où | Instant |
|---|---|---|---|---|
| `uchikomi-o-soto-gari` | 7,5 | main gauche dans le tronc | mma-amara judo | 1,18 s |
| `uchikomi-o-goshi` | 7,2 | jambe droite dans la cuisse gauche | mma-kadir judo | 1,06 s |
| `uchikomi-seoi` | 7,1 | jambe droite dans la cuisse gauche | mma-kadir judo | 1,04 s |
| `uppercut-arriere` | 6,7 | avant-bras droit dans le tronc | inaya boxing | 0,13 s |
| `ukemi-yoko` | 6,6 | avant-bras gauche dans le tronc | mma-kadir judo | 2,05 s |
| `ukemi-ushiro` | 5,7 | avant-bras gauche dans le tronc | mma-kadir judo | 2,84 s |
| `releve-technique` | 5,4 | jambe droite dans la cuisse gauche | inaya bjj | 0,61 s |
| `pont` | 5,2 | main droite dans le tronc | mma-kadir bjj | 0,93 s |
| `sit-out` | 4,9 | avant-bras gauche dans le tronc | mma-kadir bjj | 0,53 s |
| `genou-direct-arriere` | 4,9 | jambe droite dans la cuisse gauche | mma-kadir mma | 0,54 s |
| `changement-base` | 4,8 | avant-bras gauche dans le tronc | mma-amara bjj | 0,53 s |
| `defense-lutte` | 4,7 | avant-bras droit dans le tronc | mma-kadir mma | 0,27 s |
| `genou-circulaire-arriere` | 4,5 | jambe droite dans la cuisse gauche | mma-kadir kickboxing | 0,54 s |
| `shoulder-roll` | 4,2 | avant-bras droit dans le tronc | nael boxing | 0,20 s |
| `single-leg` | 3,9 | avant-bras gauche dans le tronc | mma-kadir bjj | 0,74 s |
| `coude-montant-arriere` | 3,9 | main droite dans la tête | mma-kadir muaythai | 0,34 s |
| `uchikomi-ko-uchi-gari` | 3,7 | jambe gauche dans la cuisse droite | inaya judo | 0,67 s |
| `switch-kick` | 3,5 | main gauche dans le tronc | inaya kickboxing | 0,60 s |
| `middle-kick-arriere` | 3,3 | main droite dans le tronc | mma-kadir mma | 0,40 s |
| `retention-garde` | 3,2 | avant-bras gauche dans le tronc | mma-kadir bjj | 1,99 s |
| `crochet-avant` | 3,2 | avant-bras droit dans le tronc | nael boxing | 0,19 s |
| `blocage-corps-avant` | 2,7 | avant-bras droit dans le tronc | nael boxing | 0,25 s |
| `releve-genoux` | 2,5 | main gauche dans la cuisse gauche | inaya bjj | 0,80 s |
| `rattrapage-middle` | 2,5 | avant-bras droit dans le tronc | nael muaythai | 0,78 s |
| `check-hook` | 2,5 | avant-bras droit dans le tronc | nael boxing | 0,27 s |
| `esquive-droite` | 2,1 | avant-bras droit dans le tronc | nael boxing | 0,20 s |
| `genou-clinch` | 2,1 | jambe droite dans la cuisse gauche | mma-kadir muaythai | 0,61 s |

## Victor (1.43.0)

Même mesure sur la peau de Victor (corps de Kadir élargi : torse, avant-bras, mollets). Bornes propres : une technique ne peut pas être plus profonde qu’ici.

| Technique | Pire profondeur (cm) | Quoi | Où | Instant |
|---|---|---|---|---|
| `ukemi-yoko` | 7,3 | avant-bras gauche dans le tronc | victor judo | 1,32 s |
| `uchikomi-o-goshi` | 7,1 | jambe droite dans la cuisse gauche | victor judo | 1,06 s |
| `uchikomi-seoi` | 7,0 | jambe droite dans la cuisse gauche | victor judo | 1,04 s |
| `uchikomi-o-soto-gari` | 6,1 | main gauche dans le tronc | victor judo | 1,24 s |
| `ukemi-ushiro` | 6,1 | avant-bras gauche dans le tronc | victor judo | 2,84 s |
| `pont` | 6,0 | main droite dans le tronc | victor bjj | 0,93 s |
| `sit-out` | 5,9 | avant-bras gauche dans le tronc | victor bjj | 0,53 s |
| `uppercut-arriere` | 5,7 | avant-bras droit dans le tronc | victor boxing | 0,13 s |
| `genou-direct-arriere` | 5,3 | jambe droite dans la cuisse gauche | victor mma | 0,54 s |
| `changement-base` | 5,2 | avant-bras gauche dans le tronc | victor bjj | 1,47 s |
| `single-leg` | 5,0 | avant-bras gauche dans le tronc | victor bjj | 0,74 s |
| `genou-circulaire-arriere` | 5,0 | jambe gauche dans la cuisse droite | victor kickboxing | 0,54 s |
| `releve-technique` | 5,0 | jambe droite dans la cuisse gauche | victor bjj | 0,61 s |
| `middle-kick-arriere` | 4,4 | main droite dans le tronc | victor kickboxing | 0,40 s |
| `retention-garde` | 4,2 | avant-bras droit dans le tronc | victor bjj | 1,26 s |
| `uchikomi-ko-uchi-gari` | 4,1 | jambe gauche dans la cuisse droite | victor judo | 0,80 s |
| `shoulder-roll` | 3,8 | avant-bras droit dans le tronc | victor boxing | 0,20 s |
| `crochet-avant` | 3,0 | avant-bras droit dans le tronc | victor boxing | 0,19 s |
| `blocage-corps-avant` | 2,7 | avant-bras droit dans le tronc | victor boxing | 0,19 s |
| `rattrapage-middle` | 2,6 | avant-bras droit dans le tronc | victor muaythai | 0,78 s |
| `check-hook` | 2,5 | avant-bras droit dans le tronc | victor boxing | 0,27 s |
| `genou-clinch` | 2,3 | jambe droite dans la cuisse gauche | victor muaythai | 0,61 s |
| `high-kick-arriere` | 2,3 | main droite dans le tronc | victor kickboxing | 0,40 s |
| `esquive-droite` | 2,2 | avant-bras droit dans le tronc | victor boxing | 0,20 s |
| `genou-circulaire-clinch` | 2,1 | jambe droite dans la cuisse gauche | victor muaythai | 0,61 s |
