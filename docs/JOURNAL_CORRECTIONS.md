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

## 2026-10-18 · v0.13.0 (en cours) · Lot 4g : Coach IA, questions suggérées

- **Signalement** : les questions suggérées ne défilent pas au doigt sur Android, elles ne sont pas toutes
  accessibles et ne correspondent pas à la technique travaillée.
- **Constat (téléphone Android émulé, 360 px, v0.12.0)** :
  1. Le CSS de l'écran d'entraînement imposait `overflow: hidden` à la rangée (1307 px de contenu pour 322 px
     visibles). Un glissement du doigt ne la déplaçait pas, et une seule question sur quatre était visible, coupée en
     hauteur.
  2. Le champ de saisie prenait le focus à l'ouverture, ce qui ouvrait le clavier Android sur le coach.
  3. Les suggestions dépendaient seulement de la discipline (exemple : « crochet gauche » pendant un direct arrière).
  4. Le moteur ne savait pas répondre à « Où placer ma main avant ? » ni à « Comment utiliser ma hanche pour frapper ? ».
- **Correction** :
  - rangée en vrai défilement horizontal (`touch-action: pan-x`, aimantation sur chaque carte), flèches gauche et
    droite désactivées aux extrémités, compteur, mention « Glisse pour voir plus » et bords en fondu ;
  - un glissement n'envoie jamais de question, et un double tap n'en envoie qu'une ;
  - cartes en vrais boutons, sur deux lignes si besoin, jamais coupées ;
  - la réponse s'affiche aussitôt et de nouvelles questions « Pour aller plus loin » sont proposées ;
  - questions propres à la technique en cours (`src/coach/suggest.ts`), gardées seulement si le moteur local y répond
    vraiment. On en compte au moins 4 par technique, et elles changent avec la technique ;
  - vocabulaire du moteur complété (main avant, hanche), sans changer sa logique, et articles corrigés (« la défense ») ;
  - plus d'ouverture automatique du clavier sur téléphone ; avec le clavier ouvert, le panneau se place juste
    au-dessus et garde le champ et « Envoyer » visibles ;
  - bouton « Agrandir » pour les longues réponses ;
  - sur les petits écrans, pendant la pause, les points clés laissent leur place au panneau, et le nom du mouvement
    et la consigne restent visibles.
- **Fichiers** :
  - `src/coach/suggest.ts`, `src/coach/engine.ts`, `src/coach/nlu.ts`, `src/coach/knowledge.ts` ;
  - `src/ui/coach-ai/CoachAskPanel.tsx`, `SuggestRail.tsx`, `useKeyboardInset.ts`, `coachAi.css` ;
  - `src/ui/training/training.css`, `src/ui/screens/Training.tsx`.
- **Tests** :
  - unitaires (176), dont 7 nouveaux sur les suggestions : toutes les techniques dans toutes leurs disciplines,
    réponses réelles, exemples du direct arrière en MMA et du sprawl : TEST RÉUSSI ;
  - navigateur (38), dont 7 nouveaux en émulation tactile : glissement dans les deux sens sans envoi, flèches,
    chaque question répond, double tap, 4 disciplines, changement de technique, clavier ouvert (émulé), hors ligne,
    320x568 et paysage, contraste AA clair et sombre : TEST RÉUSSI ;
  - Firebase (2) : NON EXÉCUTÉ ;
  - vrai téléphone Android : NON EXÉCUTÉ (aucun appareil disponible ici).
- **Publication** : à la demande de Youssef, la v0.13.0 sera publiée en dernier, avec les illustrations et le BJJ et
  le judo.
- **Restauration** : `restauration/lot-4g`

## 2026-10-18 · v0.13.0 · Lot 5a : illustrations des disciplines centralisées

- **Demande** : refonte graphique globale des disciplines, une illustration officielle par discipline utilisée
  partout depuis une ressource centrale (message de Youssef, 14:08).
- **Constat après vérification** (audit `docs/AUDIT_DISCIPLINES.md`) :
  1. une seule image par discipline, affichée sur 3 écrans seulement ; les 7 autres écrans affichaient du texte ;
  2. le chemin des images était déclaré dans `Cards.tsx` et recopié dans `Discipline.tsx`, sans référentiel ;
  3. les rendus existants ne correspondent pas à la direction premium demandée.
- **Correction** :
  - référentiel unique `src/domain/disciplineArt.ts` (sources WebP 240 et 600 px, cadrage, description, crédit,
    révision) et composant `DisciplineArtwork` (couverture, vignette, pastille ; plein cadre ou buste) ;
  - illustration affichée sur Accueil, Entraîner, Bienvenue, Page discipline, Techniques, Créateur, Légendes
    (nouveau premier niveau par discipline), Programmes, Progrès et Profil ;
  - anciens JPG convertis en WebP (hors ligne via le service worker), sans déformation (`object-fit: cover`) ;
  - aucune fonction utilisateur pour remplacer les illustrations : seul l'éditeur modifie le référentiel.
- **Reste à faire, signalé** : les illustrations premium (style anime, anthracite, rouge, or) ne peuvent pas être
  produites ici. Les 4 rendus 3D candidats ont été envoyés à Youssef et ne remplacent pas les images actuelles.
  BJJ et judo n'ont **pas encore d'illustration** (`ART_PENDING`) : leurs cartes affichent le nom sur fond sombre,
  sans pictogramme de remplacement.
- **Fichiers** : `src/domain/disciplineArt.ts`, `src/ui/components/DisciplineArtwork.tsx`, `Cards.tsx`, `Tabs.tsx`,
  les écrans cités, `src/ui/styles.css`, `public/art/disciplines/`.
