# Enrichissement des disciplines (v0.28.0, en préparation)

Demande de Youssef : « Je voudrais aussi que tu enrichisses toutes les disciplines ». Ce document fait
l’audit par discipline (ce qui existait, ce qui est ajouté, avec quelles sources) et dit ce qui a été
écarté et pourquoi.

Règles suivies :

- **Une technique commune = une seule définition** (`src/domain/techniques.ts`), affichée dans chaque
  discipline. Ce qui change d’une discipline à l’autre va dans le nouveau champ `notes` (une note par
  discipline, affichée sur la fiche sous le titre « En judo », « En MMA »…), jamais dans une copie.
- **Qualité avant quantité** : rien n’est ajouté sans source lue ; les sources sont listées dans
  `src/domain/biomech/sources.ts` et affichées en bas de la fiche (champ `sources`).
- **Animations** : chaque nouvelle animation passe les contrôles automatiques (amplitude coude ≤ 150°,
  genou ≤ 155°, continuité, chaîne et impact pour les frappes, équilibre sur une jambe, chevilles,
  torsions sur les deux coachs champions avec leur garde propre, fluidité). Statut : « contrôlée
  automatiquement », jamais « validée » : aucune revue d’expert n’a eu lieu.
- **Sécurité** : nouveau champ `safety` (encadré « Sécurité » de la fiche) pour les chutes, le travail à
  genoux et l’attrape. Les chutes sont proposées **uniquement en version basse** (accroupi, assis), sur un
  tapis épais, jamais depuis debout à la maison.

## Bilan chiffré

| Discipline | Techniques avant | Techniques après | Exercices ajoutés |
|---|---|---|---|
| Boxe anglaise | 28 | 30 | 4 |
| Kick-boxing | 45 | 46 | 2 |
| Muay-thaï | 51 | 54 | 4 |
| MMA | 51 | 54 | 4 |
| Jiu-jitsu brésilien | 7 | 13 | 9 |
| Judo | 7 | 15 | 13 |

16 nouvelles animations, 4 techniques existantes partagées avec une discipline de plus, 36 exercices
ajoutés (à la fin de chaque niveau, pour que les identifiants des exercices existants ne bougent pas),
2 programmes (les premiers de BJJ et de judo).

## Judo

**Existait** : shizen-tai, tsugi-ashi (avant, arrière, latéral), tai-sabaki, kuzushi, uchikomi de
seoi-nage ; fiches partenaire (ukemi, o-soto-gari, o-goshi, seoi-nage…).

**Ajouté** (8 nouvelles animations) :

| Technique | Catégorie | Source |
|---|---|---|
| `ayumi-ashi` Ayumi-ashi (pas marchés) | Déplacement | jb-S5 (glossaire IJF/Kodokan) |
| `kumikata` Kumi-kata (prise de garde, solo) | Garde | jb-S5 (kumikata, tsurite, hikite) |
| `uchikomi-o-goshi` Uchikomi d’o-goshi | Entrée de projection | jb-S5 (koshi-waza, déséquilibre avant) |
| `uchikomi-o-soto-gari` Uchikomi d’o-soto-gari | Entrée de projection | jb-S5 (ashi-waza, déséquilibre arrière) |
| `uchikomi-o-uchi-gari` Uchikomi d’o-uchi-gari | Entrée de projection | jb-S5 (déséquilibre arrière gauche, fauchage par l’intérieur) |
| `uchikomi-ko-uchi-gari` Uchikomi de ko-uchi-gari | Entrée de projection | jb-S5 (talon balayé par l’intérieur, plante du pied) |
| `ukemi-ushiro` Ushiro-ukemi, version basse | Chute (nouvelle catégorie) | jb-S11 (Judo Québec), jb-S5 |
| `ukemi-yoko` Yoko-ukemi, version basse | Chute | jb-S11, jb-S5 |

