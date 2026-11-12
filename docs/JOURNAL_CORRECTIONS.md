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

## 2026-10-18 · v0.14.0 · Style Encre par défaut et relief anatomique des coachs (Plan V2, P1)

- **Demandes** : style « Encre » validé par Youssef (19:17) ; refonte du système humanoïde (19:29) et Plan global V2
  (19:43) : musculature extrêmement définie, pipeline Blender/MakeHuman existant, branche `feature/combat-shadow-v2`.
- **Constat après vérification** (détail dans `docs/AUDIT_HUMANOIDES.md`) :
  - les coachs sont de vrais GLB articulés (rig Mixamo de 52 os, doigts compris), animés par notre moteur IK ;
  - la peau n'avait **aucune carte de relief** : les séparations musculaires n'étaient que peintes, d'où l'aspect
    « mannequin » ;
  - la documentation annonçait des GLB compressés en Draco : **c'est faux**, le module Blender utilisé ne contient
    pas Draco et l'option était ignorée ;
  - le générateur n'était pas dans le dépôt.
- **Corrections** :
  - style Encre (hachures, lumière rasante, traits de pli) par défaut, avec migration des réglages enregistrés
    (Manga devient Encre, Réaliste est conservé) ;
  - carte de relief anatomique cuite dans Blender pour les 4 modèles (`tools/generator/anatomy.py`) : abdominaux,
    pectoraux, pli de l'aine, dentelés, colonne, omoplates, deltoïdes, bras, cuisses, mollets ; amplitude réduite pour
    la femme ;
  - la carte est conservée par les 3 styles de rendu (`CoachModel.tsx`, `manga.ts`) ;
  - un anneau au-dessus du genou (larme du vaste interne dessinée en cercle complet) a été vu sur le premier rendu et
    remplacé par un arc ;
  - générateur et documentation du pipeline Blender → GLB → Three.js versés dans `tools/generator/` ;
  - vignettes des techniques régénérées avec le nouveau rendu.
- **Inchangés** : squelette, maillage, repères `meta.json`, animations. Aucune animation à reprendre.
- **Fichiers** : `src/three/CoachModel.tsx`, `src/three/manga.ts`, `src/store/settings.ts`,
  `src/ui/screens/Settings.tsx`, `CoachStudio.tsx`, `src/ui/Lab.tsx`, `public/models/*`, `public/thumbs/`,
  `tools/generator/*`, `docs/AUDIT_HUMANOIDES.md`, `README.md`, `docs/LICENCES.md`,
  `src/three/__tests__/models.test.ts`, `src/store/__tests__/settings-style.test.ts`.
- **Tests** :
  - compilation TypeScript : TEST RÉUSSI ;
  - unitaires (198), dont 10 nouveaux : relief présent sur les 4 modèles, même squelette de 52 os que les
    animations, relief conservé par les styles Encre et Manga ; migration du style enregistré : TEST RÉUSSI ;
  - navigateur (57) : TEST RÉUSSI, en un seul passage ;
  - vérification visuelle avant/après (face, dos, Encre, Manga, Réaliste, homme et femme) et contrôle de vignettes :
    TEST RÉUSSI ;
  - Firebase (2) : NON EXÉCUTÉ ; vrai téléphone Android : NON EXÉCUTÉ.
- **Limites** : le relief change l'éclairage, pas la silhouette ; le relief féminin est volontairement plus discret
  et reste peu visible en style Encre ; les images de choix du coach (`public/coaches/*.jpg`) sont encore les anciens
  rendus.
- **Restauration** : `restauration/lot-6a`

## 2026-10-18 · v0.15.0 · Mode Analyse technique (Plan V2, P2, premier lot)

- **Demande** : Plan V2, chantier 5 : présenter le mouvement à vitesse normale puis au ralenti, s'arrêter aux phases
  importantes, mettre en évidence les zones du corps, expliquer et dire chaque phase, rejouer une phase précise,
  comparer les gardes ; décomposition fondée sur les données réelles de l'animation, modèle générique.
- **Constat après vérification** : le mode « Décomposer » existait déjà (`src/engine/study.ts`) avec 5 étapes
  génériques identiques pour toutes les techniques (départ, préparation, exécution, point clé, retour), le pas à pas
  entre poses clés, le ralenti, la rotation de caméra et les repères (trajectoire, hanches, pivot, appuis). Il
  manquait : des phases propres à chaque technique, la vitesse réelle avant le ralenti, la reprise d'une phase, la
  voix par phase, la mise en évidence du segment qui travaille et la comparaison des gardes.
- **Correction** :
  - nouveau modèle générique `src/engine/phases.ts` : l'animation est échantillonnée jusqu'à la position clé et
    chaque segment qui bouge vraiment (pivot ou talon d'un pied, changement de niveau, déplacement, hanches, épaules,
    membre qui frappe) devient une phase, placée là où il fait l'essentiel de son travail (10 % à 90 % de son
    mouvement). Hanches et épaules qui tournent ensemble forment une seule phase ; 4 phases de travail au plus ;
    les segments qui travaillent en même temps sont présentés du sol vers le membre. Exemple mesuré, direct arrière :
    départ, impulsion du pied arrière, rotation des hanches et des épaules, extension du bras arrière, impact, retour ;
  - le membre qui frappe vient du nom de la technique quand il le dit (avant, arrière, jab, direct) : sur l'uppercut
    arrière, la main avant bouge plus que la main arrière parce qu'elle suit le buste, la mesure seule se trompait ;
  - projections et techniques de sol : « Position clé » au lieu d'« Impact » ;
  - lecteur : vitesse réelle d'abord à chaque nouvelle technique, puis ralenti avec un arrêt de 1,2 s à la fin de
    chaque phase ; chaque phase est un bouton qui la rejoue seule puis s'arrête ; le pas à pas s'arrête aussi sur les
    fins de phases ;
  - un anneau doré pulsé entoure la partie du corps de la phase en cours (pied, bassin, épaules, poing) ;
  - la voix (si activée) annonce chaque phase et son explication ;
  - bouton « Gaucher » pour voir la technique dans l'autre garde sans modifier le profil.
- **Indicateurs à examiner (chantier 2, non corrigés dans ce lot)** : la mesure montre que sur les crochets,
  uppercuts, overhand et coudes, le membre atteint sa position avant la fin de la rotation des hanches (par exemple
  crochet avant : bras à 0,07 s, hanches à 0,14 s). Cela peut venir de l'armé du coup compté dans le déplacement du
  membre ; à vérifier technique par technique avant toute retouche des animations.
- **Fichiers** : `src/engine/phases.ts` (nouveau), `src/engine/study.ts`, `src/ui/training/Study.tsx`,
  `src/ui/training/training.css`, `src/ui/screens/Training.tsx`, `src/three/StudyCues.tsx`,
  `src/engine/__tests__/phases.test.ts` (nouveau), `tests/e2e/training-layout.spec.ts`.
- **Tests** :
  - compilation TypeScript : TEST RÉUSSI ;
  - unitaires (280), dont 82 nouveaux : phases du direct, de l'uppercut arrière, du middle-kick et de l'uchikomi,
    cohérence des phases pour chaque technique solo dans les deux gardes, vitesse réelle puis ralenti, arrêt sur la
    fin de chaque phase, reprise d'une phase, phase affichée : TEST RÉUSSI ;
  - navigateur (58), dont 1 nouveau (phases, reprise d'une phase, comparaison des gardes, aucun débordement à
    360 × 640) : TEST RÉUSSI ;
  - contrôle visuel sur téléphone 390 × 780 (phases, pause, surbrillance du poing) : TEST RÉUSSI ;
  - voix : NON EXÉCUTÉ automatiquement (synthèse vocale absente du navigateur de test) ;
  - Firebase (2) : NON EXÉCUTÉ ; vrai téléphone Android : NON EXÉCUTÉ.
- **Restauration** : `restauration/lot-6b`

## 2026-10-18 · v0.16.0 · Vitesse des coups et registre des animations (Plan V2, chantier 2)

- **Demande** : « Lance le prochain lot » : vérifier la chaîne cinétique signalée en v0.15.0 et créer le registre de
  statut des animations (validée, à corriger, manquante, non implémentée).
- **Constat après vérification** :
  - **fausse alerte corrigée** : en v0.15.0, la mesure indiquait que sur les crochets, uppercuts, overhand et coudes
    le bras finissait avant les hanches. C'était l'armé du coup (poing qui recule ou s'écarte) compté comme de la
    frappe. La mesure suit désormais la progression vers la cible : aucun coup n'a le bras en avance sur les hanches ;
  - **vrai défaut trouvé en mesurant la vitesse du poing ou du pied** : tous les coups s'arrêtaient net sur la cible
    (vitesse 0 m/s à l'impact). Les directs partaient à leur vitesse maximale dès la première image (14 à 21 m/s),
    jab au corps et direct au corps sautaient de 28 cm entre deux images à 60 i/s. Les coups de pied montaient à
    20 à 35 m/s pendant l'armé du genou ;
  - aucun glissement du pied d'appui sur les techniques debout (contrôle sur les 75 animations).
- **Correction** :
  - nouvelle courbe « frappe » : le membre part de l'arrêt, accélère, atteint sa vitesse de pointe aux deux tiers et
    touche encore en vitesse ; nouvelle courbe « armé », deux fois plus douce que la précédente, pour la mise en
    charge. Appliquées aux directs, jab, crochets, uppercuts, overhand, coudes, genoux et coups de pied. Les positions
    clés (garde, armé, impact) ne changent pas, seulement la manière d'y aller ;
  - mesures après correction : jab 4,4 m/s de pointe et 3,3 m/s à l'impact, direct 3,8 et 2,4, middle-kick 10,1 et
    7,8, roundhouse 11,8 et 9,2 ;
  - la phase « Armé » apparaît dans le mode Analyse quand les hanches tournent d'abord dans l'autre sens (uppercuts,
    overhand, coudes) ;
  - **registre des animations** (`src/engine/registry.ts`, `docs/ANIMATIONS.md`) : 7 contrôles automatiques par
    technique (présence dans chaque discipline et chaque garde, amplitude des coudes et genoux, pied d'appui fixe,
    continuité, chaîne hanches puis membre, touche en vitesse, vitesse de pointe plausible). Bilan : 75 contrôlées
    automatiquement, 0 à corriger, 0 manquante, 10 non implémentées (fiches avec partenaire), **0 validée** car aucun
    entraîneur n'a encore revu les mouvements. Un test échoue si le registre n'est plus à jour ;
  - la fiche de chaque technique affiche l'état de son animation.
- **Limites** : les seuils de vitesse (poing ≤ 12 m/s, pied ≤ 26 m/s) sont des ordres de grandeur, pas une norme ;
  « contrôlée » ne veut pas dire « validée » ; les contrôles d'appui ne s'appliquent pas aux déplacements, à la lutte,
  au sol et aux projections, où les pieds bougent volontairement.
- **Fichiers** : `src/engine/motion.ts`, `src/engine/library/boxing.ts`, `upper.ts`, `legs.ts`,
  `src/engine/phases.ts`, `src/engine/registry.ts` (nouveau), `src/domain/animationStatus.ts` et `.json` (nouveaux),
  `src/ui/components/Cards.tsx`, `src/ui/screens/Library.tsx`, `docs/ANIMATIONS.md` (nouveau), tests
  `registry.test.ts` (nouveau), `tests/e2e/bjj-judo.spec.ts`, `public/thumbs/`.
- **Tests** :
  - compilation TypeScript : TEST RÉUSSI ;
  - unitaires (283 réussis, 1 ignoré), dont le registre (à jour, aucune technique manquante ou à corriger) et les
    phases de l'analyse (au plus 4 phases de travail, armé compris) : TEST RÉUSSI ;
  - navigateur (58 réussis, 2 ignorés : Firebase), dont l'état de l'animation sur une fiche solo et une fiche avec
    partenaire : TEST RÉUSSI ;
  - contrôle visuel des 300 vignettes régénérées (échantillon jab, crochet, middle-kick, coude) : TEST RÉUSSI ;
  - validation par un entraîneur : NON EXÉCUTÉ ; vrai téléphone Android : NON EXÉCUTÉ.
- **Restauration** : `restauration/lot-6c`

## 2026-10-19 · v0.17.0 · Audit technique et biomécanique (mission prioritaire)

- **Demande** : « Audit technique et biomécanique exhaustif » des 6 disciplines : recherche documentaire classée,
  registre des vidéos réellement consultées, fiches biomécaniques, audit du moteur, anomalies priorisées, plan de
  correction, animations pilotes corrigées et testées, méthode reproductible, sur une branche dédiée.
- **Constat après vérification** :
  - recherche : 142 lignes de sources dans 4 rapports (`docs/audit-biomecanique/recherche/`), dont des pages
    inaccessibles listées à part (PDF Kodokan, règlement IBJJF, UWW, FFJDA). **Aucune vidéo visionnée** : les outils
    lisent du texte seulement. Les pages passent par un lecteur qui résume : citations à revérifier ;
  - mesures sur le squelette réel (`src/engine/audit.ts`, centre de masse de Leva 1996) : sur les coups de pied,
    genoux et checks, le centre de masse restait 15 à 27 cm hors du pied d'appui pendant 72 à 90 % du mouvement
    (poids jamais transféré) ; sprawl : genou 1,9 cm sous le sol, pieds qui glissaient de 21,6 cm par image au
    retour ; techniques au sol : orteils 1,4 cm sous le sol ; relevé technique et changement de base : pied qui
    glisse de 11 à 14 cm par image ; transitions : glissement ajouté faible (≤ 3 cm par image) ;
  - textes contredits par les sources : middle kick « buste incliné en arrière », sprawl « mains au sol », shrimp
    « poussée des bras », clé de bras « épaules au sol », abandon incomplet (taper deux fois ou dire « maitta »),
    risques graves non signalés pour o-soto-gari (tête) et seoi-nage (cou), aucun poignet ni surface de contact sur
    les coups de poing, aucune limite de hauteur de tête sur les rolls, pas de sécurité du genou d'appui sur les kicks.
- **Correction** :
  - **équilibre sur un pied** (`src/engine/balance.ts`) pour 20 animations (coups de pied, genoux, checks) : les
    hanches placent le centre de masse au-dessus du pied d'appui, la jambe en l'air et les mains suivent ; la pose
    d'avant transfère déjà la moitié du poids. Temps hors appui : 72 à 90 % → 7 à 28 % (il ne reste que la pose de la
    jambe au retour) ;
  - **sprawl** refait : mains qui appuient sur une tête imaginaire puis finissent au sol, hanches au sol, retour en
    sautant. Point le plus bas 2,0 cm, glissement 3,3 cm par image ;
  - 17 corrections de texte sourcées (boxe, kick, MMA, judo, BJJ) ;
  - modèle de fiche biomécanique (`src/domain/biomech/`), registre des sources, 3 fiches pilotes (direct, middle kick
    droit, sprawl) au statut « Validation technique nécessaire » ; un test refuse « Validée » sans revue d'expert ;
  - documents : `docs/audit-biomecanique/` (README, INVENTAIRE et MESURES_MOTEUR générés par des tests,
    BIBLIOGRAPHIE, REGISTRE_VIDEOS, AUDIT_MOTEUR, ANOMALIES, PLAN_CORRECTION, METHODE).
- **Limites** : aucune technique validée par un entraîneur ; 82 fiches restent « À documenter » (notes de recherche
  disponibles) ; pas de système à deux corps, pas d'outil de comparaison vidéo, collisions et Android non mesurés ;
  techniques au sol et sens du roll à corriger dans les lots suivants (voir PLAN_CORRECTION).
- **Fichiers** : `src/engine/balance.ts`, `audit.ts` (nouveaux), `motion.ts`, `library/index.ts`, `library/legs.ts`,
  `library/mma.ts`, `src/domain/techniques.ts`, `partner.ts`, `src/domain/biomech/` (nouveau),
  `animationStatus.json`, tests `audit.test.ts` et `biomech.test.ts` (nouveaux), `docs/ANIMATIONS.md`,
  `docs/audit-biomecanique/`, `public/thumbs/`.
- **Tests** :
  - compilation TypeScript : TEST RÉUSSI ;
  - unitaires (292 réussis, 1 ignoré), dont longueur des jambes aux deux limites (appuis et angles inchangés après
    l'équilibrage), registre des animations à jour (75 contrôlées, 0 à corriger), mesures et inventaire à jour,
    fiches (sources connues, « Validée » refusée sans revue) : TEST RÉUSSI ;
  - navigateur (58 réussis, 2 ignorés : Firebase) : TEST RÉUSSI ;
  - contrôle visuel des 42 vignettes régénérées (sprawl, middle kick, high kick, genou, check, teep ; homme et
    femme) : TEST RÉUSSI ;
  - revue par un entraîneur : NON EXÉCUTÉ ; vrai téléphone Android : NON EXÉCUTÉ ; vidéos : NON EXÉCUTÉ (aucune
    visionnée).
- **Restauration** : `restauration/lot-7`

## 2026-10-19 · v0.18.0 · Silhouettes naturelles des coachs

- **Demande** : « Garde three. Mais améliore les silhouettes pour plus de réalisme. Pas de musculature proéminente,
  une musculature harmonieuse et naturelle », puis « des personnages les plus réalistes possible ».
- **Constat après vérification** : le générateur (`tools/generator/build.py`) poussait les cibles musculaires de
  MakeHuman près du maximum (masse musculaire 1,0 pour l'homme, pectoraux, dorsaux, épaules, bras, cuisses et
  mollets entre 0,6 et 1,0, cou épaissi, forme en V), et les styles Encre et Manga utilisaient une variante encore plus
  marquée. Le relief cuit (sillons entre les muscles) et l'ombrage de « définition » accentuaient abdominaux et dos.
- **Correction** :
  - mêmes squelettes et mêmes tailles (animations inchangées), volumes réduits pour les 4 modèles : masse musculaire
    0,58 (homme) et 0,52 (femme) en Réaliste, 0,60 et 0,52 en Encre/Manga ; cibles par muscle ramenées entre 0,1 et
    0,25 ; cou, épaules et forme en V nettement réduits ;
  - relief des sillons moins profond (0,004 → 0,002) et ombrage de définition divisé par deux environ ;
  - captures avant / après : `docs/comparatif/silhouette-homme-v018.png`, `silhouette-femme-v018.png`.
- **Limites** : les corps restent issus de MakeHuman (CC0) générés par nos scripts ; le réalisme est limité par ces
  maillages et textures gratuits (pas de scan, pas de peau photographique). Les mouvements plus fluides et naturels
  sont le prochain lot.
- **Fichiers** : `tools/generator/build.py`, `public/models/` (4 GLB, 2 meta, 2 masques), `public/thumbs/` (150),
  `docs/audit-biomecanique/MESURES_MOTEUR.md` (régénéré, écarts < 0,5 cm), `docs/comparatif/`.
- **Tests** :
  - `tsc` : TEST RÉUSSI ; tests unitaires : TEST RÉUSSI (292 réussis, 1 ignoré) ;
  - Playwright complet : 56 réussis, 2 ignorés, 2 échoués au premier passage. « Demander au coach » à 360×640 :
    réussi en relance isolée (machine chargée par la génération des vignettes). « Caméra Auto » : constat, la caméra
    revient bien à sa distance (4,102 m mesurés), mais le test lisait sa référence pendant une pause du chargement ;
    l'attente demande désormais 4 lectures stables d'affilée (critère plus strict, pas affaibli) ; 3 relances sur 3
    réussies, puis le fichier `training-layout.spec.ts` complet : TEST RÉUSSI (12/12) ;
  - contrôle visuel des 4 modèles et des vignettes (homme, femme) : TEST RÉUSSI ;
  - vrai téléphone Android : NON EXÉCUTÉ.
- **Restauration** : `restauration/lot-8`

## 2026-10-19 · v0.19.0 · Bibliothèque d’icônes premium

- **Demande** : intégrer la nouvelle bibliothèque d’icônes (planche de référence) dans toute l’application : audit
  du dépôt, design system centralisé, six icônes de discipline, palette officielle, sans régression ni plagiat de la
  planche.
- **Constat après vérification** (audit complet dans `docs/icones/`) : 44 icônes au trait dans un seul fichier, dont 9
  inutilisées ; deux icônes locales en double dans le panneau du coach ; favori dessiné de deux façons (étoile SVG et
  caractère ★) ; même flèche pour 3 sens (exercice, angle de caméra, étape clé) ; horloge pour « Ralenti » ; couches
  pour « Décomposer » ; deux icônes différentes pour les réglages ; aucune icône de discipline (médaillons de
  combattants pour 4 disciplines sur 6, rien pour le BJJ et le judo). Absents de l’application : défis, notifications,
  abonnement, partage, statuts d’accès.
- **Correction** :
  - `src/ui/icons/` : composant unique `AppIcon` (pochoir + lumière douce identique pour toutes les icônes),
    familles `NavigationIcon`, `ActionIcon`, `TrainingControlIcon`, `StatusIcon`, `DisciplineIcon`, `LevelIcon`,
    registre de 98 identifiants stables ; l’ancien `src/ui/icons.tsx` est supprimé ;
  - 6 icônes de discipline dessinées (gant, protège-tibia, gant MMA, mongkol, ceinture noire BJJ, judogi), en
    version détaillée et compacte ; utilisées sur les cartes, onglets, filtres, étiquettes, Progrès et Légendes ;
  - toutes les icônes des écrans passent par le composant central ; sens corrigés (Ralenti, Décomposer, Zoomer,
    angle précédent / suivant, Paramètres, Reprendre) ; favoris en cœur partout ; ★ et ✕ texte remplacés ;
    bouton « Stop » du mode RA renommé « Pause » (il met en pause) ;
  - icônes dans les titres de Réglages et Profil, les onglets de Techniques et des Légendes, les badges de statut
    (Vérifiée, Adaptée, Inspirée) et de niveau (barres 1 à 4) ;
  - palette officielle : fond `#0B0F14`, surfaces `#1F2937`, rouge `#E11D2F`, or `#D4AF37`, textes `#F4F4F5` et
    `#9CA3AF` (barre d’état Android et manifeste compris).
- **Limites** : icônes dessinées en SVG dans ce dépôt (pas de rendu 3D photoréaliste comme sur la planche) ; défis,
  notifications, abonnement, premium, partage : icônes prêtes mais non affichées, la fonction n’existe pas.
  Vérification sur un vrai téléphone Android : non faite.
- **Fichiers** : `src/ui/icons/` (nouveau), `src/ui/styles.css`, `src/ui/training/training.css`, 30 écrans et
  composants, `src/ui/theme/theme.ts`, `index.html`, `vite.config.ts`, `docs/icones/`, `tools/icon-lab/`,
  `scripts/icon-inventory.mjs`.
- **Tests** :
  - `tsc` : TEST RÉUSSI ; tests unitaires : TEST RÉUSSI (308 réussis, 1 ignoré), dont 16 nouveaux pour les icônes
    (registre complet, accessibilité, identifiants uniques, 6 disciplines en 2 détails, aucune ressource externe,
    plus d’ancien composant ni de symbole texte, navigation réelle conservée, palette et contrastes AA) ;
  - Playwright complet : 47 réussis, 2 ignorés, 11 échoués au premier passage. 9 venaient du test « illustrations
    officielles », qui exigeait les médaillons de combattants désormais remplacés à la demande par les icônes : il
    exige maintenant les icônes officielles, les 6 disciplines sur les écrans qui les listent, sans déformation, et
    l’illustration en bannière (critère plus large, pas affaibli) : 11/11 réussis. 1 venait du test du thème (ancienne
    couleur de fond `#101116`, remplacée par `#0B0F14`) : 6/6 réussis. 1 était le panneau du coach à 360×640, échec
    intermittent déjà vu en v0.18.0 : 12/12 réussis en relance. Les fichiers exécutés avant les derniers ajouts
    d’icônes ont été relancés : 23 réussis, 2 ignorés (contraste AA compris) ;
  - captures avant / après de 17 écrans en 3 tailles, aucune erreur de page : TEST RÉUSSI (8 planches dans
    `docs/icones/captures/`) ;
  - vrai téléphone Android : NON EXÉCUTÉ.
- **Restauration** : `restauration/lot-9`

## 2026-10-19 · v0.20.0 · Lot 10 : mouvements plus fluides et naturels

- **Demande** : « Je veux des mouvements les plus fluides et naturels et humains ».
- **Constat après mesure** : chaque animation passait de pose clé en pose clé avec une accélération puis un freinage
  complet sur chaque segment. Une main, le bassin ou une cheville qui continue dans la même direction s’arrêtait donc
  à chaque pose clé, comme un robot : 941 arrêts de ce type sur les 432 animations des 6 gardes (mesure
  `src/engine/fluidity.ts`). Les mains du sprawl descendaient en deux poussées, jusqu’à 18 cm par image
  (anomalie 22 de l’audit).
- **Correction** :
  - le moteur garde la vitesse à travers une pose clé quand le mouvement continue dans la même direction (courbe
    cubique monotone de Fritsch et Butland, sans dépassement des poses clés) ; vitesse nulle aux points de retour
    (fin d’un coup, changement de direction) ; les impacts et les départs explosifs gardent leur rythme ; les mains
    sont lissées dans le repère du buste, les pieds seulement en l’air, loin du décollage et de l’atterrissage, pour
    ne pas frotter le tapis ;
  - une pose clé peut être marquée « arrêt voulu » (`hold`) : utilisé au saut du sprawl, où le lissage faisait passer
    les genoux sous le tapis ;
  - sprawl : descente des mains en un seul geste continu et plus progressif, 11,5 cm par image au plus.
- **Résultat mesuré** : 941 → 320 arrêts parasites ; vitesse des mains et des pieds à l’impact conservée à 3 % près
  sur tous les coups ; moyennes de l’audit du moteur sur les 75 techniques inchangées (centre de masse hors appuis
  10,5 cm, point le plus bas 2,6 cm, glissement 1,3 cm par image). Les 320 arrêts restants sont surtout des pieds qui
  se posent ou décollent et des mains en appui au sol : arrêts voulus.
- **Limites** : lissage mathématique des poses existantes, pas de capture de mouvement ; aucune animation n’est
  « validée » techniquement (revue d’expert toujours nécessaire) ; vérification sur un vrai téléphone : non faite.
- **Fichiers** : `src/engine/motion.ts`, `src/engine/fluidity.ts` (nouveau), `src/engine/library/mma.ts`,
  `src/engine/__tests__/fluidity.test.ts` (nouveau), `docs/audit-biomecanique/MESURES_FLUIDITE.md` (nouveau),
  `MESURES_MOTEUR.md` régénéré, `ANOMALIES.md`.
- **Tests** :
  - `tsc` : TEST RÉUSSI ; tests unitaires : TEST RÉUSSI (312 réussis, 1 ignoré), dont 4 nouveaux (document de mesures
    à jour, au moins 60 % des arrêts supprimés, aucune animation avec plus d’arrêts, vitesse à l’impact conservée) ;
    registre des animations, équilibre, audit du moteur et phases : TEST RÉUSSI ;
  - Playwright complet : TEST RÉUSSI (59 réussis, 2 ignorés, aucun échec au premier passage) ;
  - vrai téléphone Android : NON EXÉCUTÉ.
- **Restauration** : `restauration/lot-10`

## 2026-10-19 · v0.21.0 · Lot 11 : kick-boxing en trois styles

- **Demande** : pour le kick-boxing, garder tous les styles (K1, low kick, full contact).
- **Constat après vérification** : l'application proposait un seul kick-boxing, sans dire quelles règles il suivait.
  Les low kicks y figuraient alors qu'ils sont interdits en full contact. Les genoux en étaient absents alors qu'ils
  sont autorisés en K1 (anomalie 28). La fiche du roundhouse ne citait que le cou-de-pied (anomalie 27). Aucun
  règlement full contact n'avait été lu.
- **Correction** :
  - nouveau règlement lu : règles amateur de kick-boxing de l'Ontario, qui décrivent les trois styles (source
    kbmt-S45), en plus des règles WAKO du low kick (kbmt-S15) et du K1 (kbmt-S16) ;
  - `src/domain/kickboxingStyles.ts` : pour chaque style, ce que les règles autorisent, avec la règle et la source.
    Full contact : pas de low kick ni de genou, check non proposé. Low kick : low kicks à la cuisse, pas de genou.
    K1 : low kicks et genoux. Coudes et clinch absents des trois styles ;
  - choix « Tous les styles / K1 / Low kick / Full contact » sur la page Kick-boxing, dans Techniques (techniques et
    combinaisons) et dans le Créateur. Le choix est enregistré dans les réglages. En « Tous les styles », une
    étiquette indique les techniques réservées à certains styles (« K1 seulement ») ;
  - fiche d'une technique en kick-boxing : carte « Selon le style de kick-boxing » (autorisé, interdit ou non
    proposé, la précision du règlement et sa source) ;
  - les 4 genoux (définitions communes avec le muay-thaï, non dupliquées) sont ajoutés au kick-boxing ;
  - 12 exercices ajoutés à la fin de chaque niveau, sans changer les identifiants existants : 6 avec genoux (K1) et
    6 sans coup de pied aux jambes, pour que chaque style garde au moins 5 exercices par niveau.
- **Limites** : résumés de règlements lus par un lecteur web, à vérifier sur les textes ; les règlements divergent
  sur le clinch en K1 (interdit à la WAKO, permis en Ontario) et le texte de l'Ontario se contredit sur les genoux
  en K1 (3.3.3 contre 5.3.1). Les programmes et les légendes ne sont pas filtrés par style. Aucune animation
  nouvelle : les genoux réutilisent les animations du muay-thaï. Vrai téléphone : non vérifié.
- **Fichiers** : `src/domain/kickboxingStyles.ts` (nouveau), `src/domain/techniques.ts`, `src/domain/exercises.ts`,
  `src/domain/biomech/sources.ts`, `src/store/settings.ts`, `src/ui/components/KickboxingStyle.tsx` (nouveau),
  `src/ui/screens/Discipline.tsx`, `Library.tsx`, `Builder.tsx`, `tests/e2e/kickboxing-style.spec.ts` (nouveau),
  `src/domain/__tests__/kickboxingStyles.test.ts` (nouveau), documents d'audit (BIBLIOGRAPHIE, ANOMALIES,
  PLAN_CORRECTION, recherche) et documents générés (ANIMATIONS, INVENTAIRE, MESURES_MOTEUR).
- **Tests** :
  - `tsc` : TEST RÉUSSI ; tests unitaires : TEST RÉUSSI (319 réussis, 1 ignoré), dont 7 nouveaux sur les styles ;
  - Playwright complet : 58 réussis, 3 échoués, 2 ignorés au premier passage. Les 2 nouveaux tests des styles : TEST
    RÉUSSI. Le panneau du coach à 360×640 (instabilité déjà connue) : 3/3 réussis en relance. Deux tests du coach IA
    (défilement des questions suggérées, double tap) : ÉCHOUÉ par intermittence, 1 réussite sur 3 relances chacun ;
    relancés aussi sur la v0.20.0 non modifiée, ils y échouent de la même façon (2 et 1 échecs sur 3) : défaut
    antérieur à ce lot, sur des écrans que ce lot ne touche pas, à corriger dans un lot dédié. Causes probables lues
    dans les journaux de test : le test touche la flèche « précédent » au moment où elle se désactive en fin de
    défilement, et l'historique est relu après un rechargement de page qui peut interrompre son enregistrement ;
    hypothèses non encore vérifiées ;
  - vrai téléphone Android : NON EXÉCUTÉ.
- **Restauration** : `restauration/lot-11`

## 2026-10-19 · v0.22.0 · Lot 12 : menu Progrès avec analyse temporelle

- **Demande** : refondre le menu Progrès en tableau de bord sans défilement, avec des périodes comparées à la période
  précédente de même durée, une jauge du parcours, des onglets et des données fiables.
- **Constat après vérification (audit de l'écran v0.21.0)** :
  - écran à faire défiler (tuiles, objectifs, graphique, listes, dernières séances), sans choix de période ;
  - totaux calculés sur toute l'histoire, sans comparaison ; graphique semaines / mois sans période précédente ;
  - données fiables à la source : le temps actif exclut les pauses (`useSession.ts`), une ligne par séance et par
    exercice, import sans doublon ;
  - deux limites : le nombre de séances ne distinguait pas les périodes, et rien ne mesurait la couverture du
    parcours (aucune mesure de maîtrise n'existe, et il n'en faut pas sans capteur).
- **Correction** :
  - `src/domain/progress.ts` (nouveau) : périodes 7 j, 30 j, 90 j, 12 mois (365 j) et personnalisée, période
    précédente de même durée, jours du calendrier local (changement d'heure compris), totaux sans double compte,
    écarts sans division par zéro (« Nouvelle activité », « stable » sous 5 %, « non comparable »), colonnes
    alignées entre les deux périodes, répartitions par niveau, catégorie et exercice, couverture du parcours ;
  - `src/ui/screens/progress/` (nouveau) : écran d'une seule hauteur (discipline, période, jauge, temps actif,
    séances, répétitions, zone de graphiques à 5 onglets), volets de détail (comparaison des 6 mesures, parcours,
    listes complètes, détail d'une séance), filtres niveau et catégorie, période personnalisée ;
  - `src/store/progressView.ts` (nouveau) : vue choisie mémorisée, séparée des séances ;
  - page « Objectifs » (`/objectifs`) : objectifs et techniques favorites conservés tels quels ;
  - couleurs : rouge (période actuelle) et bleu (période précédente) contrôlés pour le daltonisme et le contraste
    sur fonds sombre et clair ; états avec flèche et mots, jamais la couleur seule ;
  - `docs/PROGRES.md` : règles de calcul.
- **Limites** : la jauge compte les techniques pratiquées, pas leur maîtrise ; une combinaison personnelle supprimée
  ne permet plus de retrouver ses techniques (signalé dans le détail) ; téléphone couché : la page défile ; vrai
  téléphone Android : non vérifié.
- **Fichiers** : `src/domain/progress.ts`, `src/domain/__tests__/progress.test.ts`, `src/store/progressView.ts`,
  `src/account/scope.ts`, `src/ui/screens/progress/Dashboard.tsx`, `src/ui/screens/progress/charts.tsx`,
  `src/ui/screens/Stats.tsx`, `src/ui/App.tsx`, `src/ui/styles.css`, `tests/e2e/progress-dashboard.spec.ts`,
  `tests/e2e/progress-seed.ts`, `docs/PROGRES.md`.
- **Tests** :
  - `tsc` : TEST RÉUSSI ; tests unitaires : TEST RÉUSSI (337 réussis, 1 ignoré), dont 18 nouveaux sur les périodes
    (hausse, baisse, égalité, période précédente vide, période actuelle vide, période personnalisée, discipline,
    filtres, double compte, colonnes, parcours), passés dans 4 fuseaux horaires (Paris, New York, Tokyo, UTC) ;
  - nouveaux tests de bout en bout `progress-dashboard.spec` : les 10 cas demandés, dont l'absence de défilement
    vertical en 360×640, 360×740 et 412×915, thèmes clair et sombre, sur les 5 onglets ; plus le contraste avec
    données sur les 5 onglets : TEST RÉUSSI (17/17) ;
  - Playwright complet : 73 réussis, 3 échoués, 2 ignorés au premier passage. Deux échecs venaient de ce lot : le
    chiffre de la jauge était peint en SVG sans la couleur du texte, ce que le contrôle de contraste ne savait pas
    lire. Corrigé (couleur du texte appliquée), puis relance de `contrast`, `progress-dashboard`, `app` et
    `discipline-art` : 35/35 réussis. Le troisième est le double tap du coach IA, instable déjà avant ce lot :
    3/3 réussis en relance ;
  - vrai téléphone Android : NON EXÉCUTÉ.
- **Restauration** : `restauration/lot-12`

## 2026-10-19 · v0.23.0 · Lot 13 : refonte des coachs 3D (chevilles, rendu, vêtements, studio)

- **Constat** (vérifié par mesures et captures, rapport complet dans `docs/COACHS_3D_REFONTE.md`) :
  - chevilles hors de toute amplitude humaine : jusqu'à 109° de torsion pied/tibia au sol, 172° d'inversion en
    l'air, pied retourné de 145 à 175° sur le front kick avant ;
  - style Encre : hachures et lignes de pli sur la peau et le short (captures de Youssef) ;
  - style Réaliste : modèle séparé, sans la personnalisation du combattant ;
  - vêtements collés à la peau, sans épaisseur aux bords, peau ou short qui traversent le t-shirt, dents dans le
    bas du dos du t-shirt ;
  - studio : combattant petit, pieds cachés par la barre d'animation, zoom visage seulement.
- **Correction** :
  - limites des chevilles en convention vérifiée sur le rig (`src/engine/limits.ts`, `joints.ts`), angles du pied
    par phase pour les coups de pied, talon qui se lève au lieu d'une dorsiflexion impossible, correction de la
    torsion du genou ; test permanent `ankle-range.test` et mesures `docs/audit-biomecanique/MESURES_CHEVILLES.md` ;
  - nouveau rendu (réglage « Version du rendu 3D », Nouvelle par défaut, Précédente en secours) : Encre en ombrage
    net sans hachures ; Ultra-réaliste sur le même modèle, le même squelette, les mêmes animations et la même
    personnalisation, avec des matériaux physiques et un éclairage d'ambiance hors ligne ; changement de style sans
    recharger le coach ni interrompre la séance ;
  - choix du style dans les Réglages, le studio du coach et les options d'entraînement, mémorisé ;
  - vêtements : tissu lissé qui ne colle plus à chaque muscle, bords épais, peau et short cachés sous le haut,
    épaisseurs en couches, dents du dos supprimées ; l'ancien rendu garde les vêtements d'avant ;
  - studio : cadrage dans la zone libre (jamais sous les boutons), combattant plus grand, gros plans Visage, Buste,
    Jambes ;
  - aucune structure enregistrée modifiée : le nouveau réglage est complété par défaut sur les anciennes sauvegardes.
- **Limites** : volumes du corps toujours MakeHuman (relief en carte de normales) ; pas de plis modélisés ni de
  coutures ; bord de l'encolure encore irrégulier ; six techniques au sol hors amplitude du pied à plat (bornées
  par le test) ; amplitudes de référence citées de mémoire ; capture du front kick non reçue ; performances et
  rendu non vérifiés sur un vrai téléphone.
- **Fichiers** : `src/engine/rig.ts`, `src/engine/limits.ts`, `src/engine/joints.ts`, `src/engine/pose.ts`,
  `src/engine/motion.ts`, `src/engine/library/legs.ts`, `src/three/manga.ts`, `src/three/CoachModel.tsx`,
  `src/three/customize.ts`, `src/three/StudioEnvironment.tsx`, `src/three/StudioStage.tsx`,
  `src/three/CoachStage.tsx`, `src/store/settings.ts`, `src/ui/components/CoachLookPicker.tsx`,
  `src/ui/screens/coach/Preview.tsx`, `src/ui/Lab.tsx`, `tests/e2e/coach-render.spec.ts`,
  `docs/COACHS_3D_REFONTE.md`, `docs/captures-coachs/`.
- **Tests** :
  - `tsc` : TEST RÉUSSI ; tests unitaires : TEST RÉUSSI (348 réussis, 1 ignoré), dont `ankle-range.test` (amplitude
    des chevilles sur toutes les animations, front kick) et les nouveaux cas de `customize.test` (drapé borné, bords
    épais, peau et short cachés sous le haut, ancien rendu inchangé, aucune hachure dans le shader Encre) ;
  - nouveaux tests de bout en bout `coach-render.spec` (4) : choix du style dans les 3 écrans et mémorisé ;
    changement de style en pleine séance sans perte du chrono ni du mouvement ; studio : combattant entier dans la
    zone libre, au moins 80 % de sa hauteur, gros plans plus proches d'au moins 25 % ; détail fin de l'Encre
    inférieur à l'ancien rendu : TEST RÉUSSI ;
  - Playwright complet : 81 réussis, 1 échoué, 2 ignorés. L'échec est `training-layout` « demander au coach » en
    360×640 (panneau mesuré par-dessus les consignes) ; ce lot ne touche ni ce panneau ni sa mise en page ; relancé
    seul 3 fois : 3/3 réussis. Classé instable, à traiter avec le lot des tests instables du coach IA ;
  - intégration : validée par Youssef le 2026-10-19 (« Intégra la version principale »), `feature/combat-shadow-v2` avancée sur ce lot et appli principale publiée en v0.23.0 ;
  - comparaison visuelle : 30 planches avant/après sur 15 techniques et 2 coachs, regardées une à une ;
  - vrai téléphone Android (rendu, fluidité, mémoire) : NON EXÉCUTÉ.
- **Restauration** : `restauration/lot-13`

## 2026-10-20 · branche `feature/coachs-champions` (non publiée) · Vêtements en mouvement et rendu « Anime »

Demande de Youssef (08:00) : vêtements incorrects dans certaines positions, taches sur le corps en mode Encre,
renommer « Encre » en « Anime » et viser un anime japonais adulte de type Baki.

- **Constat 1, short (avant de la hanche, de profil, en garde)** : un trou laissait voir le fond. Cause : au pli de
  la hanche, quelques triangles du short se retournent ; le short n'était dessiné que sur sa face avant et la peau
  dessous est masquée. **Correction** : bas (shorts) dessinés sur les deux faces dans le rendu premium.
- **Constat 2, taches sur le corps (Encre/Anime)** : plaques sombres irrégulières sur le dos, les épaules, le
  ventre et pointillés sur le torse. Cause : l'ombrage et les reliefs cuits dans la texture de peau MakeHuman
  étaient découpés en aplats par l'ombrage cel ; les poils du torse étaient un semis de points. **Correction** :
  en mode Anime la couleur de peau est ramenée à un ton uni (`uFlat`), l'ombre franche est décidée par la forme du
  corps (normale géométrique) et non par le relief cuit, les muscles modèlent la lumière sans bord de ton, et les
  poils du corps deviennent un léger aplat.
- **Renommage** : l'option premium s'affiche « Anime » (sélecteur des réglages, studio, options d'entraînement).
  L'identifiant enregistré reste `encre` : aucune migration, aucun réglage utilisateur perdu.
- **Style Anime (nouveau shader `anime`)** : lumière latérale, ombre franche en deux tons froids/chauds, zone
  éclairée plus chaude, traits d'encre sur les plis marqués des muscles côté ombre, liseré de lumière, contour
  noir conservé. Utilisé pour tous les coachs en rendu premium (Encre affiché « Anime »).
- **Constat 3, brassière d'Amara en garde** : bretelles déchirées en plaques sur le haut des épaules et une
  plaque noire sur l'avant de l'épaule. Causes : la bande était aussi appliquée sur le haut du bras ; le passage
  avant/dos suivait la normale (qui bascule sur le trapèze) ; la bretelle passait au pied du cou, où le trapèze
  se plie quand les épaules montent. **Correction** : bande limitée au torse, avant/dos calculé par la position,
  bretelle décalée vers l'épaule sur le dessus. Dos et 3/4 avant nets ; un petit bord irrégulier reste visible de
  profil arrière.
- **Vérifié sur** : garde (0°, 40°, 90°, 180°), front kick, high kick, genou, sprawl, entrée en lutte, middle kick,
  Kadir et Amara, Anime et Ultra-réaliste. Essai écarté : ceinture du short remontée devant (créait une marche sur
  la ceinture en garde, sans gain en high kick).
- **Limites** : au high kick, l'intérieur de la jambe du short reste visible par l'ouverture (pas de tissu tendu
  simulé) ; bord de bretelle encore irrégulier de profil arrière ; non vérifié sur un vrai téléphone.
- **Fichiers** : `src/three/manga.ts`, `src/three/customize.ts`, `src/three/CoachModel.tsx`,
  `src/ui/components/CoachLookPicker.tsx`, `src/three/__tests__/customize.test.ts`, `tests/e2e/coach-render.spec.ts`.
- **Tests** : `tsc` : TEST RÉUSSI ; tests unitaires : TEST RÉUSSI (354 réussis, 1 ignoré), dont le shader `anime`
  sans dessin lié à l'écran (ni `gl_FragCoord` ni `fract`) ; Playwright complet : TEST RÉUSSI (82 réussis,
  2 ignorés), dont `coach-render.spec` adapté au libellé « Anime » ; comparaison visuelle : planches avant/après
  regardées une à une ; vrai téléphone : NON EXÉCUTÉ.

## 2026-10-20 · v0.24.0 · Kadir et Amara deviennent les coachs, écrans épurés

Demande de Youssef (10:08) : rester sur la technologie actuelle, se concentrer sur Kadir et Amara, appliquer toutes
les améliorations et générer la version suivante ; coachs premium, mouvements naturels, fluides et humains, sans
torsion non naturelle. Puis (10:09) : épurer les interfaces, expérience fluide, options qui ne surchargent pas les
écrans. Les autres coachs viendront en mises à jour après sa validation à 100 %.

- **Coachs** : le choix enregistré reste `homme` / `femme` (aucune migration, aucune donnée touchée) ; `homme`
  affiche Kadir « L’Aigle », `femme` affiche Amara « La Lionne » (`src/domain/coaches/catalog.ts`). Chacun garde son
  modèle, son visage, sa coiffure et ses couleurs, avec l’équipement de la discipline : gants de boxe et chaussures
  (boxe), gants et protège-tibias (kick-boxing), bandes et chevillères (muay-thaï), gants MMA (MMA), mains nues
  (BJJ, judo ; pas encore de kimono). Leur garde personnelle (mains ouvertes de Kadir, garde de face d’Amara)
  ne s’applique qu’en MMA ; les autres disciplines gardent la garde de leurs règles.
- **Écrans** : accueil (nom du coach, « Changer de coach »), choix du coach (portraits rendus depuis nos modèles),
  options d’entraînement (Kadir / Amara), Réglages (« Mon coach »), Profil (« Mon coach »).
- **Retiré de l’interface (décision de Youssef du 2026-10-19)** : l’onglet Coach de la barre du bas et l’étape
  « Apparence » du premier lancement. Le
  créateur de combattant reste dans le code et à son adresse, les combattants enregistrés ne sont ni modifiés ni
  effacés, et le rendu « Précédente (secours) » les affiche toujours.
- **Épuration** : la grille des disciplines n’est plus répétée sur l’accueil (elle est dans Entraîner) ; Entraîner
  montre 3 programmes et un bouton « Voir les N programmes » ; Réglages : voir plus bas ; fiche d’une technique : « Erreurs fréquentes » et « Points clés »
  repliables ; bouton de réalité augmentée raccourci en « AR ».
- **Vignettes** : les 75 techniques sont refaites avec Kadir et Amara dans l’équipement de la discipline.
- **Navigation et Coach IA (10:52)** : barre du bas Accueil, Entraîner, Techniques, Progrès, Légendes (les Légendes
  ont leur onglet). Le Coach IA devient une bulle en bas à droite (`src/ui/coach-ai/CoachBubble.tsx`) : un appui
  l’ouvre, un autre (ou Échap) la masque ; absente de l’écran d’entraînement, qui a son propre bouton Coach.
- **Icônes de la planche v2 (10:33, 10:53)** : chaque icône porte un rôle de couleur (`ICON_ROLE` dans
  `src/ui/icons/registry.ts` : rouge entraînement, or distinctions, vert fait, bleu adapté, orange à revoir), appliqué
  dans la navigation, les tuiles, les titres de panneaux et les lignes de réglages ; les boutons gardent leur couleur.
  Niveaux colorés comme la planche (débutant gris, intermédiaire or, avancé rouge, expert violet). Contraste des
  couleurs de rôle vérifié par test (≥ 3:1 sur les deux thèmes).
- **Réglages (captures de référence de Youssef, 10:57)** : résumé du profil en quatre informations, puis des listes
  groupées ; Voix et sons, Rounds, Affichage 3D et Données passent dans des sous-pages (`/reglages/:section`). Rien
  n’est supprimé : tous les réglages existants y sont.
- **Catalogue des techniques** : grandes vignettes sur deux colonnes (trois sur grand écran), nom seul ; la
  description reste sur la fiche.
- **Assimilée / Encore du mal (10:59, option F choisie à 11:05)** : petit interrupteur ✓ | ↻ à côté de la barre de
  lecture d’une fiche ; un nouvel appui annule, les deux états ne sont jamais actifs ensemble ; liseré vert ou orange
  sous la vignette ; filtre « À revoir (n) » ; onglet « Maîtrise » dans Progrès (assimilées, à revoir, non évaluées,
  liste des techniques à revoir). Stocké sur l’appareil dans `css-goals.mastery` (nouveau champ, valeur par défaut
  vide, aucune donnée existante modifiée) ; « Tout effacer » le vide aussi.
- **Séance : coach plus visible (11:09)** : pendant le travail, seul le point clé du moment reste sous le coach ; la
  liste complète revient avant le départ, en pause et dans « Comment faire ? ». Le coach gagne environ 60 px de haut
  sur un écran de 400 × 860.
- **Torsions non naturelles (demande de 10:08)** : rotations mesurées sur les deux squelettes, pour 1512 animations
  (toutes les techniques solo, chaque style, orthodoxe et gaucher) ; avant : jusqu’à 135° de rotation de hanche en trop
  (cuisse retournée sur les coups de pied circulaires), 109° de rotation interne d’épaule, 32° de supination, 43°
  d’inclinaison du poignet. Corrigé à la source dans `src/engine/rig.ts` (limites de rotation d’épaule et de hanche,
  pronation partagée avant-bras / main, poignet plié autour de son axe anatomique, rotation du tronc répartie sur
  trois vertèbres), `motion.ts`, `pose.ts` (signe de l’inclinaison latérale inversé dans le commentaire, d’où des
  coups de pied circulaires penchés du mauvais côté) et la bibliothèque. Après : tout dans les amplitudes humaines à
  3° près. Nouveau test bloquant `src/engine/__tests__/torsion-range.test.ts`, rapport
  `docs/audit-biomecanique/MESURES_TORSIONS.md` (amplitudes de référence citées de mémoire, à revérifier dans les
  ouvrages). Arrêts « robotiques » : 318 → 210. Les vignettes sont refaites avec ces mouvements.
- **Textes pour débutants (11:08)** : 527 textes explicatifs réécrits sur un ton léger et pédagogique (fiches,
  guides pas à pas, consignes d’entraînement, techniques avec partenaire, programmes, styles de kick-boxing) ;
  identifiants, noms, annonces vocales, chiffres et sources inchangés ; consignes de sécurité et corrections sourcées
  de l’audit conservées. Low kick : la surface de contact est maintenant la même partout (milieu du tibia, comme le
  point clé sourcé ; le guide et la consigne disaient « bas du tibia »).
- **Coach IA selon l’écran (11:26)** : le coach sait sur quel écran il est ouvert (27 écrans) et propose d’abord des
  questions sur cet écran ; nouveau guide local de l’application (`src/coach/appGuide.ts`, 44 sujets écrits à partir
  du code des écrans) avec un bouton pour y aller ; « À quoi sert cet écran ? », « Par où commencer ? » et
  « Comment marquer une technique ? » ont une réponse. Tout reste calculé sur l’appareil.
- **Tests** : unitaires (vitest) 391 réussis, 1 ignoré (existant), 0 échec — TEST RÉUSSI. Playwright complet :
  83 réussis, 2 non exécutés (émulateurs Firebase absents, NON EXÉCUTÉ), 2 échecs corrigés (libellé « Mon profil et
  mon compte » remis dans les Réglages ; test Accueil des icônes de discipline ramené à 1, la grille ayant été retirée
  de l’accueil sur décision du 2026-10-20, raison écrite dans le test) ; 2e passage sur les 10 fichiers touchés par les
  textes et le Coach IA après ces corrections : 53 réussis, 2 non exécutés (Firebase), 0 échec — TEST RÉUSSI.
  Nouveaux tests : torsion-range (moteur), mastery (store, domaine, e2e), coach-bubble (e2e), appGuide (coach),
  rôles de couleur des icônes. Validation sur téléphone : NON EXÉCUTÉ (à faire par Youssef).
- **Publication** : directement comme version principale (demande de Youssef, 11:01).

## 2026-10-20 · v0.25.0 · Coach IA partout, navigation entre techniques, rendu des coachs, démarrage

Demandes de Youssef (12:30 et 12:32). APK de test 0.24.0 publié avant ce lot (pré-version GitHub v0.24.0).

- **Bulle Coach IA identique partout** — Constat : l’écran d’entraînement avait son propre bouton « Coach » et son
  panneau, la bulle était cachée sur 6 écrans. Correction : une seule bulle (store `src/ui/coach-ai/coachHost.ts`) ;
  l’entraînement s’enregistre comme « hôte » (contexte + actions démo/ralenti/répéter sur le lecteur, pause à
  l’ouverture). Cachée seulement sur l’accueil de bienvenue, la page Coach IA et le labo. Fichiers : CoachBubble.tsx,
  coachHost.ts, Training.tsx, training.css.
- **Technique précédente / suivante** — Correction : flèches + « 3 / 28 » sous la scène 3D, balayage horizontal hors
  scène 3D, ordre de la liste d’origine (discipline, style, catégorie, « À revoir » via `?cat=`), Retour revient au
  catalogue. Fichiers : Library.tsx, techniqueOrder.ts (+ test unitaire).
- **Légendes : s’entraîner sans défiler** — Constat (393×851) : bouton à 1777 px sur une fiche combo, absent de la
  liste et des pages champion. Correction : carte « Ton combo du jour » en haut de la liste, bouton lecture sur chaque
  ligne, carte de départ sous le titre (mode Libre par défaut, « Changer »), barre collante au défilement. Rien
  supprimé. Fichiers : Champions.tsx, styles.css, appGuide.ts.
- **Taches sur le corps en mode Anime (Amara)** — Constat vérifié : l’ombre franche suivait les normales de chaque
  bosse musculaire et formait des îlots sombres (texture, peinture du visage, carte de relief écartées par mesure).
  Correction : normales lissées sur ~4,5 cm pour l’ombrage anime (`shadeNormals`, src/three/manga.ts).
- **Vêtements du mode Ultra-réaliste** — Constat : shorts plats et « plastique », taille froissée, liseré blanc sur
  les bords, points clairs le long des bretelles. Correction : tissu (plis, maille, côtes de ceinture, coutures,
  surpiqûres, ourlet), brillance de tissu, bords nets, peau cachée plus large sous la brassière. Fichiers :
  customize.ts, CoachModel.tsx (+ 6 tests).
- **Image au démarrage** — Constat : l’APK montrait l’écran de démarrage et l’icône Capacitor par défaut (croix bleue
  sur blanc) ; le web montrait une silhouette grise. Correction : logo CS sur fond sombre (splash Android toutes
  densités, Android 12+, icônes de l’appli), logo affiché dans la page avant le chargement, anneau de chargement
  à la place de la silhouette.
- **Test instable de l’historique du Coach IA** — Constat : le réglage « Garder l’historique » est écrit de façon
  asynchrone ; le test rechargeait l’appli avant l’écriture. Correction : le test attend l’écriture ; l’appli
  attend aussi la relecture des réglages avant d’enregistrer une question posée dès l’ouverture.
- **Tests** : tsc OK ; Vitest 401 réussis, 1 non exécuté — TEST RÉUSSI. Playwright complet : 97 réussis, 1 échec
  (double tap historique, corrigé puis 5/5), 2 non exécutés (Firebase) ; relance coach-suggest + coach-bubble +
  theme : 18 réussis — TEST RÉUSSI. Nouveaux : technique-nav, legendes-quick-start. Validation sur téléphone :
  NON EXÉCUTÉ.
- **Limites** : bretelles de brassière qui se déchirent sur le trapèze en garde (connu) ; vignettes des techniques
  non régénérées (léger écart de rendu Anime) ; icônes flottantes en attente du choix de Youssef.

## 2026-10-20 · v0.26.0 · Pilule d’actions (icônes flottantes selon l’écran)

Demande de Youssef (12:32 « toute l’appli doit être ludique et facile à manipuler », 12:34 « un système d’icônes
flottantes […] qui permettrait de lancer les actions les plus courantes ; les icônes changent en fonction du
contexte de l’écran ; icône claire »). Maquette C « Pilule d’actions » choisie à 17:45.

- **Pilule d’actions** — Constat : les actions courantes étaient dispersées (bouton en haut de page, barre collante
  sur les fiches Légendes, filtres dans les puces). Correction : une pilule sombre (#1F2937, bord #374151, 64 px de
  haut) en bas à gauche, au-dessus de la navigation et centrée sur la ligne de la bulle Coach IA, qui reste seule en
  bas à droite (aspect et position inchangés). 2 à 3 boutons ronds (4 au plus), icône + mot, l’action la plus utile
  en rouge (#E11D2F, texte blanc) et toujours en premier. Vrais boutons, nom accessible qui commence par le mot
  affiché, état « appuyé » annoncé pour les actions on/off, focus visible, cibles ≥ 44 px. Thème clair : pilule
  blanche. Elle passe sous les feuilles (z-index 29) et se cache tant que le panneau du Coach IA est ouvert. Un seul
  composant et un petit store : chaque écran déclare ses actions (`useActionPill`, comme `coachHost` pour la bulle) ;
  un écran qui ne déclare rien n’a pas de pilule. Enregistrement en effet de mise en page : la pilule d’un écran
  disparaît dès qu’il est masqué par le chargement de l’écran suivant (constaté pendant les tests : la pilule de la
  fiche restait affichée pendant « Chargement… »). Fichiers : components/ActionPill.tsx, components/actionPill.ts,
  App.tsx, styles.css.
- **Actions par écran** (aucune fonction inventée, aucune donnée inventée) :
  - Accueil : « Séance rapide » (rouge, même action que « Commencer l’entraînement »), « Reprendre » (seulement s’il
    y a une dernière séance reprenable, même lien que la carte « Reprendre »), « Technique du jour » (une technique
    de la discipline principale, la même toute la journée, jamais une technique réservée au travail avec partenaire ;
    `src/domain/quickPicks.ts`).
  - Techniques (onglet Techniques) : « Au hasard » (rouge, ouvre une technique de la liste affichée, dans l’ordre de
    cette liste pour les flèches de la fiche) et « À revoir » (filtre, seulement s’il y a des techniques à revoir).
    Pas de « Rechercher » : le catalogue n’a pas de recherche texte. Autres onglets : pas de pilule.
  - Fiche technique : « S’entraîner » (rouge, l’exercice du programme qui travaille le plus directement cette
    technique, mode Technique ; absent si aucun exercice ne la contient), « Ralenti » (×0,25 sur la fiche, un nouvel
    appui rend la vitesse d’avant), « Je la maîtrise » (la coche « Assimilée » de l’interrupteur, même état).
  - Légendes (liste) : « S’entraîner » (rouge), « Combo du jour » (remet le combo du jour dans la carte), « Au
    hasard » (en tire un autre). Page d’un champion : « S’entraîner », « Au hasard ». Fiche d’une combinaison :
    « S’entraîner » (mode choisi) et « Décomposer ».
  - Progrès : « Nouvelle séance » (rouge, onglet Entraîner ; « Nouvelle activité » de la maquette est dans
    l’application une étiquette de comparaison, pas une action), « Objectifs », « Période » (feuille des dates
    personnalisées, comme la puce « Perso »). Le tableau de bord garde son écran sans défilement, au-dessus de la
    pilule (hauteur − 80 px, minimum 460 px).
  - Entraînement : pas de pilule. Raison : les commandes du studio sont 9 (Démarrer/Pause/Reprendre, Recommencer,
    exercice précédent et suivant, Décomposer, Comment faire ?, Ralenti, Paramètres, Caméra) ; une pilule de 4
    boutons ne peut pas les remplacer sans en perdre, et ajoutée par-dessus elle couvrirait la scène ou les
    commandes de l’écran sans défilement (training-layout.spec). L’écran reste tel quel.
  - Réglages, profil, accueil de bienvenue, page Coach IA, labo, Entraîner : pas de pilule.
- **Boutons remplacés** — Légendes : la barre collante « S’entraîner » de la fiche combinaison (0.25) est remplacée
  par la pilule ; dans la carte de démarrage rapide (liste et page champion), « S’entraîner » et « Une autre au
  hasard » passent dans la pilule (mêmes actions, mêmes identifiants de test), la carte garde le nom et « Voir la
  fiche ». Aucune fonction supprimée. Gardés volontairement malgré le doublon : « Commencer l’entraînement » et la
  carte « Reprendre » de l’accueil, la puce « À revoir », l’interrupteur de maîtrise (il a aussi « Encore du mal »),
  le bouton Objectifs de l’en-tête de Progrès, le grand « S’entraîner » en haut d’une fiche combinaison (il montre le
  mode).
- **Icône** : nouvelle icône originale `random` (dé), registre et inventaire (`docs/icones/INVENTAIRE.md`) à jour.
- **Coach IA** : nouvelle entrée du guide « La pilule d’actions en bas à gauche » (écran par écran, ton débutant) ;
  réponses Légendes mises à jour. Fichiers : src/coach/appGuide.ts (+ test).
- **Tests** : tsc OK — TEST RÉUSSI. Vitest : 411 réussis, 1 non exécuté (existant), 1 échec
  `coach.test.ts › store coachAi › historique plafonné` — ÉCHOUÉ, existant : il échoue aussi seul sur la v0.25.0
  sans ce lot (test synchrone face à la relecture asynchrone des réglages ajoutée en 0.25) ; non modifié ici.
  Nouveaux tests unitaires : actionPill (règles de la liste), quickPicks (technique du jour, exercice d’une
  technique), guide (chaque mot de la pilule est un vrai bouton) — TEST RÉUSSI. Playwright complet (116) : 113
  réussis, 2 non exécutés (émulateurs Firebase, NON EXÉCUTÉ), 1 échec — contraste du bouton « Voir la fiche » de la
  carte Légendes (bordure claire mesurée sur fond en dégradé, 1,43:1) ; corrigé (bouton plein, sans icône), puis
  contrast + legendes-quick-start + action-pill relancés : 27 réussis — TEST RÉUSSI. training-layout (y compris
  « demander au coach ») et coach-suggest réussis au premier passage. Nouveau : tests/e2e/action-pill.spec.ts
  (16 tests : actions par écran, rouge en premier, chaque action, absence sur réglages/profil/coach IA/entraînement/
  bienvenue, placement 360×640, 393×851, 412×915, paysage 851×393, contenu atteignable, clair/sombre, clavier).
  legendes-quick-start : le test de la barre collante vise maintenant le « S’entraîner » de la pilule (raison écrite
  dans le test). Captures 393×851 : accueil, catalogue, fiche, entraînement, Légendes, Progrès (sombre et clair).
- **Limites** : pas de validation sur téléphone (NON EXÉCUTÉ, à faire par Youssef) ; « Technique du jour » est un
  choix du jour parmi les techniques existantes (pas une recommandation pédagogique) ; sur l’accueil et la fiche
  combinaison, l’action rouge de la pilule existe aussi en grand dans la page ; la recherche du catalogue n’existe pas,
  donc pas de bouton « Rechercher ».
- **Vérification finale avant publication** : test unitaire du store Coach IA (« historique plafonné ») corrigé — il
  lit maintenant les réglages enregistrés avant d’écrire, comme l’appli au démarrage depuis la 0.25 ; Vitest 412
  réussis, 1 non exécuté, sur 3 passages — TEST RÉUSSI. Playwright complet après le correctif de contraste : 113
  réussis, 2 non exécutés (Firebase), 1 échec — training-layout « demander au coach » (instable connu depuis la
  0.23) ; relancé seul 5 fois : 4 réussis, 1 échec — instabilité à traiter dans un lot dédié.


## 2026-10-21 · v0.27.0 · Coach IA dans la pilule, IMC du profil, studio qui suit le thème, fenêtre du coach, plein écran au double tap

Demandes de Youssef du 2026-10-20 : 21:45 « Il faut intégrer le coach ia dans la barre d'icône dynamique. Il faut
prévoir une option pour enrôuler dérouler. … Intègre aussi un calcul imc auto avec recommandation et jauge dans le
profil » ; 21:48, choix « Suit le thème » pour le fond du studio d’entraînement ; 21:56 « Retire légendes des
techniques vu qu'ils ont leur menu » ; 21:59 « Permet d'agrandir la fenêtre ia et de la réduire. Rends la stylé » ;
22:09 « Un double clique sur la fenêtre du coach permet un plein écran total, étudie et fait le intelligemment et de
manière user friendly ».

- **Coach IA dans la pilule** — Constat : deux points d’entrée flottants (pilule à gauche, bulle à droite) sur les
  écrans à pilule. Correction : sur l’accueil, les Techniques, la fiche technique, les Légendes et Progrès, le
  dernier bouton de la pilule est « Coach » (icône coach + mot, doré comme l’identité du coach, séparé des actions
  de l’écran par un filet) ; il ouvre exactement le même panneau Coach IA avec le même contexte d’écran (questions de
  l’écran, technique, discipline, actions). La bulle n’est alors pas dessinée (un seul point d’entrée). Ouvert depuis
  la pilule, le panneau descend à la place de la pilule (cachée pendant ce temps, règle de la 0.26) ; à la
  fermeture (bouton ou Échap), le focus revient sur « Coach ». Sans pilule (réglages, profil, connexion, page Coach,
  Entraîner, entraînement…), la bulle reste inchangée, y compris l’hôte de l’entraînement (pause à l’ouverture,
  actions sur le lecteur). Sans bulle à côté, la pilule peut prendre toute la largeur ; sur petit écran un mot long
  passe sur deux lignes au lieu de déborder. Fichiers : components/ActionPill.tsx, coach-ai/CoachBubble.tsx,
  styles.css.
- **Replier / déplier la pilule** — Un petit chevron (icône originale `fold`) au bout droit replie la pilule en une
  poignée ronde (58 px, icône originale `quickActions`, en bas à gauche au-dessus de la navigation) ; la poignée la
  déplie. Même bouton dans les deux états (le focus reste dessus), `aria-expanded`, « Replier les actions » /
  « Déplier les actions », animation courte, rien sous `prefers-reduced-motion`. Le choix est un réglage de
  l’utilisateur (`actionPillCollapsed`, défaut déplié, ajouté par `merge` aux réglages déjà enregistrés, aucune clé
  supprimée). Fichiers : store/settings.ts (+ test), icons/glyphs.tsx, icons/registry.ts.
- **IMC dans le profil** — Fonction pure `src/domain/bmi.ts` : IMC = poids (kg) / taille (m)², arrondi à une
  décimale ; catégories adultes de l’OMS lues sur la valeur affichée (< 18,5 insuffisance pondérale ; 18,5 à 24,9
  corpulence normale ; 25 à 29,9 surpoids ; 30 à 34,9 / 35 à 39,9 / ≥ 40 obésité classes I, II, III), un conseil
  d’entraînement bienveillant par catégorie (progressivité, hydratation, avis d’un médecin pour les valeurs basses ou
  hautes), aucun chiffre inventé. Toujours affiché : l’IMC ne distingue pas muscle et graisse (les combattants
  musclés sont souvent « surpoids »), ne vaut ni avant 18 ans ni pendant une grossesse. Âge < 18 (date de naissance
  ou âge du profil) : la valeur, sans catégorie ni jauge, avec « l’échelle adulte ne s’applique pas ». Mesure
  manquante : une indication ; hors plage plausible (taille 100 à 250 cm, poids 25 à 300 kg) : « Vérifie ta taille et
  ton poids ». Carte « Ton IMC » sous la taille et le poids (mise à jour à la saisie) : valeur, badge de catégorie,
  jauge 15 → 40 à zones colorées (jetons existants info/ok/warn/orange) et nommées dans une légende, repère avec le
  nombre, `role="meter"` avec `aria-valuetext` (« IMC 23,1 : corpulence normale »). Les mesures restent dans le profil
  local. Guide du Coach IA : nouvelle entrée « Ton IMC dans le profil ». Fichiers : domain/bmi.ts (+ test),
  screens/account/BmiCard.tsx, Profile.tsx, account.css, coach/appGuide.ts (+ test).
- **Studio d’entraînement qui suit le thème** — Constat : studio toujours blanc. Correction (choix de Youssef
  21:48) : thème sombre anthracite (#0B0F14, halo discret au sol), thème clair gris perle (#EEF0F3 → #E3E6EA), unis
  et sobres. Les alias de couleur du studio sont redéfinis par thème ; les surfaces propres au studio (boutons sur la
  scène, étiquette de phase, feuilles, légende des repères) passent par des jetons `--tr-*`. Le canvas 3D est
  transparent au-dessus du fond de la scène (backdrop `theme` de CoachStage), avec l’éclairage sombre du héros de
  l’accueil en thème sombre ; repères au sol neutres éclaircis sur sol sombre. Barre d’état : #0B0F14 / #EEF0F3
  (index.html avant le premier affichage et App.tsx). Corrigé au passage : la règle de la puce chronomètre de la RA
  s’appliquait à tout le studio (texte clair sur blanc en sombre) ; elle est limitée au calque RA. Fichiers :
  training/training.css, three/CoachStage.tsx, three/GroundMarks.tsx, theme/theme.ts, App.tsx, index.html,
  screens/Training.tsx.
- **Légendes retirées de Techniques** — La section « Légendes » de l’onglet Techniques est supprimée (cinq sections :
  Techniques, Combinaisons, Créateur, Favoris, Programmes) ; l’ancien lien `/techniques?tab=legendes` redirige
  (remplacement) vers l’onglet Légendes. Guide du Coach IA mis à jour. Fichiers : screens/Library.tsx,
  coach/appGuide.ts.
- **Fenêtre du Coach IA : trois tailles, nouveau style** — Réduit (première ligne de la réponse et le champ, le coach
  reste visible), normal, agrandi (presque tout l’écran au-dessus de la navigation ; à l’entraînement, toute la
  scène, séance en pause). Boutons de l’en-tête avec icônes originales `panelShrink` / `panelExpand`, « Réduire la
  fenêtre du coach » / « Agrandir la fenêtre du coach », `aria-expanded`, `aria-disabled` aux extrémités (le focus
  ne se perd pas) ; glisser la poignée vers le haut / le bas ; double tap sur l’en-tête : normal ↔ agrandi. Taille
  mémorisée (`coachPanelSize`, défaut normal, valeur inconnue ramenée à normal). Style : verre sombre (#111720 à
  94 %, flou si disponible, opaque sinon) en thème sombre, blanc givré en thème clair ; liseré doré en haut, pastille
  coach dorée, coins 20 px, réponse sur fond plein avec filet doré, cartes de suggestions arrondies, petit ressort
  court à chaque changement de taille, rien sous `prefers-reduced-motion`. « Historique » devient une icône (même
  lien, nom accessible « Historique et réglages du coach »). Tous les identifiants de test sont gardés
  (`coach-expand` est le bouton Agrandir). Fichiers : coach-ai/CoachAskPanel.tsx, coachAi.css, CoachBubble.tsx,
  styles.css, training.css.
- **Plein écran total au double tap** (interprétation par défaut, à confirmer par Youssef) — Un double tap rapide
  (2 appuis < 300 ms d’écart, < 10 px de mouvement, appui < 280 ms, jamais à deux doigts, jamais sur un bouton ou le
  panneau du coach) sur une vue 3D du coach (entraînement, fiche technique, héros de l’accueil, atelier du
  combattant) affiche cette vue seule sur tout l’écran : API plein écran (repli webkit), et sinon (iPhone Safari) un
  calque fixe qui couvre navigation et pilule. Le canvas se redimensionne et le cadrage suit. Les commandes posées
  sur la vue s’effacent après 2,5 s et reviennent d’un tap ; sortie par le bouton « Quitter le plein écran » (icône
  originale `exitFullscreen`), Échap, un nouveau double tap, ou le bouton retour d’Android (traité avant de quitter
  la page). À l’entraînement, c’est le mode immersif existant qui devient ce plein écran total (un seul mode, même
  bouton) : la séance continue, le bouton principal flotte en bas de la scène. Le glisser pour tourner, le pincer
  pour zoomer et le balayage entre fiches ne déclenchent rien. Astuce unique « Astuce : touche deux fois le coach
  pour le plein écran », fermable, mémorisée (`stageFsHintSeen`), aussi marquée vue au premier double tap.
  Fichiers : fullscreen/doubleTap.ts (+ test), fullscreen/useStageFullscreen.ts, fullscreen/FullscreenStage.tsx,
  platform/native.ts, screens/Home.tsx, screens/Library.tsx, screens/coach/Preview.tsx, coach-studio.css,
  screens/Training.tsx, training.css, styles.css, coach/appGuide.ts.
- **Tests** : tsc -b OK — TEST RÉUSSI. Vitest : 430 réussis, 1 non exécuté (existant) — TEST RÉUSSI ; nouveaux :
  domain/bmi (8 : calcul, catégories OMS, limites, mineurs, données manquantes ou hors limites), fullscreen/doubleTap
  (8 : double tap, appuis lents, glisser, appui long, second doigt), réglages (pilule repliée, taille du coach,
  astuce, valeurs anciennes ou inconnues), guide (IMC, pilule, plein écran, plus de « Légendes » dans Techniques).
  Playwright complet (134) : 130 réussis, 2 non exécutés (émulateurs Firebase, NON EXÉCUTÉ), 2 échecs liés aux
  tests eux-mêmes — action-pill « replier / déplier » (poignée mesurée en pleine animation, puis rechargement avant
  la fin de l’enregistrement) et coach-panel-size « à l’entraînement » (rechargement avant l’enregistrement de la
  taille) ; corrigés en attendant la fin de l’animation et l’enregistrement (aucune vérification retirée), puis
  action-pill + coach-panel-size relancés : 22 réussis + « replier » 3 fois sur 3 — TEST RÉUSSI. training-layout (y
  compris « demander au coach ») réussi au premier passage. Nouveaux ou étendus : action-pill (Coach dans la
  pilule, bulle absente des écrans à pilule, replier/déplier mémorisé et au clavier), coach-bubble (commentaires
  Youssef 2026-10-20 21:45 et 21:56 : bulle remplacée par « Coach » sur les écrans à pilule, onglet Légendes retiré
  de Techniques et redirection), theme (studio clair #eef0f3 / sombre #0b0f14, balise theme-color, canvas
  transparent), profile-imc (nouveau), coach-panel-size (nouveau), fullscreen-dbltap (nouveau, 7 tests : accueil,
  fiche, entraînement 360×640 et paysage 740×360, glisser, appuis lents, astuce mémorisée). Captures 393×851 sombre
  et clair : accueil (pilule, pilule repliée, astuce, coach ouvert, réduit, agrandi, plein écran), profil (IMC),
  entraînement avant/après, coach réduit/normal/agrandi à l’entraînement, plein écran avec et sans commandes.
- **Limites** : pas de validation sur téléphone (NON EXÉCUTÉ, à faire par Youssef), en particulier le plein écran
  natif sur Android et le calque de repli sur iPhone (l’API plein écran n’y existe pas pour un élément) ; le double
  tap est mon interprétation de « double clique sur la fenêtre du coach » (vue 3D du coach = plein écran ; en-tête de
  la fenêtre Coach IA = normal ↔ agrandi) — à confirmer ; dans les tests (rendu logiciel lent), la sortie par le
  bouton se fait au clavier car les commandes s’effacent avant le clic ; l’IMC reste un repère pour adultes, sans
  avis médical, et le texte « Facultatif… aucune conclusion sur ta santé » du profil est conservé tel quel ; les
  catégories d’IMC des moins de 18 ans (courbes de croissance) ne sont pas calculées.
- **Vérification finale** : en plein écran à l’entraînement, la bulle du coach chevauchait le bouton « Reprendre » ;
  elle est remontée juste au-dessus. fullscreen-dbltap + training-layout + coach-bubble relancés : 24 réussis —
  TEST RÉUSSI ; tsc et Vitest repassés après ce lot.

## 2026-10-21 · v0.27.0 (en préparation) · Questions du Coach IA variées

Demande (Youssef, 2026-10-20 22:00) : « Les questions pre programme ia doivent êtres diverses et variés pour que le
user n'ai pas une impression de répétition ».

- **Constat (mesuré sur la v0.26.0)** — les questions suggérées étaient fixes : le même contexte donnait toujours la
  même liste. Sur 10 ouvertures de suite du panneau sur le direct arrière en MMA : 8 questions différentes sur 80
  affichées (10 %). Sur les 189 couples technique × discipline de l’écran d’entraînement : 1 386 questions affichées,
  248 différentes (17,9 %) ; « À quoi sert le bouton Décomposer ? » dans 189 séries sur 189, « Comment revenir
  rapidement en garde ? » dans 140, « Où placer ma main avant ? » dans 131, « Comment éviter de perdre l’équilibre ? »
  dans 94. Sur les 27 écrans sans technique : 1 ou 2 questions d’écran, suivies des 4 mêmes exemples généraux partout.
  Même gabarit pour toutes les techniques (« Quelles erreurs éviter sur… », « Explique-moi… », « Montre-moi… au
  ralenti »).
- **Correction**
  - Banque de questions (src/coach/questionBank.ts) : 19 catégories (forme, erreurs, pourquoi, respiration, garde,
    déplacements, puissance, vitesse, équilibre, combinaisons, démo, comparaison, sécurité/échauffement,
    récupération, mental, progrès/objectifs, règlements, Légendes, application), environ 190 gabarits et
    formulations au ton léger et varié (pas seulement « Comment… ? »), plus des questions construites selon le
    contexte : technique « à revoir », style de kick-boxing choisi, garde gaucher, niveau, heure (« Que travailler
    ce soir ? »), dernière séance (récupération le jour même, reprise après plusieurs jours), objectifs du profil.
    Chaque écran a 1 à 5 questions d’application (guide existant).
  - Choix (src/coach/suggest.ts) : la plus pertinente devant (sur la technique à l’écran, ou sur l’écran ; sur une
    fiche technique, la question « assimilée » reste en tête), puis une question d’écran non vue récemment, puis un
    mélange : 2 questions au plus par catégorie, une seule question par réponse (deux formulations d’une même
    entrée ne se suivent jamais), toujours un « Montre-moi… » avec une technique. Les questions montrées récemment
    sont reculées (liste « vues » de 60 questions, par utilisateur, nouveau champ `recentSuggestions` du store du
    coach, vide par défaut pour les anciennes sauvegardes, jamais écrit avant la relecture des réglages) ; une
    graine du jour et de l’ouverture départage les questions de même poids. Les questions déjà posées restent
    retirées comme avant. Au tout premier affichage, l’ordre reste celui des questions du pratiquant (les six du
    direct en MMA, le sprawl…).
  - Toujours une vraie réponse : chaque question n’est proposée que si le moteur local y répond depuis la source
    promise (fiche, FAQ, guide, exercice contenant la technique, règlements, bibliothèque des champions), vérifiée
    à la demande et mise en cache. Nouvelles réponses du moteur, sans rien inventer : « Le low kick, c’est permis en
    full contact ? » répond d’après src/domain/kickboxingStyles.ts (statut et note de chaque style) ; « Quelle
    légende utilise souvent le jab ? » répond d’après la bibliothèque des champions (style, traits, nombre de fiches,
    avec le rappel « inspirées du style »), et renvoie au guide Légendes si la bibliothèque n’est pas chargée.
    Quatre entrées générales prudentes ajoutées à la FAQ (src/coach/faqMore.ts) : rester motivé, régularité, quand
    on stagne, un objectif par séance.
  - Panneau : un crochet `useSuggestionMemory` (nouveau fichier) fournit la mémoire et le contexte ; dans
    CoachAskPanel.tsx, l’appel à suggestedQuestions est remplacé par `memo.pick(...)` (import, une ligne de
    crochet, corps du useMemo, dépendance) ; les 4 exemples généraux ne sont plus ajoutés après les questions
    d’écran (ils se répétaient partout).
- **Après (mesuré)** — 10 ouvertures de suite : direct MMA, jab boxe, middle kick, genou muay-thaï, sprawl : 67
  questions différentes sur 80 (84 %) ; accueil 80 %, réglages 80 %, progrès 75 %, profil 75 % ; jiu-jitsu (shrimp)
  60 %, judo (tai-sabaki) 59 %. Deuxième ouverture de suite : 8 questions nouvelles sur 8 (7 sur 8 sur le profil).
  Parcours des 189 techniques avec la mémoire : 712 questions différentes sur 1 512 (47,1 %, contre 17,9 %), la
  plus fréquente 21 fois (contre 189). Réservoir vérifié pour le direct en MMA : 86 questions répondues dans 18
  catégories.
- **Fichiers** : src/coach/questionBank.ts (nouveau), src/coach/faqMore.ts (nouveau), src/coach/suggest.ts,
  src/coach/engine.ts (réponses règlements et Légendes), src/coach/nlu.ts (intentions `rules` et `legend`),
  src/coach/knowledge.ts (inclut faqMore), src/store/coachAi.ts (`recentSuggestions`, `noteSuggestions`),
  src/ui/coach-ai/useSuggestionMemory.ts (nouveau), src/ui/coach-ai/CoachAskPanel.tsx (quelques lignes),
  src/coach/__tests__/suggest.test.ts, tests/e2e/coach-suggest.spec.ts.
- **Tests** : `npx tsc -b` — TEST RÉUSSI. Vitest complet : 424 réussis, 1 non exécuté (existant), sur 2 passages —
  TEST RÉUSSI (un premier passage avec un test de suggestions plus lourd faisait dépasser les 5 s à deux tests
  d’animation lancés en parallèle ; test allégé, la couverture reste tous écrans × toutes techniques). Nouveaux tests
  (src/coach/__tests__/suggest.test.ts, 23) : chaque question suggérée, pour tous les écrans × toutes les techniques
  (et sans technique) × 3 variantes de graine et de contexte, reçoit une réponse non générique de la source promise,
  qui nomme la technique ; 10 ouvertures ≥ 60 % de questions différentes (≥ 50 % jiu-jitsu/judo) ; 2 ouvertures de
  suite ≥ moitié nouvelles ; 2 au plus par catégorie, pas de doublon de formulation ni de réponse, toujours un
  « Montre-moi » ; première question sur la technique, même après rotation ; six questions du pratiquant (direct
  MMA) et mots du sprawl présents au premier affichage quelle que soit la graine ; règlements et Légendes ; mémoire
  « vues » (plafond, migration). Playwright coach-suggest + coach-bubble + training-layout (port 4299) : 24 réussis
  — TEST RÉUSSI (un passage lancé en même temps que Vitest a échoué par saturation de la machine, relancé seul).
  coach-suggest : le test « chaque question répond » vide la mémoire des questions vues avant chaque réouverture
  (comme au premier usage) ; il vérifie toujours chaque question du premier affichage. Correctifs trouvés par
  l’e2e : une liste n’est comptée « vue » qu’après 1,5 s à l’écran (pas pendant un changement d’écran ou une
  fermeture), et la graine ne fait jamais passer une autre question devant celles du pratiquant.
- **Limites** : jiu-jitsu et judo ont moins de questions (pas de conseils de frappe) : environ 60 % de questions
  différentes sur 10 ouvertures ; un écran à une seule question d’application (profil, voix…) la garde en tête à
  chaque ouverture ; les règlements détaillés n’existent que pour les styles de kick-boxing (aucune règle inventée
  pour la boxe, le muay-thaï ou le MMA) ; les questions Légendes n’apparaissent qu’une fois la bibliothèque des
  champions chargée ; le crochet relit la mémoire à l’ouverture, si le panneau s’ouvre avant la relecture des
  réglages, la liste peut changer une fois ; pas de validation sur téléphone (NON EXÉCUTÉ).

## 2026-10-21 · v0.28.0 (en préparation) · Enrichissement des disciplines

Demande de Youssef : « Je voudrais aussi que tu enrichisses toutes les disciplines » (la partie Légendes est
traitée dans un lot séparé). Audit complet et sources : `docs/ENRICHISSEMENT_DISCIPLINES.md`.

- **Une technique commune, une seule fiche** — Constat : une technique partagée entre disciplines n’avait aucun
  moyen de dire ce qui change d’une discipline à l’autre, et la fiche ne montrait ni ses sources ni d’encadré de
  sécurité. Correction : trois champs optionnels sur `Technique` (`notes` par discipline, `safety`, `sources`),
  affichés sur la fiche (« En judo… », encadré « Sécurité », liens vers les sources en bas). Un test vérifie
  qu’une note ne vise que les disciplines de la technique et que chaque source existe.
- **Judo** (7 → 15 techniques) — ayumi-ashi, kumi-kata, uchikomi d’o-goshi, d’o-soto-gari, d’o-uchi-gari, de
  ko-uchi-gari (entrée seulement, jamais de fauchage ni de projection en solo), chutes arrière et latérale en
  **version basse** (nouvelle catégorie « Chutes (ukemi) »). Sources : IJF/Kodokan (jb-S5), Judo Québec (jb-S11).
  Les fiches partenaire o-goshi, o-soto-gari et ukemi pointent vers leur préparation solo ; la consigne de
  sécurité de l’ukemi dit maintenant ce qui est permis à la maison (version basse, tapis épais, jamais depuis
  debout).
- **Jiu-jitsu brésilien** (7 → 13) — sit-out et relevé depuis les genoux (Grapplearts jb-S51, Jitsu IQ jb-S52) ;
  partagés sans copie : chute arrière basse, changement de niveau, double-leg, single-leg (note BJJ sur
  l’amenée au sol, règlement JJIF jb-S26).
- **Boxe** (+2) — check hook (aussi MMA) et shoulder roll (Evolve MMA, Wikipédia). **Muay-thaï** (+3) — switch
  kick (aussi kick-boxing, ajouté à la règle des coups de pied circulaires des trois styles), garde longue,
  rattrapage du middle kick (muaythai.com, Evolve MMA). **MMA** (+3) — single-leg, check hook, sit-out.
- **Animations** — 16 nouvelles, toutes « contrôlées automatiquement » (aucune « validée ») : amplitudes, appuis,
  continuité, chaîne et impact des frappes, équilibre sur une jambe, chevilles, torsions des deux coachs avec
  leur garde propre, fluidité (arrêts parasites jamais en hausse). Corrections en cours de route : chute arrière
  (genoux sous le tapis et hanche en rotation à 150° pendant l’assise : clé intermédiaire et pieds décollés),
  sit-out (rotation interne de hanche à 58° au retour : orientation du pied arrière revue, 45° max respecté),
  frappe des bras de la chute (saut de 27 cm en une image : accélération adoucie), garde propre d’Amara sur deux
  uchikomi en style MMA (éversion de cheville +14° : ces entrées de judo partent du shizen-tai simple hors du
  judo). Sprawl non partagé en BJJ : torsion du cou hors limite dans ce style.
- **Exercices et programmes** — 36 exercices ajoutés en fin de niveau (identifiants existants inchangés), deux
  premiers programmes : « Judo - Bases en solo » et « Jiu-jitsu brésilien - Mobilité et relevés en solo ».
- **Coach IA** — synonymes des nouvelles techniques, « single leg » et « switch kick » ne sont plus des gestes
  inconnus, deux questions suggérées par nouvelle technique, nuance de la catégorie Chutes, articles corrigés
  (« la garde longue », « le yoko-ukemi »).
- **Miniatures** — 32 images (Kadir et Amara), vérifiées à l’œil.
- **Tests** : voir le rapport du lot. Deux tests qui parcourent toute la bibliothèque (cadrage caméra, amplitudes
  du moteur) dépassaient la limite de temps par défaut de 5 s sous charge : budget de temps explicite de 60 s,
  seuils de qualité inchangés.
- **Limites** — aucune revue d’expert ; sources en ligne lues par un lecteur de synthèse ; le sens du pivot du
  check hook est notre lecture des sources ; miniatures o-uchi-gari et ko-uchi-gari peu parlantes ; validation
  sur téléphone NON EXÉCUTÉE.

## 2026-10-20 · v0.28.0 (en préparation) · Enrichissement des Légendes

Demandes de Youssef : 21:52 « Je voudrais aussi que tu enrichisse toutes les disciplines et les légendes. Pour les
légendes, retire les rectangles sur le nombre de techniques, Soit créatif » (partie Légendes de ce lot ; les
techniques sont traitées dans un autre lot) ; 22:02 « Retire importer. C'est trop technique ».

- **Catalogue 1.1.0** (schéma 1 inchangé, `scripts/build-catalog.mjs` + `scripts/catalog-legends.mjs`) — Constat :
  aucune légende en judo ni en jiu-jitsu brésilien (les cartes de ces disciplines menaient à une liste vide), aucune
  femme en boxe, kick-boxing et muay-thaï. Correction : 27 nouveaux profils — judo 8 (Teddy Riner, Clarisse
  Agbegnenou, Kosei Inoue, Ryoko Tani, David Douillet, Yasuhiro Yamashita, Majlinda Kelmendi, Uta Abe) + Ronda Rousey
  (MMA et judo) ; jiu-jitsu 8 (Roger Gracie, Marcelo Garcia, Rickson Gracie, Marcus « Buchecha » Almeida, Gabi
  Garcia, Mackenzie Dern, Bia Mesquita, Ffion Davies) ; boxe 4 (Claressa Shields, Katie Taylor, Estelle Mossely,
  Amanda Serrano) ; kick-boxing et muay-thaï 3 (Anissa Meksen, Tiffany van Soest, Stamp Fairtex) ; MMA 3 (Cris
  Cyborg, Rose Namajunas, Zhang Weili). Shevchenko et Jędrzejczyk reçoivent aussi le muay-thaï. 12 fiches par
  nouveau profil ou nouvelle discipline : boxe 300 → 348, kick-boxing 250 → 286, MMA 300 → 348, muay-thaï 250 → 310,
  judo 0 → 108, jiu-jitsu 0 → 96 (1100 → 1496). Judo et jiu-jitsu : exercices solo de bases construits uniquement
  avec les techniques existantes (déplacements, kuzushi, uchikomi à vide ; descente, pont, rétention de garde,
  changement de base, sortie de hanche, relevé), tous jouables en 3D, source « Exercice solo inspiré du profil… ;
  séquence originale de bases, non relevée en combat ». Aucune projection ni soumission simulée.
- **Profils enrichis** (107) : pays, époque quand la page source donne les années, et une anecdote « Le savais-tu ? »
  avec son lien. Chaque fait a été relu le 2026-10-20 sur la page Wikipedia (anglais) citée ; aucun fait ajouté sans
  cette lecture. Gardes existantes conservées. Liste et sources : `docs/LEGENDES.md`.
- **Migration** : les 1100 fiches v1.0.0 gardent identifiants, ordre, noms et séquences (empreinte testée) ; favoris,
  collections, historique et fiches importées continuent de fonctionner. Champs ajoutés facultatifs (`country`,
  `era`, `funFact`), validés s’ils sont présents. Les points clés et erreurs de ces fiches sont régénérés depuis les
  textes actuels des techniques (592 et 273 fiches concernées, sans changement de séquence). Le générateur ne
  s’arrête plus sur une technique sans nom court (il prend son nom complet).
- **Plus de rectangles** — Constat : 5 cases (« Fiches, Vérifiées, Adaptées, Inspirées, Jouables en 3D ») sur la page
  Légendes et sur chaque champion, 160 px de haut à 393 px, dont deux toujours à 0. Correction : la **fleur de
  style** (« ADN de combat ») : un pétale par famille de mouvements (poings, pieds, genoux et coudes, lutte et sol,
  défense et feintes, déplacements), surface proportionnelle à sa part dans toutes les séquences des fiches (calcul
  `src/domain/catalog/dna.ts`, postures exclues), le nombre de fiches au cœur ; à côté, les 4 familles principales en
  pourcentage, puis une ligne de statut qui ne montre que les statuts présents (« 1 496 inspirées ») et « Toutes
  jouables en 3D ». 139 px au lieu de 160. Accessibilité : `role="img"` avec un aria-label qui donne tous les
  pourcentages. Sur la page d’un champion : « Ce que tu vas travailler » (les 3 techniques les plus présentes dans ses
  fiches, familles variées, avec le nombre de fiches et un lien vers la technique) et « Le savais-tu ? ». Liste des
  légendes : icônes de discipline, barre d’ADN miniature, « 12 fiches · garde · pays » en texte (plus de case dorée).
  Fichiers : components/LegendDna.tsx, screens/Champions.tsx, styles.css.
- **Importer retiré** (22:02) : l’onglet « Importer » disparaît des Légendes ; un ancien lien `?vue=importer` revient
  à l’accueil des Légendes. Le code et les données d’import restent : les fiches déjà importées sont conservées et
  affichées (recherche, favoris, collections, historique, badge « Importée »). Guide du Coach IA : mention et
  mot-clé « importer des fiches » retirés de la réponse Légendes. Aucun test ne couvrait l’écran d’import ; les tests
  unitaires de la couche de données (import, store) sont gardés.
- **Tests** : tsc -b — TEST RÉUSSI. Vitest : 424 réussis, 1 non exécuté (existant) au premier passage
  complet — TEST RÉUSSI ; sur deux autres passages, un échec par délai dépassé dans un test moteur (`camera.test.ts`
  « corps dans le cadre », 5 s) — instabilité existante : elle se produit aussi sur la v0.26.0 sans ce lot, et le test
  réussit seul (13/13). Nouveaux tests : `dna.test.ts` (axes, parts, vide, « Ce que tu vas travailler », chaque
  champion) ; `catalog.test.ts` (empreinte des 1100 fiches v1.0.0, fiches par discipline avant/après, pays et anecdote
  sourcée pour chaque champion, championnes par discipline, exercices judo/jiu-jitsu honnêtes et jouables, fichier
  sans les nouveaux champs toujours valide) ; le test « nombre de champions par discipline » passe de [20, 20, 24, 20]
  à [24, 23, 28, 25, 9, 8] (raison écrite dans le test). Playwright (build de cette branche, port dédié) : app,
  coach-bubble, contrast (+ liste des légendes de jiu-jitsu et page Teddy Riner ajoutées), discipline-art, theme,
  legendes-quick-start, action-pill, bjj-judo et le nouveau `legendes-adn.spec.ts` (fleur plus basse que l’ancienne
  grille, résumé accessible, axe sur fleur/focus/anecdote/cartes, judo et jiu-jitsu, Importer retiré et redirigé) :
  67 réussis — TEST RÉUSSI. Au premier passage, le contraste a relevé le nombre écrit en SVG au cœur de la fleur
  (mesure 1,09:1) : le nombre est maintenant du texte HTML posé sur le cœur, relance réussie
- **Captures** 393×851 sombre et clair (avant/après) : liste Légendes, cartes des légendes, page Mike Tyson, Teddy
  Riner (judo), Marcelo Garcia (jiu-jitsu).
- **Limites** : pas de validation sur téléphone (NON EXÉCUTÉ) ; sources secondaires (Wikipedia en anglais), pas de
  page de fédération ; les fiches judo et jiu-jitsu ne travaillent que les bases solo disponibles (pas de technique
  propre à chaque champion) ; l’ADN décrit les fiches générées (un style « inspiré »), pas des statistiques de combat.

## 2026-10-21 · v0.28.0 · Publication groupée (lots 0.27 et 0.28)

Les entrées « v0.27.0 », « v0.27.0 (en préparation) · Questions du Coach IA variées » et « v0.28.0 (en préparation) »
ci-dessus sont publiées ensemble en v0.28.0 (pas de publication séparée de la 0.27).
- **Assemblage** — Conflits de fusion résolus : journal (entrées gardées toutes) ; `src/coach/suggest.ts` (version
  « questions variées » gardée, et les 32 questions des 16 nouvelles techniques reportées dans
  `src/coach/questionBank.ts`) ; nouvelle catégorie « chute » rattachée à l’axe « Lutte, sol » de l’ADN de combat
  (`src/domain/catalog/dna.ts`, test dna qui le vérifie). Catalogue régénéré avec les nouvelles techniques : aucune
  séquence modifiée (1496 combinaisons).
- **Tests** — Vitest : TEST RÉUSSI (472 réussis, 1 ignoré). Playwright complet : 135 réussis, 2 ignorés (Firebase),
  2 ÉCHOUÉS dans `coach-panel-size.spec.ts`, corrigés puis TEST RÉUSSI 5 fois de suite sur ce fichier :
  le rechargement partait avant l’enregistrement de la taille (le test attend maintenant l’écriture IndexedDB),
  et la poignée était mesurée pendant l’animation du panneau (le test attend qu’elle soit immobile).
  Aucune assertion affaiblie. Validation sur téléphone : NON EXÉCUTÉ.

## 2026-10-21 · v0.29.0 (en préparation) · Audit ultra-réalisme

- **Constat** — Barbe, cheveux, sourcils et poils sont peints dans le shader de peau avec un bruit par pixel
  (d'où les points et l'effet casque) ; peau sans pores ni rugosité ; ombres désactivées ; une seule tenue ;
  aucun environnement ; style Anime par défaut. Détail et causes ligne par ligne : `docs/v029/AUDIT_REALISME.md`.
- **Méthode** — Hair cards générées dans Blender depuis de vraies mèches + shader anisotrope ; peau avec
  micro-relief et rugosité ; tenues et environnements modélisés ; options A/B ; 5 lots publiés un par un.
- Branche `feature/combat-shadow-v029` créée depuis v0.28.0 (`95d704d`, tag `restauration/avant-v029`).

## 2026-10-21 · v0.29.0-lot1 · Pilosité réaliste (cheveux, barbe, sourcils, poils)

- **Constat** — Captures de Youssef et banc de captures `lab/groom.html` : barbe en points (bruit par pixel dans le
  shader de peau), cheveux en coque « casque », sourcils peints, poils du torse en taches.
- **Correction** — Rendu Ultra-réaliste des coachs Kadir et Amara : pilosité en *hair cards* (`src/three/groom.ts`).
  Texture de mèches générée par `tools/generator/groom/atlas.py` (mèches tracées une à une, effilées, ondulées,
  couverture anti-crénelée). Cartes enracinées sur la peau là où les masques disent que les cheveux poussent,
  orientées (épi à l'arrière du crâne, coiffé en arrière, barbe vers le bas, moustache vers l'extérieur, sourcils
  vers la tempe), courbées le long du crâne. Forme de barbe calculée sur le visage (joues, menton, dessous de la
  mâchoire, favoris), la peau garde une ombre de rasage de la même forme. Poils discrets des avant-bras, tibias et
  torse liés au squelette (ils suivent les mouvements). Matériau sans reflet de Fresnel (le gris parasite venait de
  là), deux reflets le long des mèches, racines plus sombres. Le bruit par pixel est retiré quand les hair cards
  sont actives.
- **Secours** — Si la texture de mèches ne charge pas, la coiffure peinte précédente reste affichée. Le style Anime
  n'est pas modifié. Qualité basse : 55 % des cartes.
- **Tests** — `src/three/__tests__/groom.test.ts` (mèches jamais dans le crâne, volume borné, forme de barbe).
- **Tests lot 1** — Vitest : TEST RÉUSSI (474 réussis, 1 ignoré). Playwright complet : 135 réussis, 2 ignorés, 2 ÉCHOUÉS
  puis corrigés : `action-pill.spec` (axe lisait la couleur de la pilule pendant son apparition, rouge #e32d3e à
  mi-fondu) et `training-layout.spec:187` (chevauchement mesuré pendant que le panneau du coach glissait encore ;
  échoue aussi 2 fois sur 3 sur la v0.28.0). Les deux tests attendent maintenant la fin des animations, aucune
  assertion affaiblie : 3/3 et 4/4 réussis. Validation sur téléphone : NON EXÉCUTÉ.

## 2026-10-21 · v0.29.0 (prototype, non publié) · Peau et yeux (lot 2), puis coachs Ultra-réalistes sur base Rocketbox

- **Constat (lot 2)** — Banc de captures : taches grises sur le blanc des yeux, cils absents, sourcils en traits
  croisés. Cause des taches vérifiée : le recoloriage de l'iris cherchait l'iris par sa couleur et repeignait les
  veines roses et le bord gris du blanc (sans ce recoloriage le blanc est propre ; ombres et reflets écartés).
- **Correction (lot 2)** — Iris trouvé par sa place sur la texture (même texture d'yeux dans tous les modèles),
  couleur choisie appliquée en gardant les fibres de l'iris ; cils posés au bord avant de la paupière (centre et
  rayon de l'œil par sphère ajustée, `fitSphere`) ; sourcils en poils simples ; Ultra-réaliste par défaut pour une
  nouvelle installation, style déjà enregistré conservé (réglages version 2). Détails : `docs/v029/LOT2_PEAU.md`.
- **Constat (Youssef, 13:49, captures)** — Pilosité du lot 1 « pas du tout satisfaisante », personnages « pas du
  tout humains ». Vérifié : poils des bras et jambes en tirets noirs, barbe en bloc noir, cheveux en brosse,
  points parasites au cou d'Amara. Cause : visages, peau et poils générés à partir de couleurs unies ; à la
  distance de l'entraînement un poil fait 1 à 2 pixels. En plus la préparation des poils prend 5 à 8 s sur la
  machine de test (3 tests échoués, suite à 36 min).
- **Décision de Youssef (16:49)** — Remplacer la base des coachs Ultra-réalistes par des avatars Rocketbox (MIT).
- **Correction** — `PhotoCoach` (Ultra-réaliste des coachs champions) sur les avatars Rocketbox `Sports_Male_01`
  (Kadir) et `Sports_Female_01` (Amara), textures photo retouchées (`tools/generator/rocketbox/recolor.py`),
  squelette renommé et pieds remis droits au repos (`convert.py`). Le style Anime garde les modèles générés.
  Licence : `docs/LICENCES.md`, `public/coaches/LICENSE-ROCKETBOX.txt`. Détails : `docs/v029/ROCKETBOX.md`.
- **Tests** — Vitest : 476 réussis + nouveau `photo-coach.test.ts` (squelette et taille : RÉUSSI ; amplitudes
  articulaires : Kadir RÉUSSI, Amara ÉCHOUÉ sur 2 techniques au sol, rotation externe de hanche 53,7° pour 45°).
  `settings-style.test.ts` : défaut Ultra-réaliste et conservation du style enregistré (RÉUSSI). Playwright complet
  (18,3 min) : 136 réussis, 2 échoués : `coach-render.spec:62` (mon test relisait le réglage avant son
  enregistrement ; attente ajoutée, RÉUSSI ensuite) et `coach-bubble.spec:93` (en analyse). Téléphone : NON EXÉCUTÉ.

## 2026-10-21 · v0.29.0-proto2 · Mouvement en chaîne, garde vivante, corps plus athlétique (coachs Ultra-réalistes)

- **Constat (Youssef, 17:50)** — « Il faut revoir tout le mouvement. Il y a rien de naturel. Il faut aussi revoir
  le corps. Il n'est pas harmonieux et humain. » Vérifié en filmant Kadir image par image (direct, middle kick,
  garde de face, de profil et de dos) : chaque technique est faite de 3 à 5 poses écrites et, entre deux poses,
  tout le corps bouge et arrive en même temps (effet robot) ; la garde répète le même petit rebond toutes les
  0,9 s ; corps Rocketbox mince et facetté (environ 3 700 sommets). Captures : page de comparaison du prototype.
- **Correction** —
  - `src/engine/motion.ts` : mouvement en chaîne. Le bassin et les pieds au sol ont jusqu'à 50 ms d'avance sur le
    buste et les bras (10° d'avance au plus, pour rester dans l'amplitude de la colonne), la tête suit avec 35 ms
    de retard. Les poings et les pieds qui frappent gardent leur trajet et leur heure d'impact ; le bassin atteint
    la pose du coup au plus tard à l'impact ; rien ne change au début et à la fin d'un mouvement (enchaînements),
    ni pendant les coups de pied (pied en l'air) et au sol.
  - `src/engine/player.ts` : garde vivante. Le poids passe lentement d'un pied à l'autre, le buste et la tête
    tournent un peu, les gants bougent de quelques millimètres, sans jamais se répéter ; les pieds restent posés.
  - `tools/generator/rocketbox/convert.py` : corps plus athlétique sans grosse musculature (épaules, bras,
    avant-bras, pectoraux, dos, trapèzes, fessiers, cuisses, mollets : 12,5 mm au plus chez Kadir, 7,6 mm chez
    Amara) et une subdivision qui arrondit la silhouette (22 000 et 25 000 sommets ; fichiers 2,7 et 3,0 Mo).
  - `src/engine/phases.ts` : le check hook est reconnu comme un coup du bras avant (mesure de la chaîne).
- **Tests** — Nouveau `chain.test.ts` (hanche avant les épaules sur le direct, poing sur son trajet, début et fin
  identiques, garde vivante avec pieds posés) : RÉUSSI. Vitest complet : 481 réussis, 1 échec déjà connu
  (`photo-coach.test.ts`, Amara au sol, inchangé). Mesures régénérées : `MESURES_FLUIDITE.md`,
  `MESURES_MOTEUR.md`, `MESURES_TORSIONS.md`.
- **Limites** — Le changement reste discret sur les captures : les poses écrites décident encore de l'essentiel.
  Un rendu vraiment naturel demande de vrais mouvements capturés (choix proposé à Youssef : Mixamo). Genoux en
  garde vérifiés : même position que sur les modèles générés (au-dessus des orteils) ; le pouce du poing fermé
  reste mal placé sur les avatars Rocketbox. Téléphone : NON EXÉCUTÉ.

## 2026-10-21 · v0.29.0-proto2 · Coach 3D qui disparaît sur téléphone puis « Affichage 3D indisponible »

- **Constat (Youssef, 20:58, capture)** — Sur son téléphone, en v0.29.0-proto1, le coach a disparu après quelques
  mouvements, l'écran est devenu noir, puis l'accueil affiche « Affichage 3D indisponible sur cet appareil » à
  chaque ouverture. Vérifié dans le code : aucune gestion de la perte du contexte 3D (le navigateur retire la 3D
  quand la mémoire graphique est épuisée) ; en qualité automatique le téléphone démarrait en qualité haute avec
  ombres portées douces (carte d'ombre 2048), image en double résolution et quatre textures photo de 2048 pixels
  (environ 85 Mo de mémoire graphique). Après une perte, le navigateur peut refuser la 3D au site jusqu'à sa
  fermeture complète, d'où le message à chaque ouverture (déduit, non reproduit : pas de téléphone ici).
- **Correction** — `CoachStage` : à la perte du contexte, la scène repart d'elle-même en qualité légère, et ce
  téléphone reste en qualité légère en mode automatique (`css-3d-safe`, nouvelle clé, aucune clé supprimée) ;
  écrans tactiles en qualité automatique : pas d'ombres portées, résolution limitée à 1,5. Textures des coachs
  photo : seule la couleur du visage garde 2048 pixels, les autres passent à 1024 (environ 38 Mo au lieu de 85).
  Message d'erreur : « Ferme puis rouvre l'application : le coach reviendra en qualité légère. »
- **Tests** — Vitest : 481 réussis, 1 échec déjà connu (Amara au sol). Playwright complet : 138 réussis, 2 ignorés
  (Firebase), 18,6 min. Téléphone : NON EXÉCUTÉ (à vérifier par Youssef).

## 2026-10-21 · v0.29.0-proto3 · Correctif prioritaire : coach 3D qui disparaît et ne revient pas (Android)

- **Constat (Youssef, 19:33, capture proto2)** — Le coach s'anime puis disparaît. Le message d'indisponibilité
  revient à chaque ouverture. Reproduit avec `scripts/dev/gpucrash.mjs` (plantage du processus graphique de
  Chromium, Pixel 7 émulé). Après deux réinitialisations, Chrome refuse la 3D au site (« Web page caused context
  loss and was blocked »), même après rechargement, pendant environ 2 minutes ici. L'appli ne réessayait jamais.
  La reprise de la PR #1 recréait un canvas sur un contexte perdu (`reading 'precision'`), d'où l'erreur
  affichée. Ce qui déclenche la réinitialisation sur le téléphone n'est pas prouvé : pas de fuite mesurée, pas de
  téléphone ici. Le nouveau journal 3D le dira.
- **Correction** :
  - restauration dans le même canvas ;
  - garde commune aux 4 écrans 3D (`StageGuard`) : elle attend que le navigateur accepte la 3D puis remet le
    coach sans recharger, avec des reprises bornées et des boutons qui marchent ;
  - qualité qui baisse d'une marche par incident et remonte après 10 min calmes (`css-3d-level`). L'ancien
    `css-3d-safe` est converti ;
  - rendu en pause en arrière-plan ;
  - erreurs d'animation isolées ;
  - matériaux du coach photo libérés ;
  - journal 3D sur l'appareil (`css-3d-diag`), visible et copiable dans Réglages › Affichage 3D.
  - Détail dans `docs/v029/CORRECTIF_3D.md`.
- **Tests** :
  - Vitest : 487 réussis, 1 échec déjà connu (Amara au sol, hanche 53,6° pour 45°, sans rapport), dont 6 nouveaux
    (`stability.test.ts`) : TEST RÉUSSI.
  - Scènes de reprise (`coach-3d-recovery.spec.ts`, 6) : TEST RÉUSSI.
  - Panne graphique rejouée : le coach revient seul : TEST RÉUSSI.
  - Android réel : NON EXÉCUTÉ.
- **Restauration** : `fix/3d-context-recovery-v029` avant ce lot = `e716944`.

## 2026-10-21 · v0.29.0-proto4 · Morphologie athlétique et biomécanique des 5 techniques de « Combinaison 8 armes »

- **Constat (Youssef, 21:00, 5 captures muay-thaï)** — Vérifié sur le squelette des deux coachs Ultra-réalistes
  (`src/test/probe.ts`) :
  - crochet gauche : coude 11 cm au-dessus de l'épaule ; Amara bras presque tendu (46° de flexion) ;
  - direct : coude verrouillé à l'impact (2°) ;
  - genou direct : genou monté vers la poitrine ; deux bras tendus devant ; au retour, le pied passait derrière la
    jambe d'appui ;
  - teep : main restée en garde, buste très renversé ;
  - coude horizontal : la main reculait à l'armé ;
  - poings : pouce écarté (« griffes »).
  Musculature trop fine pour des combattants.
- **Recherche** : sources écrites seulement (boxe-S1 à S9, kbmt-S24 à S44). YouTube et Wikimedia sont bloqués par
  le réseau : **aucune vidéo visionnée**, aucune animation ni donnée de mouvement de tiers réutilisée.
- **Correction** (détail et références par technique dans `docs/v029/BIOMECA_LOT1.md`) :
  - crochet : poing placé pour un coude à 90° selon la longueur de bras de chaque coach, coude à hauteur d'épaule,
    armé plus ouvert (vitesse à l'impact 2,0 → 2,6 m/s) ;
  - direct : bras allongé sans verrouiller le coude ;
  - genou direct : genou poussé vers l'avant à hauteur du foie, garde longue d'un bras, talon d'appui 25°, nouvelle
    pose de retrait ;
  - teep : main du côté du teep abaissée, bascule du buste réduite ;
  - coude horizontal : armé sans recul ;
  - pouce orienté vers l'index et le majeur dans le poing (`rig.ts`) ;
  - musculature par régions anatomiques (`convert.py`, Kadir `SHAPE_SCALE=1.6`, Amara `1.0`), visages et poils
    inchangés.
- **Tests** :
  - `tsc` : TEST RÉUSSI.
  - Vitest : 501 réussis, 1 échec déjà connu (Amara au sol, hanche 53,9° pour 45°, sans rapport). Dont 14
    nouveaux (`muaythai-biomeca.test.ts`), 9 d'entre eux échouent sur l'ancien code : TEST RÉUSSI.
  - Documents de mesures régénérés (`AUDIT_UPDATE=1`) : arrêts parasites de fluidité 286 → 310 sur
    528 animations : la pose de retrait des genoux ajoute 36 poses clés. Le seuil (moins de 40 % des arrêts
    d'origine) reste tenu (22 %), et aucune vitesse à l'impact n'est réduite.
  - Playwright complet : 143 réussis, 2 ignorés (Firebase), 1 échec : `training-layout:286` (caméra « Auto »).
    Relancé seul : 4 réussites sur 4. L'échec apparaît quand la machine est chargée (captures en parallèle), comme
    `training-layout:323` dans la PR #1 : TEST RÉUSSI seul, instable sous charge.
  - Captures avant/après, 3 angles × 7 instants, 5 techniques (Kadir) et crochet (Amara) : vérifiées à
    l'œil.
  - Validation par un entraîneur : NON EXÉCUTÉ.
  - Android réel : NON EXÉCUTÉ.
- **Restauration** : `fix/3d-context-recovery-v029` = `0f6657d` (base de la branche `feature/biomeca-v029`).

## 2026-10-22 · v0.30.0 · Version réunissant tout le travail v0.29

- **Demande (Youssef, 06:05)** : « Crée-moi une v30 à partir de 2 des 2 v. 29 proto 1 et 2 ».
- **Contenu** : branche `feature/combat-shadow-v030`, créée depuis `feature/biomeca-v029` (`f489f6f`). Elle
  contient, dans l'ordre :
  - v0.29.0-proto1 : coachs photo-réalistes (Rocketbox) ;
  - v0.29.0-proto2 : reprise 3D sur téléphone, chaîne cinétique ;
  - v0.29.0-proto3 : correctif de disparition du coach (PR #1) ;
  - v0.29.0-proto4 : biomécanique des 5 techniques de « Combinaison 8 armes » et morphologie athlétique (PR #2).
- **Changements propres à cette version** : numéro 0.30.0 ; la branche est ajoutée au déploiement du lien de test
  public (`.github/workflows/preview.yml`). Aucun code de l'application modifié.
- **Tests** : ceux des entrées proto3 et proto4 s'appliquent au même code. Vitest et build relancés sur cette
  branche : 501 réussis, 1 échec déjà connu (hanche d'Amara au sol, 53,9° pour 45°) ; `tsc` réussi.
- Les PR #1 et #2 restent ouvertes, non fusionnées.
- **Restauration** : `feature/biomeca-v029` = `f489f6f`.

## 2026-10-22 · v0.31.0 · Correction majeure du moteur 3D et tenues par discipline

- **Demande (Youssef, 06:24 et 06:26)** : « CORRECTION MAJEURE DU MOTEUR 3D » et « TENUES ET ACCESSOIRES 3D PREMIUM
  PAR DISCIPLINE ». Méthode des animations choisie à 06:33 : « Moteur amélioré ».
- **Constat après vérification** (détail dans `docs/v031/MOTEUR_3D.md`) :
  - flou : canvas plafonné à 1,5 px/pt, soit 57 % de la résolution d'un Pixel 7, et sans anticrénelage en mode de
    secours ;
  - morphologie : triceps, ischios, avant-bras et obliques trop plats ;
  - jab : coude verrouillé ; direct : le poing partait avant le bassin ; low kick : le pied frôlait le sol ;
  - une seule tenue générique pour toutes les disciplines ;
  - les 4 vidéos YouTube de référence n'ont pas été visionnées (accès bloqué) ; des captures ont été demandées.
- **Correction** :
  - résolution selon un budget de pixels, MSAA à tous les niveaux, filtrage anisotrope, alpha-to-coverage
    (`src/three/resolution.ts`, `CoachStage.tsx`, `PhotoCoach.tsx`) ; stabilité WebGL non modifiée ;
  - volumes musculaires par région (`tools/generator/rocketbox/convert.py`) ;
  - jab, direct et low kick refaits au moteur (`boxing.ts`, `legs.ts`, `balance.ts`, `motion.ts`, `author.ts`) ;
  - 7 tenues par coach (`tools/generator/rocketbox/outfits.py`, `src/three/outfit.ts`), réglages « Tenue de la
    discipline » et « Kimono / Sans kimono », message si une tenue ne charge pas.
- **Tests** :
  - `prototypes-v031.test.ts` (18, dont 8 qui échouent sur l'ancien code), `outfit.test.ts` (16) et
    `resolution.test.ts` : TEST RÉUSSI ;
  - échec déjà connu depuis la v0.29-proto1, inchangé : hanche d'Amara au sol (53,9° pour 45°) ;
  - mesures régénérées : arrêts de fluidité 310 → 339 sur 2046 clés (22 %, seuil 40 % tenu), aucune vitesse à
    l'impact réduite ;
  - Playwright complet : 142 réussis, 2 ignorés (Firebase), 2 échecs : `training-layout:323` (caméra Auto après un
    pivot) et `coach-suggest:94` (flèches des questions). Relancés seuls : ils échouent aussi sur la v0.30
    (`16a41f2`, 3 échecs sur 4 essais). Ce sont des échecs déjà existants, pas causés par ce lot : ÉCHOUÉ, à
    corriger dans un lot dédié ;
  - Android réel : NON EXÉCUTÉ ; relecture par un entraîneur : NON EXÉCUTÉ.
- **Restauration** : `feature/combat-shadow-v030` = `16a41f2`.
- **Validation (Youssef, 09:11)** : « je valide tout ». Version 0.31.0 publiée : PR #3 fusionnée dans
  `feature/combat-shadow-v030`, lien de test public et page principale de l'application mis à jour.

## 2026-10-22 · v0.32.0-proto1 · Uppercut, coude horizontal, middle et high kick, genou direct

- **Constat** (mesures sur Kadir et Amara, rapport `docs/v032/EXTENSION.md`) :
  - uppercut et coude horizontal : le poing ou le coude atteignait sa vitesse maximale avant la rotation des hanches
    et des épaules (chaîne inversée) ;
  - middle et high kick : chute des hanches de 4 à 5 cm en une image à l'arrivée (jusqu'à 6 m/s) ;
  - genou direct : le pied frottait le sol sur 4 à 6 cm ; le bras de cadrage était verrouillé (2°).
- **Correction** (moteur procédural, sans capture de mouvement) :
  - pose de poussée des jambes avant le bras (`driveToward`, `author.ts`), sur l'uppercut (`boxing.ts`) et le coude
    (`upper.ts`) ;
  - pose « pied décollé » avant la montée de la jambe et bras de cadrage à 97 % de sa longueur (`legs.ts`) ;
  - abaissement progressif des hanches sur l'appui (`motion.ts`) et transfert du poids réparti (`balance.ts`).
- **Tests** :
  - `extension-v032.test.ts` (20 tests) : TEST RÉUSSI ;
  - Vitest complet : 559 réussis, 1 échec déjà connu (hanche d'Amara au sol, 53,6° pour 45°) : ÉCHOUÉ, non lié ;
  - mesures régénérées : arrêts de fluidité 339 → 595 (27 %, seuil 40 % tenu) ; kicks un peu plus longs
    (impact à 440 ms au lieu de 400) ;
  - Playwright complet : 141 réussis, 2 ignorés (Firebase), 3 échecs : `coach-suggest:94` (réussit relancé seul), `training-layout:286` et `:323` (caméra Auto, échouent aussi relancés seuls sur la v0.31 `04b0b5e`). Échecs déjà existants, pas causés par ce lot : ÉCHOUÉ, lot dédié à faire ;
  - Android réel : NON EXÉCUTÉ ; relecture par un entraîneur : NON EXÉCUTÉ.
- **Restauration** : `feature/combat-shadow-v030` = `04b0b5e` (v0.31.0).
- **Validation** : en attente de Youssef ; rien n'est fusionné ni déployé.

## 2026-10-22 · v0.32.0-proto2 · Corrections premium des tenues, du chargement et des portraits

- **Demande** : Youssef, 10:33, « CORRECTIONS PREMIUM » ; à 10:35, « par sur v32 » (base v0.32.0-proto1). Rapport :
  `docs/v032/TENUES_PREMIUM.md`.
- **Constat** :
  - le coach apparaissait en sous-vêtements avant sa tenue (3 images mesurées) ;
  - les gis ressemblaient à du gros tricot : relief de 8 mm, volume gonflé, manches dentelées, col fin, ceinture en
    tube ;
  - les shorts avaient un aspect plastique, les ceintures de short ressemblaient à une corde, la fente du MMA était
    déchirée, les gants étaient sphériques et les protège-tibias incomplets et dentelés ;
  - l'écran « Choisis ton coach » montrait des dessins cartoon.
- **Correction** :
  - coach affiché seulement avec sa tenue portée, après préparation sur la carte graphique, avec un délai de secours
    de 20 s (`PhotoCoach.tsx`, `outfit.ts`) ;
  - générateur des tenues refait pour les gis, les shorts, les gants, les protège-tibias et les rashguards
    (`tools/generator/rocketbox/outfits.py`), 14 tenues régénérées ;
  - portraits rendus depuis les modèles 3D (`scripts/dev/shot-portraits.mjs`).
  - Corps, rig, animations et stabilité WebGL non modifiés.
- **Tests** :
  - `outfit-loading.spec.ts` (0 image sans tenue ; 3 sans la correction) ;
  - `outfit-v032.test.ts` (14 tests, dont 12 qui échouent sur les fichiers v0.31) : TEST RÉUSSI ;
  - suites complètes : Vitest 573 réussis, 1 échoué (Amara, angle de hanche, déjà en échec avant ce lot) ; Playwright 142 réussis, 3 échoués, 2 non exécutés (Firebase). Échecs : chargement des tenues au changement de coach (1 image sans tenue : corrigé, `dc7abf6`, puis 5 passages réussis), caméra Auto après un pivot (`training-layout:323`) et défilement des questions suggérées (`coach-suggest:94`), tous deux également en échec sur la version de départ `18ad838`
  - Android réel : NON EXÉCUTÉ.
- **Restauration** : `restauration/avant-tenues-premium` (v0.31.0) ou `feature/biomeca-v032` (v0.32.0-proto1).
- **Validation** : en attente de Youssef ; rien n'est fusionné ni déployé.

## 2026-10-22 · v0.32.0 · Navigation dynamique : une barre du bas, Menu « Navigation générale », Nouveautés

- **Demande** : Youssef, 12:02, « PROMPT MAÎTRE — Refonte intégrale de la navigation dynamique premium — V0.32 ».
  Référence : `docs/design/navigation-dynamique-reference.html` (branche `design/navigation-reference-v032`).
  Publication demandée à 13:59 (« publie d'abord la v32 »). Rapport : `docs/v032/NAVIGATION.md`.
- **Constat** :
  - quatre accès se superposaient : la barre d'onglets fixe, la pilule d'actions flottante, la bulle Coach IA
    flottante et les boutons Profil et Réglages de l'en-tête ;
  - chaque page avait aussi un retour en haut ;
  - l'entraînement avait 9 boutons sous le coach.
- **Correction** :
  - **Barre et Menu** :
    - une seule barre de 5 places qui change avec l'écran : Retour en 1 (sauf sur l'accueil), Menu en 5 ;
    - icônes et libellés copiés de la maquette (`src/ui/nav/`) ;
    - Menu « Navigation générale » avec 8 entrées, plus « Sur cet écran » pour les actions secondaires et le Coach IA ;
    - Nouveautés avec pastille, notes réelles depuis la 0.24 (`src/domain/releases.ts`), dernière version vue
      mémorisée (`settings.newsSeenVersion`) ;
    - retour intelligent : filtres, défilement, Retour Android ;
    - confirmation avant de quitter une séance (même en pause) ou des modifications non enregistrées.
  - **Défauts trouvés par les tests, puis corrigés** :
    - les panneaux de la séance (Options, Comment faire, AR) étaient sous la barre ;
    - avec le clavier ouvert, l'appui sur « Envoyer » du Coach IA tombait à côté ;
    - la barre ne s'effaçait pas en plein écran sans l'API Fullscreen.
  - **Supprimé** :
    - pilule flottante et bulle Coach IA (leurs actions sont dans la barre ou le Menu) ;
    - retour en haut de page ;
    - boutons de l'en-tête de l'accueil.
  - Coachs 3D, tenues, animations, moteur et données : non modifiés. Nouvelles clés seulement (`newsSeenVersion`,
    `favoriteChampions`), aucune clé existante supprimée.
- **Tests** :
  - Vitest 614 réussis, 1 échoué : Amara, angle de hanche, déjà en échec avant ce lot ;
  - `nav.test.ts` : 45 tests qui comparent la configuration au code de la maquette : TEST RÉUSSI ;
  - Playwright :
    - nouveau `navigation.spec.ts` (25 cas) : TEST RÉUSSI ;
    - 11 fichiers de tests adaptés (pilule et bulle remplacées par la barre et le Menu), `action-pill.spec.ts`
      remplacé ;
    - suite complète : 148 réussis, 3 échoués, 2 non exécutés (Firebase). Échecs :
      - les deux premiers étaient corrigés avant la passe finale : `coach-studio:200` (confirmation par la barre) et
        `fullscreen-dbltap:135` (attente du retour de la mise en page) ;
      - le troisième, `training-layout:325`, caméra Auto, était déjà en échec avant ce lot ;
    - passe finale sur la compilation 0.32.0 : 41 réussis sur 41 ;
    - `coach-suggest:96` (flèches des questions) : déjà en échec avant ce lot ;
  - Android réel : NON EXÉCUTÉ (retour haptique et bouton Retour du téléphone non vérifiés sur un appareil).
- **Restauration** : `restauration/avant-navigation-v032` (v0.32.0-proto2).

## 2026-10-22 · v0.33.0 · Entraîner premium et emblèmes des six disciplines

- **Demande** : refonte premium de l'écran Entraîner et nouvelle identité graphique des six disciplines (Youssef, 2026-10-22).
- **Constat avant** :
  - l'écran empilait quatre sections (démarrage rapide, disciplines en grandes cartes de 240 px, 3 programmes sur 10, enchaînements) ;
  - aucune reprise de séance après fermeture ;
  - la barre du bas laissait transparaître le texte (opacité 0,94 / 0,95) ;
  - les emblèmes vectoriels de la branche design étaient des « propositions simplifiées ».
- **Correction** :
  - trois espaces Séances / Disciplines / Programmes, espace retenu, lien `?espace=` ;
  - carte de reprise réelle (4 états), photo de séance enregistrée (IndexedDB + copie synchrone localStorage), restauration au même exercice, round, phase et chrono, sans double comptage ;
  - cartes disciplines à 184 px (−23 %) avec niveau et progression réels ;
  - les 10 programmes avec filtres combinables (discipline, niveau, durée, objectif, ces trois derniers sous « Filtres (n) »), compteur, « Réinitialiser » et statut ;
  - barre du bas à 0,985 d'opacité ;
  - emblèmes : 6 rendus 3D procéduraux originaux (Blender), WebP 64/128/256, variante contour monochrome, registre `src/ui/emblems/`, planche https://claude.ai/artifact/8kxM3tUJsHyjRYzoMXpUfm.
  - Coachs 3D, animations, moteur, navigation v0.32 : non modifiés. Nouvelles clés seulement (`css-resume`, `css-resume-mirror:<utilisateur>`, `settings.trainSpace`).
- **Fichiers** : `src/ui/screens/Train.tsx`, `train.css`, `src/domain/resume.ts`, `programMeta.ts`, `src/store/resume.ts`, `src/ui/training/useSession.ts`, `src/ui/screens/Training.tsx`, `src/ui/emblems/`, `public/emblems/`, `tools/generator/emblems/`, `docs/v033/`.
- **Tests** :
  - Vitest : 646 réussis, 1 échoué (Amara, angle de hanche, `photo-coach.test`, déjà en échec avant ce lot) ;
  - nouveaux : `resume.test.ts`, `resume-store.test.ts`, `session-resume.test.tsx`, `programMeta.test.ts`, `emblems.test.tsx` : TEST RÉUSSI ;
  - Playwright, suite complète : 157 réussis, 2 échoués, 2 non exécutés (Firebase) :
    - `navigation.spec` Nouveautés attendait 0.32.0 comme dernière version : mis à jour pour 0.33.0 (0.32.0 et 0.31.0 toujours vérifiées), relancé : TEST RÉUSSI ;
    - `training-layout` caméra Auto après pivot : déjà en échec avant ce lot ;
  - nouveaux `train-resume.spec` (5) et `emblems.spec` (3, dont hors ligne) : TEST RÉUSSI ;
  - Android réel : NON EXÉCUTÉ.
- **Restauration** : `restauration/avant-entrainer-v033`.

## 2026-10-22 · v0.35.0 · Coaching 3D : HUD compact et bandeau du mouvement

- **Demande** (Youssef, 2026-10-22) :
  - chrono compact en haut ;
  - plus d'enchaînement complet affiché en permanence ;
  - le nom du seul coup en cours dans un bandeau sous le coach, synchronisé sur le moteur d'animation.
- **Constat avant** :
  - le titre montrait l'enchaînement complet pendant tout l'effort ;
  - l'état et le temps étaient posés sur le coach ;
  - le nom du dernier coup restait affiché pendant la garde (`lastFocus`) ;
  - « Puis : … » montrait un second nom.
- **Correction** :
  - `ComboPlayer.moveNow()` et l'événement `onMove`, une simple observation : le coup entrant possède l'affichage dès le début de son animation, le coup courant jusqu'à la fin de la sienne, et rien en garde, au repos ni pendant les déplacements automatiques ;
  - `moveStore` : seul le bandeau se redessine ;
  - le HUD sur une ligne ;
  - `MoveBand` à hauteur fixe, avec le point clé de la phase et un bouton « i » vers « Comment faire ? » ;
  - l'exercice, la consigne et les points clés restent visibles avant le départ, en pause, au repos, à la fin et en Décomposer.
  - Animations, modèles, chronos, statistiques et reprise inchangés. Les poses ont été comparées image par image au moteur 0.34 : identiques.
- **Tests** :
  - `src/engine/__tests__/player-move.test.ts` (16) ;
  - `tests/e2e/coaching-hud.spec.ts` (5) ;
  - `fullscreen-dbltap` adapté : le bandeau s'insère entre la scène et les consignes ;
  - `navigation` : version 0.35.0.
- **Rapport** : `docs/v035/COACHING_HUD.md`, captures dans `docs/v035/captures/`.

## 2026-10-22 · v0.34.0 · Progrès, Athletic Intelligence

- **Demande** : refonte ergonomique et graphique de Progrès, option C « Athletic Intelligence » (Youssef, 2026-10-22). Aucune nouvelle fonction, aucun calcul modifié, un seul écran sans défilement, Progrès juste après Entraîner.
- **Constat avant** :
  - Exercices, Jours actifs et Pause max. n'étaient visibles que dans l'onglet Activité ;
  - le parcours était une petite jauge ;
  - la série précédente était en bleu ;
  - Progrès était 4e dans le Menu.
- **Correction** :
  - six zones (en-tête, filtres, synthèse avec grand pourcentage et quatre chiffres, comparaison des deux périodes servant de légende, vue, onglets sous la vue) ;
  - séries rouge profond / ardoise ;
  - Progrès juste après Entraîner dans le Menu et la barre de l'accueil.
  - Aucun fichier de calcul modifié (`src/domain/progress.ts`, `src/store/stats.ts`, `src/store/progressView.ts`).
- **Fichiers** : `src/ui/screens/progress/Dashboard.tsx`, `progress.css` (nouveau), `src/ui/styles.css` (tokens de série), `src/ui/nav/config.ts`, `docs/v034/`.
- **Tests** :
  - 12 cas (3 disciplines × 4 périodes) sur le même jeu de données : 0 écart sur les chiffres avant/après ;
  - Vitest : 645 réussis, 1 échec déjà présent (Amara) ;
  - Playwright : 156 réussis, 3 échoués (coach-render, réussi à la relance ; coach-suggest, intermittent ; training-layout caméra Auto, déjà en échec avant), 2 non exécutés ;
  - Progrès + navigation : 53/53 ;
  - Android réel : NON EXÉCUTÉ.
- **Restauration** : `restauration/avant-progres-v034`.

## 2026-10-22 · v0.36.0 · Entraîner et Techniques : rôles clarifiés

- **Demande** : Youssef, 2026-10-22 18:47. Entraîner sert à pratiquer et à personnaliser son entraînement, Techniques à apprendre et à explorer. Il faut une carte premium « Crée tes propres enchaînements » dans Séances, retirer le Créateur et les Programmes de Techniques, et ne pas employer le mot « combat ».
- **Constat avant** :
  - dans Séances, Mes enchaînements était en bas, sous Démarrage rapide, avec un grand bouton « Créer un enchaînement » ;
  - Techniques avait cinq sections (Techniques, Combinaisons, Créateur, Favoris, Programmes) ;
  - à 360 px, la section choisie pouvait rester cachée à droite de la rangée.
- **Correction** :
  - Séances, dans l'ordre : Reprendre (seulement si une séance peut être reprise), la carte du Créateur, Mes enchaînements (avec un état vide compact sur une ligne et un lien « Gérer »), puis Démarrage rapide ;
  - Techniques : Techniques, Combinaisons, Légendes et Favoris ;
  - `?tab=createur` redirige vers `/createur` (la discipline est gardée) et `?tab=programmes` vers `/programmes` ;
  - le Retour du Créateur mène à Entraîner ;
  - les textes du Coach IA décrivent la nouvelle organisation ;
  - la rangée de sections montre toujours la section choisie.
  - La barre, les routes, les données et le Créateur sont inchangés.
- **Fichiers** : `src/ui/screens/Train.tsx`, `train.css`, `Library.tsx`, `Builder.tsx`, `src/ui/components/Tabs.tsx`, `src/ui/nav/config.ts`, `src/coach/appGuide.ts`, `src/domain/releases.ts`, `docs/v036/`.
- **Tests** :
  - nouveau : `tests/e2e/entrainer-techniques.spec.ts` (3) ;
  - adaptés à la nouvelle demande : `coach-bubble` (section Légendes), `appGuide.test` (quatre sections), `navigation` (0.36.0) ;
  - Vitest : 662 réussis, 1 échec déjà présent (Amara) ;
  - Playwright complet : 165 réussis, 2 échoués déjà connus (coach-suggest:96, intermittent ; training-layout:325 caméra Auto, déjà en échec avant), 2 non exécutés (Firebase) ;
  - Android réel : NON EXÉCUTÉ.
- **Rapport** : `docs/v036/ENTRAINER_TECHNIQUES.md`.

## 2026-10-22 · v0.37.0 · Comptes, photo de profil et sauvegarde en ligne (0 €)

- **Demande** : comptes utilisateurs (Youssef, 18:59), correctif gratuit à 0 € limité à l'e-mail et à Google (19:13), projet Firebase prêt (20:01).
- **Constat avant** :
  - comptes et synchronisation codés mais inactifs (pas de configuration) ;
  - pas de photo de profil ;
  - pas de changement d'adresse e-mail ni de mot de passe ;
  - états de synchronisation incomplets.
  - Vérifié sur le vrai projet : e-mail et Google activés, `doorsofhell.github.io` autorisé, Firestore fermé (règles `if false`).
- **Correction** :
  - configuration web publique injectée dans le build GitHub Pages ;
  - photo de profil locale (cadrage, ré-encodage sans métadonnées, non synchronisée) et photo Google ;
  - modifier l'adresse e-mail (avec lien de confirmation) et le mot de passe ;
  - indicateur de robustesse ;
  - quatre états de synchronisation avec « Réessayer » et des erreurs claires ;
  - règles Firestore resserrées (six collections, Premium en lecture seule) ;
  - `firebase.json` pour les émulateurs.
- **Reste à faire par le propriétaire** : publier `firestore.rules` dans la console (sinon la sauvegarde en ligne est refusée, sans perte).
- **Fichiers** :
  - `src/account/auth/{types,firebase,guest}.ts`, `src/account/session.ts`, `src/account/sync/engine.ts`, `src/account/scope.ts` ;
  - `src/store/photo.ts`, `src/domain/photo.ts`, `src/store/profile.ts` ;
  - `src/ui/screens/account/{Profile,SignIn,PhotoSheet}.tsx`, `account.css` ;
  - `firestore.rules`, `firebase.json`, `.github/workflows/preview.yml`, `docs/COMPTES.md`, `docs/v037/`.
- **Tests** :
  - émulateurs Firebase : RÉUSSI ;
  - Vitest complet : 668 réussis, 1 ÉCHOUÉ connu (Amara, extension de hanche, déjà en échec avant cette version) ;
  - Playwright complet : 168 réussis, 1 ÉCHOUÉ connu (`training-layout:325`, caméra Auto, déjà en échec en v0.36), 2 ignorés (Firebase) ;
  - Google et e-mails réels : NON EXÉCUTÉ ; Android : NON EXÉCUTÉ.

## 2026-10-22 · v0.38.0 · Créateur d'enchaînements V2

- **Demande** : « Créateur d'enchaînements V2 » (Youssef, 20:37) avec la plaquette de 4 écrans ; décision « Entraîner seul » (20:38) ; publication en autonomie pour la soirée (20:39).
- **Constat avant** :
  - un seul écran (l'éditeur, avec la liste en dessous) ;
  - ni dates, ni usage, ni note, ni fiche, ni duplication ;
  - suppression sans confirmation ;
  - mouvements en texte seulement.
- **Correction** :
  - trois écrans : liste en tuiles (`/createur`), fiche (`/createur/:id`), éditeur (`/createur/nouveau`, `/createur/:id/modifier`) ;
  - grille de pictogrammes pour ajouter un mouvement ;
  - analyse locale déterministe sur 100 (5 critères pondérés, explications, limites ; écrit qu'il ne s'agit pas d'une IA générative) ;
  - statut Acquis / Encore du mal ;
  - duplication, suppression confirmée (l'historique est gardé) ;
  - confirmation avant d'abandonner des modifications.
  - Les enchaînements déjà enregistrés gardent leurs données et s'affichent « Non analysé ».
- **Fichiers** : `src/domain/comboAnalysis.ts`, `src/store/custom.ts`, `src/ui/screens/creator/`, `src/ui/nav/{config,icons}.ts`, `src/ui/App.tsx`, `Train.tsx`, `Programs.tsx`, `Discipline.tsx`, `src/coach/appGuide.ts`, `src/domain/releases.ts`, `docs/v038/`.
- **Tests** :
  - Vitest complet : 694 réussis, 1 ÉCHOUÉ connu (Amara, extension de hanche, déjà en échec avant), 1 ignoré ;
  - Playwright complet : 173 réussis, 1 ÉCHOUÉ connu (`training-layout:325`, caméra Auto, déjà en échec avant), 2 ignorés (Firebase) ;
  - Android réel : NON EXÉCUTÉ.
- **Rapport** : `docs/v038/CREATEUR_V2.md`.

## 2026-10-22 · v0.39.0 · Progrès, refonte premium

- **Demande** : « Progrès V2 » (Youssef) avec la plaquette de maquettes (`docs/design/progres/`) ; publication en autonomie pour la soirée (20:39).
- **Constat avant** :
  - un tableau de bord dense, sans anneau principal ni vue d'ensemble en un écran ;
  - pas d'anneau « chronomètre » dans l'application, contrairement à la maquette ;
  - l'icône centrale de l'anneau était étirée sur tout l'anneau (sélecteur CSS `.p-ring svg` trop large).
- **Correction** :
  - vue d'ensemble sans défilement : anneau principal (techniques assimilées / total), temps total, séances, série, objectifs ;
  - détails en tuiles sur deux colonnes, liens vers Activité (ancien tableau de bord conservé), Techniques, Disciplines, Enchaînements, Historique ;
  - pas de calories ni de nombre de coups (non mesurés) ; maquette 7 « Condition physique » volontairement omise (aucune donnée mesurée) ;
  - sélecteur `.p-ring > svg` ;
  - vocabulaire « assimilée(s) », comme dans le reste de l'application.
- **Fichiers** : `src/ui/screens/progress/` (`Overview.tsx`, `Details.tsx`, `progress.css`), `src/domain/releases.ts`, `docs/design/progres/`, `docs/v039/`.
- **Tests** :
  - Vitest complet : 702 réussis, 1 ÉCHOUÉ connu (Amara, extension de hanche, déjà en échec avant), 1 ignoré ;
  - Playwright complet : 176 réussis, 2 ÉCHOUÉS, 2 ignorés (Firebase). Échecs : `training-layout:325` (caméra Auto, connu, déjà en échec avant) et `coach-suggest:144` (délai dépassé sous forte charge CPU ; RÉUSSI relancé seul) ;
  - nouveau `tests/e2e/progres-v2.spec.ts` : 4 RÉUSSIS ;
  - Android réel : NON EXÉCUTÉ.
- **Rapport** : `docs/v039/PROGRES_V2.md`.

## 2026-10-23 · v0.40.0 · Préparation Freemium et Premium à vie

- **Demande** : « Préparation Freemium et Premium à vie » (Youssef, 2026-10-22 20:52) ; publication en autonomie pour la soirée (20:39). « Aucun paiement réel et aucun blocage de fonctionnalité dans cette livraison. »
- **Constat avant** : aucune notion de droits ni d'offre dans l'application ; pas de page Premium.
- **Correction** :
  - catalogue typé de 14 droits (`src/monetization/entitlements.ts`), couche de droits avec `MONETIZATION_ENABLED = false` : `canAccessFeature` répond toujours oui, rien n'est bloqué ;
  - statuts `free` et `premium_lifetime` ; aucun clic ni aucune commande de la version distribuée ne peut donner le statut Premium ;
  - prix centralisé et indicatif (39,99 € TTC) ; interface du futur paiement documentée, non implémentée ;
  - diamant doré discret sur les fonctions concernées (Créateur, analyse d'enchaînement, niveaux avancé et expert, programmes, Légendes, favoris, Historique, Activité, mode Décomposer, conseils techniques de la voix) ; il ouvre `/premium`, ne laisse aucun espace vide pour un utilisateur Premium et porte un libellé accessible ; aucun diamant sur « Créer un enchaînement » ni dans la barre ;
  - page `/premium` et entrée « Premium à vie » en neuvième case du Menu (pas d'onglet dans la barre) ;
  - réponse du Coach IA sur Premium ;
  - correction en passant : une ligne de réglage contenant un diamant est liée à son interrupteur (toucher le texte activait le diamant au lieu de l'interrupteur).
- **En attente de décision** : diamants des six disciplines et du rendu Anime (droits marqués « à confirmer », non affichés).
- **Fichiers** : `src/monetization/`, `src/ui/premium/`, `src/ui/components/SettingsPanel.tsx`, `src/ui/nav/`, `src/ui/App.tsx`, `src/coach/`, écrans portant un diamant, `src/domain/releases.ts`, `docs/v040/`.
- **Tests** :
  - Vitest complet : 712 réussis, 1 ÉCHOUÉ connu (Amara, extension de hanche, déjà en échec avant), 1 ignoré ;
  - `tests/e2e/premium.spec.ts` : 3 RÉUSSIS ;
  - Playwright complet : 178 réussis, 3 ÉCHOUÉS, 2 ignorés (Firebase). `navigation:51` attendait 8 entrées dans le Menu : test mis à jour pour la neuvième (Premium à vie), puis RÉUSSI. `coach-suggest:96` : délai dépassé sous charge, RÉUSSI relancé seul. `training-layout:325` (caméra Auto) : ÉCHOUÉ connu, déjà en échec avant ;
  - paiement réel : NON APPLICABLE ; Android réel : NON EXÉCUTÉ.
- **Rapport** : `docs/v040/PREMIUM.md`.

## 2026-10-23 · v0.41.0 · Programmes enrichis

- **Demande** : « Enrichissement des programmes » (Youssef, 2026-10-22) ; publication en autonomie pour la soirée (20:39).
- **Constat avant** :
  - 10 programmes déployés, alors que la branche `main` (v0.14, ancienne) n'en a que 8 : `judo-bases-solo` et `bjj-mobilite-solo` ont été ajoutés en v0.13.0. Aucun programme n'avait disparu ;
  - une seule séance répétée par programme, durées tapées à la main ;
  - bouton « Filtres » dans le contenu ; pas de suivi de progression.
- **Correction** :
  - 49 programmes : les 10 existants (identifiants inchangés) et 39 nouveaux sur 4 semaines, une séance par semaine. 8 par discipline pour la boxe, le kick-boxing, le MMA et le muay-thaï ; 7 pour le judo et le jiu-jitsu brésilien, avec la raison écrite (pas de programme inventé pour atteindre le quota) ;
  - sources : England Boxing, WAKO, IJF Academy et IBJJF consultés ; aucun ne publie de programme, donc aucun programme officiel ni adapté. Les 49 sont des programmes originaux, cités avec ce qui a été réellement lu ;
  - durées calculées à partir des blocs, repos et transitions. Trois noms qui annonçaient une durée fausse ont été renommés, avec les mêmes identifiants : « Cardio combat express », « Coordination express » et « Technique avancée multi-disciplines » ;
  - « Filtrer » dans la barre inférieure (discipline, niveau, durée, objectif, matériel), nombre de résultats, réinitialisation, filtres gardés pendant la navigation ;
  - fiche complète du programme, progression (séances faites et restantes), lancement de la séance de la semaine, y compris depuis « Continuer mon programme » ;
  - réponse du Coach IA mise à jour.
- **Fichiers** : `src/domain/{programCatalog,programSources,programs,programMeta,types}.ts`, `src/ui/screens/{Train,Programs,Training}.tsx`, `train.css`, `src/ui/training/{plan,useSession}.ts`, `src/ui/nav/config.ts`, `src/coach/appGuide.ts`, `src/domain/releases.ts`, `docs/v041/`.
- **Tests** :
  - Vitest complet : 722 réussis, 1 ÉCHOUÉ connu (Amara, extension de hanche, déjà en échec avant), 1 ignoré ;
  - Playwright complet : 178 réussis, 4 ÉCHOUÉS, 2 ignorés (Firebase) :
    - `train-resume:26` attendait 10 programmes ; `train-resume:94` attendait 12 séances pour un programme à 2 séances par semaine. Ces deux attentes ont été corrigées ;
    - `discipline-art` (Programmes) : l'icône de discipline manquait sur les tuiles du catalogue. Elle a été rétablie ;
    - après ces trois corrections, `train-resume`, `discipline-art`, `premium` et `app` ont été relancés : 26 RÉUSSIS ;
    - `training-layout:325` (caméra Auto) : ÉCHOUÉ connu, déjà en échec avant ;
  - Android réel : NON EXÉCUTÉ.
- **Rapport** : `docs/v041/PROGRAMMES.md`, `INVENTAIRE_PROGRAMMES.md`, `MATRICE_SOURCES.md`, `NON_EXECUTABLES.md`, captures dans `docs/v041/captures/`.

## 2026-10-23 · v0.42.0 · Crochets plus naturels

- **Demande** : « Correction biomécanique des crochets 3D » (Youssef, 2026-10-23 06:21), avant les nouveaux coachs. Branche dédiée `fix/crochets-biomeca-v042`, PR sans fusion automatique.
- **Constat avant (rendu réel et mesures, v0.41)** :
  - crochet avant (tête et corps) : coude 19 à 28 cm derrière la ligne des épaules à l'impact, épaule bloquée à sa limite de rotation externe (90°). Le moteur tournait alors le coude autour de l'axe épaule-main, d'où le bras « vrillé » ;
  - préparation trop large : le poing s'écartait sur le côté avant de partir, trajet 1,6 à 2,8 fois la ligne droite, armé visible de face ;
  - vitesse maximale du poing au tout début (0,05 à 0,07 s) au lieu de l'approche de l'impact ;
  - poignet aligné, pieds sans glissement : déjà corrects ;
  - PR #17 (`fix/natural-boxing-hooks-20261023`, basée sur v0.14) mesurée : pose d'impact inchangée (coude toujours 24 à 26 cm derrière), sauts de plan du coude plus grands (37°), poing plus lent. Non reprise, non fusionnée.
- **Correction** (`src/engine/library/boxing.ts`, seule la fonction `hook()`) :
  - bras d'impact construit dans un repère du tronc limité au cap, avec recherche de l'avancée du coude et de la flexion qui placent les phalanges devant la ligne centrale ;
  - le bras est recalé sur l'épaule réelle du squelette (`Author.solvedShoulder`, branchée dans `src/engine/library/index.ts`), parce que l'épaule estimée était décalée de 3 à 6 cm ;
  - préparation compacte : main à la garde, légère charge des hanches, rotation du tronc avant réduite (24°/10° au lieu de 34°/14°) ;
  - préparation plus courte (0,07 s) marquée `hold` pour garder la vitesse à l'impact ; frappe, maintien et retour inchangés ;
  - aucune autre technique modifiée ; Kadir et Amara inchangés.
- **Résultat (6 corps, droitier et gaucher)** : coude derrière 3 à 5 cm au plus, rotation externe 40 à 56°, trajet 1,02 à 1,32 fois la ligne droite, pic de vitesse entre 0,16 et 0,21 s pour un impact à 0,20 ou 0,23 s.
- **Fichiers** : `src/engine/library/boxing.ts`, `src/engine/author.ts`, `src/engine/library/index.ts`, `src/test/hooks.ts`, `src/engine/__tests__/hooks-biomeca.test.ts`, `src/engine/__tests__/hooks-chains.test.ts`, `scripts/dev/shot-hooks.mjs`, `src/domain/biomech/sources.ts`, `src/domain/releases.ts`, `package.json`, `tests/e2e/navigation.spec.ts`, mesures régénérées (`docs/audit-biomecanique/`, `src/ui/pictos/techniquePictos.json` : seuls les 4 crochets changent), `docs/v042-crochets/`.
- **Tests** :
  - `hooks-biomeca` : 14 RÉUSSIS (10 ÉCHOUÉS sur v0.41) ;
  - `hooks-chains` (8 enchaînements × 3 vitesses, Kadir et Amara, droitier et gaucher) : 16 RÉUSSIS (14 ÉCHOUÉS sur v0.41) ;
  - Vitest complet : 751 réussis, 1 ÉCHOUÉ connu (Amara, extension de hanche, déjà en échec avant), 1 ignoré ;
  - Playwright complet : 180 réussis, 2 ÉCHOUÉS, 2 ignorés (Firebase) :
    - `training-layout:325` (caméra Auto) : ÉCHOUÉ connu, déjà en échec avant ;
    - `coach-suggest:96` (flèches des questions suggérées) : ÉCHOUÉ, aussi relancé seul. Le même test échoue aussi sur v0.41 (1 essai sur 3). Cause : le test vérifie que la flèche est active pendant que le défilement se termine, puis elle se désactive avant le toucher. Aucun fichier du Coach IA n'est modifié, et la construction des mouvements prend le même temps (81 à 285 ms contre 106 à 251 ms). Correction du test à faire dans un lot séparé ;
  - validation visuelle par un entraîneur : NON EXÉCUTÉE ; Android réel : NON EXÉCUTÉ.
- **Constat hors périmètre, non corrigé** : pendant le direct d'Amara, le bras avant atteint 85° de rotation externe d'épaule (déjà le cas avant).
- **Rapport** : `docs/v042-crochets/RAPPORT.md`, `MESURES_CROCHETS.md`, captures dans `docs/v042-crochets/captures/`.

## 2026-10-23 · v0.42.0 (suite) · Un crochet par discipline

- **Demande** : « beaucoup mieux, mais plus naturel et lié à la discipline, fais-moi une proposition avant/après sur la même image » (Youssef, 09:25), puis « je valide » (09:56).
- **Constat** : la v0.42.0 réglait le crochet de la même façon dans les 4 disciplines, et les tests ne le mesuraient qu'en boxe. Mesuré dans les 4 disciplines, le crochet gardait deux défauts. En MMA et en muay-thaï, le poing allait le plus vite pendant la préparation (0,03 à 0,04 s pour un impact à 0,20 s). En muay-thaï, l'avant-bras tournait aussi par à-coups (10,7° en 1/120 s).
- **Correction** (`HOOK_STYLE`, `src/engine/library/boxing.ts`) :
  - **Boxe** : les genoux s'assoient dans le coup, l'épaule avant couvre le menton et la tête sort un peu de l'axe ;
  - **Kick-boxing** : le coach reste plus droit et pivote moins ;
  - **MMA** : il reste bas, le menton rentré, la tête hors de l'axe, avec une préparation plus lente et plus courte ;
  - **Muay-thaï** : il reste grand, le poids sur la jambe arrière ; les épaules tournent plus que les hanches et le poing est plus vertical ;
  - **Toutes les disciplines** : le poing finit un peu plus haut.
  - Sources écrites : Dynamic Striking (gardes de boxe et de muay-thaï), Sting Sports et J. Demmel dans Coach (MMA). Pour le kick-boxing, aucune source ne décrit le crochet : les écarts sont déduits de la garde.
- **Tests** :
  - `hooks-biomeca` étendu aux 4 disciplines (6 corps × 4 crochets × 2 gardes × 4 disciplines) : 14 RÉUSSIS ;
  - `hooks-chains` : 16 RÉUSSIS ;
  - Vitest complet : 752 réussis, 1 ÉCHOUÉ connu (Amara, extension de hanche), 1 ignoré ;
  - Playwright : NON EXÉCUTÉ de nouveau. Seules les valeurs du moteur ont changé ; la suite complète a été passée sur la première version de la v0.42.0.
- **Captures avant/après** : https://claude.ai/artifact/5o55fJa9KNFpnARVX9Bnt6

## 2026-10-23 · v0.43.0 · Équipements 3D réalistes

- **Demande** : « REFONTE RÉALISTE DES ÉQUIPEMENTS 3D » (Youssef, 2026-10-23) : gants de boxe en priorité, puis les autres équipements des 6 disciplines ; sans logo, sans service payant, sans protection ajoutée d'office, géométrie légère et partagée.
- **Constat** (audit `docs/v043-equipements/AUDIT.md`) :
  - seuls **2 coachs 3D existent** (Kadir et Amara), pas 36 ;
  - gant = deux œufs (moufle, pouce), manchette en tube, anneau de sangle flottant, 4 pièces par main ;
  - chaussures : bande blanche en dents de scie, pas de semelle ;
  - prajioud : anneau rigide qui flotte ; gants MMA : coque collée ;
  - le lissage des tenues ondulait les ourlets.
- **Correction** :
  - gant sculpté d'un seul tenant (`tools/generator/rocketbox/glove.py`, champ de distance + surface nets) : poing roulé, pouce soudé, manchette ouverte, sangle, passepoil et doublure colorés par sommet, lignes de coupe droites, grain de cuir ; la même forme sert au rendu Anime (`src/three/gloveShape.ts`, `glove_ts.py`) ;
  - chaussures de boxe mesurées sur le pied du coach (`shoes_v2`) : semelle, tige, col, doublure ;
  - prajioud tressé posé sur le contour mesuré du bras, nœud et deux pans (`prajioud_v2`) ;
  - protège-tibias matelassés avec deux sangles ; gants MMA avec sangle de poignet ;
  - le lissage ne déplace plus les sommets posés sur une ligne de coupe (`smooth(o, n, planes)`) ;
  - `src/three/outfit.ts` transmet les couleurs par sommet à la matière.
- **Performance** : tenue de boxe 12 → 6 appels de dessin (Kadir), 14 → 8 (Amara) ; gant limité à 3 100 triangles par main, comme en v0.42 (une première version à 4 100 ralentissait la séance d'environ 10 % dans le navigateur des tests, elle a été allégée) ; fichiers +50 à +230 Ko par tenue à gants. Tableau complet dans `docs/v043-equipements/RAPPORT.md`.
- **Fichiers** : `tools/generator/rocketbox/{glove.py,glove_ts.py,outfits.py}`, `public/coaches/mma-{kadir,amara}/tenues/{boxe,kickboxing,muaythai,mma}.glb`, `src/three/{gloveShape.ts,customize.ts,outfit.ts}`, `src/three/__tests__/outfit-v043.test.ts`, `scripts/dev/shot-gear.mjs`, `src/domain/releases.ts`, `package.json`, `tests/e2e/navigation.spec.ts`, `docs/v043-equipements/`.
- **Tests** :
  - `outfit-v043` (gants d'une pièce et pas plus lourds qu'avant, chaussures, appels de dessin, prajioud, sangle MMA, gant Anime) : 15 RÉUSSIS ;
  - Vitest complet : 767 réussis, 1 ÉCHOUÉ connu (Amara, extension de hanche, déjà en échec avant), 1 ignoré ;
  - Playwright complet (version compilée) : 180 réussis, 2 ÉCHOUÉS, 2 ignorés (Firebase). Les 2 échecs sont les mêmes qu'en v0.42 : `coach-suggest:96` (flèches des questions suggérées) et `training-layout:325` (caméra Auto). `coaching-hud:60` (bandeau des coups) est instable dans le navigateur des tests : il échoue aussi 2 fois sur 4 sur la v0.42 ;
  - Android réel : NON EXÉCUTÉ.
- **Captures avant/après** : `docs/v043-equipements/captures/` (16 planches : 2 coachs × 7 tenues + boxe en Anime).
- **Limites** : kimono absent en Anime (inchangé) ; sangles des protège-tibias visibles de profil ; gant jusqu'à 17 cm de large, pouce compris.

## 2026-10-23 · v0.44.0 · Barre du bas : actions de l'écran reconnaissables

- **Demande** : « AMÉLIORATION DE LA BARRE DE NAVIGATION CONTEXTUELLE » (Youssef, 2026-10-23 11:15) : teinte légère permanente sur les actions propres à l'écran, plus forte quand elles sont actives ; Retour et Menu neutres ; tokens du thème, clair et sombre ; transition 150 à 200 ms ; aucune taille ni ordre changés.
- **Constat** : toutes les places de la barre avaient la même couleur grise ; seule l'action active (Ralenti, Pause…) changeait.
- **Correction** :
  - règle centrale `slotRole(slot)` (`src/ui/nav/config.ts`) : Retour, Menu et les liens vers les grandes rubriques (`GLOBAL_PLACES`) sont « globaux », les autres actions « contextuelles » ;
  - `BottomBar.tsx` ajoute la classe `ctx` et `data-role` ;
  - `nav.css` : 4 variables tirées des couleurs du thème (`--nav-ctx`, `--nav-ctx-bg`, `--nav-ctx-active`, `--nav-ctx-active-bg`), transition existante de 0,18 s ;
  - les emplacements vides ou globaux ne sont jamais teintés.
- **Fichiers** : `src/ui/nav/{config.ts,BottomBar.tsx,nav.css}`, `src/ui/nav/__tests__/nav.test.ts`, `tests/e2e/nav-contextuelle.spec.ts`, `src/domain/releases.ts`, `package.json`, `tests/e2e/navigation.spec.ts`, `docs/v044-navigation/`.
- **Tests** :
  - `nav.test` (rôles par écran) : RÉUSSI (56 dans le dossier) ;
  - `nav-contextuelle` (couleurs lues sur la vraie barre au repos, active, au changement d'écran ; contraste ≥ 4,5:1 ; axe ; largeurs identiques ; clair et sombre) : 2 RÉUSSIS ;
  - Vitest complet : 770 RÉUSSIS, 1 ÉCHOUÉ connu (photo-coach, hanche d'Amara, déjà en échec avant), 1 ignoré ;
  - Playwright complet (version compilée) : 180 RÉUSSIS, 2 ignorés (Firebase), 4 ÉCHOUÉS : coach-suggest:96 et training-layout:325 (échecs connus, déjà présents en 0.42 et 0.43), coaching-hud:60 (instable, déjà en échec 2 fois sur 4 en 0.42), contrast.spec en thème sombre (voir ci-dessous) ;
  - contrast.spec, thème sombre : les libellés teintés de la barre passent par la mesure « au rendu » du test, qui lisait la couleur du texte après l'avoir rendue transparente (style calculé lu en direct) et comparait donc du noir au fond. Le test lit maintenant la couleur avant, accepte le format `color(srgb …)` de `color-mix()`, et masque l'icône voisine pendant la photo du fond. Après correction : 3/3 RÉUSSIS, clair et sombre, sans seuil abaissé ;
  - Android réel : NON EXÉCUTÉ.
- **Captures** : `docs/v044-navigation/captures/` (avant, après, planche comparative clair et sombre).

## 2026-10-23 · v0.45.0 · Page Premium à vie sur un seul écran

- **Demande** : « REFONTE PAGE PREMIUM À VIE » et « REPRODUCTION FIDÈLE DE LA MAQUETTE PREMIUM » (Youssef, 2026-10-23 11:08 et 11:11), maquette `maquettes/premium-2026-10-23/maquette-premium-definitive.png`.
- **Constat** : la page défilait (1 330 px pour un écran de 851 px), répétait 4 fois « achat unique », listait 8 avantages en colonne et n'avait aucune entrée pour restaurer un achat.
- **Correction** :
  - page sur un seul écran : en-tête, diamant, une seule phrase de conditions, grille de 6 catégories, carte « Accès Premium à vie » et bouton « Découvrir l'offre » ;
  - barre du bas Retour | Avantages | FAQ | Restaurer | Menu ;
  - 4 panneaux au-dessus de la barre (Avantages, FAQ, Restaurer, Offre), un seul ouvert, fermés par la croix, Retour ou Échap ;
  - `restorePurchases()` répond « indisponible » tant qu'aucune boutique n'est branchée, sans faux succès ; aucun paiement possible, et la page le dit.
- **Fichiers** : `src/ui/premium/{PremiumPage.tsx,premium.css}`, `src/ui/nav/{config.ts,icons.ts,NavSheets.tsx,nav.css}`, `src/monetization/{entitlements.ts,purchases.ts}`, `src/monetization/__tests__/rights.test.tsx`, `tests/e2e/{premium.spec.ts,premium-panels.spec.ts,navigation.spec.ts}`, `scripts/dev/shot-premium.mjs`, `src/domain/releases.ts`, `package.json`, `docs/v045-premium/`.
- **Tests** :
  - `rights.test`, `premium.spec`, `premium-panels.spec` : RÉUSSIS ;
  - Vitest complet : 774 RÉUSSIS, 1 ÉCHOUÉ connu (photo-coach, hanche d'Amara), 1 ignoré ;
  - Playwright complet (version compilée) : 189 RÉUSSIS, 2 ignorés (Firebase), 2 ÉCHOUÉS connus (`coaching-hud:60`, `training-layout:325`, déjà en échec avant cette version) ;
  - Android réel : NON EXÉCUTÉ.
- **Écarts avec la maquette** : tutoiement partout, prix indicatif gardé dans le panneau Offre seulement, « futures mises à jour » retiré, « Google Play par exemple » au lieu d'« App Store » (détail dans `docs/v045-premium/RAPPORT.md`).
- **Captures** : `docs/v045-premium/captures/`.

## 2026-10-23 · v0.45.1 · Barre du bas monochrome

- **Demande** : « Correctif mineur de navigation » (Youssef, 2026-10-23 16:05) : supprimer les fonds individuels des boutons, hiérarchie en gris jour et nuit, pas de rouge ni de rose pour l'état actif, tokens du thème, composant commun seulement.
- **Constat** : depuis la v0.44, les actions de l'écran avaient un fond rosé et une couleur rouge adoucie, l'action active un fond et un rouge plus marqués ; la rubrique active d'un lien était rouge sur fond gris.
- **Correction** (`src/ui/nav/nav.css`) : variables `--nav-neutral` (= `--muted`), `--nav-ctx` (graphite, mélange de `--c-text` et `--muted`), `--nav-active` (= `--c-text`) ; plus aucun fond par place ; libellé actif en graisse 750 ; transition sur la couleur seule (0,18 s). Rien d'autre ne change : places, icônes, ordre, tailles, actions, panneaux, thème.
- **Fichiers** : `src/ui/nav/nav.css`, `tests/e2e/nav-contextuelle.spec.ts`, `scripts/dev/shot-bars.mjs`, `src/domain/releases.ts`, `package.json`, `tests/e2e/navigation.spec.ts`, `docs/v0451-navigation/`.
- **Tests** :
  - `nav-contextuelle.spec` réécrit pour la nouvelle règle (aucun fond, gris sans rouge, graphite plus contrasté que Retour et Menu, active plus contrastée et plus grasse, contraste ≥ 4,5:1, axe ; clair et sombre) : 2 RÉUSSIS ;
  - `contrast.spec`, `navigation.spec`, `premium-panels.spec`, `theme.spec` : 41 RÉUSSIS ;
  - Vitest `src/ui/nav` et `src/domain` : 207 RÉUSSIS ;
  - Android réel : NON EXÉCUTÉ.
- **Captures** : `docs/v0451-navigation/captures/` (dont `planche-ecrans.png` : Premium, Entraîner, Techniques, Progrès en clair et en sombre).


## 2026-10-23 · Pont et rétention de garde : pieds tournés vers l'extérieur (sans version)

- **Constat** (audit de la PR #23, 2026-10-23) : le test `photo-coach` échouait depuis la v0.29 (hanche d'Amara 53,9° sur le pont, 53,6° sur la rétention de garde, limite 45°), aussi sur la branche de référence `feature/combat-shadow-v030`. Cause : en position allongée (`supine` et `lieBack`, `src/engine/library/grappling.ts`), les pieds à plat étaient tournés de 8° vers l'intérieur. Le tibia se tordait contre le pied (23 à 30°, limite d'un pied posé 15°), le moteur faisait tourner le genou pour compenser et le genou basculait d'environ 40° d'une image à l'autre (Kadir : hanche +45° à 0,30 s puis −30° à 0,35 s).
- **Correction** : pieds tournés de 8° vers l'extérieur, comme dans la position assise qui précède. Aucun changement du moteur, des modèles, des limites ni des tests. Rotation de hanche maintenant continue, entre 5° et 32°, pour Kadir et Amara.
- **Fichiers** : `src/engine/library/grappling.ts`, documents de mesures régénérés (`docs/audit-biomecanique/MESURES_{CHEVILLES,MOTEUR,TORSIONS}.md`), `src/ui/pictos/techniquePictos.json`.
- **Tests** : TypeScript RÉUSSI ; Vitest complet 775 RÉUSSIS, 1 ignoré, 0 ÉCHOUÉ (dont `photo-coach`) ; Playwright NON EXÉCUTÉ (aucun écran modifié) ; Android réel NON EXÉCUTÉ.
- **PR #23 (Biomécanique test)** : fermée sans fusion sur décision de Youssef (2026-10-23 17:25).

## 2026-10-23 · v0.46.0 · Encyclopédie du combat, version 1.0

- **Demande** : « Création de l'Encyclopédie du combat — Version 1.0 » (Youssef, 2026-10-23) et sa maquette (`maquettes/encyclopedie-2026-10-23/`).
- **Ajout** : 136 fiches en 8 familles (techniques, positions et déplacements, équipements, lieux et surfaces, règles et arbitrage, préparation physique, sécurité, culture), 71 sources datées, 73 illustrations faites dans le dépôt (rendus de Kadir et Amara, scènes Blender), 45 annoncées « à produire » avec leur brief ; recherche (noms internationaux, synonymes, accents), filtres dans l'adresse, A–Z, favoris gardés (`favTerms` dans `css-goals`, ancien enregistrement complété sans rien effacer) ; entrée du Menu ; liens dans les deux sens avec les fiches techniques ; entrée du coach IA.
- **Fichiers** : `src/domain/encyclopedia/`, `src/ui/encyclopedia/`, `src/ui/nav/`, `src/ui/App.tsx`, `src/ui/screens/Library.tsx`, `src/store/goals.ts`, `src/coach/{appGuide.ts,questionBank.ts}`, `public/encyclopedie/`, `scripts/encyclopedie/`, `scripts/dev/shot-encyclopedie.mjs`, `tests/e2e/{encyclopedie,navigation}.spec.ts`, `src/domain/releases.ts`, `package.json`, `docs/v046-encyclopedie/`.
- **Tests** : détail dans `docs/v046-encyclopedie/RAPPORT.md` §6. Vitest 792 RÉUSSIS ; Playwright 198 RÉUSSIS au complet puis 3 des 5 échecs corrigés ou réussis au second passage ; 2 ÉCHOUÉS hors de cette version (`training-layout:325`, `coach-suggest:96`, ce dernier aussi en échec sur la v0.45.1) ; Android réel NON EXÉCUTÉ.
- **Limites** : aucune relecture par un expert ; 45 illustrations à produire.


## 2026-10-23 · v0.47.0 · Chronomètre intégré au coach 3D

- **Demande** : « Chronomètre intégré au coach 3D » (Youssef, 2026-10-23, 18 sections).
- **Constat** : le temps de séance était décompté par un minuteur de 100 ms, phase par phase. Un tic en retard perdait du temps, un repos suivait le dernier round, Cardio n'avait aucun réglage, Libre et Technique n'affichaient aucun temps, et un exercice lancé seul en Rounds ou Cardio enchaînait sur les autres exercices du niveau.
- **Correction** : un moteur temporel unique (`src/domain/session/timeline.ts`) sur une horloge monotone. Il rattrape les tics en retard, met en pause exactement et n'ajoute aucun repos après le dernier round. Il envoie des événements que la séance transforme en gongs, voix, consignes, coach et statistiques, sans jamais toucher aux articulations du coach.
  - Préparation réglable, en ambre.
  - Bandeau « Combat · Round n/N », « Effort · Cycle n/N », « Repos », « Récupération ».
  - Temps écoulé en Libre et Technique.
  - Barre de la phase en cours.
  - Cardio : effort, récupération, cycles et intensité. L'intensité règle la cadence, pas la vitesse des mouvements ; la cadence est plus large au sol.
  - Alerte avant la fin, gongs et voix sans doublon.
  - Bilan de fin, et historique « terminée » ou « interrompue » sans double comptage.
- **Fichiers** : `src/domain/session/`, `src/ui/training/{useSession.ts,plan.ts,TimerOptions.tsx,training.css}`, `src/domain/catalog/plan.ts`, `src/ui/screens/{Training.tsx,Discipline.tsx,Champions.tsx,creator/CreatorSheet.tsx}`, `src/store/{settings.ts,stats.ts}`, `src/domain/resume.ts`, `tests/e2e/{chrono,coaching-hud,navigation}.spec.ts`, `scripts/dev/shot-chrono.mjs`, `src/domain/releases.ts`, `package.json`, `docs/v047-chrono/`.
- **Tests** : détail dans `docs/v047-chrono/RAPPORT.md` §6.
  - TypeScript : RÉUSSI.
  - Vitest : 803 RÉUSSIS, 1 ignoré.
  - `chrono.spec` : 6 RÉUSSIS.
  - Playwright complet : 207 RÉUSSIS après relance, 2 ignorés, 2 ÉCHOUÉS déjà en échec sur la v0.46.0 (`coach-suggest:96`, `training-layout:325`).
  - Android réel : NON EXÉCUTÉ.
- **Captures** : `docs/v047-chrono/captures/`.
- **Changement de comportement** : un exercice seul en Rounds ou Cardio s'arrête après ses propres rounds. Les programmes enchaînent toujours.

## 2026-10-27 · v0.48.0 · Chrono de combat

- **Demande** : un chronomètre paramétrable seul, ouvert depuis la barre du bas à la place de « Techniques » (Youssef, 2026-10-23 20:43), maquette B « Plein écran » choisie le 2026-10-27.
- **Constat** : le chronomètre de la v0.47 n'existait que dans l'écran d'entraînement, avec le coach 3D.
- **Ajout** : écran `/chrono` (round, repos et rounds avec − et +, 7 formats prêts, durée totale, options de la v0.47), séance plein écran à la couleur de la phase, pause d'un toucher n'importe où, « Arrêter » et « Passer la phase », bilan, historique « terminée » ou « interrompue ». « Chrono » remplace « Techniques » dans la barre ; Techniques reste dans le Menu. Même moteur de temps que la v0.47, avec `skip()` en plus.
- **Fichiers** : `src/domain/chrono.ts`, `src/domain/session/timeline.ts`, `src/ui/chrono/`, `src/ui/App.tsx`, `src/ui/nav/{config.ts,icons.ts}`, `src/store/settings.ts`, `src/coach/{appGuide.ts,questionBank.ts}`, tests, `scripts/dev/shot-chrono-seul.mjs`, `src/domain/releases.ts`, `package.json`, `docs/v048-chrono/`.
- **Tests** : détail dans `docs/v048-chrono/RAPPORT.md` §5. Vitest 806 RÉUSSIS ; `chrono-seul.spec` 5 RÉUSSIS ; Playwright complet 213 RÉUSSIS, 2 ÉCHOUÉS déjà en échec sur la v0.46.0 (`coach-suggest:96`, `training-layout:325`) ; Android réel NON EXÉCUTÉ.

## 2026-10-27 · v0.49.0 · Moteur à part et lumière vive

- **Demande** : garder le moteur de Shadow, l'améliorer avec ce qui est bon dans CME, et en faire « une espèce de module à part » qui peut évoluer étape par étape (Youssef, 2026-10-27 12:47). Puis : pourquoi les personnages de CME paraissent mieux aboutis (12:53).
- **Constat** : le Kadir de CME est le même fichier que celui de Shadow ; seule la lumière diffère. 16 fichiers de l'application entraient directement dans les fichiers du moteur.
- **Correction** :
  - moteur 1.0.0 en module : porte d'entrée unique `src/engine/index.ts`, version, journal et mode d'emploi (`docs/moteur/`), test de frontière ;
  - lissage selon la vitesse repris de CME ;
  - option « Lumière du coach » (Studio par défaut, Vive = lumière et fond sombre de CME) ;
  - aide des tests de bout en bout corrigée (clé des réglages).
  - Aucun mouvement modifié. Épaule de Kadir non modifiée : décision à prendre par Youssef.
- **Fichiers** : voir `docs/v049-moteur/RAPPORT.md` §3.
- **Tests** : Vitest 814 RÉUSSIS ; `moteur-lumiere.spec` 2 RÉUSSIS ; Playwright complet 214 RÉUSSIS, 3 ÉCHOUÉS hors de cette version (`coach-suggest:96`, `training-layout:325`, `coaching-hud:60`, ce dernier aussi en échec sur la v0.48.0 au même moment) ; Android réel NON EXÉCUTÉ.

## 2026-10-27 · 1.0.0 (lot 1 sur 5, non publié) · Refonte ergonomique : fondations

- **Demande** : refonte ergonomique 1.0.0 selon le plan et la maquette v4 validés (Youssef, 2026-10-27) : « Aucune perte de contenu. Réorganisation, logique et intelligente », « n'oublie pas le mode jour/nuit ».
- **Changement** (branche `feature/refonte-v100`, lien public toujours sur la v0.49.0) :
  - thème Nuit par défaut pour une nouvelle installation, choix déjà enregistrés conservés ; libellés Nuit / Jour / Auto ;
  - couleur de la discipline principale sur le gros bouton (`src/ui/theme/disciplines.ts`, contraste vérifié par test) ;
  - barre fixe à 5 onglets (Accueil, Entraîner, Apprendre, Progrès, Profil), gros bouton d'action, Retour en haut à gauche, « Plus » pour les commandes de l'écran ;
  - Menu retiré : chaque entrée reste joignable (onglets, onglets de section Apprendre et Progrès, Profil › Mon coach / Coach IA / Réglages, Réglages › Premium et Nouveautés), vérifié par `src/ui/nav/__tests__/refonte.test.ts` ;
  - corrections après la suite complète : barre remesurée en sortant du plein écran total (`BottomBar.tsx`), Retour dans la rangée d'actions sur l'atelier du combattant (`backInRow`, il cachait le bouton « Corps ») ; le test « Lumière du coach » attend l'écriture en IndexedDB avant de recharger (1 échec sur 3 sans cela).
- **Tests** :
  - TypeScript : RÉUSSI. Vitest : 835 RÉUSSIS, 1 ignoré.
  - Playwright complet (avant les corrections ci-dessus) : 208 RÉUSSIS, 2 ignorés, 11 ÉCHOUÉS dont 3 déjà en échec avant (`coach-suggest:96`, `training-layout:325`, `coaching-hud:60`).
  - Relance des 9 fichiers touchés après corrections : tous RÉUSSIS.
  - Android réel : NON EXÉCUTÉ.

## 2026-10-27 · 1.0.0 (lot 2 sur 5, non publié) · Refonte ergonomique : onglets d'Entraîner et de Profil

- **Demande** : suite du plan validé (Youssef, 2026-10-27) : chaque place de la barre a ses onglets en haut, sans perte de contenu.
- **Changement** (branche `feature/refonte-v100`, commit `dcd7a8b`) :
  - Entraîner : onglets Séance, Programmes, Enchaînements, Favoris et Chrono ; l'ancien espace « Programmes » mène à `/programmes` (choix enregistré conservé) ;
  - nouvel écran Favoris (`/favoris`) : les favoris de la bibliothèque et l'accès aux combinaisons favorites des Légendes ; les anciens liens `?tab=favoris` et `?tab=legendes` redirigent ;
  - Profil : onglets Mes infos, Mon coach, Coach IA et Réglages (point rouge tant que la nouvelle version n'est pas vue) ; la liste de liens en double sur Profil est retirée ;
  - un lien déjà présent dans les onglets n'est plus répété au-dessus de la barre ; onglets cachés pendant le chrono en cours.
- **Tests** :
  - Vitest : RÉUSSIS (dont `refonte.test.ts` pour les onglets et l'absence de doublons).
  - Playwright complet : 208 RÉUSSIS, 2 ignorés, 11 ÉCHOUÉS. 8 venaient de l'ancien contrat de la barre (tests mis à jour au lot 3, puis RÉUSSIS) ; 3 déjà en échec avant (`coach-suggest:96`, `training-layout:325`, `coaching-hud:60`).
  - Android réel : NON EXÉCUTÉ.

## 2026-10-27 · 1.0.0 (lot 3 sur 5, non publié) · Accueil, « Rechercher ou demander au coach », Lumière vive

- **Demande** : maquette v4 validée : un accueil qui ne garde que ce qui sert à démarrer, et une barre « Rechercher ou demander au coach » qui remplace la bulle du Coach IA. Puis « Lumière vive OK » (Youssef, 2026-10-27 19:55).
- **Changement** :
  - Accueil : « Reprendre » avec la dernière discipline et la dernière séance (un toucher choisit la discipline parmi les six), le coach, trois tuiles (Séance rapide, Technique du jour, Chrono seul), l'objectif de la semaine avec les vrais chiffres (sinon « Aucun objectif fixé »), une ligne « Programme » et « Pour toi » ; gros bouton « Reprendre » dans la barre (« Commencer » avant la première séance). Statistiques dans Progrès, favoris dans Entraîner › Favoris : rien n'est perdu.
  - Recherche locale (`src/domain/search.ts`) : techniques, encyclopédie, programmes, écrans et réglages, sans accents ni majuscules ; la première ligne pose la question au Coach IA (`src/ui/nav/SearchSheet.tsx`).
  - Place du champ : entier si l'écran a une action au plus, rond avec deux, et première commande de « Plus » à partir de trois actions (Techniques, Progrès, Légendes) pour que les mots tiennent sur 360 px ; jamais en séance. Le Coach IA reste aussi dans « Plus » sur tous les écrans.
  - Lumière du coach « Vive » par défaut ; un choix « Studio » déjà enregistré est gardé.
  - Guide du Coach IA mis à jour pour la barre, la recherche et l'accueil (les textes sur la séance seront revus au lot 4).
- **Tests** :
  - Vitest : 845 RÉUSSIS, 1 ignoré (dont recherche, `searchShape`, guide).
  - Playwright : nouveau `accueil-recherche.spec` (accueil, sélecteur de discipline, recherche, Coach IA, contraste Jour et Nuit à 360 × 640) et fichiers touchés : RÉUSSIS. `coach-suggest:304` a échoué une fois puis RÉUSSI deux fois (instable) ; `coach-suggest:96` ÉCHOUÉ, déjà en échec avant.
  - Android réel : NON EXÉCUTÉ.

## 2026-10-27 · 1.0.0 (lot 4 sur 5, non publié) · Séance mains libres

- **Demande** : maquette v4 validée, écran « Séance » : le téléphone posé devant soi, on s'entraîne sans le toucher.
- **Changement** :
  - pendant la séance, seuls Retour et Pause restent dans la barre ; Décomposer, Caméra et « Plus » reviennent avec la pause (`html[data-hands-free]`, `src/ui/nav/nav.css`) ;
  - un toucher n'importe où sur le coach met en pause (attendu 320 ms pour ne pas gêner le double toucher du plein écran, `useStageFullscreen.ts`) ; un toucher pendant la pause ne relance pas, c'est « Reprendre » ; en plein écran total, un toucher réaffiche les commandes comme avant, sans pause ;
  - vibrations (si l'appareil le permet) au départ, à la pause, à la reprise et à chaque changement de phase (travail, repos, fin) ;
  - glisser le doigt à gauche ou à droite change d'onglet dans un espace (Entraîner, Apprendre, Progrès, Profil), sans boucler ; jamais sur le coach, un curseur, un champ, une liste qui défile de côté, ni quand une fenêtre est ouverte (`src/ui/nav/swipe.ts`) ;
  - guide du Coach IA : textes de la séance mis à jour (« Plus », mode mains libres) ;
  - coach entier dans le cadre aussi pour le cadre du nouvel accueil (`camera.test.ts`) ;
  - défauts vus sur les captures et corrigés : « Démarrer » et « Reprendre » coupés dans le gros bouton à côté de Retour, Décomposer, Caméra et « Plus » (« Plus » prend la largeur des autres actions, et sous 420 px le gros bouton garde son mot sans son icône) ; « Pause » écrit en clair sur un gros bouton jaune (MMA), illisible : il garde l'encre foncée du gros bouton.
- **Tests** :
  - TypeScript : RÉUSSI. Vitest : 849 RÉUSSIS, 1 ignoré (dont `swipe.test.ts`).
  - Playwright : nouveau `seance-mains-libres.spec` (mains libres, toucher = pause, double toucher = plein écran sans pause, mots entiers à 360 et 393 px, « Pause » lisible, glisser entre onglets) RÉUSSI ; avec `navigation`, `nav-contextuelle` et `chrono-seul` : 39 RÉUSSIS. Fichiers de la séance relancés : `coach-render`, `fullscreen-dbltap`, `nav-contextuelle`, `app`, `coach-bubble`, `coach-panel-size`, `coaching-hud`, `navigation` RÉUSSIS ; `training-layout` 11 RÉUSSIS, 1 ÉCHOUÉ déjà en échec avant (caméra Auto).
  - Tests adaptés au nouveau contrat, sans rien affaiblir : « Plus » s'ouvre après la pause (`nav-helpers`), Reprendre avant de mesurer le chrono (`coach-render`), Décomposer exigé masqué en mains libres et visible sinon (`training-layout`), bouton rond de recherche compté sur la fiche (`nav-contextuelle`, lot 3).
  - Premier passage : un toucher en plein écran mettait en pause (`fullscreen-dbltap`, 2 ÉCHOUÉS) ; corrigé, puis RÉUSSI.
  - Android réel : NON EXÉCUTÉ.

## 2026-10-27 · 1.0.0 (lot 5 sur 5, non publié sur le lien public) · Aucune perte, notes de version, 1.0.0

- **Demande** : fin du plan validé : prouver ligne par ligne qu'aucun contenu n'est perdu, puis livrer la 1.0.0.
- **Changement** :
  - nouveau test `tests/e2e/aucune-perte-v100.spec.ts` : les 28 lignes du tableau « Où va chaque contenu » du plan, chacune atteinte au doigt depuis la barre du bas et vérifiée sur son contenu (rapport `docs/v100/RAPPORT.md`) ;
  - écart trouvé par la suite complète et corrigé : l'Accueil avait perdu l'icône officielle de la discipline principale (présente depuis la 0.24) ; elle revient dans la carte « Reprendre » ;
  - notes de version 1.0.0 dans Nouveautés (`src/domain/releases.ts`), version 1.0.0 dans `package.json` (titre « Combat Shadow Studio v1.0.0 ») ;
  - tests mis à jour au nouveau contrat : Nouveautés attend la 1.0.0 en tête ; le studio qui suit le thème Jour ou Nuit est celui de la lumière « Studio » (la lumière « Vive », par défaut depuis le lot 3, a son propre fond sombre, déjà vérifié par `moteur-lumiere.spec`).
- **Tests** :
  - TypeScript : RÉUSSI. Vitest : 849 RÉUSSIS, 1 ignoré.
  - Playwright complet (240 tests, 34,9 min) : 233 RÉUSSIS, 2 ignorés (Firebase), 5 ÉCHOUÉS : `discipline-art` Accueil (icône perdue, corrigée), `theme:77` Jour et Nuit (contrat Vive, test adapté), `coach-bubble:66` (instable, RÉUSSI à la relance), `training-layout:329` caméra Auto (déjà en échec avant la refonte). Relance des 4 fichiers concernés après correction : 30 RÉUSSIS.
  - `aucune-perte-v100.spec` : 6 RÉUSSIS.
  - Android réel : NON EXÉCUTÉ.

## 2026-10-28 · 1.1.0 · Recherche dans la barre et écrans allégés

- **Demande** : retours de Youssef sur la 1.0.0 (2026-10-27 23:18 → 2026-10-28 00:10), chaque point choisi sur maquette dynamique : loupe A, ligne de filtres A « trois menus », Chrono dans Séance, écrans sans défilement, vitesse dès le départ, grille des jours, question des statuts dans la recherche.
- **Constat après vérification** :
  - la page d'une discipline empilait niveau, style et type sur trois blocs : l'écran défilait avant la première technique ;
  - plusieurs champs de recherche différents (barre et « Rechercher dans équipements », etc.) ;
  - « Caméra » dans Réglages ouvrait la même page qu'« Affichage » ;
  - la vitesse n'était réglable qu'en pause, le grand compte à rebours rouge cachait le coach, Disciplines et Chrono de combat défilaient sur 393 × 851.
- **Changement** (détail dans `docs/v110/RAPPORT.md`, captures jour et nuit dans `docs/v110/captures/`) :
  - « Rechercher » prend la 5e place de la barre ; Profil = photo en haut à droite, à côté du ⋮ des options de l'écran (`BottomBar.tsx`, `NavSheets.tsx`, `nav.css`) ; la recherche filtre la liste de l'écran (Entrée) et remplace les champs des écrans ; Coach IA par la recherche, et par « Plus › Rechercher » en séance et au chrono ;
  - page discipline : niveau, style (kick-boxing) et type sur une ligne de puces menus Android (`MenuChip.tsx`, `KickboxingStyleChip`), explications et sources dans les menus, Retour d'Android ferme le menu d'abord ;
  - Chrono = 3e choix de Séance ; « Caméra » retiré de Réglages ; grand compte à rebours retiré ; vitesse « ×1 » sur le coach dès le départ ; 6 disciplines et Chrono de combat sans défilement ; ADN de la bibliothèque sans « nombre inspiré » ni « jouables en 3D » ; « Que signifient les statuts ? » devient une question de la recherche ; jours d'entraînement en grille de 7 jours (ancien nombre gardé) ;
  - guide du Coach IA et Nouveautés 1.1.0 mis à jour, version 1.1.0.
- **Défauts trouvés par les tests et corrigés** : photo et ⋮ posés sur le studio du combattant (contraste, cadrage) → cachés sur les outils plein écran ; choix de vitesse sous l'astuce du coach → colonne sous « ×1 » ; Échap fermait aussi le panneau ouvert dessous → seul le panneau du dessus répond ; emblème de 72 px qui cachait le nom de la discipline → 52 px.
- **Tests** :
  - TypeScript : RÉUSSI. Vitest : 849 RÉUSSIS, 1 ignoré.
  - Nouveau `tests/e2e/corrections-v110.spec.ts` (ligne de filtres, loupe et recherche de l'écran, sans défilement, vitesse, grille des jours, statuts) : RÉUSSI.
  - Playwright complet n° 1 : 221 RÉUSSIS, 23 ÉCHOUÉS, 2 ignorés ; surtout des tests écrits pour l'ancienne navigation, adaptés au nouveau contrat sans rien affaiblir, plus les 4 défauts ci-dessus corrigés. Relances ciblées : 100 RÉUSSIS / 8 ÉCHOUÉS, puis 55 / 2, puis `train-resume` 6/6.
  - Playwright complet final (246 tests, 33,4 min) : 241 RÉUSSIS, 2 ignorés (Firebase), 3 ÉCHOUÉS : `emblems:24` (mesure 51,99998 px pour 52 : comparaison au dixième de pixel), `nav-contextuelle:97` Nuit (la barre est remontée un instant pendant le chargement de Progrès : le test attend qu'elle soit là) — relance de ces deux fichiers : 5 RÉUSSIS ; `training-layout:329` caméra Auto ÉCHOUÉ, déjà en échec avant la 1.0.0.
  - Android réel : NON EXÉCUTÉ.

## 2026-10-28 · 1.1.1 · Plus de doublon de la recherche

- **Demande** (Youssef, 07:19, avec deux captures, en validant la PR #31) : « Le créateur d'enchaînement doit garder les icônes » ; « Dans le bouton en bas à droite plus si uniquement rechercher le retirer car en doublon ».
- **Constat après vérification** :
  - sur le Chrono de combat, « Plus » ne contenait que « Rechercher » (ajouté en 1.1.0 pour la séance et le chrono), alors que la loupe est déjà dans la barre du bas sur cet écran ; seule la séance cache les places de la barre ;
  - le créateur d'enchaînement (« Ajouter un mouvement ») a toujours ses pictogrammes et son champ de recherche : la 1.1.0 n'y avait pas touché (seule la liste « Mes enchaînements » passe par la loupe). Aucun test ne le protégeait.
- **Changement** :
  - « Plus » n'apparaît plus qu'avec des commandes de l'écran, ou pendant la séance où « Rechercher » y reste (`BottomBar.tsx`, `NavSheets.tsx`) ;
  - nouveau test qui garde les icônes et la recherche du choix des mouvements ;
  - Nouveautés 1.1.1, version 1.1.1.
- **Tests** :
  - TypeScript : RÉUSSI. Vitest : 849 RÉUSSIS, 1 ignoré.
  - Playwright (corrections-v110 dont les 2 nouveaux tests, navigation, chrono, chrono-seul, coach-bubble, accueil-recherche, createur-v2, nav-contextuelle, aucune-perte-v100) : 69 RÉUSSIS, 2 ÉCHOUÉS : `navigation:172` (attendait la 1.1.0 en tête, mis à jour) ; `chrono:30` instable (la préparation dure 3 s et la machine chargée lisait sa couleur après la fin) : la page enregistre maintenant l'aspect de la préparation au moment où elle s'affiche, sans rien retirer de ce qui est vérifié ; relances 18/18 RÉUSSIS et 2/2 pour `navigation:172`.
  - Android réel : NON EXÉCUTÉ.

## 2026-10-28 · 1.2.0 · Profil et réglages en listes

- **Demande** (Youssef, 28 octobre) : « lorsqu'on clique sur la tête en haut à droite, 2 onglets glissants : Mes infos & Réglages avec tout le reste dans Réglages : une page avec toutes les options en liste bien présentées qui se déploient quand on clique dessus » ; « pareil dans Mes infos » ; proposition choisie B « Groupes Android ». Rappels : aucune perte de contenu, mode jour et nuit.
- **Constat** : Profil avait 4 onglets (Mes infos, Mon coach, Coach IA, Réglages) ; Mes infos et Réglages étaient de longues pages de panneaux, avec des réglages d'affichage et de données dans Mes infos.
- **Changement** (détail et tableau « où va chaque contenu » dans `docs/v120/RAPPORT.md`, captures jour et nuit dans `docs/v120/captures/`) :
  - Profil = 2 onglets, Mes infos et Réglages ; Mon coach et Coach IA deviennent des lignes de Réglages (les pages `/coach` et `/coach-ia` restent) ;
  - chaque onglet est une seule liste en groupes, chaque ligne montre sa valeur et s'ouvre sur place, une à la fois ; Retour referme la ligne d'abord (`src/ui/components/SettingsList.tsx`, styles `.set-*`) ;
  - taille du texte, animations, langue et « M'appeler par mon pseudo » passent dans Réglages ; export, effacement et confidentialité regroupés dans Réglages › Données et confidentialité ; anciennes adresses `/reglages/<section>` ouvrent la bonne ligne ;
  - guide du Coach IA, recherche et Nouveautés 1.2.0 mis à jour, version 1.2.0.
- **Défauts trouvés en vérifiant et corrigés** : lignes qui débordaient à droite ; résumé de l'identité ambigu ; repère de la pastille Nouveautés.
- **Tests** :
  - TypeScript : RÉUSSI. Vitest : 849 RÉUSSIS, 1 ignoré.
  - Nouveau `tests/e2e/profil-v120.spec.ts` : 6/6 RÉUSSIS. 15 fichiers adaptés sans retirer de vérification.
  - Playwright complet (254 tests, 37,5 min) : 250 RÉUSSIS, 2 ignorés (Firebase), 2 ÉCHOUÉS : `training-layout:329` (déjà en échec avant la 1.0.0) et `coach-suggest:98` (ÉCHOUÉ aussi sur la 1.1.1, sans lien avec ce lot).
  - Android réel : NON EXÉCUTÉ.


## 2026-10-28 · 1.3.0 · Consignes enchaînées sous le coach

- **Demande** (Youssef, 28 octobre) : « A avec un enchaînement temporisé des consignes pour gain de place », « mode Enchaîné ==> OK » ; puis, pendant le lot : bouton « S'entraîner » grisé qui masque les options de visualisation (capture) ; haut-parleur « comme sur Windows », un toucher par cran, volume visible dans l'icône, sous les deux boutons de droite ; retirer les ⋮ de Mes infos et Réglages ; version sous la photo à remettre après le titre.
- **Constat après vérification** : 67 couples technique/discipline n'avaient aucun exercice qui les travaille, d'où le bouton grisé (ex. high kick avant en MMA) ; la scène de la fiche technique laissait les angles de caméra sous le gros bouton à l'ouverture ; le ⋮ de Mes infos ne contenait que « Coach » et celui de Réglages « Affichage », déjà présents comme lignes ; la version était alignée à droite, sous la photo.
- **Changement** (détail dans `docs/v130/RAPPORT.md`, captures jour et nuit dans `docs/v130/captures/`) : bande des consignes sur le sol (`ConsigneBand.tsx`), caméra qui garde le coach au-dessus, réglage Enchaînées / Point du moment et 2,5 / 3,5 / 5 s ; séance d'une technique seule (`techniquePlan`) ; hauteur de la scène de la fiche ; haut-parleur à crans (`SoundButton.tsx`) ; pas de ⋮ sur Mes infos et Réglages ; version après le titre ; Nouveautés 1.3.0, version 1.3.0.
- **Tests** : TypeScript RÉUSSI ; Vitest 858 RÉUSSIS, 1 ignoré ; nouveau `consignes-v130.spec.ts` 9/9 RÉUSSIS ; Playwright complet 256 RÉUSSIS, 2 ignorés, 2 ÉCHOUÉS déjà en échec avant (`training-layout:329`, `coach-suggest:98`) ; relance des fichiers touchés après les ajouts : RÉUSSIS sauf `training-layout:329`. Android réel : NON EXÉCUTÉ.

## 2026-10-28 · 1.3.1 · Visuels studio

- **Demande** (Youssef, 28 octobre) : « pour toutes les images, des images réelles générées par IA, comme l'application sur la capture d'écran » ; après les exemples (https://claude.ai/artifact/3MBXcyKTaEeLuL3Qe7NALH) : « ambiance par discipline ; génération automatique one shot (partout, même encyclopédie) mais prévois de régénérer à la demande ; attention, les positions doivent être humaines et réalistes ».
- **Constat** : des photos générées par IA ne sont pas possibles ici (aucun outil photoréaliste, sites bloqués). Les images de l'application étaient de trois styles : vignettes des techniques dessinées sur fond blanc (ancien modèle), encyclopédie en rendu réaliste sur fond blanc, visuels des disciplines dessinés ; le judo et le JJB n'avaient pas de visuel.
- **Changement** (méthode et régénération dans `docs/visuels/README.md`) :
  - générateur `npm run visuels` (`scripts/visuels/generate.mjs`) : nos coachs 3D posés par le moteur au moment clé, éclairés en studio sombre (vue Lab `mood=1`, nouvelles `MoodLights` de `StudioStage`), puis posés dans une salle dessinée par le code (`scripts/visuels/compose.py` : sacs et lampes flous, fumée, halo, étalonnage, grain) ; options `--only`, `--id`, `--force`, `--recompose` ;
  - une ambiance par discipline (`scripts/visuels/ambiances.json`) : boxe bleu nuit, kick-boxing ambre, muay-thaï rouge, MMA acier, judo bois chaud, JJB indigo ;
  - refaits : 182 vignettes (240 × 300), 56 illustrations de coach et 11 objets ou lieux de l'encyclopédie, 6 visuels de discipline (judo et JJB ajoutés), 2 portraits de « Choisis ton coach » ;
  - fond des vignettes sombre (`.tech-thumb`), provenance des images de l'encyclopédie mise à jour, anciens scripts de capture remplacés (`shot-thumbs`, `shot-portraits`, `encyclopedie/renders`, `encyclopedie/webp`) ;
  - Nouveautés 1.3.1, version 1.3.1 (prévue 1.2.1, renumérotée après la 1.3.0).
- **Contrôle des poses** (`docs/visuels/CONTROLE_POSES.md`) : chaque rendu vérifié sur planche ; 3 corrections (`scripts/visuels/poses.json`) : sprawl montré de face (l'animation garde les tibias levés, anomalie du moteur à corriger dans un lot à part), sit-out à l'instant où la main est posée, visuel du judo en garde de saisie.
- **Kimonos moins tricot** (Youssef, 28 octobre 13:22 : « je valide les visuels, pour les kimonos, essaye de les faire avec effet moins tricot » ; 13:28 : « intègre-la partout, même aux coachs animés ») :
  - constat : le tissu du judogi et du kimono de JJB était un grain en quadrillage très régulier (`rice`, v0.32) avec un relief marqué ; une fois l'image réduite, cette grille se lit comme des mailles de tricot ;
  - correction (`tools/generator/rocketbox/outfits.py`) : nouveau tissu `cotton` (marbrure douce et fils irréguliers étirés dans le sens de la trame, le grain du tissage gardé à 20 %), relief des vestes 0,45/0,5 → 0,2, assombrissement des creux 0,06/0,14 → 0,03/0,04, col 1,4 → 0,9, pantalon 0,5 → 0,25 ; tenues `judo.glb` et `bjj.glb` de Kadir et Amara reconstruites ;
  - partout : le coach animé (rendu Ultra-réaliste) charge ces mêmes fichiers de tenue, donc séances, fiches et lecteur ont le nouveau tissu ; images judo/JJB régénérées (bannières, vignettes, encyclopédie, objets judogi et kimono de JJB) avec la nouvelle option `--d judo,bjj` du générateur.
- **Tests** (après intégration de la 1.3.0) : TypeScript RÉUSSI ; Vitest 863 RÉUSSIS, 1 ignoré (dont `visuels.test.ts` et `outfit*.test.ts`) ; Playwright ciblé (visuels-studio, discipline-art, encyclopedie, navigation, app) 60/60 RÉUSSIS ; Playwright complet (267 tests, 51 min) : 262 RÉUSSIS, 2 ignorés (Firebase), 3 ÉCHOUÉS : `chrono-seul:95` RÉUSSI relancé seul, `training-layout:329` déjà en échec avant (voir 1.3.0), `coaching-hud:60` échoue aussi sur la 1.3.0 seule (vérifié dans une copie de la branche), donc pas lié aux visuels ; Android réel : NON EXÉCUTÉ.

## 2026-10-28 · 1.3.2 · Illustrations de l’Encyclopédie (lots 1 à 3)

- **Demande** (Youssef, 28 octobre 15:05) : « créer aussi des illustrations pour toutes celles qui manquent au niveau de l'encyclopédie » ; 15:08 : « reste dans le même thème et publie automatiquement ».
- **Constat** : 46 fiches avaient une illustration « à produire » (`TO_PRODUCE` de `src/domain/encyclopedia/images.ts`). Elles se rangent en quatre lots : objets et lieux, un coach seul, schémas, scènes à deux (avec un partenaire ou un arbitre).
- **Changement** (24 illustrations, même salle d’ambiance par discipline que les visuels studio) :
  - lot 1, objets et lieux modélisés dans Blender (`scripts/encyclopedie/scenes.py`) : bandes, protège-dents, casque, coquille, protège-poitrine, sacs de frappe, pattes d’ours, paos, mongkon et pra jiad, dojo, chrono et cloche du round, gants anciens et règlement (texte illisible), tableau de score du JJB, livre des règles entouré des emblèmes des six disciplines (`cult-federations`, aucun logo de fédération) ;
  - lot 2, le coach seul : gardes de muay-thaï et de kick-boxing, les trois styles de kick-boxing côte à côte (recette `mix`), et trois poses d’illustration nouvelles du moteur (`src/engine/library/illustrations.ts`, vue Lab `illu=`, jamais dans la bibliothèque des techniques) : échauffement des épaules, wai kru ;
  - lot 3, schémas sur le coach : zones interdites, articulations à ne pas forcer, zones de choc à la tête, planche des articulations et des muscles ; les repères sont posés sur les vrais os du squelette 3D (`window.__labJoints`, `CoachRig.sceneOf`), les étiquettes rangées en colonnes sans chevauchement (`compose.py`, `draw_marks`) ;
  - la soumission (main qui tape) passe au lot 4 : seule, la pose ne se lisait pas.
- **Contrôle** : chaque image regardée sur planche ; reprises : casque et coquille (découpes booléennes sans effet, corrigées), bandes, protège-poitrine, dojo trop clair, wai kru (genoux au-dessus du tapis), étiquettes qui se chevauchaient.
- **Tests** : nouveau `src/engine/__tests__/illustrations.test.ts` (chaque pose nommée existe, rien sous le tapis sur Kadir et Amara, genoux posés dans le wai kru) ; `encyclopedia.test.ts` inchangé et RÉUSSI (les schémas gardent une technique existante, le mouvement montré est dans `motion`).

## 2026-10-28 · 1.4.0 · Un seul écran coach, et la pulsation

- **Demande** (Youssef, 28 octobre) : « L'écran du coach devrait être exactement le même module appelé partout et alimenté différemment en fonction du contexte » ; option A « un toucher montre les commandes sans pause, le toucher suivant les cache » ; haut-parleur sous la vitesse et le plein écran ; 13:20 « J'ai l'impression d'avoir perdu les consignes vocales » ; 15:03 « Je ne retrouve pas les clignotement demandé. Ils sont où ? » ; 15:06 « Pas besoin de dire voix coupée » ; 15:21 choix « Contour lumineux ».
- **Constat après vérification** : quatre scènes coach écrites séparément (Accueil, fiche, séance, aperçu) ; la voix de la 1.3.0 parle bien (séance enregistrée : « Prépare-toi », « 3, 2, 1 », « En garde », « Jab », point clé, volume 100 %), cause probable un toucher sur le haut-parleur réglé au maximum, dont le cran suivant est « coupé » ; la pulsation demandée à 00:07 n'avait pas été codée (la maquette attendait un choix).
- **Changement** (détail dans `docs/v140/RAPPORT.md`, 14 captures jour et nuit dans `docs/v140/captures/`) : module `src/ui/coach-screen/CoachScreen.tsx` appelé par les 4 écrans ; un toucher montre ou cache les commandes, en séance il ne met plus en pause (pause dans les commandes) ; vitesse et angles de la fiche dans la zone du coach ; haut-parleur barré quand la voix est coupée, sans message au départ ; pulsation contour lumineux à chaque signal de séance (`src/ui/training/pulse.ts`, 3 éclairs par seconde au plus, WCAG 2.3.1), réglage Contour / Fond / Chrono seul / Coupée et intensité ; guide du Coach IA, recherche et Nouveautés 1.4.0, version 1.4.0. `FullscreenStage` retiré (remplacé par le module).
- **Défauts trouvés en vérifiant et corrigés** : commandes de l'Accueil sur « Changer de coach » ; rangée des angles au milieu de l'écran en paysage (bloquait le double toucher) ; astuce du double toucher sur les angles ; texte du guide qui ne parlait plus de la barre de lecture.
- **Tests** :
  - TypeScript : RÉUSSI. Vitest : 862 RÉUSSIS, 1 ignoré (dont `pulse.test.ts` et les valeurs par défaut de la pulsation).
  - Nouveaux `ecran-coach-v140.spec.ts` (6) et `pulsation-v140.spec.ts` : RÉUSSIS. 5 fichiers adaptés au nouveau geste sans retirer de vérification.
  - Playwright complet (avant la pulsation, 269 tests) : 263 RÉUSSIS, 2 ignorés (Firebase), 4 ÉCHOUÉS : `coach-bubble:126` (texte du guide, corrigé puis RÉUSSI), `coaching-hud:60` (RÉUSSI à la relance), `training-layout:329` et `coach-suggest:98` (déjà en échec avant).
  - Relance après la pulsation (pulsation, écran coach, coach-bubble, coaching-hud, séance mains libres, training-layout, consignes, profil) : 51 RÉUSSIS, 1 ÉCHOUÉ `training-layout:329` (déjà en échec avant).
  - Android réel : NON EXÉCUTÉ.
  - Intégration de la 1.3.1 (visuels studio, fusionnée pendant le lot) : conflits sur la version, les Nouveautés, le test de navigation et ce journal, résolus en gardant les deux versions (1.4.0 en tête, 1.3.1 ensuite). Après intégration : TypeScript RÉUSSI ; Vitest 867 RÉUSSIS, 1 ignoré ; Playwright (navigation, écran coach, pulsation, consignes, coach-bubble, plein écran) 58/58 RÉUSSIS.
  - Intégration de la 1.3.2 (illustrations de l'Encyclopédie, fusionnée pendant le lot) : mêmes conflits, résolus en gardant les versions (1.4.0, 1.3.2, 1.3.1). Après intégration : TypeScript RÉUSSI ; Vitest 873 RÉUSSIS, 1 ignoré ; Playwright (navigation, écran coach, pulsation, coach-bubble, plein écran) 49/49 RÉUSSIS.
  - Validation : Youssef, 28/10 17:42 « Je valide ».

## 2026-10-28 · 1.4.1 · Encyclopédie complète (lot 4, scènes à deux)

- **Demande** : suite de la demande du 28 octobre 15:05 (« publie automatiquement »), relancée à 17:13 : « continu ».
- **Constat** : il restait 22 fiches « à produire ». Ce sont des scènes à deux personnes : positions au sol du JJB et du judo, soumissions, arbitre de boxe, sparring. S’y ajoutent l’ippon, la pesée et les juges.
- **Changement** :
  - moteur : scènes à deux (`duoScenes` dans `src/engine/library/illustrations.ts`, `getDuo`). Amara est toujours A et Kadir toujours B, chacun placé dans la scène (`Place`). On y trouve monté, garde fermée, demi-garde, contrôle latéral, genou sur le ventre, nord-sud, contrôle du dos, étranglement arrière, clé de bras (juji-gatame), triangle, kesa-gatame, passage de garde, garde ouverte et la main qui tape. Côté boxe : arrêt, compte, décision, avertissement et sparring. Ces poses servent seulement aux illustrations et n’entrent jamais dans la bibliothèque des techniques ;
  - vue Lab : `duo=`, `champion2=`, `tenue2=`. Pour un duo, la tenue n’est « portée » que si les deux coachs l’ont ;
  - deux tenues d’arbitre créées par nous (`outfits.py`) : `arbitre` (chemise blanche, nœud papillon, pantalon noir) et `arbitre-judo` (veste de costume, cravate, pieds nus). Le service worker ne les met pas en cache (`globIgnores`) ;
  - Blender : la pesée (balance qui affiche 70.2 kg) et la table des juges au bord du ring ;
  - correction de 1.3.2 : la légende « Début / Mi-chemin / Moment clé » s’affichait aussi sous les schémas et les compositions. Elle ne s’affiche plus que pour les vraies séquences ;
  - accessibilité : si l’image ne charge pas, son libellé dit « illustration indisponible ».
- **Contrôle** : chaque image regardée sur planche. Reprises : genoux sous le tapis (monté, nord-sud), jambes cachées (garde fermée), genou sur le ventre qui semblait assis, clé de bras refaite en juji-gatame, kesa penché du mauvais côté, triangle trop haut, boxeur KO accroupi, chemise blanche visible sous la veste de l’arbitre de judo, table des juges qui flottait.
- **Tests** :
  - nouveau `src/engine/__tests__/duo-illustrations.test.ts` : chaque scène existe, rien sous le tapis, les deux bassins à bonne distance ;
  - nouveau `src/ui/encyclopedia/__tests__/enc-image.test.tsx` : l’emplacement vide annonce « Illustration à produire », une image produite est une vraie image ;
  - `tests/e2e/encyclopedie.spec.ts` : le test « illustration manquante » ne trouvait plus de fiche « à produire », puisqu’il n’y en a plus. Il est réécrit, pas affaibli : il bloque l’image de Kesa-gatame et vérifie le message « Illustration indisponible », le libellé et la mention des coachs.
  - Toute l’Encyclopédie (46/46 fiches) a maintenant son illustration.

## 2026-10-28 · 1.6.0 · Deux nouveaux coachs : Axel et Kaila (MakeHuman)

- **Demande** : Youssef, 28/10 17:42 : « Je veux passer au plus vite aux 2 coachs supplémentaires mieux aboutis après prise de connaissance de » makehumancommunity ; 17:43 « Utilise toutes les optimisations possibles » ; 18:41 « Quand je clique sur changer de coach, je ne veux voir que la liste des coachs, rien d'autre » ; 19:10 l'aperçu de travail « vraiment nul » (peaux transférées de Rocketbox, abandonnées).
- **Constat après vérification** : les packs d'assets MakeHuman (peaux, cheveux, sourcils, cils) sont CC0 sur files.makehumancommunity.org (hair02 et hair03 sont CC-BY, non utilisés). Le maillage MakeHuman a des faces plus grandes que Rocketbox : les tenues générées par `outfits.py` y avaient des bords en dents de scie et les chaussures de boxe se cassaient sur le maillage de base.
- **Changement** :
  - `tools/generator/makehuman/build_photo.py` (nouveau) : corps MakeHuman de la recette, squelette Mixamo de MPFB, peau photo, yeux, sourcils, cils et tresse MakeHuman ; cuir chevelu peint (cheveux plaqués de Kaila, coupe rase d'Axel), sous-vêtements peints, tatouage tribal d'Axel ; une subdivision puis réduction à 42 800 triangles ; os sans préfixe. Recettes `axel.json` (1,94 m) et `kaila.json` (1,65 m). README dans le dossier.
  - Poids : textures WebP, cheveux 1024 px : `photo.glb` 1,8 Mo (Axel) et 2,2 Mo (Kaila), contre 2,5 et 2,9 Mo pour Kadir et Amara.
  - `outfits.py` : mode `MH_BODY=1` (brassière coupée par des plans, ceinture qui ne se soulève plus sur les fessiers, points des coupes gardés sur leur plan) et tranches plus larges pour les chaussures d'un maillage moins dense. Les tenues de Kadir et Amara ne changent pas (mode désactivé par défaut, fichiers non régénérés).
  - Appli : `ALL_COACHES` (Kadir, Axel, Amara, Kaila), `profile.champion` (le coach choisi pour le type de corps ; absent = Kadir ou Amara comme avant, aucune donnée enregistrée ne change), gardes propres (Axel droit et relâché, Kaila basse, mains ouvertes), looks, portraits. « Changer de coach » (Accueil) ouvre `/coach` : seulement la liste et Valider. Réglages, première ouverture et options de séance proposent les quatre coachs.
  - Moteur : sit-out, pied droit tourné de 8° de plus vers l'extérieur (sur un bassin large, le retour à quatre pattes dépassait la rotation interne de la hanche : 49,7° pour 45°).
- **Tests** : TypeScript RÉUSSI ; Vitest 907 RÉUSSIS, 1 ignoré (nouveau `makehuman-coaches.test.ts`, `coach-profiles.test.ts` étendu, mesures et pictogrammes régénérés après le sit-out) ; Playwright : nouveau `coachs-v160.spec.ts` RÉUSSI, navigation, coach-render, account, profil-v120, aucune-perte-v100, app 51 RÉUSSIS, 2 ignorés (Firebase) ; suite complète NON EXÉCUTÉE ; Android réel NON EXÉCUTÉ.
- **Validation** : Youssef, 29/10 08:07 « je valide, publie et continu ». Numéro 1.6.0 (la 1.5.0 reste réservée à la barre de recherche et au Coach IA).

## 2026-10-29 · 1.6.1 · Axel et Kaila plus réalistes

- **Demande** : Youssef, 29/10 08:05 « je cherche plus de ultra réalisme » ; 08:07 « je valide, publie et continu de travailler par la suite ».
- **Constat après vérification** (gros plans dans le studio de l'app, 1.6.0) : les cheveux peints sur le crâne faisaient un casque (Axel) ou des rayures (Kaila) ; la peau MakeHuman était lisse, sans pores ni plis ; les yeux étaient mats, comme ceux d'une poupée (matériau des yeux réglé comme la peau, rugosité 0,6) ; au bout des gants de MMA, la coupe suivait les triangles du maillage et faisait des pointes noires, comme des griffes.
- **Changement** :
  - vrais cheveux en cartes alpha : `short01` brun foncé pour Axel, `ponytail01` (queue de cheval plaquée) pour Kaila, au lieu de la tresse. Huit coiffures CC0 rendues et comparées ;
  - les pixels cachés des cartes de cheveux prennent la couleur moyenne des cheveux (blancs dans les fichiers MakeHuman, ils ressortaient en points blancs au bord des mèches) ;
  - peau : relief fin (pores, petits plis) pris dans la normal map CC0 `mindfront_skin_male_african_middleage`, filtrée passe-haut pour ne garder ni ses muscles ni ses cicatrices, ajouté au relief anatomique de chaque coach. La peau `mindfront_aksel_skin` a été essayée puis écartée : elle a un œil au beurre noir et des cicatrices ;
  - Axel : barbe de deux jours peinte (menton, mâchoire, lèvre supérieure, placée autour des lèvres mesurées sur le maillage, bords fondus) ;
  - Kaila : peau photo CC0 `toigo_light_skin_female_freckles` (taches de rousseur), même teint ;
  - yeux : rugosité 0,08 pour le matériau des yeux d'Axel et Kaila (`PhotoCoach.tsx`) : ils ont un reflet net des lumières. Kadir et Amara ne changent pas (leurs yeux font partie de la texture de la tête) ;
  - gants de MMA (`outfits.py`, mode `MH_BODY` seulement) : un plan de coupe en travers de chaque doigt, là où le gant s'arrête. Le bord est net. Les tenues de Kadir et Amara ne sont pas régénérées ; seules les tenues MMA d'Axel et Kaila changent (les autres sortent identiques octet pour octet) ;
  - `build_photo.py` : nouvelles clés de recette `stubble`, `skin_normal_from`, `skin_normal`, `skin_normal_blur`, `relief_size` (README) ; portraits régénérés.
  - Poids : `photo.glb` 2,30 Mo (Axel, avant 1,82) et 2,47 Mo (Kaila, avant 2,22), toujours sous la limite de 2,5 Mo du test.
- **Avant/après** : captures dans le studio de l'app (Lab, Ultra-réaliste) : visage, corps entier, dos.
- **Tests** : TypeScript RÉUSSI ; Vitest 907 RÉUSSIS, 1 ignoré (`makehuman-coaches.test.ts` : vrais cheveux exigés pour les deux coachs, nouveau test « la peau a son relief ») ; Playwright : `coachs-v160`, `navigation` (Nouveautés 1.6.1), `coach-render` 33 RÉUSSIS ; suite complète NON EXÉCUTÉE ; Android réel NON EXÉCUTÉ.

## 2026-10-29 · 1.7.0 · Rechercher et demander au coach dans la même fenêtre (proposition A)

- **Demande** : Youssef, 28/10 11:30, a choisi la proposition A « Réponse du coach en tête » (maquette https://claude.ai/artifact/9Bm1j9XWeRYAWtittrjn5q) : une seule barre avec l'icône IA, la réponse du coach en haut, les résultats de l'application en dessous, plus de gros bouton noir. Prévue en 1.5.0, numérotée 1.7.0 car la 1.6.0 (Axel et Kaila) est sortie avant.
- **Constat** : dans la 1.6.0, « Rechercher » affichait un gros bouton noir « Demander au Coach IA » qui fermait la recherche et ouvrait le panneau du coach à part.
- **Changement** :
  - `src/ui/nav/SearchSheet.tsx` : l'étoile ✦ dans la barre (`search-ai`) ; une question (« ? » ou phrase qui commence comme une question, `looksLikeQuestion`) affiche la réponse du coach en tête (`search-coach`), trois lignes puis « Lire la suite », ses actions et « Continuer avec le Coach IA » ; un simple mot affiche les résultats avec en première ligne « Demander au coach : « … » » (trait pointillé, plus de bouton noir), qui répond dans la même fenêtre ; les questions « Sur cet écran » répondent aussi sur place ; avec la barre vide, l'étoile ouvre le Coach IA en grand comme avant.
  - `src/ui/coach-ai/useCoachContext.ts` (nouveau) : le contexte de l'écran et les actions du coach, partagés par le panneau et la recherche (même réponse aux deux endroits).
  - `coachHost.ts` / `CoachAskPanel.tsx` : une question déjà gardée dans l'historique depuis la recherche n'y est pas ajoutée deux fois quand on continue dans le panneau.
  - L'historique et la voix ne retiennent que ce qui est demandé exprès (Entrée, ✦, la ligne « Demander au coach », une question de l'écran), pas l'aperçu pendant la frappe.
  - Couleurs : texte rouge en `--red-ink` (contraste jour et nuit). Guide du coach (`appGuide.ts`) mis à jour.
- **Tests** :
  - TypeScript : RÉUSSI. Vitest : 909 RÉUSSIS, 1 ignoré (nouveau `src/ui/nav/__tests__/search-coach.test.ts`).
  - Nouveau `tests/e2e/recherche-ia-v170.spec.ts` (4) : RÉUSSI (simple mot, question + « Lire la suite » + historique à une seule entrée, action de la réponse, ✦ barre vide).
  - Adaptés au nouveau geste sans retirer de vérification : `nav-helpers.ts`, `accueil-recherche` (contraste jour/nuit étendu à la carte du coach et à la ligne « Demander au coach »), `corrections-v110`, `coach-bubble`, `aucune-perte-v100`, `coach-suggest`, `navigation` (1.7.0 en tête).
  - Playwright complet (282) : 278 RÉUSSIS, 2 ignorés (Firebase), 2 ÉCHOUÉS déjà en échec avant ce lot : `coach-suggest:99` (flèches des suggestions ; RÉUSSI 2 fois sur 2 relancé seul sur cette branche, RÉUSSI sur la 1.6.0 seule) et `training-layout:329` (caméra Auto).
  - Android réel : NON EXÉCUTÉ.

## 2026-10-29 · 1.8.0 · Audit des mouvements : plus rien sous le tapis

- **Demande** : Youssef, 28/10 : auditer tous les mouvements des coachs et les corriger, « par tous les moyens », pour qu'ils soient réels, réalistes, humainement faisables, sans torsion anormale et fluides ; ne jamais corriger l'utilisateur ; ce qui est physiquement impossible peut être empêché automatiquement ; un changement pédagogique passe par sa validation.
- **Constat après vérification** : mesure sur la peau des quatre coachs (maillages de l'application posés sur le CPU, `src/test/skin.ts`), toutes les techniques :
  - sprawl : cuisses et tibias jusqu'à −20 cm sous le tapis (pieds trop loin pour la longueur des jambes, genoux pliés à travers le sol) ;
  - mains posées au sol (descente, sortie de hanche, relevé technique, pont, rétention de garde, changement de base, sit-out) : doigts de −6 à −14 cm ;
  - chutes (ushiro et yoko ukemi), rétention de garde, pont : dos et épaules de −5 à −13 cm ;
  - orteils de −2 à −9 cm (uchikomi o-uchi et ko-uchi, relevés, sit-out, changement de base, ukemi) ; genoux d'Axel −3,6 cm à genoux.
- **Changement** :
  - `src/engine/rig.ts` : le moteur lit une fois le contour de la peau du modèle (tronc, jambes, pieds, mains) et l'utilise à chaque image : le corps couché est soulevé jusqu'au tapis (1,5 cm d'écrasement laissé), un genou posé ou un pied que la jambe ne peut pas atteindre relève les hanches, un pied qui n'est pas à plat est sorti du tapis, les orteils près du sol ne piquent plus dedans (sans dépasser 70° d'extension), une main au sol se plie au poignet jusqu'à poser les doigts, s'ouvre quand la paume regarde le tapis, et se referme sur les phalanges si l'amplitude du poignet ne suffit pas. Aucune vitesse ni angle des mouvements déjà validés n'est changé hors du contact avec le sol.
  - Mains en appui : extension du poignet en charge jusqu'à 90° (main à plat, avant-bras presque vertical, comme dans une pompe), seulement quand la main est posée au tapis ; 70° partout ailleurs. **Choix de Youssef** (carte de décision du 29/10, 13:34) : main à plat.
  - `src/engine/library/mma.ts`, sprawl : jambes tendues à une longueur de jambe derrière les hanches, bassin un peu plus haut (cuisses posées, tibias levés), retour des pieds en 0,34 s au lieu de 0,18 s (vitesse max du pied 9,3 m/s au lieu de 25,6 avec les pieds plus loin). Durée 1,56 s au lieu de 1,52 s.
  - Mesures corrigées (pas affaiblies) dans `src/test/torsions.ts` : l'inclinaison du poignet se lit maintenant contre le plan de flexion (l'ancienne formule lisait 4° d'inclinaison comme 70° quand le poignet est plié à 90°) et la pronation sur l'axe du pouce, qui ne bouge pas quand le poignet se plie (l'ancienne lisait 15° de trop sur une main à plat). `src/engine/audit.ts` compte comme appui une main que le moteur a posée au tapis (sur les phalanges, le poignet est à 8 cm).
- **Résultat** (`docs/audit-biomecanique/MESURES_SOL.md`) : au pire −2,8 cm (épaule de Kadir en ushiro-ukemi), −2,5 cm (dos d'Axel en rétention de garde), −2,2 cm (cuisses dans le sprawl), tout le reste au-dessus de −2 cm. Glissement des pieds en appui (switch kick, sit-out, changement de base, relevé technique) : mesuré, pas encore traité (lot suivant).
- **Tests** :
  - nouveau `src/engine/__tests__/floor-contact.test.ts` : la peau des 4 coachs ne passe jamais à plus de 3 cm sous le tapis, toutes les techniques, 15 images par seconde ; document `MESURES_SOL.md` régénéré par le test ;
  - `engine.test.ts` et `pose.test.ts` (cibles des mains et des pieds) visent l'endroit où le moteur a posé la cheville ou le poignet (`footAim`, `handAim`), comme ils le faisaient déjà pour le talon levé ; la tolérance de 2 cm n'est pas changée ;
  - `torsions.ts` : limite d'extension du poignet 90° seulement pour une main posée au tapis (`handOnMat`) ;
  - documents de mesures régénérés (chevilles, torsions, moteur, fluidité) et pictogrammes ;
  - TypeScript RÉUSSI ; Vitest 912 RÉUSSIS, 1 ignoré (après report de la 1.6.1 : Axel et Kaila refaits, `MESURES_SOL.md` régénéré) ;
  - Playwright complet (282) : 278 RÉUSSIS, 2 ignorés (Firebase), 2 ÉCHOUÉS déjà en échec avant ce lot (1.7.0) : `coach-suggest:99` (flèches des suggestions) et `training-layout:329` (caméra Auto) ;
  - Android réel : NON EXÉCUTÉ.
- **Validation** : Youssef, 29/10 13:35 « je valide » (1.7.0 et 1.8.0 fusionnées dans feature/combat-shadow-v030).

## 2026-10-29 · 1.9.0 · Coachs plus vivants, tenue MMA d'après les références, rendu Anime supprimé

- **Demande** : Youssef, 29/10 10:59 « essaye de pousser plus loin l'ultra réalisme, l'expression des visages est trop statique, fait quelque chose, supprime définitivement le rendu "Anime", Corrige aussi Kadir et Amara pour leurs faire bénéficier des plus de Axel & Kaila » ; 11:51 deux planches de référence (coach MMA homme et femme, rangées dans `maquettes/references-2026-10-29/`) ; 11:55 « on reste en Open Source pure. Améliore aussi les vêtements » (CC0 seulement, pas de CC-BY).
- **Constat après vérification** :
  - les visages ne bougeaient jamais : aucun code ne pilotait les os du visage de Kadir et Amara (Rocketbox), et Axel et Kaila n'en avaient pas ;
  - en qualité haute, `PhotoCoach` refaisait les matériaux sans reprendre l'échelle de la normal map : le relief de la peau perdait l'inversion du canal vert que le chargeur applique aux modèles sans tangentes. Les muscles étaient éclairés par en dessous. Les yeux restaient mats en qualité haute (la brillance 1.6.1 ne valait qu'en qualité basse) ;
  - la tenue MMA (short de board à mi-genou, ceinture rouge ou dorée) ne ressemblait pas aux références (short de compression à mi-cuisse, brassière noire dos nageur, gants ouverts noirs et blancs).
- **Changement** :
  - `src/three/face.ts` (nouveau) : clignements toutes les 2 à 6 s (parfois doubles), petites saccades du regard, effort mesuré à la vitesse des mains et des pieds (sourcils baissés et rapprochés, yeux plissés, coins de la bouche tirés, mâchoire serrée), clignement possible au pic d'une frappe. Mouvements de quelques millimètres dans le repère de la tête. Le corps et la technique montrée ne changent pas. Image fixe (Lab, portraits) : visage au repos ;
  - Axel et Kaila : os du visage du squelette MakeHuman « default » (paupières, sourcils, coins de la bouche, mâchoire, yeux) transférés dans le squelette Mixamo avec leurs poids (`build_photo.py`) ;
  - Kadir et Amara : yeux dans leur propre matériau `Eyes_opacity` (`tools/generator/rocketbox/split_eyes.mjs`), donc brillants comme ceux d'Axel et Kaila ;
  - `PhotoCoach.tsx` : normal map avec l'échelle du chargeur, relief de la peau ×1,5 ; yeux brillants en qualité haute aussi ;
  - tenue MMA des quatre coachs (`outfits.py`) : short « vale-tudo » ajusté à mi-cuisse (anthracite pour les hommes, noir pour les femmes), ceinture plate ; brassière noire dos nageur coupée par plans (bords nets sur Amara aussi) ; gants ouverts noirs avec sangle et paume blanches (hommes) ou tout noirs (femmes) ;
  - Kaila : poids 0,62 → 0,54 (musculature plus sèche), ses 7 tenues refaites sur le nouveau corps. Tresse essayée (`braid01`, la seule tresse CC0 ; les tresses du pack hair01 portent une mention AGPL) : écartée, sa frange plaque le front comme un casque. Queue de cheval gardée ;
  - rendu Anime supprimé : réglages version 3 (tout style enregistré devient Ultra-réaliste, les autres réglages sont gardés), sélecteur « Rendu des combattants » retiré (Réglages, studio, options d'entraînement), note « Passer au style Encre » retirée, Coach IA et Premium mis à jour (`anime_rendering` retiré), Lab toujours Ultra-réaliste. Le modèle généré reste le secours (« Version du rendu 3D : précédente ») ; `manga.ts` n'est plus chargé par l'appli, il reste couvert par les tests du personnaliseur.
- **Tests retirés ou réécrits (fonction supprimée à la demande de Youssef)** : `coach-render.spec` (choix du look à trois endroits, look Anime gardé, changement de look en séance, hachures Encre) remplacé par « aucun choix de look » et « un ancien réglage Anime ou Manga ouvre en Ultra-réaliste » ; `moteur-lumiere.spec` « le rendu Anime n'a pas d'option de lumière » remplacé par « un ancien réglage Anime ouvre en Ultra-réaliste avec l'option de lumière » et « la version précédente n'a pas d'option de lumière » ; `profil-v120.spec` ne cherche plus `settings-coach-look` ; `settings-style.test` vérifie la migration vers Ultra-réaliste ; `rights.test` et `appGuide.test` suivent les textes.
- **Tests** : TypeScript RÉUSSI ; Vitest 927 RÉUSSIS, 1 ignoré (nouveau `src/three/__tests__/face.test.ts` : 20 tests sur les 4 coachs) ; Playwright ciblé `coach-render`, `moteur-lumiere`, `profil-v120`, `coachs-v160` : 15 RÉUSSIS.
- **Avant/après** : https://claude.ai/artifact/9FCj9LtLaSMBFRc7qNMLxC (1.6.1 et 1.9.0 à côté des références).
- **Ajout du 03/11** (Youssef, 29/10 14:20 « diminue aussi la taille des fiches coach pour que cela tienne sur une page dans choisi ton coach, un clique sur la fiche doit faire pivoter la fiche sur un mode plus de details ») : fiches compactes, les quatre et « Valider » tiennent sur un écran de 360×640 à 430×932 ; un appui choisit le coach et retourne sa fiche (surnom, taille mesurée sur le modèle 3D, style, garde, points forts), un 2e appui la remet. Portraits refaits avec la nouvelle tenue MMA. Test `coachs-v160.spec` (2 tailles d'écran) : RÉUSSI.
- **Intégration de la 1.8.0** (fusion de `feature/combat-shadow-v030`, tête 3f035df) : `MESURES_SOL.md` régénéré (corps de Kaila plus sec, poids du visage d'Axel), écarts de quelques dixièmes de millimètre, test du contact avec le tapis RÉUSSI.

## 2026-11-03 · 1.10.0 · Réalisme des coachs, des tenues et des accessoires

- **Demande** : Youssef, 03/11 15:47, amélioration concrète, visible et mesurable du réalisme de Kadir, Amara, Axel et Kaila, de leurs tenues et de leurs accessoires, en 5 lots, sur une branche dédiée, sans fusion ni publication automatique.
- **Base** : 1.9.0 vérifiée (f180064 = 646b293). Point de restauration `restauration/avant-realisme-v1100`.
- **Constat après vérification et corrections** : détail dans `docs/v1100/RAPPORT.md` (16 défauts classés en géométrie, poids, matériau, lumière et animation). Principaux points :
  - poids des gants de boxe inversés (poing à 76 % sur l'avant-bras) → poids selon la position ; vraie coupe thaïe ;
  - yeux, sourcils et cils pris pour des cheveux (regex `/opacity/`) → classification explicite ; propriétés des matériaux conservées dans `PhotoCoach` et `dress()` ;
  - pli sous l'omoplate de Kadir : poids qui changent trop vite (pas la normal map) → poids lissés sans bouger les points (pli de garde 74° → 62°) ; aisselles de Kaila (étirement 7,2 → 3,1) ;
  - brassière de Kaila, shorts, sous-vêtements peints, chaussures de boxe → coupe par champ, bords lisses, ceinture au-dessus du sous-vêtement peint ;
  - brassière d'Amara étendue jusqu'aux avant-bras → dégagement des bras complet ;
  - peau : diffusion approchée, ombres adoucies, pores, réglage par coach ; fondu des pointes des cheveux ;
  - respiration et mouvement des pans du gi et de la ceinture. Un défaut de la respiration (vêtements projetés en mouvement, normale posée deux fois) a été trouvé par la mesure de performance et corrigé avant livraison.
- **Fichiers** : `src/three/{photoMaterials,skinShader,breath,sway,PhotoCoach,outfit}.ts(x)`, `src/ui/Lab.tsx`, `tools/generator/rocketbox/{outfits,glove,smooth_weights}.py`, `regen_outfits.sh`, `tools/generator/makehuman/alpha_bleed.py`, `scripts/dev/shot-realisme.mjs`, 30 tenues et 4 `photo.glb`.
- **Mesures** : triangles 950 k → 1,06 M, fichiers 50,1 → 55,8 Mo, parties dessinées inchangées (218). Sur ordinateur en rendu logiciel (**pas une mesure Android**) : chargement inchangé, temps d'image +3 % (Axel) à +46 % (Amara).
- **Tests** :
  - TypeScript (`npx tsc -b`) : TEST RÉUSSI.
  - Build (`vite build`, titre v1.10.0) : TEST RÉUSSI.
  - Vitest complet : 991 RÉUSSIS, 1 ignoré (déjà ignoré en 1.9.0). Nouveaux : `realisme-v1100` (gants, coupe thaïe, matériaux, brassières entre les épaules), `deformation-v1100` (4 coachs × 7 poses × 4 zones contre la 1.9.0), `breath`, `sway`.
  - Playwright ciblé (`coach-3d-recovery`, `coach-render`, `coach-studio`, `coachs-v160`, `ecran-coach-v140`, `moteur-lumiere`, `outfit-loading`) : 30 RÉUSSIS.
  - Playwright complet (282 tests, environ 40 min) : NON EXÉCUTÉ.
  - Téléphone Android réel : NON EXÉCUTÉ.
  - Captures avant/après : 36 planches dans `docs/v1100/captures/` (`tenues-*`, `detail-*`, `lumieres-*`) et page de comparaison https://claude.ai/artifact/CAejygcuEVDqz1siRRa2nM.
- **Restauration** : `restauration/avant-realisme-v1100`

## 2026-11-03 · 1.10.1 · Mises à jour qui s'installent vraiment

- **Demande** : Youssef, 03/11 18:15 « je ne vois toujours pas la 1.10 après plusieurs fermetures et rafraîchissement ».
- **Constat après vérification** : le site publié affichait bien v1.10.0 (vérifié avec une adresse sans cache). Le service worker (`vite-plugin-pwa`, `autoUpdate`) gardait d'avance tous les fichiers, coachs et tenues compris : 122 Mo. Pour passer de la 1.9 à la 1.10, il devait d'abord télécharger 263 fichiers changés, soit 71 Mo. Tant que ce téléchargement n'était pas fini (appli fermée, réseau mobile), le téléphone restait sur l'ancienne version. Le téléphone de Youssef n'a pas pu être inspecté : c'est la cause la plus probable, pas une cause vérifiée sur son appareil.
- **Correction** : `vite.config.ts` ne garde d'avance que l'appli (12,7 Mo, 544 fichiers). Les fichiers de `coaches/*/` et de `models/` sont gardés à leur première utilisation (cache `css-modeles`, réseau d'abord avec 4 s de délai, la copie gardée hors ligne). Un coach ou une tenue jamais ouvert n'est pas disponible hors ligne.
- **Tests** :
  - TypeScript : TEST RÉUSSI.
  - Build : TEST RÉUSSI.
  - Vitest `src/domain` : 196 RÉUSSIS.
  - Playwright `outfit-loading`, `emblems` (affichage hors ligne), `coachs-v160`, `coach-3d-recovery` : 13 RÉUSSIS.
  - Android réel : NON EXÉCUTÉ.
- **Validation** : Youssef, 03/11 18:19 « Je valide ».

## 2026-11-03 · 1.11.0 · Deux nouveaux coachs : Naël et Inaya

- **Demande** : Youssef, 03/11 23:03 « Axel B / Kaila A / Mais créé 2 joueurs supplémentaires, ne remplace pas les autres / Nomme les différemment / Coloré leurs vêtements différemment des autres / Même moteur 3d derrière ». Puis 23:45 « Applique les corrections que tu as déjà identifiées sur les nouveaux coachs ».
- **Résultat** : six coachs. Kadir, Axel, Amara et Kaila sont inchangés. Deux coachs sont ajoutés :
  - Naël « Le Faucon » : visage de l'avatar Rocketbox Male_Adult_07 (planche « Axel B ») ;
  - Inaya « La Panthère » : visage de Female_Adult_01 (planche « Kaila A »), avec ses cheveux.
  - Ils utilisent le même moteur (`PhotoCoach`), le même squelette et les mêmes mouvements. Chacun a sa garde, son teint et ses couleurs de tenue (palettes `nael` et `inaya` dans `outfits.py`).
- **Méthode** :
  - `tools/generator/rocketbox/face_transfer.py` pose la tête du donneur sur le corps sportif de Kadir ou d'Amara, cuit la texture du visage et accorde le teint du corps ;
  - `extra_textures.py` refait la tenue peinte sur la peau ;
  - `convert.py`, `split_eyes.mjs` et `smooth_weights.py` sont appliqués comme pour Kadir ; 7 tenues sont faites par coach.
- **Constats après vérification et corrections** :
  - Tache de peau sur le short de kick-boxing de Naël :
    - constat : un seul point de la cuisse restait affiché sous le short. Le générateur calculait sa clé au millimètre sur la valeur mise à l'échelle par Blender (106,50001 mm), alors que l'appli la calcule sur la valeur du fichier (106,4999 mm). Les triangles de ce point traversaient le tissu ;
    - correction : `outfits.py` prend la clé sur la valeur float32 du fichier, arrondie comme `Math.round`. Les 14 tenues ont été reconstruites ; il ne manque plus aucun point (avant : 1 à 5 par tenue) ;
    - captures : `docs/v1110/captures/nael-shorts-avant.jpg` et `nael-short-kick-apres.png`.
  - Même défaut chez Kadir et Amara : 1 à 4 points par tenue (mesure sur les fichiers livrés). Ces fichiers n'ont pas été reconstruits dans ce lot.
  - Chez Axel et Kaila, la plupart des clés ne correspondent à aucun point du fichier. À vérifier dans un lot dédié (la peau est peut-être masquée autrement).
  - Aine d'Inaya en garde : le bassin à -2° écrasait la peau (0,62 contre 0,65 au moins). Il est maintenant à -4°, comme celui d'Amara. Test réussi.
  - Écarts encore mesurés en garde, par rapport à la 1.9.0 du corps de base :
    - aisselle de Naël : écrasement 0,060 contre 0,068 au moins ;
    - coude d'Inaya : pli 79° contre 76° au plus ;
    - ils restent avec la garde même de Kadir ou d'Amara, donc ils viennent du corps (export « _facial ») ;
    - aucune différence n'est visible sur les captures de bureau (`docs/v1110/captures/garde-plis-kadir-nael-amara-inaya.jpg`) ;
    - décision de Youssef (03/11 23:54, « Accepter, écart documenté ») : leurs mesures 1.11.0 deviennent leur référence (`docs/v1110/deformations-1.11.0.json`), elles ne pourront plus se dégrader.
  - Choix du coach en 360×640 : avec six fiches, la page dépassait de 15 px. La hauteur réservée au nom passe de 48 à 58 px. Test réussi.
- **Limites** :
  - même corps que Kadir et Amara (musculature un peu différente : SHAPE_SCALE 1,2 et 1,4) et même taille ;
  - repli sans WebGL : modèle généré de Kadir ou d'Amara ;
  - Naël a des cheveux peints, comme Kadir, car ses mèches en cartes faisaient des taches sombres ;
  - captures faites sur ordinateur en rendu logiciel, **pas sur téléphone Android**.
- **Fichiers** :
  - générateur : `tools/generator/rocketbox/{face_transfer,extra_textures}.py` (nouveaux), `convert.py`, `outfits.py`, `regen_outfits.sh` ;
  - fichiers des coachs : `public/coaches/{nael,inaya}/` ;
  - code : `src/domain/coaches/{catalog,looks,motion}.ts`, `src/three/{photoMaterials.ts,CoachModel.tsx}`, `src/ui/styles.css` ;
  - documents : `src/domain/releases.ts`, `docs/LICENCES.md`.
- **Tests** :
  - TypeScript (`npx tsc -b`) : TEST RÉUSSI.
  - Build (`vite build`, titre v1.11.0) : TEST RÉUSSI.
  - Vitest complet : 1037 RÉUSSIS, 1 ignoré (déjà ignoré avant). Nouveau test : chaque point de peau caché de Naël et Inaya existe dans leur corps. Tests étendus aux six coachs (tenues, gants, matériaux, sol, déformations, visage, respiration).
  - Playwright ciblé (`coachs-v160`, `coach-render`, `outfit-loading`, `coach-3d-recovery`) : 15 RÉUSSIS, après la correction des fiches en 360×640.
  - Playwright complet : NON EXÉCUTÉ.
  - Téléphone Android réel : NON EXÉCUTÉ.
- **Validation** : en attente du « je valide » de Youssef (aucune fusion ni publication avant).

## 2026-11-04 · v1.12.0 · Lot 1 des retours du 04/11 : cou et torse d'Inaya, finitions de Naël et Inaya

- **Demande** (Youssef, 04/11 00:24, photo d'Inaya vue de dessus en tenue de kick-boxing) : « corriger la jonction cou, torse de Inaya … regarde aussi ce que tu peux corriger d'autres sur les 2 nouveaux coachs ».
- **Constats après vérification** :
  - le corps « Sports_Female_01 » porte un haut de bikini noir à bretelles nouées au cou. Ce haut fait partie de la surface du corps (son propre îlot de texture, en bas au milieu) et il n'y a pas de peau dessous. Ses bretelles passaient au-dessus des brassières : ce sont les lambeaux noirs de la photo ;
  - ces bretelles se tiennent 6 à 40 mm au-dessus de la peau du cou, qui remonte les rejoindre. Vue de dessus ou de dos, l'œil voit dans ce pli, dont la paroi intérieure est tournée vers l'arrière et n'était pas dessinée : on voyait le fond (traits blancs, bleu foncé sur le téléphone). La couture tête/corps, elle, est exacte (132 points sur 132) ;
  - la carte de relief gardait le bord des bretelles et les coutures des bonnets (reflets clairs) ; l'imprimé fleuri du tissu restait visible sous la peinture ;
  - les textures cuites s'arrêtaient au bord de chaque îlot, noir au-delà : sur téléphone, les petits niveaux de texture mélangeaient ce noir à la peau le long des coutures (Naël et Inaya) ;
  - le chignon vient du corps de sport, mais la texture de la tête vient du visage donneur : à cet endroit elle contient des morceaux sans rapport (bouts de visage, peau claire). Les mèches en cartes du donneur sortaient raides du chignon.
- **Corrections** :
  - `extra_textures.py` : l'îlot du haut de bikini prend la couleur de la peau de la poitrine (ombrage large gardé, imprimé effacé) et sa carte de relief devient plate ; marge de couleur autour de chaque îlot (`bleed`) ; le chignon et la nuque sous le chignon sont remplis avec les mèches blondes du donneur ;
  - `tools/generator/rocketbox/both_sides.py` (nouveau) + `photoMaterials.ts` : la peau du corps d'Inaya est dessinée des deux côtés (`bothSides` dans le fichier), ce qui ferme les fentes ;
  - mèches en cartes retirées pour Inaya (`NO_HAIR_CARDS=1`), comme pour Naël ;
  - Inaya reconstruite et ses 7 tenues régénérées : aucun point de peau cachée manquant.
- **Méthodes essayées et abandonnées** (le défaut revenait ou empirait) : recoller le bord des bretelles sur la peau (150 à 280 triangles retournés), poser toute la bretelle sur la peau du cou (453 triangles retournés), supprimer les bretelles au-dessus de la peau du cou (vrais trous), doubler les triangles à l'envers (sans effet, le défaut n'était pas là).
- **Brassières déchirées au cou** : elles étaient copiées sur deux couches qui se croisent, les bretelles du bikini et la peau du cou dessous (Amara a le même défaut, masqué par son haut noir). Décision de Youssef (04/11 06:21, « Brassière sans bretelles au cou ») : les hauts de boxe et de kick-boxing d'Inaya deviennent des bandeaux, sans bretelles ni dos nageur (`outfits.py`, `bra_field(straps=False)`, `BANDEAU` pour la palette d'Inaya). Plus de déchirure sur les captures.
- **Reste à corriger** :
  - vus de dessus, quelques petits éclats de couleur au trapèze droit en kick-boxing : c'est le short, vu à travers une fente du pli du cou (déjà présent en 1.11.0) ;
  - un petit carré plus clair reste à la base du chignon ;
  - le contour des anciennes bretelles se devine encore légèrement sur la peau.
- **Fichiers** : `tools/generator/rocketbox/{extra_textures,both_sides,outfits}.py`, `src/three/photoMaterials.ts`, `public/coaches/{inaya,nael}/`, `src/domain/releases.ts`, `package.json`.
- **Captures** : `docs/v1120/captures/inaya-cou-avant-apres.jpg` et `inaya-bandeau.jpg` (ordinateur, rendu logiciel, **pas sur téléphone Android**).
- **Tests** :
  - TypeScript (`npx tsc -b`) : TEST RÉUSSI.
  - Vitest complet : 1037 RÉUSSIS, 1 ignoré (déjà ignoré avant).
  - Playwright ciblé (`coachs-v160`) : 4 RÉUSSIS (refait après les bandeaux).
  - Playwright complet : NON EXÉCUTÉ.
  - Téléphone Android réel : NON EXÉCUTÉ.
- **Validation** : en attente du « je valide » de Youssef (aucune fusion ni publication avant).

## 2026-11-04 · v1.13.0 · Lot 2 : écran de choix du coach (option B)

- **Demande** (Youssef, 04/11 00:11 puis 00:24) : « je veux que les cartes coach soient plus une espèce de barres comme des barres de progression pour des habiletés, poids, taille, poings, pieds, lutte… », puis « Option B » (écran de sélection façon jeu de combat, maquette https://claude.ai/artifact/AQdBa3SABDgrkNFYrTVVsf).
- **Changement** :
  - les fiches qui se retournaient sont remplacées par un écran de sélection : les six coachs en une rangée en haut, la fiche du coach choisi dessous (portrait, nom, surnom, style, barres de taille et de poids, sept barres sur 10), puis « Valider Naël » ;
  - la rangée est en haut (dans la maquette elle était en bas) : au premier lancement, la fiche apparaît sous la rangée sans la déplacer ;
  - même écran dans « Changer de coach », au premier lancement et dans Réglages > Mon coach.
- **Données** (`src/domain/coaches/catalog.ts`) :
  - taille et poids mesurés sur les modèles 3D (poids = volume du maillage × 1,06) : Kadir 91 kg, Naël 87 kg, Amara 61 kg, Inaya 65 kg. Pour Axel et Kaila, la mesure n'a pas abouti : l'écran affiche « non mesuré », jamais un chiffre inventé ;
  - les sept barres (poings, pieds, lutte, sol, vitesse, défense, endurance) sont un **profil de style** que j'ai déduit du style, de la garde et des points forts de chaque coach. Ce n'est pas une mesure, et l'écran l'indique (« Profil de style (indicatif, sur 10) »).
- **Fichiers** : `src/ui/screens/CoachSelect.tsx`, `src/ui/styles.css`, `src/domain/coaches/catalog.ts`, `src/domain/releases.ts`, `package.json`.
- **Captures** : `docs/v1130/captures/` (360×640, 400×820, premier lancement ; ordinateur, **pas sur téléphone Android**).
- **Tests** :
  - TypeScript (`npx tsc -b`) : TEST RÉUSSI.
  - Vitest complet : 1040 RÉUSSIS, 1 ignoré. Nouveau `skills-v1130.test.ts` (7 barres de 1 à 10 pour les six, poids mesurés seulement, profils tous différents).
  - Playwright `coachs-v160` : 4 RÉUSSIS. Le test des fiches qui se retournent est remplacé par celui du nouvel écran (même exigence : tout tient sur un écran en 360×640 et 400×820 ; en plus : « non mesuré » pour Axel, 91 kg pour Kadir, les sept barres et « indicatif »).
  - Contraste WCAG AA (`contrast.spec`, écran `/coach` ajouté), thèmes clair et sombre : 3 RÉUSSIS.
  - Playwright complet : NON EXÉCUTÉ.
  - Téléphone Android réel : NON EXÉCUTÉ.
- **Validation** : en attente du « je valide » de Youssef (aucune fusion ni publication avant).

## 2026-11-04 · v1.14.0 · Tenue d'Inaya : crop top, ourlets nets, nuque

- **Demande** (Youssef, 04/11 10:06, deux captures en MMA) : « Mets à Inaya une brassière moulante pleine pour masquer les fissures. Il faut une tenue adéquate qui lui aille. Fais-moi quelques propositions. » Quatre propositions comparées (https://claude.ai/artifact/FKHmhpsp4rwd98EDeHE5k7), choix « C. Crop top » (11:03), puis « crop top un peu court laissant voir les muscles du ventre » (11:05).
- **Constat après vérification** :
  - **Fissures au cou** : le corps de sport d'Inaya porte un haut noué derrière la nuque, sculpté dans le corps lui-même (corrigé en 1.12 par une peau dessinée des deux côtés). En MMA et en muay-thaï, la brassière gardait ses bretelles, qui passaient sur ce relief : un vêtement copié sur la peau copie ce pli, d'où les déchirures. En boxe et en kick-boxing, le bandeau de la 1.12 n'avait pas ce défaut.
  - **Bords effilochés** : la tranche des vêtements (leur épaisseur, 2 à 3 mm) était lissée comme une surface arrondie ; ses normales mélangeaient l'extérieur et l'intérieur du tissu et l'ourlet se lisait comme un bourrelet ondulé. La ligne de coupe elle-même est régulière (mesurée à 1 mm près).
  - **Encoches sur les bretelles** (vues pendant les essais) : des bretelles posées loin du cou (12 à 16 cm de l'axe) étaient recouvertes en garde par la peau du deltoïde, qui monte quand le bras se lève ; et près de l'articulation, la moitié de la peau sous la bretelle restait dessinée.
  - **Carré clair sous le chignon** : repéré sur le modèle à 1,60 m (outil `__labPick` du Lab). Sur les deux bords de la texture de la tête, là où ses moitiés se rejoignent derrière la tête, une bande de la peau du visage d'origine (à côté de son oreille, 5 % de la largeur) tombait sur les cheveux juste sous le chignon : un carré clair coupé au milieu par la couture.
- **Correction** :
  - `tools/generator/rocketbox/outfits.py` : nouveau haut à encolure carrée (`square_field`, `top_square`) avec bretelles entre 11,2 et 14,2 cm de l'axe, à l'écart du relief au cou et du deltoïde ; crop top pour Inaya en boxe, kick-boxing, muay-thaï et MMA (`INAYA_TOP`, `crop` par défaut avec la palette d'Inaya), son bas 4 cm sous celui d'une brassière, sur les dernières côtes : les abdominaux restent visibles ;
  - toute la peau sous le haut est masquée (y compris près des coutures de texture) ; poids du haut relâchés le long du tissu ;
  - tranche des ourlets coupés par un champ dessinée à plat (bord net) et bords libres relâchés le long d'eux-mêmes ;
  - `tools/generator/rocketbox/extra_textures.py` : la bande de peau des deux bords de la texture de la tête est remplacée par les cheveux voisins, en miroir. Les positions du corps sont identiques à la 1.13 (vérifié point par point), donc la peau masquée par les tenues reste juste (0 clé manquante sur les 7 tenues) ;
  - `src/ui/Lab.tsx` : `window.__labPick(x, y)` dit quel maillage, quel matériau et quel point de texture sont dessinés à un endroit d'une capture (outil de diagnostic, Lab seulement).
- **Fichiers** : `public/coaches/inaya/photo.glb`, `public/coaches/inaya/tenues/{boxe,kickboxing,muaythai,mma}.glb` (+ normales du tissu dans `_tex`), les deux générateurs ci-dessus, `src/ui/Lab.tsx`, `src/domain/releases.ts`, `package.json`.
- **Limites** : de dos en garde, une petite dent peut rester en bas de la bretelle droite ; la limite des cheveux sur la nuque reste un peu irrégulière ; les ourlets nets ne concernent pour l'instant que les tenues d'Inaya (les autres coachs gardent leurs fichiers de la 1.13).
- **Captures** : `docs/v1140/captures/inaya-crop-top.jpg`, `inaya-nuque-avant-apres.jpg` (ordinateur, rendu logiciel, **pas sur téléphone Android**).
- **Tests** :
  - TypeScript (`npx tsc -b`) : TEST RÉUSSI.
  - Vitest complet : 1044 RÉUSSIS, 1 ignoré. Nouveau `tenue-inaya-v1140.test.ts` (crop top dans les 4 disciplines de frappe, plus de brassière à bretelles, bas du haut au-dessus de Spine1, rien à moins de 11 cm de l'axe au-dessus de la poitrine). `realisme-v1100.test.ts` « brassières : aucune partie sur les bras » applique la même limite au crop top d'Inaya (le test cherchait la pièce par son nom « haut-brassiere » : la règle n'est pas assouplie, elle couvre le nouveau haut).
  - Playwright `outfit-loading`, `coachs-v160`, `coach-render` : 9 RÉUSSIS.
  - Playwright complet : NON EXÉCUTÉ.
  - Téléphone Android réel : NON EXÉCUTÉ.
- **Validation** : en attente du « je valide » de Youssef (aucune fusion ni publication avant).

## 2026-11-04 · v1.15.0 · Buste d'Inaya : plus d'effet « emboîté » ni de traces

- **Demande** (Youssef, 04/11 12:07) : « Il faut absolument que tu me corriges Inaya, son haut du corps. On dirait qu'il est emboîté. Il y a des traces. Vérifie, contrôle, trouve le moyen de corriger. »
- **Constat après vérification** (captures du Lab avec et sans tenue, face, 3/4, dos, garde, frappe ; outil `__labPick` pour savoir quel maillage et quel point de texture sont dessinés à un endroit) :
  - **Le bikini du corps d'origine est sculpté dans le corps.** Le corps de sport Rocketbox d'Inaya porte un haut de maillot (deux bonnets, une bande dans le dos, une bretelle autour du cou, deux petits nœuds). Ce n'est pas une peinture : ce sont 8 morceaux de la surface du corps (2 355 points), soudés à la peau par leurs bords. Repeint couleur peau en 1.12, il restait visible par sa **forme** (bords en relief jusqu'à 4,8 mm, bretelle qui se détache du cou) et par sa **couleur** : une seule teinte de peau posée sur tout le maillot traçait un contour le long de chaque bord. Au-dessus du crop top, on voyait donc les lignes de l'ancien maillot sur la poitrine, le cou et le dos, d'où l'impression d'un buste rapporté.
  - **La peau autour garde l'ombre de l'ancien maillot**, photographiée dans la texture d'origine : une ligne le long de la bande du dos et autour de la base du cou.
  - **Nuque** : le « I » clair et la zone claire sous le chignon sont des morceaux du **visage donneur** (l'arête du nez, le dessous du nez et les lèvres) que l'atlas de texture du visage place sur les bords où ses deux moitiés se rejoignent derrière la tête (texture u < 0,1 et u > 0,9, v 0,32 à 0,53 ; sur le modèle, nuque de 1,50 à 1,56 m). Les cheveux au-dessus étaient un assemblage de morceaux (chevron clair, étoile sombre au centre).
- **Correction** :
  - `tools/generator/rocketbox/flatten_halter.py` (nouveau) : les morceaux du maillot et 5 rangées de peau autour sont lissés (méthode de Taubin : pas de rétrécissement, la poitrine garde son volume), les points de même position (corps et tête) bougent ensemble, normales recalculées. Les poids de la peau ne changent pas (vérifié : ceux du maillot suivent déjà la peau voisine). Relief local maximal des points du maillot : 4,8 mm → 1,9 mm.
  - La peau autour des épaules (à moins de 15 cm des articulations des bras) n'est pas lissée : le premier essai, qui la lissait, rendait le pli des aisselles plus marqué en garde (`deformation-v1100.test.ts` : 26,8° contre 25,9° permis). Les points du maillot eux-mêmes restent lissés.
  - `tools/generator/rocketbox/extra_textures.py` : le maillot et 2 rangées de peau autour (sur le corps et sur la tête) sont repeints avec la couleur de la peau qui les entoure, diffusée sur le maillage depuis leurs bords ; même chose pour la carte de relief (normal map). Plus de contour ni d'ombre de bretelle.
  - Nuque : les mèches entre le chignon et la naissance des cheveux (1,535 m) sont redessinées d'un seul tenant (mêmes mèches que le chignon, teinte de ses cheveux, en miroir pour que les deux moitiés se rejoignent), et la peau sous la naissance est floutée (plus de traits du visage) et ramenée à la teinte du cou.
  - Les 7 tenues d'Inaya sont régénérées sur le corps corrigé (les tenues masquent la peau par position de ses points) : 0 clé manquante sur les 7.
  - `src/ui/Lab.tsx` : `__labPick` donne aussi le numéro du triangle.
- **Fichiers** : `public/coaches/inaya/photo.glb`, `public/coaches/inaya/tenues/*.glb`, `tools/generator/rocketbox/{flatten_halter,extra_textures}.py`, `src/test/glbRead.ts`, `src/ui/Lab.tsx`, `src/domain/releases.ts`, `package.json`.
- **Limites** :
  - sans tenue, de dos, une ligne fine reste à l'emplacement de la bande du maillot : à cet endroit la surface fait un pli (elle rentre puis ressort de 3 mm sur 8 mm) que le lissage n'efface pas. Avec les tenues de boxe, kick-boxing, muay-thaï et MMA, cette zone est sous le crop top ; en JJB et judo, sous le kimono ou le rashguard. Une relaxation plus forte (essayée) creusait le dos de plusieurs centimètres : abandonnée ;
  - un trait très fin reste à la base du cou, de dos (même pli, sur la bretelle autour du cou) ;
  - sur la poitrine en garde, quelques tirets sombres d'un pixel, déjà présents en 1.14 : le maillage est fermé à cet endroit (vérifié, aucune fente), probablement l'ombre portée ; non corrigé ;
  - la mesure des angles entre triangles voisins du maillot donne plus d'arêtes vives après lissage (59 au-dessus de 90° contre 11) : ce sont de petits triangles très étirés du maillot d'origine, sans effet visible sur les captures, où le contour est nettement moins marqué.
- **Captures** : `docs/v1150/captures/inaya-buste-tenue.jpg` (garde, 3/4, dos en MMA) et `inaya-buste-sans-tenue.jpg` (face, dos, nuque). Ordinateur, rendu logiciel, **pas sur téléphone Android**.
- **Tests** :
  - nouveau `src/three/__tests__/buste-inaya-v1150.test.ts` : relief local des points de l'ancien maillot sous 2,5 mm. Il **échoue sur le modèle 1.14** (4,74 mm), il réussit sur la 1.15 (vérifié dans les deux sens).
  - `deformation-v1100.test.ts` (plis aux articulations en garde, par rapport à la 1.11) : ÉCHOUÉ au premier essai (aisselles d'Inaya, voir ci-dessus), puis RÉUSSI après la correction ; le test n'a pas été modifié.
  - TypeScript (`npx tsc -b`) : TEST RÉUSSI.
  - Vitest complet : 1045 RÉUSSIS, 1 ignoré (déjà ignoré avant).
  - Playwright `outfit-loading`, `coachs-v160`, `coach-render` : 9 RÉUSSIS.
  - Playwright complet : NON EXÉCUTÉ.
  - Téléphone Android réel : NON EXÉCUTÉ.
- **Validation** : en attente du « je valide » de Youssef (aucune fusion ni publication avant).

## 2026-11-04 · v1.16.0 · Visages plus vivants (expressions Rocketbox)

- **Demande** : Youssef, 04/11 14:09, a demandé si j'avais examiné les dépôts Microsoft-Rocketbox, MoveBox et Headbox. À 14:16, après ma proposition, il a écrit « applique ta proposition », puis à 14:19 « applique juste proposition que je valide en avance de phase ».
- **Constat après vérification** :
  - Chaque avatar Rocketbox « facial » porte 175 expressions du visage sous forme de formes de maillage : 15 visèmes, 52 ARKit, 48 FACS et 42 VIVE, toutes sous licence MIT comme les avatars. Elles ont été créées par l'équipe Headbox.
  - `convert.py` les supprimait, parce que ses modificateurs ne s'appliquent pas en leur présence. Les GLB des coachs n'avaient donc aucune expression (0 cible de morphose).
  - Les visages bougeaient seulement par quelques os, de quelques millimètres.
  - MoveBox (outils Unity de capture de mouvement, partie vidéo sous licence de recherche) et Headbox (sans licence, dépendances OpenFace non commerciales) ne sont pas utilisés.
- **Correction** :
  - `tools/generator/rocketbox/morph_extract.py` (nouveau) lit 25 expressions ARKit sur l'avatar d'origine. Pour Naël et Inaya, il part du fichier .blend après la greffe du visage. Le maillage est subdivisé comme dans `convert.py`. Les écarts sont écrits en mètres, dans les axes glTF.
  - `tools/generator/rocketbox/morph_apply.py` (nouveau) pose ces expressions sur le `photo.glb` livré, sans reconstruire le coach :
    - chaque point prend l'écart du point source le plus proche, à moins de 2 mm ;
    - les cibles sont creuses (seuls les points qui bougent sont stockés) ;
    - leurs noms vont dans `extras.targetNames`.
  - Effet sur Kadir, Amara, Naël et Inaya : environ 320 Ko de plus par coach, et le corps ne bouge avec aucune expression.
  - `src/three/face.ts` : quand le modèle porte les expressions, elles remplacent les os des paupières, des sourcils, de la bouche et de la mâchoire. Les yeux tournent toujours avec leurs os.
    - Clignement : `EyeBlink`.
    - Effort d'une frappe : sourcils froncés, yeux plissés, joues remontées, nez un peu froncé, lèvres pincées.
    - Souffle de la frappe : lèvres arrondies et entrouvertes, avec un léger retard.
    - Aucune expression ne va au-delà de 0,9.
  - `dropStillMorphs` retire les expressions des parties qui ne bougent pas (le corps et les globes oculaires). Sans cela, three.js garderait une texture inutile en mémoire graphique, d'environ 6 Mo pour le corps.
  - `src/ui/Lab.tsx` : `?expr=JawOpen:1,…` impose des expressions pour les captures.
  - Axel et Kaila (MakeHuman) n'ont pas ces expressions : ils gardent les os, jusqu'au lot 4 (refaits sur le corps Rocketbox).
- **Fichiers** : `tools/generator/rocketbox/morph_{extract,apply}.py`, `public/coaches/{mma-kadir,mma-amara,nael,inaya}/photo.glb`, `src/three/face.ts`, `src/three/PhotoCoach.tsx`, `src/ui/Lab.tsx`, `src/domain/releases.ts`, `package.json`.
- **Captures** : `docs/v1160/captures/expressions-avant-apres.jpg` (Kadir et Inaya : clignement et effort, avant et après) et `expressions-amara.jpg` (repos, clignement, effort, bouche ouverte, sourire, souffle). Ordinateur, rendu logiciel, **pas sur téléphone Android**.
- **Limite** : la différence au repos est nulle (voulu). Pendant une frappe, elle est visible surtout de près. En plan large, la tête fait quelques centimètres à l'écran.
- **Tests** :
  - nouveau `src/three/__tests__/expressions-v1160.test.ts` (26) : les 25 expressions sont présentes sur les 4 coachs ; le clignement descend de 4 à 15 mm ; la mâchoire s'ouvre de moins de 2,5 cm ; le corps reste immobile ; chaque modèle pèse moins de 3,5 Mo ; les poids des expressions sont bornés ; le moteur pilote bien les expressions.
  - `face.test.ts` (30, os du visage) : TEST RÉUSSI, inchangé.
  - TypeScript : TEST RÉUSSI.
  - Vitest complet : 1071 RÉUSSIS, 1 ignoré (déjà ignoré avant).
  - Playwright `outfit-loading`, `coachs-v160`, `coach-render` : 9 RÉUSSIS.
  - Playwright `training-layout` et `coach-3d-recovery` : 17 RÉUSSIS et 1 ÉCHOUÉ, `training-layout:329` (caméra Auto : « direct vu presque à hauteur d'homme »). Ce test **échoue de la même façon sans ce lot** : vérifié sur la base 1.15.0, avec les modifications mises de côté. Il n'est donc pas causé par ce lot et n'a pas été modifié.
  - Playwright complet : NON EXÉCUTÉ.
  - Téléphone Android réel : NON EXÉCUTÉ.
- **Validation** : validée d'avance par Youssef (14:19). Le bronzage d'Inaya (PR #52) n'est pas inclus et attend son « je valide ».
## 2026-11-04 · v1.17.0 · Inaya légèrement bronzée

- **Demande** : Youssef, 04/11 13:52, « peux-tu la bronzer un tout petit peu ? », puis 13:53 « non juste bronzage » (la demande « plus pulpeuse » est abandonnée).
- **Constat** : la peau d'Inaya vient de la texture photo de Sports_Female_01 (Rocketbox), très claire et rosée ; rien dans le shader de la peau ne permettait de régler sa teinte par coach.
- **Correction** :
  - `src/three/skinShader.ts` : nouveau réglage facultatif de la couleur de la peau par coach (`sat` saturation, `gain` luminosité, `warm` glissement vers l'orangé), appliqué à la couleur de la texture avant l'éclairage. Sans réglage, rien ne change.
  - `src/three/photoMaterials.ts` : Inaya `sat: 1.12, gain: 0.8, warm: 0.12`. Trois niveaux ont été comparés en capture ; celui-ci donne un hâle doré léger. Mesure sur le ventre, lumière de l'appli : bleu 92,7 → 72,6, vert 126,5 → 110,6, rouge 193,6 → 187,1 (sur 255).
  - Les cheveux (dont la nuque peinte) et les tenues ont d'autres matières : inchangés. Les autres coachs : inchangés.
- **Fichiers** : `src/three/skinShader.ts`, `src/three/photoMaterials.ts`, `src/domain/releases.ts`, `package.json`.
- **Captures** : `docs/v1170/captures/inaya-bronzage-avant-apres.jpg` (avant / après, lumière vive puis lumière de l'appli). Ordinateur, rendu logiciel, **pas sur téléphone Android**.
- **Tests** :
  - nouveau `src/three/__tests__/bronzage-inaya-v1170.test.ts` : réglage d'Inaya modeste, autres coachs sans réglage, réglage transmis au shader.
  - TypeScript (`npx tsc -b`) : TEST RÉUSSI.
  - Vitest complet : 1048 RÉUSSIS, 1 ignoré (déjà ignoré avant).
  - Playwright `outfit-loading`, `coachs-v160`, `coach-render` : 9 RÉUSSIS.
  - Playwright complet : NON EXÉCUTÉ.
  - Téléphone Android réel : NON EXÉCUTÉ.
- **Validation** : « je valide » de Youssef le 04/11 à 14:54 ; publiée en 1.17.0 (numérotée 1.16.0 au départ, la 1.16.0 étant passée avant).
## 2026-11-04 · v1.18.0 · Buste d'Inaya : maillot sculpté retiré (correctif n° 4)

- **Demande** : Youssef, 04/11 16:07, « passe aux corrections avec un gain max les moins coûteuses » ; correctif n° 4 de `docs/coachs-3d/CORRECTIFS_IDENTIFIES.md`.
- **Constat après vérification** (captures du Lab sans tenue, carte de relief et texture coupées) : le haut de maillot du corps Rocketbox Sports_Female_01 n'est pas peint, il est modelé dans la surface même du corps (8 morceaux : bonnets, bretelle autour du cou, bande du dos, nœuds). Le lissage de la 1.15 avait gardé sa forme : un cordon autour du cou, un bourrelet en travers du dos (3,7 mm de bosse), le contour des bonnets et de la sous-bande. Leurs bords sont repliés vers l'intérieur comme des ourlets (305 triangles tournés vers l'intérieur du torse), d'où des traits fins sur la peau.
- **Méthode** : `tools/generator/rocketbox/fair_bikini.py` (nouveau), appliqué au `photo.glb` livré :
  - le torse est lu comme un relief autour d'un axe vertical (axe du cou pour le cou). Les points de la bretelle, de la bande du dos et du contour des bonnets prennent le rayon d'une surface lisse (spline « plaque mince ») calée sur la peau voisine. Ils ne bougent que le long du rayon : la forme du torse est gardée, la forme du vêtement disparaît ;
  - le centre des bonnets ne bouge pas : la poitrine garde son volume (point le plus avancé inchangé, 108,3 mm) ;
  - les bords des morceaux sont recollés à la surface voisine, puis 412 triangles d'ourlet tournés vers l'intérieur sont retirés et 83 petites pointes sont ramenées à 1,5 mm de leurs voisins ;
  - la peau à moins de 15 cm des épaules n'est pas touchée : avec 10 à 13 cm, le pli de l'aisselle en garde dépassait la limite du test des déformations (26,1° pour 25,9° permis). Le bout des bretelles près des épaules reste donc tel qu'en 1.17 ;
  - mêmes points, mêmes coordonnées de texture, mêmes poids de peau ; les expressions du visage restent valides (visage inchangé). Déplacement moyen 3,6 mm, maximum 21 mm.
  - `tools/generator/rocketbox/outfits.py` : les expressions (1.16) empêchaient de régénérer les tenues (Blender refuse d'appliquer un modificateur à un maillage qui a des clés de forme) ; elles sont retirées à l'import, les tenues n'en ont pas besoin. Les 7 tenues d'Inaya sont régénérées (elles masquent le corps par position).
- **Amara** (même corps) : essayé, **non appliqué**. Son maillot est peint en noir dans la texture : sans sa forme, il devient un maillot peint déformé, avec un nœud abîmé entre les bonnets (`docs/v1180/captures/amara-essai-non-retenu.jpg`). Il faudrait d'abord repeindre sa peau à cet endroit, comme pour Inaya en 1.12 : choix laissé à Youssef.
- **Fichiers** : `tools/generator/rocketbox/fair_bikini.py`, `tools/generator/rocketbox/outfits.py`, `public/coaches/inaya/photo.glb`, `public/coaches/inaya/tenues/*.glb`, `src/three/__tests__/buste-inaya-v1180.test.ts`, `src/domain/releases.ts`, `package.json`, `docs/coachs-3d/CORRECTIFS_IDENTIFIES.md`.
- **Captures** : `docs/v1180/captures/inaya-buste-avant-apres.jpg` (face et dos, avant / après), `inaya-mouvements-sans-tenue.jpg` et `inaya-mouvements-tenue-mma.jpg` (direct, crochet arrière, garde ; avant en haut, après en bas). Ordinateur, rendu logiciel, **pas sur téléphone Android**.
- **Limites** : un trait léger reste au bout de la bretelle près de l'épaule droite (zone non touchée) ; les petites marques sombres peintes sur le haut des épaules viennent de la texture, inchangées.
- **Tests** :
  - nouveau `src/three/__tests__/buste-inaya-v1180.test.ts` (3) : triangles tournés vers l'intérieur du torse 305 → 20 (limite 25 : 17 au bout des bretelles près des épaules, 3 dans le creux de la poitrine) ; bosse de la bande du dos 3,7 mm → sous 2 mm ; volume de la poitrine gardé. Vérifié : 2 des 3 tests ÉCHOUENT sur le modèle de la 1.17.
  - `buste-inaya-v1150.test.ts` (relief local sous 2,5 mm) : TEST RÉUSSI, 1,84 mm, inchangé.
  - `deformation-v1100.test.ts` : TEST RÉUSSI, inchangé (il a fait choisir la marge de 15 cm aux épaules).
  - `expressions-v1160.test.ts` : TEST RÉUSSI.
  - TypeScript (`npx tsc -b`) : TEST RÉUSSI.
  - Vitest complet : 1077 RÉUSSIS, 1 ignoré (déjà ignoré avant).
  - Playwright `outfit-loading`, `coachs-v160`, `coach-render` : 9 RÉUSSIS.
  - Playwright complet : NON EXÉCUTÉ.
  - Téléphone Android réel : NON EXÉCUTÉ.
- **Validation** : « je valide » de Youssef le 04/11 à 20:25 ; PR #54 fusionnée (d32dd57), publiée en 1.18.0 sur GitHub Pages (titre vérifié).
## 2026-11-05 · v1.19.0 · Inaya refaite sur un corps propre, tenues roses avec le logo CS

- **Demande** : Youssef, 05/11 : « Repartir de zéro, puis améliorer » ; « je ne veux pas de jointure entre la tête et le reste du corps » ; « fais la coach sexy » ; 08:00 « je veux une musculature marquée de coach sportive sexy » ; 08:02 « change la couleur et met des logos de l'application (CS) comme marque de vêtements, utilise-le si nécessaire pour masquer des irrégularités » ; 08:04 effacer complètement les anciens vêtements du corps nu ; 08:06 « léger fil blanc à la place des anciennes bretelles » ; 08:10 marque du nœud et bande au milieu du dos « pas très naturel ».
- **Constats après vérification** :
  - le fil blanc des épaules était une vraie fente entre la tête et le corps : `smooth_weights.py` lissait les poids de chaque partie séparément, si bien que les points communs à la tête et au corps recevaient des poids différents et s'écartaient en mouvement (Kadir, Amara, Naël vérifiés : écart de poids max 0,03, pas de fente) ;
  - les traits sombres le long de l'ancien bikini venaient des mipmaps du téléphone qui lisaient le noir autour des îlots de texture ; la bande claire de la nuque venait de la texture de la tête, qui dessinait aussi la bretelle ;
  - les deux petites marques claires du dos (ancien nœud) et le creux de la poitrine : des morceaux de la bande repliés sur la peau, dont quelques petites faces retournées ;
  - la génération du corps ne donnait pas le même résultat d'un lancement à l'autre (ensembles d'éléments Blender parcourus dans l'ordre de la mémoire) : elle est maintenant reproductible (même fichier à chaque lancement).
- **Méthode** :
  - `tools/generator/rocketbox/clean_torso.py` (nouveau) : part du corps Rocketbox d'origine. Fusion des ourlets doublés, surface du maillot recalée sur la peau voisine (bande, cou, bord des bonnets), membrane sur le nœud du dos et le creux de la poitrine, retrait des faces en double et refermeture des petits trous, petites faces repliées ramenées à un point (les plus grandes perdent seulement leur arête la plus courte), normales recalculées sur la zone refaite. Éléments triés par numéro avant chaque fusion : génération reproductible.
  - `tools/generator/rocketbox/skin_paint.py` (nouveau) : repeint toute la peau de l'ancien maillot (corps et bas du cou de la tête) à partir de la peau voisine, grain de peau compris, avec un remplissage complet autour des îlots de texture (plus de bord sombre sur téléphone). Écart de couleur au raccord tête / corps : 1,3 / 255 en moyenne.
  - `tools/generator/rocketbox/smooth_weights.py` : toutes les parties de peau sont lissées ensemble, les points communs à la tête et au corps gardent le même poids (plus de fente aux épaules).
  - musculature marquée : forme athlétique 1.4.
  - `tools/generator/rocketbox/outfits.py` : palette rose (#D6336C) et noir (#17171C) pour Inaya (gi bleu). Logo CS en relief (police Inter Black, licence SIL OFL) posé sur la poitrine, dans le dos et sur la cuisse ; lettres foncées sur un tissu clair (muay-thaï blanc). Le logo de la cuisse prend les poids de peau de la face exacte du short qu'il touche : avec ceux du point le plus proche, il se cassait quand la jambe pliait. Bretelles du crop top posées sur les trapèzes (à 11 cm de l'axe, la peau de l'épaule laissait des jours blancs en garde). Ourlets adoucis.
- **Fichiers** : `tools/generator/rocketbox/clean_torso.py`, `skin_paint.py`, `smooth_weights.py`, `outfits.py`, `extra_textures.py`, `public/coaches/inaya/photo.glb`, `public/coaches/inaya/tenues/*.glb` (+ `_tex`), `src/three/__tests__/tenue-inaya-v1140.test.ts`, `buste-inaya-v1150.test.ts`, `docs/audit-biomecanique/MESURES_SOL.md`, `docs/v1100/MESURES_DEFORMATIONS.md`, `src/domain/releases.ts`, `package.json`.
- **Captures** : `docs/v1190/captures/` (corps sans tenue face et dos, 8 tenues en garde, logo de la cuisse, retouches des tenues, poitrine et aisselle en garde). Ordinateur, rendu logiciel, **pas sur téléphone Android**.
- **Tests réécrits (raison documentée dans chaque fichier, aucun supprimé)** :
  - `tenue-inaya-v1140` : la règle « aucune bretelle à moins de 11 cm de l'axe » protégeait du licou du corps d'origine, qui n'existe plus. Nouvelle règle, même but (pas de bretelle autour du cou) : rien à moins de 7 cm de l'axe au-dessus de la poitrine et rien au-delà de 13 cm près du cou.
  - `buste-inaya-v1150` : borne de contrôle du nombre de points de l'ancien bikini 2000 → 1400 (les 150+ points doublés des ourlets sont fusionnés ; 1518 points). La limite de qualité (relief sous 2,5 mm) est inchangée et respectée.
- **Retouches du 05/11 (10:31 à 10:34)**, après les captures : « c'est beaucoup mieux » ; bas du rash-guard et ceinture du short MMA entourés ; « les kimonos, je les voudrais moins bouffis, plus cintrés mais pas collés » ; « pour le corps nu, je veux que les tétons soient visibles », « pas visibles sous les vêtements, il faut que ce soit naturel » ; plis d'aisselle « corriger ou réduire dans la 1.19 ».
  - **Rash-guard (no-gi)** : constat, le haut du legging (2,5 mm de la peau, 3 mm d'épaisseur) passait à travers le bas du rash-guard (3,5 mm), d'où des dents noires. Correction : le rash-guard long s'écarte à 8 mm sur ses 6 derniers cm (`outfits.py`, `tpush`).
  - **Ceinture du short** : constat, les côtes du tricot élastique se lisaient comme un tissu froissé et rayé sur la courbe des fessiers. Correction : relief et ton du tricot baissés pour Inaya (`BAND_RELIEF` 0,15 au lieu de 0,5).
  - **Kimonos** : `GI_FIT` 0,6 pour Inaya. Les manches, le pantalon et l'évasement de la jupe gardent 60 % de leur ampleur, et leurs plis sont plus plats. La place autour du torse est gardée : un premier essai plus serré à la taille faisait ressortir le rash-guard et le haut du pantalon en taches au-dessus de la ceinture.
  - **Poitrine** : `clean_torso.py` relève un téton doux (3 mm, 0,65 cm de large) au bout de chaque sein, vu le long de son axe tourné de 20° vers l'extérieur. `skin_paint.py` peint l'aréole autour : brun rosé atténué, 1,9 cm de rayon, bord irrégulier et fondu. Les hauts restent à 3,5 mm ou plus de la peau et masquent la peau dessous : rien ne se voit à travers les vêtements.
  - **Aisselles** : constat, `deformation-v1100` s'arrêtait au premier écart (garde, 28,1° pour 25,9° permis) et en cachait un second (bras levés, 42° pour 33,8°). Cause : les épaules plus musclées (forme 1.4) plient la peau sur des poids d'épaule lissés trop près de l'articulation. Correction : poids lissés sur une sphère de 27 cm, 45 passes (au lieu de 15 cm, 12 passes ; `smooth_weights.py epaules=0.27:45`). Résultat : garde 20°, bras levés 32°, jab 17°, crochet 19°. Au-delà, les triangles du coude ou de l'aisselle s'écrasaient sous le seuil du test. L'exception acceptée un moment pour la garde est retirée : le test est inchangé.
- **Tests** :
  - `buste-inaya-v1180` (3) : TEST RÉUSSI ; `buste-inaya-v1150` : TEST RÉUSSI ; `tenue-inaya-v1140` (4) : TEST RÉUSSI ; `floor-contact` : mesures régénérées (`AUDIT_UPDATE=1`), TEST RÉUSSI ; `pose.test` : TEST RÉUSSI.
  - `deformation-v1100` : TEST RÉUSSI pour les six coachs, sans exception.
  - Vitest complet, après les retouches : 1077 RÉUSSIS, 1 ignoré (déjà ignoré avant), 0 ÉCHOUÉ. Pendant le travail, `session.test`, `engine.test` et `pose.test` ont échoué une fois, lancés en même temps qu'une capture ; relancés seuls : RÉUSSIS.
  - TypeScript (`npx tsc -b`) : TEST RÉUSSI.
  - Playwright `outfit-loading`, `coachs-v160`, `coach-render` : 9 RÉUSSIS. Playwright complet : NON EXÉCUTÉ.
  - Téléphone Android réel : NON EXÉCUTÉ.
- **Validation** : « je valide » de Youssef le 05/11 à 12:46 (la demande « un bonnet de plus » de 12:45 a été annulée par lui à 12:46, rien n'en est livré) ; PR #55 fusionnée (edf1053), publiée en 1.19.0 sur GitHub Pages.

## 2026-11-05 · v1.20.0 · Inaya : cou naturel, logo stable, visage vivant

- **Demande** : Youssef, 05/11 13:42 (capture du cou entourée) : « le corps d'Inaya est beaucoup mieux mais son cou n'est pas naturel, tout le corps doit être harmonieux et ultra réaliste » ; « le logo CS sur la brassière disparaît et réapparaît pendant les mouvements ==> supprime-le ou place-le à des endroits où ce n'est pas risqué » ; « les expressions du visage sont toujours trop figées ».
- **Lot 1, cou**
  - Constat après vérification : la reconstruction 1.19 lissait le bas du cou avec un lissage simple qui rétrécit la surface. Largeur au raccord du cou mesurée sur le modèle : 13,5 cm pour Inaya contre 21,8 cm pour Amara, même modèle de départ. Le cou était un cylindre mince sans muscles. La peau du corps était aussi plus claire que le visage (joue 213,157,118 contre cou 230,187,152).
  - Correction (`clean_torso.py`) : lissage qui garde le volume (Taubin) au lieu du lissage simple, base du cou un peu plus pleine. Sculpture légère des muscles du cou (sterno-cléido-mastoïdiens), du haut des trapèzes et des clavicules (relief 2,5 à 4 mm). Normales recalculées sur la zone sculptée, identiques des deux côtés du raccord tête / corps. Mesures obtenues : largeur 19,5 / 11,5 / 9,9 cm (Amara 21,8 / 12,0 / 9,8), profondeur 12,0 / 10,9 / 10,7 cm (Amara 11,3 / 10,5 / 10,4).
  - `skin_paint.py` : couleur du corps et du bas du cou accordée à la moyenne du visage, canal par canal (force 0,7). Cou après correction : 222,176,138.
- **Lot 2, logo de la brassière**
  - Constat après vérification : la respiration gonfle la poitrine en poussant chaque point le long de sa normale (`breath.ts`). Le logo, posé à 0,3 mm du tissu, avait ses propres normales, différentes de celles de la brassière. À l'inspiration, le tissu avançait plus que le logo et le recouvrait, puis le logo réapparaissait à l'expiration.
  - Correction : le logo reprend exactement les normales du tissu sous lui (interpolées sur la face touchée, `outfits.py` `keep_n`). Il bouge donc avec lui. Il est posé à 1,5 mm au lieu de 0,3 mm, et dessiné en priorité sur le tissu (`outfit.ts`, `polygonOffset`). Les 7 tenues d'Inaya sont regénérées.
- **Lot 3, expressions**
  - Constat après vérification : entre deux coups, le moteur du visage (`face.ts`) ne faisait que cligner et bouger les yeux. Les expressions ne s'allumaient qu'au-dessus de 1,6 m/s de vitesse de main ou de pied, et la bouche bougeait peu à l'expiration (mâchoire 0,14).
  - Correction : un visage au repos qui vit. Une nouvelle humeur toutes les 2 à 5 s, atteinte en environ 1 s : regard concentré (sourcils un peu baissés, yeux plissés), sourcils intérieurs relevés de temps en temps, lèvres pincées ou léger sourire asymétrique. La respiration (15 par minute, plus rapide après l'effort) ouvre un peu les narines et les lèvres. L'effort s'allume plus tôt (1,3 m/s) et l'expiration de la frappe est plus marquée (mâchoire 0,3, lèvres arrondies 0,6). Tout s'arrête quand le modèle est immobile (captures, tests). S'applique à tous les coachs qui ont des expressions (Kadir, Amara, Naël, Inaya).
- **Lot 4, définition des muscles** (Youssef 14:09 : « la définition du corps d'Amara est meilleure, les muscles sont bien dessinés et il paraît plus réaliste, pourquoi ? » ; 14:38 « la reprise du détail des muscles d'Amara : oui »)
  - Constat après vérification : même corps Rocketbox, même découpe de texture. La carte de relief d'Inaya avait 40 % de détail en moins que celle d'Amara (qui porte notre cuisson d'anatomie). [Rectificatif du 05/11 en 1.21 : le « 22 % de couleur en moins » annoncé était une erreur de mesure, le fond noir autour des îlots de texture d'Amara gonflait son chiffre. Mesurée sur la peau seule, la couleur des deux a le même détail (0,023 contre 0,024). Le gain vient du relief et de la lumière.] Le maillot repeint avait aussi un relief plat. Sa lumière de peau était plus enveloppante (0,55 contre 0,45), ce qui adoucissait les ombres entre les muscles.
  - Correction : `tools/generator/rocketbox/detail_from.py` (nouveau), lancé après `skin_paint.py`. Il reprend la carte de relief d'Amara et les ombres de ses muscles (sa luminance divisée par son flou), jamais sa couleur, partout où Amara a de la peau. Son maillot est exclu avec 44 px de marge, ainsi que la zone repeinte du maillot d'Inaya (`skin_paint.py` l'écrit maintenant dans `f021_body_repeint.png`). Résultat : 46 % de la texture du corps, abdos, bras, jambes et dos. La poitrine et le haut du torse restent lisses : Amara n'y a que son maillot, il n'y a pas de détail à reprendre. Lumière de la peau d'Inaya à 0,45 comme Amara (`photoMaterials.ts`). Le maillage ne change pas : tenues inchangées.
- **Fichiers** : `tools/generator/rocketbox/clean_torso.py`, `skin_paint.py`, `outfits.py`, `src/three/outfit.ts`, `src/three/face.ts`, `src/three/photoMaterials.ts`, `tools/generator/rocketbox/detail_from.py`, `src/three/__tests__/expressions-v1160.test.ts` (2 tests ajoutés), `public/coaches/inaya/photo.glb`, `public/coaches/inaya/tenues/*.glb` (+ `_tex`), `src/domain/releases.ts`, `package.json`.
- **Tests** :
  - Vitest complet : 1079 RÉUSSIS, 1 ignoré (déjà ignoré avant), 0 ÉCHOUÉ (dont `deformation-v1100`, `buste-inaya-*`, `tenue-inaya-v1140`, `face.test`, `expressions-v1160` avec ses 2 nouveaux tests).
  - TypeScript (`npx tsc -b`) : TEST RÉUSSI.
  - Playwright `outfit-loading`, `coachs-v160`, `coach-render` : 9 RÉUSSIS. Playwright complet : NON EXÉCUTÉ.
  - Après le lot 4 : Vitest 1079 RÉUSSIS, 1 ignoré ; TypeScript RÉUSSI ; Playwright ciblé 9 RÉUSSIS.
  - Logo vérifié sur 5 poses de garde, crochet et uppercut ; muscles comparés face, profil et dos à Amara (ordinateur, rendu logiciel). Téléphone Android réel : NON EXÉCUTÉ.
- **Validation** : « je valide » de Youssef le 05/11 à 15:01 ; PR #56 fusionnée (154d18f), publiée en 1.20.0 sur GitHub Pages (titre vérifié).

## 2026-11-05 · v1.21.0 · Les améliorations d'Inaya sur les autres coachs

- **Demande** : Youssef, 05/11 15:14 : « si ce n'est pas déjà fait, je voudrais que tu appliques toutes les améliorations effectuées sur Inaya sur les autres coachs, pas de régression sur les autres coachs, que du bonus ; liste-moi les plus chez Inaya non déployés sur les autres ».
- **Constat après vérification** (liste envoyée à Youssef) :
  - déjà sur tous : visage vivant au repos (1.20) sur Kadir, Amara et Naël. Absent chez Axel et Kaila, dont le visage n'est piloté que par des os ;
  - non déployé : les finitions de tenues 1.19 et 1.20 (ourlets, rash-guard long écarté du legging, ceinture moins froissée, kimonos cintrés, logo CS et sa correction) ; seules les tenues d'Inaya avaient été regénérées ;
  - Naël : sa carte de relief est identique à celle de Kadir (écart moyen 0,0) et sa couleur a le même détail (0,027 contre 0,028, sur la peau seule) ; seule sa lumière de peau différait (0,5 contre 0,45) ;
  - propres à Inaya, sans objet pour les autres : corps refait sans l'ancien maillot, tétons, sculpture du cou, palette rose, bretelles du crop top, assouplissement des aisselles (les autres passent déjà `deformation-v1100`).
- **Méthode** :
  - `outfits.py` : `GI_FIT` 0,6, `BAND_RELIEF` 0,15 et `LOGO` actifs pour tous les coachs (couleur du trait : rouge, or pour Naël, rose pour Inaya). Les 42 tenues des 6 coachs sont regénérées.
  - Constat en cours de lot : le test `outfit-v043` (budget d'appels de dessin des téléphones) a échoué pour Kadir et Amara (boxe 14 pour 10 permis, kick-boxing 8 pour 7). Chaque logo ajoutait deux appels (lettres, trait). Correction : `merge_prints()` fusionne tous les logos d'une tenue en une seule pièce, avec un seul matériau et les deux couleurs portées par les points (COLOR_0) : un seul appel. Le test est inchangé.
  - `face.ts` : la vie au repos (humeur toutes les 2 à 5 s, respiration) est calculée pour tous les visages. Sur les visages à os (Axel, Kaila) : sourcils baissés par la concentration, sourcils intérieurs relevés de temps en temps, coins de la bouche en léger sourire asymétrique ou lèvres pincées, mâchoire qui suit la respiration (0,8° au plus), paupières un peu plissées. L'humeur et la respiration partent de zéro, pour éviter un saut à la première image.
  - `photoMaterials.ts` : lumière de peau de Naël à 0,45 comme Kadir.
- **Fichiers** : `tools/generator/rocketbox/outfits.py`, `src/three/face.ts`, `src/three/photoMaterials.ts`, `src/three/__tests__/face.test.ts` (1 test ajouté, × 6 coachs), `public/coaches/*/tenues/*.glb` (+ `_tex`), `src/domain/releases.ts`, `package.json`.
- **Captures** : 5 coachs × 4 tenues (boxe, MMA, no-gi, judo), avant / après, en garde. Aucun recul visible. La ligne sombre entre le rash-guard et le legging d'Amara et de Kaila a disparu. Ordinateur, rendu logiciel, **pas sur téléphone Android**.
- **Tests** :
  - Vitest complet : 1085 RÉUSSIS, 1 ignoré (déjà ignoré avant), 0 ÉCHOUÉ (dont `outfit-v043` après la fusion des logos, `deformation-v1100`, `face.test` avec son nouveau test pour les 6 coachs).
  - TypeScript (`npx tsc -b`) : TEST RÉUSSI.
  - Playwright `outfit-loading`, `coachs-v160`, `coach-render` : 9 RÉUSSIS. Playwright complet : NON EXÉCUTÉ.
  - Téléphone Android réel : NON EXÉCUTÉ.
- **Validation** : « je valide » de Youssef le 05/11 à 15:54 ; PR #57 fusionnée (08b2a56), publiée en 1.21.0 sur GitHub Pages (titre vérifié).

## 2026-11-05 · v1.22.0 · Nouvelle tenue MMA des coachs femmes

- **Demande** : Youssef, 05/11 18:07 (6 photos de tenues MMA femmes : brassières à large bande noire, short 2-en-1, dégradé rose / turquoise) : « pour les coachs femme, je voudrais une tenue dans les styles des photos » ; 18:09 « MMA seulement ». Couleurs non précisées : choix annoncé (Amara noir et or, Inaya rose et noir, Kaila dégradé rose vers turquoise). Aucune marque copiée, logo CS seulement.
- **Méthode** (`tools/generator/rocketbox/outfits.py`) :
  - nouveau `shorts('surshort')`, le surshort ample d'un short 2-en-1. Il est porté sur le cuissard vale-tudo, s'arrête à 66 % de la cuisse et se tient à 10 mm de la peau (le cuissard est à 6,7 mm). La jambe est un peu évasée (2 cm au plus), avec de légers plis et une ceinture froncée (relief élastique plus marqué). Sa taille passe 8 mm au-dessus de celle du cuissard ;
  - brassière à large bande élastique (3,5 cm, `bra_v2(band=)`) ; Inaya garde son crop top, avec bande noire ;
  - dégradés : `grad_fabric()` et `paint_grad()`, couleur portée par les coins des faces (glTF COLOR_0), interpolée sur la hauteur ;
  - kits par coach : `MMAF_KITS` (`MMAF=degrade` pour Kaila dans `regen_outfits.sh`) ;
  - logo : sur le surshort seulement (celui du cuissard serait dessous), plus haut sur la cuisse ; sur la brassière, au-dessus de la large bande.
- **Constats en cours de lot et corrections** :
  - dents sous les bandes de couleur : les points de la ligne de coupe étaient poussés hors de leur plan, ce que les bandes noires sur noir d'avant cachaient. Ils sont remis sur le plan, comme sur les corps MakeHuman (`_ONCUT`, pour cette tenue seulement) ;
  - le haut du cuissard dépassait de la ceinture du surshort : les deux tailles étaient montées à la même ligne peinte. Le surshort monte maintenant 8 mm plus haut.
- **Défauts connus** : le surshort n'a pas de tissu simulé, il suit les cuisses. Sur un high kick, il se froisse à l'entrejambe. Les bords du haut de la brassière restent un peu ondulés, comme avant.
- **Fichiers** : `tools/generator/rocketbox/outfits.py`, `regen_outfits.sh`, `public/coaches/{mma-amara,inaya,kaila}/tenues/mma.glb` (+ `_tex`), `src/domain/releases.ts`, `package.json`.
- **Captures** : `rapports/tenue-mma-femmes-v122/` (garde, dos, high kick, genou, pour les 3 coachs ; gros plan des bandes d'Amara). Ordinateur, rendu logiciel, **pas sur téléphone Android**.
- **Tests** :
  - Vitest complet : 1085 RÉUSSIS, 1 ignoré, 0 ÉCHOUÉ (dont `outfit-v043` budget d'appels de dessin, `outfit-loading`).
  - TypeScript : TEST RÉUSSI.
  - Playwright `outfit-loading`, `coachs-v160`, `coach-render` : 9 RÉUSSIS. Playwright complet : NON EXÉCUTÉ.
  - Téléphone Android : NON EXÉCUTÉ.
- Point de restauration : branche `restauration/avant-v122`.
- **Validation** : « je valide » de Youssef le 05/11 à 19:03 ; PR #58 fusionnée (bdcc382). GitHub Pages : 4 déploiements de ce commit en échec côté GitHub (délai dépassé, artefact en double, puis « Deployment cancelled »), le site reste en 1.21.0 ; la 1.22.0 part en ligne avec la 1.22.1.

## 2026-11-05 · v1.22.1 · Short MMA des coachs femmes au high kick

- **Demande** : Youssef, 05/11 19:05 : « essaye de régler le froissement lors du high kick » (défaut connu signalé à la livraison de la 1.22.0).
- **Constat après vérification** (captures du high kick image par image, couches colorées pour les distinguer) : les taches grises à l'aine étaient le surshort replié sur lui-même. À l'entrejambe, il se tenait à 10 mm de la peau pour passer au-dessus du cuissard ; quand la hanche se plie fort, ce tissu éloigné de la peau se replie (la peau, elle, est masquée dessous). Sur la jambe qui frappe, le cuissard apparaît sous le surshort, ce qui est normal pour un short 2-en-1 court.
- **Méthode** (`tools/generator/rocketbox/outfits.py`) :
  - le cuissard s'arrête 1,5 cm au-dessus de l'ourlet du surshort (`shorts(..., under=True)`, `UNDER_OVERLAP`) : sous le surshort, seules ses jambes restent ; la peau reste masquée sur toute sa zone d'avant ;
  - sans cuissard dessous, le surshort est ajusté à l'entrejambe : 4 mm de la peau au lieu de 10, sans évasement ni plis, sur 9 cm de part et d'autre du milieu (`SUR_CROTCH`, `SUR_SNUG`), au-dessus du haut du cuissard seulement ;
  - essais abandonnés : lissage des pondérations du surshort (aucun effet visible) ; jambe du surshort pondérée entièrement sur la cuisse (elle suivait mieux la jambe, mais ouvrait un trou à l'entrejambe de Kaila et sous les fessiers d'Amara en garde).
- **Tenues régénérées** : MMA d'Amara, Inaya et Kaila (`regen_outfits.sh mma mma-amara,inaya,kaila`).
- **Défaut restant** : un fin pli reste visible au milieu de l'entrejambe au sommet du high kick.
- **Tests** : Vitest 1085 RÉUSSIS, 1 ignoré, 0 ÉCHOUÉ ; TypeScript RÉUSSI ; Playwright `outfit-loading`, `coachs-v160`, `coach-render` : 9 RÉUSSIS ; Playwright complet NON EXÉCUTÉ ; téléphone Android NON EXÉCUTÉ.
- Point de restauration : `feature/combat-shadow-v030` à bdcc382 (1.22.0).
- **Validation** : « je valide » de Youssef le 05/11 à 19:59 ; PR #59 fusionnée (daa427b), publiée en 1.22.1 sur GitHub Pages (titre vérifié). La 1.22.0 est partie en ligne avec elle.

## 2026-11-05 · v1.23.0 · Visages plus vivants et respiration visible

- **Demande** : Youssef, 05/11 20:03 : « je trouve toujours que les visages sont trop figés, il faut que tu trouves le moyen sans trop de développement pour que ça paraisse plus naturel » ; 20:04 : « respiration aussi, c'est très important dans les disciplines traitées ».
- **Constat après vérification** : le visage avait déjà ses clignements, de petits mouvements des yeux (±4°) et son humeur au repos (1.20, 1.21). Mais le moteur garde la tête exactement tournée vers l'adversaire, si bien que, entre deux coups, le visage était un masque posé sur une tête immobile. La respiration ne gonflait le thorax que de 4 mm (3 mm au ventre), invisible à l'écran, et les narines et les lèvres suivaient un rythme à part, sans lien avec celui de la poitrine.
- **Méthode** (sans nouveau modèle ni nouvelle animation) :
  - `src/three/face.ts` (`moveHead`) : la tête dérive lentement par-dessus la pose du moteur (trois sinus : jusqu'à 2,7° de rotation, 1,6° d'inclinaison avant, 1° de côté). Elle suit en partie le regard, lentement (constante de 0,8 s), s'efface pendant l'effort d'un coup, démarre à 0 sans à-coup et reste nulle en image fixe. Ce qui a été ajouté à l'image précédente est retiré quand le moteur n'a pas réécrit la tête (mouvement en pause), donc rien ne s'accumule ;
  - regard : un vrai coup d'œil de côté (jusqu'à 12°) une fois sur cinq environ, tenu un peu plus longtemps ;
  - respiration (`src/three/breath.ts`) : 6 mm au thorax et 5 mm au ventre (au lieu de 4 et 3), jusqu'à 1,5 fois plus profonde quand le coach est essoufflé après des coups ;
  - épaules : elles montent à l'inspiration (clavicules, jusqu'à 1,6°), moins pendant un coup ;
  - le visage respire au rythme de la poitrine (`FaceAnimator.setBreath`, appelé par `PhotoCoach`).
- **Tests** :
  - Vitest : 1085 RÉUSSIS, 1 ignoré, 0 ÉCHOUÉ.
  - `breath.test` : seuil d'amplitude relevé de 2–3,5 % à 3,5–5 % de la portée Spine2–Neck, puisque l'amplitude plus grande est la demande elle-même. Le test des sauts du visage (`face.test`, moins de 0,5 mm par image) est inchangé et réussit : la tête suit le regard lentement.
  - TypeScript : RÉUSSI.
  - Playwright `coach-render`, `training-layout`, `coachs-v160`, `outfit-loading` : 20 RÉUSSIS, 1 ÉCHOUÉ. L'échec (`training-layout:329`, caméra Auto, élévation 23° au lieu de moins de 12°) échoue aussi sans cette modification, sur la 1.22.1 : il n'est pas causé par ce lot.
  - Téléphone Android : NON EXÉCUTÉ.
- Point de restauration : `feature/combat-shadow-v030` à daa427b (1.22.1).


## 2026-11-05 · v1.24.0 · Salles immersives par discipline

- **Demande** : Youssef veut que chaque discipline s'entraîne dans sa propre salle, avec une ambiance et une lumière
  qui mettent le coach en valeur, puis précise : « une ambiance réaliste pas 3D, une image… avec des éléments
  naturels de type mouvement, balancement, lumière ».
- **Constat** : l'entraînement montrait le coach sur un fond uni bleu-gris (« Lumière vive »), le même pour les six
  disciplines. Aucun service de génération d'images par IA n'est joignable depuis l'environnement de travail.
- **Correction** :
  - six salles modélisées et rendues en photo 360° avec Blender (sans asset téléchargé, sans marque, sans texte) :
    boxe (salle à l'ancienne et ring), kick-boxing (salle de nuit, baies vitrées), MMA (académie et cage), muay-thaï
    (camp en bois de nuit), judo (dojo de jour), BJJ (académie, tapis gris) ;
  - le panorama est posé sur un dôme à sol plat : le sol reste sous les pieds du coach quand la caméra tourne, et la
    même image éclaire et se reflète sur le coach ;
  - lumière propre à chaque salle sur le coach (clé, contre-jour coloré), fond toujours plus sombre que lui ;
  - éléments vivants : sacs suspendus qui se balancent comme des pendules, lampes qui respirent doucement ;
  - réglage « Salle immersive » (Réglages › Affichage 3D), activé par défaut ; désactivé, fond uni d'avant ;
  - une salle qui ne se charge pas (hors ligne, fichier manquant) est ignorée : le coach reste affiché ;
  - images non préchargées à l'installation : téléchargées à la première séance de la discipline puis gardées.
- **Fichiers** : `src/three/rooms/` (rooms.ts, RoomScene.tsx), `src/three/CoachStage.tsx`, `src/three/StudioStage.tsx`,
  `src/store/settings.ts`, `src/ui/screens/Settings.tsx`, `vite.config.ts`, `public/salles/`, `scripts/salles/`,
  `scripts/dev/shot-salles.mjs`, `docs/v1240/SALLES.md` et captures avant/après `docs/v1240/captures/`.
- **Tests** : voir le rapport de la PR (unitaires `src/three/rooms/__tests__/rooms.test.ts`, navigateur
  `tests/e2e/salles.spec.ts` et suites voisines).
- **Validation** : Youssef « Je valide » le 2026-11-06 06:52 ; PR #61 fusionnée (dbc2dcf), lien public vérifié
  (titre v1.24.0). Tests de la PR : `theme.spec:79` (Jour, Nuit) adapté comme `moteur-lumiere:20` (salle coupée
  avant de vérifier le fond uni, assertions inchangées), RÉUSSI. `navigation.spec:178` (attend 1.9.0 en tête des
  Nouveautés) et `coach-suggest.spec:99` ÉCHOUENT aussi sur la base sans les salles : antérieurs, non liés.


## 2026-11-06 · v1.25.0 · Chargement au démarrage (« le chrono du round »)

- **Demande** : Youssef veut un écran de chargement à l'ouverture avec le logo de l'app et des messages de salle de
  combat (« ouverture des salles, nettoyage du ring… »), pour tout charger au démarrage et ne plus attendre au
  chargement des coachs ; il choisit l'option A « le chrono du round » parmi quatre maquettes, puis précise : « tout
  charger pendant le chargement de l'application, je ne veux aucune latence lors du choix des coachs ».
- **Constat** : au démarrage seul le logo fixe s'affichait ; le coach, sa tenue et la salle se téléchargeaient à
  l'ouverture de chaque écran 3D (jusqu'à 30 Mo pour un coach et ses tenues), d'où l'attente, et de nouveau à
  chaque changement de coach.
- **Correction** :
  - écran « chrono du round » : logo CS dans un cercle de chrono qui se remplit avec les octets réellement reçus
    (pas de minuteur simulé), « ROUND 1 » puis « DING ! » en doré quand tout est prêt, version affichée ;
  - messages liés au fichier en cours : salles (« Ouverture des salles… », « Allumage des projecteurs… »,
    « Nettoyage du ring… », « Mise en place des tatamis… »), coachs (« Les coachs s'échauffent… »), tenues
    (« Laçage des gants… », « Bandage des mains… », « Ceinture bien nouée… »), « Pesée officielle… », « Le coach
    t'attend ! » ;
  - téléchargés : le coach choisi d'abord avec ses tenues et les six salles, puis les cinq autres coachs avec toutes
    leurs tenues (les deux tenues de jiu-jitsu), environ 100 Mo la première fois ; gardés par le cache de l'app, les
    ouvertures suivantes ne reprennent que ce qu'une mise à jour a changé ;
  - un fichier qui ne vient pas (hors ligne, erreur) ne bloque rien : l'app s'ouvre ; « Entrer sans attendre »
    apparaît après 12 s ;
  - liste des tailles `src/boot/assetSizes.json` (générée par `scripts/boot-sizes.mjs`, un test vérifie qu'elle suit
    les fichiers) ;
  - ouvertures suivantes : un fichier déjà gardé à la bonne taille n'est pas retéléchargé ; un fichier changé par une
    mise à jour (taille différente) est retiré du cache et retéléchargé sur l'écran de démarrage ; les coachs et les
    salles sont ensuite servis directement par le cache de l'app, sans aller-retour réseau (vite.config.ts) ;
  - le logo est droit et sans son carré noir (Youssef, 07:53 : « il n'est pas droit… il doit aussi être
    transparent »), `public/icons/logo-transparent.svg` ; à 100 % il pulse au lieu de pencher ;
  - la barre du bas n'apparaît qu'avec l'écran (elle montrait « Reprendre » sous le chrono avant que l'accueil ne
    dise « Commencer »).
- **Salles à l'échelle des coachs** (Youssef, 07:00, capture du muay-thaï : « ajuster les arrière-fonds pour que ça
  soit ajusté à la taille des coachs ») :
  - *constat* : l'image 360° est prise depuis la place du coach et posée sur un dôme de 30 m ; la caméra de
    l'entraînement est 4 à 6 m devant lui, donc tout ce qui est derrière le coach (cordes du ring, cage) paraissait
    1,5 à 2 fois trop grand, et flou car agrandi ;
  - *correction* : Blender rend aussi la distance de chaque point de l'image (`salles.py` render_depth,
    `compose.py` → `profondeur.png`, 16 bits dans une image 8 bits) ; l'app pose l'image sur un relief poussé à ces
    distances (`rooms.ts` roomMesh) : le sol est à plat sous le coach, les murs, le ring et la cage à leur vraie
    distance, donc à la bonne taille vue de la caméra ; les cordes et grillages fins forment une seule surface (pas
    de déchirure) ; le coach est toujours dessiné par-dessus la salle ;
  - captures avant/après des six salles : `docs/v1250/captures/salle-*-avant.png` et `salle-*-apres.png`.
- **Fichiers** : `src/boot/` (preload.ts, BootScreen.tsx, boot.css, assetSizes.json), `src/ui/App.tsx`,
  `src/three/CoachModel.tsx` (preloadPhotoCoach), `src/three/rooms/` (rooms.ts, RoomScene.tsx, tests),
  `public/salles/*/profondeur.png`, `public/icons/logo-transparent.svg`, `scripts/salles/`, `scripts/boot-sizes.mjs`,
  `scripts/dev/shot-boot.mjs`, `vite.config.ts`, `tests/e2e/boot.spec.ts`, `tests/e2e/contrast.spec.ts` (attend les
  champs au lieu de les compter tout de suite), `src/domain/releases.ts`, `package.json`.
- **Tests** : voir le rapport de la PR.
- **Validation** : Youssef « je valide » (2026-11-06 09:10) ; PR #62 fusionnée dans `feature/combat-shadow-v030`
  (4378103), lien public vérifié (titre v1.25.0).

## 2026-11-06 · v1.26.0 · Finitions nettes des tenues et salles vivantes

- **Demandes** (Youssef, 2026-11-06) :
  - 07:03 « des ceintures hachurées et des cols hachurés pas nets, les bottes avec des trous… il faudra que les
    finitions soient nettes » ; 09:13 « je voudrais aussi des effets d'ombre ; les shorts de MMA doivent avoir la
    petite fente » (deux photos de shorts) ; « retire aussi le logo sur les brassières des coachs femmes ; il faut
    que ça soit NET » ;
  - 09:15 (téléphone, 1.25) « le coach s'est affiché en premier puis est apparu la salle » ;
  - 09:18 « il n'y a rien de vivant dans les scènes… des lumières qui clignotent légèrement, des sacs qui se
    balancent, sur les fenêtres des ombres qui se déplacent ; sois créatif mais reste ultra réaliste » ; 09:24 : les
    sacs se voient en kick-boxing, en boxe seulement en tournant la caméra ; « la cage MMA est déformée et quand je
    bouge l'écran on dirait que le coach flotte dans le vide » ; « il faut des éléments vivants quel que soit l'angle
    de vue ».
- **Constats après vérification** (captures du labo et de l'écran d'entraînement, `scripts/dev/shot-finitions.mjs`,
  `scripts/dev/shot-salles.mjs`) :
  - ceintures et cols : le relief de piqûres était fait de rainures fines (0,5 mm) en pointillés tous les 3 à 4 mm,
    plus une teinte plus sombre dans les creux ; vu à quelques mètres sur un téléphone, un pixel couvre plusieurs
    rainures, d'où le hachuré qui scintille ;
  - bottes de boxe : sur les tibias qui ne sont pas ronds (arête du tibia), la peau dépassait de plus de 6 mm de
    l'ellipse mesurée et n'était pas masquée : taches couleur peau à l'avant de la tige (Axel, Amara) ;
  - en cherchant pourquoi Axel gardait ses trous : chez Axel et Kaila (corps MakeHuman), la peau sous **toutes**
    leurs tenues n'était masquée qu'à un tiers environ. Leur fichier range les points entrelacés avec les normales et
    les coordonnées de texture ; le générateur et l'app lisaient ces données comme une simple suite de positions, et
    Blender pose leur peau au repos du squelette, à 1 cm des points enregistrés : la plupart des points à cacher ne
    correspondaient à rien et la peau traversait les vêtements en mouvement ;
  - ombres : les vêtements étaient éclairés comme si rien n'était autour d'eux (kimono blanc tout plat, ceinture qui
    semble collée) ; sur téléphone les ombres portées sont coupées (qualité auto) ;
  - shorts de MMA : pas de fente (retirée en v0.32 car découpée le long des triangles, bords déchirés) ;
  - brassières : le logo CS devant et dans le dos ;
  - salle après le coach : la 1.24 attendait 1,2 s après l'apparition du coach avant de charger la salle, pour ne
    jamais retarder le coach ; depuis la 1.25 la salle est déjà sur le téléphone, ce délai ne sert plus ;
  - cage MMA : le grillage est plus fin qu'un pixel de l'image des distances, qui hésitait entre le grillage et le
    fond de la cage : le relief déchirait ce qu'on voit à travers ;
  - « coach qui flotte » : l'ombre du coach au sol (ContactShadows, vue d'en dessous) voyait aussi les murs, le ring
    et la cage du relief de la salle, qui la remplissaient : plus d'ombre au sol sous le coach ;
  - salles : les lampes ne respiraient que de 7 %, les sacs sont sur les côtés (hors du champ en vue de face).
- **Corrections** :
  - `tools/generator/rocketbox/outfits.py` (les 42 tenues des 6 coachs regénérées, `regen_outfits.sh`) :
    - ombres : chaque vêtement porte son occlusion ambiante dans les couleurs de ses points (glTF COLOR_0, 24 rayons
      par point jusqu'à 15 cm, corps et autres vêtements autour) : plus sombre dans les plis, sous la ceinture et le
      col, à la taille, dans les manches, au contact de la peau ; visible sur tous les téléphones, avec ou sans
      ombres portées ; ce qui est sous un autre vêtement reste clair (sinon taches grises là où il dépasse) ;
    - ceintures et cols : canaux de piqûres doux, continus et peu profonds, grain plus calme, plus de teinte dans
      les creux ;
    - bottes : toute la peau du pied et du tibia sous le haut de la tige est masquée ; 11 mm de jeu autour du tibia
      des corps MakeHuman (leurs grandes faces coupaient la courbe du tibia sous le col) ;
    - points de peau à cacher : chaque point enregistré est retrouvé là où le squelette au repos le pose
      (`tools/generator/rocketbox/skinmap.py`, qui lit aussi les données entrelacées) : 100 % des points trouvés pour
      les 6 coachs (Axel et Kaila : 8 % avant) ;
    - shorts de MMA (vale-tudo, sur-short, short MMA du no-gi) : fente de 5 cm sur le côté extérieur de chaque
      jambe, en pointe, découpée par le champ comme l'ourlet (bords nets) ;
    - brassières des coachs femmes sans logo (le logo des shorts et des rashguards reste).
  - `src/three/outfit.ts` : les points du corps sont lus un par un (données entrelacées d'Axel et Kaila) avant de
    cacher la peau sous la tenue ;
  - `src/three/CoachStage.tsx` : la salle se charge tout de suite ; le coach reste caché jusqu'à la première image
    de sa salle (ou son échec, ou 5 s au plus) : ils apparaissent ensemble.
  - `scripts/salles/salles.py` : pour l'image des distances seulement, chaque pan de grillage devient un plan plein
    (ce qu'on voit à travers est posé dessus, droit) ; `public/salles/mma/profondeur.png` refaite.
  - `src/three/rooms/` : la salle sur sa propre couche (`ROOM_LAYER`), hors de l'ombre au sol du coach, plus
    marquée dans les salles (0,92) ; salles vivantes (`life.ts`, shader du relief, `RoomDust.tsx`) :
    - poussière fine qui flotte dans la lumière autour du coach, dans toutes les salles, vue de tous les côtés ;
    - une lampe hoquette de temps en temps (2 à 4 baisses en 0,7 s, toutes les 7 à 13 s) et la lumière du coach
      baisse un peu avec elle quand elle est proche ;
    - les flaques de lumière des lampes suspendues se balancent au sol (boxe, muay-thaï) ;
    - ombres de branches qui se balancent et de nuages qui passent sur les fenêtres (boxe, kick-boxing) et les shoji
      du dojo (judo) ;
    - la nuit, les phares d'une voiture passent derrière les vitres puis sur le plafond (kick-boxing) ;
    - les lampes respirent un peu plus (10 % au lieu de 7 %).
- **Fichiers** : `tools/generator/rocketbox/outfits.py`, `tools/generator/rocketbox/skinmap.py`, `src/three/outfit.ts`,
  `public/coaches/*/tenues/*.glb`, `scripts/salles/salles.py`,
  `public/salles/mma/profondeur.png`, `src/three/CoachStage.tsx`, `src/three/StudioStage.tsx`,
  `src/three/rooms/` (rooms.ts, RoomScene.tsx, life.ts, RoomDust.tsx, `__tests__/life.test.ts`),
  `src/boot/assetSizes.json`, `src/ui/Lab.tsx` (`__labMats`), `scripts/dev/shot-finitions.mjs`,
  `scripts/dev/shot-salles.mjs` (FRAMES, DRAGS), `tests/e2e/salles.spec.ts` (coach avec sa salle),
  `src/domain/releases.ts`, `package.json`.
- **Tests** : voir le rapport de la PR.
- **Validation** : Youssef « je valide » (2026-11-06 10:58) ; PR #63 fusionnée dans `feature/combat-shadow-v030`
  (d230f5b), lien public vérifié (titre v1.26.0).

## 2026-11-06 · v1.27.0 · De vraies salles d'entraînement, sols dédiés, protège-tibias MMA
- **Demandes de Youssef (06/11, 11:12 à 11:22)** : « supprime la poussière, ça fait trop » ; « pour le MMA, rajoute
  aux coachs des protège-tibias bien faits comme les autres (pas de bavures) » (3 photos, rangées dans
  `maquettes/references-2026-11-06/`) ; « transforme chaque salle en un véritable environnement d'entraînement
  professionnel » avec une liste d'équipements par discipline, « pas trop chargé, premium mais immersif », « pas
  minimaliste quand même » ; « au sol il ne faut pas laisser l'espèce de carrelage… un tatami, un sol dédié » ;
  « pour la boxe anglaise, le sol adéquat, à toi de me dire » ; deux captures de téléphone : « le ring et la cage
  présentent des défauts ».
- **Constats après vérification** :
  - sol « carrelage » : le sol des salles était un motif de dalles de 1 m aux joints marqués (MMA : un quadrillage
    de joints posés en relief ; kick-boxing et JJB : dalles « brique » ; muay-thaï : dalles de caoutchouc) ;
  - ring de muay-thaï (capture 12:17) : cordes énormes, floues, avec des éclats noirs. Le ring était à 4 m derrière
    le coach ; ses cordes, plus fines qu'un pixel de l'image des distances, faisaient passer le relief de la corde
    au fond d'un point à l'autre : triangles étirés ou retirés (les éclats) ;
  - cage MMA (capture 12:20) : même cause sur les barres du haut, aux coins, et le grillage avant mêlé au fond ;
  - le nouveau test « ring ou cage d'une seule pièce » échoue sur les images de distances de la 1.26.
- **Corrections** :
  - poussière retirée (`RoomDust.tsx` supprimé, `life.ts` sans couleur de poussière ; le test vérifie qu'elle n'existe
    plus) ;
  - `tools/generator/rocketbox/outfits.py` `mma_shin_guards` : protège-tibias de MMA des 6 coachs, une chaussette
    rembourrée du dessous du genou jusqu'au cou-de-pied, talon dégagé par une ouverture arrondie, orteils et semelle
    libres, plastron matelassé devant le tibia, bande élastique en haut aux couleurs des gants ; tous les bords
    découpés par un champ (lignes lisses), bord libre lissé plus longtemps (40 pas), le protège-tibias ne suit que
    le tibia et le pied (sinon le bord du haut se froissait quand le genou pliait, Kaila) ;
  - `scripts/salles/equipement.py` (nouveau) : une cinquantaine d'équipements modelés (aucun fichier téléchargé,
    aucune marque, aucun texte lisible) et des images faites sur place (affiches de combat, tableaux techniques,
    calligraphies, portraits sépia, drapeau du Brésil, cadran d'horloge) ;
  - `scripts/salles/salles.py`, salle par salle, tout rangé le long des murs (l'espace du coach reste libre) :
    - boxe anglaise : sol caoutchouc sportif noir en rouleaux, sacs lourds de 3 tailles, poire de vitesse,
      double-end, râtelier de gants, cordes à sauter, étagère casques / bandages / protège-dents en bacs /
      serviettes, tabouret de coin, seau, serviette, gong, chrono de round, 4 affiches, horloge, grand miroir ;
    - MMA : tatamis noirs (joints discrets) et bande rouge, cage reculée de 2 m (salle allongée de 4 m), mannequins
      de grappling (au sol, assis contre le mur), étagères gants MMA / protège-tibias / casques, pattes d'ours et
      paos, boucliers debout, cordes ondulatoires, kettlebells, médecine-balls, banc de récupération, chrono,
      affiches, horloge ;
    - muay-thaï : hangar allongé de 5 m, ring reculé de 3 m, mur de planches au fond, tapis épais d'une pièce sous
      le coach, paos thaïs, protège-tibias empilés, pattes d'ours, bandes, bouteilles d'eau sur un banc, boucliers
      de low-kick, cordes à sauter sur un poteau, ceintures de champion, trophées, affiches, horloge, ventilateurs
      muraux, végétation hors du hangar et plus douce ;
    - kick-boxing : tatamis et bande rouge, rack de protections (gants, casques, protège-tibias, pattes d'ours),
      paos et boucliers, sacs autoportants, cible de pied sur support, élastiques, échelle d'agilité et plots,
      chrono à intervalles (vert), affiches ;
    - JJB : tatamis gris et bord noir, mannequins de soumission, kimonos et rashguards pliés sur étagères, kimonos
      suspendus, rouleaux de massage, ballons de mobilité, médecine-balls, banc et casiers à chaussures, tableau
      technique, affiches, drapeau du Brésil, chrono, horloge ;
    - judo : judogis sur portant, tableau des ceintures de tous les grades, mannequins de projection (debout,
      au sol), élastiques d'uchikomi sur les poteaux, tatamis empilés, tableau technique sur chevalet, bancs et
      râtelier à sandales, ensō dans le tokonoma, calligraphies « 柔道 » et « 精力善用 », deux portraits sépia de
      maîtres (personne en particulier) ;
  - relief sans déchirure : dans l'image des distances, chaque côté du ring est une surface pleine (comme le grillage
    de la cage en 1.26) et tout ce qui est fin (câbles, cordes, élastiques) est laissé de côté ;
  - `src/three/rooms/life.ts` : lampes du ring et de la cage déplacées avec eux ;
  - `scripts/salles/salles.py` `VIEWS=1` : photos de contrôle de chaque salle sous 6 angles.
- **Fichiers** : `tools/generator/rocketbox/outfits.py`, `public/coaches/*/tenues/mma.glb`,
  `scripts/salles/equipement.py`, `scripts/salles/salles.py`, `public/salles/*/`, `src/three/rooms/` (RoomScene.tsx,
  life.ts, RoomDust.tsx supprimé, `__tests__/life.test.ts`, `__tests__/depth.test.ts`),
  `src/three/__tests__/protege-tibias-v1270.test.ts`, `scripts/dev/shot-finitions.mjs`, `src/boot/assetSizes.json`,
  `src/domain/releases.ts`, `package.json`.
- **Tests** : voir le rapport de la PR.

## 2026-11-10 · v1.28.0 · Combinaisons des programmes fédéraux

- **Demande** : Youssef, 6 novembre 2026 : « enrichir le catalogue, tous niveaux, toutes disciplines, que des
  combinaisons d'entraînement vérifiées et validées par les fédérations ou des entraîneurs », puis « tu peux les
  rajouter, bien les classer et bien préciser », « je ne veux pas quelque chose de brouillon ». Décision : les
  1 496 fiches inspirées restent, les fiches validées passent en tête.
- **Constat après vérification** : les 1 496 fiches de la bibliothèque (catalogue 1.1.0) étaient toutes « inspirées »,
  aucune ne reposait sur une source vérifiable. Parmi les documents officiels lus, seuls ceux de la FFBoxe (gants
  blanc à rouge) et de la FFKMDA pour le muay-thaï (prajeets jaune à vert) écrivent des enchaînements précis ; le
  kick-boxing et le judo ne donnent que des règles, le BJJ et le MMA n'ont pas de programme public lisible.
- **Correction** :
  - nouveau statut « Programme fédéral » : la fiche porte l'organisme, le document, le lien, la page, l'exercice,
    l'enchaînement tel qu'il est écrit, ce qui change quand on le travaille seul et la date de lecture ; une fiche
    sans l'un de ces champs est refusée ;
  - 30 fiches : 23 en boxe anglaise (FFBoxe) et 7 en muay-thaï (FFKMDA), dans un fichier séparé
    `public/catalog/programmes-v1.json` produit par `scripts/build-programmes.mjs` ; le catalogue des fiches inspirées
    n'est pas modifié ;
  - Légendes : carte « Programmes des fédérations » (par fédération et discipline, grades dans l'ordre), fiches
    validées en tête de toutes les listes, bouton « Validées », encart « d'où vient cette combinaison » sur la fiche ;
  - Coach IA : le statut est expliqué (Légendes › statuts) et cité quand il propose une fiche de programme ;
  - registre complet des sources et des enchaînements écartés (geste absent du moteur, côté non précisé,
    partenaire nécessaire) : `docs/catalogue-valide/SOURCES.md`.
- **Fichiers** : `src/domain/catalog/{types,validate,loader,search}.ts`, `src/ui/screens/Champions.tsx`,
  `src/ui/styles.css`, `src/coach/{engine,appGuide}.ts`, `scripts/build-programmes.mjs`,
  `public/catalog/programmes-v1.json`, `docs/catalogue-valide/SOURCES.md`, `docs/CATALOGUE.md`.
- **Tests** :
  - `src/domain/__tests__/programmes.test.ts` (12 tests : référence complète, séquence identique à la citation quand
    le document écrit les bras, jouable en 3D dans les deux gardes, aucun doublon, niveaux par grade, fiches
    inspirées inchangées, validées en tête, filtre, recherche) : TEST RÉUSSI ;
  - suite Vitest complète : TEST RÉUSSI ;
  - `tests/e2e/catalogue-valide.spec.ts` (carte, liste, filtre, fiche, accessibilité axe, fiche inspirée inchangée) :
    TEST RÉUSSI ;
  - suite Playwright complète (sur la base 1.26.0) : 291 réussis, 2 échoués déjà connus et sans lien avec ce lot
    (`navigation.spec.ts:178` périmé, attend 1.9.0 ; `coaching-hud.spec.ts:60` instable sous charge) : voir la PR #64.
- **Limites** : les illustrations des PDF n'ont pas pu être lues ; l'uppercut au buste, la parade du bras avant et le
  swing manquent au moteur (enchaînements correspondants écartés, listés) ; aucune vidéo n'a servi de source.
- **Restauration** : `restauration/avant-catalogue-valide`

## 2026-11-11 · v1.29.0 · Nouvelle ergonomie, lot 1 : barre flottante à 4 places, Entraîner en tuiles

- **Demande** : Youssef, 2026-11-11 : revoir l'ergonomie de l'appli à la manière des applis de VTC (barre flottante,
  grande barre d'action, tuiles). Maquette « Ergonomie nouvelle barre » validée le jour même (« Oui pour tout »), puis
  « Commence par l'ergonomie ». Rien n'est copié des captures de référence : ni image, ni couleur, ni logo.
- **Constat** : l'accueil demandait de lire avant d'agir, Entraîner était une longue page à faire défiler derrière
  trois onglets, et la barre du bas avait cinq places dont une (Apprendre) faisait doublon avec Entraîner.
- **Correction** :
  - barre du bas flottante, en forme de pastille, à quatre places : Accueil, Entraîner, Progrès, Compte (le profil,
    avec la photo ou les initiales) ; elle a exactement la hauteur de l'ancienne (66 px), donc les écrans qui
    remplissent la hauteur gardent leurs mesures ;
  - la loupe « Rechercher ou demander au coach » est en haut à droite de chaque écran, à la place de la photo ; sur
    le chrono, elle est dans la rangée d'actions ; en séance elle reste dans « Plus » ;
  - Entraîner s'ouvre sur un seul écran de tuiles, sans défilement : les six disciplines (la principale et la
    suivante en grand, avec le visuel officiel), « Apprends » (Techniques, Légendes, Encyclopédie) et « Tes outils »
    (Créateur, Programmes, Chrono, Favoris) ;
  - aucune perte : « Mes séances » ouvre l'ancienne première page (reprise, démarrage rapide, mes enchaînements,
    espaces Séances / Disciplines / Chrono inchangés) ; la place Entraîner ramène aux tuiles ;
  - Techniques, Légendes et Encyclopédie gardent leurs onglets et allument la place Entraîner ;
  - réponses du Coach IA sur la navigation et note des Nouveautés mises à jour.
- **Écart avec la maquette, signalé** : les anciens espaces Séances et Disciplines sont conservés derrière « Mes
  séances » au lieu de disparaître, pour ne rien perdre tant que l'accueil (lot 2) ne porte pas la reprise et le
  démarrage rapide.
- **Fichiers** : `src/ui/nav/{config.ts,BottomBar.tsx,SectionTabs.tsx,nav.css}`, `src/ui/screens/{Train.tsx,train.css}`,
  `src/ui/chrono/ChronoScreen.tsx`, `src/coach/appGuide.ts`, `src/domain/releases.ts`, `package.json`.
- **Tests** :
  - suite Vitest complète (1160 tests) : TEST RÉUSSI ;
  - `src/ui/nav/__tests__/refonte.test.ts` : quatre places, Apprendre allume Entraîner, chaque onglet d'Entraîner et
    d'Apprendre a sa tuile : TEST RÉUSSI ;
  - suite Playwright complète (296 tests, jouée en deux moitiés après un redémarrage de la machine, puis les tests
    touchés rejoués) : 294 TEST RÉUSSI ; 2 ÉCHOUÉ sans lien avec ce lot : `coaching-hud.spec.ts:60` (instable sous
    charge, déjà connu) et `training-layout.spec.ts:117` (dépasse le temps imparti sur cette machine : il échoue de
    la même façon sur la 1.28.0 reconstruite à l'identique, vérifié le même jour) ;
  - tests adaptés à la nouvelle barre, sans retirer de contrôle : `navigation`, `nav-contextuelle`, `app`,
    `aucune-perte-v100`, `accueil-recherche`, `chrono-seul`, `corrections-v110`, `consignes-v130`, `profil-v120`,
    `coach-bubble`, `encyclopedie`, `entrainer-techniques`, `train-resume` ; le test des Nouveautés, périmé depuis la
    1.10 (il attendait « 1.9.0 » en tête), suit maintenant la dernière version ;
  - contraste WCAG AA (axe-core et pixels rendus) sur le nouvel écran Entraîner, nuit et jour : TEST RÉUSSI ;
  - appareil Android réel : NON EXÉCUTÉ.
- **Captures** : `docs/v1290/captures/` (nuit et jour).
- **Restauration** : `feature/combat-shadow-v030` avant fusion (1.28.0, commit 21a3fed).
- **Suite** : lot 2 Accueil, lot 3 Compte, puis correction du Retour en plein écran et en séance (constat fait, mise
  de côté à la demande de Youssef).

## 2026-11-11 · v1.30.0 · Nouvelle ergonomie, lot 2 : nouvel accueil

- **Demande** (Youssef, 2026-11-11) : poursuite de la nouvelle ergonomie après validation et publication de la
  1.29.0 (« Je valide »). Maquette validée le même jour (« Oui pour tout »). Rien n'est copié des captures de
  référence : seuls les principes d'organisation sont repris, dans le thème de l'appli.
- **Ce qui change** (un seul écran, sans défilement, de 360×640 aux grands téléphones) :
  - les six disciplines en onglets tout en haut : un toucher change la discipline (l'ancienne feuille « Choisir la
    discipline » disparaît, les onglets la remplacent) ;
  - la grande barre « Que veux-tu travailler ? » ouvre la recherche (« Rechercher ou demander au coach ») ; « Chrono »
    est à côté. La loupe en haut à droite n'est donc plus répétée sur l'accueil ;
  - deux raccourcis : « Reprendre ta séance » (dernière séance ; avant la première : « Ta discipline ») et
    « Technique du jour » ;
  - le coach dans sa carte, avec « Changer de coach » et le bouton « Commencer » (ouvre l'exercice recommandé,
    l'ancienne tuile « Séance rapide ») ; la barre du bas ne garde que ses quatre places ;
  - « Pour toi », en pastilles rondes : objectif de la semaine (anneau rempli avec les vrais chiffres, rien si aucun
    objectif), programme recommandé, autre idée de séance, « À revoir » (seulement s'il y a des techniques à revoir),
    Créer, Coach IA ;
  - réponses du Coach IA sur l'accueil et note des Nouveautés mises à jour.
- **Écarts avec la maquette, signalés** : les six disciplines sont en onglets, toutes visibles (la maquette en
  montrait trois) ;
  la pastille « Séance rapide » n'est pas répétée puisque « Commencer » fait la même chose ; « Changer de coach »
  est en haut à droite de la carte pour ne pas toucher « Commencer » sur les petits écrans.
- **Fichiers** : `src/ui/screens/Home.tsx`, `src/ui/styles.css`, `src/ui/nav/{config.ts,BottomBar.tsx}`,
  `src/coach/appGuide.ts`, `src/domain/releases.ts`, `package.json`.
- **Tests** :
  - suite Vitest complète (1160 tests) : TEST RÉUSSI ;
  - tests adaptés au nouvel accueil, sans retirer de contrôle sauf celui de la feuille supprimée (le Retour qui la
    fermait) : `accueil-recherche` (onglets, raccourcis, pastilles, « Commencer », anneau de l'objectif, contraste et
    tenue en 360×640 nuit et jour), `navigation`, `aucune-perte-v100`, `consignes-v130`, `nav-helpers`, et côté
    Vitest `refonte.test`, `nav.test`, `icons.test`, `appGuide.test` ;
  - suite Playwright complète (296 tests) : 286 TEST RÉUSSI, 2 ignorés (Firebase), 8 ÉCHOUÉ au premier passage ;
    - 4 liés à ce lot, corrigés puis rejoués sur la version finale, TEST RÉUSSI : contraste nuit et jour (un onglet
      de discipline coupé au bord de l'écran : les six onglets tiennent maintenant dans la largeur, sans défilement,
      seul celui de la discipline choisie montre son icône) ; `coach-bubble:127` et `coach-panel-size:55` (le test
      touchait la recherche pendant le chargement de l'écran suivant, aide de test corrigée) ;
    - `coach-suggest.spec.ts:245` : ÉCHOUÉ sous charge, TEST RÉUSSI rejoué seul ;
    - 3 sans lien avec ce lot, ÉCHOUÉ : `consignes-v130.spec.ts:27` (échoue de la même façon sur la 1.29.0
      reconstruite à l'identique, vérifié le même jour), `coaching-hud.spec.ts:60` (instable sous charge, déjà
      connu), `training-layout.spec.ts:117` (dépasse le temps imparti sur cette machine, déjà connu) ;
  - appareil Android réel : NON EXÉCUTÉ.
- **Captures** : `docs/v1300/captures/` (nuit et jour, 360×640 et 393×851, avant et après une première séance).
- **Restauration** : `feature/combat-shadow-v030` avant fusion (1.29.0, commit c663c88).
- **Suite** : lot 3 Compte, puis correction du Retour en plein écran et en séance.

## 2026-11-11 · v1.31.0 · Nouvelle ergonomie, lot 3 : page Compte

- **Demande** (Youssef, 2026-11-11) : suite de la nouvelle ergonomie après validation et publication de la 1.30.0
  (« Je valide »). Maquette validée le même jour.
- **Ce qui change** :
  - en haut de Compte : le nom en grand, la photo à droite (toujours modifiable d'un toucher), la discipline
    principale et le niveau réel dessous, puis l'état du compte ;
  - quatre accès rapides : « Mon coach » (Réglages, ligne Mon coach ouverte), « Réglages », « Coach IA »,
    « Nouveautés » (avec la pastille tant que la version n'est pas vue) ;
  - deux cartes : « Premium à vie » et « Objectif de la semaine » (anneau et chiffres réels, ou « Aucun objectif
    fixé ») ;
  - tout le profil reste dessous, dans la même liste (rien de supprimé) ;
  - les onglets « Mes infos / Réglages » ne sont plus en haut de Compte (les tuiles les remplacent) ; ils restent
    sur Réglages, où « Mes infos » ramène à Compte.
- **Écart avec la maquette, signalé** : pas de carte « Compte » séparée, l'état du compte est sous le nom et la ligne
  « Compte » reste dans la liste (une carte de plus aurait fait doublon).
- **Fichiers** : `src/ui/screens/account/{Profile.tsx,account.css}`, `src/ui/nav/{config.ts,SectionTabs.tsx,
  BottomBar.tsx}`, `src/coach/appGuide.ts`, `src/domain/releases.ts`, `package.json`.
- **Tests** : unitaires 1160 RÉUSSI ; écran (Playwright) 293 RÉUSSI sur 296, 3 ÉCHOUÉ déjà en échec avant ce lot et
  sans lien (`coaching-hud:60`, `consignes-v130:27`, `training-layout:117`) ; suite passée en deux parties après une
  coupure de la machine (162 puis 134). Tests adaptés sans retirer de contrôle : `navigation`, `profil-v120`,
  `account`, `premium`, `app`, `profile-photo`, `aucune-perte-v100`.
- **Captures** : `docs/v1310/captures/`.
- **Restauration** : `feature/combat-shadow-v030` avant fusion (1.30.0, commit b3dc797).

## 2026-11-11 · v1.32.0 · Choix du coach « La vedette »

- **Demande** (Youssef, 2026-11-11) : « Franchement je n'aime pas trop le choix des coachs », « La présentation genre
  jeux vidéo ». Trois maquettes proposées, choix « A » (La vedette), puis « je veux faire bouger en une icône, pas
  texte, pour que ça prenne moins de place ».
- **Constat après vérification** : l'écran montrait six petites vignettes, une fiche avec un portrait fixe et des
  barres « profil de style sur 10 » qui étaient des estimations, pas des mesures ; un toucher sur une vignette
  changeait tout de suite de coach, sans confirmation.
- **Méthode de correction** : un écran de sélection à nous (aucun jeu copié), avec le moteur 3D déjà utilisé partout.
- **Ce qui change** :
  - le coach regardé est en grand et en 3D, sous un halo rouge et or, dans la tenue de la discipline principale ; on
    le fait tourner du doigt ;
  - flèches, bande des six vignettes (tête et épaules) ou balayage de la fiche pour passer d'un coach à l'autre, sans
    recréer la scène 3D (un seul contexte graphique, important sur téléphone) ;
  - une icône ronde de lecture, sans texte, joue les trois premières techniques de la discipline (jab, direct, jab au
    corps en boxe) ; la même icône, en pause, ramène en garde ;
  - sa fiche : surnom, nom, style, points forts, taille mesurée sur le modèle 3D, poids seulement s'il est mesuré ;
  - rien n'est enregistré avant « Choisir X » ; le coach actuel porte « Ton coach » et le bouton dit « Garder X » ;
  - en rendu « Précédent » (sans 3D premium), le portrait remplace la scène et l'icône de lecture n'est pas montrée ;
  - le choix compact (premier lancement, Réglages › Mon coach) : les barres « sur 10 » estimées sont remplacées par
    la garde et les points forts ; Réglages gagne « Voir les coachs en grand » ; « Mon coach » de Compte ouvre
    le nouvel écran.
- **Fichiers** : `src/ui/screens/CoachSelect.tsx`, `src/three/CoachStage.tsx` (propriété `champion`),
  `src/ui/styles.css`, `src/ui/screens/Settings.tsx`, `src/ui/screens/account/Profile.tsx`, `src/coach/appGuide.ts`,
  `src/domain/releases.ts`, `package.json`.
- **Tests** : unitaires 1160 RÉUSSI ; écran (Playwright) 288 RÉUSSI, 2 NON EXÉCUTÉ (Firebase), 6 ÉCHOUÉ dans la suite
  complète : 4 déjà en échec avant ce lot (`coaching-hud:60`, `consignes-v130:27`, `training-layout:117`,
  `coach-suggest:245`) et 2 dus à la charge de la machine (`chrono-seul:96`, `coach-suggest:99`) ; ces deux-là et
  `coach-suggest:245` repassés seuls : RÉUSSI. `coachs-v160` adapté sans retirer de contrôle.
- **Anomalie trouvée par les tests et corrigée** : écran ouvert directement (lien, rechargement), « Choisir » faisait
  un retour hors de l'application avant l'enregistrement du choix ; il revient maintenant à l'accueil.
- **Captures** : `docs/v1320/captures/`.
- **Restauration** : état 1.31.0 (commit 94dc75d).

## 2026-11-11 · 1.33.0 · Visages plus expressifs et cou droit en garde (Kadir et tous les coachs)

- **Demande** (Youssef, 11/11 13:06) : « le visage de Kadir n'est pas du tout expressif, je pensais que les
  expressions de visage ont été appliquées à tous les coachs. Pour moi son cou ne fait pas naturel ». Constat et
  options présentés avec captures (https://claude.ai/artifact/3wz3D45rnh4NntjCQEyekW), option « V1 + cou B » choisie
  le même jour à 16:23.
- **Constat après vérification** :
  - les expressions existent bien chez Kadir : son modèle porte les 25 expressions (sourcils, paupières, joues, nez,
    bouche, mâchoire) avec la même amplitude que Naël ; Amara et Inaya aussi ; Axel et Kaila les ont par les os du
    visage ;
  - elles ne se voyaient pas : au repos le visage n'utilisait que 15 à 30 % de chaque expression, l'effort ne durait
    qu'environ un tiers de seconde par coup, et la barbe et la moustache de Kadir cachent sa bouche (le sourire
    d'origine ne déplace le coin des lèvres que de 4 mm à 100 %) ;
  - le cou : en garde le buste penche vers l'avant (26° en MMA), le cou suivait le buste à 55 % puis la tête se
    redressait pour regarder l'adversaire : le cou partait en avant et la tête dépassait devant les épaules (très
    visible de profil). Les trapèzes de Kadir ont aussi été épaissis d'environ 2 cm à la nuque en octobre (non
    modifié dans ce lot, option C non retenue) ;
  - le rendu Anime n'existe plus depuis la 1.9.0 : captures en Ultra-réaliste seulement.
- **Correction** :
  - visage : repos environ 2,5 fois plus marqué (regard concentré, sourcils, lèvres pincées ou léger sourire), effort
    de la frappe 2 fois plus marqué (sourcils froncés et yeux plissés à fond), souffle visible à l'impact (lèvres
    arrondies, mâchoire entrouverte, au plus à mi-course), chaque poids plafonné à 1 ; même renfort, un peu plus
    doux, pour les visages par os d'Axel et Kaila ;
  - cou : quand le buste est assez droit, le cou perd 80 % de son inclinaison (sa rotation vers l'adversaire est
    gardée) et le menton se rentre de 4,6° ; penché ou au sol (au-delà de 37° à 53° d'inclinaison du buste) le cou
    suit le tronc comme avant. Les clavicules des modèles Rocketbox sont accrochées à l'os du cou : elles gardent la
    place que l'ancien cou leur donnait, donc épaules, bras, mains et garde ne bougent pas (vérifié à moins de 2 mm) ;
  - Lab : `?cou=ancien` montre l'ancien cou pour les captures avant/après.
- **Fichiers** : `src/three/face.ts`, `src/engine/rig.ts`, `src/ui/Lab.tsx`, `src/domain/releases.ts`,
  `package.json`, tests `src/engine/__tests__/neck-v133.test.ts` (nouveau),
  `src/three/__tests__/expressions-v1160.test.ts` ; documents de mesures régénérés (`docs/audit-biomecanique/
  MESURES_{MOTEUR,FLUIDITE,TORSIONS}.md`, `docs/v1100/MESURES_DEFORMATIONS.md`), pictogrammes
  (`src/ui/pictos/techniquePictos.json`, la tête bouge de quelques millimètres).
- **Tests** :
  - nouveau `neck-v133.test.ts` (25 tests : 6 coachs × 4 gardes, cou plus droit, tête moins en avant, bras et mains
    inchangés à moins de 2 mm ; au sol le cou suit le tronc) : TEST RÉUSSI ;
  - `expressions-v1160.test.ts` : deux contrôles modifiés pour suivre le choix de Youssef (avant : aucun poids au
    repos au-dessus de 0,4 et aucun au-dessus de 0,9 à la frappe, ce qui rendait le visage invisible ; après : le
    repos se voit, la frappe fronce à fond, la bouche reste sans grimace, mâchoire à mi-course au plus, tout ≤ 1) :
    TEST RÉUSSI ;
  - mesures du moteur : rotation totale du cou inchangée (73°, limite 80°) ; torsion propre de l'os du cou 35°
    (30° avant) et de la tête 41° (35° avant), réparties sur deux os ; déformations de la peau aux articulations
    sans dégradation (6 coachs) : TEST RÉUSSI ;
  - suite Vitest complète (1186 tests) : 1185 TEST RÉUSSI, 1 ignoré ;
  - suite Playwright complète (296 tests) sur la branche avant remise sur la 1.32.0 : 293 TEST RÉUSSI, 2 ignorés
    (Firebase), 1 ÉCHOUÉ : `coaching-hud.spec.ts:60` (le bandeau n'a pas le temps de montrer la deuxième répétition
    sur cette machine) ; il échoue de la même façon sur la 1.32.0 seule, reconstruite et rejouée le même jour : sans
    lien avec ce lot ;
  - après remise sur la 1.32.0 (parue entre-temps) : Vitest complet rejoué, 1185 TEST RÉUSSI, 1 ignoré ; Playwright
    ciblé (`coach-render`, `coach-3d-recovery`, `coachs-v160`, `ecran-coach-v140`, `coaching-hud`, `navigation`,
    `boot`, `coach-studio`, `outfit-loading`, `moteur-lumiere` : 68 tests) : 66 TEST RÉUSSI, 2 ÉCHOUÉ :
    `coaching-hud:60` (ci-dessus) et `coachs-v160:98` (ÉCHOUÉ sous charge, TEST RÉUSSI rejoué seul) ; suite
    Playwright complète sur la version remise à jour : NON EXÉCUTÉ ;
  - appareil Android réel : NON EXÉCUTÉ.
- **Captures** : `docs/v1330/captures/` (cou de trois quarts et de profil avant/après, visage avant/après au repos et
  à la frappe, Axel à la frappe, Amara en garde de boxe avant/après).
- **Restauration** : `restauration/avant-v133` (1.30.0, commit b3dc797) ; la 1.32.0 est le commit f9d9bf3 de `feature/combat-shadow-v030`.

## 2026-11-11 · v1.34.0 · Démarrage rapide (tout reste chargé au démarrage)

- **Demande** (Youssef, 11/11 16:37, captures du chrono « ROUND 1 » à 57 % puis 91 % en v1.30.0) : « Pourquoi le
  démarrage est devenu si lent ? », puis (18:39) « que toute la 3D des coachs et des salles soit chargée au démarrage
  pour que ça ne mette pas de temps à s'afficher lorsqu'on change de coach ».
- **Constat après vérification** (mesures sur la 1.31.0 construite, navigateur Chromium sans écran) :
  - depuis la 1.25.0, l'écran de démarrage télécharge 96,5 Mo avant l'accueil (6 coachs × modèle + 7 tenues, 6 salles) ;
    la 1.24.0 ouvrait l'accueil tout de suite (environ 6 Mo en arrière-plan) ;
  - un fichier gardé sur le téléphone était reconnu par la taille annoncée par le serveur (`Content-Length`). Un serveur
    qui compresse à la volée n'annonce pas cette taille : l'appli jetait les 54 modèles et retéléchargeait 90 Mo à
    **chaque** ouverture, chrono compris (reproduit avec un serveur local qui compresse ; sans compression : 0 Mo,
    0,3 s). Les fichiers des coachs et des salles n'ont pas changé entre la 1.28 et la 1.30, ce qui va dans le même
    sens que les captures. Ce que fait GitHub Pages n'a pas pu être vérifié d'ici (site bloqué par le réseau de
    l'environnement) ;
  - les modèles sont à 90 % de la géométrie (9 Mo d'images sur 98,6 Mo) ;
  - changement de coach : environ 1 s de lecture et de décodage du modèle à chaque nouveau coach, puis l'envoi à la
    carte graphique.
- **Méthode de correction** (option « tout charger, mais plus léger », choisie par Youssef) :
  - chaque fichier du démarrage est reconnu par une empreinte de son contenu, notée quand il a été reçu en entier
    (`css-modeles-versions`) ; un fichier gardé par une version plus ancienne garde l'ancienne règle de taille une
    fois, puis son empreinte est notée ; le téléchargement demande au serveur si le fichier a changé (`no-cache`) ;
  - les modèles des coachs sont compressés au moment du build (EXT_meshopt_compression, **sans quantification ni
    réordonnancement** : chaque point, normale, poids, couleur, image et matière reste identique ; seul le premier coin
    de certains triangles change, même triangle, même sens). Les fichiers de `public/` ne changent pas, pour les tests
    et les générateurs ;
  - les tenues lues sont gardées en mémoire (14 au plus) ; sur l'écran Coach, une fois le premier coach affiché, les
    5 autres et leur tenue de la discipline sont lus à l'avance, voisins d'abord, un toutes les 250 ms.
- **Résultats mesurés** (serveur local) : premier lancement 96,5 → 66,5 Mo (52,4 Mo transférés si le serveur
  compresse) ; ouvertures suivantes avec un serveur qui compresse : 90 Mo → 0 Mo, chrono → pas de chrono, 0,2 à 0,3 s
  jusqu'à l'accueil. Le changement de coach n'a pas pu être chiffré de façon fiable ici : sans carte graphique, le
  navigateur de test tourne à 5 images/s ; la lecture du modèle (environ 1 s par coach) est maintenant faite à l'avance.
- **Fichiers** : `tools/build/bootModels.ts` (nouveau), `vite.config.ts`, `src/boot/preload.ts`,
  `src/boot/BootScreen.tsx`, `src/boot/bootAssets.d.ts`, `src/three/outfit.ts`, `src/three/CoachModel.tsx`,
  `src/ui/screens/CoachSelect.tsx`, `src/domain/releases.ts`, `package.json` (gltf-transform, meshoptimizer en outils
  de build).
- **Tests** : `src/boot/__tests__/demarrage-v134.test.ts` (6 : coach gardé reconnu sans taille annoncée, mise à jour
  retéléchargée, fichiers des anciennes versions, empreinte seulement pour un fichier complet, empreintes du plan,
  compression sans perte sur 4 modèles) : TEST RÉUSSI. Unitaires 1166 RÉUSSI. Écran (Playwright, avec les modèles
  compressés) : 290 RÉUSSI, 2 NON EXÉCUTÉ (Firebase), 4 ÉCHOUÉ dans la suite complète : 3 déjà en échec avant ce lot
  (`coach-suggest:245`, `coaching-hud:60`, `training-layout:117`) et `corrections-v110:53` dû à la charge de la
  machine, repassé seul : RÉUSSI. `boot.spec` (4) : RÉUSSI.
- **Contrôle visuel** : écran Coach construit avec les modèles compressés, Amara puis Kaila habillées, aucune erreur
  de tenue (`docs/v1340/captures/`).
- **Remise sur la 1.33.2** (Youssef, 12/11 00:55 : « il faut repartir des dernières versions 1.33 ») : lot reposé sur
  la 1.33.2 (commit cc58c17, branche `claude/project-thread-o7lrt8`). Unitaires : 1294 RÉUSSI, 25 ÉCHOUÉ, les mêmes
  25 que sur la 1.33.2 seule (moteur : documents de mesures, fluidité, crochets, torsions ; respiration) : NON
  APPLICABLE à ce lot. Écran ciblé (démarrage, salles, coachs, tenues, rendu, navigation) : 44 RÉUSSI. Mesures
  identiques : 1er lancement 66,5 Mo ; ouvertures suivantes 0 Mo, 0,2 à 0,3 s, avec ou sans compression du serveur.
- **Restauration** : branche `restauration/avant-demarrage-v134` (état 1.32.0, commit f9d9bf3) ; état 1.33.2 : commit
  cc58c17.

## 2026-11-12 · 1.33.1 à 1.33.2 · Lots de Youssef faits hors de ce suivi (reprise de traçabilité)

- **Contenu** (PR #73 à #77 sur `claude/project-thread-o7lrt8`, faits par Youssef avec un autre assistant) :
  respiration plus visible et irrégulière (#73), clignements toutes les 3 à 6 s et tête plus vivante au repos (#74),
  bouche plus naturelle avec un léger joint des lèvres et moins de dents visibles (#75), crochets et uppercuts menés
  par le bassin (1.33.1, #76), anticipation et recul des coups de poing (1.33.2, #77).
- **Constat à la reprise** (suite Vitest complète rejouée sur la 1.33.2 seule, commit cc58c17) : 25 tests ÉCHOUÉ,
  1288 TEST RÉUSSI, 1 ignoré. Les lots de visage et de respiration n'avaient pas mis à jour les anciens contrôles
  (`expressions-v1160` : 5, `face.test` 1.21 : 6, `breath.test` : 6) ; les lots de frappe font échouer des contrôles
  du moteur : `fluidity.test` (plus d'arrêts qu'avant, vitesse à l'impact non conservée à 3 %), `hooks-biomeca`
  (« pas d'armé »), `extension-v032` (uppercut arrière : jambes, hanches, épaules, puis poing) et les documents de
  mesures non régénérés (`audit`, `fluidity`, `hooks-biomeca`, `torsion-range`).
- **Suite** : les contrôles du visage et de la respiration sont mis à jour dans la 1.35.0 (ci-dessous) pour suivre
  ces choix ; les contrôles du moteur de frappe restent ÉCHOUÉ et sont signalés à Youssef (ils relèvent des lots
  1.33.1 et 1.33.2, à reprendre à part).

## 2026-11-12 · 1.35.0 · Humanisation des coachs : moteur commun de comportement et règles permanentes

- **Demande** (Youssef, 11/11) : auditer et corriger bouche, regard, expressions et comportement de tous les coachs,
  créer un moteur commun « Human Behavior & Facial Expression Engine », inscrire les règles pour tous les futurs
  personnages dans le dépôt (CLAUDE.md, document dédié, tests). Repris de la 1.33.2 (commit cc58c17), dernière
  version poussée par Youssef. Numéro 1.35.0 : la 1.34.0 est déjà prise par deux branches en attente.
- **Coachs audités** (dépôt réel) : Kadir, Amara, Naël, Inaya (Rocketbox : 28 os du visage et 25 expressions ARKit
  en morph targets) ; Axel, Kaila (MakeHuman : 11 os du visage, aucune expression) ; modèles générés de secours
  `model.glb` (aucun os du visage).
- **Constat après vérification** :
  - regard : en garde la tête est inclinée vers le bas (menton rentré et buste penché) et les yeux, fixes dans la
    tête, regardaient 10 à 20° sous l'horizon, vers le sol (mesuré sur les 6 squelettes, 4 gardes) ;
  - Axel et Kaila : quand l'œil monte, l'iris passait sous la paupière (la paupière ne suivait pas l'œil) ;
  - grimace d'effort fantôme : le passage de la pose de départ à la garde, à la première image, était mesuré comme
    une frappe (jusqu'à 0,8 d'effort : sourcils froncés, yeux plissés pendant près d'une seconde) ; une rafale
    d'images très rapprochées faisait de même ;
  - bouche : sans le léger joint des lèvres ajouté en 1.33.x (#75), la bouche des modèles Rocketbox reste
    entrouverte et montre les dents (vérifié sur captures, Kadir et Naël) : ce joint est gardé et protégé par un test ;
    pas de teinte grise ou bleutée des lèvres constatée dans l'éclairage de l'app ;
  - comportement : pas d'états (préparation, fatigue, récupération, encouragement) ; le visage ne savait pas si la
    séance jouait, était en pause ou au repos.
- **Correction** :
  - moteur commun `src/three/human/` : `behavior.ts` (8 états : neutre, concentration, préparation, effort, frappe
    puissante, fatigue, récupération, encouragement ; humeur du visage atteinte en douceur, fatigue qui monte avec
    les frappes et redescend au repos, encouragement de 1,8 s après chaque répétition), `capabilities.ts` (niveau du
    modèle lu dans ses os et ses morphs), `profiles.ts` (registre des 6 coachs, traits individuels, liste figée des
    anciens modèles autorisés en mode dégradé : Axel, Kaila) ;
  - `FaceAnimator` (`src/three/face.ts`) utilise ce moteur : regard posé sur l'adversaire (devant le coach, à hauteur
    de ses yeux) quelle que soit l'inclinaison de la tête, au plus 30° de côté et 23° en hauteur, au-delà (sol,
    rotation) les yeux suivent la tête ; la paupière supérieure suit l'œil ; clignements irréguliers (parfois doubles,
    souvent avec un coup d'œil, plus fréquents fatigué) ; coups d'œil jamais vers le sol ni en préparation/frappe ;
    petit hochement de tête à l'encouragement ; bouche qui s'entrouvre à l'expiration seulement quand le coach est
    essoufflé ; effort mesuré dans l'espace du coach, pas pendant les 0,3 premières secondes, temps entre images
    borné à 1/120 s, sauts de pose au-delà de 25 m/s ignorés ; image fixe : regard droit immédiat ;
  - `CoachStage` transmet lecture, pause, repos, phase de la technique et répétitions terminées ; `ComboPlayer`
    expose `isResting` ; `PhotoCoach` crée le moteur avec le profil de chaque coach ; Lab : `?etat=<état>` ;
  - règles permanentes : `CLAUDE.md` (nouveau) et `docs/HUMAN_CHARACTER_STANDARDS.md` (contrat des modèles,
    capacités obligatoires, comportements, intégration, critères bloquants, performance, non-régression, limites).
  - Rien n'est changé aux visages, coiffures, barbes, morphologies, tenues ni aux techniques (le moteur humain ne
    touche ni aux membres, ni au bassin, ni au buste).
- **Fichiers** : `src/three/human/{behavior,capabilities,profiles}.ts` (nouveaux), `src/three/face.ts`,
  `src/three/PhotoCoach.tsx`, `src/three/CoachModel.tsx`, `src/three/CoachStage.tsx`, `src/engine/player.ts`,
  `src/ui/Lab.tsx`, `src/domain/releases.ts`, `package.json`, `CLAUDE.md`, `docs/HUMAN_CHARACTER_STANDARDS.md`.
- **Tests** :
  - nouveaux `src/three/human/__tests__/` : `contract.test.ts` (12 : registre, capacités de chaque modèle, liste des
    modèles dégradés figée), `gaze.test.ts` (24 : 6 coachs × 4 gardes, regard à moins de 2,5° de l'horizon, avant
    3 à 20° vers le bas), `behavior.test.ts` (9), `face-behavior.test.ts` (42 : bouche au repos, retour au neutre
    après une frappe en moins de 1,5 s, clignements irréguliers, pas de grimace au démarrage, pause, moins de
    0,15 ms par image) : TEST RÉUSSI ;
  - contrôles anciens mis à jour pour suivre les choix 1.33.x de Youssef (aucun n'est supprimé) :
    `expressions-v1160` (le repos garde le joint des lèvres ≤ 0,22 ; sourire au repos retenu ; la mâchoire ne bouge
    plus au repos, contrôlé à 0), `breath.test` (amplitude ≤ 6 % au lieu de 5 % : 5,5 % depuis #73), `face.test` 1.21
    (sourcils et coins de la bouche mesurés dans le repère de la tête : la dérive de la tête, plus visible depuis #74,
    était comptée comme un mouvement du visage) : TEST RÉUSSI ;
  - suite Vitest complète (1401 tests) : 1392 TEST RÉUSSI, 1 ignoré, 8 ÉCHOUÉ (moteur de frappe 1.33.1/1.33.2,
    identiques sur la 1.33.2 seule, voir l'entrée précédente ; la 1.33.2 seule : 25 ÉCHOUÉ) ;
  - compilation `npm run build` : TEST RÉUSSI ;
  - Playwright ciblé (11 fichiers : coach-render, coach-3d-recovery, coachs-v160, ecran-coach-v140, coaching-hud,
    training-layout, train-resume, outfit-loading, moteur-lumiere, coach-studio, boot ; 58 tests) : 56 TEST RÉUSSI,
    2 ÉCHOUÉ (`coaching-hud:60`, déjà connu ; `training-layout:117`, délai de 120 s dépassé) qui échouent aussi sur
    la 1.33.2 seule rejouée le même jour ; suite Playwright complète : NON EXÉCUTÉ ;
  - appareil Android réel : NON EXÉCUTÉ (coût mesuré par test et aucune dépendance ajoutée).
- **Captures** : `docs/v1350/captures/` (6 coachs de face, trois quarts et profil, avant/après ; états de Naël et Kaila).
- **Restauration** : `restauration/avant-humanisation-v134` (1.33.2, commit cc58c17).

## 2026-11-12 · v1.36.0 · Kadir : barbe allégée autour de la bouche

- **Demande** : Youssef, 12/11 09:41 « Ok pour barbe de Kadir » (option V2 proposée le 11/11 avec la 1.33.0 :
  sa moustache et sa touffe sous la lèvre cachaient la bouche, donc les expressions). C'est la raison écrite exigée
  par la règle 7 de `CLAUDE.md` pour toucher à la barbe d'un coach.
- **Constat vérifié** : dans la texture du visage de Kadir (`m021_head_color`, 2048 px, dans
  `public/coaches/mma-kadir/photo.glb`), les poils sombres couvrent la lèvre supérieure (x 905–1145, y 740–790) et
  une touffe dense sous la lèvre inférieure (x 975–1065, y 872–920) ; au sourire et à l'expiration, la ligne des
  lèvres se perd dedans.
- **Correction** :
  - nouveau `tools/generator/rocketbox/beard_trim.py` : dans une zone en ellipse adoucie autour de la bouche, les
    pixels de poils (plus sombres que la peau autour, peu rouges) sont remplacés à 85 % par la peau voisine (moyenne
    des pixels non-poils, grain fin conservé) : il reste une ombre de barbe d'un jour ;
  - exclus : les lèvres et leur ligne de fermeture, les narines, la barbe du menton (sous y 945) et les joues ;
  - seule l'image change (géométrie, poids de peau et 25 expressions intacts) ; le fichier le note
    (`images[].extras.beardTrim = 0.85`) et le script refuse une seconde passe ;
  - `src/boot/assetSizes.json` régénéré (`photo.glb` de Kadir : 2 845 404 → 3 073 808 octets, JPEG qualité 92).
- **Fichiers** : `tools/generator/rocketbox/beard_trim.py` (nouveau), `public/coaches/mma-kadir/photo.glb`,
  `src/boot/assetSizes.json`, `src/domain/releases.ts`, `package.json`, `package-lock.json`.
- **Tests** :
  - suite Vitest complète (1407 tests) : 1398 TEST RÉUSSI, 1 ignoré, 8 ÉCHOUÉ (les mêmes 8 du moteur de frappe
    1.33.1/1.33.2 que sur la 1.35.0 seule) ; tests du moteur humain `src/three/human/__tests__/` : TEST RÉUSSI ;
  - compilation `npm run build` : TEST RÉUSSI ;
  - captures Lab avant/après (repos, sourire, expiration, trois quarts) : contrôle visuel fait ;
  - appareil Android réel : NON EXÉCUTÉ.
- **Captures** : `docs/v1360/captures/`.
- **Restauration** : `restauration/avant-barbe-kadir` (1.35.0, commit a09ac11) ; le modèle d'origine est aussi dans
  l'historique git.

## 2026-11-12 · v1.37.0 · Uniquement des coachs ultra-réalistes

- **Demande** : Youssef, 12/11, « ne garder que les coachs ultra-réalistes » (retirer les styles manga, encre et
  toon, le réglage de style, et ne garder qu'un seul pipeline de matériaux standard/physique) ; puis, dans le même
  fil : supprimer l'écran caché « Mon combattant » (choix « Le supprimer »), ranger tout ce qui est retiré dans
  `backup CS/` gardé sur GitHub, retirer Axel et Kaila (« Oui »), et sur l'écran de choix du coach : vignettes sur
  une seule ligne avec une largeur qui s'adapte au nombre de coachs (choix « A. Portrait seul, largeur partagée »),
  sans toucher au grand espace du coach, dont la rotation est limitée à gauche et à droite.
- **Constat vérifié** :
  - les styles dessinés (`src/three/manga.ts` : `TOON_FRAGMENT`, `INK_FRAGMENT`, coque inversée, `applyManga`,
    `toonMaterial`, `inkMaterial`, `outlineMaterial`) étaient du code mort depuis la 1.9 : seuls des tests les
    importaient ; le réglage `coachStyle` n'avait plus d'effet visible ;
  - il restait des coachs non réalistes à deux endroits : le rendu « Précédente (secours) » (réglage `coachRender`,
    modèle MakeHuman généré et personnalisé par `customize.ts`) et l'écran caché `/combattant` ;
  - Axel et Kaila étaient les deux seuls coachs MakeHuman (les quatre autres sont Microsoft Rocketbox, MIT) ;
  - les squelettes des modèles générés servent encore aux tests du moteur d'animation (équilibre, sol, fluidité) :
    les supprimer aurait affaibli ces tests ;
  - au démarrage, le plan de chargement comptait 94 fichiers pour 100,4 Mo.
- **Correction** :
  - `src/three/CoachModel.tsx` ne charge plus que le coach photo (`PhotoCoach`, matériaux `MeshStandard` /
    `MeshPhysical`) ; `GeneratedCoach`, ses matériaux et ses caches sont retirés ;
  - `StudioStage` garde un seul éclairage (celui du rendu réaliste) ; `CoachStage` ne lit plus de style ni de
    version de rendu ;
  - réglages : `coachStyle`, `coachRender` et `seeThroughGear` retirés ; migration v4 (`dropRetired`) qui les
    efface des anciennes sauvegardes sans toucher au reste (voix, coach, lumière…) ;
  - écrans : bloc « Version du rendu 3D » des Réglages, étape « Apparence » de l'accueil, puce « Protections
    transparentes » de l'analyse et route `/combattant` retirés (une adresse `/combattant` ramène à l'accueil) ;
  - Axel et Kaila retirés du catalogue, des looks, des postures, des peaux et des profils humains ; un profil qui
    les avait choisis revient sur Kadir ou Amara (`RETIRED_COACHES` dans `src/store/profile.ts`) ;
    `LEGACY_DEGRADED` est maintenant vide ;
  - choix du coach : vignettes portrait sur une ligne, largeur partagée (`flex: 1 1 0`, 120 px au plus), le grand
    espace du coach est inchangé ; sa rotation est verrouillée en hauteur (nouvelle option `turnOnly`), seul le
    glissement gauche/droite le fait tourner ;
  - Coach IA, recherche et textes : plus de mention des styles dessinés ni des six coachs ;
  - tout ce qui est retiré est rangé dans `backup CS/v1.37-ultra-realiste/` avec un `README.md` (liste et raison),
    plus les versions 1.36.0 des 20 fichiers dont du code a été retiré (`originaux-1.36.0/`) ;
  - les quatre modèles générés mesurés par les tests du moteur sont déplacés dans `tests/fixtures/modeles-generes/`
    (hors application) ; `testModelPath()` dans `src/test/skeleton.ts` les retrouve ;
  - `src/boot/assetSizes.json` régénéré : **78 fichiers, 62,5 Mo** au premier lancement (avant : 94 fichiers,
    100,4 Mo) ; dossier `dist/` : 140 → 68 Mo ; JavaScript : 2 952 → 2 808 Ko.
- **Mots restants « ink / encre / manga » (exceptions justifiées)** :
  - jetons CSS `--ink`, `--red-ink`… : couleurs de texte, sans rapport avec le rendu des coachs ;
  - couleurs `INK` des icônes de discipline, classe `danger-ink`, mot « unanime » de l'encyclopédie ;
  - valeurs `'encre'`, `'manga'`, `'precedent'` gardées dans les tests de migration (`settings-style.test.ts`,
    `coach-render.spec.ts`, `moteur-lumiere.spec.ts`) : elles existent vraiment dans les anciennes sauvegardes ;
  - historique : notes de versions anciennes (`releases.ts`), documents datés `docs/v0xx…`, ce journal.
- **Fichiers** : `src/three/CoachModel.tsx`, `CoachStage.tsx`, `StudioStage.tsx`, `photoMaterials.ts`,
  `src/three/human/profiles.ts`, `src/store/settings.ts`, `src/store/profile.ts`, `src/domain/coaches/` (catalog,
  looks, motion), `src/ui/screens/` (Settings, Onboarding, Home, Library, CoachSelect, BootScreen, Study),
  `src/ui/Lab.tsx`, `src/App.tsx`, `src/ui/nav/config.ts`, `src/ui/styles.css`, `src/coach/appGuide.ts`,
  `src/domain/search.ts`, `src/domain/releases.ts`, `src/boot/assetSizes.json`, `package.json`,
  `package-lock.json`, scripts de captures, `tools/generator/README.md` (nouveau), `README.md`, `CLAUDE.md`,
  `docs/HUMAN_CHARACTER_STANDARDS.md`, `docs/LICENCES.md`, `docs/ETAT.md`, `docs/NON_REGRESSION.md`,
  `backup CS/`, `tests/fixtures/modeles-generes/`.
- **Tests retirés (rangés dans `backup CS/`, ils ne testaient que ce qui est retiré)** :
  - `src/three/__tests__/customize.test.ts`, `groom.test.ts`, `models.test.ts` (personnalisation, cheveux en
    cartes et métadonnées du coach généré) ;
  - `src/engine/__tests__/makehuman-coaches.test.ts` (Axel et Kaila) ;
  - `tests/e2e/coach-studio.spec.ts` (écran « Mon combattant ») ;
  - dans `editor.test.ts`, les tests de génération aléatoire et de tatouages (le test de `normalizeLook` reste) ;
  - dans `outfit-v043.test.ts`, le bloc « gant » (gant sculpté du coach généré) ;
  - dans `deformation-v1100.test.ts`, le test « aisselles de Kaila ».
- **Tests modifiés (sans affaiblir ce qu'ils vérifient pour les coachs restants)** :
  - listes de coachs ramenées à quatre (Kadir, Amara, Naël, Inaya) dans les tests du moteur humain, du sol, de la
    respiration, des protège-tibias, des déformations, du réalisme et des compétences ;
  - `realisme-v1100` : « plus de deux reliefs de peau distincts » devient « plus d'un » (il ne reste que deux
    familles de peau) et le test vérifie maintenant que **chaque** coach reste sous 1,5 ;
  - `contract.test` : `LEGACY_DEGRADED` doit être vide et chaque profil `complet` ;
  - `settings-style.test`, `coach-render.spec`, `moteur-lumiere.spec` : vérifient la migration des anciennes
    sauvegardes (styles et version de rendu effacés, voix et coach gardés) ;
  - `coachs-v160.spec` : quatre coachs, profil avec Axel ou Kaila rouvert sur Kadir ou Amara, et nouveau test 1.37 :
    vignettes sur une ligne, de même largeur, et glisser vertical sans effet sur la caméra ;
  - `appGuide.test`, `preload.test`, `demarrage-v134`, `boot.spec`, `profil-v120`, `contrast`, `ecran-coach-v140` :
    Naël ou Inaya à la place d'Axel ou Kaila, plus d'entrée `/combattant` ;
  - `docs/audit-biomecanique/MESURES_SOL.md` régénéré : seules les colonnes et lignes d'Axel et Kaila disparaissent.
- **Tests** :
  - suite Vitest complète : 1269 TEST RÉUSSI, 1 ignoré, 8 ÉCHOUÉ ; ce sont exactement les 8 échecs déjà présents sur
    la 1.36.0 rejouée seule le même jour (moteur de frappe : `audit.test` document de mesures,
    `extension-v032` uppercut arrière, `fluidity` ×3, `hooks-biomeca` ×2, `torsion-range` document) ; aucun nouvel
    échec ;
  - compilation `npm run build` : TEST RÉUSSI ;
  - Playwright suite complète (293 tests, 55 min) : 286 TEST RÉUSSI, 2 ignorés (Firebase), 5 ÉCHOUÉ :
    - `aucune-perte-v100:180` cherchait le réglage retiré « Version du rendu 3D » : la ligne vérifie maintenant
      « Lumière du coach » dans la même section Affichage, rejoué : TEST RÉUSSI ;
    - `coach-suggest:207` et `consignes-v130:27` : échouent aussi sur la 1.36.0 rejouée seule le même jour (déjà
      présents, sans lien avec ce lot) ;
    - `coaching-hud:60` et `training-layout:117` : déjà connus (journal 1.35.0, échouent aussi sur la 1.33.2) ;
  - captures avant/après du choix du coach (360×640) : contrôle visuel fait ;
  - appareil Android réel : NON EXÉCUTÉ.
- **Captures** : `docs/v1370/captures/`.
- **Restauration** : branche `restauration/avant-ultra-realiste-v137` (1.36.0, commit 2343eee) ; tout le contenu
  retiré est aussi dans `backup CS/v1.37-ultra-realiste/`.


## v1.37.1 — 12/11/2026 — Première passe sur les vêtements

- **Runtime appliqué sur les GLB existants** : copies indépendantes des matériaux (évite les mutations entre coachs), rendu jersey/compression moins brillant et validation des os avant liaison d’une tenue.
- **Générateur Blender modifié** : simplification sélective plus faible (82 % de conservation sur les vêtements souples, contre 40 %), ourlets bas des rashguards découpés par iso-surface plane avec marge de coupe, 10 rangées et 64 segments pour les pans de veste, meilleur suivi du bassin dans le dos, volume légèrement augmenté des pantalons de gi.
- **À faire avant de déclarer les coupes corrigées sur le site** : régénérer les GLB des quatre coachs, inspecter les 28 tenues, exécuter la batterie de tests et publier les assets générés. Sans régénération des GLB, seule la partie runtime change l’image.
- **Non modifiés** : visages, corps, squelette moteur, trajectoires des techniques.


## v1.37.2 — 12/11/2026 — Géométrie MMA et chaîne de livraison

- Captures Inaya/Amara : bretelles et dessous de brassière irréguliers, ceinture surshort décollée, superposition cuissard/surshort et bordures triangulaires.
- `outfits.py` : hausse de la préservation du maillage pour les hauts `haut-crop` et `haut-carre` (auparavant exclus par le filtre `haut-rash-/haut-brassiere`), plus de lissage des poids des bretelles, moins de flare et suppression de la fente procédurale source de pointes du surshort, ceinture rapprochée de la peau en maintenant le dégagement du liner.
- Validation des **28 GLB** : `generatorVersion=1.37.2` inscrit dans les extras glTF, test imposant la présence de cette version dans chaque fichier. Sans régénération complète, la publication est bloquée.
- Le workflow Blender génère, teste et publie lui-même GitHub Pages pour ne plus dépendre d’un déclenchement ignoré après un push `GITHUB_TOKEN`.
- Reste à contrôler visuellement : tenue MMA d’Inaya et Amara, rotations 3/4, garde, low kick/high kick et flexions ; la géométrie ne sera déclarée corrigée qu’après revue des nouveaux GLB.


## v1.37.2 — correctif de référence des shorts MMA (12/11/2026)

- **Références validées et gelées** : le short MMA de Naël pour les hommes et celui d'Inaya pour les femmes. Ces deux GLB ne sont pas remplacés ; les tests et le script Blender vérifient leurs empreintes Git.
- **Adaptation individuelle** : Kadir et Amara conservent leurs propres morphologies et squelettes. Le générateur applique les proportions de coupe de la référence correspondante, sans copier des os ou des poids de peau d'un autre coach.
- **Kadir** : protection du maillage de l'entrejambe contre la fermeture automatique des petites boucles de bord et transition locale vers les poids du bassin pour éviter les longues pointes noires lorsque les jambes s'écartent. Naël n'est pas modifié.
- **Coupe féminine** : conserver la silhouette sportive d'Inaya, taille et hanches ajustées, cuissard intérieur près du corps et surshort souple ; les couleurs propres à Amara restent inchangées.
- **Livraison ciblée** : seuls les deux GLB MMA de Kadir et Amara sont régénérés. Les 28 tenues existantes restent couvertes par les tests de validité ; les tests de références empêchent tout remplacement accidentel de Naël/Inaya.
- **Validation visuelle restant nécessaire** : stance élargie de Kadir, déplacements, low kick, high kick, dos et profil. Tests automatiques ≠ contrôle d'aspect.


## v1.37.3 — 12/11/2026 — Rollback de la régression des shorts de Kadir

- **Constat confirmé** : les sept GLB de tenues de Kadir ont été régénérés depuis la v1.37.0, alors que son `photo.glb` est resté strictement identique. Les triangles noirs apparus à l’entrejambe touchent toutes ses tenues, pas seulement le MMA ; le correctif local précédent n’a pas suffi.
- **Stratégie sûre** : restaurer *exclusivement les sept tenues complètes de Kadir* (pas uniquement les morceaux de shorts, pour préserver la cohérence du squelette et des masques de peau) depuis le commit v1.37.0 `bcb49f9281` rapporté comme visuellement sain par l’utilisateur. Les coupes et matériaux 3D de Kadir reviennent temporairement à cette version ; le rendu runtime des tissus reste celui de la version actuelle.
- **Autres coachs non modifiés** : Naël et Inaya restent modèles de référence, Amara conserve ses vêtements existants, les quatre corps et le moteur de combat ne changent pas.
- **Garantie de publication** : script `restore-kadir-v1373.sh`, empreintes SHA exactes des sept GLB, mise à jour `assetSizes.json`, tests de version des 28 vêtements et test de non-régression spécifique ; publication Pages uniquement après compilation et tests réussis.
- **Limite** : contrôle visuel du short de Kadir (face, profil, dos, garde écartée, high kick) nécessaire après déploiement pour conclure sur le rendu.


## v1.37.4 — 12/11/2026 — Patron vestimentaire féminin Inaya → Amara

- **Référence validée** : les sept fichiers GLB originaux d'Inaya sont figés par SHA dans le script de génération et testés à l'octet près ; aucune copie brute de ces modèles vers Amara.
- **Source du changement** : dans `outfits.py`, `INAYA_TOP` était actif seulement pour `PALETTE=inaya` ; Amara conservait une autre brassière dans les disciplines de frappe. Les profils `SQ_IN`, `SQ_OUT`, `SQ_HIDE` et `SQ_EDGE` différaient aussi.
- **Correctif** : le patron crop-top carré d'Inaya est appliqué aux disciplines de frappe d'Amara ; largeur et placement des bretelles ajustés à la largeur des épaules d'Amara. Ses formes corporelles, ses poids d'animation, sa palette noir/or et les équipements de chaque discipline sont préservés.
- **Toutes les tenues** : régénération des sept GLB d'Amara (boxe, kickboxing, muaythai, MMA, BJJ, BJJ no-gi et judo) sur son propre `photo.glb`, sans modifier Inaya, Naël ni Kadir. Les coupes de bas déjà communes restent dans leur logique féminine ; pas de substitution arbitraire des matériaux.
- **Tests** : GLB 1.37.4 avec `clothingReference=inaya`, `clothingMorphology=mma-amara` ; vérification des crop-tops de frappe, des pièces MMA et des empreintes Inaya. Version `1.37.4` dans application et Nouveautés.
- **Validation restante** : inspection visuelle des détails aux épaules, à l'entrejambe, à la ceinture, de face, dos, garde, low kick et high kick. Aucun test automatisé ne garantit à lui seul l'absence de clipping.


## v1.37.5 — 12/11/2026 — Amara : ancien bikini incrusté, crop et ceinture

- **Audit Blender vérifié** (run GitHub Actions #43247741065) : Amara photo.glb contient dans les zones échantillonnées de décolleté, poitrine et nuque 64,4 %, 74,9 % et 33,1 % de textures très sombres ; Inaya nettoyée : 0 %. La tache noire ne vient donc pas seulement de l'épaisseur du crop-top bleu.
- **Retouche corporelle ciblée** : comparaison des atlas UV d'Amara et d'Inaya ; remise en couleur des pixels noirs uniquement sur les îlots anatomiques du torse et du bas du cou, avec calibration par les pixels de peau saine propres à Amara. Aucun transfert global du teint d'Inaya.
- **Intégrité 3D** : remplacement exclusif des images de couleur encodées dans photo.glb. L'ensemble des bufferViews géométriques, joints, skins, morph targets et animations est conservé bit à bit, contrôlé dans le script de reconstruction.
- **Crop** : débordement légèrement augmenté au-dessus du relief de l'ancien bikini, lissage des poids des bretelles d'Amara (sans modifier le patron original d'Inaya) et recouvrement des zones de bord.
- **Shorts** : les coupes du bandeau jaune d'Amara sont désormais projetées sur le plan de séparation des matières dans toutes les disciplines, pas uniquement MMA.
- **Livraison** : v1.37.5 package + lock + Nouveautés, sept nouveaux GLB d'Amara générés à partir de photo.glb corrigé, tests des 28 tenues, baseline Kadir restaurée, Inaya et Naël non modifiés, build + Pages seulement si contrôles réussis.
- **Validation visuelle** : décolleté frontal, bretelles, nuque, ceinture jaune de dos, garde/direct et changements de pose ; l'absence complète de relief de l'ancien bikini sculpté n'est pas démontrée par la seule retouche de texture.
