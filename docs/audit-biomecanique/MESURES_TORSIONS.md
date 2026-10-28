# Mesures des torsions articulaires

Généré par `AUDIT_UPDATE=1 npx vitest run src/engine/__tests__/torsion-range.test.ts`. Ne pas modifier à la main.

## Ce qui est mesuré

Les deux champions (Kadir, `coaches/mma-kadir/model.glb` ; Amara, `coaches/mma-amara/model.glb`), toutes les
techniques hors partenaire, dans chaque style de leurs disciplines, en garde orthodoxe et en fausse garde, avec la garde
de la discipline et la garde propre du coach : 1696 animations, 81904 images à 60 images par seconde.

- **Os par os** : rotation locale de chaque os depuis la pose de repos, décomposée en torsion autour de l’axe propre
  de l’os (direction de repos vers son enfant) et en inclinaison (« swing-twist »).
- **Tronc** : torsion du haut du thorax (Spine2) par rapport au bassin, autour de l’axe de la colonne ; **lombaires** :
  torsion de l’os Spine seul ; **cou** : tête par rapport au thorax.
- **Épaule et hanche** : rotation axiale du bras (de la cuisse) depuis la position anatomique (bras pendant, pli du
  coude vers l’avant ; cuisse verticale), mesurée par décomposition swing-twist autour de la verticale, l’équivalent
  de la somme des deux rotations axiales de la convention ISB (Wu et al. 2005 ; Baerlocher & Boulic 2004). Cette
  rotation n’est pas définie quand le membre pointe presque à la verticale vers le haut : elle n’est jugée que pour
  une élévation ≤ 135°.
- **Pronation / supination** : orientation de la paume par rapport à l’axe du coude, autour de l’avant-bras (avant-bras
  + main) ; neutre = pouce vers le haut.
- **Poignet** : flexion / extension et inclinaison radiale / cubitale de la main dans le repère de l’avant-bras.
- **Coude, genou** : pli à l’envers (hyperextension) ou pli de côté ; rotation axiale du genou selon sa flexion.

## Amplitudes de référence

Valeurs cliniques usuelles d’un adulte sain, **citées de mémoire** (non revérifiées dans les ouvrages) :
AAOS (*Joint Motion: Method of Measuring and Recording*, 1965) repris par Norkin & White (*Measurement of Joint Motion*),
White & Panjabi (*Clinical Biomechanics of the Spine*), Kapandji (*Physiologie articulaire*). Les sportifs de combat
peuvent dépasser un peu ces valeurs (épaule, hanche) ; elles servent de garde-fou, pas de cible.

Tolérance du test : 3° (butée douce des limiteurs, incertitude de la position neutre lue sur la pose de repos).

| Mesure | Référence | Source |
|---|---|---|
| Rotation du tronc (bassin → haut du thorax) | 45° | AAOS : 45° |
| Rotation lombaire (os Spine seul) | 10° | White & Panjabi : ≈ 2° par étage, ≈ 10° |
| Rotation du cou (thorax → tête) | 80° | AAOS : 80° |
| Épaule : rotation interne | 70° | AAOS : 70° |
| Épaule : rotation externe | 90° | AAOS : 90° |
| Avant-bras : pronation | 85° | AAOS : 80°, Norkin & White : jusqu’à 85–90° |
| Avant-bras : supination | 85° | AAOS : 80°, Norkin & White : jusqu’à 85–90° |
| Poignet : flexion | 80° | AAOS : 80° |
| Poignet : extension | 70° | AAOS : 70° |
| Poignet : inclinaison radiale | 20° | AAOS : 20° |
| Poignet : inclinaison cubitale | 30° | AAOS : 30° |
| Coude : hyperextension (pli à l’envers) | 10° | 5–10° chez l’adulte sain |
| Genou : hyperextension (pli à l’envers) | 5° | ≈ 5° |
| Hanche : rotation interne | 45° | AAOS : 45° (Kapandji : 30–40°) |
| Hanche : rotation externe | 45° | AAOS : 45° (Kapandji : 60°) |
| Genou : rotation axiale | 5° → 30° | Kapandji : ≈ 0 jambe tendue, 30° à 90° de flexion |
| Torsion portée par l’os de la main seul (peau du poignet) | — | pas de limite (indicatif) |
| Hanche : élévation de la cuisse (flexion / abduction) | — | pas de limite ici (indicatif) |

## Pires valeurs, avant / après

