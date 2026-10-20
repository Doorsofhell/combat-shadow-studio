# Inventaire des icônes

Généré par `node scripts/icon-inventory.mjs` à partir du code : chaque icône du registre (`src/ui/icons/registry.ts`) et chaque endroit où elle est affichée. « Aucun » veut dire que l’icône est dessinée et prête, mais qu’aucun écran ne l’utilise encore (fonction absente de l’application, ou réservée).

## Disciplines (`DisciplineIcon`, 6 icônes)

Boxe anglaise : gant de boxe · Kick-boxing : protège-tibia · MMA : gant à doigts ouverts · Muay-thaï : mongkol · Jiu-jitsu brésilien : ceinture noire à barrette rouge · Judo : judogi et ceinture noire.

Emplacements (10) : components/Cards.tsx:16, components/DisciplineArtwork.tsx:76, screens/Builder.tsx:56, screens/Champions.tsx:999, screens/Discipline.tsx:84, screens/Home.tsx:124, screens/Library.tsx:67, screens/Train.tsx:65, screens/progress/Dashboard.tsx:171, screens/progress/Dashboard.tsx:588

## Navigation (7)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `home` | Accueil | App.tsx:98 |
| `train` | Entraîner | App.tsx:99, screens/Onboarding.tsx:136, screens/account/Profile.tsx:277 |
| `techniques` | Techniques | App.tsx:100, screens/Library.tsx:31, screens/Library.tsx:381 |
| `coach` | Coach | coach-ai/CoachBubble.tsx:69 |
| `coachAi` | Coach IA | screens/Training.tsx:568, screens/account/Profile.tsx:422 |
| `progress` | Progression | App.tsx:101, screens/Onboarding.tsx:142 |
| `legends` | Légendes | App.tsx:103, screens/Champions.tsx:167, screens/Library.tsx:33, screens/Library.tsx:150 |

## Accès rapides et menus secondaires (14)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `programs` | Programmes | screens/Home.tsx:253, screens/Library.tsx:36, screens/Library.tsx:219 |
| `combos` | Enchaînements | screens/Library.tsx:32 |
| `challenges` | Défis (réservé, aucun écran) | Aucun |
| `favorite` | Favori | components/Cards.tsx:77, components/Cards.tsx:95, screens/Champions.tsx:71, screens/Champions.tsx:163, screens/Discipline.tsx:42, screens/Discipline.tsx:167, screens/Library.tsx:35, screens/Library.tsx:283 |
| `favoriteOutline` | Ajouter aux favoris | screens/Champions.tsx:71, screens/Discipline.tsx:167, screens/Library.tsx:283 |
| `history` | Historique | screens/Champions.tsx:164, screens/Home.tsx:193, screens/progress/Dashboard.tsx:156 |
| `search` | Recherche | screens/Champions.tsx:162 |
| `filters` | Filtres | screens/Champions.tsx:277, screens/progress/Dashboard.tsx:152 |
| `collection` | Collection | screens/Champions.tsx:166 |
| `library` | Bibliothèque | Aucun |
| `calendar` | Séances, objectifs | screens/progress/Dashboard.tsx:192 |
| `compose` | Créer un enchaînement | screens/Library.tsx:34, screens/Library.tsx:160, screens/Library.tsx:220 |
| `trophy` | Légendes du combat (distinction) | Aucun |
| `dumbbell` | Exercice | Aucun |

## Compte et réglages (18)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `profile` | Profil | screens/Home.tsx:96, screens/Settings.tsx:198, screens/account/Profile.tsx:173, screens/account/Profile.tsx:175, screens/account/SignIn.tsx:194 |
| `settings` | Réglages | screens/CoachHistory.tsx:31, screens/Home.tsx:99, screens/Settings.tsx:238, screens/Training.tsx:539 |
| `notifications` | Notifications (réservé, aucun écran) | Aucun |
| `download` | Télécharger, exporter | screens/Settings.tsx:171, screens/Settings.tsx:254, screens/account/Profile.tsx:456 |
| `upload` | Importer | screens/Champions.tsx:168, screens/Settings.tsx:174 |
| `subscription` | Abonnement (réservé, aucun écran) | Aucun |
| `help` | Aide | Aucun |
| `accessibility` | Accessibilité | screens/account/Profile.tsx:406 |
| `language` | Langue | Aucun |
| `audio` | Voix et sons | screens/Settings.tsx:240 |
| `mute` | Son coupé | Aucun |
| `display` | Affichage 3D | screens/Settings.tsx:242 |
| `theme` | Apparence | screens/Settings.tsx:220 |
| `offline` | Hors ligne | Aucun |
| `privacy` | Confidentialité | screens/Onboarding.tsx:148, screens/Privacy.tsx:11, screens/Settings.tsx:166, screens/Settings.tsx:253, screens/Settings.tsx:255, screens/account/Profile.tsx:429, screens/account/Profile.tsx:452, screens/account/SignIn.tsx:208 |
| `textSize` | Taille du texte | Aucun |
| `signOut` | Se déconnecter | screens/account/Profile.tsx:224 |
| `fighter` | Mon combattant | screens/Onboarding.tsx:364, screens/Settings.tsx:239, screens/account/Profile.tsx:78, screens/account/Profile.tsx:272 |

