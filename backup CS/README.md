# backup CS

Ce dossier range ce qui a été **retiré de l'application** et qu'on garde sur GitHub pour l'historique (demande de
Youssef, 12/11/2026 : « Tout ce que tu supprimes, tu le classes dans un dossier backup […] non inclus dans
l'application mais tu le gardes sur GitHub »).

Rien ici n'est compilé, testé ni publié : `tsconfig` ne lit que `src/`, Vitest que `src/**/*.test.ts(x)`,
Playwright que `tests/e2e/`, et Vite ne publie que `public/`. Les chemins à l'intérieur de chaque lot reprennent
ceux du dépôt au moment du retrait, pour savoir d'où vient chaque fichier.

## v1.37-ultra-realiste (version 1.37.0, 12/11/2026)

Mission : ne garder que les coachs ultra-réalistes (Microsoft Rocketbox : Kadir, Amara, Naël, Inaya).

| Retiré | Fichiers |
|---|---|
| Rendus dessinés (manga, encre, cel, anime) : shaders `TOON_FRAGMENT`, `INK_FRAGMENT`, contours en coque inversée, `applyManga`, `toonMaterial`, `outlineMaterial`. Code mort depuis la 1.9 : seuls des tests l'utilisaient. | `src/three/manga.ts` |
| Coach généré (modèle MakeHuman personnalisable, rendu « Précédente (secours) ») et sa personnalisation : vêtements en coque, gants sculptés, tatouages, cheveux en cartes, grain de peau. | `src/three/customize.ts`, `groom.ts`, `hair_atlas.json`, `gloveShape.ts`, `src/editor/random.ts`, `tattoos.ts`, `public/models/*_manga*`, `public/coaches/mma-*/model.meta.json`, `model_masks.png`, `model_face.png`, `public/groom/`, `public/skin/` |
| Écran caché « Mon combattant » (/combattant, ancien créateur de personnage). Les combattants enregistrés restent lisibles dans l'application. | `src/ui/screens/CoachStudio.tsx`, `coach-studio.css`, `src/ui/screens/coach/` |
| Coachs Axel et Kaila (MakeHuman). | `public/coaches/axel/`, `public/coaches/kaila/` |
| Outils de fabrication de ces modèles. | `tools/generator/build.py`, `install.py`, `anatomy.py`, `coaches/` (sauf `design.py`, resté en place), `groom/`, `skin/`, `makehuman/`, `rocketbox/glove_ts.py`, ancien `README.md` |
| Tests de ces éléments seulement (créateur, rendus dessinés, Axel et Kaila). | `src/three/__tests__/customize.test.ts`, `groom.test.ts`, `models.test.ts`, `outfit-v043.test.ts` (version 1.36), `src/engine/__tests__/makehuman-coaches.test.ts`, `src/editor/__tests__/editor.test.ts` (version 1.36), `src/test/body.ts`, `tests/e2e/coach-studio.spec.ts`, `coach-render.spec.ts` (version 1.36) |
| Documents propres à ces éléments. | `docs/COACHS_3D_REFONTE.md`, `docs/AUDIT_HUMANOIDES.md`, `docs/captures-coachs/`, `docs/comparatif/`, `docs/rendus-coachs.png` |
| Versions 1.36.0 des fichiers dont du code a été retiré, pour comparer. | `originaux-1.36.0/` |

Restent dans le dépôt, hors application : les squelettes de quatre modèles générés
(`tests/fixtures/modeles-generes/`), que les tests du moteur d'animation mesurent encore.

Pour revenir entièrement à la 1.36.0 : branche `restauration/avant-ultra-realiste-v137`.

## workflows (version 1.37.7, 12/11/2026)

| Retiré | Pourquoi |
|---|---|
| `.github/workflows/amara-v1376.yml` | À chaque push, il reconstruisait les tenues d'Amara avec la recette 1.37.6 et exigeait la découpe centrale du short MMA. Remplacé par `amara-v1377.yml` (choix de Youssef, 12/11 19:45) : au push, il contrôle les tenues 1.37.7 relues sur captures ; la reconstruction se fait à la demande. |
| `.github/workflows/amara-garments-v1379.yml` (version 1.38.0, 13/11/2026) | Il exigeait la marque du morph « CSS_CleanBikini » de la 1.37.9 dans `photo-clean.glb` (`audit-amara-original-swimsuit.py`). Depuis la 1.38.0, `photo-clean.glb` est un vrai corps nettoyé, sans morph. Remplacé par `amara-finish-v1380.yml` (cou, bandes en mouvement, tenues, version, build). |

## v1.37.9-morph (version 1.38.0, 13/11/2026)

En 1.37.9, l'ancien maillot d'Amara était aplati par un morph ajouté à `photo-clean.glb` et appliqué au chargement.
En 1.38.0, `photo-clean.glb` est le corps réellement nettoyé (`tools/generator/rocketbox/torso_from_clean.py` et
`torso_textures.py`) : le cordon du maillot disparaît aussi de la nuque, que le morph ne touchait pas.

| Retiré | Fichiers |
|---|---|
| Outils et contrôles propres au morph de la 1.37.9 (ils exigent ce morph, absent du nouveau fichier). | `scripts/dev/audit-amara-original-swimsuit.py`, `validate-amara-clean-morph-v1379.py`, `append-amara-clean-morph-v1379.py`, `calc-amara-surface-v1379.py`, `repaint-amara-swimsuit-v1379.py`, `validate-amara-mma-reference-v1379.py` |

Reste en place, sans effet tant que le fichier n'a pas de morph : `src/three/amaraCleanSurface.ts` (il rend `false`
et le modèle est affiché tel quel). Pour revenir à la 1.37.9 : branche `restauration/avant-amara-v1380`.