Les uchikomi ne montrent que l’entrée (tsukuri) : jamais de fauchage réel ni de projection en solo. Les
fiches partenaire o-goshi et o-soto-gari pointent maintenant vers leur propre uchikomi ; la fiche ukemi
pointe vers la chute arrière basse, et sa consigne de sécurité dit ce qui est permis à la maison.

## Jiu-jitsu brésilien

**Existait** : posture debout, descente au sol, pont, sortie de hanche, rétention de garde, changement de
base, relevé technique.

**Ajouté** : `sit-out` (nouveau, aussi MMA ; jb-S51 Grapplearts, jb-S52 Jitsu IQ), `releve-genoux`
(nouveau ; jb-S51). **Partagé** avec le BJJ, sans copie : `ukemi-ushiro` (jb-S51 : chutes assises),
`changement-niveau`, `entree-lutte`, `single-leg` (note BJJ : le règlement JJIF compte l’amenée au sol
parmi les actions qui marquent des points, jb-S26). Les contrôles de torsion ont été refaits dans le style
BJJ avant de partager.

## Boxe anglaise

**Ajouté** : `check-hook` (crochet du bras avant en pivotant sur le pied avant ; aussi MMA ; boxe-S21
Evolve MMA, boxe-S22 Wikipédia : pied arrière qui tourne de 45 à 90°), `shoulder-roll` (défense
« philly shell » ; boxe-S20 Evolve MMA). Le sens du pivot du check hook (dans le sens du crochet) est
notre lecture des sources, qui ne le précisent pas.

## Kick-boxing et muay-thaï

**Ajouté** : `switch-kick` (muay-thaï et kick-boxing ; kbmt-S26 muaythai.com), ajouté à la règle des coups
de pied circulaires des trois styles WAKO (carte du règlement) ; `garde-longue` et `rattrapage-middle`
(muay-thaï seulement ; kbmt-S30 Evolve MMA). L’attrape n’est pas proposée en kick-boxing : le règlement K1
de la WAKO interdit d’attraper pour frapper (kbmt-S16, art. 4.3).

## MMA

**Ajouté** : `single-leg` (entrée solo ; mma-S30 Evolve MMA), `check-hook` et `sit-out` (définitions
partagées ci-dessus).

## Coach IA

Les nouvelles techniques passent automatiquement dans la base de connaissances (fiche, étapes, erreurs,
note solo). Ajouts : synonymes de reconnaissance (« o soto gari », « chute arrière », « sit out »,
« philly shell »…), « single leg » et « switch kick » retirés de la liste des gestes inconnus, deux
questions suggérées par nouvelle technique, nuance de la catégorie « Chutes », article correct
(« la garde longue », « le yoko-ukemi »).

## Écarté, et pourquoi

- **Roulades avant, arrière, granby, mae-mawari-ukemi** : risque pour la nuque, animation sûre impossible
  à garantir, et contraire à la règle « pas de chute depuis debout à la maison ».
- **Sprawl en BJJ** : le contrôle de torsion échoue dans le style BJJ (cou à 158° avec la garde propre du
  coach) ; partagé seulement quand l’animation sera corrigée.
- **Shrimp sur le dos (doublon)** : c’est déjà la sortie de hanche, partagée MMA et BJJ.
- **Hip bump, coup de pied retourné, coup de pied latéral, genou sauté, ground and pound** : pas de source
  pédagogique suffisante lue, ou travail qui demande un partenaire.

## Limites

- Aucune animation n’est validée par un expert : statut « contrôlée automatiquement ».
- Sources pédagogiques en ligne (Evolve MMA, Grapplearts, Jitsu IQ, muaythai.com, Wikipédia) lues par un
  lecteur web de synthèse : à vérifier sur l’original avant toute citation mot pour mot.
- Les uchikomi de judo sont construits depuis le shizen-tai simple dans les autres styles (elles n’y
  existent que pour la disponibilité) : la garde propre du coach champion ne s’applique qu’en judo.
- Miniatures o-uchi-gari et ko-uchi-gari : prises au moment de l’impact, le geste du pied y est discret.
