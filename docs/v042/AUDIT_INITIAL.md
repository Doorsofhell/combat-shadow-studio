# v0.42 · Audit initial : architecture humanoïde, Naël et Inaya

Demande : Youssef, 2026-10-22 13:59, « Architecture humanoïde évolutive, création de nouveaux coachs et préservation des mouvements validés ».
Audit fait le 2026-10-23 sur le code réel, avant toute modification.

## 1. Branche stable et point de départ

- Branche stable : `feature/combat-shadow-v030`, commit `407ff26` (v0.41.0, publiée et vérifiée sur GitHub Pages).
- Branche de travail : `feature/humanoides-v042`, créée depuis ce commit.
- La branche `main` est ancienne (v0.14). Elle n'est pas touchée.

## 2. Kadir et Amara : ressources réelles

Chaque coach a **deux modèles 3D réellement skinnés**, plus ses tenues :

| Rendu | Fichier | Origine | Squelette | Visage |
|---|---|---|---|---|
| Ultra-réaliste (par défaut depuis v0.29) | `public/coaches/mma-{kadir,amara}/photo.glb` (2,5 et 2,9 Mo) | Microsoft Rocketbox (licence MIT) : `Sports_Male_01` et `Sports_Female_01`, convertis par `tools/generator/rocketbox/convert.py` et retouchés par `recolor.py` | 80 os (Kadir) et 81 os (Amara), noms Mixamo, dont **26 os du visage** (paupières, sourcils, mâchoire, coins de la bouche, joues) | texture photo, 2 matériaux (corps, tête) |
| Anime | `public/coaches/mma-{kadir,amara}/model.glb` (4,3 et 4,7 Mo) + `model_face.png`, `model_masks.png` | générateur Blender + MPFB2 (MakeHuman, CC0), recette `tools/generator/coaches/recipes/mma-*.json` | 52 os (rig Mixamo de MPFB), sans os du visage | peinture du visage cuite (`face_paint.py`) |
| Tenues par discipline | `public/coaches/mma-*/tenues/{boxe,kickboxing,mma,muaythai,judo,bjj,bjj-nogi}.glb` | `tools/generator/rocketbox/outfits.py`, ajustées au corps du coach | squelette du `photo.glb` | — |

Aucun modèle ne contient de morph target (cibles de forme) à l'exécution. Les morphologies sont **cuites au moment de la construction** :

- **Ultra-réaliste** : `convert.py` gonfle 30 régions musculaires le long de la normale de la peau, avec un facteur `SHAPE_SCALE` qui vaut 1,6 pour Kadir et 1,0 pour Amara.
- **Anime** : les cibles MPFB/MakeHuman sont appliquées dans Blender.

## 3. Animations

- Les animations sont **calculées par programme**. Il n'y a ni `AnimationClip` ni fichier d'animation.
  - Les poses-clés biomécaniques sont écrites par technique dans `src/engine/library/*.ts` (boxing, legs, upper, mma, grappling).
  - Elles sont résolues sur le squelette réel du coach par cinématique inverse (`src/engine/rig.ts`), qui mesure les longueurs d'os du modèle chargé.
  - La garde propre au coach est dans `src/domain/coaches/motion.ts`.
- **Conséquence pour les nouveaux coachs** : changer la morphologie change les longueurs d'os. Le moteur recalcule alors les mêmes cibles (mains, pieds, bassin) pour ce corps, sans toucher aux poses-clés. C'est exactement la séparation niveau 1 / niveau 2 demandée (§5.2).
- **Registre existant** : `src/engine/registry.ts`, documenté dans `docs/ANIMATIONS.md`, contient 91 mouvements « contrôlés » techniquement, **0 validé par un expert**, 10 non implémentés. Je ne déclarerai aucune validation sportive.

## 4. Possibilités vérifiées dans les sources