- **Tests** : voir le lot 5b (exécutés ensemble).
- **Restauration** : `restauration/lot-5` (même point que le lot 5b, les deux lots sont livrés ensemble)

## 2026-10-18 · v0.13.0 · Lot 5b : BJJ et judo

- **Demande** : ajout du jiu-jitsu brésilien et du judo, avec des parcours sur 4 niveaux et une distinction claire
  entre solo, démonstration à deux et partenaire réel (message de Youssef, 14:09).
- **Ce qui est fait** :
  - modèle de données à 6 disciplines (menus, profil, caméra, coach IA, transitions, scène 3D) ;
  - 11 techniques solo animées : garde BJJ, pont (upa), rétention de garde, changement de base, shizen-tai,
    tsugi-ashi avant, arrière et latéral, tai-sabaki, kuzushi, uchikomi de seoi-nage (entrée seulement) ;
    la sortie de hanche et le relevé technique du MMA servent aussi au BJJ ;
  - parcours solo BJJ (16 exercices) et judo (15 exercices) sur 4 niveaux, avec uniquement des techniques solo ;
  - 10 fiches « Partenaire réel requis » (`src/domain/partner.ts`) : ukemi, o-soto-gari, o-goshi, ippon-seoi-nage,
    kesa-gatame, garde fermée, passage toreando, contrôle latéral, montée, clé de bras (principes). Étapes
    déplacement, kuzushi, tsukuri, kake pour les projections ; position, transition, contrôle, sortie pour le BJJ.
    Chaque fiche porte des consignes de sécurité ; aucune n'a d'exercice, de bouton de lancement ni d'animation ;
  - badge de mode (Solo, Démonstration à deux, Partenaire réel requis) sur les fiches ;
  - les chutes ne sont qu'expliquées, avec l'interdiction de les pratiquer à la maison ;
  - images des 11 nouvelles techniques pour les deux coachs.
- **Correction pendant le lot** : dans le tai-sabaki et l'uchikomi, les jambes se croisaient pendant la rotation
  (le bassin tournait du mauvais côté). Rotation inversée et pieds replacés, vérifiés par mesure des articulations
  et par rendu.
- **Pas encore fait, donc BJJ et judo ne sont pas déclarés complets** :
  - moteur à deux personnages et démonstrations avec partenaire virtuel ;
  - légendes BJJ et judo sourcées, et navigation Légendes, Discipline, Champion, Fiche pour ces disciplines ;
  - illustrations officielles du BJJ et du judo.
- **Fichiers** : `src/domain/types.ts`, `techniques.ts`, `exercises.ts`, `partner.ts`, `guide.ts`, `instructions.ts`,
  `src/engine/library/grappling.ts`, `src/coach/*`, `src/ui/screens/Library.tsx`, `src/ui/App.tsx`,
  `public/thumbs/`.
- **Tests** (lots 5a et 5b) :
  - compilation TypeScript : TEST RÉUSSI ;
  - unitaires (186), dont 6 nouveaux sur les fiches partenaire (mode, sécurité, étapes, préparation solo, aucun
    exercice solo avec une technique à deux) et le test du référentiel d'illustrations : TEST RÉUSSI ;
  - navigateur (55), dont 10 sur les illustrations officielles (10 écrans) et 7 sur le BJJ et le judo : TEST RÉUSSI ;
  - contraste AA : le premier passage a échoué sur l'accueil (texte de la discipline à 4,15:1 sur le dégradé, car la
    pastille rend la ligne plus haute). Texte renforcé, puis 3 passages : TEST RÉUSSI ;
  - vérification visuelle en clair et en sombre (fiches, listes, techniques animées) : TEST RÉUSSI ;
  - Firebase (2) : NON EXÉCUTÉ ;
  - vrai téléphone Android : NON EXÉCUTÉ.
- **Restauration** : `restauration/lot-5`

## 2026-10-18 · v0.13.1 · Signalement : textes illisibles en mode sombre

- **Signalement** : capture de Youssef (fiche d'une combinaison de légende, mode sombre) : titres, objectif, listes
  et angle de caméra en texte sombre sur fond sombre.
- **Constat après vérification** : dans le navigateur de test, ces textes étaient bien clairs. La différence vient du
  lecteur d'artifact : il enveloppe l'application dans sa propre page, dont le style impose au `body` un texte noir
  en 14 px. Notre feuille de style ne fixait la couleur et la police que sur `:root`, donc tous les textes sans couleur
  propre héritaient du noir du lecteur. L'APK n'est pas concerné (pas de page hôte).
- **Correction** : le `body` reprend explicitement la police et la couleur du thème (`font: inherit; color: inherit`).
  Les textes retrouvent aussi leur taille prévue (16 px au lieu de 14 px dans le lecteur).
- **Fichiers** : `src/ui/styles.css`, `tests/e2e/theme.spec.ts`.
- **Tests** :
  - nouveau test qui simule la page hôte (texte noir 14 px imposé) en sombre et en clair, sur la fiche signalée :
    TEST RÉUSSI ;
  - compilation et unitaires (186) : TEST RÉUSSI ;
  - navigateur (55) : TEST RÉUSSI. Lors du passage complet, 2 tests ont dépassé leur délai pendant que je calculais
    des rendus 3D en parallèle ; relancés seuls : TEST RÉUSSI ;
  - Firebase (2) : NON EXÉCUTÉ ; vrai téléphone : NON EXÉCUTÉ (à confirmer par Youssef).
- **Restauration** : `restauration/lot-5c`