« Avant » : le moteur avant ce correctif (`torsions-avant.json`, même mesure). Le dépassement est la pire valeur
au-delà de la référence (pour le genou, de la référence à sa flexion du moment).

| Mesure | Référence | Avant : pire | Avant : dépasse | Après : pire | Après : dépasse | Où (après) |
|---|---|---|---|---|---|---|
| Rotation du tronc (bassin → haut du thorax) | 45° | 31° | non | 31° | non | mma-kadir genou-circulaire-arriere (kickboxing, garde du coach) t=0.43 s |
| Rotation lombaire (os Spine seul) | 10° | 9° | non | 5° | non | mma-kadir sortie-hanche (mma, gaucher) t=0.33 s |
| Rotation du cou (thorax → tête) | 80° | 67° | non | 73° | non | mma-amara shoulder-roll (boxing, garde du coach) t=0.34 s |
| Épaule : rotation interne | 70° | 179° | **+109°** | 70° | **+0°** | mma-kadir overhand (kickboxing, gaucher) t=0.47 s côté L |
| Épaule : rotation externe | 90° | 180° | **+90°** | 90° | non | mma-kadir ukemi-yoko (judo) t=2.03 s côté R |
| Avant-bras : pronation | 85° | 93° | **+8°** | 58° | non | mma-kadir coude-horizontal-arriere (muaythai) t=0.29 s côté R |
| Avant-bras : supination | 85° | 117° | **+32°** | 80° | non | mma-amara uppercut-avant (mma) t=0.26 s côté L |
| Poignet : flexion | 80° | 27° | non | 35° | non | mma-kadir clinch-tirage (muaythai, gaucher, garde du coach) t=0.65 s côté R |
| Poignet : extension | 70° | 66° | non | 69° | non | mma-kadir sit-out (bjj) t=1.82 s côté L |
| Poignet : inclinaison radiale | 20° | 31° | **+11°** | 20° | non | mma-amara sit-out (bjj) t=1.90 s côté L |
| Poignet : inclinaison cubitale | 30° | 73° | **+43°** | 0° | non | mma-kadir ukemi-ushiro (judo) t=1.57 s côté R |
| Coude : hyperextension (pli à l’envers) | 10° | -2° | non | -2° | non | mma-kadir sit-out (bjj) t=2.10 s côté L |
| Genou : hyperextension (pli à l’envers) | 5° | -2° | non | -2° | non | mma-amara uchikomi-ko-uchi-gari (judo, gaucher) t=0.73 s côté L |
| Hanche : rotation interne | 45° | 180° | **+135°** | 45° | non | mma-kadir uchikomi-o-soto-gari (judo, garde du coach) t=0.67 s côté R |
| Hanche : rotation externe | 45° | 180° | **+135°** | 45° | **+0°** | mma-amara high-kick-arriere (mma, gaucher) t=0.30 s côté L |
| Genou : rotation axiale | — | 6° | non | 6° | non | mma-amara genou-circulaire-avant (muaythai, garde du coach) t=0.50 s côté L |
| Torsion portée par l’os de la main seul (peau du poignet) | — | 54° | non | 37° | non | mma-kadir uppercut-arriere (muaythai, gaucher) t=0.26 s côté L |
| Hanche : élévation de la cuisse (flexion / abduction) | — | 169° | non | 151° | non | mma-kadir changement-base (bjj, gaucher) t=0.57 s côté L |

## Techniques hors amplitude

