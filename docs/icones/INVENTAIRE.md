# Inventaire des icônes

Généré par `node scripts/icon-inventory.mjs` à partir du code : chaque icône du registre (`src/ui/icons/registry.ts`) et chaque endroit où elle est affichée. « Aucun » veut dire que l’icône est dessinée et prête, mais qu’aucun écran ne l’utilise encore (fonction absente de l’application, ou réservée).

## Disciplines (`DisciplineIcon`, 6 icônes)

Boxe anglaise : gant de boxe · Kick-boxing : protège-tibia · MMA : gant à doigts ouverts · Muay-thaï : mongkol · Jiu-jitsu brésilien : ceinture noire à barrette rouge · Judo : judogi et ceinture noire.

Emplacements (10) : components/Cards.tsx:15, components/DisciplineArtwork.tsx:76, screens/Builder.tsx:54, screens/Champions.tsx:999, screens/Discipline.tsx:82, screens/Home.tsx:121, screens/Library.tsx:65, screens/Stats.tsx:173, screens/Stats.tsx:202, screens/Train.tsx:65

## Navigation (7)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `home` | Accueil | App.tsx:96 |
| `train` | Entraîner | App.tsx:97, screens/Onboarding.tsx:129, screens/account/Profile.tsx:277 |
| `techniques` | Techniques | App.tsx:98, screens/Library.tsx:29, screens/Library.tsx:355 |
| `coach` | Coach | App.tsx:99 |
| `coachAi` | Coach IA | screens/Training.tsx:561, screens/account/Profile.tsx:422 |
| `progress` | Progression | App.tsx:100, screens/Onboarding.tsx:135 |
| `legends` | Légendes | screens/Champions.tsx:167, screens/Library.tsx:31, screens/Library.tsx:127 |

## Accès rapides et menus secondaires (14)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `programs` | Programmes | screens/Home.tsx:250, screens/Library.tsx:34, screens/Library.tsx:196 |
| `combos` | Enchaînements | screens/Library.tsx:30 |
| `challenges` | Défis (réservé, aucun écran) | Aucun |
| `favorite` | Favori | components/Cards.tsx:76, screens/Champions.tsx:71, screens/Champions.tsx:163, screens/Discipline.tsx:41, screens/Discipline.tsx:164, screens/Library.tsx:33, screens/Library.tsx:259 |
| `favoriteOutline` | Ajouter aux favoris | screens/Champions.tsx:71, screens/Discipline.tsx:164, screens/Library.tsx:259 |
| `history` | Historique | screens/Champions.tsx:164, screens/Home.tsx:190, screens/Stats.tsx:165 |
| `search` | Recherche | screens/Champions.tsx:162 |
| `filters` | Filtres | screens/Champions.tsx:277 |
| `collection` | Collection | screens/Champions.tsx:166 |
| `library` | Bibliothèque | Aucun |
| `calendar` | Séances, objectifs | Aucun |
| `compose` | Créer un enchaînement | screens/Library.tsx:32, screens/Library.tsx:137, screens/Library.tsx:197 |
| `trophy` | Légendes du combat (distinction) | Aucun |
| `dumbbell` | Exercice | Aucun |

## Compte et réglages (18)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `profile` | Profil | screens/Home.tsx:93, screens/Settings.tsx:89, screens/Settings.tsx:90, screens/account/Profile.tsx:173, screens/account/Profile.tsx:175, screens/account/SignIn.tsx:194 |
| `settings` | Réglages | screens/CoachHistory.tsx:31, screens/Home.tsx:96, screens/Training.tsx:532 |
| `notifications` | Notifications (réservé, aucun écran) | Aucun |
| `download` | Télécharger, exporter | screens/Settings.tsx:188, screens/account/Profile.tsx:456 |
| `upload` | Importer | screens/Champions.tsx:168, screens/Settings.tsx:191 |
| `subscription` | Abonnement (réservé, aucun écran) | Aucun |
| `help` | Aide | Aucun |
| `accessibility` | Accessibilité | screens/account/Profile.tsx:406 |
| `language` | Langue | Aucun |
| `audio` | Voix et sons | screens/Settings.tsx:113 |
| `mute` | Son coupé | Aucun |
| `display` | Affichage 3D | screens/Settings.tsx:134 |
| `theme` | Apparence | screens/Settings.tsx:74 |
| `offline` | Hors ligne | Aucun |
| `privacy` | Confidentialité | screens/Onboarding.tsx:141, screens/Privacy.tsx:11, screens/Settings.tsx:182, screens/Settings.tsx:183, screens/account/Profile.tsx:429, screens/account/Profile.tsx:452, screens/account/SignIn.tsx:208 |
| `textSize` | Taille du texte | Aucun |
| `signOut` | Se déconnecter | screens/account/Profile.tsx:224 |
| `fighter` | Mon combattant | screens/Onboarding.tsx:357, screens/Settings.tsx:91, screens/account/Profile.tsx:78, screens/account/Profile.tsx:272 |

