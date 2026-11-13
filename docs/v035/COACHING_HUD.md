# v0.35.0 — Coaching 3D : HUD compact et bandeau du mouvement

Demande de Youssef du 2026-10-22 (« REFONTE DU COACHING 3D, HUD compact, chronomètre intégré et affichage dynamique des mouvements »).
Branche `feature/coaching-hud-v035`, partie de `feature/combat-shadow-v030` à la v0.34.0 (commit 34669a1, point de restauration).

## 1. Audit : ce qui existait réellement (v0.34.0)

| Élément | Où | Constat |
|---|---|---|
| Discipline · niveau · mode | `Training.tsx`, en-tête `.tr-top .eyebrow` | ligne au-dessus du titre |
| Enchaînement complet | `.tr-top .title` (`exercise-name`) | le nom de l'exercice, qui pour une combinaison est la suite des coups (« Jab → Direct arrière → Low kick droit »), affiché en permanence |
| États Prêt / Prépare-toi / Round x/y / Libre / Repos / Pause / Terminé | puce `phase` en haut à gauche de la scène | posée sur le combattant |
| Temps restant | puce `phase-time` sous la précédente | format m:ss |
| Compte à rebours de préparation | `.countdown` au centre de la scène | 3, 2, 1 |
| Nom du coup | `.tr-now .name` (`current-move`) | le coup annoncé **ou**, entre deux coups, le dernier coup joué (`lastFocus`) : le nom restait affiché pendant la garde ; « Puis : … » montrait le coup suivant |
| Consigne, points clés | `.tr-cue`, `.tr-points` | pendant l'effort, le point de la phase en cours seulement (0.24) |
| Séance, Cumul, rép., Round, Exercice, barre | `.tr-meta` | une ligne |
| AR, plein écran, caméra, Décomposer, Menu | en-tête, scène, barre du bas | inchangés |

Moteur : `src/engine/player.ts` (`ComboPlayer`). Il enchaîne les mouvements par mélange : le mouvement suivant démarre au **point d'enchaînement** du précédent (`chainPoint`), au moment même où son nom est annoncé à la voix (`onStep`). Entre deux répétitions, il joue la garde ou des **déplacements automatiques** de recentrage (`auto`), qui ne sont pas des techniques de la séquence. Le temps du mouvement avance de `dt × vitesse` à chaque image et s'arrête en pause.

## 2. Source de vérité du bandeau

`ComboPlayer.moveNow()` (nouvelle méthode, lecture seule) dit quel mouvement possède l'affichage :

1. le mouvement entrant dès que son animation démarre (même image que l'annonce vocale) ;
2. sinon le mouvement courant **jusqu'à la fin de son animation** (retour compris) ;
3. sinon rien : garde, repos, déplacements automatiques de recentrage.

Il n'y a jamais deux mouvements : en cas de chevauchement, c'est le mouvement entrant qui s'affiche. `update()` appelle `reportMove()` **après** le calcul de la pose. L'événement `onMove` part seulement quand le mouvement change, ce qui fait une notification par coup et aucune par image. En pause, `update()` ne fait rien, donc le nom reste figé avec la pose.

Il n'y a ni `setTimeout` ni durée supposée.

Chaîne :
- `CoachStage` relaie l'événement `onMove`.
- `useSession` le stocke dans un mini-magasin (`moveStore.ts`, `useSyncExternalStore`).
- Seul `MoveBand` se redessine quand le mouvement change. La scène 3D n'est pas redessinée.

## 3. Nouvelle organisation

**Zone A, le HUD** (`header.tr-hud`) tient sur une ligne :
- « KICK-BOXING · DÉBUTANT » ;
- l'état (PRÊT, PRÉPARE-TOI, ROUND 1/3, LIBRE, TECHNIQUE, REPOS, PAUSE, TERMINÉ) ;
- le chrono en `mm:ss`, plus grand et vert pendant le repos ;
- le bouton AR ;
- en dessous, une barre de progression fine. C'est la barre existante qui a été déplacée ; son calcul n'a pas changé.

Les rounds ne s'affichent que dans les modes qui en ont.

**Zone B, la scène 3D** : le cadrage, la taille, le compte à rebours central et le bouton plein écran sont inchangés. La puce posée en haut à gauche du combattant a disparu, puisque son contenu est passé dans le HUD.

**Zone C, le bandeau** (`MoveBand`, hauteur fixe de 48 px, 38 px sur petit écran) :
- le nom du coup en capitales ;
- en sous-titre, le point clé de la phase jouée ;
- « 2/3 » pour la position dans l'enchaînement ;
- un bouton « i » qui met en pause et ouvre la fiche « Comment faire ? » de ce coup.

Le nom apparaît en fondu court (0,12 s) et disparaît d'un coup : il ne dure jamais plus longtemps que le mouvement. En garde, le bandeau reste vide, à la même hauteur.

**Informations sous le bandeau** :
- Avant le départ, en pause, au repos, à la fin et en Décomposer : le nom de l'exercice (l'enchaînement complet), le mode, la consigne principale, tous les points clés, puis la ligne des temps.
- Pendant l'effort : seulement la ligne des temps (Séance, Cumul, rép., Exercice x/y).

