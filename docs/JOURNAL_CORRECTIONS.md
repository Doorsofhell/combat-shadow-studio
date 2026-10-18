# Journal des corrections et améliorations

Fichier unique qui retrace tout l'historique des corrections et améliorations de Combat Shadow Studio, de la plus
ancienne à la plus récente. Chaque entrée indique la date, la version, ce qui a été constaté après vérification, la
correction, les fichiers principaux touchés et les tests. Les résultats des tests sont étiquetés TEST RÉUSSI,
ÉCHOUÉ, NON EXÉCUTÉ ou NON APPLICABLE. Le retour arrière se fait avec la branche de restauration indiquée.

---

## 2026-10-17 · v2 de référence (commit 85dcebf)

- **Contenu** : web app v2 avec les coachs manga personnalisables, le coach IA hors ligne et les comptes locaux.
- **Restauration** : `restauration/ref-2026-10-17-v2`
- **Suite** : plan de non-régression et état de référence ajoutés dans `docs/NON_REGRESSION.md` et `docs/ETAT.md`.

## 2026-10-17 · v0.4.0 · Lot 1 : lisibilité des textes

- **Constat** : plusieurs textes étaient sous le contraste WCAG AA, surtout le texte blanc sur le rouge d'action et
  le texte posé sur les images des cartes de discipline. Le filigrane gênait la lecture.
- **Correction** :
  - rouge d'action plus foncé (texte blanc à 4,7:1) et rouge clair dédié au texte (`--red-ink`) ;
  - filigrane des cartes supprimé, base opaque sous le texte ;
  - boutons de vue de l'éditeur opaques ;
  - placeholders, boutons désactivés, survol et appui plus lisibles.
- **Fichiers** : `src/ui/styles.css`, `src/ui/components/Cards.tsx`, éditeur du coach.
- **Tests** : audit axe-core sur 17 écrans, plus une mesure sur les pixels réels pour le texte sur image
  (`tests/e2e/contrast.spec.ts`) : TEST RÉUSSI.
- **Restauration** : `restauration/lot-1`

## 2026-10-17 · v0.5.0 · Lot 2 : thèmes clair, sombre et automatique

- **Constat** : l'application n'avait qu'un thème sombre.
- **Correction** :
  - palette claire en jetons et réglage Apparence > Thème des menus (Automatique par défaut) ;
  - le thème automatique suit le système en direct ; un choix manuel est prioritaire, mémorisé et appliqué avant le
    premier affichage ;
  - le studio d'entraînement reste toujours blanc ;
  - l'audit de contraste couvre aussi le texte visible masqué aux lecteurs d'écran.
- **Fichiers** : `src/ui/theme/theme.ts`, `src/ui/theme/useTheme.ts`, `src/ui/styles.css`, `index.html`.
- **Tests** : `theme.spec` (4) et `theme.test` (3) : TEST RÉUSSI.
- **Restauration** : `restauration/lot-2`

## 2026-10-17 · v0.6.0 · Lot 3 : postures de la génération aléatoire

- **Constat** : avec certains combattants générés au hasard, la posture se déformait pendant l'animation.
- **Cause** : le squelette reconstruit pendant l'animation prenait la garde comme posture de repos. Chaque mouvement
  ajoutait donc la garde une seconde fois.
- **Correction** :
  - la posture de référence est restaurée avant chaque mouvement ;
  - la génération aléatoire ne touche plus qu'à l'apparence (longueur des jambes fixe), avec des archétypes homme et
    femme ;
  - chaque génération est validée, avec repli sur la configuration par défaut si besoin ;
  - l'éditeur propose une posture neutre debout en plus de la garde.
- **Fichiers** : `src/three/pose.ts`, `src/three/customize.ts`, `src/three/CoachModel.tsx`, `src/editor/random.ts`, `src/engine/player.ts`.
- **Tests** :
  - 100 combattants générés par sexe : TEST RÉUSSI ;
  - curseurs aux limites, posture de référence, jambes aux limites dans toutes les animations : TEST RÉUSSI.
- **Restauration** : `restauration/lot-3`

## 2026-10-17 · v0.7.0 · Lot 4a : caméra 3/4, cadrage et articulations

- **Constat** :
  - l'angle « 3/4 » était mesuré par rapport à la ligne de l'adversaire. Avec une garde de profil, le coach
    apparaissait presque de profil ;
  - le cadrage laissait trop de vide ou coupait parfois un membre ;
  - certains coudes et genoux se pliaient au-delà du naturel.
- **Correction** :
  - angle pédagogique mesuré par rapport au buste ;
  - cadrage calculé sur tout l'espace occupé par le mouvement (le coach est plus grand, aucun membre n'est coupé) ;
  - limites articulaires dans l'IK : coude 150°, genou 155°.
