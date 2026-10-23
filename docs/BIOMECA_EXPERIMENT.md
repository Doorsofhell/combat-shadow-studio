# Essai contrôlé du moteur biomécanique — v0.45.1

## Objectif

Ajouter une **troisième option**, « Biomécanique (test) », dans Réglages → Affichage 3D → Version du rendu 3D. Elle utilise les **mêmes GLB, tenues, styles Ultra-réaliste/Anime, scènes, IK, chronomètres et lecteurs d'enchaînement** que le moteur actuel. Les options « Nouvelle (0.24) » et « Précédente (secours) » restent intactes.

**Périmètre réel de cette première expérimentation :** uniquement les deux animations `coude-diagonal-avant` et `coude-diagonal-arriere`. Ce n'est pas encore un moteur biomécanique exhaustif ni un catalogue MoCap validé pour les six disciplines.

## Isolation et retour arrière

- Le réglage `settings.coachRender` accepte `premium`, `precedent`, `biomeca`; défaut inchangé : `premium`.
- Le coach expérimental est rendu avec le modèle `premium`, sans nouveau GLB ni nouvelle dépendance.
- `getBiomecaLibrary` crée une bibliothèque distincte par rig et par bibliothèque source ; seuls les coups de coude concernés reçoivent une **copie** de leurs poses.
- Les mouvements standards et leurs miroirs gauchers ne sont jamais modifiés. Les temps d'impact, de chaîne et les appuis restent identiques.
- Quitter Biomécanique (test) remonte le modèle et le lecteur avec la bibliothèque historique.
- L'absence de validation sur téléphone interdit de supprimer les deux modes existants ou d'activer ce mode par défaut.

## Comparaisons reproductibles via Lab

Ouvrir les deux URL avec **même coach, même temps, même caméra**, changer uniquement `engine` :

- Avant : `#/lab?coach=homme&style=muaythai&motion=coude-diagonal-avant&t=0.12&cam=65&look=realiste&render=premium`
- Après : `#/lab?coach=homme&style=muaythai&motion=coude-diagonal-avant&t=0.12&cam=65&look=realiste&render=premium&engine=biomeca`

Recommencer aux temps `0.19`, `0.26`, `0.30`, en remplaçant `avant` par `arriere`, puis avec `coach=femme` et `garde=gaucher`.

La retouche expérimentale réduit l'ouverture excessive de l'armement et modifie l'orientation du coude sans déplacer le poing au point d'impact. **Ces paramètres ne constituent pas des angles biomécaniques scientifiquement certifiés** ; ils doivent être approuvés visuellement à partir de vidéos techniques et de prises de vue multiangles.

## Plan de validation avant fusion

1. `npm run typecheck`
2. `npm test -- --run` (ou `npm test`)
3. `npm run build`
4. `npm run test:e2e` si l'environnement Chromium le permet.
5. Android réel : régler Ultra-réaliste + Biomécanique, contrôler les deux humanoïdes, les deux gardes, le mode Décomposer, les coups de coude dans des combinaisons, pause et retour en garde.
6. Alterner `premium` → `biomeca` → `precedent` → `premium` en conservant les statistiques et réglages.
7. Comparer fréquence d'images, mémoire, absence de glissement et stabilité WebGL sur le téléphone.

**Ne pas fusionner automatiquement :** ce chantier est une expérimentation visuelle et biomécanique. Les tests automatiques seuls ne garantissent pas un geste martial correct.

## Suite possible

Étendre progressivement `getBiomecaLibrary` avec des corrections **technique par technique**, sur références internationales documentées, sans importer de code ou de captures dont la licence commerciale n'est pas autorisée. Évaluer les solveurs open source hors production avant toute modification du rig partagé.