- **Expressions du visage** : la source Rocketbox `Sports_Male_01_facial.fbx` contient **176 formes faciales** sur le même maillage, sur le même squelette. Elles comprennent les 52 formes du standard ARKit (clignement, regard, sourcils, mâchoire, sourire…) et 15 visèmes. La version féminine `Sports_Female_01_facial.fbx` existe aussi. Les expressions demandées (§8) sont donc **réalisables avec de vraies formes du visage**, pas avec une simple texture.
- **Visages distincts** : chaque avatar Rocketbox a son propre maillage et ses propres coordonnées de texture. J'ai comparé 5 avatars : les nombres de sommets et les empreintes des coordonnées de texture sont tous différents. On ne peut donc pas poser le visage d'un autre avatar sur le corps de Kadir en changeant seulement la texture. Méthode retenue :
  1. donner à la tête de la copie technique la forme de la tête source, par projection progressive ; le cou reste fixe pour éviter toute couture ;
  2. transférer la texture du visage source par cuisson Blender ;
  3. garder le squelette, le skinning et les formes faciales de la base.
- **Bibliothèque disponible** : Rocketbox compte 111 avatars sous licence MIT, avec des visages variés (planches de têtes déjà rendues). Aucun achat n'est nécessaire.

## 5. Registre actuel des coachs et sauvegardes

- Le type `CoachId = 'homme' | 'femme'` est enregistré dans `profile.coach` (IndexedDB, Zustand). `homme` affiche Kadir, `femme` affiche Amara (`src/domain/coaches/catalog.ts`). 36 endroits du code lisent cette valeur : choix du squelette, voix, textes, tests.
- Sélection : écran `/coach` (`CoachSelect.tsx`), avec deux cartes et des portraits rendus depuis nos modèles.
- **Plan de compatibilité** : `profile.coach` garde sa valeur et son sens (le squelette masculin ou féminin). Un champ facultatif nouveau indique le coach publié choisi. Sans ce champ, Kadir ou Amara sont affichés comme avant. Aucune migration destructive.

## 6. Tests existants et référence

- Vitest : 722 réussis, 1 échec connu (Amara, extension de hanche), 1 ignoré, sur 73 fichiers. Playwright : 184 tests, sur 33 fichiers.
- **Référence figée (fait dans cet audit)** :
  - `scripts/coach-reference.mjs` calcule l'empreinte SHA-256 des **42 fichiers** qui font Kadir, Amara et les mouvements : modèles, textures, tenues, apparences, gardes, bibliothèque de mouvements ;
  - elle est enregistrée dans `src/domain/coaches/reference/manifest.json` ;
  - le test `src/domain/coaches/__tests__/reference.test.ts` échoue si un seul de ces fichiers change.

## 7. Performances de référence

- Les modèles de Kadir et Amara pèsent 2,5 à 2,9 Mo (photo) et 4,3 à 4,7 Mo (Anime). Un seul coach est chargé à la fois.
- La qualité est automatique, avec repli en mode léger après une perte de contexte WebGL (corrections de stabilité v0.29, non modifiées).
- Les performances Android n'ont jamais été mesurées sur un vrai téléphone dans cet environnement. Je ne les annoncerai pas.

## 8. Risques identifiés

| Risque | Mesure |
|---|---|
| Modifier Kadir ou Amara par erreur | empreinte et test (§6) ; nouveaux fichiers dans de nouveaux dossiers seulement |
| Une morphologie plus large fait se croiser les bras ou toucher le corps | tests d'amplitude articulaire et d'équilibre existants (`torsion-range`, `ankle-range`, `balance`), relancés pour chaque nouveau coach ; mouvement déclaré incompatible plutôt que modifié |
| Couture visible au cou après le changement de tête | projection pondérée qui laisse le cou fixe ; captures de contrôle |
| Les tenues ne suivent pas une nouvelle morphologie | tenues reconstruites sur le corps du nouveau coach par `outfits.py` ; test de pénétration |
| Poids et mémoire sur téléphone | textures limitées comme pour Kadir et Amara (1024 px sauf le visage) ; chargement d'un seul coach |
| Rendu Anime des nouveaux coachs | nouvelles recettes MPFB (même générateur que Kadir et Amara) ; si le résultat n'est pas à la hauteur, je le dirai |

## 9. Ordre de travail

1. `HumanoidMaleBase` et `HumanoidFemaleBase` : la construction reproductible de la copie technique. Un test vérifie que le preset « Kadir original » redonne exactement la géométrie de Kadir.
2. Les morphologies paramétrables, avec les presets Kadir, Amara, B masculine et B féminine.
3. Les visages : changement de tête, puis expressions.
4. Les tenues, puis Naël et Inaya.
5. Le registre des coachs, la galerie, puis les tests et la PR.