- **Fichiers** : `src/domain/camera.ts`, `src/three/StudioStage.tsx`, `src/engine/envelope.ts`, `src/engine/rig.ts`.
- **Tests** : biomécanique, remplissage du cadre, Jab vu de 3/4 : TEST RÉUSSI.
- **Restauration** : `restauration/lot-4a`

## 2026-10-17 · v0.8.0 · Lot 4b : consignes par technique

- **Constat** : l'écran d'entraînement ne donnait pas une consigne claire et courte par technique.
- **Correction** :
  - pour les 64 techniques, une consigne principale et 3 à 5 points clés (appuis, bassin, membres, retour en garde) ;
  - le point de la phase en cours est mis en évidence, en lecture comme dans Décomposer.
- **Fichiers** : `src/domain/instructions.ts`, `src/engine/player.ts`, `src/ui/screens/Training.tsx`.
- **Tests** : couverture, longueurs, Jab mot pour mot, phases, deux gardes : TEST RÉUSSI.
- **Restauration** : `restauration/lot-4b`

## 2026-10-17 · v0.9.0 · Lot 4c : commandes et zone Caméra

- **Constat** : trop de boutons au même niveau, et aucun regroupement des réglages de caméra.
- **Correction** :
  - commandes principales : précédent, lecture/pause, suivant, Demander au coach ;
  - commandes pédagogiques : Décomposer, Comment faire ?, Ralenti ;
  - vitesse fine dans Paramètres ;
  - zone Caméra : Auto, angle, rotation, zoom, recentrer, sans masquer le coach ;
  - ligne de temps compacte : séance, répétitions, exercice, barre de progression.
- **Fichiers** : `src/ui/screens/Training.tsx`, `src/ui/training/training.css`, `src/ui/icons.tsx`.
- **Tests** : e2e de la zone Caméra sur 5 tailles d'écran, consigne, ralenti : TEST RÉUSSI.
- **Restauration** : `restauration/lot-4c`

## 2026-10-18 · v0.10.0 · Lot 4d : repères au sol

- **Constat** : la demande portait sur des repères au sol optionnels pour l'apprentissage.
- **Correction** :
  - repères pour la position et l'orientation des pieds, le pied avant (rouge) et arrière (bleu), le pivot et la
    trajectoire du coup ;
  - chaque repère s'active seul dans Paramètres, tous sont désactivés par défaut, le choix est mémorisé ;
  - légende discrète, et la caméra se surélève un peu quand un repère est affiché.
- **Fichiers** : `src/three/GroundMarks.tsx`, `src/store/settings.ts`, `src/three/CoachStage.tsx`.
- **Tests** : réglages, mouvement joué, e2e des repères, exercice précédent/suivant : TEST RÉUSSI.
- **Restauration** : `restauration/lot-4d`

## 2026-10-18 · v0.11.0 · Lot 4e : coach femme et images

- **Signalement 1** : « Il faudrait aussi que tu rajoutes un coach féminin ».
  - **Constat** : la coach femme existait déjà (Réglages > Coach, ou au premier lancement). En revanche, dans
    l'écran d'entraînement, Options > « Coach femme » ne changeait pas le coach affiché.
  - **Cause** : ce bouton modifiait le profil, alors que l'écran affiche le combattant actif.
  - **Correction** : le bouton passe désormais par le choix du combattant actif (`chooseCoach`).
- **Signalement 2** : « Je ne vois que du texte » dans l'application.
  - **Constat** : les listes de techniques, d'exercices, de programmes et de champions n'avaient que des lettres
    ou des icônes.
  - **Correction** :
    - 128 images (64 techniques × coach homme et coach femme), rendues avec nos propres coachs 3D au moment clé du
      mouvement ;
    - elles s'affichent selon le coach choisi, sur les cartes des écrans Techniques, Discipline, Programmes,
      Champions, Accueil et Entraîner ;
    - les animations restent jouées en 3D.
- **Fichiers** : `public/thumbs/`, `src/ui/components/TechThumb.tsx`, `src/ui/components/Cards.tsx`, écrans
  concernés, `src/ui/Lab.tsx`, `scripts/dev/shot-thumbs.mjs`, `scripts/dev/thumbs-webp.py`.
- **Tests** :
  - unitaires (167), dont une image par technique et par coach : TEST RÉUSSI ;
  - navigateur (29), dont les images chargées et le passage à la coach femme : TEST RÉUSSI ;
  - Firebase (2) : NON EXÉCUTÉ, service mis de côté.
