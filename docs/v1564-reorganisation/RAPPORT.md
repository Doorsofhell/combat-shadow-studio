# Rapport 1.56.4 — réorganisation et allègement du dépôt

Demande de Youssef (18/11/2026) : audit complet du dépôt, archivage de ce qui est inutilisé dans
`_ARCHIVES_HORS_APPLICATION/`, restructuration adaptée au projet, optimisation de l'APK, sans perte de données ni
régression. Aucune fusion ni publication sans son accord.

- Version de référence : **1.56.3** (`claude/project-thread-o7lrt8`, commit `8311586`, déployée).
- Version candidate : **1.56.4**, branche `claude/project-thread-3mn6yf`.
- Restauration : branche `restauration/avant-reorganisation-v1563` (= 1.56.3).

## 1. Audit : méthode et résultats

| Vérification | Méthode | Résultat |
|---|---|---|
| Modèles et tenues | lecture de l'en-tête glTF des 51 GLB de `public/coaches/` ; recherche des chemins dans `src/` (`CoachModel.tsx`, `preload.ts`, `outfit.ts`), `tools/build/bootModels.ts` et le service worker | les 6 coachs × (`photo.glb` + 7 tenues) et `photo-clean.glb` d'Amara sont chargés ; les 2 tenues d'arbitre ne servent qu'aux illustrations de l'encyclopédie ; aucune image externe ni compression Draco dans les GLB |
| Textures `_tex/` | recherche de `_tex` dans `src/`, `tests/`, `scripts/`, `tools/`, `.github/` | seul `outfits.py` les écrit, personne ne les lit : copies de travail d'images déjà intégrées aux GLB (26,7 Mo) |
| Vignettes des techniques | liste des 91 techniques (`TECHNIQUE_BY_ID`) comparée à `public/thumbs/{homme,femme}/` | 182/182 utilisées, aucune manquante |
| Encyclopédie | liste des images (`IMAGES` de `src/domain/encyclopedia/images.ts`, grande + `-mini`) comparée à `public/encyclopedie/` | 224/224 utilisées |
| Salles, emblèmes, icônes, catalogue, art | chemins construits dans `rooms.ts`, `preload.ts`, `emblems/registry.ts`, `index.html`, `disciplineArt.ts`, `catalog/loader.ts` | tout est utilisé |
| Photos `coaches/homme.jpg`, `femme.jpg` | recherche dans tout le dépôt | référencées nulle part (seul le précache PWA les embarquait) |
| Dépendances npm | recherche des imports de chaque dépendance dans `src/`, `tests/`, `tools/`, `scripts/`, `vite.config.ts` | toutes utilisées ; aucune retirée |
| Scripts | recherche du nom de chaque fichier de `scripts/`, `tools/`, `lab/` dans le code, `package.json` et les workflows | 10 scripts démontrés morts ou remplacés (motifs dans l'inventaire) ; les autres scripts non référencés sont des outils de capture ou des étapes documentées des chaînes Blender : **gardés** faute de preuve |
| Workflows GitHub | déclencheurs et actions de chaque fichier de `.github/workflows/` | tous encore actifs (sur PR vers la branche publiée, ou déploiement) : **aucun déplacé** |
| Générateur Blender | `tools/generator/` (chaînes Rocketbox, Victor, Kanya, Kadir, emblèmes) | **gardé entier** ; seul le dossier de sortie des textures de travail de `outfits.py` change |

## 2. Archivage

598 fichiers déplacés avec `git mv` (rien supprimé), 97,2 Mo. Liste complète, chemins d'origine et motifs :
[`_ARCHIVES_HORS_APPLICATION/inventaire-archives.md`](../../_ARCHIVES_HORS_APPLICATION/inventaire-archives.md).

| Catégorie | Fichiers | Contenu |
|---|---:|---|
| `anciens-modeles-3d/` | 136 | Axel, Kaila, modèles manga, masques, cheveux et peau du coach généré (ancien `backup CS/`) |
| `anciennes-textures/` | 362 | `public/coaches/*/tenues/_tex/` |
| `anciennes-animations/` | 0 | aucune animation inutilisée (poses calculées par le moteur) |
| `anciennes-tenues/` | 0 | toutes les tenues servent |
| `anciens-scripts/` | 34 | recettes Amara 1.37.4–1.37.6, captures du créateur et des cheveux en cartes, générateur MakeHuman, morph 1.37.9, 2 workflows retirés |
| `anciens-prototypes/` | 2 | `lab/groom.*` (ne compile plus depuis la 1.37.0) |
| `anciennes-versions/` | 55 | reste de l'ancien `backup CS/` (code, tests, docs, originaux 1.36.0) et `homme.jpg`/`femme.jpg` |
| `fichiers-temporaires/` | 9 | caches Python et scripts d'inspection jetables |

## 3. Restructuration

Le code était déjà rangé par rôle (`src/domain`, `src/engine`, `src/three`, `src/ui`, `src/store`, `src/boot`…).
Déplacer ces modules n'aurait rien retiré de l'APK, aurait cassé les PR ouvertes (#128, #129, #99…) et
l'historique ligne à ligne : la réorganisation a donc porté sur ce qui pesait sans servir. La carte des dossiers par
rôle (application, rendu 3D, coachs, animations, tenues, textures, programmes, Android, outils, tests, archives) est
dans [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md).

Changements de structure :

- racine : `backup CS/` et `lab/` disparaissent ; `_ARCHIVES_HORS_APPLICATION/` apparaît ;
- `tools/build/nativeOnly.ts` (nouveau) : le build Android laisse les tenues d'arbitre hors de l'APK ;
- `tools/generator/rocketbox/outfits.py` : textures de travail écrites hors de `public/` (`CSS_TEX_DIR` ou dossier
  temporaire) ;
- `vite.config.ts` : `coaches/*.jpg` retiré du précache ; plugin `nativeOnly` ;
- `.gitignore` : `__pycache__/`, `*.pyc` ;
- références mises à jour : `CLAUDE.md`, `README.md`, `docs/NON_REGRESSION.md`, `tools/generator/README.md`,
  `regen_outfits.sh`, 6 commentaires dans `src/` et `tests/`.

### Arborescence avant / après (fichiers suivis par git)

| Dossier | 1.56.3 | 1.56.4 |
|---|---|---|
| `.github/` | 12 fichiers, 0,0 Mo | 12, 0,0 Mo |
| `android/` | 54, 0,5 Mo | 54, 0,5 Mo |
| `backup CS/` | 216, 70,3 Mo | — (dans les archives) |
| `captures/` | 162, 22,5 Mo | 162 + captures de ce lot |
| `docs/` | 805, 73,6 Mo | 806 + ce rapport |
| `lab/` | 2, 0,0 Mo | — (dans les archives) |
| `public/` | **914, 160,0 Mo** | **550, 133,3 Mo** |
| `scripts/` | 78, 0,6 Mo | 68, 0,5 Mo |
| `src/` | 446, 3,7 Mo | 447, 3,7 Mo |
| `tests/` | 58, 18,6 Mo | 58, 18,6 Mo |
| `tools/` | 108, 10,5 Mo | 105, 10,4 Mo |
| `_ARCHIVES_HORS_APPLICATION/` | — | 607, 97,3 Mo |
| **Total suivi** | 2868, 360,9 Mo | 2882, 361,0 Mo |

`public/` avant : `coaches/` 406 fichiers (dont 362 `_tex`, 26,7 Mo), `encyclopedie/` 224, `thumbs/` 182,
`salles/` 46, `emblems/` 18, `art/` 12, `icons/` 5, `draco/` 3, `catalog/` 2. Après : `coaches/` 42 fichiers
(6 × `photo.glb` + `portrait.webp` + 7 tenues, `photo-clean.glb`, 2 tenues d'arbitre, licence), le reste inchangé.

## 4. Tailles

| Mesure | 1.56.3 | 1.56.4 | Écart |
|---|---:|---:|---:|
| Dépôt (fichiers suivis) | 360,9 Mo | 361,0 Mo | ≈ 0 (rien n'est supprimé, comme demandé) |
| Historique git (pack) | 649 Mio | inchangé | l'historique garde tout |
| `public/` | 160,0 Mo | 133,3 Mo | −26,7 Mo |
| Build web `dist/` | 115,24 Mo, 1003 fichiers | 88,50 Mo, 639 fichiers | **−26,7 Mo (−23 %)** |
| Build Android `dist/` (`CAP_BUILD=1`, contenu de l'APK) | 115,17 Mo, 999 fichiers | 85,66 Mo, 633 fichiers | **−29,5 Mo (−26 %)** |
| APK compilé | NON EXÉCUTÉ (voir §6) | | |

Contrôle octet par octet des deux builds : les 548 ressources gardées dans le build Android (550 en web) sont
**identiques** à celles de la 1.56.3 ; les seuls fichiers en moins sont les 362 `_tex`, les 2 photos `.jpg` et, dans
l'APK seulement, les 2 tenues d'arbitre ; les fichiers JS ne changent que par leur empreinte (numéro de version et
note de nouveautés). Les 95 fichiers de l’écran de démarrage (`src/boot/assetSizes.json`) sont tous présents dans
l'APK : le fonctionnement hors ligne est celui de la 1.56.3.

## 5. Tests

| Contrôle | Résultat |
|---|---|
| `npx vitest run` sur 1.56.3 (référence) | 1698 réussis, 1 ignoré, **5 échecs déjà présents** (expressions-v1160 taille d'Amara, hooks-biomeca « pas d'armé », extension-v032 uppercut, fluidity ×2) |
| `npx vitest run` sur 1.56.4 | **1702 réussis** (dont les 4 nouveaux de `archives-hors-build.test.ts`), 1 ignoré, les **mêmes 5 échecs** : TEST ÉCHOUÉ (connus, sans lien) ; nouveaux tests : TEST RÉUSSI |
| `npm run build` (titre v1.56.4) | TEST RÉUSSI |
| `npm run build:android` (`CAP_BUILD=1` + `cap sync android`) | TEST RÉUSSI |
| Compilation de l'APK (Gradle) | NON EXÉCUTÉ (SDK Android inaccessible ici ; workflow `android-apk.yml` à lancer avec ton accord) |
| Comparaison octet par octet des ressources des builds 1.56.3 / 1.56.4 | 548/548 (Android) et 550/550 (web) identiques : TEST RÉUSSI |
| Ressources de démarrage présentes dans l'APK (hors ligne) | 95/95 : TEST RÉUSSI |
| Captures WebGL avant/après (même coach, tenue, pose de garde, angle, cadrage, 600×800) | 18/18 rendues sans erreur WebGL ; écart de 0 à 14 pixels sur 480 000 (0,003 %) : TEST RÉUSSI |
| Contrôle du bruit : 1.56.3 contre elle-même (4 cas) | 0 à 11 pixels différents, écart max 37 : même ordre que avant/après, dû au visage vivant (clignements, regard) |
<!-- PLAYWRIGHT -->

Captures : 6 coachs, chacun dans deux disciplines (les six disciplines couvertes deux fois) en trois-quarts, plus
Kadir (MMA) et Inaya (JJB no-gi) de face, de profil et de dos. Images et mesures :
[`captures/v1564-reorganisation/`](../../captures/v1564-reorganisation/) (`avant/`, `apres/`, `manifest.json`,
`controle-avant-contre-avant.json`), script `scripts/visuels/reorg-v1564-before-after.mjs`. Animations : la garde
vivante est jouée dans chaque capture ; le moteur d'animation et les techniques ne sont pas modifiés (dans `src/engine/`, seul un
commentaire de test change de chemin ; `src/domain/techniques.ts` n'est pas touché), et leurs tests Vitest donnent les mêmes résultats qu'en 1.56.3.


## 6. Risques, limites et incertitudes

- **APK non compilé ici** : le SDK Android ne se télécharge pas depuis cet environnement (`dl.google.com` bloqué).
  Le workflow `android-apk.yml` le compile, mais il crée aussi une pré-version GitHub : à lancer seulement avec ton
  accord. La taille de l'APK n'est donc pas mesurée ; le contenu qu'il embarque (le `dist` Android) l'est.
- **Fichiers Gradle générés** : `android/app/capacitor.build.gradle` et `android/capacitor.settings.gradle` suivis
  par git ne listent pas les plugins `filesystem` et `share` ; `cap sync` (lancé par `build:android` et par le
  workflow) les corrige à chaque build. Non modifiés ici (hors périmètre), à mettre à jour lors d'un lot Android.
- **Tenues d'arbitre** : retirées de l'APK seulement ; si un jour l'application les affiche, il faudra retirer le
  filtre de `tools/build/nativeOnly.ts` (le test `archives-hors-build` signale déjà tout fichier de démarrage exclu).
- **Draco** : les décodeurs `public/draco/` (0,8 Mo) ne servent à aucun GLB actuel, mais le chargeur les déclare ;
  gardés faute de preuve qu'aucun modèle ne les demandera.
- **Générateur de tenues** : `outfits.py` n'a pas été relancé ici (Blender absent) ; le changement ne touche que le
  dossier où sont écrites les copies PNG, les images intégrées au GLB sont les mêmes.
- **Scripts non référencés gardés** : 30+ scripts de capture (`scripts/dev/shot-*.mjs`) et étapes des chaînes Blender
  ne sont appelés par aucun fichier, mais servent à la main ; sans preuve d'inutilité, ils restent en place.
- **Historique** : le dépôt git ne maigrit pas (l'historique et les archives gardent tout), comme demandé.
- **Affichage GitHub** : la liste des fichiers déplacés peut apparier deux fichiers au contenu identique (ex.
  textures d'Axel et de Naël) ; c'est l'inventaire qui donne le vrai chemin d'origine.
