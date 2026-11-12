# Amara — tenue MMA de compression : référence visuelle (prototype 1.37.9)

## Référence utilisateur (12 novembre 2026)
Les dix images fournies dans la conversation montrent une combattante adulte 3D en brassière courte et short **vale-tudo ajusté**. Objectif : reprendre l'esthétique du vêtement, **pas** les modèles, textures, visuels ni marques propriétaires de l'auteur.

### Coupe demandée
- Brassière sportive : encolure U arrondie et féminine, **décolleté non obligé d'être couvert**, bretelles larges, dos athlétique, bande sous-poitrine **sobre et régulière**.
- Short de compression autonome : une seule couche, taille mi-haute, deux ouvertures de jambes bien finies, ourlets haut de cuisse, aucune fente centrale ni bande en filet.
- Coloris d'Amara : anthracite/pétrole, panneau latéral ivoire, touches or limitées aux finitions ; textile mat PBR. Décor dessiné de façon originale sur les sommets du vêtement, sans couper les triangles.
- Le style repose sur la morphologie et le squelette de **mma-amara** et conserve ses mouvements.

## Implémentation expérimentale
- `AMARA_MMA_REF=1 ONLY=mma` active le modèle indépendant, **sans affecter** les 6 autres tenues d'Amara ni aucun autre coach.
- `short-vale-tudo` est le short ajusté externe ; **pas de `short-surshort`**, ni de cuissard tronqué sous un surshort ; la fente latérale historique est désactivée pour ce short.
- Le haut `haut-brassiere` est désormais construit par `top_square` avec un front redessiné en U uniquement sous le flag de prototype ; dos large et bretelles sport. La bande est foncée, non dorée sur toute sa largeur.
- `paint_mma_compression()` colore l'étoffe en utilisant l'attribut GLB `COLOR_0`, sans nouvelles faces et sans imiter le marquage « MMA » commercial des références.
- La source `photo.glb` de la peau, le squelette, les poids des trois autres coachs et tous les autres fichiers GLB restent inchangés.

## Contrôles obligatoires
1. `scripts/dev/regenerate-amara-mma-reference-v1379.sh` : génération MMA unique, vérification SHA-256 de tous les autres GLB, validateur sémantique.
2. `scripts/dev/validate-amara-mma-reference-v1379.py` : vraie brassière + vrai boxer, aucune seconde couche, GLB bien skinné et masque de peau présent.
3. `scripts/dev/capture-amara-mma-reference-v1379.mjs` : captures du **vrai moteur 3D** en garde face/dos, low kick, high kick, profil et détail du buste.
4. **Bloqueur restant** : `scripts/dev/audit-amara-original-swimsuit.py` détecte toujours des triangles du bikini d'origine non masqués, car le `photo.glb` porte son ancien relief. Sur la première version du prototype : **1 836 triangles encore dessinés**, contre **1 044** sur la tenue MMA de référence 1.37.8. Ces nombres ne prouvent pas une fuite visible sur chaque image mais **interdisent de déclarer le défaut résolu**.
5. Une capture seule ne suffit pas à garantir l'absence de piques, de torsion au crotch et de réapparition de maillot pendant toutes les phases de l'animation. La pose complète et la validation visuelle humaine sont nécessaires avant diffusion.

## Sécurité / publication
- Aucun achat, asset CGTrader, fichier tiers, texture ou logo propriétaire importé.
- Pas de déploiement Android ni GitHub Pages. Les images et le nouveau GLB sont uniquement sur la branche de prototype.
- Ne pas fusionner dans `fix/amara-garment-finish-v1379` ou `claude/project-thread-o7lrt8` sans correction séparée du torse réel et revalidation dynamique.
- Les versions de référence des autres coachs et autres disciplines restent figées.

## Résultat des deux passes (12 novembre 2026)
- **Passe 1** : brassière à dos en Y et bord doré très irrégulier, pas assez proche de la référence ; le short mono-couche fonctionnait en garde et high kick sur les captures. Audit d'origine : 1 836 triangles bikini dessinés.
- **Passe 2 retenue sur la branche** : brassière `top_square` isolée avec **encolure U**, dos plus large, bas foncé ; short mono-couche au panneau ivoire et **ceinture claire**. Génération réussie, 11 tests de non-régression ciblés réussis et application compilée, six vues WebGL capturées.
- Audit bikini de la passe 2 : **1 632 triangles de l'îlot ancien bikini encore dessinés** (dont 246 partiellement masqués), contre **1 044** sur la tenue historique. Ce n'est pas nécessairement autant de taches visibles, mais le critère « aucun maillot d'origine » n'est PAS validé.
- **Inspection de la capture profil du haut** : bord inférieur encore irrégulier au dos et fin relief/cordon historique sur la zone cervicale. Les deux défauts nécessitent une correction de surface propre, pas une recoloration du tissu.
- La sonde `__labStretch(3,0.04)` remonte sur le short 278 triangles en garde, 425 pendant low kick et 383 pendant high kick. C'est un indicateur technique de déformation, **pas à lui seul une preuve de déchirure**. Il faut comparer la topologie et les captures des phases d'écartement maximum.
- Règle bloquante : ne **pas** fusionner ou déployer le modèle avant correction du `photo.glb` et inspection complète des animations.
- Les captures se trouvent dans `captures/amara-mma-prototype/` : `planche-4-poses.jpg`, `05-high-kick-profil.jpg`, `06-brassiere-profil.jpg`.