## Commandes d’entraînement (23)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `play` | Lecture | components/Playback.tsx:11, screens/Builder.tsx:120, screens/Builder.tsx:142, screens/Champions.tsx:845, screens/Discipline.tsx:146, screens/Home.tsx:143, screens/Home.tsx:155, screens/Programs.tsx:110, screens/Training.tsx:552, screens/Training.tsx:556, screens/Training.tsx:610, screens/Training.tsx:614, screens/coach/Preview.tsx:254, training/Study.tsx:194 |
| `pause` | Pause | components/Playback.tsx:11, screens/Training.tsx:560, screens/Training.tsx:618, screens/coach/Preview.tsx:254, training/Study.tsx:190 |
| `stop` | Arrêt | Aucun |
| `replay` | Recommencer | screens/Training.tsx:545 |
| `repeat` | Répétition en boucle | screens/Settings.tsx:241 |
| `slow` | Ralenti | screens/Training.tsx:535 |
| `speed` | Vitesse normale | Aucun |
| `forward` | Avance | Aucun |
| `stepBack` | Précédent | screens/Training.tsx:548, screens/Training.tsx:605, training/Study.tsx:178 |
| `stepForward` | Suivant | screens/Training.tsx:564, screens/Training.tsx:623, training/Study.tsx:199 |
| `decompose` | Décomposer le mouvement | screens/Champions.tsx:849, screens/Training.tsx:519 |
| `fullscreen` | Plein écran | screens/Training.tsx:370 |
| `camera` | Caméra | screens/Training.tsx:351 |
| `rotateLeft` | Tourner à gauche | screens/Training.tsx:496 |
| `rotateRight` | Tourner à droite | screens/Training.tsx:499 |
| `zoomIn` | Zoomer | screens/Training.tsx:505 |
| `zoomOut` | Dézoomer | screens/Training.tsx:502 |
| `hideUi` | Masquer l’interface | Aucun |
| `showUi` | Afficher l’interface | Aucun |
| `ar` | Réalité augmentée | screens/Training.tsx:312 |
| `target` | Recentrer, objectif | screens/Stats.tsx:40, screens/Training.tsx:508, screens/progress/Dashboard.tsx:143 |
| `mic` | Dicter | coach-ai/CoachAskPanel.tsx:229 |
| `send` | Envoyer | coach-ai/CoachAskPanel.tsx:233 |

## Actions (20)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `add` | Ajouter, créer | screens/Champions.tsx:470, screens/Champions.tsx:856, screens/Discipline.tsx:108, screens/Programs.tsx:42, screens/Train.tsx:100, screens/coach/FighterPanel.tsx:86, screens/coach/panels.tsx:216 |
| `edit` | Modifier | screens/Builder.tsx:139, screens/Settings.tsx:217 |
| `duplicate` | Dupliquer | screens/Champions.tsx:824, screens/Champions.tsx:852, screens/coach/FighterPanel.tsx:59 |
| `delete` | Supprimer | screens/Builder.tsx:145, screens/Champions.tsx:509, screens/Champions.tsx:642, screens/CoachHistory.tsx:74, screens/Settings.tsx:186, screens/account/Profile.tsx:461, screens/coach/FighterPanel.tsx:66, screens/coach/panels.tsx:251, screens/coach/panels.tsx:296 |
| `share` | Partager (réservé, aucune fonction) | Aucun |
| `save` | Enregistrer | screens/Builder.tsx:117 |
| `sync` | Synchroniser | screens/account/Profile.tsx:443 |
| `link` | Lien | Aucun |
| `details` | Détails | screens/Champions.tsx:165, screens/Settings.tsx:244, screens/account/Profile.tsx:232 |
| `info` | Informations, comment faire | screens/Training.tsx:531 |
| `back` | Retour | coach-ai/SuggestRail.tsx:90, components/PageHead.tsx:17, screens/Training.tsx:300, screens/Training.tsx:484 |
| `chevron` | Ouvrir | coach-ai/SuggestRail.tsx:108, components/Cards.tsx:100, components/Cards.tsx:132, components/SettingsPanel.tsx:40, screens/Champions.tsx:865, screens/Home.tsx:164, screens/Home.tsx:221, screens/Home.tsx:243, screens/Home.tsx:269, screens/Library.tsx:175, screens/Library.tsx:229, screens/Programs.tsx:37, screens/Settings.tsx:249, screens/Train.tsx:42, screens/Train.tsx:80, screens/Train.tsx:115, screens/Training.tsx:490, screens/progress/Dashboard.tsx:605 |
| `chevronDown` | Déplier | Aucun |
| `close` | Fermer | coach-ai/CoachAskPanel.tsx:145, coach-ai/CoachAskPanel.tsx:184, coach-ai/CoachBubble.tsx:69, components/KickboxingStyle.tsx:57, components/Sheet.tsx:49, screens/Builder.tsx:67, screens/Training.tsx:512 |
| `confirm` | Confirmer | Aucun |
| `cancel` | Annuler | Aucun |
| `minus` | Retirer | components/KickboxingStyle.tsx:58, screens/Champions.tsx:520 |
| `grid` | Vue grille | Aucun |
| `list` | Vue liste | Aucun |
| `compare` | Comparer | Aucun |

## Statuts et niveaux (18)

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
| `check` | Fait, sélectionné | components/KickboxingStyle.tsx:55, components/KickboxingStyle.tsx:56, components/Toast.tsx:28, screens/CoachSelect.tsx:34, screens/coach/FighterPanel.tsx:47 |
| `mastered` | Technique assimilée | components/Playback.tsx:61, screens/progress/Dashboard.tsx:736 |
| `struggling` | Encore du mal, à revoir | components/Playback.tsx:61, screens/progress/Dashboard.tsx:740, screens/progress/Dashboard.tsx:754 |
| `star` | Étoile vide | Aucun |
| `starFilled` | Étoile pleine | Aucun |
| `flame` | Série | Aucun |
| `bolt` | Intensité | Aucun |
| `shield` | Protection, sécurité | screens/account/Profile.tsx:374 |
| `wrench` | À corriger | Aucun |
| `trend` | Progression guidée | Aucun |

**Total** : 100 icônes d’interface dont 65 affichées, et 6 icônes de discipline affichées à 10 endroits.
