# v0.29.0 · Lot 1 · Pilosité réaliste

Style concerné : **Ultra-réaliste** des coachs Kadir et Amara. Le style Anime n'est pas modifié.

## Méthode

| Élément | Avant (v0.28.0) | Après (lot 1) |
|---|---|---|
| Cheveux | coque gonflée + texture à bruit par pixel + lames opaques | ~7 000 (Kadir) / ~4 200 (Amara) *hair cards* texturées de vraies mèches, posées en couches sur le crâne, épi à l'arrière, coiffées en arrière |
| Barbe | couleur peinte avec un bruit par pixel (points) | ~14 000 petites cartes de poils fins, sens de pousse (vers le bas, moustache vers l'extérieur), forme calculée sur le visage, ombre de rasage dessous |
| Sourcils | peints | cartes de poils fins orientés (vers le haut au départ, vers la tempe ensuite) |
| Poils du corps | taches peintes | poils fins sur avant-bras, tibias et torse, **liés au squelette** |
| Lumière des cheveux | Lambert opaque | deux reflets le long des mèches (Kajiya-Kay), racines plus sombres, couleur variable d'une mèche à l'autre, pas de reflet de Fresnel gris |
| Bords | alpha binaire | alpha anti-crénelé, *alpha to coverage* avec l'anticrénelage, couverture conservée dans les mipmaps |

Fichiers : `src/three/groom.ts`, `src/three/hair_atlas.json`, `public/groom/hair_atlas.png`,
`tools/generator/groom/atlas.py`, `src/three/customize.ts` (branchement, ombre de rasage),
`src/three/CoachModel.tsx` (chargement de la texture, secours), banc de captures `lab/groom.html` +
`scripts/dev/shot-groom.mjs`.

## Secours et qualité

- Texture de mèches absente ou en erreur : la coiffure peinte de la v0.28 reste affichée.
- Qualité basse : 55 % des cartes. Ombres et effets lourds : lot 2.

## Limites connues

- Les cils ne sont pas encore en géométrie : à la distance de l'entraînement ils ne se voient pas ; prévu avec le
  lot 2 (visages) si le gain est visible en zoom Visage.
- Coût : environ 140 000 triangles de pilosité pour Kadir en qualité haute. Mesures de performance : lot 5.
  Non testé sur téléphone.
- Captures prises avec le rendu logiciel du navigateur de test (pas de GPU) : sur un vrai écran l'anticrénelage
  est meilleur.