- **Restauration** : `restauration/lot-4e`

## 2026-10-18 · v0.11.0 · APK de test Android

- **Demande** : APK pour tester sur un vrai téléphone, et APK versionné déposé sur GitHub.
- **Constat** : le SDK Android ne peut pas être téléchargé depuis l'environnement de développement (dl.google.com
  bloqué).
- **Correction** :
  - compilation sur GitHub Actions (`.github/workflows/android-apk.yml`), déclenchée par la branche `build/apk` ;
  - l'APK est publié dans la pré-version GitHub `v0.11.0` ;
  - premier essai en échec (« Value is null » dans Gradle), corrigé par une affectation explicite de
    `versionCode` et `versionName` dans `android/app/build.gradle`.
- **Livrable** : `combat-shadow-studio-v0.11.0-test.apk` (18,6 Mo, SHA-256
  `54ca5492b47737e6cb560bf15a344b76bc27baf3bfa32ef448d67d7589be8273`), signé avec une clé de debug. Ce n'est
  pas la version du Play Store.
- **Tests** :
  - tests unitaires sur GitHub avant la compilation : TEST RÉUSSI ;
  - contenu de l'APK (titre v0.11.0, 128 images, 8 modèles 3D) : TEST RÉUSSI ;
  - installation et fonctionnement sur un vrai téléphone : NON EXÉCUTÉ (à faire par Youssef).

## 2026-10-18 · v0.11.0 · Signalement : l'APK ne s'installe pas

- **Signalement** : Play Protect affiche « Appli bloquée pour protéger votre appareil ». Même avec « Installer quand
  même », l'application ne s'installe pas.
- **Constat** :
  - l'APK est complet (même empreinte SHA-256 que sur GitHub) et signé (signature Android v2) ;
  - il ne contient pas de bibliothèque native et demande Android 7 minimum ;
  - aucun défaut n'est trouvé dans le fichier. Le blocage vient du téléphone, car Play Protect ne connaît pas ce
    développeur (APK de test hors Play Store).
- **Suite** :
  - en attente du message affiché après « Installer quand même » et de la version d'Android ;
  - en attendant, la web app peut être ajoutée à l'écran d'accueil depuis Chrome ;
  - solution durable : passer par le Play Store (test interne) avec la clé de publication.
- **Tests** : vérification du fichier : TEST RÉUSSI. Installation sur le téléphone : ÉCHOUÉ, cause à préciser.

## 2026-10-18 · v0.12.0 · Lot 4f : caméra automatique

- **Signalement** : « la caméra automatique ne fonctionne pas correctement ». Youssef veut pouvoir choisir le mode
  caméra à la main ou revenir en Auto, avec un Auto idéal pour l'apprentissage.
- **Constat (mesuré pendant l'exercice « Pivots et angles »)** :
  1. Un seul angle pour tout l'exercice. Le jab et le direct étaient filmés de haut, à 45°, à cause du pivot.
  2. Après un pivot, le coach tourne de 60° mais la caméra reste fixe : il est vu presque de profil.
  3. Après une rotation ou un zoom, le bouton « Auto » gardait le décalage (+30° mesuré) et le zoom. Les angles
     manuels restaient aussi décalés : « Face » donnait 30° au lieu de 0°.
- **Correction** :
  - en Auto, chaque technique est filmée sous son angle pédagogique, avec une transition douce ;
  - deux techniques voisines aux angles proches partagent le même angle, et les combinaisons de poings gardent un
    3/4 fixe ;
  - dans une combinaison, les déplacements sont vus d'une hauteur modérée (24° au plus) ; un exercice de
    déplacements seuls garde la vue de haut ;
  - l'angle est mesuré par rapport au coach, donc la caméra tourne avec lui après un pivot (en Auto et en manuel) ;
  - « Auto » annule la rotation et le zoom manuels ; choisir un angle annule la rotation ; « Auto ajusté » s'affiche
    après un réglage manuel ;
  - le nom de l'angle Auto en cours est affiché (ex. « 3/4 avant »), avec sa raison dans les Options.
- **Fichiers** : `src/domain/camera.ts` (`stepViews`, `viewName`), `src/three/StudioStage.tsx`,
  `src/ui/screens/Training.tsx`.
- **Tests** :
  - unitaires (169), dont la caméra pas à pas et le nom de l'angle : TEST RÉUSSI ;
  - navigateur (31), dont « Auto annule rotation et zoom, angle manuel exact » et « la caméra tourne avec le coach
    après un pivot » : TEST RÉUSSI ;
  - Firebase (2) : NON EXÉCUTÉ.
- **Restauration** : `restauration/lot-4f`
