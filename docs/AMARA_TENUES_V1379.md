# Amara — finitions et correction du maillot d'origine (v1.37.9)

Date de publication prévue : 13 novembre 2026. Référence avant travaux : v1.37.8.
Version réservée à **Amara**. Le style du décolleté n'est pas contraint par une couverture imposée.

## Tenue MMA validée par l'utilisateur
- **Brassière** : décolleté féminin en U arrondi, bretelles sport, dos athlétique, textile mat anthracite/pétrole.
- **Bande inférieure** : vraie pièce élastique distincte, continue, environ 44 mm de hauteur, 96 segments, cousue visuellement sous le buste. Elle ne réutilise pas les plis sculptés de l'ancien maillot.
- **Short** : coupe vale-tudo de compression, une seule couche, taille et jambes bien ajustées, ouvertures indépendantes, sans surshort flottant, pas de bande/filament reliant les cuisses.
- **Décors originaux** : panneaux latéraux ivoire, détails dorés discrets et textile technique coloré sur le maillage existant. Aucun modèle, texture ni logo CGTrader importé.
- **Squelette** : les vêtements sont générés sur la morphologie Rocketbox propre d'Amara avec ses poids d'animation.

## Ancien maillot et conservation du modèle d'origine
Le fichier `photo.glb` d'origine est conservé **octet pour octet** : mode sans tenue identique à la v1.37.8. Un nouveau `photo-clean.glb` est utilisé uniquement lorsque l'une des **sept tenues** est sélectionnée. Le buste de cette version a une surface nettoyée (morph `CSS_CleanBikini`) et les zones colorées du bikini d'origine sont reconstruites en teintes de peau naturelle.

Le morph ne change pas les coordonnées source des sommets utilisées par `hideBody` : les sept masques de vêtements restent compatibles. Les 25 expressions du visage, la tête et ses textures sont préservées. Les six autres tenues d'Amara et les tenues d'Inaya, Kadir et Naël restent bit-à-bit identiques.

Les contrôles qui comptent seulement les triangles d'origine encore dessinés sont désormais interprétés correctement : ces triangles sont recouverts de **peau reconstruite**, pas d'un matériau de maillot. Le contrôle strict vérifie aussi les deux textures modifiées et l'identité des images de tête.

## Contrôles de non-régression
- Validation de la topologie du GLB et des accessoires MMA, présence du short mono-couche et de la bande élastique lisse.
- Vérification Blender des sept tenues, des bords arrière et de l'absence de pont entre les jambes au niveau des ourlets.
- Tests des matériaux et du rendu Amara, des masques, des 25 morphs du visage, de la sélection avec et sans tenue, du préchargement des fichiers et de la compilation.
- Captures du vrai moteur Three.js : **sept tenues × garde face/dos + low kick + high kick** ; dossier de preuve `captures/revue-amara-v1379/`.
- Contrôle de non-régression global : comparaison des échecs de la suite complète à ceux de la v1.37.8 (ne pas attribuer au correctif les tests moteur déjà défaillants en production).

## Stratégie de publication
Branche de livraison : `release/amara-mma-v1379` créée depuis la branche active `claude/project-thread-o7lrt8`. Sauvegarde de restauration exigée avant fusion. Ne publier qu'après passage des contrôles ci-dessus et validation des captures.

Dans un lancement sans tenue, l'avatar sportif d'origine reste visible. En cas d'échec de chargement des vêtements, l'application ne doit pas présenter le coach comme habillé tant que le modèle n'est pas prêt.
