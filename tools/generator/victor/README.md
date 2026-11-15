# Victor « Le Loup gris » (1.43.0)

Coach créé d'après les planches de personnage générées par Youssef (tête de face, de profil, corps de boxeur,
tenues). Victor part d'une **copie** du modèle de Kadir : `public/coaches/mma-kadir/photo.glb` n'est jamais modifié.

## Chaîne de fabrication

1. **Forme** (Blender, `body.py`) : tête recalée sur les planches de face et de profil, crâne, volume des cheveux,
   carrure (avant-bras, mollets, trapèzes), tête un peu plus petite. Le même déplacement est appliqué à la forme de
   repos et aux 25 expressions ARKit. Le mode `glbexport` écrit le fichier de déplacements (`donnees/disp.f32` :
   9 nombres par point, position d'origine, déplacement, nouvelle normale, axes glTF, mètres).
2. **Textures** (Python, PIL/scipy) : projection des planches (`body_proj2.py`), bronzage (`tan.py`), raccord du
   short (`hem.py`), lèvre supérieure sans trait sombre (`lips.py`), arrière de la tête et nuque (`backhead.py`),
   teint (`teint.py`), cheveux poivre et sel (`finish_head.py`), puis (1.43.1, « un tout petit peu moins brun »)
   peau éclaircie sur les deux textures (`eclaircir.py <entrée> <sortie> 2.2`), puis (1.45.2, « taches sombres… moins
   brun comme sur la palette source ») plaques sombres effacées et teint de la planche (`peau_propre.py corps_in corps_out
   tete_in tete_out`, à ne passer qu'une fois). Résultats : `donnees/head_color.jpg`,
   `donnees/body_color.jpg` (déjà éclaircies).
3. **Modèle de l'application** :

   ```
   node tools/generator/rocketbox/victor_build.mjs public/coaches/mma-kadir/photo.glb \
     tools/generator/victor/donnees/disp.f32 tools/generator/victor/donnees/head_color.jpg \
     tools/generator/victor/donnees/body_color.jpg public/coaches/victor/photo.glb
   ```

   Même structure que Kadir (os, poids, expressions), forme et textures de Victor, os des yeux déplacés avec les yeux.
4. **Tenues** : `tools/generator/rocketbox/regen_outfits.sh victor` (palette `victor` de `outfits.py`).
5. **Portrait** : `npm run visuels -- --only portraits --id victor`.

Les scripts des étapes 1 et 2 sont gardés tels qu'ils ont servi (chemins de travail en tête de fichier).