## 4. Ce qui a bougé, ce qui a été retiré

| Avant | Après |
|---|---|
| Titre permanent = enchaînement complet | Nom de l'exercice sous le bandeau, hors effort (prêt, pause, repos, fin). Il reste aussi dans les Options, dans la liste des exercices. |
| Puce d'état et temps posés sur la scène | Dans le HUD |
| Round x/y dans la ligne des temps | Dans le HUD (on évite le doublon) |
| Barre de progression dans la ligne des temps | Dans le HUD, en fine |
| Nom du coup « figé » pendant la garde (`lastFocus`) | Supprimé : le nom vient uniquement du moteur |
| « Puis : coup suivant » (écran) et « Suivant : … » (AR) | Retirés : deux noms de coups affichés en même temps, ce que la demande exclut. L'annonce vocale est inchangée. |
| Point de la phase sous le combattant | Sous-titre du bandeau |

Aucune donnée ni aucun mécanisme interne n'a été retiré : séquences, annonces, statistiques, reprise de séance.

## 5. Ce qui n'a pas été touché

- Les modèles, les squelettes, les peaux, les tenues et les animations sources.
- `useSession` : seule la sortie du mouvement a été ajoutée. Chronos, phases, rounds, repos, statistiques et sauvegarde de reprise sont inchangés.
- Les commandes Retour, Démarrer / Pause / Reprendre, Décomposer, Caméra, Menu, AR et plein écran.
- La stabilité WebGL.

## 6. Tests

Voir la PR pour les chiffres exacts.

- **`src/engine/__tests__/player-move.test.ts`** (16 tests) :
  - début du nom à l'image de l'annonce ;
  - durée égale à `chainPoint`, ou à `duration` pour le dernier coup ;
  - rien en garde ni avant le départ ;
  - Jab seul, Direct seul et Low kick seul ;
  - vitesse ×2 ;
  - pause de 3 s au milieu d'un low kick ;
  - Recommencer ;
  - déplacements automatiques jamais affichés ;
  - six disciplines, avec frappes, défenses, projections et sol ;
  - poses identiques avec et sans écouteur.
- **Vérification ponctuelle, non conservée** dans la suite parce qu'elle a besoin d'une copie du moteur 0.34 : comparaison image par image des poses entre le moteur 0.34 et le moteur 0.35.
  - Couverture : coachs homme et femme, 6 disciplines, les 12 premiers exercices de chacune, 600 images par exercice, avec une pause.
  - Résultat : égalité exacte. Le script est dans `verif-poses-v034.test.ts.txt`.
- **`tests/e2e/coaching-hud.spec.ts`** (navigateur, lecture du bandeau à chaque image) :
  - Jab → Direct arrière → Low kick droit dans l'ordre, rien en garde, jamais deux noms ;
  - hauteur stable ;
  - pause figée puis reprise ;
  - ralenti ;
  - Décomposer et le bouton « i » ;
  - rounds, repos, mode libre sans round, sans défilement à 360×640.

## 7. Limites

- Sur un vrai téléphone Android : NON EXÉCUTÉ.
- Le navigateur de test dessine peu d'images par seconde. Le moteur avance image par image (`dt`, plafonné), donc les mouvements y durent plus longtemps en temps réel. La synchronisation, elle, reste exacte, puisque le nom et la pose viennent de la même image.
- En plein écran total, le bandeau est masqué comme le reste des textes, pour garder le coach seul. Le comportement du plein écran n'a pas changé.
