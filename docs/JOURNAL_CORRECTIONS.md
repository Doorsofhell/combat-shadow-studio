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
