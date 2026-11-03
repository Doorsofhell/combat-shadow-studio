# Correctif : coach 3D qui disparaît sur Android (v0.29.0-proto3)

Demande de Youssef du 2026-10-21 à 19:33 : « Correctif prioritaire — disparition du coach et arrêt du moteur 3D ».
Branche `fix/3d-context-recovery-v029`, PR #1 vers `feature/combat-shadow-v029`, sans fusion.

## 1. Symptômes rapportés

- Le coach apparaît, s'anime brièvement, puis disparaît (proto1 : écran noir).
- Le message « Affichage 3D indisponible… » s'affiche ensuite.
- Fermer puis rouvrir l'application ne règle rien.

## 2. Cause, avec preuve

### Ce qui a été reproduit

Script `scripts/dev/gpucrash.mjs` : Chromium 140 en émulation Pixel 7, accueil avec Kadir. Le script provoque le
plantage du processus graphique du navigateur (`Browser.crashGpuProcess` du protocole DevTools), c'est-à-dire ce
que fait un téléphone quand son pilote graphique se réinitialise.

| Étape | Avant le correctif (proto2 + PR #1) | Après le correctif (proto3) |
|---|---|---|
| 1re réinitialisation | contexte perdu puis rendu, le coach repart | idem, qualité abaissée d'une marche |
| 2e réinitialisation | la PR recrée un canvas sur un contexte perdu : `TypeError: Cannot read properties of null (reading 'precision')` dans `WebGLRenderer`, erreur React, message d'échec | le même canvas attend le retour du contexte |
| Juste après | Chrome refuse toute nouvelle 3D au site : `A WebGL context could not be created. Reason: Web page caused context loss and was blocked` | idem (c'est le navigateur) : message « Le coach revient dans un instant », nouvel essai toutes les 4 s |
| Après rechargement de la page | toujours refusé, message d'échec | sans objet |
| Quand Chrome lève le blocage (≈ 2 min ici) | **l'appli ne réessaie jamais** : message jusqu'à un rechargement manuel | **le coach revient seul**, sans recharger |

### Ce qui en découle

Une fois la 3D perdue, la disparition durable vient de l'application, pas du téléphone. Trois défauts se cumulaient :

1. **Chrome bloque le site après des réinitialisations graphiques.** Le message est « Web page caused context
   loss and was blocked ». Pendant ce temps, toute création de scène échoue.
   - Un rechargement n'y change rien.
   - Sur Android, fermer l'appli installée ne ferme pas Chrome. C'est ce qui explique « fermer et rouvrir ne règle
     rien ».
2. **Aucun nouvel essai.** L'erreur était attrapée une fois, puis le message restait affiché jusqu'au prochain
   lancement.
   - Proto2 en plus gardait la qualité légère pour toujours (`css-3d-safe`).
3. **La reprise de la PR #1 provoquait elle-même l'erreur.**
   - Elle recréait un canvas à la restauration du contexte, alors que three.js restaure le même canvas tout seul.
   - Ses écouteurs ne servaient qu'une fois (`once`), donc une 2e perte n'était plus gérée.
   - Elle abandonnait après 2 essais, laissant une scène vide sans message.

### Ce qui n'est pas prouvé

- **Ce qui déclenche la réinitialisation sur le téléphone de Youssef.** Ce peut être un manque de mémoire
  graphique, un délai de garde du pilote ou un bug du pilote. Rien ici ne permet de trancher : aucune fuite
  mesurée (voir §5) et pas de téléphone ici. **Je ne conclus donc pas à un manque de mémoire.**
- **Le journal 3D ajouté (§3.1) donnera la réponse sur l'appareil**, avec :
  - le modèle de carte graphique ;
  - l'heure de chaque perte ;
  - les images par seconde et les objets en mémoire graphique, mesurés chaque minute avant la perte.

## 3. Corrections

### 3.1 Journal 3D sur l'appareil

- Fichier : `src/three/diag3d.ts`.
- Clé `css-3d-diag`, 80 évènements au plus. Il reste sur le téléphone et rien n'est envoyé.
- Il distingue :
  - `demarrage` : coach, discipline, qualité demandée et appliquée ;
  - `gpu` : carte graphique, WebGL 1/2, taille maximale des textures, taille du canvas ;
  - `modele` : modèle prêt ;
  - `qualite` : changements de qualité et leur raison ;
  - `contexte-perdu` et `contexte-restaure` ;
  - `recuperation` : nouvelle scène ;
  - `echec` : erreur WebGL, modèle ou React, avec le message du navigateur ;
  - `arriere-plan` : pause et reprise ;
  - `animation` : erreur dans une image ou animation figée plus de 3 s alors que l'image est dessinée ;
  - `mesure` : chaque minute, images par seconde, géométries, textures, shaders et appels de dessin.
- Consultation dans **Réglages › Affichage 3D › Journal 3D**, avec les boutons « Copier le journal » et
  « Effacer ».
- En production, seuls les échecs et les pertes sont écrits dans la console.

### 3.2 Qualité qui baisse puis remonte

- Fichier : `src/three/safe3d.ts`. Elle remplace le « mode sécurité » définitif.
- Chaque incident fait descendre d'une marche :
  - niveau 0 : la qualité choisie ;
  - niveau 1 : qualité légère ;
  - niveau 2 : qualité légère à 3/4 de la résolution.
- Après 10 minutes sans incident, la qualité remonte d'une marche.
- Le bouton « Rétablir la qualité choisie » est dans Réglages.
- L'ancien indicateur `css-3d-safe` est converti une fois en niveau 1, qui remonte ensuite. C'est la seule clé
  retirée ; aucune donnée utilisateur n'est touchée.
- L'Ultra-réaliste reste le rendu par défaut et rien n'est abaissé sans incident.

### 3.3 Reprise dans la même scène

- Fichier : `src/three/CoachStage.tsx`.
- À la perte, l'appli empêche la suppression du contexte et laisse three.js le restaurer **sur le même canvas** :
  pas de second canvas, même modèle, même séance.
- Si le contexte ne revient pas en 8 s, la garde prend le relais (§3.4).
- Les écouteurs restent actifs pour toutes les pertes suivantes.

### 3.4 Garde commune aux 4 écrans 3D

- Fichier : `src/ui/components/StageGuard.tsx`.
- Écrans couverts : accueil, fiche technique, entraînement, aperçu. Avant, l'entraînement et la fiche n'avaient
  aucune protection.
- Avant de créer la scène, la garde vérifie que le navigateur accepte la 3D (`src/three/webglProbe.ts`, petit
  contexte rendu aussitôt).
- **Si la 3D est refusée** :
  - message « Le coach revient dans un instant » avec un bouton « Réessayer maintenant » ;
  - nouvel essai toutes les 4 s pendant 5 minutes, seulement quand l'appli est visible ;
  - puis message d'échec avec le bouton « Réessayer », et le conseil de fermer complètement le navigateur.
- **Erreur de modèle ou React** : un nouvel essai automatique, puis le bouton.
- **Erreur WebGL** : la qualité baisse d'une marche, puis la garde attend.
- **Bornes** : au plus 4 nouvelles scènes en 2 minutes, puis le bouton seulement. Pas de boucle infinie.
- La garde est placée hors de la couche décorative cachée de l'accueil (`aria-hidden`), ce qui rend le message et le
  bouton lisibles et utilisables.

### 3.5 Arrière-plan

- Quand l'appli est cachée (écran verrouillé, autre appli), le rendu est mis en pause (`frameloop="never"`).
- Il reprend au retour.
- Les deux évènements sont notés dans le journal.

### 3.6 Animation

- Une erreur dans une image d'animation est notée, et l'image suivante continue.

### 3.7 Mémoire graphique

- `PhotoCoach` libère ses matériaux à chaque changement de qualité ou départ du coach. Avant, ils restaient en
  mémoire graphique.

## 4. Fichiers modifiés

- `src/three/diag3d.ts` (nouveau)
- `src/three/webglProbe.ts` (nouveau)
- `src/three/safe3d.ts` (réécrit)
- `src/ui/components/StageGuard.tsx` (nouveau)
- `src/three/CoachStage.tsx`
- `src/three/PhotoCoach.tsx`
- `src/ui/screens/Home.tsx`
- `src/ui/screens/Library.tsx`
- `src/ui/screens/Training.tsx`
- `src/ui/screens/coach/Preview.tsx`
- `src/ui/screens/Settings.tsx`
- `src/ui/styles.css`
- Tests :
  - `src/three/__tests__/stability.test.ts`
  - `tests/e2e/coach-3d-recovery.spec.ts`
- Outils :
  - `scripts/dev/gpucrash.mjs`
  - `scripts/dev/soak-3d.mjs`

## 5. Tests

Les résultats et durées sont dans le journal des corrections (entrée v0.29.0-proto3).

- **Unitaires** (`stability.test.ts`, 6 tests) :
  - niveau qui baisse, borne, mémorisation, remontée après calme, remise à zéro ;
  - conversion de l'ancien indicateur ;
  - journal limité ;
  - classement des erreurs WebGL, modèle et React.
- **Scènes automatisées** (`coach-3d-recovery.spec.ts`, 6 scènes) :
  - perte puis retour du contexte ;
  - perte sans retour : nouvelle scène, sans recharger, un seul canvas ;
  - 3D refusée au lancement : attente, puis coach sans recharger ;
  - fiche technique et entraînement ;
  - arrière-plan ;
  - Réglages.
- **Panne réelle du processus graphique** (`scripts/dev/gpucrash.mjs`, 2 plantages) : voir §2.
- **Endurance** (`scripts/dev/soak-3d.mjs`) : 30 min de séance d'entraînement sur Pixel 7 émulé. Sont relevés
  les objets WebGL vivants, la mémoire JS, les canvas et les échecs.
- **Android réel : NON EXÉCUTÉ** (pas de téléphone ici). Les essais ci-dessus tournent dans Chromium sur Linux
  avec rendu logiciel (SwiftShader) : ils ne remplacent pas le téléphone.

## 6. Limites

- La cause matérielle de la réinitialisation sur le téléphone n'est pas encore connue (§2). Le journal la donnera.
- Si Chrome refuse la 3D plus de 5 minutes, l'appli affiche le bouton et le conseil de fermer complètement le
  navigateur. Elle ne peut pas lever ce blocage elle-même.
- Le niveau 2 (3/4 de résolution) est visiblement moins net. Il ne s'applique qu'après deux incidents rapprochés et
  remonte après 10 minutes calmes.
- La vérification préalable crée un tout petit contexte WebGL, rendu aussitôt. C'est visible dans les compteurs de
  l'endurance (2 contextes, 1 perte volontaire).

## 7. Validation sur Android (à faire par Youssef)

1. Ouvrir la version de test.
   - Vérifier que le titre affiche v0.29.0-proto3.
   - Si l'appli est installée, la fermer complètement depuis les applis récentes, ainsi que Chrome.
2. Accueil : laisser Kadir en garde 5 minutes, écran allumé.
3. Lancer une séance d'entraînement de 10 minutes ou plus, avec des enchaînements.
4. Changer de coach (Amara) et de discipline, puis revenir à l'accueil.
5. Verrouiller puis déverrouiller le téléphone pendant une séance. Passer à une autre appli puis revenir.
6. Si le coach disparaît : attendre 2 à 3 minutes **sans fermer l'appli**. Noter s'il revient seul et quel message
   s'affiche.
7. Dans tous les cas : **Réglages › Affichage 3D › Journal 3D › Copier le journal**, puis coller le texte dans le
   fil. C'est la preuve qui manque pour connaître la cause matérielle.
