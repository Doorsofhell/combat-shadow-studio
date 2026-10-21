# v0.29.0 · Coachs Ultra-réalistes sur base Rocketbox (prototype)

Décision de Youssef (2026-10-21 16:49, carte « Oui, Rocketbox ») après le constat du 13:49 : les coachs
générés « ne font pas du tout humain ».

## Source et licence

- Microsoft Rocketbox Avatar Library, https://github.com/microsoft/Microsoft-Rocketbox, licence **MIT**
  (© 2020 Microsoft, texte dans `public/coaches/LICENSE-ROCKETBOX.txt`). Gratuit, usage commercial permis.
- Avatars utilisés : `Professions/Sports_Male_01` (Kadir) et `Professions/Sports_Female_01` (Amara), les seuls
  de la bibliothèque dont le corps est visible (maillot / bikini) : les autres portent des vêtements peints sur
  le corps.
- Les vrais noms des champions n'apparaissent nulle part ; les visages sont ceux de la bibliothèque, retouchés.

## Chaîne de fabrication

1. `tools/generator/rocketbox/recolor.py kadir|amara <Textures> <sortie>` : retouche des textures photo.
   - Kadir : cheveux noirs, barbe courte dense construite sur la barbe de la photo, yeux bruns, teint
     légèrement hâlé, short noir uni (le logo du maillot est effacé).
   - Amara : peau brune (même transformation sur la tête et le corps : pas de raccord visible au cou), cheveux
     noirs (chignon), yeux bruns, tenue noire à la place du bikini rose.
2. `tools/generator/rocketbox/convert.py <fbx> <glb> <textures>` (Blender, bpy) : renomme les os « Bip01 » avec
   les noms de nos modèles (Hips, Spine, LeftArm…), remet les pieds droits au repos (ils pointaient de 14° vers
   l'extérieur, ce qui faussait les limites de rotation de hanche), matériaux couleur + relief, export GLB
   (textures JPEG). Résultat : `public/coaches/mma-kadir/photo.glb`, `public/coaches/mma-amara/photo.glb`.
3. `src/three/PhotoCoach.tsx` : chargé par `CoachModel` en Ultra-réaliste pour les coachs champions. Le style
   Anime garde les modèles générés.

## Ce qui marche (vérifié)

- Nos animations pilotent les avatars sans modification du moteur (garde, jab, déplacements vus en captures).
- Test `src/engine/__tests__/photo-coach.test.ts` : squelette complet, taille humaine ; amplitudes articulaires
  de toutes les techniques : Kadir RÉUSSI ; Amara ÉCHOUÉ sur 2 techniques au sol (pont, rétention de garde :
  rotation externe de hanche 53,7° pour une limite de 45°, 8,7° au-delà de la tolérance).
- Poids : 1,5 Mo (Kadir) et 1,3 Mo (Amara), environ 3 700 et 4 300 sommets : bien plus léger que les modèles
  générés avec leurs poils.

## Limites du prototype (pas définitif)

- Pas encore de gants, protections ni kimono sur ces avatars : lot 3 (tenues par discipline).
- Amara porte une tenue noire en forme de bikini (la forme du maillot de la photo) : une vraie brassière et un
  short 3D viendront au lot 3.
- Maillage peu détaillé (silhouette facettée en gros plan sur le crâne) ; mains moins fines que nos modèles.
- Pas de personnalisation du physique (taille, musculature) sur ces avatars.
- Captures faites avec le rendu logiciel du navigateur de test ; non testé sur téléphone.