## Commandes d’entraînement (23)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `play` | Lecture | components/Playback.tsx:9, screens/Builder.tsx:117, screens/Builder.tsx:139, screens/Champions.tsx:845, screens/Discipline.tsx:143, screens/Home.tsx:140, screens/Home.tsx:152, screens/Programs.tsx:110, screens/Training.tsx:545, screens/Training.tsx:549, screens/Training.tsx:603, screens/Training.tsx:607, screens/coach/Preview.tsx:195, training/Study.tsx:194 |
| `pause` | Pause | components/Playback.tsx:9, screens/Training.tsx:553, screens/Training.tsx:611, screens/coach/Preview.tsx:195, training/Study.tsx:190 |
| `stop` | Arrêt | Aucun |
| `replay` | Recommencer | screens/Training.tsx:538 |
| `repeat` | Répétition en boucle | screens/Settings.tsx:173 |
| `slow` | Ralenti | screens/Training.tsx:528 |
| `speed` | Vitesse normale | Aucun |
| `forward` | Avance | Aucun |
| `stepBack` | Précédent | screens/Training.tsx:541, screens/Training.tsx:598, training/Study.tsx:178 |
| `stepForward` | Suivant | screens/Training.tsx:557, screens/Training.tsx:616, training/Study.tsx:199 |
| `decompose` | Décomposer le mouvement | screens/Champions.tsx:849, screens/Training.tsx:512 |
| `fullscreen` | Plein écran | screens/Training.tsx:363 |
| `camera` | Caméra | screens/Training.tsx:344 |
| `rotateLeft` | Tourner à gauche | screens/Training.tsx:489 |
| `rotateRight` | Tourner à droite | screens/Training.tsx:492 |
| `zoomIn` | Zoomer | screens/Training.tsx:498 |
| `zoomOut` | Dézoomer | screens/Training.tsx:495 |
| `hideUi` | Masquer l’interface | Aucun |
| `showUi` | Afficher l’interface | Aucun |
| `ar` | Réalité augmentée | screens/Training.tsx:306 |
| `target` | Recentrer, objectif | screens/Stats.tsx:90, screens/Training.tsx:501 |
| `mic` | Dicter | coach-ai/CoachAskPanel.tsx:229 |
| `send` | Envoyer | coach-ai/CoachAskPanel.tsx:233 |

## Actions (20)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `add` | Ajouter, créer | screens/Champions.tsx:470, screens/Champions.tsx:856, screens/Discipline.tsx:105, screens/Programs.tsx:42, screens/Train.tsx:94, screens/coach/FighterPanel.tsx:80, screens/coach/panels.tsx:216 |
| `edit` | Modifier | screens/Builder.tsx:136 |
| `duplicate` | Dupliquer | screens/Champions.tsx:824, screens/Champions.tsx:852, screens/coach/FighterPanel.tsx:58 |
| `delete` | Supprimer | screens/Builder.tsx:142, screens/Champions.tsx:509, screens/Champions.tsx:642, screens/CoachHistory.tsx:74, screens/Settings.tsx:203, screens/account/Profile.tsx:461, screens/coach/FighterPanel.tsx:65, screens/coach/panels.tsx:251, screens/coach/panels.tsx:296 |
| `share` | Partager (réservé, aucune fonction) | Aucun |
| `save` | Enregistrer | screens/Builder.tsx:114 |
| `sync` | Synchroniser | screens/account/Profile.tsx:443 |
| `link` | Lien | Aucun |
| `details` | Détails | screens/Champions.tsx:165, screens/account/Profile.tsx:232 |
| `info` | Informations, comment faire | screens/Settings.tsx:208, screens/Training.tsx:524 |
| `back` | Retour | coach-ai/SuggestRail.tsx:90, components/PageHead.tsx:17, screens/Training.tsx:294, screens/Training.tsx:477 |
| `chevron` | Ouvrir | coach-ai/SuggestRail.tsx:108, components/Cards.tsx:81, components/Cards.tsx:113, components/SettingsPanel.tsx:40, screens/Champions.tsx:865, screens/Home.tsx:161, screens/Home.tsx:218, screens/Home.tsx:240, screens/Home.tsx:274, screens/Library.tsx:152, screens/Library.tsx:206, screens/Programs.tsx:37, screens/Train.tsx:42, screens/Train.tsx:79, screens/Train.tsx:109, screens/Training.tsx:483 |
| `chevronDown` | Déplier | Aucun |
| `close` | Fermer | coach-ai/CoachAskPanel.tsx:145, coach-ai/CoachAskPanel.tsx:184, components/Sheet.tsx:49, screens/Builder.tsx:64, screens/Training.tsx:505 |
| `confirm` | Confirmer | Aucun |
| `cancel` | Annuler | Aucun |
| `minus` | Retirer | screens/Champions.tsx:520 |
| `grid` | Vue grille | Aucun |
| `list` | Vue liste | Aucun |
| `compare` | Comparer | Aucun |

## Statuts et niveaux (16)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `verified` | Vérifiée | screens/Champions.tsx:26 |
| `adapted` | Adaptée | screens/Champions.tsx:26 |
| `inspired` | Inspirée | screens/Champions.tsx:26 |
| `pending` | À valider | Aucun |
| `free` | Gratuit (réservé) | Aucun |
| `premium` | Premium (réservé) | Aucun |
| `locked` | Verrouillé (réservé) | Aucun |
| `downloaded` | Téléchargé (réservé) | Aucun |
| `check` | Fait, sélectionné | components/Toast.tsx:28, screens/CoachSelect.tsx:30, screens/coach/FighterPanel.tsx:46 |
| `star` | Étoile vide | Aucun |
| `starFilled` | Étoile pleine | Aucun |
| `flame` | Série | Aucun |
| `bolt` | Intensité | Aucun |
| `shield` | Protection, sécurité | screens/account/Profile.tsx:374 |
| `wrench` | À corriger | Aucun |
| `trend` | Progression guidée | Aucun |

**Total** : 98 icônes d’interface dont 62 affichées, et 6 icônes de discipline affichées à 10 endroits.
