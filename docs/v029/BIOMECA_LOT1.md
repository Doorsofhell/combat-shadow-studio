# Biomécanique et morphologie, lot 1 : les 5 techniques de « Combinaison 8 armes » (v0.29.0-proto4)

Demandes de Youssef du 2026-10-21 :
- 21:00, « Morphologie athlétique et biomécanique ultra-réaliste », avec 5 captures de téléphone ;
- 21:02, « Recherche vidéo et analyse biomécanique obligatoires ».

Branche `feature/biomeca-v029`, partie de `fix/3d-context-recovery-v029` (PR #1), qu'elle ne modifie pas. PR sans
fusion.

**Statut de chaque technique : « Validation technique nécessaire ».** Les corrections sont intégrées, mesurées
par des tests et vues sur des captures. Elles n'ont pas été vues par un entraîneur qualifié ni sur le téléphone de
Youssef. Elles ne sont donc pas déclarées validées.

## 1. Recherche : ce qui a été consulté, et comment

- **Vidéos : aucune n'a été visionnée.**
  - Les sites youtube.com, i.ytimg.com et commons.wikimedia.org sont refusés par le réseau de cet environnement
    (`connect_rejected`).
  - Je n'ai donc pu voir ni image ni extrait. Aucune analyse image par image n'a été faite.
  - Le registre `docs/audit-biomecanique/REGISTRE_VIDEOS.md` garde toutes ses vidéos au statut « non visionnée ».
- **Alternative utilisée : des textes.** Il s'agit d'études biomécaniques, de manuels de fédérations et d'articles
  d'entraîneurs, lus en entier ou en partie selon la colonne « lu » de `docs/audit-biomecanique/BIBLIOGRAPHIE.md`.
  - Les codes `boxe-Sx` et `kbmt-Sx` renvoient à cette bibliographie.
  - Les passages utilisés sont dans `docs/audit-biomecanique/recherche/boxe.md` (fiches C10, C13) et
    `recherche/kickboxing-muaythai.md` (fiches C.9, C.14, C.16).
- **Au moins deux sources indépendantes par technique** (tableau §3).
- **Crédibilité.** Les études publiées (boxe-S7, boxe-S8, boxe-S9) mesurent des boxeurs. Les manuels viennent de
  fédérations ou d'organismes publics (USA Boxing, Office fédéral du sport suisse). Les articles de muay-thaï
  (muaythai.com, Evolve, 8limbs) sont des consignes d'entraîneurs : ce sont des sources pédagogiques, pas des
  mesures. Pour le teep, le genou et le coude, aucune étude biomécanique propre n'a été lue.
- **Aucune animation, vidéo ou donnée de mouvement d'un tiers n'a été extraite ni réutilisée.** Les mouvements
  restent écrits à la main dans notre moteur (`src/engine/library/*.ts`), à partir des descriptions textuelles.

## 2. Méthode de vérification

Pour chaque technique corrigée :
1. **Mesures sur le squelette** des deux coachs Ultra-réalistes (Kadir et Amara), en garde muay-thaï :
   - flexion du coude ;
   - axe poignet / avant-bras ;
   - hauteur du coude par rapport à l'épaule ;
   - hauteur du genou ;
   - écart entre les chevilles ;
   - inclinaison du buste.
   Le relevé est fait par `src/test/probe.ts`, et les seuils sont fixés dans
   `src/engine/__tests__/muaythai-biomeca.test.ts` (14 tests).
   - Sur l'ancien code, 9 de ces 14 tests échouent.
   - Sur le nouveau code, les 14 réussissent.
2. **Captures** de 3 angles (face, 3/4, profil) × 7 instants, de la garde au retour en garde :
   - préparation ;
   - mi-parcours ;
   - extension maximale ;
   - retour.
   Elles sont faites par `scripts/dev/shot-grid.mjs`, avant et après la correction. Aucune correction n'est jugée
   sur une seule image.
3. **Suites existantes** :
   - amplitudes articulaires (`photo-coach`, `torsion-range`, `ankle-range`) ;
   - chaîne cinétique (`chain`) ;
   - fluidité et vitesse à l'impact (`fluidity`) ;
   - équilibre (`audit`) ;
   - Playwright.

## 3. Fiches par technique

### 3.1 Crochet avant (crochet gauche) — priorité de Youssef

| Élément | Référence | Avant | Après |
|---|---|---|---|
| Flexion du coude à l'impact | « bras fléchi à 90° », poing, coude et épaule à la même hauteur [boxe-S3] ; coude vers 90° [boxe-S2] | Kadir 78°, **Amara 46°** (bras presque tendu) | Kadir 76°, Amara 78° |
| Hauteur du coude | même hauteur que l'épaule [boxe-S3] | **11 cm au-dessus** de l'épaule (le « bras déformé » de la capture) | 2 à 3 cm au-dessus |
| Poignet | phalanges vers l'adversaire, poing dans l'axe [boxe-S1, boxe-S2] | dans l'axe | dans l'axe (< 20° sur toute la durée) |
| Bassin, pied avant | pivot sur la plante, avancée de la hanche [boxe-S3] ; rotation du corps entier [boxe-S7] | bassin −34°, buste −14°, pied avant pivoté de 40°, talon levé | inchangé |
| Trajectoire | arrive par le côté [boxe-S3] ; balaie en remontant [boxe-S9] | armé court, peu latéral | armé plus ouvert sur le côté : arc plus large, **vitesse à l'impact 2,0 → 2,6 m/s** (mesure `fluidity`) |
| Retour | chemin le plus court, autre main à la mâchoire [boxe-S1, boxe-S2, boxe-S3] | inchangé | inchangé |

Correction (`src/engine/library/boxing.ts`, `hook`) :
- le poing est placé à la distance de l'épaule qui fléchit le coude à 90° **pour la longueur de bras de chaque
  coach**, au lieu d'un point fixe ;
- le coude est orienté pour rester à hauteur d'épaule.

### 3.2 Direct arrière

| Élément | Référence | Avant | Après |
|---|---|---|---|
| Coude à l'impact | 137 ± 12° (soit 43° de flexion) sur sac [boxe-S8] ; « piston » [boxe-S7] | **2° de flexion, coude verrouillé** | Kadir 24°, Amara 15° de flexion |
| Pied arrière, poids | poussée de la jambe arrière, poids vers l'avant [boxe-S7, boxe-S1, boxe-S2] | pivot et talon levé | inchangé |
| Ordre | hanche, épaule, coude, poing [boxe-S9] | contrôlé par `chain.test` | inchangé, test réussi |
| Retour | même chemin, l'autre poing à la joue [boxe-S1, boxe-S3] | inchangé | inchangé |

En shadow, le bras va plus loin que sur sac, d'où une flexion plus faible que les 43° mesurés par boxe-S8. Elle n'est
plus nulle : un coude verrouillé fait « bâton » et charge l'articulation.

### 3.3 Genou direct (jambe arrière)

| Élément | Référence | Avant | Après |
|---|---|---|---|
| Montée | pousser les hanches vers l'avant, « don't knee upward » [kbmt-S35] | genou monté vers la poitrine, 34 cm au-dessus de la hanche | poussé vers l'avant à hauteur du foie : 25 cm (Kadir), 17 cm (Amara) au-dessus de la hanche |
| Pied d'appui | plante du pied, talon levé [kbmt-S35] | talon levé 40° | 25° (genou direct ; 40° gardé pour le genou circulaire) |
| Buste | se pencher en arrière [kbmt-S35] | — | 25° (Kadir) et 26° (Amara) en arrière par rapport à la garde |
| Bras | bras arrière en garde longue, main avant protège la tête [kbmt-S35] | les deux bras tendus devant à hauteur de tête (effet mannequin) | main du côté du genou en garde longue, l'autre reste en garde |
| Retour | revenir en garde [kbmt-S35] | le pied allait directement du genou levé à sa place et passait derrière la jambe d'appui | nouvelle pose « retrait » : genou replié, pied sous la hanche, puis pose au sol. Les chevilles restent séparées d'au moins 3 cm de côté sur toute la durée (ce test réussit aussi sur l'ancien code : le défaut était vers l'arrière, il se voit sur les captures) |
| Orientation du pied | orteils pointés [kbmt-S35, kbmt-S44] | pointés | pointés |

### 3.4 Teep (jambe avant)

| Élément | Référence | Avant | Après |
|---|---|---|---|
| Armé | genou levé d'abord, environ 90° [kbmt-S24, kbmt-S29, kbmt-S36] | présent | inchangé |
| Hanche | pousser avec la hanche [kbmt-S24, kbmt-S29, kbmt-S43] | présente | inchangée |
| Buste | légère inclinaison en arrière ; se pencher à chaque teep = pousser avec la jambe plutôt qu'avec la hanche [kbmt-S36, kbmt-S43] | 14° de bascule du buste en plus | 5° de bascule du buste en plus |
| Bras | la main du côté du teep descend, l'autre protège le visage [kbmt-S24, kbmt-S29, kbmt-S36] | main restée en garde | main avant abaissée de 50 à 60 cm, main arrière haute |
| Appui | poids sur le pied arrière, jambe d'appui tendue [kbmt-S24, kbmt-S36] | inchangé | inchangé |
| Retour | revenir vite en garde [kbmt-S29, kbmt-S36] | inchangé | inchangé |

**Limite.** Mesuré du cou au bassin, le corps est incliné en arrière de 21° (Kadir et Amara) par rapport à la garde.
La correction ne réduit que la bascule du buste. Le reste vient du bassin, que l'équilibreur recule au-dessus du pied
d'appui. Pour l'éviter, il faudrait un petit saut vers l'avant sur la jambe d'appui, que kbmt-S43 décrit pour le teep
puissant. Ce n'est pas fait dans ce lot, à faire valider par un entraîneur.

### 3.5 Coude horizontal (bras arrière)

| Élément | Référence | Avant | Après |
|---|---|---|---|
| Armé | coude, épaule et hanches tournent ensemble [kbmt-S27, kbmt-S33] ; pas de recul qui annonce le coup [boxe-S3 pour les coups droits] | la main reculait | le coude monte à hauteur d'épaule sans reculer : il reste devant l'épaule (5 cm ou plus) jusqu'à l'impact |
| Trajectoire | « straight across from one shoulder to the other » [kbmt-S27] | croisement | inchangé |
| Main libre | près du visage [kbmt-S33] | inchangé | inchangé |
| Surface | pointe du coude [kbmt-S27, kbmt-S33] | inchangé | inchangé |

### 3.6 Mains : « griffes » sur les captures du téléphone

- Dans le moteur, les poings sont fermés. Le pouce restait pourtant écarté : 5,4 cm entre le bout du pouce et le
  majeur.
- Le pouce est maintenant orienté vers l'index et le majeur repliés : 2,5 cm.
- Le test vérifie que cette distance reste sous 3,5 cm.
- Sur le téléphone, la qualité allégée (petite résolution) peut encore rendre la main moins nette. Ce point est à
  revérifier sur l'appareil.

## 4. Morphologie

Fichier `tools/generator/rocketbox/convert.py`. La musculature est ajoutée par régions anatomiques, à l'endroit de
chaque muscle :
- deltoïdes ;
- pectoraux ;
- grand dorsal ;
- trapèzes ;
- biceps ;
- avant-bras ;
- fessiers ;
- quadriceps ;
- ischio-jambiers ;
- mollets.

Ce n'est pas un agrandissement global.

- **Kadir** : `SHAPE_SCALE=1.6`, 28 mm au plus.
- **Amara** : `SHAPE_SCALE=1.0`, 18 mm au plus.

Les visages, les textures, les poils et les proportions du squelette ne changent pas. La taille des fichiers est la
même (2,5 Mo et 2,9 Mo). Volontairement, ce n'est pas un physique de culturiste.

## 5. Tests

Voir le journal (`docs/JOURNAL_CORRECTIONS.md`, entrée v0.29.0-proto4) pour les résultats.

## 6. Ce qui reste

- **Validation par un entraîneur qualifié** des 5 techniques. Statut : Validation technique nécessaire.
- **Essai sur le téléphone de Youssef : NON EXÉCUTÉ.**
- Teep : bassin en arrière (§3.4).
- Après validation, la même méthode s'appliquera aux autres animations des 6 disciplines :
  - recherche ;
  - mesures ;
  - tests ;
  - captures avant/après.
- Les mêmes fonctions servent la boxe, le kick-boxing et le MMA (techniques partagées). Les corrections du crochet
  et du direct s'y appliquent donc aussi : les tests de toutes les disciplines réussissent.
