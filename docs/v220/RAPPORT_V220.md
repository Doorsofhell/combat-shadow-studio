# 2.2.0 (expérimentale) — Refonte qualitative 3D des coachs : rapport

Demande : Youssef, 19/11/2026 09:04, « COMBAT SHADOW STUDIO — REFONTE QUALITATIVE 3D AAA ». Branche
`claude/project-thread-o9byih`, partie de la 2.1.0 réellement publiée (`claude/project-thread-o7lrt8`, commit
`2bc24cd`, PR #140), et **non** de `main` (restée en 1.40.1). Point de restauration : branche
`restauration/avant-refonte-3d-v220` (= 2.1.0). Rien n'est fusionné ni publié.

Ce rapport distingue ce qui est **mesuré**, **corrigé**, **capturé** et **proposé**. Toutes les images sont des
captures réelles du moteur Three.js/WebGL de l'application (page Lab), jamais des images générées.

## 1. Coachs réellement audités

Inventaire automatique de `public/coaches/*/photo.glb` (scripts/v220/audit-coachs.mjs) : **6 coachs**, tous
Rocketbox (MIT), contrat humain « complet ».

| Coach | Fichier | Taille modèle | Sommets | Triangles | Matériaux | Os | Expressions | Textures | Tenues |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Kadir « L'Aigle » (H) | mma-kadir | 3,13 Mo | 33 114 | 44 148 | 3 | 80 | 25 | corps 1024, normales 2048, tête 2048, rugosité 512×2 | 8 (17–33 k tri, 10,8 Mo) |
| Naël « Le Faucon » (H) | nael | 2,86 Mo | 33 114 | 44 148 | 3 | 80 | 25 | corps 1024, normales 2048, tête 2048 | 7 (20–49 k tri, 11,3 Mo) |
| Victor « Le Loup gris » (H) | victor | 3,29 Mo | 33 114 | 44 148 | 3 | 80 | 25 | corps 1024, normales 2048, tête 2048 | 7 (21–43 k tri, 12,3 Mo) |
| Amara « La Lionne » (F) | mma-amara (+ photo-clean habillée) | 4,86 Mo | 37 548 | 50 880 | 3 | 81 | 25 | corps 1024, normales 2048, tête 2048 | 8 (27–58 k tri, 22,8 Mo) |
| Inaya « La Panthère » (F) | inaya | 3,30 Mo | 36 692 | 49 140 | 3 | 80 | 25 | corps 1024, normales 2048, tête 2048 | 7 (35–58 k tri, 21,5 Mo) |
| Kanya « La Tigresse » (F) | kanya | 3,42 Mo | 38 837 | 53 236 | 4 | 80 | 25 | corps 2048, normales 2048, tête 2048, chignon 512 | 7 (34–58 k tri, 23,4 Mo) |

Peau et squelette : sur les 6 modèles, 0 sommet sans poids, 0 somme de poids fausse, 4 influences au plus
(`docs/v220/audit/audit.json`).

## 2. Diagnostic individuel (mesuré)

Mesures en position de repos dans Blender (scripts/v220/anatomie.py, `docs/v220/audit/anatomie.json`). Tours = enveloppe
du tronc (comme un mètre ruban), en mètres du modèle.

| Coach | Taille modèle | Poitrine | Taille | Hanches | Taille/hanches | Poitrine/taille | Épaules/hanches | Cuisse | Mollet |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Kadir | 1,81 m | 121 cm | 85 cm | 101 cm | 0,84 | 1,43 | 1,15 | 62 cm | 41 cm |
| Naël | 1,81 m | 119 cm | 85 cm | 98 cm | 0,86 | 1,40 | 1,23 | 59 cm | 40 cm |
| Victor | 1,81 m | 121 cm | 87 cm | 102 cm | 0,86 | 1,39 | 1,15 | 62 cm | 44 cm |
| Amara | 1,73 m | 93 cm | 63 cm | 94 cm | **0,67** | 1,47 | 0,97 | 57 cm | 35 cm |
| Inaya | 1,74 m | 92 cm | **61 cm** | 96 cm | **0,63** | 1,51 | 0,88 | 59 cm | 36 cm |
| Kanya | 1,70 m | 90 cm | **59 cm** | 94 cm | **0,64** | 1,51 | 0,83 | 57 cm | 35 cm |

Textures de peau du corps (scripts/v220/textures.py) :

| Coach | Saturation | Ombres peintes (écart basse fréquence) | Traits sombres fins | Relief des normales |
| --- | --- | --- | --- | --- |
| Kadir | 0,55 | 0,105 | 1,3 % | 7,7° |
| Naël | 0,50 | 0,111 | 0,5 % | 7,7° |
| Victor | **0,37** | 0,022 | **1,7 %** | 7,7° |
| Amara | 0,57 | 0,075 | 2,0 % | 7,1° |
| Inaya | 0,40 | 0,074 | 0,7 % | 4,3° |
| Kanya | 0,42 | 0,050 | 1,0 % | 4,3° |

### Kadir
- Proportions masculines cohérentes (taille/hanches 0,84, poitrine/taille 1,43). Deltoïdes volumineux mais lisibles ;
  jambes courtes par rapport au tronc (hanche→cheville 0,44 de la taille, proche des autres hommes, identité du modèle).
- Peau : léger écart de teinte au raccord cou/poitrine entre la texture de la tête et celle du corps (écart moyen mesuré
  3,6 sur 255) ; ombres et relief peints dans la photo (attendu pour une peau photographique).
- Mouvement : ombre du gant sur le torse à bord net et orangée (crochet, uppercut).

### Naël
- Proportions cohérentes, bassin un peu plus étroit (épaules/hanches 1,23) : silhouette plus légère que Kadir, conforme à
  son profil de contreur.
- Peau : écart de teinte au raccord cou/poitrine 5,6 sur 255. Même ombre de gant orangée en garde haute.

### Victor
- Tronc pratiquement identique à celui de Kadir (même corps copié en 1.43, carrure et tête retouchées) : poitrine
  121 cm pour les deux, taille 87 contre 85 cm. Différence de silhouette faible de dos (proposition § 9).
- Peau (défauts visibles, captures « 07-abdomen ») : **plaque claire à bord net en haut de la poitrine** (partie basse du
  maillage de la tête, écart moyen de teinte au raccord 9,1 sur 255, le plus fort des six) ; **liseré sombre** le long des
  îlots UV et traits sombres fins autour des muscles (1,7 % des texels) ; **teinte grise** (saturation 0,37 contre
  0,50 à 0,55 pour les autres hommes). Un filtre de shader (« cleanBody », 1.48) atténuait ces taches à chaque image.

### Amara
- Taille assez marquée (taille/hanches 0,67) ; brassière à bonnets moulés, bord de la bande sous la poitrine net.
- Le modèle habillé est `photo-clean.glb` (1.37.9) : peau propre, raccord cou/poitrine déjà juste (écart 0,8).
- Test préexistant en échec depuis 2.0.0 : modèle de plus de 3,5 Mo (`expressions-v1160`), inchangé ici.

### Inaya
- **Taille artificiellement étroite** : 61 cm de tour et 20 cm de large pour 1,74 m, avec 92 cm de poitrine et 96 cm de
  hanches (rapport 0,63). Pour une kickeuse de 65 kg c'est une taille « pincée » : le repère des combattantes de haut
  niveau se situe plutôt vers 0,70–0,75.
- Relief de normales du corps plus faible que chez Amara (4,3° contre 7,1°) : abdominaux moins lisibles, cohérent avec
  sa fiche.
- Brassière MMA : bretelles aux bords irréguliers en gros plan (non corrigé, § 7).

### Kanya
- Corps d'Inaya réduit de 3 % (1.51/1.55) : mêmes défauts de proportion, **taille de 59 cm** (rapport 0,64).
- Raccord cou/poitrine juste (écart 2,6).

### Constat transversal
Les six coachs reposent sur **deux corps de base** (Rocketbox m021 et f021) : mêmes largeurs d'épaules au millimètre
(0,421 m pour les trois hommes, 0,344 m pour Amara et Inaya, Kanya à 97 %). Les silhouettes féminines sont donc
presque un modèle corporel unique, ce que la demande demande d'éviter (§ 9, proposition).

## 3. Incohérences morphologiques identifiées (priorité féminine)

| Coach | Incohérence | Mesure | Décision |
| --- | --- | --- | --- |
| Inaya | taille trop étroite, transition taille–hanches trop creusée | taille/hanches 0,63, 20 cm de large | corrigée |
| Kanya | idem (corps d'Inaya) | 0,64, 59 cm | corrigée |
| Amara | taille un peu pincée pour une frappeuse puissante | 0,67 | corrigée, plus légèrement |
| Amara, Inaya, Kanya | trois silhouettes issues du même corps | épaules 0,344 / 0,344 / 0,333 m | proposition (§ 9) |
| Kadir, Victor | tronc presque identique | poitrine 121 / 121 cm | proposition (§ 9) |
| Hommes | aucune incohérence de proportion démontrée | taille/hanches 0,84–0,86 | non modifiés |

## 4. Corrections réalisées

### 4.1 Morphologie (Phase C/D) — Amara, Inaya, Kanya
`src/three/morphology.ts` : un champ de déformation doux, propre à chaque coach, élargit un peu la taille autour de
l'axe du tronc (gaussienne en hauteur, rien au-dessus de la poitrine ni sous le bassin, bras et mains jamais touchés,
normales recalculées par la dérivée du champ). **Le même champ est appliqué à chaque pièce de tenue** : le vêtement
suit le corps (« corriger le vêtement, pas le corps »), sans traversée nouvelle (ordre des surfaces conservé le long de
chaque rayon, testé). Les GLB ne changent pas : les masques de peau sous les tenues lisent les positions d'origine.

| Coach | Tour de taille | Hanches | Taille/hanches |
| --- | --- | --- | --- |
| Amara (photo / photo-clean) | 63,2 → 65,6 / 65,0 cm | 94,3 → 94,3 cm | 0,67 → 0,69 |
| Inaya | 61,1 → 64,7 cm | 96,7 → 96,7 cm | 0,63 → 0,67 |
| Kanya | 59,2 → 63,0 cm | 93,5 → 93,5 cm | 0,63 → 0,67 |

Correction volontairement modérée (3 à 4 cm) : la silhouette approuvée, la poitrine, les hanches, le visage et la
taille restent ceux du coach. Coût : un passage sur les sommets au chargement, rien par image.

### 4.2 Peau (Phase B)
- **Victor** (`tools/generator/victor/donnees/` et `public/coaches/victor/photo.glb`, textures seulement) : traits fins
  sombres ramenés vers leur voisinage, liseré intérieur des îlots refait depuis l'intérieur, saturation +15 % autour de
  la luminance ; partie thorax/bas du cou de la texture de la tête accordée à la teinte du corps (gain moyen de la
  couture, fondu jusqu'à 1,55 m, visage intact). Écart de teinte au raccord 9,1 → 4,6.
- **Naël** (texture de la tête seulement) : même raccord cou/poitrine, écart 5,6 → 4,5. Effet léger à l'œil.
- **Kadir** : le même raccord (écart 3,6 → 2,4) a été fait puis **annulé** : son modèle corporel est protégé par
  l'empreinte du test `outfit-rollback-v1373` (« modèle corporel Kadir intact »), et le gain, léger à l'œil, ne justifiait
  pas de toucher ce test. Kadir garde ses textures 2.1.0 ; seules les ombres (§ 4.3) le concernent.
- Amara, Inaya, Kanya : raccord déjà juste (écart 0,8 à 2,6) : textures inchangées.

### 4.3 Ombres portées (Phase B, commun)
- Constat : three r186 a retiré l'ombre douce (avertissement « PCFSoftShadowMap has been removed ») : l'ombre d'un gant
  sur le torse avait un bord net de 6 mm, et la lumière gardée dans l'ombre (diffusion sous la peau, 1.10) était orange
  sur toute sa surface : une tache orangée sur la poitrine en garde haute (Naël, Victor, « 12-uppercut »).
- Correction : bord d'ombre de la lumière principale élargi (rayon 4 → 8 texels, environ 1,3 cm) ; la teinte chaude
  gardée seulement dans la pénombre, le cœur de l'ombre reçoit la même quantité de lumière, neutre
  (`src/three/skinShader.ts`, `src/three/StudioStage.tsx`).

### 4.4 Essais écartés (aucun gain démontré, annulés)
- Marges de remplissage des îlots UV : les textures d'origine sont déjà remplies sur 4 à 16 texels autour des îlots
  (0 % de noir mesuré le long des coutures) ; refaire les marges ne changeait rien de visible : annulé.
- Microrelief procédural dans les reflets (bosses au pas des pores) : invisible à la taille réelle des captures (effacé
  par la distance comme prévu) : annulé.

### 4.5 Outil d'isolation des effets
`?fx=` dans le Lab coupe un effet de peau à la fois (relief, diffusion, ombres, pores, rugosité, teinte, étalonnage,
brillance, nettoyage) pour trouver la source d'un défaut (§ 5 de la demande). `?v220=0` montre le rendu de peau et la
morphologie de la 2.1.0 pour les comparatifs.

## 5. Comparatifs avant/après

Captures WebGL réelles, même build pour chaque colonne, même caméra, cadrage, pose, lumière (« app »), 540×720 :
15 vues par coach (face, profils gauche et droit, dos, visage, torse/épaules/cou, abdomen/bassin/hanches, jambes, garde,
direct, crochet, uppercut, coup de pied, tenue de judo en garde, dos en garde) : `docs/v220/captures/<coach>/<vue>.jpg`,
planches `docs/v220/captures/planche-<coach>.jpg`, groupe des six `docs/v220/captures/groupe-*.jpg`, manifestes
`docs/v220/captures/manifest-avant.json` et `manifest-apres.json` (requêtes Lab exactes, erreurs).

Lecture des comparatifs, coach par coach (constat sur les captures, pas d'image retouchée) :

- **Kadir** : géométrie et textures inchangées ; seule différence, le bord des ombres portées (gants sur le torse en
  garde, « 09-garde », « 12-uppercut ») plus doux et sans tache orangée.
- **Naël** : raccord du cou plus homogène (« 06-torse-epaules-cou ») ; ombres comme Kadir.
- **Victor** : plaque claire du haut de la poitrine nettement atténuée, liserés sombres autour des pectoraux et des
  abdominaux effacés, peau moins grise (« 01-face », « 06 », « 07 ») ; visage identique (« 05-visage »).
- **Amara** : taille élargie d’environ 2,5 cm, visible de face et de dos (« 01-face », « 04-dos ») ; poitrine, hanches,
  bras, visage inchangés ; la tenue suit le corps (aucune traversée sur les 15 vues).
- **Inaya** : taille élargie d'environ 4 cm, silhouette moins « sablier » ; bassin et cuisses inchangés.
- **Kanya** : taille élargie d'environ 4 cm ; tatouage du ventre légèrement étiré horizontalement (proportionnel),
  sans déformation visible.
- **Groupe** (`groupe-01-face.jpg`, `groupe-09-garde.jpg`) : les trois femmes gardent leurs différences de carrure ;
  les trois hommes restent proches (même corps de base, voir § 7 et § 9).

90 paires sur 90 capturées, aucune image vide, aucune erreur WebGL relevée (manifestes).

## 6. Mesures de performance

Mesuré par `scripts/v220/perf.mjs` (compteurs injectés dans WebGL, même page Lab en garde, même machine, les deux builds
l'une après l'autre, sans autre charge). Rendu logiciel SwiftShader : les millisecondes absolues ne disent rien d'un
téléphone, seul l'écart compte.

| Coach | Triangles/image 2.1.0 → 2.2.0 | Appels de dessin | Image (ms, logiciel) | Chargement habillé (s) |
|---|---|---|---|---|
| Kadir | 235 506 → 235 506 | 49 → 49 | 302 → 299 | 6.7 → 6.7 |
| Naël | 248 450 → 248 450 | 49 → 49 | 312 → 293 | 6.8 → 4.0 |
| Victor | 246 010 → 246 010 | 49 → 49 | 382 → 370 | 7.0 → 6.9 |
| Amara | 340 390 → 340 390 | 61 → 61 | 374 → 381 | 4.2 → 7.0 |
| Inaya | 351 106 → 351 106 | 61 → 61 | 415 → 385 | 4.1 → 3.9 |
| Kanya | 369 002 → 369 002 | 69 → 69 | 426 → 407 | 7.2 → 4.1 |

- **Triangles et appels de dessin : identiques** pour les six coachs (aucune géométrie ni matière ajoutée).
- **Temps d'image** : écarts de −8 % à +2 %, dans le bruit de la mesure logicielle ; le rayon d'ombre 4 → 8 ne coûte
  rien de mesurable ici (le filtre d'ombre de three r186 fait le même nombre de lectures).
- **Chargement** : de 3,9 à 7,2 s dans les deux versions selon l'ordre de passage (cache), pas d'écart attribuable.
  La morphologie féminine est un seul passage sur les sommets du corps et des tenues au chargement, rien par image.
- **Fichiers** : Victor 3,29 → 3,27 Mo, Naël 2,86 → 2,82 Mo (textures réencodées avec les tables JPEG d'origine) ;
  les autres modèles sont inchangés octet pour octet. Mémoire graphique des textures : mêmes tailles d'images (aucune
  texture agrandie).
- Le compteur de mémoire de textures du script ne voit pas les envois WebGL2 (`texStorage2D`) : valeur écartée.
- **Téléphone Android réel : NON EXÉCUTÉ** (aucun appareil ici).

## 7. Anomalies résiduelles

- Les trois femmes et les trois hommes gardent chacun un corps de base commun (silhouettes proches) : proposition § 9.
- Victor : la plaque du haut de la poitrine est atténuée, pas effacée (poils de torse et grain différents entre les deux
  textures).
- Inaya : bords irréguliers des bretelles de la brassière MMA en gros plan.
- Amara : modèle de plus de 3,5 Mo (test `expressions-v1160` en échec depuis 2.0.0).
- Textures du corps en 1024 (sauf Kanya) : flou des abdominaux en gros plan.
- Les déformations dynamiques (épaule en extension, aine en coup de pied haut) n'ont pas été corrigées : aucune
  traversée ni rupture n'a été relevée sur les captures de frappe ; des « corrective blendshapes » demandent un travail
  de sculpture par pose dans Blender (proposition § 9).
- Téléphone Android réel : non mesuré.

## 8. Tests de non-régression

| Contrôle | Résultat |
|---|---|
| `morphology-v220.test.ts` (12 tests nouveaux : rapports taille/hanches mesurés sur les vrais modèles, bras jamais déplacés, normales, ordre peau/tenue, tenues = même champ) | TEST RÉUSSI |
| Vitest complet (1 730 tests) | 1 723 réussis ; 5 TEST ÉCHOUÉ **déjà en échec en 2.1.0** (`expressions-v1160` taille du modèle d'Amara, `extension-v032` uppercut, `hooks-biomeca`, `fluidity` ×2) ; 1 échec nouveau (`outfit-rollback-v1373` « modèle corporel Kadir intact ») **corrigé en annulant la retouche de Kadir**, fichier relancé : TEST RÉUSSI |
| `victor-peau` (données sources = modèle, octet pour octet) | TEST RÉUSSI |
| Playwright ciblé (boot, coach-3d-recovery, coach-render, coachs-v160, ecran-coach-v140, moteur-lumiere, outfit-loading, premium, salles, selection-coach-v4, stabilite-3d-v1563, navigation) : 74 tests | TEST RÉUSSI (74/74) |
| Playwright complet | NON EXÉCUTÉ (plus d'une heure ; aucun écran ni navigation modifiés) |
| `npm run build` | TEST RÉUSSI |
| Captures WebGL avant/après (90 paires) | aucune image vide, aucune erreur |
| Téléphone Android réel | NON EXÉCUTÉ |

Aucun test affaibli ni supprimé. Interface, navigation, techniques : non modifiées.

## 9. Proposition pour un rendu final homogène

1. **Profils athlétiques différenciés** (guide, à valider par Youssef avant toute modification) :
   Kadir « puissance / lutte » (tronc profond, trapèzes) ; Naël « explosivité » (sec, taille fine, épaules dessinées) ;
   Victor « endurance / vétéran » (tronc plus plein que Kadir, dos large) ; Amara « puissance de frappe » (épaules et
   deltoïdes un peu plus pleins) ; Inaya « coups de pied » (fessiers et quadriceps plus marqués, haut du corps plus fin) ;
   Kanya « clinch » (dos et épaules plus solides, cou fort). Chaque profil = des bandes du même champ
   (`src/three/morphology.ts`), appliquées corps + tenues, mesurées et capturées comme ici.
2. **Textures de corps 2048** en qualité haute (sources Rocketbox, reprises de couleur de chaque coach) : gain net en
   gros plan ; coût mesuré à prévoir (+12 Mo de mémoire graphique par coach affiché).
3. **Correctifs de pose** (corrective blendshapes) pour l'épaule levée (direct, uppercut) et l'aine en coup de pied haut,
   sculptés dans Blender sur un coach pilote, puis propagés.
4. **Brassières** : bonnets moins rigides (Amara, Inaya), bords nets des bretelles.
5. **Éclairage** : une lumière de contour (rim) plus marquée sur le dos et les épaules, à tester sans changer les
   ambiances approuvées.
