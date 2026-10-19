# Plan de non-régression

Règle : **améliorer sans casser**. Toute modification suit ce plan : état de référence, petits lots, tests après
chaque lot, point de restauration, rapport (TEST RÉUSSI / ÉCHOUÉ / NON EXÉCUTÉ / NON APPLICABLE).

## Points de restauration

| Nom | Commit | Contenu |
| --- | --- | --- |
| `restauration/ref-2026-10-17-v2` (branche GitHub) | `85dcebf` | V2 web publiée : état de référence avant les corrections UI/UX, thèmes et créateur 3D |
| `restauration/lot-1` | v0.4.0 | Lisibilité des textes (WCAG AA) |
| `restauration/lot-2` | v0.5.0 | Thèmes clair, sombre et automatique |
| `restauration/lot-3` | v0.6.0 | Postures de la génération aléatoire |
| `restauration/lot-4a` | v0.7.0 | Caméra 3/4 par rapport au buste, cadrage serré, limites articulaires |
| `restauration/lot-4f` | v0.12.0 | Caméra Auto par technique, suit le coach après un pivot, « Auto » annule rotation et zoom, angles manuels exacts |
| `restauration/lot-4g` | v0.13.0 (non publiée) | Coach IA : questions suggérées par technique, défilement au doigt, flèches, pas d'envoi en glissant, clavier non ouvert automatiquement |
| `restauration/lot-5` | v0.13.0 | Illustration officielle par discipline depuis un référentiel central (10 écrans) ; BJJ et judo : techniques et parcours solo, fiches partenaire réel, badge de mode |
| `restauration/lot-5c` | v0.13.1 | Textes lisibles en sombre dans le lecteur d'artifact (couleur et police du thème sur body) |
| `restauration/lot-6a` | v0.14.0 | Style Encre par défaut ; relief anatomique cuit sur les 4 coachs (normal map conservée par les 3 styles) ; générateur dans `tools/generator` ; vignettes régénérées |
| `restauration/lot-6b` | v0.15.0 | Mode Analyse technique : phases mesurées sur l'animation, vitesse réelle puis ralenti, reprise d'une phase, surbrillance, voix, comparaison des gardes |
| `restauration/lot-6c` | v0.16.0 | Coups qui accélèrent jusqu'à l'impact, phase « Armé », registre des animations (7 contrôles), état de l'animation sur chaque fiche |
| `restauration/lot-7` | v0.17.0 | Audit biomécanique : équilibre sur un pied (20 animations), sprawl refait, 17 textes corrigés selon les sources, fiches pilotes, documents `docs/audit-biomecanique/` |
| `restauration/lot-8` | v0.18.0 | Silhouettes naturelles : musculature réduite et harmonieuse sur les 4 modèles, relief adouci, 150 vignettes régénérées, attente de caméra stable renforcée dans le test |
| `restauration/lot-9` | v0.19.0 | Bibliothèque d’icônes premium : composant central AppIcon, 6 icônes de discipline, palette officielle, favoris en cœur |
| `restauration/lot-4e` | v0.11.0 | Images des techniques sur les cartes (coach 3D choisi), changement de coach femme depuis l’entraînement |
| `restauration/lot-4d` | v0.10.0 | Repères au sol optionnels (pieds, orientation, avant/arrière, pivot, trajectoires) |
| `restauration/lot-4c` | v0.9.0 | Commandes hiérarchisées, zone Caméra regroupée (angle, rotation, zoom, recentrer), progression |
| `restauration/lot-4b` | v0.8.0 | Consigne principale et 3 à 5 points clés par technique, point de la phase en cours mis en évidence |

Les étiquettes Git (tags) ne passent pas par le proxy de l’environnement : chaque point de restauration est donc une
branche `restauration/...` sur GitHub. Retour arrière : `git checkout restauration/<nom>`.

Captures de référence : `/mnt/project-files/combat-shadow-studio/reference/<date>/` (17 écrans × 3 formats :
360×740, 412×915, 800×400), produites par `node scripts/dev/shot-screens.mjs <dossier> [url] [light|dark]`.

## État de référence (17 octobre 2026, V2)

### Opérationnel (couvert par des tests automatiques)

- 4 disciplines, exercices, programmes, créateur d’enchaînements, statistiques, historique.
- Coachs 3D manga homme et femme, 64 techniques animées, gardes orthodoxe et gaucher.
- Caméra pédagogique (angles par technique, modes manuels, libre 360°), mode Décomposer.
- Écran d’entraînement sans défilement (5 tailles, portrait et paysage, texte à 115 et 130 %).
- Créateur de combattant : corps, visage, peau, cheveux, barbe, tatouages (8 max), tenue, équipement, plusieurs
  combattants, duplication, suppression, combattant actif, apparence aléatoire, réparation des anciennes sauvegardes.
- Coach IA hors ligne (questions écrites), historique facultatif.
- Bibliothèque de 1 100 combinaisons, favoris, collections, import.
- Profils locaux par utilisateur, mode invité, export, suppression, chiffrement des limitations.
- Réalité augmentée WebXR (tests avec navigateur simulé uniquement).

### Partiel

- Réalité augmentée : jamais testée sur un appareil réel.
- Comptes Firebase et synchronisation : testés sur émulateurs, masqués sans projet configuré.
- Voix : dépend des voix installées ; saisie vocale uniquement en ligne et sur option.

### Non implémenté

