# 2.1.0 (expérimentale) · Écran « Ton coach » V4 : un univers tiré des traits de chaque coach

Demande de Youssef du 18/11/2026 (maquette V4), précisée le même soir : « Pas forcément des salles en ambiance, mais
quelque chose tiré des traits du coach ». Branche `claude/project-thread-ii0pmf`, partie de la 2.0.0 (`e176ff9`).
Restauration : `restauration/avant-selection-coach-v4` (= 2.0.0). **Rien n'est fusionné ni publié.**

## 1. Fichiers

| Fichier | Rôle |
|---|---|
| `src/domain/coaches/atmosphere.ts` (nouveau) | **CoachAtmosphereResolver** : règles, palettes, défauts, surcharge, départage |
| `src/three/atmosphere/emblem.ts` (nouveau) | dessin de l'emblème de fond dans un canevas (aucune image importée) |
| `src/three/atmosphere/AtmosphereScene.tsx` (nouveau) | scène WebGL de présentation : ciel, emblème, fumée légère, lueur au sol, lumières, fondus |
| `src/three/CoachStage.tsx` | prop facultative `atmosphere` ; sans elle, rendu identique à la 2.0.0 |
| `src/three/StudioStage.tsx` | props facultatives `customLights` et `autoFit` (cadrage auto en mode libre) ; défaut inchangé |
| `src/ui/screens/CoachSelect.tsx` | nouvelle disposition de `CoachSelect` ; `CoachPicker` (premier lancement, Réglages) inchangé |
| `src/ui/styles.css` | bloc `.coach-v4` ajouté à la fin ; les anciens styles restent |
| `tests/e2e/selection-coach-v4.spec.ts`, `src/domain/coaches/__tests__/atmosphere.test.ts` (nouveaux) | tests |
| `scripts/dev/shot-selection-v4.mjs`, `scripts/dev/shot-transition-v4.mjs` (nouveaux) | captures WebGL réelles |

Non touchés : barre du bas (`src/ui/nav/`, `App.tsx` : `git diff` vide), modèles, visages, tenues, textures, rigs,
animations, matériaux des coachs, `pickChampion`/`useChosenCoach`/`profileWrites` (règles de choix et de conservation).

## 2. Architecture

```
ALL_COACHES (catalogue) ──► resolveAll() ──► CoachAtmosphere (une par coach, déterministe, unique)
                                                  │
CoachSelect ── atmosphere={value, name} ──► CoachStage ──► AtmosphereScene (lumières + décor)
                                                  └──► StudioStage (customLights, autoFit, view.inset)
```

`CoachAtmosphere` : `discipline` (ou null), `environment` (nom lisible), `identity.animal`, `temperament`,
`palette {primary, secondary, accent, sky[haut, bas]}`, `lighting {temperature, intensity, rimLight, key, fill, rim}`,
`atmosphere {smoke, floorReflection, motif, eyes, streaks, floor, pace}`, `sources[]` (champ + règle de chaque choix).

## 3. Règles de génération (ordre de priorité)

1. **Discipline** : champ `discipline` s'il existe (futurs coachs) ; sinon mots du style puis de la description
   (muay-thaï/kru, kick-boxing, jiu-jitsu, judo, MMA/octogone/cage, boxe) ; sinon préfixe de l'identifiant (`mma-…`) ;
   sinon **aucune** (jamais devinée). Elle ne donne que le motif du sol (ring, octogone, tatami) et 15 % de teinte du fond.
2. **Description** puis **style**, **spécialités**, **garde** : tempérament (explosif > puissant > mobile > précis >
   calme > équilibré) → intensité de lumière, densité de fumée, vitesse du décor.
3. **Surnom** : l'animal (tigre/tigresse, lion/lionne, panthère, loup, aigle, faucon) → emblème, palette, yeux.
   Sans animal : monogramme (initiale) et couleurs de la discipline, ou neutres or.
