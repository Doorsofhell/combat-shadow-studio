# Amara — référence technique de la tenue MMA de compression (v1.37.9)

## Intention visuelle
Les captures fournies par l'utilisateur le 12 novembre 2026 montrent un ensemble MMA féminin : brassière de sport au décolleté en U, dos athlétique, short très ajusté haut de cuisse, ceinture droite et panneaux graphiques. L'utilisateur a **validé ce style**. L'identité et la morphologie d'Amara ne sont pas remplacées.

## Construction propre à Shadow Studio
- Générateur : `tools/generator/rocketbox/outfits.py`, option expérimentale `AMARA_MMA_REF=1 ONLY=mma` pour les reconstructions futures.
- Ensemble : `haut-brassiere` + `bande-brassiere-mma` + `short-vale-tudo`. Les accessoires MMA sont conservés.
- La bande élastique est un maillage fermé indépendant au contour lissé, 96 segments et 44 mm de hauteur. Elle suit le torse par transfert de poids depuis le corps réel.
- La couleur du tissu, son panneau ivoire et les détails dorés sont conçus et calculés localement dans les couleurs des sommets. Les triangles ne sont pas découpés pour les motifs.
- Pas de short supplémentaire ni de « filet » d'entrejambe. Le contrôle Blender rejette les ponts centraux au niveau des ourlets.

## Corps source et sécurité
- `public/coaches/mma-amara/photo.glb` : modèle Rocketbox original inchangé, à utiliser sans tenue.
- `public/coaches/mma-amara/photo-clean.glb` : corps préparé pour ses sept vêtements. Morph additionnel `CSS_CleanBikini`, qui supprime le relief de l'ancien maillot de la peau au rendu. Anciennes valeurs de sommets conservées pour les masques `hideBody`.
- Zones UV du maillot d'origine reconstruites à partir de la peau proche ; la texture de tête reste intacte, notamment pour ne pas altérer la chevelure et le visage.
- La version finale doit être testée en garde face/dos et en low/high kick, car des tests automatisés de triangles étirés ne suffisent pas à eux seuls à certifier l'esthétique.

## Limites et droits
Aucun GLB, logo, personnage, ni texture propriétaire provenant de CGTrader ou des images de référence n'est distribué. Seul le **style vestimentaire** sert d'inspiration. Le prototype intermédiaire demeure dans la PR #101, et la branche de livraison propre est `release/amara-mma-v1379`.

Les tests généraux des animations préexistant à la modification doivent être comparés à la v1.37.8. Les tests de vêtements, d'intégrité de la peau et de format GLB sont bloquants et doivent réussir.
