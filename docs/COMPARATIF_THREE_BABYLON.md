# Comparatif Three.js / Babylon.js

Branche : `experiment/babylon-vs-three` (créée depuis `feature/combat-shadow-v2` après la v0.16.0).
Aucun fichier de l'application n'a été modifié : tout le labo est dans `lab/`, avec ses propres dépendances
(`lab/package.json`). Babylon.js n'est ni dans le `package.json` de l'application ni dans sa version de production.

Date des mesures : 18 octobre 2026.

## 1. Résumé

- **Animation : réutilisable telle quelle.** Le moteur de l'application (squelette, poses clés, cinématique
  inverse, enchaînements) pilote Babylon sans aucune modification. Sur 2 coachs × 9 instants clés × 11
  articulations, l'écart maximal entre les deux versions est de **0,26 micromètre** (arrondi des nombres à virgule).
  Les deux versions jouent donc exactement le même mouvement.
- **Rendu : pas de gain visuel mesurable apporté par Babylon** avec le même modèle, la même caméra et un éclairage
  calé. Les images sont très proches. La version Three.js montre un modelé un peu plus marqué et des contours plus lisses.
  Les défauts visibles (coutures d'épaule, déformation au coude) sont **identiques dans les deux moteurs** : ils viennent
  du modèle, pas du moteur.
- **Performance (mesurée sans carte graphique, voir §5) :** Three.js est plus rapide dans ce labo. On mesure 4,2 contre 2,3 images/s
  en qualité haute, et 8,2 contre 5,6 en qualité basse. Three.js consomme aussi moins de mémoire JavaScript (17 Mo contre 27 à 35 Mo).
  Il affiche la première image plus tôt (0,66 s contre 0,88 s) et charge moins de code (363 Ko compressés contre 602 Ko).
- **Migration : coût élevé.** Elle toucherait 13 fichiers 3D (3 173 lignes), dont l'éditeur de combattant (1 224 lignes) et le
  style Encre, qui sont propres à Three.js et seraient à réécrire.
- **Recommandation : A, conserver Three.js.** Le détail est au §10.

## 2. Ce qui a été comparé

| | Version A : Three.js (actuelle) | Version B : Babylon.js |
|---|---|---|
| Moteur | three 0.186 + React Three Fiber 9 + drei 10 | @babylonjs/core 9.31.0 + loaders 9.31.0 + materials 9.31.0 |
| Code de rendu | **celui de l'application** : `CoachModel` (matériaux améliorés, peau physique), lumières de `StudioStage`, ombre de contact | réécrit pour le labo (`lab/src/babylon.ts`), mêmes réglages traduits |
| Modèle | `public/models/coach_male.glb` / `coach_female.glb` (style réaliste) | les mêmes fichiers |
| Squelette | 52 os Mixamo du GLB | les mêmes, lus dans le même fichier |
| Animation | `CoachRig` + `MotionSampler` + `ComboPlayer` | **les mêmes classes**, sans modification |
| Caméra | fixe, champ 30°, 3/4 avant, côté garde avant, 5,4 m, cible à 0,98 m | identique |
| Résolution | 720 × 1280, densité de pixels 1 | identique |
| Lumières | hémisphérique 0,9 + 3 directionnelles (2,1 / 0,75 / 1,1) | mêmes couleurs et directions ; intensités ÷ π × 1,43 (voir §4) |
| Tonalité | ACES filmique de three.js | ACES de Babylon, exposition 1/0,6 (voir §4) |
| Ombre au sol | `ContactShadows` (drei), opacité 0,42 | ombre floue projetée sur un sol invisible (`ShadowOnlyMaterial`), opacité 0,42 |
| Lissage (haute) | MSAA du navigateur | MSAA du navigateur |

Les deux pages sont construites et chargées **séparément** (`LAB_ENTRY=three` puis `LAB_ENTRY=babylon`). Chaque mesure
ouvre un navigateur neuf avec un seul moteur.

Version B : l'animation tourne sur un squelette reconstruit à partir du nœud JSON du GLB avec les seules
classes mathématiques de three.js (aucun moteur de rendu three.js n'est chargé). À chaque image, la position, la rotation et
l'échelle locales de chaque os sont copiées dans les nœuds Babylon. Babylon travaille en repère droit
(`useRightHandedSystem`), le même que glTF et three.js, donc aucune conversion n'est nécessaire.

## 3. Animations comparées

Garde, jab, direct arrière (`direct`), crochet avant, uppercut arrière, pivot à droite, et l'enchaînement
jab → direct → crochet joué par le lecteur d'enchaînements de l'application (transitions comprises). Chaque technique est
photographiée à son instant clé, mesuré sur l'animation. L'enchaînement est photographié à ses trois impacts.

Contrôle de fidélité (`lab/out/joints.json`, copié dans `docs/comparatif/joints.json`) : position dans le monde de 11
articulations (bassin, buste, tête, mains, avant-bras, chevilles, orteils) dans les deux moteurs, pour les 18 captures.

**Écart maximal : 2,6 × 10⁻⁷ m.** L'animation n'est donc pas une approximation : c'est la même.

Ce qui n'a pas été porté : le style **Encre** (shader Three.js propre à l'application, `src/three/manga.ts`) et
l'**éditeur de combattant** (`src/three/customize.ts`). Ils ne sont photographiés qu'en version A (3ᵉ colonne des planches).
Les porter demanderait de réécrire leurs shaders et leur géométrie pour Babylon.

## 4. Égalisation de l'éclairage

Les deux moteurs n'expriment pas les intensités de la même façon :

- three.js divise l'éclairage diffus par π ; Babylon non. Toutes les lumières Babylon sont donc divisées par π.
- La tonalité ACES est la même courbe dans les deux moteurs (mêmes matrices dans le code des shaders). three.js multiplie
  en plus l'exposition par 1/0,6, que j'ai reproduit dans Babylon (`exposure = 1/0,6`).
- Il restait un écart. Un seul facteur global (1,43) a été réglé **par mesure** de la luminance moyenne des pixels du corps
  (`lab/scripts/lum.py`) :

| Capture | A Three.js | B Babylon | Écart |
|---|---|---|---|
| Homme, jab | 131,5 | 131,3 | 0,2 % |
| Homme, garde | 138,2 | 134,5 | 2,7 % |
| Femme, jab | 109,7 | 109,1 | 0,5 % |

Le facteur est le même pour tout. Il n'a pas été réajusté capture par capture.

## 5. Conditions de mesure : à lire avant les chiffres

- Machine de travail sans carte graphique : Chromium sans écran avec **SwiftShader**, un rendu WebGL logiciel exécuté par
  le processeur. Les valeurs absolues (2 à 8 images/s) **ne représentent ni un téléphone ni un ordinateur avec carte
  graphique**. Seule la comparaison A/B, mesurée de la même façon sur la même machine, a un sens.
- Les versions mesurées sont les versions construites et compressées (gzip), servies localement (`lab/scripts/serve.mjs`).
  Les temps de téléchargement sont donc ceux d'un serveur local.
- Scène mesurée : l'enchaînement jab → direct → crochet joué en boucle, coach homme, 720 × 1280.
- Pour chaque configuration : 3 passages. Chaque passage comprend un navigateur neuf, 3 s de mise en route, puis 15 s de mesure.
- Les appels de dessin et les triangles sont comptés de la même façon pour les deux moteurs, en interceptant les fonctions de
  dessin WebGL (`installDrawCounter` dans `lab/src/common.ts`).
- Le processeur est mesuré par Chrome (`Performance.getMetrics`, durée des tâches du fil principal par image).
- Les données brutes sont dans `docs/comparatif/perf.json`.

## 6. Résultats de performance

Moyenne des 3 passages (fourchette entre parenthèses).

| Mesure | A Three.js haute | B Babylon haute | A Three.js basse | B Babylon basse | A Three.js Encre haute |
|---|---|---|---|---|---|
| Images/s moyennes | **4,20** (4,04–4,29) | 2,35 (2,28–2,45) | **8,24** (8,20–8,27) | 5,62 (5,57–5,66) | 2,77 (2,73–2,80) |
| Images/s minimales | 1,3–2,1 | 1,1–1,2 | 3,0–3,7 | 1,8–2,6 | 1,3–1,4 |
| Régularité (écart type d'une image) | 80–134 ms | 176–177 ms | 36–55 ms | 62–77 ms | 136–166 ms |
| Processeur, fil principal, par image | 2,1–2,5 ms | 3,0–3,3 ms | 1,8–1,9 ms | 3,0–3,3 ms | 2,3–2,8 ms |
| Appels de dessin par image | 13 | 10 | 13 | 10 | 19 |
| Triangles par image | 245 474 | 245 468 | 245 474 | 245 468 | 471 862 |
| Coach prêt (depuis l'ouverture) | 0,56 s | 0,53 s | 0,58 s | 0,54 s | 0,94 s |
| Première image affichée | **0,66 s** | 0,88 s | **0,66 s** | 0,93 s | 0,97 s |
| Mémoire JavaScript après 18 s | **17,1 Mo** | 35,3 Mo (29,8–40,1) | **16,8 Mo** | 27,5 Mo (23,9–34,0) | 25,5 Mo |
| Code chargé (compressé / décompressé) | **363 Ko / 1,31 Mo, 1 fichier** | 602 Ko / 2,35 Mo, 61 fichiers | identique | 599 Ko / 2,33 Mo, 60 fichiers | identique |

Lecture :

- Le corps (122 700 triangles) est dessiné **deux fois par image dans les deux versions** : une fois pour l'ombre au sol et
  une fois pour l'image. La charge de dessin est donc comparable.
- Babylon fait moins d'appels de dessin, mais chaque image lui coûte plus de temps processeur et elle arrive moins souvent.
  Le shader PBR de Babylon est plus lourd. Ce point devra être vérifié sur une vraie carte graphique.
- Le style Encre (par défaut dans l'application) coûte environ 35 % d'images/s par rapport au réaliste en version A, car le
  contour est un second dessin du corps (471 862 triangles). C'est une piste d'optimisation qui ne dépend pas du moteur.
- Le temps de téléchargement du GLB (20 à 126 ms sur un serveur local) n'est pas significatif. Le fichier est le même
  (4,4 Mo) dans les deux versions.

### Taille du code

| | A Three.js | B Babylon.js |
|---|---|---|
| Fichier principal (non compressé) | 1 314 Ko | 1 508 Ko |
| Total construit (tous fichiers, compressé) | 361 Ko | 940 Ko (251 fichiers, dont une partie chargée à la demande) |
| Effectivement chargé pour afficher le coach (compressé) | 363 Ko | 602 Ko |

Composition du fichier principal (cartes sources, `lab/scripts/composition.mjs`) :

- **A :** three 565 Kio, React DOM 203 Kio, React Three Fiber 164 Kio, application 90 Kio, three-stdlib 69 Kio.
- **B :** Babylon core 971 Kio, chargeur glTF 283 Kio, maths three.js 138 Kio (pour le moteur d'animation), application 61 Kio.

Dans l'application réelle, React resterait présent dans les deux cas, car toute l'interface est en React. Une version Babylon
ajouterait donc environ 1,25 Mo (non compressé) de Babylon. Elle garderait aussi les maths three.js, ou il faudrait réécrire
le moteur d'animation avec les maths de Babylon.

## 6 bis. Session longue (5 minutes, enchaînement en boucle, qualité haute)

Relevé toutes les 30 s, avec un navigateur neuf par moteur (`docs/comparatif/long.json`) :

| Temps | A images/s | A mémoire JS | B images/s | B mémoire JS |
|---|---|---|---|---|
| 30 s | 4,18 | 16,3 Mo | 2,53 | 23,7 Mo |
| 1 min | 4,34 | 17,1 Mo | 2,46 | 24,4 Mo |
| 2 min | 4,34 | 16,9 Mo | 2,46 | 25,6 Mo |
| 3 min | 4,32 | 17,4 Mo | 2,36 | 25,7 Mo |
| 4 min | 4,34 | 17,1 Mo | 2,34 | 26,2 Mo |
| 5 min | 4,37 | 17,5 Mo | 2,39 | 26,7 Mo |

- A : débit stable, mémoire stable (entre 16,3 et 17,5 Mo, sans tendance). Aucune erreur.
- B : débit en légère baisse (−6 % entre 30 s et 5 min) et mémoire en hausse régulière (+3 Mo en 5 min). Aucune erreur.
  Cinq minutes ne suffisent pas pour conclure à une fuite : la hausse peut venir du ramasse-miettes. C'est à surveiller sur une
  session plus longue si Babylon était retenu.

## 7. Différences visuelles

Planches complètes : [`docs/comparatif/planche-homme.jpg`](comparatif/planche-homme.jpg) et
[`docs/comparatif/planche-femme.jpg`](comparatif/planche-femme.jpg). Gros plan : [`docs/comparatif/gros-plan-torse.jpg`](comparatif/gros-plan-torse.jpg).

| Critère | Constat | D'où vient la différence |
|---|---|---|
| Silhouette, pose, articulations | identiques au micromètre | même animation |
| Déformations (épaule, coude, genou) | mêmes défauts dans les deux versions (pli à l'épaule, coude aminci) | **modèle** (poids de peau du GLB) |
| Peau, matière | A : modelé un peu plus contrasté, léger reflet ; B : plus plate, teinte plus uniforme | moteur (shader PBR, lumière hémisphérique) ; un réglage plus long pourrait réduire l'écart |
| Relief musculaire (carte de normales) | visible dans les deux versions, un peu plus lisible en A | moteur et réglages |
| Contours (anticrénelage) | A plus lisse ; B montre des marches sur l'avant-bras | moteur, avec le même MSAA demandé |
| Ombre au sol | presque invisible dans les deux versions à cet angle (caméra à 7° au-dessus du sol) | – |
| Textures | identiques (mêmes fichiers) | modèle |
| Vêtements | identiques en réaliste ; l'éditeur de tenues n'existe qu'en A | application |
| Stabilité | pas de scintillement ni de saut observé dans les captures des deux versions | – |

**Gain moteur et gain modèle :** rien dans ces captures n'indique qu'un passage à Babylon améliorerait le rendu des coachs.
Ce qui limite le réalisme aujourd'hui, ce sont le maillage, les poids de peau et les textures, et c'est identique dans les deux
moteurs.

## 8. Compatibilité avec l'application

| Élément | Avec Babylon | Commentaire |
|---|---|---|
| React, TypeScript, Zustand | compatible | Babylon n'a pas d'équivalent officiel maintenu de React Three Fiber ; il faudrait piloter la scène en impératif depuis React. |
| Capacitor (Android) | compatible | WebGL dans la WebView, comme aujourd'hui |
| GLB | compatible | même fichier, chargeur officiel |
| Animations procédurales, IK, transitions | **compatible sans modification** (prouvé, §3) | au prix des maths three.js gardées, sinon à réécrire |
| Éditeur de combattant, tenues, tatouages (`customize.ts`, `tattoos.ts`) | **à réécrire** | 1 224 + 309 lignes de géométrie et de textures three.js |
| Style Encre / manga (`manga.ts`) | **à réécrire** | shaders three.js |
| Caméras pédagogiques, cadrage (`StudioStage.tsx`, `framing.ts`) | à réécrire | 253 lignes |
| Repères pédagogiques (`StudyCues.tsx`, `GroundMarks.tsx`) | à réécrire | lignes et anneaux drei |
| Réalité augmentée (`ArScene.tsx`, `ArBridge.ts`) | à réécrire | Babylon a son propre module WebXR |
| Duo judo/BJJ (à venir) | possible dans les deux | le moteur à deux corps reste à écrire dans tous les cas |
| Hors ligne | compatible | mais Babylon charge 60 fichiers à la demande, qu'il faudrait tous mettre en cache |
| Vignettes, labo, tests e2e | à adapter | les scripts de capture visent `CoachStage` |
| Maintenance | un seul moteur aujourd'hui ; un mode hybride en ferait deux | – |

### Fichiers touchés par une migration complète

| Fichier | Lignes | Dépend de |
|---|---|---|
| `src/three/customize.ts` | 1 224 | three |
| `src/editor/tattoos.ts` | 309 | three |
| `src/three/CoachStage.tsx` | 237 | three, R3F, drei |
| `src/three/StudyCues.tsx` | 223 | three, R3F, drei |
| `src/three/GroundMarks.tsx` | 181 | three, R3F, drei |
| `src/three/CoachModel.tsx` | 175 | three, R3F, drei, three-stdlib |
| `src/three/ArScene.tsx` | 164 | three, R3F |
| `src/three/StudioStage.tsx` | 162 | three, R3F, drei, three-stdlib |
| `src/ar/ArBridge.ts` | 157 | three |
| `src/three/manga.ts` | 135 | three |
| `src/three/framing.ts` | 91 | three |
| `src/ui/Lab.tsx` | 89 | R3F |
| `src/three/pose.ts` | 26 | three |

Plus les écrans qui intègrent la scène : `Home.tsx`, `Training.tsx`, `Library.tsx`, `coach/Preview.tsx`.

Le moteur d'animation (`src/engine/`, 3 912 lignes) n'utilise que les maths de three.js. Il peut rester tel quel dans
les deux cas.

**Estimation du coût**, à titre d'ordre de grandeur et non de mesure : réécrire environ 3 200 lignes de rendu, refaire
le style Encre et l'éditeur de combattant, adapter les tests et les vignettes, puis revalider tous les écrans. Cela
représente plusieurs lots complets de travail, avec un risque de régression sur des fonctions qui marchent aujourd'hui.

## 9. Licences

| Paquet | Version | Licence | Coût |
|---|---|---|---|
| @babylonjs/core | 9.31.0 | Apache-2.0 | gratuit |
| @babylonjs/loaders | 9.31.0 | Apache-2.0 | gratuit |
| @babylonjs/materials | 9.31.0 | Apache-2.0 | gratuit |
| three | 0.186 | MIT | gratuit |
| @react-three/fiber, drei | 9 / 10 | MIT | gratuit |

Licences vérifiées dans les `package.json` installés.

## 10. Avantages, inconvénients, recommandation

**Babylon.js, points forts :** moteur complet et cohérent (physique, WebXR, éditeur de matériaux nodaux, inspecteur),
documentation officielle, moins d'appels de dessin dans ce test, et des fonctions avancées intégrées sans bibliothèque tierce.

**Babylon.js, points faibles mesurés ici :** plus lent dans ce labo (−44 % d'images/s en haute, −32 % en basse), plus de
mémoire (×1,6 à ×2), plus de code chargé (×1,7) et en 60 fichiers, première image plus tard. Il n'a pas d'intégration React
équivalente, l'éditeur de combattant et le style Encre seraient à réécrire, et le rendu n'est pas meilleur avec le même modèle.

**Three.js, points forts :** déjà en place et testé (58 tests navigateur), plus rapide et plus léger ici, avec l'écosystème React
Three Fiber et drei, et le style Encre validé.
**Three.js, points faibles :** les matériaux avancés et les post-effets sont à assembler soi-même.

**Risques d'une migration :** régressions sur l'éditeur, les vignettes, la réalité augmentée et le mode Analyse, ainsi qu'un
double moteur pendant la transition. Le gain n'est pas démontré.

| Option | Verdict |
|---|---|
| **A. Conserver Three.js** | **recommandée** |
| B. Migrer vers Babylon.js | non recommandée : coût élevé, gain visuel nul et performances moins bonnes dans ce test |
| C. Module hybride | non recommandé aujourd'hui : deux moteurs à maintenir et à charger, sans besoin identifié que Three.js ne couvre pas |

Recommandation : **option A.** L'effort de qualité visuelle doit porter sur ce qui limite réellement le rendu, c'est-à-dire
le modèle (maillage, poids de peau aux épaules et aux coudes, textures) et le coût du style Encre. Changer de moteur
n'améliorerait pas ces points.

Cette recommandation repose sur des mesures sans carte graphique. Elle doit être confirmée sur un vrai téléphone Android
avec le protocole ci-dessous. Si Babylon y était nettement plus rapide, la conclusion serait à revoir.

## 11. Protocole Android (NON EXÉCUTÉ : aucun téléphone disponible ici)

**Résultats Android : non vérifiés.**

1. Sur la branche `experiment/babylon-vs-three` : `cd lab && npm install`, puis à la racine
   `LAB_ENTRY=three npx vite build --config lab/vite.config.ts` et `LAB_ENTRY=babylon npx vite build --config lab/vite.config.ts`.
2. Servir les deux sur le réseau local : `node lab/scripts/serve.mjs`. Il écoute sur le port 5200 ; pour l'exposer, remplacer
   `listen(5200` par `listen(5200, '0.0.0.0'`.
3. Sur le téléphone (Chrome Android, batterie > 50 %, écran à luminosité fixe, mode économie désactivé, autres
   applications fermées), ouvrir
   `http://<ip-du-pc>:5200/three.html?coach=homme&s=combo&q=haute&w=<largeur>&h=<hauteur>` avec la taille de l'écran
   en pixels CSS. Faire de même avec `babylon.html`.
4. Mesurer avec le débogage à distance (`chrome://inspect` sur le PC) dans la console :
   `__lab.startStats()`, attendre 60 s, puis `__lab.stats()`, `__lab.timings` et `__lab.heap()`.
5. Répéter 3 fois par version en alternant A, B, A, B, A, B, en rechargeant la page à chaque fois. Refaire avec
   `q=basse`.
6. Noter le modèle du téléphone, la version d'Android, la version de Chrome et la température ressentie après 5 minutes.
7. Session longue : laisser chaque version tourner 10 min et relever `__lab.stats()` toutes les minutes.

## 12. Reproduire

```
cd lab && npm install && cd ..
npx vite --config lab/vite.config.ts --port 5199          # pages de développement
node lab/scripts/capture.mjs lab/out                       # 54 captures + joints.json
python3 lab/scripts/montage.py lab/out/captures lab/out    # planches
LAB_ENTRY=three npx vite build --config lab/vite.config.ts
LAB_ENTRY=babylon npx vite build --config lab/vite.config.ts
node lab/scripts/serve.mjs &                               # versions construites sur :5200
node lab/scripts/perf.mjs lab/out/perf.json 3 15           # performances
node lab/scripts/long.mjs lab/out/long.json 5              # session longue
```

Paramètres des pages : `coach=homme|femme`, `s=garde|jab|direct|crochet-avant|uppercut-arriere|pivot-droite|combo`,
`q=haute|basse`, `t=<secondes>|key` (pose figée), `look=realiste|encre` (A seulement), `w`, `h`, `gain` (B seulement).
