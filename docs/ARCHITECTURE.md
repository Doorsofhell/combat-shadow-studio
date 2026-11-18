# Architecture du dépôt (1.56.4)

Carte des dossiers par rôle, établie lors de la réorganisation du 18/11/2026. Elle suit l'organisation réelle du
projet : le code source était déjà séparé par rôle (`domain`, `engine`, `three`, `ui`…), et déplacer des centaines
de modules n'aurait apporté aucun gain à l'APK tout en cassant les PR ouvertes et l'historique `git blame`. La
réorganisation a donc porté sur ce qui pesait sans servir : les ressources de `public/` copiées dans l'APK et les
fichiers morts, rangés dans `_ARCHIVES_HORS_APPLICATION/`.

Légende : **APK** = embarqué dans l'application Android et la version web ; **build** = nécessaire pour compiler ;
**dev** = outils de fabrication ou de contrôle, jamais embarqués.

| Rôle | Emplacement | Statut |
|---|---|---|
| Application et interface | `src/ui/` (écrans, navigation, composants, icônes, emblèmes, encyclopédie), `src/store/` (Zustand + IndexedDB), `src/boot/` (écran de démarrage, préchargement), `src/coach/` (Coach IA hors ligne), `src/audio/`, `src/account/`, `src/monetization/`, `src/ar/`, `src/editor/` (lecture des combattants enregistrés), `index.html`, `src/main.tsx` | APK |
| Moteur de rendu 3D | `src/three/` (scène `CoachStage.tsx`, coachs `CoachModel.tsx`/`PhotoCoach.tsx`, peau `skin*.ts`, `photoMaterials.ts`, salles `rooms/`, reprise après perte du contexte `safe3d.ts`), moteur humain `src/three/human/` + `face.ts` | APK |
| Modèles des coachs | `public/coaches/<id>/photo.glb` et `portrait.webp` (Kadir, Amara + `photo-clean.glb`, Naël, Inaya, Victor, Kanya), catalogue `src/domain/coaches/`, licence `public/coaches/LICENSE-ROCKETBOX.txt` | APK |
| Animations et techniques | moteur `src/engine/` (`rig.ts`, `player.ts`, `motion.ts`, limites, équilibre), poses clés `src/engine/library/`, techniques `src/domain/techniques.ts`, biomécanique `src/domain/biomech/` | APK |
| Tenues et accessoires | `public/coaches/<id>/tenues/<discipline>.glb` (7 par coach), habillage `src/three/outfit.ts`. Tenues d'arbitre (`arbitre*.glb`) : web et outil d'illustrations seulement, hors APK (`tools/build/nativeOnly.ts`) | APK / web |
| Textures et matériaux | intégrés aux GLB (aucune image externe) ; shaders `src/three/skin.ts`, `skinShader.ts`, `photoMaterials.ts` ; salles `public/salles/<discipline>/` | APK |
| Programmes d'entraînement | `src/domain/programs.ts`, `programCatalog.ts`, `exercises.ts`, `session/`, catalogue `public/catalog/` (champions, combos, programmes), générés par `scripts/build-catalog.mjs`, `build-programmes.mjs` | APK |
| Images de l'application | `public/thumbs/` (91 vignettes × 2), `public/encyclopedie/` (224), `public/emblems/`, `public/art/`, `public/icons/` | APK |
| Ressources Android | `android/` (projet Capacitor), `capacitor.config.ts`, `src/platform/native.ts`, `scripts/android-version.mjs`, workflow `.github/workflows/android-apk.yml` | build |
| Compilation | `vite.config.ts`, `tools/build/bootModels.ts` (compression meshopt sans perte des GLB), `tools/build/nativeOnly.ts`, `tsconfig.json`, `package.json` | build |
| Outils de génération | `tools/generator/` (Blender : coachs Rocketbox, Victor, Kanya, Kadir, tenues `rocketbox/outfits.py`, emblèmes), `scripts/salles/`, `scripts/visuels/`, `scripts/encyclopedie/`, `tools/icon-lab/` | dev |
| Tests et contrôles qualité | `src/**/__tests__/` (Vitest), `tests/e2e/` (Playwright), `tests/fixtures/` (squelettes mesurés), `scripts/dev/` (captures, contrôles des tenues), workflows de contrôle `.github/workflows/` | dev |
| Documentation et preuves | `docs/` (journal unique `JOURNAL_CORRECTIONS.md`, rapports par version), `captures/` (captures WebGL des validations) | dev |
| Archives hors application | `_ARCHIVES_HORS_APPLICATION/` (inventaire : `inventaire-archives.md`) | ni build ni APK |

## Ce qui garantit que les archives restent hors des builds

- `tsconfig.json` ne lit que `src/` ; Vitest que `src/**/*.test.ts(x)` ; Playwright que `tests/e2e/`.
- Vite ne copie que `public/` ; `_ARCHIVES_HORS_APPLICATION/` est à la racine.
- `src/boot/__tests__/archives-hors-build.test.ts` échoue si `public/` contient de nouveau des copies `_tex/`, des
  caches Python ou des photos orphelines, si un coach perd son modèle, son portrait ou l'une de ses 7 tenues, ou si
  l'exclusion Android touche un fichier de l'écran de démarrage.