4. **Spécialités / style rapides** (vitesse, mouvement, jeu de jambes, contres) → traits de vitesse.
5. **Profil physique** : seulement le cadrage (la caméra mesure l'enveloppe de la garde du coach à sa taille).

Lumière principale toujours presque blanche (test : chaque canal > 190) : la couleur passe par les contre-jours, le
ciel et l'emblème, pour ne pas teinter la peau. Deux coachs qui tomberaient sur la même signature (emblème + couleur)
sont départagés par une rotation de teinte tirée de leur identifiant. Surcharge manuelle : `ATMOSPHERE_OVERRIDES`
(vide).

## 4. Ambiances attribuées (calculées, rien de saisi à la main)

| Coach | Données lues | Univers | Couleur | Tempérament | Sol |
|---|---|---|---|---|---|
| Kadir « L'Aigle » | surnom ; id `mma-` ; « pression constante » | ailes de l'aigle | rouge sang, acier | puissant (lumière intense) | octogone |
| Naël « Le Faucon » | surnom ; « rapide, toujours en mouvement », contres | ailes en piqué + traits de vitesse | bleu électrique | mobile | aucun (pas de discipline dans ses données) |
| Victor « Le Loup gris » | surnom ; « technique et lucide » | pleine lune, brume, yeux pâles | gris argent, lune | précis | aucun |
| Amara « La Lionne » | surnom ; id `mma-` ; « frappe fort » | crinière en rayons | framboise profond, violet, or | puissant | octogone |
| Inaya « La Panthère » | surnom ; « Explosive » | griffures, yeux verts à pupille fente | émeraude | explosif (fumée plus dense) | aucun |
| Kanya « La Tigresse » | surnom ; « Kru de muay-thaï » ; « précision chirurgicale » | rayures de tigresse, yeux ambre | or, ambre, noir | précis | ring |

Écarts assumés avec la maquette : Kadir est « L'Aigle » (pas « Le Guerrier »), Naël « Le Faucon », Amara « La Lionne »,
Inaya « La Panthère » (pas judoka) : ce sont les données du dépôt. Kanya ressort « précise » et non « explosive » car sa
description dit « précision chirurgicale ».

## 5. Disposition (maquette V4)

Scène 3D en haut (coach en pied, nom géant très discret derrière lui dans l'univers, flèches dorées, bouton de
démonstration en icône) ; fiche posée sur le bas de la scène : surnom, nom, style, taille et poids (icônes), trois
spécialités avec icône ; portraits (visage plus lumineux, contour doré + coche sur le coach regardé) ; bouton doré
« Garder X » / « Choisir X » (même logique). Pas de statistique inventée.

Cadrage : la caméra cadre la garde réelle du coach dans la partie libre au-dessus de la fiche (`view.inset`), en
suivant le doigt (gauche-droite seulement, pas de pincement-zoom sur cet écran) ; elle s'élargit pendant la
démonstration. Mesuré sur Kanya (393×851) : 670 → 795 px de la tête aux pieds, **+19 %**.

## 6. Transitions

Nouvel emblème en fondu pendant que l'ancien s'efface (0,7 s ; 0,3 s en qualité légère ou mouvement réduit) ; ciel,
sol, lumières glissent vers les nouvelles couleurs ; le fond de l'écran passe en CSS (0,6 s). Pas d'écran noir : la
luminosité moyenne des images prises pendant un changement Kanya → Kadir ne descend jamais à 0
(`captures/transition-kanya-kadir.jpg`).

## 7. Tests

| Test | Résultat |
|---|---|
| `atmosphere.test.ts` (10 : unicité, déterminisme, animal réel, pas de discipline devinée, sources, lumière blanche, défauts, départage, surcharge) | TEST RÉUSSI |
| `npx vitest run` complet | 1712 réussis, 1 ignoré, **5 échoués déjà présents sur la 2.0.0** (relancés sur `e176ff9` : mêmes 5 — `extension-v032`, `fluidity` ×2, `hooks-biomeca`, `expressions-v1160` taille du modèle d'Amara) : TEST ÉCHOUÉ (sans lien) |
| `selection-coach-v4.spec.ts` (4 : univers par coach + fiche réelle ; 18 changements de suite sans erreur ni accumulation ; 360×640 et 412×915 sans débordement ni chevauchement) | TEST RÉUSSI |
| `coachs-v160.spec.ts` (choix, conservation après rechargement, flèches, démonstration, vignettes, rotation gauche-droite seulement) | TEST RÉUSSI (6/6) |
| `contrast.spec.ts`, `navigation.spec.ts`, `boot.spec.ts` | TEST RÉUSSI (après correction du badge « Ton coach » remis sur fond uni) |
| `npm run build` | TEST RÉUSSI |
| `npx playwright test` complet (≈ 300 tests, > 1 h) | NON EXÉCUTÉ |
| Téléphone Android réel / APK | NON EXÉCUTÉ (captures en SwiftShader) |

Barre du bas : aucun fichier modifié, tests de navigation réussis.

## 8. Performances (Chromium SwiftShader, 393×851)

- Coach prêt : 2.0.0 5,1 à 5,5 s (10,4 s une fois pour Amara) ; V4 5,4 à 6,4 s.
- Dessin d'un emblème : 4 à 10 ms (une fois par changement de coach).
- Appels de dessin : 11 → 17 à 20 par image ; shaders +6 ; géométries +4 ; textures de l'ambiance : 2 au plus
  (emblème 768×1080, 384×540 en légère ; fumée 256×256), vérifié après 18 changements.
- **Mémoire à chaque changement de coach : corrigé** (demande de Youssef du 19/11 06:52, voir § 11). Avant : le total
  des textures en mémoire graphique grandissait d'environ 13 à chaque changement (463 → 672 en 200 s sur la 2.0.0,
  474 → 682 sur la V4). Après : stable d'un tour de coachs à l'autre.
- Qualité légère (passage automatique quand l'appareil rame) : pas de fumée, emblème en demi-résolution, lumière
  d'ambiance relevée ; la peau y est plus saturée, comme sur la 2.0.0 dans le même mode
  (`captures/qualite-legere-2.0.0-puis-v4.jpg` : 2.0.0 à gauche, V4 avant puis après relevé de lumière).

## 9. Limites

- Les captures viennent de Chromium sans carte graphique (SwiftShader) : le rendu et la fluidité sur un vrai
  téléphone restent à vérifier.
- Les emblèmes sont dessinés par code (traits effilés) : stylisés, pas illustrés comme la tête de tigre de la maquette.
- Le pincement pour zoomer est coupé sur cet écran (la caméra garde le coach entier) ; la rotation au doigt reste.
- Un futur coach sans animal dans son surnom aura un monogramme ; un animal non listé peut être ajouté à `ANIMALS`.

## 10. Captures

`captures/avant-apres-<coach>.jpg` (même profil, même discipline boxe, même taille 393×851 ×2, même attente,
2.0.0 à gauche, V4 à droite), `apercu-6-avant.jpg`, `apercu-6-univers.jpg`, `transition-kanya-kadir.jpg`,
`mesures-avant.json`, `mesures-apres.json`.

## 11. Correction de la mémoire à chaque changement de coach (19/11/2026)

Demande de Youssef (19/11 06:52) : « Il faut corriger la mise en mémoire à chaque changement de coach avant la
publication ». Restauration : `restauration/avant-memoire-coach-v4` (= `2edb83c`).

**Constat vérifié.** Les textures vivantes de la carte graphique ont été comptées une à une (appels WebGL
`createTexture` / `deleteTexture`, groupées par taille et format) après chaque tour complet des six coachs, sur la
version construite (`.tmp-measure/texleak.mjs`, hors dépôt) :

| | tour 1 | tour 2 | tour 3 | ce qui grandit |
|---|---|---|---|---|
| avant | 163 | 242 | 321 | 20×20 en flottants (matrices des os) : 73 → 219 ; emblème 384×540 : 5 → 17 |
| après | 94 | 94 | 94 | rien |

Deux causes :

1. **Squelettes jamais rendus (≈ 12 par changement, déjà là en 2.0.0).** Chaque coach affiché est une copie du modèle
   chargé ; chaque partie animée de la copie (corps, tête, yeux, cheveux…) et chaque pièce de tenue a son propre
   squelette, et three.js garde les positions de ses os dans une petite texture. Les matériaux étaient rendus quand le
   coach partait, pas les squelettes. Les géométries propres à la copie (visage sans expressions immobiles, surface
   nettoyée d'Amara) ne l'étaient pas non plus.
2. **Emblème de l'univers renvoyé en mémoire (≈ 1 par changement, propre à la 2.1.0).** L'emblème qui s'efface était
   rendu pendant que son dessin restait une image de plus dans la scène : three.js le renvoyait aussitôt à la carte
   graphique, pour de bon. Le compteur de l'ambiance (objets) ne le voyait pas ; le compteur de la carte graphique, oui.

**Correction (rien ne change à l'écran).**

- `src/three/PhotoCoach.tsx` : au départ du coach (ou au changement de qualité), ses squelettes et ses géométries
  propres sont rendus avec ses matériaux. Le modèle chargé (partagé, en cache) n'est pas touché.
- `src/three/outfit.ts` : le squelette de chaque pièce de tenue est rendu avec elle.
- `src/three/atmosphere/AtmosphereScene.tsx` : l'emblème qui s'efface est d'abord caché, puis rendu.

**Test renforcé.** `tests/e2e/selection-coach-v4.spec.ts` (18 changements) : le total des textures en mémoire
graphique après un tour de plus ne dépasse pas celui d'avant ce tour (marge 2). Il aurait échoué avant la correction
(+78 par tour).
**Résultats.** Playwright (choix du coach V4, coachs, chargement des tenues, rendu, reprise 3D, stabilité 3D, écran
coach, barre du bas) : 58/58 TEST RÉUSSI. Vitest `src/three` + `src/domain/coaches` : 727 réussis, 1 échec déjà présent
en 2.0.0 (taille du modèle d'Amara). Build : TEST RÉUSSI. Captures avant/après la correction (Kadir, Amara, Kanya) :
`captures/memoire-avant-apres.jpg`, rendu identique.
