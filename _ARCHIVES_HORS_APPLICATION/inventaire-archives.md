# Inventaire des archives hors application

Créé en 1.56.4 (18/11/2026), réorganisation du dépôt demandée par Youssef : « Tout fichier identifié comme inutilisé doit être déplacé […] Ne supprimer définitivement aucun fichier ».

## Règles

- Rien n'est supprimé : chaque fichier a été déplacé avec `git mv` (historique conservé, `git log --follow` fonctionne).
- Rien ici n'est compilé, testé ni publié : `tsconfig.json` ne lit que `src/`, Vitest que `src/**/*.test.ts(x)`, Playwright que `tests/e2e/`, Vite ne copie que `public/`. Le test `src/boot/__tests__/archives-hors-build.test.ts` le vérifie.
- Chaque fichier garde, sous sa catégorie, son chemin d'origine : `_ARCHIVES_HORS_APPLICATION/<catégorie>/<chemin d'origine>` (pour l'ancien `backup CS/`, voir son README).
- Sur GitHub, la vue « fichiers modifiés » peut apparier un fichier déplacé avec un autre fichier au contenu identique (ex. textures identiques d'Axel et de Naël) : le chemin d'origine qui fait foi est celui de la liste ci-dessous.
- Restaurer un fichier : `git mv "_ARCHIVES_HORS_APPLICATION/<catégorie>/<chemin>" "<chemin>"`. Tout restaurer d'un coup : branche `restauration/avant-reorganisation-v1563` (= 1.56.3).

## Résumé

| Catégorie | Fichiers | Taille | Motif |
|---|---:|---:|---|
| `anciens-modeles-3d/` | 136 | 68.3 Mo | BACKUP |
| `anciennes-textures/` | 362 | 26.7 Mo | TEX |
| `anciennes-animations/` | 0 | 0.0 Mo | aucun fichier dont l’inutilité soit démontrée |
| `anciennes-tenues/` | 0 | 0.0 Mo | aucun fichier dont l’inutilité soit démontrée |
| `anciens-scripts/` | 34 | 0.2 Mo | AMARA, BACKUP, EDITOR, GROOM |
| `anciens-prototypes/` | 2 | 0.0 Mo | GROOM |
| `anciennes-versions/` | 55 | 1.9 Mo | BACKUP, JPG |
| `fichiers-temporaires/` | 9 | 0.1 Mo | PYC, TMP |
| **Total** | **598** | **97.2 Mo** | |

Codes des motifs :

- **TEX** : Copies de travail des textures de tissu écrites par `tools/generator/rocketbox/outfits.py` à côté des tenues. Les GLB embarquent déjà ces images (JPEG intégrés : aucun des 51 GLB de `public/coaches/` ne référence d'image externe, vérifié le 18/11/2026) ; aucun fichier de `src/`, des tests, des workflows ou des scripts ne lit `_tex/`. Elles étaient copiées dans `dist/` et dans l'APK (26 Mo). Le générateur écrit maintenant ces copies hors de `public/` (dossier temporaire, ou `CSS_TEX_DIR`).
- **BACKUP** : Ancien dossier `backup CS/` (éléments retirés de l'application en 1.37.0 et 1.38.0 : Axel, Kaila, rendus dessinés, créateur, morph 1.37.9, deux workflows). Déjà hors build ; regroupé ici par catégorie, voir `anciennes-versions/backup-CS/README.md`.
- **JPG** : Anciennes photos de coach (versions 0.x, coachs « homme »/« femme » avant les modèles 3D). Aucune référence dans `src/`, `index.html`, les tests ou les scripts ; seul le précache PWA (`includeAssets: coaches/*.jpg`) les embarquait, motif retiré de `vite.config.ts`.
- **PYC** : Cache Python compilé (`__pycache__/*.pyc`) committé par erreur ; régénéré automatiquement. `.gitignore` l'exclut désormais.
- **TMP** : Scripts jetables d'inspection (préfixe `_`) : non référencés par `package.json`, un workflow, un test ou un autre script ; `_shots.mjs` vise un serveur local fixe (port 4192) et un ancien chemin de Chromium.
- **GROOM** : Banc d'essai des cheveux en cartes (0.29). Il importe `CoachStyle` de `src/three/CoachModel.tsx` et le module `groom`, tous deux supprimés en 1.37.0 : il ne compile plus. `shot-groom.mjs` ne servait qu'à ce banc.
- **EDITOR** : Captures du créateur de combattant aléatoire : `shot-random.mjs` importe `src/editor/random.ts` (supprimé en 1.37.0) et `shot-editor-random.mjs` ouvre l'écran `/combattant` (supprimé en 1.37.0).
- **AMARA** : Recettes successives des tenues d'Amara 1.37.4 à 1.37.6, remplacées par `scripts/dev/regenerate-amara-v1377.sh` et `check-amara-garments-v1377.py` (utilisés par `.github/workflows/amara-v1377.yml`). Aucun workflow, script ni test ne les appelle ; le workflow 1.37.6 qui les lançait est lui-même archivé depuis la 1.37.7.

## Catégories sans fichier

- `anciennes-animations/` : les animations sont des poses clés calculées par le moteur (`src/engine/`), pas des fichiers ; les 91 techniques ont toutes leur vignette et aucune animation enregistrée n'est orpheline.
- `anciennes-tenues/` : les 7 tenues de chaque coach (6 disciplines + JJB no-gi) sont chargées par l'application ; les tenues d'arbitre (`arbitre.glb` d'Amara, `arbitre-judo.glb` de Kadir) servent aux illustrations de l'encyclopédie (`src/domain/encyclopedia/images.ts`) : elles restent dans `public/`, mais l'APK ne les embarque plus (`tools/build/nativeOnly.ts`). Les tenues de Kaila et d'Axel sont avec leurs modèles dans `anciens-modeles-3d/`.

## Liste complète

### `anciens-modeles-3d/`

| Chemin d'origine | Motif | Octets |
|---|---|---:|
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/model.glb` | BACKUP | 4326892 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/model.meta.json` | BACKUP | 482 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/model_face.png` | BACKUP | 42249 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/model_masks.png` | BACKUP | 124557 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/photo.glb` | BACKUP | 2251468 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/portrait.webp` | BACKUP | 25146 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/ceinture-#121212_c.png` | BACKUP | 5150 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/ceinture-#121212_n.png` | BACKUP | 27365 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/ceinture-boxe-#D4AF37_c.png` | BACKUP | 4285 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/ceinture-boxe-#D4AF37_n.png` | BACKUP | 7717 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/ceinture-compression-#B3122A_c.png` | BACKUP | 4654 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/ceinture-compression-#B3122A_n.png` | BACKUP | 11362 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/ceinture-kick-#B3122A_c.png` | BACKUP | 4317 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/ceinture-kick-#B3122A_n.png` | BACKUP | 10623 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/ceinture-mma-#B3122A_c.png` | BACKUP | 5277 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/ceinture-mma-#B3122A_n.png` | BACKUP | 13570 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/ceinture-thai-#F4F4F5_c.png` | BACKUP | 7248 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/ceinture-thai-#F4F4F5_n.png` | BACKUP | 8216 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/ceinture-vale-tudo-#1A1B1F_c.png` | BACKUP | 2652 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/ceinture-vale-tudo-#1A1B1F_n.png` | BACKUP | 9407 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/chaussure-v2-#16181D_n.png` | BACKUP | 82578 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/col-#1E2A44-bjj_c.png` | BACKUP | 11386 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/col-#1E2A44-bjj_n.png` | BACKUP | 23172 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/col-#F7F6F2-judo_c.png` | BACKUP | 23565 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/col-#F7F6F2-judo_n.png` | BACKUP | 24390 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/cordon-#D4AF37_n.png` | BACKUP | 6103 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/cuir-gant-boxe_n.png` | BACKUP | 369239 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/cuir-gant-thai_n.png` | BACKUP | 370093 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/elastique-#E9E9E6_n.png` | BACKUP | 5922 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/gant-mma-#16181D_n.png` | BACKUP | 82234 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/gi-#1E2A44-bjj_c.png` | BACKUP | 113664 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/gi-#1E2A44-bjj_n.png` | BACKUP | 193455 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/gi-#F7F6F2-judo_c.png` | BACKUP | 156630 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/gi-#F7F6F2-judo_n.png` | BACKUP | 206688 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/haut-rash-long-#1F2937_n.png` | BACKUP | 274450 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/pantalon-#1E2A44-bjj_c.png` | BACKUP | 47792 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/pantalon-#1E2A44-bjj_n.png` | BACKUP | 30638 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/pantalon-#F7F6F2-judo_c.png` | BACKUP | 77348 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/pantalon-#F7F6F2-judo_n.png` | BACKUP | 31509 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/paume-mma-#E9E9E6_n.png` | BACKUP | 78357 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/protection-#F4F4F5_n.png` | BACKUP | 85392 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/protection-mma-#16181D_n.png` | BACKUP | 5602 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/sangle-mma-#E9E9E6_n.png` | BACKUP | 4228 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/short-boxe-#B3122A_n.png` | BACKUP | 23715 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/short-compression-#16181D_n.png` | BACKUP | 274450 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/short-kick-#16181D_n.png` | BACKUP | 31372 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/short-mma-#16181D_n.png` | BACKUP | 16772 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/short-thai-#C8102E_n.png` | BACKUP | 23969 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/short-vale-tudo-#3A3D43_n.png` | BACKUP | 305312 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/_tex/velcro-#B3122A_n.png` | BACKUP | 6064 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/bjj-nogi.glb` | BACKUP | 3092440 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/bjj.glb` | BACKUP | 1883040 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/boxe.glb` | BACKUP | 1635164 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/judo.glb` | BACKUP | 1897040 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/kickboxing.glb` | BACKUP | 1742916 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/mma.glb` | BACKUP | 2418592 |
| `backup CS/v1.37-ultra-realiste/public/coaches/axel/tenues/muaythai.glb` | BACKUP | 1463892 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/model.glb` | BACKUP | 4678088 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/model.meta.json` | BACKUP | 487 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/model_face.png` | BACKUP | 41359 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/model_masks.png` | BACKUP | 120213 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/photo.glb` | BACKUP | 2444504 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/portrait.webp` | BACKUP | 26814 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/ceinture-#121212_c.png` | BACKUP | 5003 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/ceinture-#121212_n.png` | BACKUP | 26520 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/ceinture-boxe-#D4AF37_c.png` | BACKUP | 4285 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/ceinture-boxe-#D4AF37_n.png` | BACKUP | 7717 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/ceinture-kick-#16181D_c.png` | BACKUP | 1841 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/ceinture-kick-#16181D_n.png` | BACKUP | 9703 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/ceinture-surshort-#17171C_c.png` | BACKUP | 4785 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/ceinture-surshort-#17171C_n.png` | BACKUP | 13790 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/ceinture-thai-#D4AF37_c.png` | BACKUP | 4407 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/ceinture-thai-#D4AF37_n.png` | BACKUP | 14953 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/ceinture-vale-tudo-#17171C_c.png` | BACKUP | 1839 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/ceinture-vale-tudo-#17171C_n.png` | BACKUP | 9407 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/ceinture-vale-tudo-#202126_c.png` | BACKUP | 6284 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/ceinture-vale-tudo-#202126_n.png` | BACKUP | 12990 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/chaussure-v2-#F4F4F5_n.png` | BACKUP | 82563 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/col-#F2F0EA-bjj_c.png` | BACKUP | 19733 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/col-#F2F0EA-bjj_n.png` | BACKUP | 23319 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/col-#F7F6F2-judo_c.png` | BACKUP | 23141 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/col-#F7F6F2-judo_n.png` | BACKUP | 24117 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/cordon-#B3122A_n.png` | BACKUP | 6103 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/cuir-gant-boxe_n.png` | BACKUP | 368999 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/cuir-gant-thai_n.png` | BACKUP | 369840 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/elastique-#2B2D33_n.png` | BACKUP | 5922 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/gant-mma-#16181D_n.png` | BACKUP | 82046 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/gi-#F2F0EA-bjj_c.png` | BACKUP | 185221 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/gi-#F2F0EA-bjj_n.png` | BACKUP | 193323 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/gi-#F7F6F2-judo_c.png` | BACKUP | 152558 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/gi-#F7F6F2-judo_n.png` | BACKUP | 206484 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/haut-brassiere-#141519_n.png` | BACKUP | 265509 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/haut-brassiere-#16181D_n.png` | BACKUP | 265509 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/haut-brassiere-#1D2B57_n.png` | BACKUP | 265509 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/haut-brassiere-degrade_n.png` | BACKUP | 265509 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/haut-rash-court-#16181D_n.png` | BACKUP | 274450 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/haut-rash-long-#B3122A_n.png` | BACKUP | 274450 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/liseré-#17171C_n.png` | BACKUP | 12319 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/liseré-#B3122A_n.png` | BACKUP | 8251 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/liseré-#D4AF37_n.png` | BACKUP | 13079 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/pantalon-#16181D-nogi_n.png` | BACKUP | 274450 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/pantalon-#F2F0EA-bjj_c.png` | BACKUP | 88095 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/pantalon-#F2F0EA-bjj_n.png` | BACKUP | 34173 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/pantalon-#F7F6F2-judo_c.png` | BACKUP | 67334 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/pantalon-#F7F6F2-judo_n.png` | BACKUP | 29860 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/protection-#16181D_n.png` | BACKUP | 85402 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/protection-mma-#16181D_n.png` | BACKUP | 5602 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/sangle-mma-#2B2D33_n.png` | BACKUP | 4228 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/short-boxe-#16181D_n.png` | BACKUP | 23715 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/short-kick-#B3122A_n.png` | BACKUP | 38593 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/short-surshort-#17171C_n.png` | BACKUP | 43927 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/short-thai-#1D2B57_n.png` | BACKUP | 24445 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/short-vale-tudo-#141519_n.png` | BACKUP | 305312 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/short-vale-tudo-degrade_n.png` | BACKUP | 305312 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/_tex/velcro-#B3122A_n.png` | BACKUP | 6064 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/bjj-nogi.glb` | BACKUP | 1944076 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/bjj.glb` | BACKUP | 2876776 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/boxe.glb` | BACKUP | 2558832 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/judo.glb` | BACKUP | 2882840 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/kickboxing.glb` | BACKUP | 2702236 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/mma.glb` | BACKUP | 3631152 |
| `backup CS/v1.37-ultra-realiste/public/coaches/kaila/tenues/muaythai.glb` | BACKUP | 2447076 |
| `backup CS/v1.37-ultra-realiste/public/coaches/mma-amara/model.meta.json` | BACKUP | 485 |
| `backup CS/v1.37-ultra-realiste/public/coaches/mma-amara/model_face.png` | BACKUP | 41032 |
| `backup CS/v1.37-ultra-realiste/public/coaches/mma-amara/model_masks.png` | BACKUP | 121868 |
| `backup CS/v1.37-ultra-realiste/public/coaches/mma-kadir/model.meta.json` | BACKUP | 487 |
| `backup CS/v1.37-ultra-realiste/public/coaches/mma-kadir/model_face.png` | BACKUP | 42903 |
| `backup CS/v1.37-ultra-realiste/public/coaches/mma-kadir/model_masks.png` | BACKUP | 126524 |
| `backup CS/v1.37-ultra-realiste/public/groom/hair_atlas.png` | BACKUP | 1228457 |
| `backup CS/v1.37-ultra-realiste/public/models/coach_female_manga.glb` | BACKUP | 4693788 |
| `backup CS/v1.37-ultra-realiste/public/models/coach_female_manga.meta.json` | BACKUP | 487 |
| `backup CS/v1.37-ultra-realiste/public/models/coach_female_manga_masks.png` | BACKUP | 120342 |
| `backup CS/v1.37-ultra-realiste/public/models/coach_male_manga.glb` | BACKUP | 4319588 |
| `backup CS/v1.37-ultra-realiste/public/models/coach_male_manga.meta.json` | BACKUP | 484 |
| `backup CS/v1.37-ultra-realiste/public/models/coach_male_manga_masks.png` | BACKUP | 120785 |
| `backup CS/v1.37-ultra-realiste/public/skin/skin_detail.png` | BACKUP | 2261339 |

### `anciennes-textures/`

| Chemin d'origine | Motif | Octets |
|---|---|---:|
| `public/coaches/inaya/tenues/_tex/ceinture-#121212_c.png` | TEX | 4902 |
| `public/coaches/inaya/tenues/_tex/ceinture-#121212_n.png` | TEX | 26678 |
| `public/coaches/inaya/tenues/_tex/ceinture-boxe-#17171C_c.png` | TEX | 1839 |
| `public/coaches/inaya/tenues/_tex/ceinture-boxe-#17171C_n.png` | TEX | 7717 |
| `public/coaches/inaya/tenues/_tex/ceinture-boxe-#E36414_c.png` | TEX | 11056 |
| `public/coaches/inaya/tenues/_tex/ceinture-boxe-#E36414_n.png` | TEX | 10421 |
| `public/coaches/inaya/tenues/_tex/ceinture-kick-#16181D_c.png` | TEX | 7231 |
| `public/coaches/inaya/tenues/_tex/ceinture-kick-#16181D_n.png` | TEX | 14257 |
| `public/coaches/inaya/tenues/_tex/ceinture-kick-#D6336C_c.png` | TEX | 5472 |
| `public/coaches/inaya/tenues/_tex/ceinture-kick-#D6336C_n.png` | TEX | 9703 |
| `public/coaches/inaya/tenues/_tex/ceinture-surshort-#D6336C_c.png` | TEX | 12838 |
| `public/coaches/inaya/tenues/_tex/ceinture-surshort-#D6336C_n.png` | TEX | 13790 |
| `public/coaches/inaya/tenues/_tex/ceinture-thai-#5B2A6E_c.png` | TEX | 13115 |
| `public/coaches/inaya/tenues/_tex/ceinture-thai-#5B2A6E_n.png` | TEX | 12246 |
| `public/coaches/inaya/tenues/_tex/ceinture-thai-#D6336C_c.png` | TEX | 5601 |
| `public/coaches/inaya/tenues/_tex/ceinture-thai-#D6336C_n.png` | TEX | 8875 |
| `public/coaches/inaya/tenues/_tex/ceinture-vale-tudo-#17171C_c.png` | TEX | 1839 |
| `public/coaches/inaya/tenues/_tex/ceinture-vale-tudo-#17171C_n.png` | TEX | 9407 |
| `public/coaches/inaya/tenues/_tex/ceinture-vale-tudo-#241020_c.png` | TEX | 5925 |
| `public/coaches/inaya/tenues/_tex/ceinture-vale-tudo-#241020_n.png` | TEX | 13394 |
| `public/coaches/inaya/tenues/_tex/ceinture-vale-tudo-#D6336C_c.png` | TEX | 6190 |
| `public/coaches/inaya/tenues/_tex/ceinture-vale-tudo-#D6336C_n.png` | TEX | 12990 |
| `public/coaches/inaya/tenues/_tex/chaussure-v2-#F4F4F5_n.png` | TEX | 82563 |
| `public/coaches/inaya/tenues/_tex/col-#1B3F8B-bjj_c.png` | TEX | 10871 |
| `public/coaches/inaya/tenues/_tex/col-#1B3F8B-bjj_n.png` | TEX | 25013 |
| `public/coaches/inaya/tenues/_tex/col-#1B3F8B-judo_c.png` | TEX | 17139 |
| `public/coaches/inaya/tenues/_tex/col-#1B3F8B-judo_n.png` | TEX | 24185 |
| `public/coaches/inaya/tenues/_tex/cordon-#D6336C_n.png` | TEX | 6103 |
| `public/coaches/inaya/tenues/_tex/cordon-#E36414_n.png` | TEX | 6103 |
| `public/coaches/inaya/tenues/_tex/cuir-gant-boxe_n.png` | TEX | 368999 |
| `public/coaches/inaya/tenues/_tex/cuir-gant-thai_n.png` | TEX | 369840 |
| `public/coaches/inaya/tenues/_tex/elastique-#D6336C_n.png` | TEX | 5922 |
| `public/coaches/inaya/tenues/_tex/gant-mma-#17171C_n.png` | TEX | 82046 |
| `public/coaches/inaya/tenues/_tex/gant-mma-#5B2A6E_n.png` | TEX | 82234 |
| `public/coaches/inaya/tenues/_tex/gi-#1B3F8B-bjj_c.png` | TEX | 140975 |
| `public/coaches/inaya/tenues/_tex/gi-#1B3F8B-bjj_n.png` | TEX | 193123 |
| `public/coaches/inaya/tenues/_tex/gi-#1B3F8B-judo_c.png` | TEX | 119021 |
| `public/coaches/inaya/tenues/_tex/gi-#1B3F8B-judo_n.png` | TEX | 206136 |
| `public/coaches/inaya/tenues/_tex/haut-brassiere-#16181D_n.png` | TEX | 265509 |
| `public/coaches/inaya/tenues/_tex/haut-brassiere-#3A1730_n.png` | TEX | 265509 |
| `public/coaches/inaya/tenues/_tex/haut-brassiere-#5B2A6E_n.png` | TEX | 265509 |
| `public/coaches/inaya/tenues/_tex/haut-brassiere-#F4F4F5_n.png` | TEX | 265509 |
| `public/coaches/inaya/tenues/_tex/haut-crop-#16181D_n.png` | TEX | 265509 |
| `public/coaches/inaya/tenues/_tex/haut-crop-#17171C_n.png` | TEX | 265509 |
| `public/coaches/inaya/tenues/_tex/haut-crop-#3A1730_n.png` | TEX | 265509 |
| `public/coaches/inaya/tenues/_tex/haut-crop-#5B2A6E_n.png` | TEX | 265509 |
| `public/coaches/inaya/tenues/_tex/haut-crop-#D6336C_n.png` | TEX | 265509 |
| `public/coaches/inaya/tenues/_tex/haut-crop-#F4F4F5_n.png` | TEX | 265509 |
| `public/coaches/inaya/tenues/_tex/haut-rash-court-#16181D_n.png` | TEX | 274450 |
| `public/coaches/inaya/tenues/_tex/haut-rash-long-#5B2A6E_n.png` | TEX | 274450 |
| `public/coaches/inaya/tenues/_tex/haut-rash-long-#D6336C_n.png` | TEX | 274450 |
| `public/coaches/inaya/tenues/_tex/liseré-#17171C_n.png` | TEX | 12319 |
| `public/coaches/inaya/tenues/_tex/liseré-#5B2A6E_n.png` | TEX | 18270 |
| `public/coaches/inaya/tenues/_tex/liseré-#D6336C_n.png` | TEX | 18270 |
| `public/coaches/inaya/tenues/_tex/liseré-#E36414_n.png` | TEX | 13079 |
| `public/coaches/inaya/tenues/_tex/pantalon-#16181D-nogi_n.png` | TEX | 274450 |
| `public/coaches/inaya/tenues/_tex/pantalon-#1B3F8B-bjj_c.png` | TEX | 45725 |
| `public/coaches/inaya/tenues/_tex/pantalon-#1B3F8B-bjj_n.png` | TEX | 32167 |
| `public/coaches/inaya/tenues/_tex/pantalon-#1B3F8B-judo_c.png` | TEX | 51195 |
| `public/coaches/inaya/tenues/_tex/pantalon-#1B3F8B-judo_n.png` | TEX | 33384 |
| `public/coaches/inaya/tenues/_tex/paume-mma-#D6336C_n.png` | TEX | 78589 |
| `public/coaches/inaya/tenues/_tex/paume-mma-#E36414_n.png` | TEX | 78357 |
| `public/coaches/inaya/tenues/_tex/protection-#16181D_n.png` | TEX | 85358 |
| `public/coaches/inaya/tenues/_tex/protection-mma-#17171C_n.png` | TEX | 5602 |
| `public/coaches/inaya/tenues/_tex/sangle-mma-#D6336C_n.png` | TEX | 4228 |
| `public/coaches/inaya/tenues/_tex/sangle-mma-#E36414_n.png` | TEX | 4228 |
| `public/coaches/inaya/tenues/_tex/short-boxe-#5B2A6E_n.png` | TEX | 23715 |
| `public/coaches/inaya/tenues/_tex/short-boxe-#D6336C_n.png` | TEX | 23715 |
| `public/coaches/inaya/tenues/_tex/short-kick-#17171C_n.png` | TEX | 38593 |
| `public/coaches/inaya/tenues/_tex/short-kick-#E36414_n.png` | TEX | 38593 |
| `public/coaches/inaya/tenues/_tex/short-surshort-#17171C_n.png` | TEX | 43927 |
| `public/coaches/inaya/tenues/_tex/short-thai-#F4F4F5_n.png` | TEX | 23872 |
| `public/coaches/inaya/tenues/_tex/short-vale-tudo-#17171C_n.png` | TEX | 305312 |
| `public/coaches/inaya/tenues/_tex/short-vale-tudo-#3A1730_n.png` | TEX | 305312 |
| `public/coaches/inaya/tenues/_tex/velcro-#17171C_n.png` | TEX | 6064 |
| `public/coaches/inaya/tenues/_tex/velcro-#E36414_n.png` | TEX | 6064 |
| `public/coaches/kanya/tenues/_tex/bandage-#17181B_n.png` | TEX | 4569 |
| `public/coaches/kanya/tenues/_tex/bandage-#A3121F_n.png` | TEX | 4569 |
| `public/coaches/kanya/tenues/_tex/ceinture-#121212_c.png` | TEX | 5446 |
| `public/coaches/kanya/tenues/_tex/ceinture-#121212_n.png` | TEX | 28025 |
| `public/coaches/kanya/tenues/_tex/ceinture-boxe-#C9A23A_c.png` | TEX | 5281 |
| `public/coaches/kanya/tenues/_tex/ceinture-boxe-#C9A23A_n.png` | TEX | 8079 |
| `public/coaches/kanya/tenues/_tex/ceinture-kick-#B3122A_c.png` | TEX | 5688 |
| `public/coaches/kanya/tenues/_tex/ceinture-kick-#B3122A_n.png` | TEX | 10065 |
| `public/coaches/kanya/tenues/_tex/ceinture-surshort-#D4AF37_c.png` | TEX | 4424 |
| `public/coaches/kanya/tenues/_tex/ceinture-surshort-#D4AF37_n.png` | TEX | 12439 |
| `public/coaches/kanya/tenues/_tex/ceinture-thai-#121316_c.png` | TEX | 3332 |
| `public/coaches/kanya/tenues/_tex/ceinture-thai-#121316_n.png` | TEX | 8390 |
| `public/coaches/kanya/tenues/_tex/ceinture-thai-#B08A2E_c.png` | TEX | 4843 |
| `public/coaches/kanya/tenues/_tex/ceinture-thai-#B08A2E_n.png` | TEX | 8079 |
| `public/coaches/kanya/tenues/_tex/ceinture-thai-#B3122A_c.png` | TEX | 4629 |
| `public/coaches/kanya/tenues/_tex/ceinture-thai-#B3122A_n.png` | TEX | 6614 |
| `public/coaches/kanya/tenues/_tex/ceinture-vale-tudo-#121316_c.png` | TEX | 3058 |
| `public/coaches/kanya/tenues/_tex/ceinture-vale-tudo-#121316_n.png` | TEX | 10951 |
| `public/coaches/kanya/tenues/_tex/ceinture-vale-tudo-#141519_c.png` | TEX | 4814 |
| `public/coaches/kanya/tenues/_tex/ceinture-vale-tudo-#141519_n.png` | TEX | 11464 |
| `public/coaches/kanya/tenues/_tex/chaussure-v2-#141519_n.png` | TEX | 82886 |
| `public/coaches/kanya/tenues/_tex/chaussure-v2-#F4F4F5_n.png` | TEX | 82925 |
| `public/coaches/kanya/tenues/_tex/chevillere-#16181D_n.png` | TEX | 5964 |
| `public/coaches/kanya/tenues/_tex/col-#141519-bjj_c.png` | TEX | 4729 |
| `public/coaches/kanya/tenues/_tex/col-#141519-bjj_n.png` | TEX | 24126 |
| `public/coaches/kanya/tenues/_tex/col-#F7F6F2-judo_c.png` | TEX | 24133 |
| `public/coaches/kanya/tenues/_tex/col-#F7F6F2-judo_n.png` | TEX | 24253 |
| `public/coaches/kanya/tenues/_tex/cordon-#B3122A_n.png` | TEX | 6465 |
| `public/coaches/kanya/tenues/_tex/cordon-#EFECE4_n.png` | TEX | 6465 |
| `public/coaches/kanya/tenues/_tex/cuir-gant-boxe_n.png` | TEX | 369469 |
| `public/coaches/kanya/tenues/_tex/elastique-#141519_n.png` | TEX | 6284 |
| `public/coaches/kanya/tenues/_tex/elastique-#B08A2E_n.png` | TEX | 6284 |
| `public/coaches/kanya/tenues/_tex/elastique-#B3122A_n.png` | TEX | 6284 |
| `public/coaches/kanya/tenues/_tex/filet-compression-#B08A2E_n.png` | TEX | 228131 |
| `public/coaches/kanya/tenues/_tex/gant-mma-#141519_n.png` | TEX | 82342 |
| `public/coaches/kanya/tenues/_tex/genouillere-#141519_n.png` | TEX | 5964 |
| `public/coaches/kanya/tenues/_tex/gi-#141519-bjj_c.png` | TEX | 117559 |
| `public/coaches/kanya/tenues/_tex/gi-#141519-bjj_n.png` | TEX | 193994 |
| `public/coaches/kanya/tenues/_tex/gi-#F7F6F2-judo_c.png` | TEX | 157238 |
| `public/coaches/kanya/tenues/_tex/gi-#F7F6F2-judo_n.png` | TEX | 207048 |
| `public/coaches/kanya/tenues/_tex/haut-brassiere-#121316_n.png` | TEX | 265871 |
| `public/coaches/kanya/tenues/_tex/haut-crop-#121316_n.png` | TEX | 265871 |
| `public/coaches/kanya/tenues/_tex/haut-crop-#141519_n.png` | TEX | 265871 |
| `public/coaches/kanya/tenues/_tex/haut-crop-#B3122A_n.png` | TEX | 265871 |
| `public/coaches/kanya/tenues/_tex/haut-rash-court-#16181D_n.png` | TEX | 241763 |
| `public/coaches/kanya/tenues/_tex/haut-rash-long-#141519_n.png` | TEX | 241763 |
| `public/coaches/kanya/tenues/_tex/liseré-#141519_n.png` | TEX | 8613 |
| `public/coaches/kanya/tenues/_tex/liseré-#B08A2E_n.png` | TEX | 16428 |
| `public/coaches/kanya/tenues/_tex/liseré-#C9A23A_n.png` | TEX | 13441 |
| `public/coaches/kanya/tenues/_tex/liseré-#D4AF37_n.png` | TEX | 13715 |
| `public/coaches/kanya/tenues/_tex/liseré-short-#B08A2E_n.png` | TEX | 24515 |
| `public/coaches/kanya/tenues/_tex/liseré-short-#C9A23A_n.png` | TEX | 24515 |
| `public/coaches/kanya/tenues/_tex/panneau-compression-#B08A2E_n.png` | TEX | 241763 |
| `public/coaches/kanya/tenues/_tex/panneau-short-#B08A2E_n.png` | TEX | 24395 |
| `public/coaches/kanya/tenues/_tex/panneau-short-#B3122A_n.png` | TEX | 20280 |
| `public/coaches/kanya/tenues/_tex/panneau-short-#C9A23A_n.png` | TEX | 24395 |
| `public/coaches/kanya/tenues/_tex/pantalon-#141519-bjj_c.png` | TEX | 52712 |
| `public/coaches/kanya/tenues/_tex/pantalon-#141519-bjj_n.png` | TEX | 31301 |
| `public/coaches/kanya/tenues/_tex/pantalon-#16181D-nogi_n.png` | TEX | 274812 |
| `public/coaches/kanya/tenues/_tex/pantalon-#F7F6F2-judo_c.png` | TEX | 36003 |
| `public/coaches/kanya/tenues/_tex/pantalon-#F7F6F2-judo_n.png` | TEX | 25343 |
| `public/coaches/kanya/tenues/_tex/paume-mma-#C9A23A_n.png` | TEX | 78830 |
| `public/coaches/kanya/tenues/_tex/protection-#16181D_n.png` | TEX | 85764 |
| `public/coaches/kanya/tenues/_tex/protection-mma-#141519_n.png` | TEX | 5964 |
| `public/coaches/kanya/tenues/_tex/sangle-mma-#141519_n.png` | TEX | 4590 |
| `public/coaches/kanya/tenues/_tex/sangle-mma-#F4F4F5_n.png` | TEX | 4590 |
| `public/coaches/kanya/tenues/_tex/short-boxe-#141519_n.png` | TEX | 24077 |
| `public/coaches/kanya/tenues/_tex/short-kick-#141519_n.png` | TEX | 38955 |
| `public/coaches/kanya/tenues/_tex/short-surshort-#141519_n.png` | TEX | 45848 |
| `public/coaches/kanya/tenues/_tex/short-thai-#121316_n.png` | TEX | 24077 |
| `public/coaches/kanya/tenues/_tex/short-vale-tudo-#121316_n.png` | TEX | 254317 |
| `public/coaches/kanya/tenues/_tex/short-vale-tudo-#141519_n.png` | TEX | 254317 |
| `public/coaches/kanya/tenues/_tex/velcro-#141519_n.png` | TEX | 6426 |
| `public/coaches/mma-amara/tenues/_tex/ceinture-#121212_c.png` | TEX | 5050 |
| `public/coaches/mma-amara/tenues/_tex/ceinture-#121212_n.png` | TEX | 26084 |
| `public/coaches/mma-amara/tenues/_tex/ceinture-boxe-#D4AF37_c.png` | TEX | 4285 |
| `public/coaches/mma-amara/tenues/_tex/ceinture-boxe-#D4AF37_n.png` | TEX | 7717 |
| `public/coaches/mma-amara/tenues/_tex/ceinture-kick-#16181D_c.png` | TEX | 1841 |
| `public/coaches/mma-amara/tenues/_tex/ceinture-kick-#16181D_n.png` | TEX | 9703 |
| `public/coaches/mma-amara/tenues/_tex/ceinture-surshort-#D4AF37_c.png` | TEX | 14723 |
| `public/coaches/mma-amara/tenues/_tex/ceinture-surshort-#D4AF37_n.png` | TEX | 13790 |
| `public/coaches/mma-amara/tenues/_tex/ceinture-thai-#D4AF37_c.png` | TEX | 4407 |
| `public/coaches/mma-amara/tenues/_tex/ceinture-thai-#D4AF37_n.png` | TEX | 14953 |
| `public/coaches/mma-amara/tenues/_tex/ceinture-vale-tudo-#141519_c.png` | TEX | 4898 |
| `public/coaches/mma-amara/tenues/_tex/ceinture-vale-tudo-#141519_n.png` | TEX | 9407 |
| `public/coaches/mma-amara/tenues/_tex/ceinture-vale-tudo-#202126_c.png` | TEX | 6284 |
| `public/coaches/mma-amara/tenues/_tex/ceinture-vale-tudo-#202126_n.png` | TEX | 12990 |
| `public/coaches/mma-amara/tenues/_tex/chaussure-v2-#16181D_n.png` | TEX | 82221 |
| `public/coaches/mma-amara/tenues/_tex/chaussure-v2-#F4F4F5_n.png` | TEX | 82563 |
| `public/coaches/mma-amara/tenues/_tex/col-#EEEEEA_n.png` | TEX | 9729 |
| `public/coaches/mma-amara/tenues/_tex/col-#F2F0EA-bjj_c.png` | TEX | 18742 |
| `public/coaches/mma-amara/tenues/_tex/col-#F2F0EA-bjj_n.png` | TEX | 22487 |
| `public/coaches/mma-amara/tenues/_tex/col-#F7F6F2-judo_c.png` | TEX | 23322 |
| `public/coaches/mma-amara/tenues/_tex/col-#F7F6F2-judo_n.png` | TEX | 22880 |
| `public/coaches/mma-amara/tenues/_tex/cordon-#B3122A_n.png` | TEX | 6103 |
| `public/coaches/mma-amara/tenues/_tex/cuir-gant-boxe_n.png` | TEX | 368999 |
| `public/coaches/mma-amara/tenues/_tex/cuir-gant-thai_n.png` | TEX | 369840 |
| `public/coaches/mma-amara/tenues/_tex/elastique-#2B2D33_n.png` | TEX | 5922 |
| `public/coaches/mma-amara/tenues/_tex/gant-mma-#16181D_n.png` | TEX | 82046 |
| `public/coaches/mma-amara/tenues/_tex/gi-#F2F0EA-bjj_c.png` | TEX | 177228 |
| `public/coaches/mma-amara/tenues/_tex/gi-#F2F0EA-bjj_n.png` | TEX | 193730 |
| `public/coaches/mma-amara/tenues/_tex/gi-#F7F6F2-judo_c.png` | TEX | 152821 |
| `public/coaches/mma-amara/tenues/_tex/gi-#F7F6F2-judo_n.png` | TEX | 206731 |
| `public/coaches/mma-amara/tenues/_tex/haut-brassiere-#141519_n.png` | TEX | 265509 |
| `public/coaches/mma-amara/tenues/_tex/haut-brassiere-#16181D_n.png` | TEX | 265509 |
| `public/coaches/mma-amara/tenues/_tex/haut-brassiere-#1D2B57_n.png` | TEX | 265509 |
| `public/coaches/mma-amara/tenues/_tex/haut-rash-court-#16181D_n.png` | TEX | 274450 |
| `public/coaches/mma-amara/tenues/_tex/haut-rash-long-#B3122A_n.png` | TEX | 274450 |
| `public/coaches/mma-amara/tenues/_tex/haut-rash-long-#EEEEEA_n.png` | TEX | 274450 |
| `public/coaches/mma-amara/tenues/_tex/liseré-#B3122A_n.png` | TEX | 8251 |
| `public/coaches/mma-amara/tenues/_tex/liseré-#D4AF37_n.png` | TEX | 12319 |
| `public/coaches/mma-amara/tenues/_tex/noeud-#111214_n.png` | TEX | 26206 |
| `public/coaches/mma-amara/tenues/_tex/pantalon-#16181D-nogi_n.png` | TEX | 274450 |
| `public/coaches/mma-amara/tenues/_tex/pantalon-#17181C-arbitre_c.png` | TEX | 57367 |
| `public/coaches/mma-amara/tenues/_tex/pantalon-#17181C-arbitre_n.png` | TEX | 28774 |
| `public/coaches/mma-amara/tenues/_tex/pantalon-#F2F0EA-bjj_c.png` | TEX | 65984 |
| `public/coaches/mma-amara/tenues/_tex/pantalon-#F2F0EA-bjj_n.png` | TEX | 28225 |
| `public/coaches/mma-amara/tenues/_tex/pantalon-#F7F6F2-judo_c.png` | TEX | 63154 |
| `public/coaches/mma-amara/tenues/_tex/pantalon-#F7F6F2-judo_n.png` | TEX | 28845 |
| `public/coaches/mma-amara/tenues/_tex/protection-#16181D_n.png` | TEX | 85402 |
| `public/coaches/mma-amara/tenues/_tex/protection-mma-#16181D_n.png` | TEX | 5602 |
| `public/coaches/mma-amara/tenues/_tex/sangle-mma-#2B2D33_n.png` | TEX | 4228 |
| `public/coaches/mma-amara/tenues/_tex/short-boxe-#16181D_n.png` | TEX | 23715 |
| `public/coaches/mma-amara/tenues/_tex/short-kick-#B3122A_n.png` | TEX | 38593 |
| `public/coaches/mma-amara/tenues/_tex/short-surshort-#141519_n.png` | TEX | 43927 |
| `public/coaches/mma-amara/tenues/_tex/short-thai-#1D2B57_n.png` | TEX | 24445 |
| `public/coaches/mma-amara/tenues/_tex/short-vale-tudo-#141519_n.png` | TEX | 305312 |
| `public/coaches/mma-amara/tenues/_tex/velcro-#B3122A_n.png` | TEX | 6064 |
| `public/coaches/mma-kadir/tenues/_tex/ceinture-#121212_c.png` | TEX | 5150 |
| `public/coaches/mma-kadir/tenues/_tex/ceinture-#121212_n.png` | TEX | 27365 |
| `public/coaches/mma-kadir/tenues/_tex/ceinture-boxe-#D4AF37_c.png` | TEX | 4285 |
| `public/coaches/mma-kadir/tenues/_tex/ceinture-boxe-#D4AF37_n.png` | TEX | 7717 |
| `public/coaches/mma-kadir/tenues/_tex/ceinture-compression-#B3122A_c.png` | TEX | 4654 |
| `public/coaches/mma-kadir/tenues/_tex/ceinture-compression-#B3122A_n.png` | TEX | 11362 |
| `public/coaches/mma-kadir/tenues/_tex/ceinture-kick-#B3122A_c.png` | TEX | 4317 |
| `public/coaches/mma-kadir/tenues/_tex/ceinture-kick-#B3122A_n.png` | TEX | 10623 |
| `public/coaches/mma-kadir/tenues/_tex/ceinture-mma-#B3122A_c.png` | TEX | 5277 |
| `public/coaches/mma-kadir/tenues/_tex/ceinture-mma-#B3122A_n.png` | TEX | 13570 |
| `public/coaches/mma-kadir/tenues/_tex/ceinture-thai-#F4F4F5_c.png` | TEX | 7248 |
| `public/coaches/mma-kadir/tenues/_tex/ceinture-thai-#F4F4F5_n.png` | TEX | 8216 |
| `public/coaches/mma-kadir/tenues/_tex/ceinture-vale-tudo-#1A1B1F_c.png` | TEX | 2652 |
| `public/coaches/mma-kadir/tenues/_tex/ceinture-vale-tudo-#1A1B1F_n.png` | TEX | 9407 |
| `public/coaches/mma-kadir/tenues/_tex/chaussure-v2-#16181D_n.png` | TEX | 82578 |
| `public/coaches/mma-kadir/tenues/_tex/col-#1E2A44-bjj_c.png` | TEX | 11386 |
| `public/coaches/mma-kadir/tenues/_tex/col-#1E2A44-bjj_n.png` | TEX | 23172 |
| `public/coaches/mma-kadir/tenues/_tex/col-#EEEEEA_n.png` | TEX | 9163 |
| `public/coaches/mma-kadir/tenues/_tex/col-#F7F6F2-judo_c.png` | TEX | 23565 |
| `public/coaches/mma-kadir/tenues/_tex/col-#F7F6F2-judo_n.png` | TEX | 24390 |
| `public/coaches/mma-kadir/tenues/_tex/cordon-#D4AF37_n.png` | TEX | 6103 |
| `public/coaches/mma-kadir/tenues/_tex/costume-#1C2230_c.png` | TEX | 52763 |
| `public/coaches/mma-kadir/tenues/_tex/costume-#1C2230_n.png` | TEX | 32549 |
| `public/coaches/mma-kadir/tenues/_tex/cravate-#5A1A22_n.png` | TEX | 21801 |
| `public/coaches/mma-kadir/tenues/_tex/cuir-gant-boxe_n.png` | TEX | 369239 |
| `public/coaches/mma-kadir/tenues/_tex/cuir-gant-thai_n.png` | TEX | 370093 |
| `public/coaches/mma-kadir/tenues/_tex/elastique-#E9E9E6_n.png` | TEX | 5922 |
| `public/coaches/mma-kadir/tenues/_tex/gant-mma-#16181D_n.png` | TEX | 82234 |
| `public/coaches/mma-kadir/tenues/_tex/gi-#1E2A44-bjj_c.png` | TEX | 113664 |
| `public/coaches/mma-kadir/tenues/_tex/gi-#1E2A44-bjj_n.png` | TEX | 193455 |
| `public/coaches/mma-kadir/tenues/_tex/gi-#F7F6F2-judo_c.png` | TEX | 156630 |
| `public/coaches/mma-kadir/tenues/_tex/gi-#F7F6F2-judo_n.png` | TEX | 206688 |
| `public/coaches/mma-kadir/tenues/_tex/haut-rash-long-#1F2937_n.png` | TEX | 274450 |
| `public/coaches/mma-kadir/tenues/_tex/pantalon-#1C2230-arbitre_c.png` | TEX | 68541 |
| `public/coaches/mma-kadir/tenues/_tex/pantalon-#1C2230-arbitre_n.png` | TEX | 31141 |
| `public/coaches/mma-kadir/tenues/_tex/pantalon-#1E2A44-bjj_c.png` | TEX | 47792 |
| `public/coaches/mma-kadir/tenues/_tex/pantalon-#1E2A44-bjj_n.png` | TEX | 30638 |
| `public/coaches/mma-kadir/tenues/_tex/pantalon-#F7F6F2-judo_c.png` | TEX | 77348 |
| `public/coaches/mma-kadir/tenues/_tex/pantalon-#F7F6F2-judo_n.png` | TEX | 31509 |
| `public/coaches/mma-kadir/tenues/_tex/paume-mma-#E9E9E6_n.png` | TEX | 78357 |
| `public/coaches/mma-kadir/tenues/_tex/plastron-#EEEEEA_n.png` | TEX | 9729 |
| `public/coaches/mma-kadir/tenues/_tex/protection-#F4F4F5_n.png` | TEX | 85392 |
| `public/coaches/mma-kadir/tenues/_tex/protection-mma-#16181D_n.png` | TEX | 5602 |
| `public/coaches/mma-kadir/tenues/_tex/sangle-mma-#E9E9E6_n.png` | TEX | 4228 |
| `public/coaches/mma-kadir/tenues/_tex/short-boxe-#B3122A_n.png` | TEX | 23715 |
| `public/coaches/mma-kadir/tenues/_tex/short-compression-#16181D_n.png` | TEX | 274450 |
| `public/coaches/mma-kadir/tenues/_tex/short-kick-#16181D_n.png` | TEX | 31372 |
| `public/coaches/mma-kadir/tenues/_tex/short-mma-#16181D_n.png` | TEX | 16772 |
| `public/coaches/mma-kadir/tenues/_tex/short-thai-#C8102E_n.png` | TEX | 23969 |
| `public/coaches/mma-kadir/tenues/_tex/short-vale-tudo-#3A3D43_n.png` | TEX | 305312 |
| `public/coaches/mma-kadir/tenues/_tex/velcro-#B3122A_n.png` | TEX | 6064 |
| `public/coaches/nael/tenues/_tex/ceinture-#121212_c.png` | TEX | 5150 |
| `public/coaches/nael/tenues/_tex/ceinture-#121212_n.png` | TEX | 27365 |
| `public/coaches/nael/tenues/_tex/ceinture-boxe-#1D4E89_c.png` | TEX | 3524 |
| `public/coaches/nael/tenues/_tex/ceinture-boxe-#1D4E89_n.png` | TEX | 7717 |
| `public/coaches/nael/tenues/_tex/ceinture-compression-#B3122A_c.png` | TEX | 4654 |
| `public/coaches/nael/tenues/_tex/ceinture-compression-#B3122A_n.png` | TEX | 11362 |
| `public/coaches/nael/tenues/_tex/ceinture-kick-#F4F4F5_c.png` | TEX | 6147 |
| `public/coaches/nael/tenues/_tex/ceinture-kick-#F4F4F5_n.png` | TEX | 10623 |
| `public/coaches/nael/tenues/_tex/ceinture-mma-#B3122A_c.png` | TEX | 5277 |
| `public/coaches/nael/tenues/_tex/ceinture-mma-#B3122A_n.png` | TEX | 13570 |
| `public/coaches/nael/tenues/_tex/ceinture-thai-#D4AF37_c.png` | TEX | 4888 |
| `public/coaches/nael/tenues/_tex/ceinture-thai-#D4AF37_n.png` | TEX | 8216 |
| `public/coaches/nael/tenues/_tex/ceinture-vale-tudo-#101521_c.png` | TEX | 5208 |
| `public/coaches/nael/tenues/_tex/ceinture-vale-tudo-#101521_n.png` | TEX | 9407 |
| `public/coaches/nael/tenues/_tex/chaussure-v2-#16181D_n.png` | TEX | 82578 |
| `public/coaches/nael/tenues/_tex/col-#17181C-bjj_c.png` | TEX | 5276 |
| `public/coaches/nael/tenues/_tex/col-#17181C-bjj_n.png` | TEX | 23172 |
| `public/coaches/nael/tenues/_tex/col-#1B3F8B-judo_c.png` | TEX | 16991 |
| `public/coaches/nael/tenues/_tex/col-#1B3F8B-judo_n.png` | TEX | 24390 |
| `public/coaches/nael/tenues/_tex/cordon-#F4F4F5_n.png` | TEX | 6103 |
| `public/coaches/nael/tenues/_tex/cuir-gant-boxe_n.png` | TEX | 369239 |
| `public/coaches/nael/tenues/_tex/cuir-gant-thai_n.png` | TEX | 370093 |
| `public/coaches/nael/tenues/_tex/elastique-#F4F4F5_n.png` | TEX | 5922 |
| `public/coaches/nael/tenues/_tex/gant-mma-#1D4E89_n.png` | TEX | 82234 |
| `public/coaches/nael/tenues/_tex/gi-#17181C-bjj_c.png` | TEX | 121211 |
| `public/coaches/nael/tenues/_tex/gi-#17181C-bjj_n.png` | TEX | 193455 |
| `public/coaches/nael/tenues/_tex/gi-#1B3F8B-judo_c.png` | TEX | 120051 |
| `public/coaches/nael/tenues/_tex/gi-#1B3F8B-judo_n.png` | TEX | 206688 |
| `public/coaches/nael/tenues/_tex/haut-rash-long-#1D4E89_n.png` | TEX | 274450 |
| `public/coaches/nael/tenues/_tex/pantalon-#17181C-bjj_c.png` | TEX | 57983 |
| `public/coaches/nael/tenues/_tex/pantalon-#17181C-bjj_n.png` | TEX | 30638 |
| `public/coaches/nael/tenues/_tex/pantalon-#1B3F8B-judo_c.png` | TEX | 49833 |
| `public/coaches/nael/tenues/_tex/pantalon-#1B3F8B-judo_n.png` | TEX | 31509 |
| `public/coaches/nael/tenues/_tex/paume-mma-#F4F4F5_n.png` | TEX | 78357 |
| `public/coaches/nael/tenues/_tex/protection-#F4F4F5_n.png` | TEX | 85392 |
| `public/coaches/nael/tenues/_tex/protection-mma-#1D4E89_n.png` | TEX | 5602 |
| `public/coaches/nael/tenues/_tex/sangle-mma-#F4F4F5_n.png` | TEX | 4228 |
| `public/coaches/nael/tenues/_tex/short-boxe-#F4F4F5_n.png` | TEX | 23715 |
| `public/coaches/nael/tenues/_tex/short-compression-#16181D_n.png` | TEX | 274450 |
| `public/coaches/nael/tenues/_tex/short-kick-#1D4E89_n.png` | TEX | 31372 |
| `public/coaches/nael/tenues/_tex/short-mma-#16181D_n.png` | TEX | 16772 |
| `public/coaches/nael/tenues/_tex/short-thai-#0F6B57_n.png` | TEX | 23969 |
| `public/coaches/nael/tenues/_tex/short-vale-tudo-#24344D_n.png` | TEX | 305312 |
| `public/coaches/nael/tenues/_tex/velcro-#F4F4F5_n.png` | TEX | 6064 |
| `public/coaches/victor/tenues/_tex/ceinture-#121212_c.png` | TEX | 5488 |
| `public/coaches/victor/tenues/_tex/ceinture-#121212_n.png` | TEX | 26452 |
| `public/coaches/victor/tenues/_tex/ceinture-#1D1F1A_c.png` | TEX | 12934 |
| `public/coaches/victor/tenues/_tex/ceinture-#1D1F1A_n.png` | TEX | 26452 |
| `public/coaches/victor/tenues/_tex/ceinture-boxe-#141519_c.png` | TEX | 4931 |
| `public/coaches/victor/tenues/_tex/ceinture-boxe-#141519_n.png` | TEX | 8079 |
| `public/coaches/victor/tenues/_tex/ceinture-boxe-#B3122A_c.png` | TEX | 5183 |
| `public/coaches/victor/tenues/_tex/ceinture-boxe-#B3122A_n.png` | TEX | 7727 |
| `public/coaches/victor/tenues/_tex/ceinture-mma-#2A2C31_c.png` | TEX | 2201 |
| `public/coaches/victor/tenues/_tex/ceinture-mma-#2A2C31_n.png` | TEX | 10261 |
| `public/coaches/victor/tenues/_tex/ceinture-thai-#141519_c.png` | TEX | 4931 |
| `public/coaches/victor/tenues/_tex/ceinture-thai-#141519_n.png` | TEX | 8079 |
| `public/coaches/victor/tenues/_tex/ceinture-thai-#C9CCD1_c.png` | TEX | 4053 |
| `public/coaches/victor/tenues/_tex/ceinture-thai-#C9CCD1_n.png` | TEX | 11916 |
| `public/coaches/victor/tenues/_tex/ceinture-vale-tudo-#3A3D43_c.png` | TEX | 4303 |
| `public/coaches/victor/tenues/_tex/ceinture-vale-tudo-#3A3D43_n.png` | TEX | 12793 |
| `public/coaches/victor/tenues/_tex/chevillere-#16181D_n.png` | TEX | 5964 |
| `public/coaches/victor/tenues/_tex/col-#1C2541-bjj_c.png` | TEX | 10022 |
| `public/coaches/victor/tenues/_tex/col-#1C2541-bjj_n.png` | TEX | 24768 |
| `public/coaches/victor/tenues/_tex/col-#232A3A-bjj_c.png` | TEX | 9701 |
| `public/coaches/victor/tenues/_tex/col-#232A3A-bjj_n.png` | TEX | 24768 |
| `public/coaches/victor/tenues/_tex/col-#F7F6F2-judo_c.png` | TEX | 24060 |
| `public/coaches/victor/tenues/_tex/col-#F7F6F2-judo_n.png` | TEX | 24805 |
| `public/coaches/victor/tenues/_tex/cordon-#141519_n.png` | TEX | 6465 |
| `public/coaches/victor/tenues/_tex/cordon-#E4E4E0_n.png` | TEX | 6465 |
| `public/coaches/victor/tenues/_tex/cuir-gant-boxe_n.png` | TEX | 369511 |
| `public/coaches/victor/tenues/_tex/cuir-gant-thai_n.png` | TEX | 369738 |
| `public/coaches/victor/tenues/_tex/elastique-#141519_n.png` | TEX | 6284 |
| `public/coaches/victor/tenues/_tex/elastique-#16181D_n.png` | TEX | 6284 |
| `public/coaches/victor/tenues/_tex/gant-mma-#141519_n.png` | TEX | 82552 |
| `public/coaches/victor/tenues/_tex/gi-#1C2541-bjj_c.png` | TEX | 118889 |
| `public/coaches/victor/tenues/_tex/gi-#1C2541-bjj_n.png` | TEX | 193722 |
| `public/coaches/victor/tenues/_tex/gi-#232A3A-bjj_c.png` | TEX | 97373 |
| `public/coaches/victor/tenues/_tex/gi-#232A3A-bjj_n.png` | TEX | 193722 |
| `public/coaches/victor/tenues/_tex/gi-#F7F6F2-judo_c.png` | TEX | 157445 |
| `public/coaches/victor/tenues/_tex/gi-#F7F6F2-judo_n.png` | TEX | 206279 |
| `public/coaches/victor/tenues/_tex/haut-rash-court-#141519_n.png` | TEX | 241763 |
| `public/coaches/victor/tenues/_tex/liseré-short-#7E8187_n.png` | TEX | 24515 |
| `public/coaches/victor/tenues/_tex/liseré-short-#8E9196_n.png` | TEX | 20280 |
| `public/coaches/victor/tenues/_tex/liseré-short-#C9CCD1_n.png` | TEX | 20280 |
| `public/coaches/victor/tenues/_tex/liseré-short-#D3D5D9_n.png` | TEX | 25191 |
| `public/coaches/victor/tenues/_tex/panneau-short-#141519_n.png` | TEX | 24395 |
| `public/coaches/victor/tenues/_tex/panneau-short-#AEB2B8_n.png` | TEX | 24446 |
| `public/coaches/victor/tenues/_tex/panneau-short-#B3122A_n.png` | TEX | 24287 |
| `public/coaches/victor/tenues/_tex/panneau-short-#C9CCD1_n.png` | TEX | 24287 |
| `public/coaches/victor/tenues/_tex/pantalon-#16181D-nogi_n.png` | TEX | 274812 |
| `public/coaches/victor/tenues/_tex/pantalon-#1C2541-bjj_c.png` | TEX | 40330 |
| `public/coaches/victor/tenues/_tex/pantalon-#1C2541-bjj_n.png` | TEX | 33675 |
| `public/coaches/victor/tenues/_tex/pantalon-#232A3A-bjj_c.png` | TEX | 53171 |
| `public/coaches/victor/tenues/_tex/pantalon-#232A3A-bjj_n.png` | TEX | 33675 |
| `public/coaches/victor/tenues/_tex/pantalon-#F7F6F2-judo_c.png` | TEX | 76043 |
| `public/coaches/victor/tenues/_tex/pantalon-#F7F6F2-judo_n.png` | TEX | 29099 |
| `public/coaches/victor/tenues/_tex/paume-mma-#3A3D43_n.png` | TEX | 78847 |
| `public/coaches/victor/tenues/_tex/protection-#16181D_n.png` | TEX | 86135 |
| `public/coaches/victor/tenues/_tex/protection-mma-#141519_n.png` | TEX | 5964 |
| `public/coaches/victor/tenues/_tex/sangle-mma-#141519_n.png` | TEX | 4590 |
| `public/coaches/victor/tenues/_tex/short-boxe-#141519_n.png` | TEX | 24077 |
| `public/coaches/victor/tenues/_tex/short-mma-#16181D_n.png` | TEX | 7844 |
| `public/coaches/victor/tenues/_tex/short-thai-#141519_n.png` | TEX | 24077 |
| `public/coaches/victor/tenues/_tex/short-thai-#1A0B0D_n.png` | TEX | 25144 |
| `public/coaches/victor/tenues/_tex/short-thai-#2A1416_n.png` | TEX | 24077 |
| `public/coaches/victor/tenues/_tex/short-vale-tudo-#1A1B1F_n.png` | TEX | 254317 |
| `public/coaches/victor/tenues/_tex/velcro-#2A2C31_n.png` | TEX | 6426 |

### `anciens-scripts/`

| Chemin d'origine | Motif | Octets |
|---|---|---:|
| `backup CS/v1.37-ultra-realiste/tools/generator/README.md` | BACKUP | 3526 |
| `backup CS/v1.37-ultra-realiste/tools/generator/anatomy.py` | BACKUP | 7174 |
| `backup CS/v1.37-ultra-realiste/tools/generator/build.py` | BACKUP | 33572 |
| `backup CS/v1.37-ultra-realiste/tools/generator/coaches/__pycache__/design.cpython-313.pyc` | BACKUP | 22593 |
| `backup CS/v1.37-ultra-realiste/tools/generator/coaches/__pycache__/glbmesh.cpython-313.pyc` | BACKUP | 3523 |
| `backup CS/v1.37-ultra-realiste/tools/generator/coaches/catalogue_md.py` | BACKUP | 2987 |
| `backup CS/v1.37-ultra-realiste/tools/generator/coaches/face_paint.py` | BACKUP | 10640 |
| `backup CS/v1.37-ultra-realiste/tools/generator/coaches/glbmesh.py` | BACKUP | 1529 |
| `backup CS/v1.37-ultra-realiste/tools/generator/coaches/recipes/axel.json` | BACKUP | 3089 |
| `backup CS/v1.37-ultra-realiste/tools/generator/coaches/recipes/kaila.json` | BACKUP | 2944 |
| `backup CS/v1.37-ultra-realiste/tools/generator/coaches/recipes/mma-amara.json` | BACKUP | 2087 |
| `backup CS/v1.37-ultra-realiste/tools/generator/coaches/recipes/mma-kadir.json` | BACKUP | 2701 |
| `backup CS/v1.37-ultra-realiste/tools/generator/groom/atlas.py` | BACKUP | 6195 |
| `backup CS/v1.37-ultra-realiste/tools/generator/install.py` | BACKUP | 269 |
| `backup CS/v1.37-ultra-realiste/tools/generator/makehuman/README.md` | BACKUP | 4217 |
| `backup CS/v1.37-ultra-realiste/tools/generator/makehuman/alpha_bleed.py` | BACKUP | 4492 |
| `backup CS/v1.37-ultra-realiste/tools/generator/makehuman/build_photo.py` | BACKUP | 26429 |
| `backup CS/v1.37-ultra-realiste/tools/generator/rocketbox/glove_ts.py` | BACKUP | 2371 |
| `backup CS/v1.37-ultra-realiste/tools/generator/skin/detail.py` | BACKUP | 2992 |
| `backup CS/v1.37.9-morph/scripts/dev/append-amara-clean-morph-v1379.py` | BACKUP | 4960 |
| `backup CS/v1.37.9-morph/scripts/dev/audit-amara-original-swimsuit.py` | BACKUP | 9061 |
| `backup CS/v1.37.9-morph/scripts/dev/calc-amara-surface-v1379.py` | BACKUP | 2239 |
| `backup CS/v1.37.9-morph/scripts/dev/repaint-amara-swimsuit-v1379.py` | BACKUP | 7963 |
| `backup CS/v1.37.9-morph/scripts/dev/validate-amara-clean-morph-v1379.py` | BACKUP | 2532 |
| `backup CS/v1.37.9-morph/scripts/dev/validate-amara-mma-reference-v1379.py` | BACKUP | 2663 |
| `backup CS/workflows/amara-garments-v1379.yml` | BACKUP | 1158 |
| `backup CS/workflows/amara-v1376.yml` | BACKUP | 4236 |
| `scripts/dev/check-amara-garments-v1376.py` | AMARA | 3251 |
| `scripts/dev/regenerate-amara-v1374.sh` | AMARA | 2288 |
| `scripts/dev/regenerate-amara-v1375.sh` | AMARA | 2288 |
| `scripts/dev/regenerate-amara-v1376.sh` | AMARA | 2288 |
| `scripts/dev/shot-editor-random.mjs` | EDITOR | 1865 |
| `scripts/dev/shot-groom.mjs` | GROOM | 1354 |
| `scripts/dev/shot-random.mjs` | EDITOR | 2379 |

### `anciens-prototypes/`

| Chemin d'origine | Motif | Octets |
|---|---|---:|
| `lab/groom.html` | GROOM | 347 |
| `lab/groom.tsx` | GROOM | 4724 |

### `anciennes-versions/`

| Chemin d'origine | Motif | Octets |
|---|---|---:|
| `backup CS/README.md` | BACKUP | 5742 |
| `backup CS/v1.37-ultra-realiste/docs/AUDIT_HUMANOIDES.md` | BACKUP | 6856 |
| `backup CS/v1.37-ultra-realiste/docs/COACHS_3D_REFONTE.md` | BACKUP | 14606 |
| `backup CS/v1.37-ultra-realiste/docs/captures-coachs/front-kick-avant_homme.jpg` | BACKUP | 54721 |
| `backup CS/v1.37-ultra-realiste/docs/captures-coachs/garde_femme.jpg` | BACKUP | 57274 |
| `backup CS/v1.37-ultra-realiste/docs/captures-coachs/high-kick-arriere_femme.jpg` | BACKUP | 54410 |
| `backup CS/v1.37-ultra-realiste/docs/captures-coachs/low-kick-arriere_homme.jpg` | BACKUP | 55553 |
| `backup CS/v1.37-ultra-realiste/docs/comparatif/silhouette-femme-v018.png` | BACKUP | 316725 |
| `backup CS/v1.37-ultra-realiste/docs/comparatif/silhouette-homme-v018.png` | BACKUP | 400077 |
| `backup CS/v1.37-ultra-realiste/docs/rendus-coachs.png` | BACKUP | 327923 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/coach/appGuide.ts` | BACKUP | 59623 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/domain/coaches/catalog.ts` | BACKUP | 8341 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/domain/coaches/looks.ts` | BACKUP | 4138 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/domain/coaches/motion.ts` | BACKUP | 2525 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/engine/__tests__/deformation-v1100.test.ts` | BACKUP | 10043 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/store/__tests__/settings-style.test.ts` | BACKUP | 1901 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/store/settings.ts` | BACKUP | 10546 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/three/CoachModel.tsx` | BACKUP | 17409 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/three/CoachStage.tsx` | BACKUP | 24091 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/three/StudioStage.tsx` | BACKUP | 13017 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/three/__tests__/realisme-v1100.test.ts` | BACKUP | 9944 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/three/human/__tests__/contract.test.ts` | BACKUP | 4214 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/three/human/profiles.ts` | BACKUP | 3042 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/three/photoMaterials.ts` | BACKUP | 10690 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/ui/Lab.tsx` | BACKUP | 15560 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/ui/screens/Onboarding.tsx` | BACKUP | 18295 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/ui/screens/Settings.tsx` | BACKUP | 22821 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/src/ui/training/Study.tsx` | BACKUP | 9100 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/tests/e2e/coachs-v160.spec.ts` | BACKUP | 7345 |
| `backup CS/v1.37-ultra-realiste/originaux-1.36.0/tests/e2e/moteur-lumiere.spec.ts` | BACKUP | 4476 |
| `backup CS/v1.37-ultra-realiste/src/editor/__tests__/editor.test.ts` | BACKUP | 9063 |
| `backup CS/v1.37-ultra-realiste/src/editor/random.ts` | BACKUP | 7593 |
| `backup CS/v1.37-ultra-realiste/src/editor/tattoos.ts` | BACKUP | 7790 |
| `backup CS/v1.37-ultra-realiste/src/engine/__tests__/makehuman-coaches.test.ts` | BACKUP | 5360 |
| `backup CS/v1.37-ultra-realiste/src/test/body.ts` | BACKUP | 3868 |
| `backup CS/v1.37-ultra-realiste/src/three/__tests__/customize.test.ts` | BACKUP | 20336 |
| `backup CS/v1.37-ultra-realiste/src/three/__tests__/groom.test.ts` | BACKUP | 3091 |
| `backup CS/v1.37-ultra-realiste/src/three/__tests__/models.test.ts` | BACKUP | 1821 |
| `backup CS/v1.37-ultra-realiste/src/three/__tests__/outfit-v043.test.ts` | BACKUP | 7585 |
| `backup CS/v1.37-ultra-realiste/src/three/customize.ts` | BACKUP | 86028 |
| `backup CS/v1.37-ultra-realiste/src/three/gloveShape.ts` | BACKUP | 30828 |
| `backup CS/v1.37-ultra-realiste/src/three/groom.ts` | BACKUP | 28990 |
| `backup CS/v1.37-ultra-realiste/src/three/hair_atlas.json` | BACKUP | 2242 |
| `backup CS/v1.37-ultra-realiste/src/three/manga.ts` | BACKUP | 19765 |
| `backup CS/v1.37-ultra-realiste/src/ui/screens/CoachStudio.tsx` | BACKUP | 11096 |
| `backup CS/v1.37-ultra-realiste/src/ui/screens/coach-studio.css` | BACKUP | 10442 |
| `backup CS/v1.37-ultra-realiste/src/ui/screens/coach/FighterPanel.tsx` | BACKUP | 4502 |
| `backup CS/v1.37-ultra-realiste/src/ui/screens/coach/Preview.tsx` | BACKUP | 10490 |
| `backup CS/v1.37-ultra-realiste/src/ui/screens/coach/controls.tsx` | BACKUP | 5181 |
| `backup CS/v1.37-ultra-realiste/src/ui/screens/coach/options.ts` | BACKUP | 3646 |
| `backup CS/v1.37-ultra-realiste/src/ui/screens/coach/panels.tsx` | BACKUP | 16793 |
| `backup CS/v1.37-ultra-realiste/tests/e2e/coach-render.spec.ts` | BACKUP | 8923 |
| `backup CS/v1.37-ultra-realiste/tests/e2e/coach-studio.spec.ts` | BACKUP | 10490 |
| `public/coaches/femme.jpg` | JPG | 16577 |
| `public/coaches/homme.jpg` | JPG | 15942 |

### `fichiers-temporaires/`

| Chemin d'origine | Motif | Octets |
|---|---|---:|
| `scripts/dev/__pycache__/audit-amara-original-swimsuit.cpython-313.pyc` | PYC | 13638 |
| `scripts/dev/_extract.mjs` | TMP | 369 |
| `scripts/dev/_insp.mjs` | TMP | 963 |
| `scripts/dev/_shots.mjs` | TMP | 1284 |
| `scripts/salles/__pycache__/equipement.cpython-313.pyc` | PYC | 78799 |
| `tools/generator/__pycache__/anatomy.cpython-313.pyc` | PYC | 11091 |
| `tools/generator/kadir/__pycache__/forme.cpython-313.pyc` | PYC | 8449 |
| `tools/generator/kadir/__pycache__/projection.cpython-313.pyc` | PYC | 10287 |
| `tools/generator/kadir/__pycache__/rendu.cpython-313.pyc` | PYC | 7861 |