| Mesure | Avant | Après |
|---|---|---|
| Épaule : rotation interne | middle-kick-avant +109°, defense-lutte +105°, pont +97°, retention-garde +97°, changement-base +92°, genou-circulaire-avant +76°, sortie-hanche +73°, releve-technique +61°, … (35) | overhand +0°, pont +0°, descente-sol +0°, releve-technique +0°, sortie-hanche +0°, ukemi-yoko +0°, uchikomi-o-goshi +0°, genou-circulaire-avant +0°, … (17) |
| Épaule : rotation externe | middle-kick-avant +90°, changement-base +84°, overhand +33°, crochet-avant +23°, genou-circulaire-avant +19°, crochet-avant-corps +11° | ukemi-yoko +0°, overhand +0°, coude-diagonal-avant +0°, genou-circulaire-avant +0°, changement-base +0°, sit-out +0° |
| Avant-bras : pronation | changement-base +8°, sprawl +4°, sortie-hanche +4°, retention-garde +4°, pont +4°, releve-technique +4°, descente-sol +4° | — |
| Avant-bras : supination | uppercut-avant +32°, uppercut-arriere +32° | — |
| Poignet : inclinaison radiale | clinch-tirage +11°, genou-circulaire-clinch +7°, genou-clinch +7° | — |
| Poignet : inclinaison cubitale | changement-base +43°, sprawl +38°, sortie-hanche +38°, retention-garde +38°, pont +38°, releve-technique +38°, descente-sol +38° | — |
| Hanche : rotation interne | high-kick-arriere +135°, high-kick-avant +94°, middle-kick-arriere +54°, roundhouse-arriere +53°, uchikomi-seoi +32°, middle-kick-avant +17°, changement-base +10°, low-kick-arriere +0° | uchikomi-o-soto-gari +0° |
| Hanche : rotation externe | high-kick-arriere +135°, changement-base +95°, high-kick-avant +84°, middle-kick-avant +83°, descente-sol +75°, releve-technique +73°, sortie-hanche +73°, roundhouse-avant +68°, … (21) | high-kick-arriere +0°, high-kick-avant +0°, low-kick-avant +0°, check-avant +0°, middle-kick-arriere +0°, releve-technique +0°, roundhouse-arriere +0°, middle-kick-avant +0°, … (14) |

## Torsion os par os (après)

Plus grande torsion autour de l’axe propre de l’os et plus grande inclinaison, depuis la pose de repos. La torsion
d’un os n’est pas une amplitude articulaire à elle seule (le bras tourne à l’épaule, l’avant-bras porte la
pronation) : ce tableau sert à repérer une torsion concentrée sur un seul os.

| Os | Torsion avant | Torsion après | Inclinaison après | Où (après) |
|---|---|---|---|---|
| Spine | 9° | 5° | 12° | mma-kadir sortie-hanche (mma, gaucher) t=0.33 s |
| Spine1 | 11° | 13° | 14° | mma-kadir sortie-hanche (mma, gaucher) t=0.32 s |
| Spine2 | 11° | 14° | 14° | mma-amara genou-circulaire-arriere (kickboxing) t=0.35 s |
| Neck | 30° | 33° | 47° | mma-kadir sit-out (bjj, gaucher) t=1.48 s |
| Head | 35° | 40° | 57° | mma-kadir sit-out (bjj, gaucher) t=1.47 s |
| LeftShoulder | 4° | 4° | 9° | mma-amara sprawl (mma, garde du coach) t=1.09 s |
| LeftArm | 180° | 177° | 139° | mma-kadir genou-circulaire-avant (kickboxing, garde du coach) t=0.12 s |
| LeftForeArm | 66° | 45° | 111° | mma-kadir uppercut-avant (boxing, garde du coach) t=0.26 s |
| LeftHand | 54° | 37° | 67° | mma-kadir uppercut-arriere (muaythai, gaucher) t=0.26 s |
| LeftUpLeg | 180° | 72° | 151° | mma-kadir ukemi-ushiro (judo) t=2.97 s |
| LeftLeg | 6° | 6° | 149° | mma-amara genou-circulaire-avant (muaythai, garde du coach) t=0.50 s |
| LeftFoot | 30° | 32° | 57° | mma-amara uchikomi-o-soto-gari (judo, gaucher) t=1.20 s |
| RightShoulder | 4° | 4° | 9° | mma-amara sit-out (bjj, gaucher) t=1.93 s |
| RightArm | 179° | 128° | 139° | mma-kadir pont (bjj) t=1.10 s |
| RightForeArm | 66° | 45° | 111° | mma-kadir uppercut-avant (mma, gaucher) t=0.26 s |
| RightHand | 54° | 37° | 67° | mma-kadir uppercut-avant (muaythai, gaucher) t=0.28 s |
| RightUpLeg | 180° | 71° | 151° | mma-kadir ukemi-ushiro (judo, gaucher) t=2.97 s |
| RightLeg | 6° | 6° | 149° | mma-amara descente-sol (mma) t=0.47 s |
| RightFoot | 30° | 32° | 57° | mma-kadir uchikomi-o-soto-gari (judo, garde du coach) t=1.20 s |

## Observations

- Élévation maximale de la cuisse : 151° (mma-kadir changement-base (bjj, gaucher) t=0.57 s côté L). Au-delà
  de ≈ 120–125° de flexion de hanche, la cuisse ne monte plus chez la plupart des adultes sans basculer le bassin ;
  ce n’est pas une torsion, mais à revoir avec le travail au sol.
- Torsion portée par la main seule (au-dessus de la part de l’avant-bras) : jusqu’à 37°.
