# Plan de non-régression

Règle : **améliorer sans casser**. Toute modification suit ce plan : état de référence, petits lots, tests après
chaque lot, point de restauration, rapport (TEST RÉUSSI / ÉCHOUÉ / NON EXÉCUTÉ / NON APPLICABLE).

## Points de restauration

| Nom | Commit | Contenu |
| --- | --- | --- |
| `restauration/ref-2026-10-17-v2` (branche GitHub) | `85dcebf` | V2 web publiée : état de référence avant les corrections UI/UX, thèmes et créateur 3D |

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
- Thème : menus sombres fixes, studio d’entraînement blanc ; pas de mode clair ni automatique.

### Non implémenté

- Reconnaissance vocale hors ligne, IA embarquée sur Android, ARCore natif, APK de publication.
- Expressions faciales, réglages des mains, pieds, avant-bras, mollets, oreilles, bouche ; annuler / rétablir dans
  l’éditeur ; archétypes de morphologie.

### Bugs connus au départ

- Signalé par Youssef : la génération aléatoire produit parfois des postures anormales (membres ou articulations mal placés).
- Signalé par Youssef : certains textes sont peu lisibles ou masqués par les couleurs.
- Cartes des disciplines : grand titre en filigrane coupé et superposé à l’image.
- Le geste retour du système ne déclenche pas la confirmation de l’éditeur.
- Gants de boxe et garde : le visage est caché dans la vue de face de l’éditeur.

## Matrice de non-régression

| Fonctionnalité | Vérification obligatoire | Tests automatiques | Contrôle visuel |
| --- | --- | --- | --- |
| Navigation | Tous les écrans restent accessibles | `app.spec` (5 onglets, réglages, confidentialité), `account.spec` | captures de tous les écrans |
| Créateur 3D | Toutes les personnalisations existantes fonctionnent | `customize.test`, `editor.test`, `coach-studio.spec` | rendus par onglet |
| Génération aléatoire | Personnages anatomiquement cohérents | `editor.test` (à compléter : 100 graines, bornes) | planche de 100 rendus |
| Sauvegarde | Personnages conservés après redémarrage | `coach-studio.spec`, `migration*.test` | – |
| Animations | Aucun mouvement détérioré | `engine.test`, `camera.test` (toutes techniques, deux coachs, deux gardes) | rendus Lab |
| Équipements | Positionnement correct | `customize.test` (zones, gants) | rendus par discipline |
| Mode clair | Tous les écrans lisibles | à créer (contraste axe-core) | captures mode clair |
| Mode sombre | Tous les écrans lisibles | à créer (contraste axe-core) | captures mode sombre |
| Mode automatique | Suit le système | à créer (`emulateMedia`) | – |
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