- Reconnaissance vocale hors ligne, IA embarquée sur Android, ARCore natif, APK de publication.
- Expressions faciales, réglages des mains, pieds, avant-bras, mollets, oreilles, bouche ; annuler / rétablir dans
  l’éditeur ; archétypes de morphologie.

### Bugs connus au départ

- Signalé par Youssef : la génération aléatoire produit parfois des postures anormales (membres ou articulations mal placés).
  Cause trouvée au lot 3 : le squelette était reconstruit pendant l’animation (changement de longueur des jambes) et
  prenait la garde pour posture de repos ; chaque mouvement ajoutait alors la garde une seconde fois. Corrigé.
- Trouvé au lot 3, corrigé au lot 4 : coude trop fléchi (jusqu’à 172° entre bras et avant-bras, limite
  anatomique 150°) dans « genou circulaire avant » (coude gauche) et, pour la coach femme, « high kick arrière » en
  muay-thaï (coude droit). Présent avec le squelette de référence.
- Observé 2 fois sur une dizaine d’ouvertures, en développement et en rendu logiciel : une forme blanche géante
  (le short) au premier affichage de l’éditeur. Non reproduit depuis ; à surveiller.
- Signalé par Youssef : certains textes sont peu lisibles ou masqués par les couleurs.
- Cartes des disciplines : grand titre en filigrane coupé et superposé à l’image.
- Le geste retour du système ne déclenche pas la confirmation de l’éditeur.
- Gants de boxe et garde : le visage est caché dans la vue de face de l’éditeur.

## Matrice de non-régression

| Fonctionnalité | Vérification obligatoire | Tests automatiques | Contrôle visuel |
| --- | --- | --- | --- |
| Navigation | Tous les écrans restent accessibles | `app.spec` (5 onglets, réglages, confidentialité), `account.spec` | captures de tous les écrans |
| Créateur 3D | Toutes les personnalisations existantes fonctionnent | `customize.test`, `editor.test`, `coach-studio.spec` | rendus par onglet |
| Génération aléatoire | Personnages anatomiquement cohérents | `editor.test` (100 graines par sexe, archétypes, curseurs aux limites), `pose.test` (posture de référence, jambes aux limites dans toutes les animations) | planche de rendus aléatoires |
| Sauvegarde | Personnages conservés après redémarrage | `coach-studio.spec`, `migration*.test` | – |
| Animations | Aucun mouvement détérioré, aucune articulation au-delà de son amplitude | `engine.test` (dont biomécanique : coudes ≤ 150°, genoux ≤ 155°), `camera.test` (toutes techniques, deux coachs, deux gardes) | rendus Lab |
| Consignes | Une consigne et 3 à 5 points clés (appuis, bassin, membres, garde) par technique, valables dans les deux gardes | `instructions.test` (64 techniques, Jab mot pour mot, phases), `engine.test` (phase jouée) | captures entraînement |
| Commandes et zone Caméra | Lecture, précédent, suivant, coach ; Décomposer, Comment faire, Ralenti ; zone Caméra sans masquer le coach | `training-layout.spec` (zone Caméra sur 5 tailles, consigne, ralenti, ligne de temps) | captures entraînement |
| Caméra Auto et manuelle | Angle par technique, pas de vue de haut sur les coups, suivi du coach après pivot, retour Auto complet, angle manuel exact | `camera.test` (stepViews, viewName), `training-layout.spec` (caméra ×2, zone Caméra) | mesure de la caméra pendant « Pivots et angles » |
| Images des cartes | Une image par technique et par coach (homme, femme), coach actif affiché, images chargées | `thumbs.test`, `app.spec` (images) | captures bibliothèque, discipline, programmes, champions |
| Coach femme à l’entraînement | Options > Coach femme affiche la coach, retour au coach homme | `training-layout.spec` (changer de coach) | capture entraînement |
| Repères au sol | Désactivés par défaut, chacun s’active seul, légende, choix mémorisé | `settings.test`, `engine.test` (mouvement joué), `training-layout.spec` (repères) | captures entraînement |
| Caméra et cadrage | Angle 3/4 du buste, corps entier jamais coupé, coach grand | `camera.test` (cadre, remplissage, Jab 3/4 dans chaque discipline) | captures entraînement |
| Équipements | Positionnement correct | `customize.test` (zones, gants) | rendus par discipline |
| Mode clair | Tous les écrans lisibles | `contrast.spec` (17 écrans, système clair), `theme.spec` | captures mode clair |
| Mode sombre | Tous les écrans lisibles | `contrast.spec` (17 écrans, système sombre, états), `theme.spec` | captures mode sombre |
| Mode automatique | Suit le système en direct, choix manuel prioritaire, pas de flash | `theme.spec`, `theme.test` | – |
| Consignes | Toujours visibles pendant l’entraînement | `training-layout.spec` | captures entraînement |
| Points clés | Visibles et lisibles | `training-layout.spec` | captures entraînement |
| Commandes | Aucun bouton inaccessible | `training-layout.spec`, `app.spec` | – |
| Responsive | Aucun chevauchement ni débordement | `training-layout.spec`, `coach-studio.spec` | 3 formats |
| Données utilisateur | Aucune perte | `migration*.test`, `store.test`, `account.spec` | – |
| Performances | Pas de dégradation non justifiée | taille des fichiers du build | – |
| Coach IA | Réponses hors ligne, pause, ralenti | `coach.test`, `training-layout.spec` | – |
| Réalité augmentée | Démarrage, refus, arrêt caméra | `ar.test` | non applicable sans appareil |

Commandes : `npx tsc -b`, `npx vitest run`, `npx vite build` puis
`CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npx playwright test`.
